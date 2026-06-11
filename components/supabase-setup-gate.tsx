import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const STEPS = [
  'Create a project at supabase.com',
  'Copy .env.example to .env and paste your Project URL + anon key',
  'Run all SQL migrations in supabase/migrations/ (001 → 004) in the SQL Editor',
  'Restart Expo (npx expo start -c)',
];

export function SupabaseSetupGate({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  if (isSupabaseConfigured()) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.icon}>🗄️</Text>
        <Text style={styles.title}>Connect Supabase</Text>
        <Text style={styles.subtitle}>
          PetTag stores owners, pets, messages, and media in Supabase. Add your project credentials to
          continue.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Required environment variables</Text>
          <Text style={styles.mono}>EXPO_PUBLIC_SUPABASE_URL</Text>
          <Text style={styles.mono}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
          <Text style={styles.hint}>Optional: EXPO_PUBLIC_WEB_URL for QR links in dev</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Setup steps</Text>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <Text style={styles.stepNum}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Test OTP during development: <Text style={styles.footerBold}>123456</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.forest,
    paddingHorizontal: 24,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 320,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.gold,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.white,
    marginBottom: 6,
  },
  hint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  stepNum: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.forest,
    backgroundColor: Colors.gold,
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  footer: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 24,
    textAlign: 'center',
  },
  footerBold: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.gold,
  },
});
