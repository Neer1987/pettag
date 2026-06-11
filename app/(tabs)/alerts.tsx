import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton, goBackToApp } from '@/components/app-back-button';
import { ScanPetTagButton } from '@/components/scan-pet-tag-button';
import { LostPetAlertDetail } from '@/components/lost-pet-alert-detail';
import { BlinkDot } from '@/components/blink-dot';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useAlertNotifications } from '@/contexts/alert-notifications-context';
import { useAppRefresh } from '@/hooks/use-app-refresh';
import { useLostPetAlerts } from '@/hooks/use-lost-pet-alerts';
import type { LostPetAlert } from '@/lib/lost-alerts';

export default function LostAlertScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { alerts, refresh: refreshAlerts } = useLostPetAlerts();
  const { markAlertsSeen, viewerLocation } = useAlertNotifications();
  const { refreshAll } = useAppRefresh();
  const [index, setIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<LostPetAlert>>(null);

  useFocusEffect(
    useCallback(() => {
      void markAlertsSeen();
    }, [markAlertsSeen]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
      await refreshAlerts();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAlerts, refreshAll]);

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={Colors.forest} />
  );

  const safeIndex = alerts.length ? Math.min(index, alerts.length - 1) : 0;
  const current = alerts[safeIndex];

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (alerts.length === 0) return;
      const clamped = Math.max(0, Math.min(alerts.length - 1, nextIndex));
      setIndex(clamped);
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
    },
    [alerts.length],
  );

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  if (alerts.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.emptyHeader, { paddingTop: insets.top + 8 }]}>
          <AppBackButton label="Back to app" fallbackHref="/(tabs)/" />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyTitle}>All clear nearby</Text>
          <Text style={styles.emptySub}>
            {viewerLocation
              ? 'No lost pets have been reported within 25 km of you.'
              : 'Enable location in Account → Lost pet alerts to receive nearby notifications.'}
          </Text>
          <Pressable style={styles.refreshLink} onPress={() => void handleRefresh()}>
            <Text style={styles.refreshLinkText}>Pull down or tap to refresh</Text>
          </Pressable>
          <View style={styles.scanWrap}>
            <ScanPetTagButton
              label="Scan a pet tag"
              sub="Have PetTag? Scan the QR on a collar to open the profile here in the app."
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <AppBackButton label="Back to app" fallbackHref="/(tabs)/" />

        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerEyebrow}>Nearby</Text>
            <Text style={styles.headerTitle}>Lost Pet Alerts</Text>
          </View>
          <View style={styles.counterPill}>
            <BlinkDot color={Colors.danger} style={styles.counterDot} />
            <Text style={styles.counterText}>
              {safeIndex + 1} of {alerts.length}
            </Text>
          </View>
        </View>

        <View style={styles.navRow}>
          <Pressable
            style={[styles.navBtn, safeIndex === 0 && styles.navBtnDisabled]}
            onPress={() => goToIndex(safeIndex - 1)}
            disabled={safeIndex === 0}>
            <Text style={[styles.navBtnText, safeIndex === 0 && styles.navBtnTextDisabled]}>← Prev</Text>
          </Pressable>

          <View style={styles.dots}>
            {alerts.map((alert, dotIndex) => (
              <Pressable
                key={alert.id}
                onPress={() => goToIndex(dotIndex)}
                style={[styles.dot, dotIndex === safeIndex && styles.dotActive]}
                accessibilityLabel={`Alert ${dotIndex + 1}, ${alert.petName}`}
              />
            ))}
          </View>

          <Pressable
            style={[styles.navBtn, safeIndex === alerts.length - 1 && styles.navBtnDisabled]}
            onPress={() => goToIndex(safeIndex + 1)}
            disabled={safeIndex === alerts.length - 1}>
            <Text
              style={[
                styles.navBtnText,
                safeIndex === alerts.length - 1 && styles.navBtnTextDisabled,
              ]}>
              Next →
            </Text>
          </Pressable>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item, index: chipIndex }) => (
            <Pressable
              style={[styles.chip, chipIndex === safeIndex && styles.chipActive]}
              onPress={() => goToIndex(chipIndex)}>
              <Text style={[styles.chipText, chipIndex === safeIndex && styles.chipTextActive]}>
                {item.petName}
              </Text>
              <Text style={[styles.chipDistance, chipIndex === safeIndex && styles.chipDistanceActive]}>
                {item.distanceKm < 1 ? `${Math.round(item.distanceKm * 10) / 10} km` : `${item.distanceKm.toFixed(1)} km`}
              </Text>
            </Pressable>
          )}
        />

        <Text style={styles.swipeHint}>Swipe alerts · pull down on detail to refresh</Text>
        <View style={styles.scanWrapCompact}>
          <ScanPetTagButton
            compact
            label="Scan pet QR tag"
            sub="Open a found pet’s profile in PetTag"
          />
        </View>
      </View>

      <View style={styles.pagerWrap}>
        <FlatList
          ref={listRef}
          style={styles.pager}
          data={alerts}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
          renderItem={({ item }) => (
            <LostPetAlertDetail alert={item} width={width} refreshControl={refreshControl} />
          )}
          initialScrollIndex={safeIndex}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 100);
          }}
        />
      </View>

      {current ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.footerText}>
            Active alert: <Text style={styles.footerName}>{current.petName}</Text> · {current.reportedAt}
          </Text>
        </View>
      ) : null}

      <View style={[styles.floatingBack, { top: insets.top + 8 }]}>
        <Pressable style={styles.floatingBackBtn} onPress={() => goBackToApp('/(tabs)/')}>
          <Text style={styles.floatingBackText}>← Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  emptyHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    ...Shadows.card,
    zIndex: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 14,
  },
  headerEyebrow: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.danger,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: { fontFamily: Fonts.serifItalic, fontSize: 28, color: Colors.ink },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dangerPale,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  counterDot: { width: 6, height: 6, borderRadius: 3 },
  counterText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.danger },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 64,
  },
  navBtnDisabled: { opacity: 0.35 },
  navBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.forest },
  navBtnTextDisabled: { color: Colors.light },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.line,
  },
  dotActive: { width: 18, backgroundColor: Colors.danger },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    backgroundColor: Colors.cream2,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Colors.dangerPale,
    borderColor: Colors.danger,
  },
  chipText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },
  chipTextActive: { color: Colors.danger },
  chipDistance: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.light, marginTop: 1 },
  chipDistanceActive: { color: Colors.danger },
  swipeHint: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.light,
    textAlign: 'center',
    marginTop: 8,
  },
  pagerWrap: { flex: 1 },
  pager: { flex: 1 },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  footerText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mid, textAlign: 'center' },
  footerName: { fontFamily: Fonts.sansSemiBold, color: Colors.ink },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.serifItalic, fontSize: 28, color: Colors.ink, marginBottom: 8 },
  emptySub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshLink: { marginTop: 20, paddingVertical: 10 },
  refreshLinkText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.forest },
  scanWrap: { marginTop: 18, width: '100%' },
  scanWrapCompact: { marginTop: 12 },
  floatingBack: {
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  floatingBackBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  floatingBackText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.forest,
  },
});
