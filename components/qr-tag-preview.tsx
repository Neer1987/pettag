import { StyleSheet, Text, View } from 'react-native';

import { DynamicQrCode } from '@/components/dynamic-qr-code';
import { QrTagThemeDecor } from '@/components/qr-tag-theme';
import { getQrDesign } from '@/constants/qr-templates';
import { Fonts } from '@/constants/theme';
import { getPetScanUrl } from '@/lib/pet-url';

type QrTagPreviewProps = {
  qrCodeId?: string;
  designId?: string;
  petName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
};

const SIZES = {
  sm: { tag: 92, qr: 54, name: 9, border: 2, radius: 16 },
  md: { tag: 124, qr: 74, name: 11, border: 2.5, radius: 18 },
  lg: { tag: 168, qr: 98, name: 13, border: 3, radius: 22 },
};

export function QrTagPreview({
  qrCodeId,
  designId,
  petName,
  size = 'md',
  showLabel = true,
}: QrTagPreviewProps) {
  const design = getQrDesign(designId);
  const dim = SIZES[size];
  const scanUrl = qrCodeId ? getPetScanUrl(qrCodeId) : '';
  const qrColor = design.qrColor ?? design.accent;
  const labelExtra = showLabel && petName ? 20 : 0;
  const isThemed = design.theme !== 'classic';

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.tag,
          {
            width: dim.tag,
            minHeight: dim.tag + labelExtra,
            backgroundColor: isThemed ? 'transparent' : design.frameBg,
            borderColor: design.frameBorder,
            borderWidth: dim.border,
            borderRadius: dim.radius,
          },
        ]}>
        <QrTagThemeDecor design={design} width={dim.tag} height={dim.tag} />

        {!isThemed ? (
          <View style={[styles.accentRing, { borderColor: design.accent, borderRadius: dim.radius - 4 }]} />
        ) : null}

        {design.emoji ? (
          <View style={[styles.emojiBadge, { backgroundColor: design.frameBorder }]}>
            <Text style={styles.emojiBadgeText}>{design.emoji}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.qrBox,
            {
              width: dim.qr,
              height: dim.qr,
              backgroundColor: design.qrBoxBg,
              borderRadius: design.theme === 'hero' ? dim.qr / 2 : 10,
              borderWidth: design.theme === 'hero' ? 2 : 0,
              borderColor: design.theme === 'hero' ? '#FBBF24' : 'transparent',
            },
          ]}>
          {qrCodeId ? (
            <DynamicQrCode
              value={scanUrl}
              size={dim.qr - 10}
              color={qrColor}
              backgroundColor={design.qrBoxBg}
            />
          ) : (
            <View style={[styles.qrPlaceholder, { width: dim.qr - 10, height: dim.qr - 10 }]} />
          )}
        </View>

        {showLabel ? (
          <Text
            style={[
              styles.petLabel,
              {
                color: isThemed ? design.labelColor : design.labelColor,
                fontSize: dim.name,
                textShadowColor: isThemed ? 'rgba(0,0,0,0.35)' : 'transparent',
                textShadowOffset: isThemed ? { width: 0, height: 1 } : undefined,
                textShadowRadius: isThemed ? 2 : 0,
              },
            ]}
            numberOfLines={1}>
            {petName ?? 'PetTag'}
          </Text>
        ) : null}

        <View
          style={[
            styles.hole,
            {
              backgroundColor: design.theme === 'patriotic' ? '#002868' : design.frameBg,
              borderColor: design.frameBorder,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  tag: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  accentRing: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    opacity: 0.45,
  },
  emojiBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  emojiBadgeText: {
    fontSize: 10,
  },
  qrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  qrPlaceholder: {
    backgroundColor: '#E0EAE4',
    borderRadius: 6,
  },
  petLabel: {
    fontFamily: Fonts.sansSemiBold,
    marginTop: 8,
    letterSpacing: 0.4,
    zIndex: 2,
    maxWidth: '92%',
    textAlign: 'center',
  },
  hole: {
    position: 'absolute',
    top: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    zIndex: 3,
  },
});
