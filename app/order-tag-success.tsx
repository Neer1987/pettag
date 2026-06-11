import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { formatOrderId } from '@/lib/tag-orders';

export default function OrderTagSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { orderId, petName, quantity, designName, total } = useLocalSearchParams<{
    orderId?: string;
    petName?: string;
    quantity?: string;
    designName?: string;
    total?: string;
  }>();

  const shortId = orderId ? formatOrderId(orderId) : '—';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style="dark" />
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.title}>Order received</Text>
      <Text style={styles.sub}>
        We&apos;re preparing {quantity ?? '1'} {designName ?? 'PetTag'} tag
        {petName ? ` for ${petName}` : ''}. You&apos;ll get a confirmation email shortly.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Order number</Text>
        <Text style={styles.cardValue}>{shortId}</Text>
        {total ? (
          <>
            <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Total</Text>
            <Text style={styles.cardValue}>{total}</Text>
          </>
        ) : null}
        <Text style={styles.cardNote}>Estimated delivery: 5–7 business days</Text>
      </View>

      <View style={styles.actions}>
        <Button label="Back to Account" variant="forest" onPress={() => router.replace('/(tabs)/account')} />
        <Button label="View my pets" variant="ghost" onPress={() => router.replace('/(tabs)/pets')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 72,
    height: 72,
    lineHeight: 72,
    textAlign: 'center',
    fontSize: 34,
    color: Colors.white,
    backgroundColor: Colors.forest,
    borderRadius: 36,
    overflow: 'hidden',
    marginBottom: 20,
  },
  title: { fontFamily: Fonts.serifItalic, fontSize: 32, color: Colors.ink, textAlign: 'center' },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cardLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.light,
  },
  cardLabelSpaced: { marginTop: 14 },
  cardValue: { fontFamily: Fonts.sansSemiBold, fontSize: 20, color: Colors.ink, marginTop: 4 },
  cardNote: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mid, marginTop: 16 },
  actions: { width: '100%', marginTop: 24, gap: 10 },
});
