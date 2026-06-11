import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type LostPetPushMessage = {
  pushToken: string;
  petName: string;
  distanceKm: number;
  petQrCodeId: string;
};

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 10) / 10} km away` : `${km.toFixed(1)} km away`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { messages } = (await req.json()) as { messages: LostPetPushMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payloads = messages
      .filter((m) => m.pushToken?.startsWith('ExponentPushToken['))
      .map((m) => ({
        to: m.pushToken,
        title: `🚨 LOST PET ALERT — ${m.petName}`,
        body: `${m.petName} is missing ${formatDistance(m.distanceKm)}. Tap to view alert and help reunite.`,
        data: {
          type: 'lost_pet_amber',
          petQrCodeId: m.petQrCodeId,
          petName: m.petName,
        },
        sound: 'lost_pet_alert.wav',
        priority: 'high',
        channelId: 'lost-pet-amber',
      }));

    const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payloads),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
