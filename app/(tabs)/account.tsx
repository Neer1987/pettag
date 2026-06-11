import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionLabel } from '@/components/ui/section-label';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useAlertNotifications } from '@/contexts/alert-notifications-context';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { useAppRefresh } from '@/hooks/use-app-refresh';
import { getErrorMessage } from '@/lib/errors';

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={[styles.toggle, on ? styles.toggleOn : styles.toggleOff]}>
      <View style={[styles.toggleKnob, on && styles.toggleKnobOn]} />
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { owner, pet, pets, logout } = useUser();
  const { alertsEnabled, setAlertsEnabled, viewerLocation, refreshLocation } = useAlertNotifications();
  const { refreshAll } = useAppRefresh();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  const displayName = owner?.fullName ?? 'Account';
  const displayEmail = owner?.email ?? '';
  const displayCity =
    owner?.city && owner?.state ? `${owner.city}, ${owner.state}` : owner?.city ?? '';
  const petName = pet?.name ?? 'Your pet';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={Colors.forest} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.hero, { paddingTop: insets.top + 22 }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        <SectionLabel label="My Pets" />
        <View style={styles.group}>
          {pets.map((entry, index) => (
            <Pressable
              key={entry.qrCodeId}
              style={[styles.item, index === pets.length - 1 && pets.length > 0 ? null : styles.itemLast]}
              onPress={() => router.push('/(tabs)/pets')}>
              <View style={[styles.itemIcon, { backgroundColor: Colors.sagePale }]}>
                <Text>{entry.species.toLowerCase().includes('cat') ? '🐈' : '🐕'}</Text>
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{entry.name}</Text>
                <Text style={styles.itemSub}>
                  {entry.breed}
                  {entry.qrCodeId === pet?.qrCodeId ? ' · Active profile' : ''}
                </Text>
              </View>
              <Text style={styles.itemArrow}>›</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.item, styles.itemLast]} onPress={() => router.push('/add-pet')}>
            <View style={[styles.itemIcon, { backgroundColor: Colors.goldPale }]}>
              <Text>＋</Text>
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>Add a pet</Text>
              <Text style={styles.itemSub}>Create a new profile</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </Pressable>
        </View>

        <SectionLabel label="QR Tag" />
        <View style={styles.group}>
          <Pressable style={styles.item} onPress={() => router.push('/qr-design')}>
            <View style={[styles.itemIcon, { backgroundColor: Colors.successPale }]}>
              <Text>📦</Text>
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>{petName}&apos;s tag</Text>
              <Text style={styles.itemSub}>Choose or change QR design</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={() => router.push('/assign-qr-code')}>
            <View style={[styles.itemIcon, { backgroundColor: '#e8f0ff' }]}>
              <Text>🔗</Text>
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>Custom QR code</Text>
              <Text style={styles.itemSub}>
                {pet?.qrCodeId ? `Current: ${pet.qrCodeId}` : 'Paste your tag code'}
              </Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </Pressable>
          <Pressable style={[styles.item, styles.itemLast]} onPress={() => router.push('/order-tag')}>
            <View style={[styles.itemIcon, { backgroundColor: Colors.cream2 }]}>
              <Text>🏷️</Text>
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>Order another tag</Text>
              <Text style={styles.itemSub}>Replacement or spare</Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </Pressable>
        </View>

        <SectionLabel label="Settings" />
        <View style={styles.group}>
          <Pressable
            style={styles.item}
            onPress={async () => {
              try {
                const next = !alertsEnabled;
                await setAlertsEnabled(next);
                showToast(
                  next
                    ? 'Nearby lost pet alerts enabled — allow location & notifications'
                    : 'Nearby lost pet alerts turned off',
                );
              } catch (err) {
                showToast(getErrorMessage(err, 'Could not update alert settings'));
              }
            }}>
            <View style={[styles.itemIcon, { backgroundColor: Colors.dangerPale }]}>
              <Text>🔔</Text>
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>Lost pet alerts</Text>
              <Text style={styles.itemSub}>
                {alertsEnabled
                  ? viewerLocation
                    ? 'Notify you when a pet is lost within 25 km'
                    : 'Tap to enable — location required for nearby alerts'
                  : 'Off — you will not receive nearby alerts'}
              </Text>
            </View>
            <Toggle on={alertsEnabled} />
          </Pressable>
          <Pressable
            style={[styles.item, styles.itemLast]}
            onPress={async () => {
              try {
                await refreshLocation();
                showToast(
                  viewerLocation
                    ? '📍 Location updated for nearby alerts'
                    : '📍 Allow location access to receive nearby alerts',
                );
              } catch (err) {
                showToast(getErrorMessage(err, 'Could not update location'));
              }
            }}>
            <View style={[styles.itemIcon, { backgroundColor: '#e8f0ff' }]}>
              <Text>📍</Text>
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>Update location</Text>
              <Text style={styles.itemSub}>
                {viewerLocation
                  ? `${displayCity || 'Location saved'} · used for nearby alerts`
                  : displayCity || 'Enable GPS for nearby lost pet notifications'}
              </Text>
            </View>
            <Text style={styles.itemArrow}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.group, { marginBottom: 20 }]}>
          <Pressable
            style={[styles.item, styles.itemLast]}
            onPress={async () => {
              await logout();
              router.replace('/');
            }}>
            <View style={[styles.itemIcon, { backgroundColor: Colors.dangerPale }]}>
              <Text>🚪</Text>
            </View>
            <Text style={[styles.itemTitle, { color: Colors.danger }]}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  hero: {
    backgroundColor: Colors.forest,
    height: 178,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 22,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.gold,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 32 },
  name: { fontFamily: Fonts.sansSemiBold, fontSize: 18, color: Colors.white },
  email: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  group: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    ...Shadows.card,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  itemLast: { borderBottomWidth: 0 },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1 },
  itemTitle: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.ink },
  itemSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.light, marginTop: 1 },
  itemArrow: { fontSize: 14, color: Colors.light },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: Colors.success },
  toggleOff: { backgroundColor: Colors.line },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
  },
  toggleKnobOn: { alignSelf: 'flex-end' },
});
