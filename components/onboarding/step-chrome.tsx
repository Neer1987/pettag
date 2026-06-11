import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export function StepChrome({
  step,
  totalSteps,
  onBack,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
}) {
  const progress = `${Math.round((step / totalSteps) * 100)}%`;

  return (
    <>
      <View style={styles.topRow}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.stepNum}>
          Step {step} of {totalSteps}
        </Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.progRail}>
        <View style={[styles.progFill, { width: progress as `${number}%` }]} />
      </View>
    </>
  );
}

export function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.h1}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cream2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 15, color: Colors.ink2 },
  stepNum: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.gold, letterSpacing: 0.4 },
  spacer: { width: 38 },
  progRail: {
    height: 2,
    backgroundColor: Colors.line,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 2,
  },
  progFill: { height: '100%', borderRadius: 2, backgroundColor: Colors.forest },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  h1: {
    fontFamily: Fonts.serifItalic,
    fontSize: 32,
    color: Colors.ink,
    lineHeight: 38,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.mid,
    marginTop: 8,
    lineHeight: 24,
  },
});
