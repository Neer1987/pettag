import { Platform } from 'react-native';

export const Colors = {
  forest: '#0F2D1E',
  forest2: '#1A4A30',
  forest3: '#2C6444',
  sage: '#7AAB8A',
  sagePale: '#E8F2EC',
  gold: '#C8962A',
  goldPale: '#FBF4E6',
  cream: '#F8F5F0',
  cream2: '#F0EBE3',
  white: '#FFFFFF',
  ink: '#0F1B14',
  ink2: '#2D3D34',
  mid: '#5C7265',
  light: '#9CB5A4',
  line: '#E0EAE4',
  danger: '#C0392B',
  dangerPale: '#FDF0EE',
  success: '#1E7A4A',
  successPale: '#EAF5EE',
};

/** Legacy light/dark tokens for unused Expo template components */
export const ThemeColors = {
  light: {
    text: Colors.ink,
    background: Colors.cream,
    tint: Colors.forest,
    icon: Colors.mid,
    tabIconDefault: Colors.light,
    tabIconSelected: Colors.forest,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Fonts = {
  serif: 'CormorantGaramond_700Bold',
  serifItalic: 'CormorantGaramond_700Bold_Italic',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansLight: 'DMSans_300Light',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
};

export const Spacing = {
  screenPadding: 20,
};

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: Colors.forest,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: { elevation: 3 },
    default: {},
  }),
};
