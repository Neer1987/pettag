export type PetMediaItem = {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  caption?: string;
};

export const MAX_PET_MEDIA = 8;

export function createMediaItem(
  uri: string,
  type: 'photo' | 'video',
  caption?: string,
): PetMediaItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    uri,
    type,
    caption: caption?.trim() || undefined,
  };
}

export function slugifyPetName(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 6)}`;
}

export function speciesEmoji(species: string): string {
  const key = species.toLowerCase();
  if (key.includes('dog')) return '🐕';
  if (key.includes('cat')) return '🐈';
  if (key.includes('horse')) return '🐴';
  if (key.includes('rabbit')) return '🐰';
  return '🐾';
}

export function buildGalleryPhotos(coverUri: string | null, media: PetMediaItem[]): string[] {
  const photoUris = media.filter((m) => m.type === 'photo').map((m) => m.uri);
  if (coverUri && !photoUris.includes(coverUri)) {
    return [coverUri, ...photoUris];
  }
  if (photoUris.length > 0) return photoUris;
  return coverUri ? [coverUri] : [];
}

export type GallerySlide = {
  uri: string;
  caption?: string;
};

export function buildGallerySlides(coverUri: string | null, media: PetMediaItem[]): GallerySlide[] {
  return buildGalleryPhotos(coverUri, media).map((uri) => {
    const match = media.find((item) => item.type === 'photo' && item.uri === uri);
    return { uri, caption: match?.caption };
  });
}
