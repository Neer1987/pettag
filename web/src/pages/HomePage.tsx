import { Link } from 'react-router-dom';

import { DownloadAppBanner } from '@/components/DownloadAppBanner';
import { getWebBaseUrl } from '@/lib/supabase';

export function HomePage() {
  const webUrl = getWebBaseUrl();

  return (
    <main className="container not-found" style={{ minHeight: '100vh' }}>
      <div className="finder-bar" style={{ width: '100%', borderRadius: 20, marginBottom: 24 }}>
        <p className="finder-bar__brand serif">PetTag</p>
        <h1 className="finder-bar__title">Pet profiles for finders</h1>
        <p className="finder-bar__sub">
          Scan a pet&apos;s QR tag to open their profile here. This website is for people who find a pet — pet
          owners use the PetTag mobile app.
        </p>
      </div>

      <p className="not-found__sub">
        Open a profile link like <strong>{webUrl.replace(/^https?:\/\//, '')}/pet/your-code</strong> after scanning
        a tag.
      </p>

      <DownloadAppBanner />

      <p className="footer-note">Are you a pet owner? Download PetTag to create profiles and QR tags.</p>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="not-found container">
      <div className="not-found__icon" aria-hidden>
        🐾
      </div>
      <h1 className="not-found__title serif">Page not found</h1>
      <p className="not-found__sub">This page does not exist. Scan a PetTag QR code to open a pet profile.</p>
      <Link className="btn btn-primary" to="/">
        Go home
      </Link>
    </main>
  );
}
