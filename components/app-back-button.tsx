import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Shadows } from '@/constants/theme';

type AppBackButtonProps = {
  label?: string;
  fallbackHref?: Href;
  variant?: 'pill' | 'icon' | 'text';
  light?: boolean;
};

export function goBackToApp(fallbackHref: Href = '/(tabs)/') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallbackHref);
}

export function AppBackButton({
  label = 'Back',
  fallbackHref = '/(tabs)/',
  variant = 'pill',
  light = false,
}: AppBackButtonProps) {
  const onPress = () => goBackToApp(fallbackHref);

  if (variant === 'text') {
    return (
      <Pressable style={styles.textBtn} onPress={onPress} accessibilityLabel={label}>
        <Text style={[styles.textLabel, light && styles.textLabelLight]}>← {label}</Text>
      </Pressable>
    );
  }

  if (variant === 'icon') {
    return (
      <Pressable
        style={[styles.iconBtn, light && styles.iconBtnLight]}
        onPress={onPress}
        accessibilityLabel={label}>
        <Text style={[styles.iconLabel, light && styles.iconLabelLight]}>←</Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.pillBtn, light && styles.pillBtnLight]} onPress={onPress} accessibilityLabel={label}>
      <Text style={[styles.pillLabel, light && styles.pillLabelLight]}>← {label}</Text>
    </Pressable>
  );
}

export function AppBackHeader({
  title,
  fallbackHref = '/(tabs)/',
  light = false,
}: {
  title?: string;
  fallbackHref?: Href;
  light?: boolean;
}) {
  return (
    <View style={styles.headerRow}>
      <AppBackButton fallbackHref={fallbackHref} variant="icon" light={light} />
      {title ? <Text style={[styles.headerTitle, light && styles.headerTitleLight]}>{title}</Text> : null}
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  pillBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  pillBtnLight: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pillLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.forest,
  },
  pillLabelLight: {
    color: Colors.white,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  iconBtnLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  iconLabel: {
    fontSize: 18,
    color: Colors.forest,
  },
  iconLabelLight: {
    color: Colors.white,
  },
  textBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  textLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.forest,
  },
  textLabelLight: {
    color: Colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.ink,
    textAlign: 'center',
  },
  headerTitleLight: {
    color: Colors.white,
  },
  headerSpacer: {
    width: 42,
  },
});
