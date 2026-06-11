import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Colors, Fonts } from '@/constants/theme';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
};

export function ErrorState({ message, onRetry, compact }: ErrorStateProps) {
  if (compact) {
    return (
      <Pressable style={styles.compact} onPress={onRetry}>
        <Text style={styles.compactText}>{message}</Text>
        {onRetry ? <Text style={styles.compactAction}>Tap to retry</Text> : null}
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Button label="Try again" variant="forest" onPress={onRetry} style={styles.btn} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  icon: { fontSize: 40, marginBottom: 12 },
  title: {
    fontFamily: Fonts.serifItalic,
    fontSize: 22,
    color: Colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    lineHeight: 22,
    textAlign: 'center',
  },
  btn: { marginTop: 20, alignSelf: 'stretch' },
  compact: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.dangerPale,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.15)',
  },
  compactText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 20,
  },
  compactAction: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.forest,
    marginTop: 6,
  },
});
