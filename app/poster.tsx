import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/app-back-button';
import { PetPosterCard } from '@/components/pet-poster-card';
import { Button } from '@/components/ui/button';
import { Colors, Fonts } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { getErrorMessage } from '@/lib/errors';
import { sharePosterFallback, sharePosterImage } from '@/lib/share-pet-poster';
import { sharePetProfile } from '@/lib/share-pet-profile';

export default function PosterScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { pet, owner, isLoggedIn, hydrated } = useUser();
  const posterRef = useRef<View>(null);
  const [sharingPoster, setSharingPoster] = useState(false);
  const [sharingLink, setSharingLink] = useState(false);

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.replace('/login');
    }
  }, [hydrated, isLoggedIn]);

  if (!hydrated || !isLoggedIn || !pet || !owner) {
    return null;
  }

  const shareInput = {
    petName: pet.name,
    qrCodeId: pet.qrCodeId,
    isLost: pet.isLost,
    ownerPhone: owner.phone,
    breed: pet.breed,
  };

  const handleSharePoster = async () => {
    setSharingPoster(true);
    try {
      if (Platform.OS === 'web') {
        const result = await sharePosterFallback(shareInput);
        if (result === 'copied') {
          showToast('Profile link copied — paste into your missing pet post');
        } else if (result === 'shared') {
          showToast('Poster details shared');
        }
        return;
      }

      await sharePosterImage(posterRef);
      showToast('Poster ready to share');
    } catch (error) {
      showToast(getErrorMessage(error, 'Could not share poster.'));
    } finally {
      setSharingPoster(false);
    }
  };

  const handleShareLink = async () => {
    setSharingLink(true);
    try {
      const result = await sharePetProfile(shareInput);
      if (result === 'copied') {
        showToast('Profile link copied');
      } else if (result === 'shared') {
        showToast('Profile link shared');
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'Could not share profile link.'));
    } finally {
      setSharingLink(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <AppBackButton fallbackHref="/(tabs)/pets" variant="icon" />
        <Text style={styles.topTitle}>{pet.isLost ? 'Missing pet poster' : 'Pet poster'}</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 140 }]}>
        <Text style={styles.title}>{pet.isLost ? 'Share the search' : 'Print or share'}</Text>
        <Text style={styles.sub}>
          {pet.isLost
            ? `Post this flyer in your neighborhood, at vets, and on social media to help find ${pet.name}.`
            : `Share ${pet.name}'s profile poster with sitters, vets, or on social media.`}
        </Text>

        <View style={styles.posterWrap}>
          <View ref={posterRef} collapsable={false}>
            <PetPosterCard pet={pet} owner={owner} />
          </View>
        </View>

        {Platform.OS === 'web' ? (
          <Text style={styles.webHint}>
            On web, use Share poster to copy details or share text. For a PNG image, open this screen in the
            PetTag mobile app.
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={sharingPoster ? 'Preparing poster…' : 'Share poster'}
          variant="forest"
          onPress={() => void handleSharePoster()}
          disabled={sharingPoster || sharingLink}
        />
        <Button
          label={sharingLink ? 'Sharing…' : 'Share profile link'}
          variant="ghost"
          onPress={() => void handleShareLink()}
          disabled={sharingPoster || sharingLink}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  topTitle: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.ink, textAlign: 'center' },
  topSpacer: { width: 42 },
  scroll: { paddingHorizontal: 20 },
  title: { fontFamily: Fonts.serifItalic, fontSize: 28, color: Colors.ink, marginTop: 8 },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  posterWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  webHint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
});
