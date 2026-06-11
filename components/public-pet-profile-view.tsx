import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/app-back-button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlinkDot } from '@/components/blink-dot';
import { PhotoLightbox } from '@/components/photo-lightbox';
import { SectionLabel } from '@/components/ui/section-label';
import { Tag } from '@/components/ui/tag';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import type { OwnerProfile, PetProfile } from '@/contexts/user-context';
import { useToast } from '@/contexts/toast-context';
import { speciesEmoji, buildGallerySlides } from '@/lib/pet-media';
import { displayWeight } from '@/lib/weight-format';

type PublicPetProfileViewProps = {
  pet: PetProfile;
  owner: OwnerProfile;
  preview?: boolean;
  visitorMode?: boolean;
  /** Logged-in PetTag user scanned or opened this profile in the app. */
  inAppFinder?: boolean;
};

export function PublicPetProfileView({
  pet,
  owner,
  preview,
  visitorMode,
  inAppFinder,
}: PublicPetProfileViewProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const coverUri = pet.coverPhotoUri;
  const microchipLabel = pet.microchip.trim() ? pet.microchip : 'Not registered';
  const photos = pet.media.filter((m) => m.type === 'photo');

  const gallerySlides = useMemo(
    () => buildGallerySlides(coverUri, pet.media),
    [coverUri, pet.media],
  );

  const openLightbox = (index: number) => {
    if (gallerySlides.length === 0) return;
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const photoIndexForUri = (uri: string) => gallerySlides.findIndex((slide) => slide.uri === uri);

  const openEmail = () => {
    const subject = encodeURIComponent(`Regarding ${pet.name} on PetTag`);
    Linking.openURL(`mailto:${owner.email}?subject=${subject}`).catch(() =>
      showToast('Unable to open email app'),
    );
  };

  const openMessage = () => {
    router.push({
      pathname: '/message',
      params: {
        petName: pet.name,
        petSlug: pet.qrCodeId,
        recipientEmail: owner.email,
        ...(pet.isLost ? { foundPet: '1' } : {}),
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <PhotoLightbox
        visible={lightboxOpen}
        photos={gallerySlides}
        initialIndex={lightboxIndex}
        petName={pet.name}
        onClose={() => setLightboxOpen(false)}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {visitorMode && !preview ? (
          <View style={[styles.finderBar, { paddingTop: insets.top + 12 }]}>
            <View style={styles.finderBarTop}>
              <AppBackButton
                label="Back"
                fallbackHref={inAppFinder ? '/(tabs)/' : '/(tabs)/alerts'}
                variant="pill"
                light={inAppFinder}
              />
            </View>
            {inAppFinder ? (
              <>
                <Text style={styles.finderTitleInApp}>Pet profile opened in PetTag</Text>
                <Text style={styles.finderSubInApp}>
                  You scanned this tag in the app. Contact the owner below{pet.isLost ? ' — this pet is reported missing' : ''}.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.finderTitle}>Found a pet?</Text>
                <Text style={styles.finderSub}>
                  No app needed — this page opens from the QR tag in any phone browser. Contact the owner below.
                </Text>
              </>
            )}
          </View>
        ) : null}

        {pet.isLost ? (
          <View
            style={[
              styles.lostBanner,
              { paddingTop: visitorMode && !preview ? 12 : insets.top + 12 },
            ]}>
            <View style={styles.lostBannerRow}>
              <BlinkDot style={styles.lostDot} />
              <Text style={styles.lostBannerTitle}>Lost pet — please help</Text>
            </View>
            <Text style={styles.lostBannerSub}>
              {pet.name} is missing. If you see this pet, contact the owner below immediately.
            </Text>
          </View>
        ) : visitorMode && !preview ? null : (
          <View style={[styles.trustBar, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.trustBrand}>PetTag</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified profile</Text>
            </View>
          </View>
        )}

        <Pressable
          style={[styles.hero, pet.isLost && styles.heroLost, !pet.isLost && { marginTop: 0 }]}
          onPress={() => {
            const start = coverUri ? photoIndexForUri(coverUri) : 0;
            openLightbox(start >= 0 ? start : 0);
          }}
          disabled={gallerySlides.length === 0}>
          {coverUri ? (
            <>
              <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              <View style={styles.heroOverlay} />
              {gallerySlides.length > 0 ? (
                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tap to view photos</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.glow1} />
              <View style={styles.glow2} />
              <Text style={styles.heroPet}>{speciesEmoji(pet.species)}</Text>
            </>
          )}
          {preview ? (
            <View style={styles.previewPill}>
              <Text style={styles.previewPillText}>Visitor preview</Text>
            </View>
          ) : null}
          <View style={styles.heroFade} />
        </Pressable>

        <View style={styles.nameCard}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petSpecies}>{pet.breed || pet.species}</Text>
          <View style={styles.tags}>
            {pet.age ? <Tag label={pet.age} /> : null}
            {(pet.gender || pet.weight) && (
              <Tag label={[pet.gender, displayWeight(pet.weight)].filter((v) => v && v !== '—').join(' · ')} />
            )}
            {pet.markings.map((m) => (
              <Tag key={m} label={m} />
            ))}
          </View>
        </View>

        {photos.length > 0 ? (
          <>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryLabel}>Photos</Text>
              <Text style={styles.galleryCount}>
                {photos.length} photo{photos.length === 1 ? '' : 's'}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
              {photos.map((item) => {
                const photoIndex = photoIndexForUri(item.uri);
                return (
                  <View key={item.id} style={styles.thumbWrap}>
                    <Pressable
                      style={styles.thumb}
                      onPress={() => openLightbox(photoIndex >= 0 ? photoIndex : 0)}>
                      <Image source={{ uri: item.uri }} style={styles.thumbImage} contentFit="cover" />
                    </Pressable>
                    {item.caption ? (
                      <Text style={styles.thumbCaption} numberOfLines={2}>
                        {item.caption}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        <View style={styles.statBar}>
          {[
            { icon: '⚖️', val: displayWeight(pet.weight), lbl: 'Weight' },
            { icon: '🎨', val: pet.coat || '—', lbl: 'Coat' },
            { icon: '🏷️', val: microchipLabel, lbl: 'Microchip' },
            { icon: '🐾', val: pet.species, lbl: 'Species' },
          ].map((s) => (
            <View key={s.lbl} style={styles.statPill}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {pet.notes.trim() ? (
          <>
            <SectionLabel label="Notes for finder or vet" />
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{pet.notes}</Text>
            </View>
          </>
        ) : null}

        <SectionLabel label="Pet Parent" />
        <View style={styles.ownerCard}>
          <View style={styles.ownerRow}>
            <View style={styles.ownerAv}>
              <Text style={styles.ownerAvText}>👤</Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerBadge}>PET PARENT</Text>
              <Text style={styles.ownerName}>{owner.fullName}</Text>
              <Text style={styles.ownerLoc}>
                📍 {[owner.city, owner.state].filter(Boolean).join(', ') || owner.address}
              </Text>
            </View>
          </View>
        </View>

        <SectionLabel label="Help reunite" />
        <View style={styles.helpActions}>
          <Pressable style={styles.helpPrimary} onPress={openMessage}>
            <Text style={styles.helpPrimaryText}>
              {pet.isLost ? `I found ${pet.name} — contact owner` : `Message ${owner.fullName.split(' ')[0]}`}
            </Text>
          </Pressable>
          <Pressable style={styles.helpSecondary} onPress={openEmail}>
            <Text style={styles.helpSecondaryText}>Email pet parent</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Powered by PetTag · Secure pet identity</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  finderBar: {
    backgroundColor: Colors.forest,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  finderBarTop: {
    marginBottom: 12,
  },
  finderTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.white },
  finderTitleInApp: { fontFamily: Fonts.serifItalic, fontSize: 22, color: Colors.white },
  finderSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    lineHeight: 20,
  },
  finderSubInApp: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 6,
    lineHeight: 20,
  },
  trustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: Colors.forest,
  },
  trustBrand: { fontFamily: Fonts.serif, fontSize: 20, color: Colors.white },
  verifiedBadge: {
    backgroundColor: 'rgba(200,150,42,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200,150,42,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.gold },
  lostBanner: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  lostBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  lostDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white },
  lostBannerTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.white },
  lostBannerSub: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  hero: {
    height: 280,
    backgroundColor: Colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroLost: { marginTop: 0 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,45,30,0.35)',
  },
  tapHint: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 4,
  },
  tapHintText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.white },
  glow1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(200,150,42,0.18)',
  },
  glow2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(122,171,138,0.1)',
  },
  heroPet: { fontSize: 100, zIndex: 2 },
  previewPill: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 5,
  },
  previewPillText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.white },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: Colors.cream,
    opacity: 0.12,
  },
  nameCard: {
    marginHorizontal: 20,
    marginTop: -52,
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    zIndex: 5,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  petName: {
    fontFamily: Fonts.serifItalic,
    fontSize: 40,
    color: Colors.ink,
    lineHeight: 44,
    letterSpacing: 0.2,
  },
  petSpecies: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.forest,
    marginTop: 4,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 12 },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  galleryLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.ink },
  galleryCount: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mid },
  photoStrip: { paddingHorizontal: 20, gap: 10 },
  thumbWrap: { width: 96, alignItems: 'center' },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.cream2,
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbCaption: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.mid,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
    width: '100%',
  },
  statBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 12 },
  statPill: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    ...Shadows.card,
  },
  statIcon: { fontSize: 16 },
  statVal: { fontFamily: Fonts.sansSemiBold, fontSize: 11, color: Colors.ink, marginTop: 2, textAlign: 'center' },
  statLbl: {
    fontFamily: Fonts.sansMedium,
    fontSize: 8,
    color: Colors.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  notesCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    ...Shadows.card,
  },
  notesText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mid, lineHeight: 21 },
  ownerCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.forest,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ownerAv: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvText: { fontSize: 22 },
  ownerInfo: { flex: 1 },
  ownerBadge: {
    fontFamily: Fonts.sansMedium,
    fontSize: 9,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 1,
  },
  ownerName: { fontFamily: Fonts.sansSemiBold, fontSize: 16, color: Colors.white, marginTop: 1 },
  ownerLoc: { fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  helpActions: { paddingHorizontal: 20, gap: 10, marginTop: 4 },
  helpPrimary: {
    backgroundColor: Colors.forest,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadows.card,
  },
  helpPrimaryText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.white },
  helpSecondary: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
  },
  helpSecondaryText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.forest },
  footer: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.light,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
});
