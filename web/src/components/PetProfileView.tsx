import { ContactOwnerForm } from '@/components/ContactOwnerForm';
import { DownloadAppBanner } from '@/components/DownloadAppBanner';
import { MedicalRecordsSection } from '@/components/MedicalRecordsSection';
import type { PublicProfile } from '@/lib/types';
import { sanitizePetMedicalDisplay } from '@/lib/pet-medical';
import { displayWeight, speciesEmoji } from '@/lib/utils';

type PetProfileViewProps = {
  profile: PublicProfile;
};

export function PetProfileView({ profile }: PetProfileViewProps) {
  const { pet, owner } = profile;
  const photos = pet.media.filter((item) => item.type === 'photo');
  const microchipLabel = pet.microchip.trim() ? pet.microchip : 'Not registered';
  const ownerLocation = [owner.city, owner.state].filter(Boolean).join(', ') || owner.address;
  const medical = sanitizePetMedicalDisplay({
    notes: pet.notes,
    vaccinations: pet.vaccinations,
    allergies: pet.allergies,
  });

  return (
    <article className="pet-profile container">
      <header className="finder-bar">
        <p className="finder-bar__brand serif">PetTag</p>
        <h1 className="finder-bar__title">Found a pet?</h1>
        <p className="finder-bar__sub">
          You scanned a PetTag QR code. No app needed — view this profile in your browser. If you found this pet,
          scroll down to contact the owner with your <strong>phone, email, address</strong>, and we will attach your
          location when you send a message.
        </p>
      </header>

      {pet.isLost ? (
        <div className="lost-banner">
          <div className="lost-banner__row">
            <span className="blink-dot" aria-hidden />
            <h2 className="lost-banner__title">Lost pet — please help</h2>
          </div>
          <p className="lost-banner__sub">
            {pet.name} is missing. If you see this pet, contact the owner immediately.
          </p>
        </div>
      ) : null}

      <div className="hero">
        {pet.coverPhotoUri ? (
          <>
            <img src={pet.coverPhotoUri} alt={`${pet.name} cover photo`} />
            <div className="hero__overlay" />
          </>
        ) : (
          <span className="hero__emoji" aria-hidden>
            {speciesEmoji(pet.species)}
          </span>
        )}
      </div>

      <section className="card name-card">
        <h2 className="name-card__title serif">{pet.name}</h2>
        <p className="name-card__breed">{pet.breed || pet.species}</p>
        <div className="name-card__tags">
          {pet.age ? <span className="tag">{pet.age}</span> : null}
          {(pet.gender || pet.weight) && (
            <span className="tag">
              {[pet.gender, displayWeight(pet.weight)].filter((value) => value && value !== '—').join(' · ')}
            </span>
          )}
          {pet.markings.map((marking) => (
            <span key={marking} className="tag">
              {marking}
            </span>
          ))}
        </div>
      </section>

      {photos.length > 0 ? (
        <div className="gallery content-block">
          <div className="gallery__header">
            <span className="gallery__label">Photos</span>
            <span className="gallery__label">
              {photos.length} photo{photos.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="gallery__strip">
            {photos.map((item) => (
              <figure key={item.id} className="gallery__thumb">
                <img src={item.uri} alt={item.caption || `${pet.name} photo`} loading="lazy" />
                {item.caption ? <figcaption className="gallery__caption">{item.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </div>
      ) : null}

      <div className="stat-bar">
        {[
          { icon: '⚖️', val: displayWeight(pet.weight), lbl: 'Weight' },
          { icon: '🎨', val: pet.coat || '—', lbl: 'Coat' },
          { icon: '🏷️', val: microchipLabel, lbl: 'Microchip' },
          { icon: '🐾', val: pet.species, lbl: 'Species' },
        ].map((stat) => (
          <div key={stat.lbl} className="stat-pill">
            <span className="stat-pill__icon">{stat.icon}</span>
            <span className="stat-pill__val">{stat.val}</span>
            <span className="stat-pill__lbl">{stat.lbl}</span>
          </div>
        ))}
      </div>

      <MedicalRecordsSection medical={medical} />

      <p className="section-label content-block">Pet parent</p>
      <section className="card owner-card">
        <div className="owner-card__row">
          <div className="owner-card__avatar" aria-hidden>
            👤
          </div>
          <div>
            <div className="owner-card__badge">PET PARENT</div>
            <div className="owner-card__name">{owner.fullName}</div>
            <div className="owner-card__loc">📍 {ownerLocation || 'Location on file'}</div>
          </div>
        </div>
      </section>

      <p className="section-label content-block">Help reunite</p>
      <ContactOwnerForm pet={pet} owner={owner} />

      <p className="section-label content-block">For pet owners</p>
      <DownloadAppBanner pet={pet} />

      <p className="footer-note">Powered by PetTag · Secure pet identity</p>
    </article>
  );
}
