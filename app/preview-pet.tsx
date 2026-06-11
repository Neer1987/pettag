import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PublicPetProfileView } from '@/components/public-pet-profile-view';
import { Colors, Fonts } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';

export default function PreviewPublicPetScreen() {
  const insets = useSafeAreaInsets();
  const { pet, owner } = useUser();

  if (!pet || !owner) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 60 }]}>
        <StatusBar style="dark" />
        <Text style={styles.emptyTitle}>No pet profile to preview</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.back()}>
          <Text style={styles.emptyBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.previewBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.previewLabel}>QR scan preview</Text>
        <View style={styles.spacer} />
      </View>
      <PublicPetProfileView pet={pet} owner={owner} preview />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.cream },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.forest,
    gap: 8,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  backText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.white },
  previewLabel: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  spacer: { width: 60 },
  empty: { flex: 1, alignItems: 'center', paddingHorizontal: 32, backgroundColor: Colors.cream },
  emptyTitle: { fontFamily: Fonts.serifItalic, fontSize: 22, color: Colors.ink },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: Colors.forest,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.white },
});
