import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAlertNotifications } from '@/contexts/alert-notifications-context';
import { useUser } from '@/contexts/user-context';
import {
  haversineKm,
  NEARBY_ALERT_RADIUS_KM,
  resolveLostCoordinates,
  type Coordinates,
} from '@/lib/geo';
import {
  profileToLostAlert,
  sortLostAlerts,
  formatReportedAt,
  type LostPetAlert,
} from '@/lib/lost-alerts';
import { fetchLostPets } from '@/lib/supabase/pets';

export function useLostPetAlerts() {
  const { pets } = useUser();
  const { viewerLocation } = useAlertNotifications();
  const [alerts, setAlerts] = useState<LostPetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchLostPets();
      const exclude = new Set(pets.map((pet) => pet.qrCodeId));

      const mapped = rows
        .filter(({ pet }) => !exclude.has(pet.qrCodeId))
        .filter((row) => isNearby(row, viewerLocation))
        .map(
          ({
            owner,
            pet,
            lostAt,
            lastSeenLocation,
            lostLatitude,
            lostLongitude,
            ownerLatitude,
            ownerLongitude,
          }) => {
            const petWithCoords = { ...pet, lostLatitude, lostLongitude };
            const target = resolveLostCoordinates(petWithCoords, {
              latitude: ownerLatitude,
              longitude: ownerLongitude,
            });
            const distanceKm =
              viewerLocation && target
                ? haversineKm(viewerLocation, target)
                : rowDistanceFallback(row, viewerLocation);

            return profileToLostAlert(owner, pet, {
              lastSeenLocation:
                lastSeenLocation ?? `${owner.address}, ${owner.city}`,
              reportedAt: formatReportedAt(lostAt),
              distanceKm,
            });
          },
        );

      setAlerts(sortLostAlerts(mapped));
    } catch (error) {
      console.error('Failed to load lost pet alerts', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [pets, viewerLocation]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { alerts, loading, refresh: load };
}

function isNearby(
  row: {
    lostLatitude: number | null;
    lostLongitude: number | null;
    ownerLatitude: number | null;
    ownerLongitude: number | null;
    pet: { lostLatitude?: number | null; lostLongitude?: number | null };
  },
  viewerLocation: Coordinates | null,
) {
  if (!viewerLocation) return true;

  const target = resolveLostCoordinates(
    {
      lostLatitude: row.lostLatitude ?? row.pet.lostLatitude,
      lostLongitude: row.lostLongitude ?? row.pet.lostLongitude,
    },
    { latitude: row.ownerLatitude, longitude: row.ownerLongitude },
  );

  if (!target) return true;

  return haversineKm(viewerLocation, target) <= NEARBY_ALERT_RADIUS_KM;
}

function rowDistanceFallback(
  row: {
    lostLatitude: number | null;
    lostLongitude: number | null;
    ownerLatitude: number | null;
    ownerLongitude: number | null;
    pet: { lostLatitude?: number | null; lostLongitude?: number | null };
  },
  viewerLocation: Coordinates | null,
) {
  const target = resolveLostCoordinates(
    {
      lostLatitude: row.lostLatitude ?? row.pet.lostLatitude,
      lostLongitude: row.lostLongitude ?? row.pet.lostLongitude,
    },
    { latitude: row.ownerLatitude, longitude: row.ownerLongitude },
  );

  if (viewerLocation && target) {
    return haversineKm(viewerLocation, target);
  }

  return NEARBY_ALERT_RADIUS_KM / 2;
}
