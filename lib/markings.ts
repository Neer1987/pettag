import { MARKING_OTHER } from '@/components/onboarding/pet-profile-fields';

export function resolveMarkings(markings: string[], other: string): string[] {
  const base = markings.filter((m) => m !== MARKING_OTHER);
  if (markings.includes(MARKING_OTHER) && other.trim()) {
    return [...base, other.trim()];
  }
  return base;
}
