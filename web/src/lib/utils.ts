import { foundPetMessageTemplate } from '@/lib/finder-message';

export function speciesEmoji(species: string): string {
  const key = species.toLowerCase();
  if (key.includes('dog')) return '🐕';
  if (key.includes('cat')) return '🐈';
  if (key.includes('horse')) return '🐴';
  if (key.includes('rabbit')) return '🐰';
  return '🐾';
}

export function displayWeight(weight: string | undefined | null): string {
  if (!weight?.trim()) return '—';

  const trimmed = weight.trim();
  if (/lb/i.test(trimmed)) {
    const num = trimmed.replace(/[^\d.]/g, '');
    return num ? `${num} lbs` : trimmed;
  }
  if (/kg/i.test(trimmed)) {
    const kg = parseFloat(trimmed.replace(/[^\d.]/g, ''));
    if (!Number.isNaN(kg)) return `${Math.round(kg * 2.20462)} lbs`;
    return trimmed;
  }

  const num = parseFloat(trimmed);
  if (Number.isNaN(num)) return trimmed;
  return `${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)} lbs`;
}

export function foundPetTemplate(petName: string): string {
  return foundPetMessageTemplate(petName);
}

export { buildFinderMessageBody, foundPetMessageTemplate, getFinderLocation } from '@/lib/finder-message';
export type { FinderLocation } from '@/lib/finder-message';
