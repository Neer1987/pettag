import { StyleSheet, Text, TextStyle } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export function SectionLabel({ label, style }: { label: string; style?: TextStyle }) {
  return <Text style={[styles.label, style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: Colors.light,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
});
