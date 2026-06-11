import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MediaCaptionModal } from '@/components/media-caption-modal';
import { Colors, Fonts } from '@/constants/theme';
import { buildGalleryPhotos, MAX_PET_MEDIA, type PetMediaItem } from '@/lib/pet-media';
import { pickImageFromCamera, pickImageFromLibrary, showMediaSourcePicker } from '@/lib/pick-image';

type PetMediaGalleryProps = {
  media: PetMediaItem[];
  coverUri: string | null;
  petName?: string;
  onAdd: (uri: string, caption?: string) => boolean | Promise<boolean>;
  onUpdateCaption: (id: string, caption: string) => void;
  onRemove: (id: string) => void;
  onSetCover: (uri: string) => void;
  onLimitReached: () => void;
  onPhotoPress?: (index: number) => void;
};

export function PetMediaGallery({
  media,
  coverUri,
  petName,
  onAdd,
  onUpdateCaption,
  onRemove,
  onSetCover,
  onLimitReached,
  onPhotoPress,
}: PetMediaGalleryProps) {
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PetMediaItem | null>(null);

  const photos = media.filter((m) => m.type === 'photo');
  const galleryPhotos = buildGalleryPhotos(coverUri, media);

  const photoIndexForUri = (uri: string) => galleryPhotos.indexOf(uri);

  const handleAdd = () => {
    if (photos.length >= MAX_PET_MEDIA) {
      onLimitReached();
      return;
    }

    showMediaSourcePicker({
      onPhotoCamera: async () => {
        const uri = await pickImageFromCamera();
        if (uri) setPendingUri(uri);
      },
      onPhotoLibrary: async () => {
        const uri = await pickImageFromLibrary();
        if (uri) setPendingUri(uri);
      },
    });
  };

  const handlePhotoPress = (uri: string) => {
    if (onPhotoPress && galleryPhotos.length > 0) {
      const index = photoIndexForUri(uri);
      onPhotoPress(index >= 0 ? index : 0);
      return;
    }
    onSetCover(uri);
  };

  const handlePhotoLongPress = (item: PetMediaItem) => {
    Alert.alert(petName ? `${petName}'s photo` : 'Photo options', item.caption, [
      { text: 'View full screen', onPress: () => handlePhotoPress(item.uri) },
      { text: 'Edit caption', onPress: () => setEditingItem(item) },
      { text: 'Set as cover', onPress: () => onSetCover(item.uri) },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Photos</Text>
          <Text style={styles.sub}>
            {photos.length} photo{photos.length === 1 ? '' : 's'} · add a memory caption
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {photos.map((item) => {
          const isCover = item.uri === coverUri;
          return (
            <View key={item.id} style={styles.thumbWrap}>
              <Pressable
                style={[styles.thumb, isCover && styles.thumbCover]}
                onPress={() => handlePhotoPress(item.uri)}
                onLongPress={() => handlePhotoLongPress(item)}>
                <Image source={{ uri: item.uri }} style={styles.thumbImage} contentFit="cover" />
              </Pressable>
              {isCover ? <Text style={styles.coverBadge}>Cover</Text> : null}
              {item.caption ? (
                <Text style={styles.caption} numberOfLines={2}>
                  {item.caption}
                </Text>
              ) : null}
            </View>
          );
        })}

        {photos.length < MAX_PET_MEDIA ? (
          <Pressable style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addIcon}>＋</Text>
            <Text style={styles.addLbl}>Add</Text>
            <Text style={styles.addSub}>Photo</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Text style={styles.hint}>Tap to view · long-press to edit caption, cover, or remove</Text>

      <MediaCaptionModal
        visible={Boolean(pendingUri)}
        uri={pendingUri}
        onCancel={() => setPendingUri(null)}
        onConfirm={async (caption) => {
          if (!pendingUri) return;
          const ok = await onAdd(pendingUri, caption);
          if (ok) setPendingUri(null);
        }}
      />

      <MediaCaptionModal
        visible={Boolean(editingItem)}
        uri={editingItem?.uri ?? null}
        initialCaption={editingItem?.caption ?? ''}
        title="Edit memory caption"
        onCancel={() => setEditingItem(null)}
        onConfirm={(caption) => {
          if (!editingItem) return;
          onUpdateCaption(editingItem.id, caption);
          setEditingItem(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.mid,
    marginTop: 3,
  },
  strip: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  thumbWrap: { width: 96, alignItems: 'center' },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.cream2,
  },
  thumbCover: { borderColor: Colors.forest },
  thumbImage: { width: '100%', height: '100%' },
  coverBadge: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 9,
    color: Colors.forest,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.mid,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
    width: '100%',
  },
  addBtn: {
    width: 96,
    height: 96,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addIcon: { fontSize: 22, color: Colors.forest },
  addLbl: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.forest },
  addSub: { fontFamily: Fonts.sans, fontSize: 9, color: Colors.light },
  hint: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.light,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
