export function formatWeightInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return parts[0]?.slice(0, 3) ?? '';
  return `${parts[0].slice(0, 3)}.${parts[1].slice(0, 1)}`;
}

export function resolveWeightLabel(weight: string): string {
  const trimmed = weight.trim();
  if (!trimmed) return '';

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

export function displayWeight(weight: string | undefined | null): string {
  if (!weight?.trim()) return '—';
  return resolveWeightLabel(weight);
}

export function weightToFormInput(weight: string | undefined | null): string {
  if (!weight?.trim()) return '';
  return weight.replace(/\s*lbs?\s*$/i, '').trim();
}
