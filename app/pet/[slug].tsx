import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PublicPetProfileView } from '@/components/public-pet-profile-view';
import { Colors, Fonts } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';
import { useResolvedPublicProfile } from '@/hooks/use-resolved-public-profile';
import { getPetScanUrl, getWebBaseUrl } from '@/lib/pet-url';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function PublicPetScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { profile, loading } = useResolvedPublicProfile(slug);
  const { pets, selectPet, isLoggedIn, hydrated } = useUser();
  const publicUrl = slug ? getPetScanUrl(slug) : getWebBaseUrl();
  const isOwnPet = Boolean(slug && pets.some((pet) => pet.qrCodeId === slug));

  useEffect(() => {
    if (!hydrated || !slug || !isOwnPet) return;
    selectPet(slug);
    router.replace('/(tabs)/pets');
  }, [hydrated, isOwnPet, selectPet, slug]);

  if (!hydrated || (isOwnPet && slug)) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 80 }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={Colors.forest} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top + 80 }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={Colors.forest} />
        <Text style={styles.loadingText}>Loading pet profile…</Text>
      </View>
    );
  }

  if (!profile?.pet || !profile.owner) {
    return (
      <View style={[styles.notFound, { paddingTop: insets.top + 60 }]}>
        <StatusBar style="dark" />
        <Text style={styles.notFoundIcon}>🐾</Text>
        <Text style={styles.notFoundTitle}>Profile not found</Text>
        <Text style={styles.notFoundSub}>
          This QR link may be invalid, or the owner has not published this profile yet.
          {!isSupabaseConfigured()
            ? ' Configure Supabase in your .env file to load pet profiles from the cloud.'
            : ''}
        </Text>
        {slug ? (
          <Text style={styles.notFoundUrl}>{publicUrl}</Text>
        ) : null}
        <Pressable style={styles.notFoundBtn} onPress={() => router.replace('/')}>
          <Text style={styles.notFoundBtnText}>Go to PetTag home</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => Linking.openURL(publicUrl).catch(() => undefined)}>
          <Text style={styles.secondaryBtnText}>Open link in browser</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <PublicPetProfileView
      pet={profile.pet}
      owner={profile.owner}
      visitorMode
      inAppFinder={isLoggedIn}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    marginTop: 16,
  },
  notFound: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notFoundIcon: { fontSize: 48, marginBottom: 12 },
  notFoundTitle: { fontFamily: Fonts.serifItalic, fontSize: 26, color: Colors.ink, marginBottom: 8 },
  notFoundSub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    textAlign: 'center',
    lineHeight: 22,
  },
  notFoundUrl: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.forest,
    marginTop: 14,
    textAlign: 'center',
  },
  notFoundBtn: {
    marginTop: 24,
    backgroundColor: Colors.forest,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  notFoundBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.white },
  secondaryBtn: { marginTop: 12, paddingVertical: 10 },
  secondaryBtnText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.forest },
});
