import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { QrTagPreview } from '@/components/qr-tag-preview';
import { Colors, Fonts } from '@/constants/theme';
import type { OwnerProfile, PetProfile } from '@/contexts/user-context';
import { speciesEmoji } from '@/lib/pet-media';
import { getPetScanUrl } from '@/lib/pet-url';
import { displayWeight } from '@/lib/weight-format';

type PetPosterCardProps = {
  pet: PetProfile;
  owner: OwnerProfile;
};

export const POSTER_WIDTH = 320;

export function PetPosterCard({ pet, owner }: PetPosterCardProps) {
  const isLost = pet.isLost;
  const metaLine = [pet.breed, displayWeight(pet.weight), pet.coat].filter(Boolean).join(' · ');
  const contactLine = owner.phone.trim() || owner.email.trim();
  const locationLine = [owner.city, owner.state].filter(Boolean).join(', ');

  return (
    <View style={[styles.card, isLost ? styles.cardLost : styles.cardProfile]} collapsable={false}>
      <View style={[styles.banner, isLost ? styles.bannerLost : styles.bannerProfile]}>
        <Text style={styles.bannerText}>{isLost ? 'MISSING PET' : 'PETTAG PROFILE'}</Text>
        {isLost ? <Text style={styles.bannerSub}>Please help us reunite</Text> : null}
      </View>

      <View style={styles.body}>
        {pet.coverPhotoUri ? (
          <Image source={{ uri: pet.coverPhotoUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={styles.photoFallback}>
            <Text style={styles.photoEmoji}>{speciesEmoji(pet.species)}</Text>
          </View>
        )}

        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.meta}>{metaLine || pet.species}</Text>

        {pet.markings.length > 0 ? (
          <Text style={styles.markings}>Markings: {pet.markings.slice(0, 3).join(', ')}</Text>
        ) : null}

        {pet.notes.trim() ? (
          <Text style={styles.notes} numberOfLines={3}>
            {pet.notes.trim()}
          </Text>
        ) : null}

        <View style={styles.qrWrap}>
          <QrTagPreview designId={pet.qrDesignId} qrCodeId={pet.qrCodeId} petName={pet.name} size="md" />
        </View>

        <Text style={styles.scanHint}>Scan for full profile & contact owner</Text>
        <Text style={styles.url}>{getPetScanUrl(pet.qrCodeId).replace(/^https?:\/\//, '')}</Text>

        <View style={styles.contactBlock}>
          {contactLine ? <Text style={styles.contact}>Contact: {contactLine}</Text> : null}
          {locationLine ? <Text style={styles.location}>{locationLine}</Text> : null}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerBrand}>PetTag</Text>
        <Text style={styles.footerTagline}>Scan · Share · Reunite</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: POSTER_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  cardLost: {
    borderWidth: 3,
    borderColor: Colors.danger,
  },
  cardProfile: {
    borderWidth: 2,
    borderColor: Colors.forest,
  },
  banner: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  bannerLost: {
    backgroundColor: Colors.danger,
  },
  bannerProfile: {
    backgroundColor: Colors.forest,
  },
  bannerText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 20,
    letterSpacing: 2,
    color: Colors.white,
  },
  bannerSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    alignItems: 'center',
  },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: Colors.line,
  },
  photoFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 48 },
  name: {
    fontFamily: Fonts.serifItalic,
    fontSize: 30,
    color: Colors.ink,
    marginTop: 14,
    textAlign: 'center',
  },
  meta: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.mid,
    marginTop: 4,
    textAlign: 'center',
  },
  markings: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ink,
    marginTop: 10,
    textAlign: 'center',
  },
  notes: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.mid,
    marginTop: 8,
    lineHeight: 16,
    textAlign: 'center',
  },
  qrWrap: {
    marginTop: 16,
    marginBottom: 8,
  },
  scanHint: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.forest,
    textAlign: 'center',
  },
  url: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.mid,
    marginTop: 4,
    textAlign: 'center',
  },
  contactBlock: {
    marginTop: 14,
    width: '100%',
    backgroundColor: Colors.cream,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  contact: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.ink,
    textAlign: 'center',
  },
  location: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.mid,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: Colors.forest,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerBrand: {
    fontFamily: Fonts.serifItalic,
    fontSize: 18,
    color: Colors.gold,
  },
  footerTagline: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
    letterSpacing: 0.6,
  },
});
