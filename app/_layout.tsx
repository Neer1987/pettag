import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
  CormorantGaramond_700Bold,
  CormorantGaramond_700Bold_Italic,
  useFonts as useCormorant,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  useFonts as useDMSans,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  useFonts as useJetBrains,
} from '@expo-google-fonts/jetbrains-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { SchemaMigrationBanner } from '@/components/schema-migration-banner';
import { NotificationRouter } from '@/components/notification-router';
import { PetLinkRouter } from '@/components/pet-link-router';
import { SupabaseSetupGate } from '@/components/supabase-setup-gate';
import { Colors } from '@/constants/theme';
import { AlertNotificationsProvider } from '@/contexts/alert-notifications-context';
import { ToastProvider } from '@/contexts/toast-context';
import { InboxProvider } from '@/contexts/inbox-context';
import { UserProvider } from '@/contexts/user-context';
import { ensureNotificationsReady } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [cormorantLoaded] = useCormorant({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    CormorantGaramond_700Bold,
    CormorantGaramond_700Bold_Italic,
  });
  const [dmLoaded] = useDMSans({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });
  const [monoLoaded] = useJetBrains({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const loaded = cormorantLoaded && dmLoaded && monoLoaded;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    void ensureNotificationsReady();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <SupabaseSetupGate>
      <UserProvider>
        <AlertNotificationsProvider>
          <InboxProvider>
            <ToastProvider>
            <SchemaMigrationBanner />
            <NotificationRouter />
            <PetLinkRouter />
            <View style={{ flex: 1, backgroundColor: Colors.cream }}>
              <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="add-pet" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="edit-pet" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="success" options={{ animation: 'fade' }} />
                <Stack.Screen name="qr-design" />
                <Stack.Screen name="preview-pet" />
                <Stack.Screen name="poster" options={{ animation: 'fade' }} />
                <Stack.Screen name="assign-qr-code" />
                <Stack.Screen name="order-tag" />
                <Stack.Screen name="order-tag-success" options={{ animation: 'fade' }} />
                <Stack.Screen name="pet/[slug]" />
                <Stack.Screen name="scan-qr" options={{ animation: 'fade' }} />
                <Stack.Screen name="message" />
              </Stack>
              <StatusBar style="auto" />
            </View>
            </ToastProvider>
          </InboxProvider>
        </AlertNotificationsProvider>
      </UserProvider>
    </SupabaseSetupGate>
  );
}
