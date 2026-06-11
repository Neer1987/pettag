import { decode } from 'base64-arraybuffer';
import {
  cacheDirectory,
  copyAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { PetProfile } from '@/contexts/user-context';
import type { PetMediaItem } from '@/lib/pet-media';
import { getSupabase } from '@/lib/supabase/client';

export const PET_MEDIA_BUCKET = 'pet-media';

function isRemoteUri(uri: string) {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

async function ensureReadableFileUri(uri: string): Promise<string> {
  if (Platform.OS === 'web' || uri.startsWith('file://')) {
    return uri;
  }

  if (uri.startsWith('content://') || uri.startsWith('ph://') || uri.startsWith('assets-library://')) {
    const dest = `${cacheDirectory}pet-upload-${Date.now()}.jpg`;
    await copyAsync({ from: uri, to: dest });
    return dest;
  }

  return uri;
}

function guessExtension(uri: string, type: 'photo' | 'video') {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'png';
  if (lower.includes('.webp')) return 'webp';
  if (lower.includes('.gif')) return 'gif';
  if (lower.includes('.mov')) return 'mov';
  if (lower.includes('.mp4')) return 'mp4';
  return type === 'video' ? 'mp4' : 'jpg';
}

function guessContentType(uri: string, type: 'photo' | 'video') {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.mov')) return 'video/quicktime';
  if (lower.includes('.mp4')) return 'video/mp4';
  return type === 'video' ? 'video/mp4' : 'image/jpeg';
}

async function readUriAsArrayBuffer(
  uri: string,
  type: 'photo' | 'video',
): Promise<{ data: ArrayBuffer; contentType: string }> {
  const contentType = guessContentType(uri, type);

  if (isRemoteUri(uri)) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to read media file (${response.status})`);
    }
    return {
      data: await response.arrayBuffer(),
      contentType: response.headers.get('content-type') || contentType,
    };
  }

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to read media file (${response.status})`);
    }
    return {
      data: await response.arrayBuffer(),
      contentType: response.headers.get('content-type') || contentType,
    };
  }

  const readableUri = await ensureReadableFileUri(uri);
  const base64 = await readAsStringAsync(readableUri, { encoding: EncodingType.Base64 });
  return { data: decode(base64), contentType };
}

export async function uploadLocalMediaUri(
  ownerId: string,
  petQrCodeId: string,
  uri: string,
  type: 'photo' | 'video',
  mediaId?: string,
): Promise<string> {
  if (isRemoteUri(uri)) return uri;

  const supabase = getSupabase();
  const ext = guessExtension(uri, type);
  const fileName = `${mediaId ?? Date.now()}.${ext}`;
  const path = `${ownerId}/${petQrCodeId}/${fileName}`;
  const { data, contentType } = await readUriAsArrayBuffer(uri, type);

  const { data: uploaded, error } = await supabase.storage.from(PET_MEDIA_BUCKET).upload(path, data, {
    contentType,
    upsert: true,
  });

  if (error) throw error;

  const { data: publicData } = supabase.storage.from(PET_MEDIA_BUCKET).getPublicUrl(uploaded.path);
  return publicData.publicUrl;
}

export async function uploadPetProfileMedia(
  ownerId: string,
  pet: PetProfile,
): Promise<PetProfile> {
  const uploadCache = new Map<string, string>();

  async function resolveUri(
    uri: string,
    itemType: 'photo' | 'video',
    fileKey: string,
  ): Promise<string> {
    if (isRemoteUri(uri)) return uri;
    const cached = uploadCache.get(uri);
    if (cached) return cached;

    const remote = await uploadLocalMediaUri(ownerId, pet.qrCodeId, uri, itemType, fileKey);
    uploadCache.set(uri, remote);
    return remote;
  }

  let coverPhotoUri = pet.coverPhotoUri;
  if (coverPhotoUri) {
    coverPhotoUri = await resolveUri(coverPhotoUri, 'photo', 'cover');
  }

  const media: PetMediaItem[] = [];
  for (const item of pet.media) {
    const remoteUri = await resolveUri(item.uri, item.type, item.id);
    media.push({ ...item, uri: remoteUri });
  }

  return { ...pet, coverPhotoUri, media };
}

export async function uploadPetsMedia(ownerId: string, pets: PetProfile[]): Promise<PetProfile[]> {
  const uploaded: PetProfile[] = [];
  for (const pet of pets) {
    uploaded.push(await uploadPetProfileMedia(ownerId, pet));
  }
  return uploaded;
}

export async function deleteOwnerStorage(ownerId: string) {
  const supabase = getSupabase();
  const paths: string[] = [];

  const { data: petFolders, error: listError } = await supabase.storage
    .from(PET_MEDIA_BUCKET)
    .list(ownerId, { limit: 1000 });

  if (listError) throw listError;

  for (const folder of petFolders ?? []) {
    const folderPath = `${ownerId}/${folder.name}`;
    const { data: files, error: filesError } = await supabase.storage
      .from(PET_MEDIA_BUCKET)
      .list(folderPath, { limit: 1000 });

    if (filesError) throw filesError;

    for (const file of files ?? []) {
      paths.push(`${folderPath}/${file.name}`);
    }
  }

  if (paths.length === 0) return;

  const { error: removeError } = await supabase.storage.from(PET_MEDIA_BUCKET).remove(paths);
  if (removeError) throw removeError;
}
