import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type RefreshControlProps } from 'react-native';

import { AppBackButton } from '@/components/app-back-button';

import { BlinkDot } from '@/components/blink-dot';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/section-label';
import { Tag } from '@/components/ui/tag';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { formatAlertDistance, type LostPetAlert } from '@/lib/lost-alerts';
import { speciesEmoji } from '@/lib/pet-media';

type LostPetAlertDetailProps = {
  alert: LostPetAlert;
  width: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function LostPetAlertDetail({ alert, width, refreshControl }: LostPetAlertDetailProps) {
  const { showToast } = useToast();
  const photos = alert.photoUris.length > 0 ? alert.photoUris : alert.coverPhotoUri ? [alert.coverPhotoUri] : [];
  const metaLine = [alert.breed, alert.weight, alert.gender, alert.coat].filter(Boolean).join(' · ');

  const openMessage = () => {
    router.push({
      pathname: '/message',
      params: {
        petName: alert.petName,
        petSlug: alert.profileSlug,
        recipientEmail: alert.ownerEmail,
        foundPet: '1',
      },
    });
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`I may have seen ${alert.petName} — PetTag alert`);
    Linking.openURL(`mailto:${alert.ownerEmail}?subject=${subject}`).catch(() =>
      showToast('Unable to open email app'),
    );
  };

  const viewProfile = () => {
    router.push(`/pet/${alert.profileSlug}`);
  };

  const shareAlert = () => {
    showToast(`Missing post for ${alert.petName} shared to nearby PetTag users`);
  };

  const viewLocation = () => {
    showToast(`Last seen: ${alert.lastSeenLocation}`);
  };

  const idChips = [
    { icon: '🎨', val: alert.coat, lbl: 'Coat colour' },
    { icon: '⚖️', val: alert.weight, lbl: 'Weight' },
    ...(alert.markings.slice(0, 2).map((m) => ({ icon: '👂', val: m, lbl: 'Marking' })) ?? []),
  ].filter((c) => c.val && c.val !== '—');

  return (
    <ScrollView
      style={{ width }}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <AppBackButton label="Back" fallbackHref="/(tabs)/" variant="pill" light />
        </View>
        <View style={styles.glow} />
        <View style={styles.badge}>
          <BlinkDot style={styles.badgeDot} />
          <Text style={styles.badgeText}>{formatAlertDistance(alert.distanceKm)}</Text>
        </View>
        <Text style={styles.petName}>{alert.petName}</Text>
        <Text style={styles.breed}>{metaLine || alert.species}</Text>
        <View style={styles.locPill}>
          <Text style={styles.locText}>📍 Last seen near {alert.lastSeenLocation}</Text>
        </View>
        <Text style={styles.reported}>Reported {alert.reportedAt}</Text>
      </View>

      <SectionLabel
        label={`Photos — help identify ${alert.petName}`}
        style={styles.dangerLabel}
      />
      <View style={styles.photos}>
        {photos.length > 0 ? (
          <>
            <Pressable style={styles.photoMain} onPress={viewProfile}>
              <Image source={{ uri: photos[0] }} style={styles.photoImage} contentFit="cover" />
            </Pressable>
            <View style={styles.photoCol}>
              {photos.slice(1, 3).map((uri) => (
                <Pressable key={uri} style={styles.photoSm} onPress={viewProfile}>
                  <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                </Pressable>
              ))}
              {photos.length <= 1 ? (
                <View style={styles.photoSm}>
                  <Text style={styles.photoSmEmoji}>{speciesEmoji(alert.species)}</Text>
                </View>
              ) : null}
              {photos.length > 3 ? (
                <Pressable style={styles.photoMore} onPress={viewProfile}>
                  <Text style={styles.photoMoreText}>+{photos.length - 3} more</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <View style={styles.photoMain}>
              <Text style={styles.photoEmoji}>{speciesEmoji(alert.species)}</Text>
            </View>
            <View style={styles.photoCol}>
              <View style={styles.photoSm}>
                <Text style={styles.photoSmEmoji}>🐾</Text>
              </View>
              <View style={styles.photoSm}>
                <Text style={styles.photoSmEmoji}>{speciesEmoji(alert.species)}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {idChips.length > 0 ? (
        <View style={styles.idChips}>
          {idChips.map((c) => (
            <View key={`${c.lbl}-${c.val}`} style={styles.idChip}>
              <Text style={styles.idIcon}>{c.icon}</Text>
              <View>
                <Text style={styles.idVal}>{c.val}</Text>
                <Text style={styles.idLbl}>{c.lbl}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {alert.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Notes from owner</Text>
          <Text style={styles.notesBody}>{alert.notes}</Text>
        </View>
      ) : null}

      <View style={styles.ownerRow}>
        <Text style={styles.ownerLabel}>Pet parent</Text>
        <Text style={styles.ownerName}>{alert.ownerName}</Text>
        {alert.age ? <Tag label={alert.age} variant="neutral" /> : null}
      </View>

      <SectionLabel label={`Help reunite ${alert.petName} with family`} />
      <View style={styles.actions}>
        <Button
          label={`I can see ${alert.petName} — contact owner`}
          variant="danger"
          onPress={openMessage}
          style={styles.actionBtn}
        />
        <Button label="Email owner" variant="forest" onPress={openEmail} style={styles.actionBtn} />
        <Button label="View full profile" variant="ghost" onPress={viewProfile} style={styles.actionBtn} />
        <Pressable style={[styles.action, styles.secondary]} onPress={shareAlert}>
          <Text style={styles.secondaryText}>📤 Share missing post</Text>
        </Pressable>
        <Pressable style={[styles.action, styles.ghost]} onPress={viewLocation}>
          <Text style={styles.ghostText}>📍 View last known location</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 32 },
  hero: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  heroTopRow: {
    marginBottom: 12,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 14,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: Fonts.sansMedium, fontSize: 10, color: Colors.white },
  petName: {
    fontFamily: Fonts.serifItalic,
    fontSize: 38,
    color: Colors.white,
    marginBottom: 4,
  },
  breed: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  locPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 8,
  },
  locText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.white },
  reported: { fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  dangerLabel: { color: Colors.danger },
  photos: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  photoMain: {
    flex: 1.6,
    height: 104,
    backgroundColor: Colors.cream2,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: { width: '100%', height: '100%' },
  photoEmoji: { fontSize: 48 },
  photoCol: { flex: 1, gap: 7 },
  photoSm: {
    flex: 1,
    backgroundColor: Colors.cream2,
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSmEmoji: { fontSize: 22 },
  photoMore: {
    flex: 1,
    backgroundColor: Colors.cream2,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoMoreText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.light },
  idChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    ...Shadows.card,
  },
  idIcon: { fontSize: 14 },
  idVal: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.ink },
  idLbl: { fontFamily: Fonts.sans, fontSize: 9, color: Colors.light, marginTop: 1 },
  notesCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...Shadows.card,
  },
  notesTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.ink, marginBottom: 6 },
  notesBody: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mid, lineHeight: 20 },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  ownerLabel: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.light },
  ownerName: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },
  actions: { paddingHorizontal: 20, gap: 8 },
  actionBtn: { paddingVertical: 16 },
  action: {
    borderRadius: 17,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondary: { backgroundColor: Colors.white, ...Shadows.card },
  secondaryText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.ink },
  ghost: { borderWidth: 1.5, borderColor: Colors.line },
  ghostText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.mid },
});
