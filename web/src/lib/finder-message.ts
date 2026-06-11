export type FinderLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export async function getFinderLocation(): Promise<FinderLocation | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export function formatMapsLink(location: FinderLocation): string {
  return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
}

export function buildFinderMessageBody(input: {
  userMessage: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  location: FinderLocation | null;
}): string {
  const parts = [input.userMessage.trim(), '', '—— Finder contact (for pet owner) ——'];

  parts.push(`Name: ${input.senderName.trim()}`);
  parts.push(`Email: ${input.senderEmail.trim()}`);
  parts.push(`Phone: ${input.senderPhone.trim()}`);
  parts.push(`Address: ${input.senderAddress.trim()}`);

  if (input.location) {
    const { latitude, longitude, accuracy } = input.location;
    parts.push(
      `GPS when sent: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      `Open in maps: ${formatMapsLink(input.location)}`,
    );
    if (accuracy != null) {
      parts.push(`Location accuracy: ~${Math.round(accuracy)} meters`);
    }
  } else {
    parts.push('GPS when sent: unavailable (location permission was blocked or timed out)');
  }

  return parts.join('\n');
}

export function foundPetMessageTemplate(petName: string): string {
  return `Hi! I believe I found ${petName}. They appear safe. I can help reunite you — details are in the form below.`;
}
