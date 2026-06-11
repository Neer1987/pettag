import { useEffect, useMemo, useState } from 'react';

import { sendFinderMessage } from '@/lib/api';
import { buildFinderMessageBody, getFinderLocation } from '@/lib/finder-message';
import type { OwnerProfile, PetProfile } from '@/lib/types';
import { foundPetMessageTemplate } from '@/lib/utils';

type ContactOwnerFormProps = {
  pet: PetProfile;
  owner: OwnerProfile;
};

type LocationStatus = 'idle' | 'ready' | 'denied' | 'unsupported';

export function ContactOwnerForm({ pet, owner }: ContactOwnerFormProps) {
  const initialBody = useMemo(
    () => (pet.isLost ? foundPetMessageTemplate(pet.name) : ''),
    [pet.isLost, pet.name],
  );

  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [body, setBody] = useState(initialBody);
  const [submitting, setSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((result) => {
        if (result.state === 'granted') setLocationStatus('ready');
        if (result.state === 'denied') setLocationStatus('denied');
      })
      .catch(() => {
        // Permissions API not available in all browsers.
      });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!senderName.trim() || !body.trim()) {
      setStatus({ type: 'error', message: 'Please enter your name and message.' });
      return;
    }

    if (!senderEmail.trim()) {
      setStatus({ type: 'error', message: 'Please enter your email address.' });
      return;
    }

    if (!senderPhone.trim()) {
      setStatus({ type: 'error', message: 'Please enter your phone number so the owner can call you.' });
      return;
    }

    if (!senderAddress.trim()) {
      setStatus({ type: 'error', message: 'Please enter your address or where you are with the pet.' });
      return;
    }

    setSubmitting(true);
    try {
      const location = await getFinderLocation();
      if (location) {
        setLocationStatus('ready');
      } else if (locationStatus !== 'unsupported') {
        setLocationStatus('denied');
      }

      const fullBody = buildFinderMessageBody({
        userMessage: body,
        senderName,
        senderEmail,
        senderPhone,
        senderAddress,
        location,
      });

      await sendFinderMessage({
        recipientEmail: owner.email,
        petName: pet.name,
        petSlug: pet.qrCodeId,
        senderName,
        senderEmail,
        body: fullBody,
        isFoundPet: pet.isLost,
      });

      const locationNote = location
        ? ' Your GPS location was attached automatically.'
        : ' Location was not shared — the owner still received your contact details.';

      setStatus({
        type: 'success',
        message: pet.isLost
          ? `Alert sent — ${owner.fullName.split(' ')[0] || 'the owner'} will be notified in PetTag.${locationNote}`
          : `Message sent to the pet parent.${locationNote}`,
      });

      if (!pet.isLost) {
        setBody('');
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to send message. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card contact-form">
      <h2 className="contact-form__title serif">
        {pet.isLost ? `Found ${pet.name}? Contact the owner` : `Message ${owner.fullName.split(' ')[0] || 'pet parent'}`}
      </h2>

      <div className="finder-instructions" role="note">
        <p className="finder-instructions__title">Important — please include all of the following</p>
        <ul className="finder-instructions__list">
          <li>
            <strong>Your phone number</strong> so the owner can call you right away
          </li>
          <li>
            <strong>Your email</strong> so they can reply in the PetTag app
          </li>
          <li>
            <strong>Your address</strong> or the exact place you are with the pet (street, city, landmarks)
          </li>
          <li>
            <strong>Your location</strong> — we will try to attach GPS automatically when you send (allow location
            if your browser asks)
          </li>
        </ul>
        <p className="finder-instructions__footer">
          The pet owner needs this information to know <strong>who found their pet</strong> and{' '}
          <strong>where to meet you</strong>.
        </p>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)}>
        <div className="field">
          <label htmlFor="sender-name">
            Your name <span className="field-required">*</span>
          </label>
          <input
            id="sender-name"
            value={senderName}
            onChange={(event) => setSenderName(event.target.value)}
            placeholder="e.g. Alex Morgan"
            autoComplete="name"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="sender-email">
            Your email <span className="field-required">*</span>
          </label>
          <input
            id="sender-email"
            type="email"
            value={senderEmail}
            onChange={(event) => setSenderEmail(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="sender-phone">
            Your phone number <span className="field-required">*</span>
          </label>
          <input
            id="sender-phone"
            type="tel"
            value={senderPhone}
            onChange={(event) => setSenderPhone(event.target.value)}
            placeholder="e.g. (555) 123-4567"
            autoComplete="tel"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="sender-address">
            Your address / where you are with the pet <span className="field-required">*</span>
          </label>
          <input
            id="sender-address"
            value={senderAddress}
            onChange={(event) => setSenderAddress(event.target.value)}
            placeholder="e.g. 123 Oak St, Austin — or 'Near Central Park playground'"
            autoComplete="street-address"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="message-body">
            Message <span className="field-required">*</span>
          </label>
          <textarea
            id="message-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Describe where and when you found the pet, how they seem, and anything that helps the owner..."
            required
          />
        </div>

        <div className="location-note" aria-live="polite">
          {locationStatus === 'ready' ? (
            <span>📍 Location permission granted — GPS will be added when you send.</span>
          ) : locationStatus === 'denied' ? (
            <span>
              📍 Location blocked. You can still send — include your address above. Enable location in browser
              settings for automatic GPS.
            </span>
          ) : locationStatus === 'unsupported' ? (
            <span>📍 GPS not supported in this browser — your typed address will be used.</span>
          ) : (
            <span>📍 When you send, we will ask to attach your GPS location for the pet owner.</span>
          )}
        </div>

        {status ? <div className={`alert alert-${status.type}`}>{status.message}</div> : null}

        <button className="btn btn-primary contact-form__submit" type="submit" disabled={submitting}>
          {submitting ? 'Sending & attaching location…' : pet.isLost ? 'Send found-pet alert' : 'Send message'}
        </button>
      </form>

      <button
        type="button"
        className="btn btn-secondary contact-form__email"
        onClick={() => {
          const subject = encodeURIComponent(
            pet.isLost ? `I may have found ${pet.name}` : `Regarding ${pet.name} on PetTag`,
          );
          window.location.href = `mailto:${owner.email}?subject=${subject}`;
        }}>
        Email pet parent instead
      </button>
    </section>
  );
}
