import { useEffect, useState } from 'react';

import type { OwnerProfile, PetProfile } from '@/contexts/user-context';
import { fetchPublicProfileByQrCode } from '@/lib/supabase/pets';

type ResolvedPublicProfile = {
  owner: OwnerProfile;
  pet: PetProfile;
};

export function useResolvedPublicProfile(qrCodeId: string | undefined) {
  const [profile, setProfile] = useState<ResolvedPublicProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(qrCodeId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!qrCodeId) {
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resolved = await fetchPublicProfileByQrCode(qrCodeId);
        if (!cancelled) {
          setProfile(resolved);
        }
      } catch (err) {
        console.error('Failed to load public profile', err);
        if (!cancelled) {
          setProfile(null);
          setError('Unable to load profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [qrCodeId]);

  return { profile, loading, error };
}
