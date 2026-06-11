import { useCallback } from 'react';

import { useAlertNotifications } from '@/contexts/alert-notifications-context';
import { useInbox } from '@/contexts/inbox-context';
import { useUser } from '@/contexts/user-context';
import { useLostPetAlerts } from '@/hooks/use-lost-pet-alerts';

/** Pull-to-refresh: reload pets, inbox, alerts, and location from Supabase. */
export function useAppRefresh() {
  const { isLoggedIn, refreshProfile } = useUser();
  const { refresh: refreshInbox } = useInbox();
  const { refreshNotifications, refreshLocation } = useAlertNotifications();
  const { refresh: refreshAlerts } = useLostPetAlerts();

  const refreshAll = useCallback(async () => {
    const tasks: Promise<unknown>[] = [refreshAlerts()];

    if (isLoggedIn) {
      tasks.push(refreshProfile());
      tasks.push(refreshInbox());
      tasks.push(refreshNotifications());
      tasks.push(refreshLocation());
    }

    await Promise.allSettled(tasks);
  }, [isLoggedIn, refreshAlerts, refreshInbox, refreshLocation, refreshNotifications, refreshProfile]);

  return { refreshAll };
}
