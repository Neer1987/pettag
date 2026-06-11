import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QrTagPreview } from '@/components/qr-tag-preview';
import { HomeCtaButton } from '@/components/ui/home-cta-button';
import { getQrDesign } from '@/constants/qr-templates';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';
import { getPetProfilePath } from '@/lib/pet-url';
import { speciesEmoji } from '@/lib/pet-media';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const { petName, ownerName } = useLocalSearchParams<{ petName?: string; ownerName?: string }>();
  const { pet, owner } = useUser();

  const displayPet = petName ?? pet?.name ?? 'Your pet';
  const displayOwner = ownerName ?? owner?.fullName?.split(' ')[0] ?? 'there';
  const displayBreed = pet?.breed || pet?.species || 'Pet profile';
  const coverUri = pet?.coverPhotoUri;
  const qrDesign = getQrDesign(pet?.qrDesignId);
  const profilePath = pet?.qrCodeId ? getPetProfilePath(pet.qrCodeId) : 'pettag.app/your-pet';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerGlow} />
        <Text style={styles.eyebrow}>Account created</Text>
        <Text style={styles.headerTitle}>Welcome, {displayOwner}</Text>
        <Text style={styles.headerSub}>
          {displayPet}&apos;s digital profile is live. One more step — choose your physical QR tag.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.profilePhoto} contentFit="cover" />
            ) : (
              <View style={styles.profilePhotoFallback}>
                <Text style={styles.profileEmoji}>{speciesEmoji(pet?.species ?? 'Dog')}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayPet}</Text>
              <Text style={styles.profileBreed}>{displayBreed}</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Profile active</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileDivider} />
          <Text style={styles.profileLink}>{profilePath}</Text>
        </View>

        <Text style={styles.sectionTitle}>What happens next</Text>

        <Pressable
          style={({ pressed }) => [styles.stepCard, styles.stepCardPrimary, pressed && styles.stepPressed]}
          onPress={() => router.push('/qr-design')}>
          <View style={styles.stepIconWrap}>
            <QrTagPreview
              designId={pet?.qrDesignId}
              qrCodeId={pet?.qrCodeId}
              petName={displayPet}
              size="sm"
              showLabel={false}
            />
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepEyebrow}>Step 1 · Required</Text>
            <Text style={styles.stepTitle}>Choose your QR code design</Text>
            <Text style={styles.stepSub}>
              {qrDesign.name} selected · Tap to browse {6} stainless steel templates
            </Text>
          </View>
          <Text style={styles.stepChevron}>›</Text>
        </Pressable>

        <View style={styles.stepCard}>
          <View style={[styles.stepIconCircle, { backgroundColor: Colors.goldPale }]}>
            <Text style={styles.stepIcon}>📦</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepEyebrow}>Step 2</Text>
            <Text style={styles.stepTitle}>QR tag being crafted</Text>
            <Text style={styles.stepSub}>Ships in 2–3 business days · Free · Laser-etched steel</Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={[styles.stepIconCircle, { backgroundColor: Colors.sagePale }]}>
            <Text style={styles.stepIcon}>🔗</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepEyebrow}>Ready now</Text>
            <Text style={styles.stepTitle}>Share profile link</Text>
            <Text style={styles.stepMono}>{profilePath}</Text>
          </View>
        </View>

        <HomeCtaButton onPress={() => router.replace('/(tabs)/pets')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    backgroundColor: Colors.forest,
    paddingHorizontal: 24,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(200,150,42,0.15)',
  },
  eyebrow: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 32,
    color: Colors.white,
    lineHeight: 36,
  },
  headerSub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
    marginTop: 10,
  },
  scroll: { flex: 1, marginTop: -16 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    ...Shadows.card,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profilePhoto: { width: 64, height: 64, borderRadius: 20 },
  profilePhotoFallback: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: { fontSize: 30 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: Fonts.serifItalic, fontSize: 22, color: Colors.ink },
  profileBreed: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mid, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.success },
  profileDivider: { height: 1, backgroundColor: Colors.line, marginVertical: 14 },
  profileLink: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.forest },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.light,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  stepCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    ...Shadows.card,
  },
  stepCardPrimary: {
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: Colors.goldPale,
  },
  stepPressed: { opacity: 0.92 },
  stepIconWrap: { width: 88, alignItems: 'center' },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: { fontSize: 22 },
  stepBody: { flex: 1 },
  stepEyebrow: {
    fontFamily: Fonts.sansMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.light,
    textTransform: 'uppercase',
  },
  stepTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.ink, marginTop: 2 },
  stepSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mid, marginTop: 3, lineHeight: 16 },
  stepMono: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.forest, marginTop: 3 },
  stepChevron: { fontSize: 24, color: Colors.forest, fontFamily: Fonts.sansMedium },
});
