import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export function HomeCtaButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.eyebrow}>You&apos;re all set</Text>
          <Text style={styles.label}>Go to Home</Text>
        </View>
        <View style={styles.arrowCircle}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: Colors.forest,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(200,150,42,0.35)',
    shadowColor: Colors.forest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    gap: 2,
  },
  eyebrow: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    color: Colors.white,
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: Colors.forest,
    fontFamily: Fonts.sansSemiBold,
    marginTop: -1,
  },
});
