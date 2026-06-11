import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { REQUIRED_MIGRATIONS } from '@/lib/supabase/errors';
import { verifyDatabaseSchema } from '@/lib/supabase/schema-check';

export function SchemaMigrationBanner() {
  const insets = useSafeAreaInsets();
  const [schemaOk, setSchemaOk] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setChecking(true);
      const ok = await verifyDatabaseSchema();
      if (!cancelled) {
        setSchemaOk(ok);
        setChecking(false);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking || schemaOk) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Database migration required</Text>
      <Text style={styles.body}>
        Supabase returned error PGRST204 — new columns/tables are missing. Run these SQL files in order
        in the Supabase SQL Editor:
      </Text>
      {REQUIRED_MIGRATIONS.map((file) => (
        <Text key={file} style={styles.file}>
          supabase/migrations/{file}
        </Text>
      ))}
      <Pressable style={styles.btn} onPress={() => void verifyDatabaseSchema().then(setSchemaOk)}>
        <Text style={styles.btnText}>I ran the migrations — check again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 100,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.white,
    marginBottom: 6,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 8,
  },
  file: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.white,
    marginBottom: 2,
  },
  btn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    color: Colors.white,
  },
});
