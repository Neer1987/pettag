import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import type { QrDesignTemplate } from '@/constants/qr-templates';

type QrTagThemeDecorProps = {
  design: QrDesignTemplate;
  width: number;
  height: number;
};

export function QrTagThemeDecor({ design, width, height }: QrTagThemeDecorProps) {
  switch (design.theme) {
    case 'patriotic':
      return <PatrioticDecor width={width} height={height} />;
    case 'fairy':
      return <FairyDecor width={width} height={height} gradient={design.gradient} />;
    case 'hero':
      return <HeroDecor width={width} height={height} gradient={design.gradient} />;
    case 'galaxy':
      return <GalaxyDecor width={width} height={height} gradient={design.gradient} />;
    case 'rainbow':
      return <RainbowDecor width={width} height={height} gradient={design.gradient} />;
    case 'ocean':
      return <OceanDecor width={width} height={height} gradient={design.gradient} />;
    default:
      if (design.gradient) {
        return (
          <LinearGradient
            colors={[...design.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
        );
      }
      return null;
  }
}

function PatrioticDecor({ width, height }: { width: number; height: number }) {
  const stripeHeight = height / 7;
  const colors = ['#B22234', '#FFFFFF', '#B22234', '#FFFFFF', '#B22234', '#FFFFFF', '#B22234'];

  return (
    <>
      {colors.map((color, index) => (
        <View
          key={color + index}
          style={{
            position: 'absolute',
            top: index * stripeHeight,
            left: 0,
            right: 0,
            height: stripeHeight,
            backgroundColor: color,
          }}
        />
      ))}
      <View style={[styles.canton, { width: width * 0.42, height: height * 0.48 }]}>
        <Text style={styles.cantonStars}>★ ★ ★{'\n'}★ ★ ★{'\n'}★ ★</Text>
      </View>
    </>
  );
}

function FairyDecor({
  width,
  height,
  gradient,
}: {
  width: number;
  height: number;
  gradient?: readonly [string, string, ...string[]];
}) {
  const colors = gradient ?? ['#7C3AED', '#EC4899', '#FBBF24'];

  return (
    <>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <Text style={[styles.sparkle, { top: 8, left: 10 }]}>✨</Text>
      <Text style={[styles.sparkle, { top: 10, right: 12, fontSize: 10 }]}>⭐</Text>
      <Text style={[styles.sparkle, { bottom: 28, left: 12, fontSize: 11 }]}>🏰</Text>
      <Text style={[styles.sparkle, { bottom: 30, right: 10 }]}>✨</Text>
      <View style={[styles.fairyGlow, { width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35 }]} />
    </>
  );
}

function HeroDecor({
  width,
  height,
  gradient,
}: {
  width: number;
  height: number;
  gradient?: readonly [string, string, ...string[]];
}) {
  const colors = gradient ?? ['#DC2626', '#991B1B', '#450A0A'];

  return (
    <>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <View style={styles.heroPlateLines}>
        <View style={styles.heroLine} />
        <View style={[styles.heroLine, { width: '70%' }]} />
        <View style={[styles.heroLine, { width: '55%' }]} />
      </View>
      <View
        style={[
          styles.arcRingOuter,
          {
            width: width * 0.62,
            height: width * 0.62,
            borderRadius: width * 0.31,
            top: height * 0.22,
          },
        ]}
      />
      <View
        style={[
          styles.arcRingInner,
          {
            width: width * 0.52,
            height: width * 0.52,
            borderRadius: width * 0.26,
            top: height * 0.27,
          },
        ]}
      />
      <Text style={[styles.heroEmoji, { top: 6, right: 8 }]}>⚡</Text>
    </>
  );
}

function GalaxyDecor({
  width,
  gradient,
}: {
  width: number;
  height: number;
  gradient?: readonly [string, string, ...string[]];
}) {
  const colors = gradient ?? ['#312E81', '#4C1D95', '#0F172A'];

  return (
    <>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <StarDot style={{ top: 12, left: 14 }} />
      <StarDot style={{ top: 22, right: 18, size: 3 }} />
      <StarDot style={{ top: 48, left: 22, size: 2 }} />
      <StarDot style={{ bottom: 36, right: 14 }} />
      <StarDot style={{ bottom: 48, left: 10, size: 3 }} />
      <Text style={[styles.galaxyEmoji, { top: 8, right: 10 }]}>🌙</Text>
      <View style={[styles.planet, { bottom: 30, right: 12, width: width * 0.12, height: width * 0.12 }]} />
    </>
  );
}

function RainbowDecor({ gradient }: { width: number; height: number; gradient?: readonly [string, string, ...string[]] }) {
  const colors = gradient ?? ['#F472B6', '#A78BFA', '#38BDF8', '#4ADE80'];

  return (
    <>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <View style={styles.rainbowShimmer} />
      <Text style={[styles.sparkle, { top: 8, left: 10 }]}>🦄</Text>
      <Text style={[styles.sparkle, { top: 10, right: 10, fontSize: 10 }]}>🌈</Text>
    </>
  );
}

function OceanDecor({ gradient }: { width: number; height: number; gradient?: readonly [string, string, ...string[]] }) {
  const colors = gradient ?? ['#0284C7', '#06B6D4', '#0E7490'];

  return (
    <>
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <View style={styles.waveOne} />
      <View style={styles.waveTwo} />
      <Text style={[styles.sparkle, { top: 8, right: 10, fontSize: 10 }]}>🫧</Text>
      <Text style={[styles.sparkle, { bottom: 28, left: 10, fontSize: 10 }]}>🐠</Text>
    </>
  );
}

function StarDot({ style, size = 4 }: { style?: ViewStyle; size?: number }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          opacity: 0.85,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  canton: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#002868',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomRightRadius: 4,
  },
  cantonStars: {
    color: '#FFFFFF',
    fontSize: 7,
    lineHeight: 9,
    textAlign: 'center',
    letterSpacing: 1,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 12,
    zIndex: 2,
  },
  fairyGlow: {
    position: 'absolute',
    alignSelf: 'center',
    top: '22%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroPlateLines: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    gap: 4,
    opacity: 0.25,
  },
  heroLine: {
    height: 2,
    width: '85%',
    backgroundColor: '#FBBF24',
    borderRadius: 1,
  },
  arcRingOuter: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.55)',
  },
  arcRingInner: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  heroEmoji: {
    position: 'absolute',
    fontSize: 11,
    zIndex: 2,
  },
  galaxyEmoji: {
    position: 'absolute',
    fontSize: 11,
    zIndex: 2,
  },
  planet: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(167, 139, 250, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  rainbowShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
  },
  waveOne: {
    position: 'absolute',
    bottom: 24,
    left: -8,
    right: -8,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  waveTwo: {
    position: 'absolute',
    bottom: 16,
    left: -4,
    right: -4,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
