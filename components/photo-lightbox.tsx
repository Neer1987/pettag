import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import type { GallerySlide } from '@/lib/pet-media';

type PhotoLightboxProps = {
  visible: boolean;
  photos: string[] | GallerySlide[];
  initialIndex?: number;
  petName?: string;
  onClose: () => void;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PhotoLightbox({
  visible,
  photos,
  initialIndex = 0,
  petName,
  onClose,
}: PhotoLightboxProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<GallerySlide>>(null);
  const [index, setIndex] = useState(initialIndex);

  const slides: GallerySlide[] = photos.map((item) =>
    typeof item === 'string' ? { uri: item } : item,
  );

  useEffect(() => {
    if (!visible) return;
    setIndex(initialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [visible, initialIndex]);

  const goTo = (next: number) => {
    if (next < 0 || next >= slides.length) return;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(next);
  };

  if (slides.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.backdrop}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <View style={styles.counterWrap}>
            <Text style={styles.counter}>
              {index + 1} / {slides.length}
            </Text>
            {petName ? <Text style={styles.petName}>{petName}</Text> : null}
          </View>
          <View style={styles.topSpacer} />
        </View>

        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(item, i) => `${item.uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
          initialScrollIndex={initialIndex}
          onScrollToIndexFailed={() => {
            listRef.current?.scrollToOffset({ offset: initialIndex * SCREEN_WIDTH, animated: false });
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image source={{ uri: item.uri }} style={styles.fullImage} contentFit="contain" />
              {item.caption ? (
                <View style={[styles.captionWrap, { paddingBottom: insets.bottom + 24 }]}>
                  <Text style={styles.captionText}>{item.caption}</Text>
                </View>
              ) : null}
            </View>
          )}
        />

        {slides.length > 1 ? (
          <>
            {index > 0 ? (
              <Pressable style={[styles.navBtn, styles.navLeft]} onPress={() => goTo(index - 1)}>
                <Text style={styles.navText}>‹</Text>
              </Pressable>
            ) : null}
            {index < slides.length - 1 ? (
              <Pressable style={[styles.navBtn, styles.navRight]} onPress={() => goTo(index + 1)}>
                <Text style={styles.navText}>›</Text>
              </Pressable>
            ) : null}

            <View style={[styles.dots, { paddingBottom: insets.bottom + 16 }]}>
              {slides.map((_, i) => (
                <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
              ))}
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: Colors.white, fontSize: 16 },
  counterWrap: { flex: 1, alignItems: 'center' },
  counter: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.white },
  petName: { fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  topSpacer: { width: 36 },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.68,
  },
  captionWrap: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  captionText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 21,
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navLeft: { left: 12 },
  navRight: { right: 12 },
  navText: {
    color: Colors.white,
    fontSize: 28,
    lineHeight: 30,
    fontFamily: Fonts.sansSemiBold,
    marginTop: -2,
  },
  dots: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.white,
  },
});
