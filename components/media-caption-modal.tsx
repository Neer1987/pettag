import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Colors, Fonts } from '@/constants/theme';

type MediaCaptionModalProps = {
  visible: boolean;
  uri: string | null;
  initialCaption?: string;
  title?: string;
  onCancel: () => void;
  onConfirm: (caption: string) => void;
};

export function MediaCaptionModal({
  visible,
  uri,
  initialCaption = '',
  title,
  onCancel,
  onConfirm,
}: MediaCaptionModalProps) {
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState(initialCaption);

  useEffect(() => {
    if (visible) setCaption(initialCaption);
  }, [visible, initialCaption, uri]);

  if (!uri) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.title}>{title ?? 'Add photo memory'}</Text>
          <Text style={styles.sub}>Optional caption shown under this photo on your pet profile.</Text>

          <View style={styles.previewWrap}>
            <Image source={{ uri }} style={styles.preview} contentFit="cover" />
          </View>

          <Text style={styles.label}>Memory / caption</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. First day at the park"
            placeholderTextColor={Colors.light}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={120}
          />
          <Text style={styles.counter}>{caption.length}/120</Text>

          <View style={styles.actions}>
            <Button label="Save" variant="forest" onPress={() => onConfirm(caption.trim())} />
            <Pressable style={styles.skipBtn} onPress={() => onConfirm('')}>
              <Text style={styles.skipText}>Skip caption</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,27,20,0.45)' },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: { fontFamily: Fonts.serifItalic, fontSize: 24, color: Colors.ink },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.mid,
    marginTop: 6,
    lineHeight: 20,
  },
  previewWrap: { alignItems: 'center', marginVertical: 18 },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 18,
    backgroundColor: Colors.cream2,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  counter: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.light,
    textAlign: 'right',
    marginTop: 6,
  },
  actions: { marginTop: 16, gap: 10 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.mid },
});
