/** Default radius for nearby lost pet alerts (km). */
export const NEARBY_ALERT_RADIUS_KM = 25;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function haversineKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isWithinRadius(
  viewer: Coordinates,
  target: Coordinates,
  radiusKm = NEARBY_ALERT_RADIUS_KM,
): boolean {
  return haversineKm(viewer, target) <= radiusKm;
}

export function resolveLostCoordinates(
  pet: { lostLatitude?: number | null; lostLongitude?: number | null },
  owner: { latitude?: number | null; longitude?: number | null },
): Coordinates | null {
  if (pet.lostLatitude != null && pet.lostLongitude != null) {
    return { latitude: pet.lostLatitude, longitude: pet.lostLongitude };
  }
  if (owner.latitude != null && owner.longitude != null) {
    return { latitude: owner.latitude, longitude: owner.longitude };
  }
  return null;
}
