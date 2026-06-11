import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useUser } from '@/contexts/user-context';
import type { Coordinates } from '@/lib/geo';
import { getCurrentCoordinates } from '@/lib/location';
import {
  getExpoPushToken,
  requestNotificationPermission,
  setBadgeCount,
  showLostPetAmberNotification,
} from '@/lib/notifications';
import * as Notifications from 'expo-notifications';
import {
  fetchAlertNotifications,
  markAllAlertNotificationsRead,
  type AlertNotificationRow,
} from '@/lib/supabase/alerts';
import {
  updateOwnerAlertsEnabled,
  updateOwnerLocation,
  updateOwnerPushToken,
  fetchOwnerByEmail,
} from '@/lib/supabase/owners';
import { getErrorMessage, logAppError } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getMissingSchemaMessage, isMissingSchemaError } from '@/lib/supabase/errors';

const NOTIFIED_KEY = '@pettag/notified_alert_ids';

type AlertNotificationsContextValue = {
  viewerLocation: Coordinates | null;
  alertsEnabled: boolean;
  unreadCount: number;
  notifications: AlertNotificationRow[];
  refreshLocation: () => Promise<void>;
  setAlertsEnabled: (enabled: boolean) => Promise<void>;
  markAlertsSeen: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
};

const AlertNotificationsContext = createContext<AlertNotificationsContextValue>({
  viewerLocation: null,
  alertsEnabled: true,
  unreadCount: 0,
  notifications: [],
  refreshLocation: async () => {},
  setAlertsEnabled: async () => {},
  markAlertsSeen: async () => {},
  refreshNotifications: async () => {},
});

async function loadNotifiedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

async function saveNotifiedIds(ids: Set<string>) {
  const trimmed = [...ids].slice(-100);
  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(trimmed));
}

export function AlertNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { owner, isLoggedIn } = useUser();
  const [viewerLocation, setViewerLocation] = useState<Coordinates | null>(null);
  const [alertsEnabled, setAlertsEnabledState] = useState(true);
  const [notifications, setNotifications] = useState<AlertNotificationRow[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());
  const email = owner?.email?.trim().toLowerCase();

  const unreadCount = useMemo(
    () => notifications.filter((row) => !row.read).length,
    [notifications],
  );

  const notifyForNewRows = useCallback(async (rows: AlertNotificationRow[]) => {
    const notified = notifiedRef.current;

    for (const row of rows) {
      if (row.read || notified.has(row.id)) continue;

      notified.add(row.id);

      // Foreground fallback with sound when push has not fired yet.
      if (AppState.currentState === 'active') {
        await showLostPetAmberNotification({
          petName: row.pet_name,
          distanceKm: row.distance_km,
          petQrCodeId: row.pet_qr_code_id,
        });
      }
    }

    await saveNotifiedIds(notified);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!email || !isLoggedIn || !isSupabaseConfigured()) {
      setNotifications([]);
      return;
    }

    try {
      const rows = await fetchAlertNotifications(email);
      setNotifications(rows);
      await notifyForNewRows(rows);
      await setBadgeCount(rows.filter((row) => !row.read).length);
    } catch (error) {
      if (isMissingSchemaError(error)) {
        console.warn(getMissingSchemaMessage(error));
        setNotifications([]);
      } else {
        logAppError('alerts.refreshNotifications', error);
      }
    }
  }, [email, isLoggedIn, notifyForNewRows]);

  const refreshLocation = useCallback(async () => {
    if (!email || !isLoggedIn) return;

    const coords = await getCurrentCoordinates();
    if (!coords) return;

    setViewerLocation(coords);
    try {
      await updateOwnerLocation(email, coords);
    } catch (error) {
      if (isMissingSchemaError(error)) {
        console.warn(getMissingSchemaMessage(error));
      } else {
        throw error;
      }
    }
  }, [email, isLoggedIn]);

  const setupPermissionsAndLocation = useCallback(async () => {
    if (!email || !isLoggedIn) return;

    try {
      await requestNotificationPermission();
      const token = await getExpoPushToken();
      if (token) {
        await updateOwnerPushToken(email, token);
      }
      await refreshLocation();
    } catch (error) {
      if (isMissingSchemaError(error)) {
        console.warn(getMissingSchemaMessage(error));
      } else {
        console.error('Alert setup failed', error);
      }
    }
  }, [email, isLoggedIn, refreshLocation]);

  const setAlertsEnabled = useCallback(
    async (enabled: boolean) => {
      setAlertsEnabledState(enabled);
      if (!email) return;
      await updateOwnerAlertsEnabled(email, enabled);
      if (enabled) {
        await setupPermissionsAndLocation();
      }
    },
    [email, setupPermissionsAndLocation],
  );

  const markAlertsSeen = useCallback(async () => {
    if (!email) return;
    await markAllAlertNotificationsRead(email);
    setNotifications((prev) => prev.map((row) => ({ ...row, read: true })));
    await setBadgeCount(0);
  }, [email]);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => {
      void refreshNotifications();
    });

    return () => received.remove();
  }, [refreshNotifications]);

  useEffect(() => {
    void loadNotifiedIds().then((ids) => {
      notifiedRef.current = ids;
    });
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !email) {
      setViewerLocation(null);
      setNotifications([]);
      return;
    }

    void setupPermissionsAndLocation();
    void refreshNotifications();

    void fetchOwnerByEmail(email).then((row) => {
      if (!row) return;
      setAlertsEnabledState(row.alerts_enabled ?? true);
      if (row.latitude != null && row.longitude != null) {
        setViewerLocation({ latitude: row.latitude, longitude: row.longitude });
      }
    });

    const interval = setInterval(() => {
      void refreshLocation();
      void refreshNotifications();
    }, 45000);

    return () => clearInterval(interval);
  }, [email, isLoggedIn, refreshLocation, refreshNotifications, setupPermissionsAndLocation]);

  useEffect(() => {
    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active' && isLoggedIn && email) {
        void refreshLocation();
        void refreshNotifications();
      }
    };

    const sub = AppState.addEventListener('change', onStateChange);
    return () => sub.remove();
  }, [email, isLoggedIn, refreshLocation, refreshNotifications]);

  useEffect(() => {
    void setBadgeCount(unreadCount);
  }, [unreadCount]);

  const value = useMemo(
    () => ({
      viewerLocation,
      alertsEnabled,
      unreadCount,
      notifications,
      refreshLocation,
      setAlertsEnabled,
      markAlertsSeen,
      refreshNotifications,
    }),
    [
      alertsEnabled,
      markAlertsSeen,
      notifications,
      refreshLocation,
      refreshNotifications,
      setAlertsEnabled,
      unreadCount,
      viewerLocation,
    ],
  );

  return (
    <AlertNotificationsContext.Provider value={value}>{children}</AlertNotificationsContext.Provider>
  );
}

export function useAlertNotifications() {
  return useContext(AlertNotificationsContext);
}
