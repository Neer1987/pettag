import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type TagVariant = 'neutral' | 'success' | 'danger' | 'accent';

const variantStyles: Record<TagVariant, { bg: string; color: string }> = {
  neutral: { bg: Colors.cream2, color: Colors.mid },
  success: { bg: Colors.successPale, color: Colors.success },
  danger: { bg: Colors.dangerPale, color: Colors.danger },
  accent: { bg: Colors.goldPale, color: Colors.gold },
};

export function Tag({
  label,
  variant = 'neutral',
  style,
}: {
  label: string;
  variant?: TagVariant;
  style?: ViewStyle;
}) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.tag, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
  },
});
