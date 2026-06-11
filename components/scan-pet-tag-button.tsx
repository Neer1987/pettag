import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Shadows } from '@/constants/theme';
import { openPetQrScanner } from '@/lib/pet-link';

type ScanPetTagButtonProps = {
  label?: string;
  sub?: string;
  compact?: boolean;
};

export function ScanPetTagButton({
  label = 'Scan PetTag QR',
  sub = 'Found a pet? Scan their tag to open the profile in this app.',
  compact,
}: ScanPetTagButtonProps) {
  return (
    <Pressable
      style={[styles.card, compact && styles.cardCompact]}
      onPress={openPetQrScanner}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>📷</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {!compact ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      <Text style={styles.chevron}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  cardCompact: {
    paddingVertical: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  copy: { flex: 1 },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.ink },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mid,
    marginTop: 4,
    lineHeight: 18,
  },
  chevron: { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.forest },
});
