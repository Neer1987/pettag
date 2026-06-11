import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { PetProfileView } from '@/components/PetProfileView';
import { DownloadAppBanner } from '@/components/DownloadAppBanner';
import { fetchPublicProfileByQrCode } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { PublicProfile } from '@/lib/types';

export function PetProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slug) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured()) {
        setError('This site is not configured yet. Set Supabase environment variables.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const resolved = await fetchPublicProfileByQrCode(slug);
        if (!cancelled) {
          setProfile(resolved);
          if (resolved?.pet.name) {
            document.title = `${resolved.pet.name} · PetTag`;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setError(err instanceof Error ? err.message : 'Unable to load profile');
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
      document.title = 'PetTag — Pet profiles';
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" aria-hidden />
        <p>Loading pet profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="not-found container">
        <div className="not-found__icon" aria-hidden>
          ⚠️
        </div>
        <h1 className="not-found__title serif">Unable to load profile</h1>
        <p className="not-found__sub">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="not-found container">
        <div className="not-found__icon" aria-hidden>
          🐾
        </div>
        <h1 className="not-found__title serif">Profile not found</h1>
        <p className="not-found__sub">
          This QR link may be invalid, or the owner has not published this profile yet.
        </p>
        <DownloadAppBanner />
        <Link className="btn btn-primary" to="/" style={{ marginTop: 20 }}>
          Learn about PetTag
        </Link>
      </div>
    );
  }

  return <PetProfileView profile={profile} />;
}
