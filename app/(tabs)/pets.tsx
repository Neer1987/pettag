import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetMediaGallery } from '@/components/pet-media-gallery';
import { PhotoLightbox } from '@/components/photo-lightbox';
import { QrTagPreview } from '@/components/qr-tag-preview';
import { SectionLabel } from '@/components/ui/section-label';
import { Tag } from '@/components/ui/tag';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { getQrDesign } from '@/constants/qr-templates';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { useAppRefresh } from '@/hooks/use-app-refresh';
import { getErrorMessage } from '@/lib/errors';
import { speciesEmoji, buildGallerySlides } from '@/lib/pet-media';
import { showCoverPhotoPicker } from '@/lib/pick-image';
import { sharePetProfile } from '@/lib/share-pet-profile';
import { getPetProfilePath, getPetScanUrl } from '@/lib/pet-url';
import { displayWeight } from '@/lib/weight-format';

export default function PetProfileScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { pet, pets, owner, addPetMedia, updatePetMediaCaption, removePetMedia, changeCoverPhoto, reportPetLost, markPetSafe } = useUser();
  const { refreshAll } = useAppRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const coverUri = pet?.coverPhotoUri ?? null;
  const gallerySlides = useMemo(
    () => (pet ? buildGallerySlides(coverUri, pet.media) : []),
    [coverUri, pet],
  );

  if (!owner) {
    return (
      <View style={[styles.container, styles.emptyWrap, { paddingTop: insets.top + 80 }]}>
        <Text style={styles.emptyTitle}>No pet profile yet</Text>
        <Text style={styles.emptySub}>Sign up or log in to view your pet&apos;s page.</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.replace('/')}>
          <Text style={styles.emptyBtnText}>Get started</Text>
        </Pressable>
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={[styles.container, styles.emptyWrap, { paddingTop: insets.top + 80 }]}>
        <Text style={styles.emptyTitle}>No pets yet</Text>
        <Text style={styles.emptySub}>Go to Home to add your first pet or switch pets.</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.emptyBtnText}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  if (!pet) {
    return null;
  }

  const microchipLabel = pet.microchip.trim() ? 'Chipped' : 'No chip';
  const qrDesign = getQrDesign(pet.qrDesignId);

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
      },
    });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  const handleChangeCover = () => {
    const photos = pet.media.filter((m) => m.type === 'photo');
    showCoverPhotoPicker({
      existingPhotos: photos.map((item, index) => ({
        uri: item.uri,
        label: item.caption?.trim() || `Photo ${index + 1}`,
      })),
      onSelect: async (uri) => {
        const result = await changeCoverPhoto(uri);
        if (result.ok) {
          showToast('Cover photo updated');
        } else {
          showToast(result.error ?? 'Could not update cover photo.');
        }
      },
    });
  };

  const handleLostPet = async () => {
    if (pet.isLost) {
      await markPetSafe();
      showToast(`Good news — ${pet.name} is marked safe again.`);
      return;
    }
    try {
      await reportPetLost();
      showToast(
        `We're searching for ${pet.name}. Nearby PetTag users have been sent push alerts.`,
      );
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not report lost pet.'));
    }
  };

  const handleShareProfile = async () => {
    try {
      const result = await sharePetProfile({
        petName: pet.name,
        qrCodeId: pet.qrCodeId,
        isLost: pet.isLost,
        ownerPhone: owner.phone,
        breed: pet.breed,
      });

      if (result === 'copied') {
        showToast('Profile link copied');
      } else if (result === 'shared') {
        showToast(`Shared ${pet.name}'s profile`);
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not share profile.'));
    }
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={Colors.forest} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}>
        <Pressable
          style={[styles.hero, { paddingTop: insets.top + 52 }]}
          onPress={() => {
            const start = coverUri ? photoIndexForUri(coverUri) : 0;
            openLightbox(start >= 0 ? start : 0);
          }}
          disabled={gallerySlides.length === 0}>
          {coverUri ? (
            <>
              <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              <View style={styles.heroOverlay} />
            </>
          ) : (
            <>
              <View style={styles.glow1} />
              <View style={styles.glow2} />
              <Text style={styles.heroPet}>{speciesEmoji(pet.species)}</Text>
            </>
          )}
          <View style={styles.topRow}>
            <Pressable style={styles.heroBtn} onPress={() => router.back()}>
              <Text style={styles.heroBtnText}>←</Text>
            </Pressable>
            <View style={styles.topRowRight}>
              <Pressable style={styles.heroBtn} onPress={handleChangeCover}>
                <Text style={styles.heroBtnText}>📷</Text>
              </Pressable>
              <Pressable style={styles.heroBtn} onPress={() => router.push('/edit-pet')}>
                <Text style={styles.heroBtnText}>✎</Text>
              </Pressable>
            </View>
          </View>
          <Pressable style={styles.changeCoverBtn} onPress={handleChangeCover}>
            <Text style={styles.changeCoverText}>
              {coverUri ? 'Change cover photo' : 'Add cover photo'}
            </Text>
          </Pressable>
          <View style={styles.heroFade} />
        </Pressable>

        <View style={styles.nameCard}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petSpecies}>{pet.breed || pet.species}</Text>
          <View style={styles.tags}>
            {pet.age ? <Tag label={pet.age} /> : null}
            {(pet.gender || pet.weight) && (
              <Tag
                label={[pet.gender, displayWeight(pet.weight)]
                  .filter((v) => v && v !== '—')
                  .join(' · ')}
              />
            )}
            {pet.markings.map((m) => (
              <Tag key={m} label={m} />
            ))}
          </View>
        </View>

        <PetMediaGallery
          media={pet.media}
          coverUri={coverUri}
          petName={pet.name}
          onPhotoPress={openLightbox}
          onAdd={async (uri, caption) => {
            const ok = await addPetMedia(uri, caption);
            if (ok) {
              showToast('📷 Photo added to profile');
            } else {
              showToast('Could not upload photo. Run migration 002_storage.sql in Supabase.');
            }
            return ok;
          }}
          onUpdateCaption={(id, caption) => {
            updatePetMediaCaption(id, caption);
            showToast('Caption updated');
          }}
          onRemove={(id) => {
            removePetMedia(id);
            showToast('Removed from profile');
          }}
          onSetCover={async (uri) => {
            const result = await changeCoverPhoto(uri);
            if (result.ok) {
              showToast('Cover photo updated');
            } else {
              showToast(result.error ?? 'Could not update cover photo.');
            }
          }}
          onLimitReached={() => showToast('Gallery is full (8 items max)')}
        />

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

        <SectionLabel label="Pet Parent" />
        <View style={styles.ownerCard}>
          <View style={styles.ownerRow}>
            <View style={styles.ownerAv}>
              <Text style={styles.ownerAvText}>👤</Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerBadge}>PET PARENT</Text>
              <Text style={styles.ownerName}>{owner.fullName}</Text>
              <Text style={styles.ownerEmail}>{owner.email}</Text>
              <Text style={styles.ownerLoc}>
                📍 {[owner.city, owner.state].filter(Boolean).join(', ') || owner.address}
              </Text>
            </View>
          </View>
          <View style={styles.ownerActions}>
            <Pressable style={styles.ownerActionBtn} onPress={openEmail}>
              <Text style={styles.ownerActionIcon}>✉️</Text>
              <Text style={styles.ownerActionText}>Email</Text>
            </Pressable>
            <Pressable style={styles.ownerActionBtn} onPress={openMessage}>
              <Text style={styles.ownerActionIcon}>💬</Text>
              <Text style={styles.ownerActionText}>Message</Text>
            </Pressable>
          </View>
        </View>

        {pet.notes.trim() ? (
          <>
            <SectionLabel label="Notes" />
            <View style={styles.medCard}>
              <Text style={styles.medNotes}>{pet.notes}</Text>
            </View>
          </>
        ) : null}

        <SectionLabel label="QR Tag" />
        <View style={[styles.qrSec, { backgroundColor: qrDesign.frameBg, borderColor: qrDesign.frameBorder }]}>
          <View style={[styles.qrGlow, { backgroundColor: `${qrDesign.accent}30` }]} />
          <Text style={[styles.qrEyebrow, { color: qrDesign.labelColor }]}>
            {qrDesign.name.toUpperCase()} · SCAN TO VIEW {pet.name.toUpperCase()}
          </Text>
          <View style={styles.qrBox}>
            <QrTagPreview
              designId={pet.qrDesignId}
              qrCodeId={pet.qrCodeId}
              petName={pet.name}
              size="lg"
            />
          </View>
          <Text style={[styles.qrUrl, { color: qrDesign.accent }]}>{getPetProfilePath(pet.qrCodeId)}</Text>
          <Text style={[styles.qrFinderHint, { color: qrDesign.labelColor }]}>
            Finders scan this QR — opens in PetTag if installed, otherwise in any browser at{' '}
            {getPetScanUrl(pet.qrCodeId).replace(/^https?:\/\//, '')}.
          </Text>
          <Text style={[styles.qrId, { color: qrDesign.labelColor, opacity: 0.5 }]}>
            QR ID · {pet.qrCodeId}
          </Text>
          <Pressable
            style={[styles.qrChangeBtn, { backgroundColor: `${qrDesign.accent}22`, marginTop: 8 }]}
            onPress={() =>
              router.push({ pathname: '/order-tag', params: { pet: pet.qrCodeId } })
            }>
            <Text style={[styles.qrChangeText, { color: qrDesign.labelColor }]}>Order another tag →</Text>
          </Pressable>
          <Pressable
            style={[styles.qrChangeBtn, { backgroundColor: `${qrDesign.accent}22` }]}
            onPress={() => router.push('/qr-design')}>
            <Text style={[styles.qrChangeText, { color: qrDesign.labelColor }]}>Change tag design →</Text>
          </Pressable>
          <Pressable style={styles.previewBtn} onPress={() => router.push('/preview-pet')}>
            <Text style={[styles.previewBtnText, { color: qrDesign.labelColor }]}>
              Preview page visitors see →
            </Text>
          </Pressable>
        </View>

        <SectionLabel label="Actions" />
        {pet.isLost ? (
          <View style={styles.searchBanner}>
            <Text style={styles.searchBannerTitle}>Search in progress</Text>
            <Text style={styles.searchBannerSub}>
              {pet.name} is being searched. We&apos;ll notify you if someone reports a sighting.
            </Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            style={[styles.action, pet.isLost ? styles.actionSearching : styles.actionLost]}
            onPress={handleLostPet}>
            <Text style={styles.actionIcon}>{pet.isLost ? '🔍' : '🚨'}</Text>
            <Text style={styles.actionLostText}>
              {pet.isLost ? 'Mark as found' : 'I lost my pet'}
            </Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => void handleShareProfile()}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => router.push('/poster')}>
            <Text style={styles.actionIcon}>🖨️</Text>
            <Text style={styles.actionText}>Poster</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  emptyWrap: { alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontFamily: Fonts.serifItalic, fontSize: 28, color: Colors.ink, marginBottom: 8 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 14, color: Colors.mid, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: Colors.forest,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.white },
  hero: {
    height: 290,
    backgroundColor: Colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,45,30,0.35)',
  },
  tapHint: {
    position: 'absolute',
    bottom: 20,
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
  topRow: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    zIndex: 10,
  },
  topRowRight: { flexDirection: 'row', gap: 8 },
  changeCoverBtn: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 4,
  },
  changeCoverText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.white },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnText: { color: Colors.white, fontSize: 15 },
  heroPet: { fontSize: 100, zIndex: 2 },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
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
  statVal: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.ink, marginTop: 2 },
  statLbl: {
    fontFamily: Fonts.sansMedium,
    fontSize: 8,
    color: Colors.light,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  ownerCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.forest,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  ownerAv: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ownerAvText: { fontSize: 22 },
  ownerInfo: { flex: 1 },
  ownerBadge: {
    fontFamily: Fonts.sansMedium,
    fontSize: 9,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 1,
  },
  ownerName: { fontFamily: Fonts.sansSemiBold, fontSize: 16, color: Colors.white, marginTop: 1 },
  ownerEmail: { fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  ownerLoc: { fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  ownerActions: { flexDirection: 'row', gap: 10 },
  ownerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(200,150,42,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200,150,42,0.3)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  ownerActionIcon: { fontSize: 16 },
  ownerActionText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.white },
  medCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    ...Shadows.card,
  },
  medNotes: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mid, lineHeight: 19 },
  qrSec: {
    marginHorizontal: 20,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  qrGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(200,150,42,0.18)',
  },
  qrEyebrow: {
    fontFamily: Fonts.sansMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    marginBottom: 14,
    opacity: 0.85,
  },
  qrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  qrUrl: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  qrFinderHint: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    marginTop: 8,
    lineHeight: 15,
    opacity: 0.75,
    textAlign: 'center',
  },
  qrId: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  qrChangeBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  qrChangeText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
  },
  previewBtn: {
    marginTop: 8,
    paddingVertical: 6,
  },
  previewBtnText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 14, marginBottom: 20 },
  action: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: 'center',
    gap: 4,
    ...Shadows.card,
  },
  actionLost: {
    flex: 1.4,
    backgroundColor: Colors.danger,
  },
  actionSearching: {
    flex: 1.4,
    backgroundColor: Colors.forest,
  },
  searchBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: Colors.dangerPale,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.15)',
  },
  searchBannerTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.danger,
  },
  searchBannerSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mid,
    marginTop: 4,
    lineHeight: 18,
  },
  actionIcon: { fontSize: 17 },
  actionText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.ink },
  actionLostText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.white },
});
