import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type ButtonVariant = 'forest' | 'gold' | 'danger' | 'ghost';

const variants: Record<ButtonVariant, { bg: string; color: string; border?: string }> = {
  forest: { bg: Colors.forest, color: Colors.white },
  gold: { bg: Colors.gold, color: Colors.forest },
  danger: { bg: Colors.danger, color: Colors.white },
  ghost: { bg: 'transparent', color: Colors.mid, border: Colors.line },
};

export function Button({
  label,
  onPress,
  variant = 'forest',
  style,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const v = variants[variant];
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      onPress={onPress}>
      <Text style={[styles.label, { color: v.color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
