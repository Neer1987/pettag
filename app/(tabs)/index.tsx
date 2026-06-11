import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionLabel } from '@/components/ui/section-label';
import { ScanPetTagButton } from '@/components/scan-pet-tag-button';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';
import { useAppRefresh } from '@/hooks/use-app-refresh';
import { speciesEmoji } from '@/lib/pet-media';

const FALLBACK_HERO = require('@/assets/images/landing-pet.jpg');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { owner, pet, pets, activePetQrCodeId, selectPet, isLoggedIn } = useUser();
  const { refreshAll } = useAppRefresh();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  const firstName = owner?.fullName.split(' ')[0];
  const coverUri = pet?.coverPhotoUri ?? pet?.media.find((m) => m.type === 'photo')?.uri ?? null;
  const photoCount = pet?.media.filter((m) => m.type === 'photo').length ?? 0;
  const lostCount = pets.filter((p) => p.isLost).length;

  const openPetProfile = (qrCodeId: string) => {
    selectPet(qrCodeId);
    router.push('/(tabs)/pets');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={Colors.forest} />
        }
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.brand}>PetTag</Text>

        {!isLoggedIn || pets.length === 0 ? (
          <View style={styles.emptyBlock}>
            <View style={styles.heroImageWrap}>
              <Image source={FALLBACK_HERO} style={styles.heroImage} contentFit="cover" transition={300} />
            </View>
            <Text style={styles.greetName}>Welcome to PetTag</Text>
            <Text style={styles.greetSub}>Create your pet profile to get started.</Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push('/signup')}>
              <Text style={styles.primaryBtnText}>Sign up</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/login')}>
              <Text style={styles.secondaryBtnText}>Log in</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable
              style={styles.heroImageWrap}
              onPress={() => pet && openPetProfile(pet.qrCodeId)}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.heroImage} contentFit="cover" transition={300} />
              ) : (
                <View style={styles.heroFallback}>
                  <Text style={styles.heroEmoji}>{speciesEmoji(pet?.species ?? 'Dog')}</Text>
                </View>
              )}
              <View style={styles.heroOverlay}>
                <Text style={styles.heroPetName}>{pet?.name}</Text>
                <Text style={styles.heroPetMeta}>
                  {[pet?.breed, pet?.age].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </Pressable>

            <View style={styles.greetBlock}>
              <Text style={styles.greetName}>Hey, {firstName}</Text>
              <Text style={styles.greetSub}>
                {pets.length > 1
                  ? `You have ${pets.length} pets${lostCount > 0 ? ` · ${lostCount} alert${lostCount === 1 ? '' : 's'} active` : ''}`
                  : pet?.isLost
                    ? `${pet.name} is being searched — alert is active`
                    : `${pet?.name} is safe today · ${photoCount} photo${photoCount === 1 ? '' : 's'}`}
              </Text>
            </View>

            <View style={styles.scanCardWrap}>
              <ScanPetTagButton />
            </View>

            <SectionLabel label="My Pets" style={styles.sectionLabel} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petsRow}>
              {pets.map((p) => {
                const thumb = p.coverPhotoUri ?? p.media.find((m) => m.type === 'photo')?.uri ?? null;
                const selected = p.qrCodeId === activePetQrCodeId;
                return (
                  <Pressable
                    key={p.qrCodeId}
                    style={[styles.petCard, selected && styles.petCardSelected]}
                    onPress={() => openPetProfile(p.qrCodeId)}>
                    <View style={styles.petThumb}>
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.petThumbImage} contentFit="cover" />
                      ) : (
                        <View style={styles.petThumbFallback}>
                          <Text style={styles.petThumbEmoji}>{speciesEmoji(p.species)}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.petName}>{p.name}</Text>
                    <Text style={styles.petBreed}>{p.breed || p.species}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, p.isLost ? styles.lostDot : styles.safeDot]} />
                      <Text style={[styles.statusText, p.isLost ? styles.lostText : styles.safeText]}>
                        {p.isLost ? 'Searching' : 'Safe'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable style={styles.addPetCard} onPress={() => router.push('/add-pet')}>
                <Text style={styles.addPlus}>＋</Text>
                <Text style={styles.addLabel}>Add pet</Text>
              </Pressable>
            </ScrollView>

            {pet ? (
              <Pressable style={styles.profileLink} onPress={() => openPetProfile(pet.qrCodeId)}>
                <Text style={styles.profileLinkText}>View {pet.name}&apos;s full profile →</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  brand: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.forest,
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  emptyBlock: {
    alignItems: 'stretch',
  },
  heroImageWrap: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    backgroundColor: Colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 72,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(15,45,30,0.55)',
  },
  heroPetName: {
    fontFamily: Fonts.serifItalic,
    fontSize: 26,
    color: Colors.white,
  },
  heroPetMeta: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  greetBlock: {
    marginBottom: 8,
  },
  scanCardWrap: {
    marginBottom: 18,
  },
  greetName: {
    fontFamily: Fonts.serifItalic,
    fontSize: 28,
    color: Colors.ink,
  },
  greetSub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    marginTop: 4,
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: Colors.forest,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.forest,
  },
  sectionLabel: {
    paddingHorizontal: 0,
    paddingTop: 12,
  },
  petsRow: {
    gap: 12,
    paddingRight: 4,
  },
  petCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadows.card,
  },
  petCardSelected: {
    borderColor: Colors.forest,
  },
  petThumb: {
    width: '100%',
    height: 88,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: Colors.cream2,
  },
  petThumbImage: {
    width: '100%',
    height: '100%',
  },
  petThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sagePale,
  },
  petThumbEmoji: {
    fontSize: 36,
  },
  petName: {
    fontFamily: Fonts.serifItalic,
    fontSize: 17,
    color: Colors.ink,
    textAlign: 'center',
  },
  petBreed: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.light,
    textAlign: 'center',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safeDot: {
    backgroundColor: Colors.success,
  },
  lostDot: {
    backgroundColor: Colors.danger,
  },
  statusText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
  },
  safeText: {
    color: Colors.success,
  },
  lostText: {
    color: Colors.danger,
  },
  addPetCard: {
    width: 100,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    gap: 8,
  },
  addPlus: {
    fontSize: 24,
    color: Colors.mid,
  },
  addLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.mid,
    textAlign: 'center',
  },
  profileLink: {
    marginTop: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileLinkText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.forest,
  },
});
