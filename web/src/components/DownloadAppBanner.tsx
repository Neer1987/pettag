import { getAndroidAppUrl, getDeepLinkUrl, getIosAppUrl, getWebBaseUrl } from '@/lib/supabase';
import type { PetProfile } from '@/lib/types';

type DownloadAppBannerProps = {
  pet?: PetProfile;
};

export function DownloadAppBanner({ pet }: DownloadAppBannerProps) {
  const iosUrl = getIosAppUrl();
  const androidUrl = getAndroidAppUrl();
  const deepLink = pet ? getDeepLinkUrl(pet.qrCodeId) : 'pettag://';
  const webUrl = getWebBaseUrl();

  return (
    <section className="card download-banner">
      <div className="download-banner__header">
        <span className="download-banner__icon" aria-hidden>
          📱
        </span>
        <div>
          <h2 className="download-banner__title serif">Get the PetTag app</h2>
          <p className="download-banner__sub">
            Pet owners manage profiles, lost pet alerts, inbox replies, and QR tags in the PetTag mobile app.
            Finders can always use this website — no download required.
          </p>
        </div>
      </div>

      <div className="download-banner__actions">
        <a className="btn btn-gold" href={iosUrl} target="_blank" rel="noreferrer">
          Download for iPhone
        </a>
        <a className="btn btn-secondary" href={androidUrl} target="_blank" rel="noreferrer">
          Get it on Android
        </a>
      </div>

      {pet ? (
        <p className="download-banner__hint">
          Already have PetTag installed?{' '}
          <a href={deepLink}>Open {pet.name}&apos;s profile in the app</a> or scan again with the in-app scanner.
        </p>
      ) : (
        <p className="download-banner__hint">
          Visit <a href={webUrl}>{webUrl.replace(/^https?:\/\//, '')}</a> to learn more.
        </p>
      )}
    </section>
  );
}
