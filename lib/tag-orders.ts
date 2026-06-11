export const TAG_UNIT_PRICE_CENTS = 1499;
export const TAG_SHIPPING_CENTS = 0;
export const TAG_MAX_QUANTITY = 3;

export const TAG_ORDER_TYPES = [
  { id: 'replacement', label: 'Replacement', sub: 'Lost, damaged, or worn out' },
  { id: 'spare', label: 'Spare tag', sub: 'Extra for another collar or harness' },
] as const;

export type TagOrderType = (typeof TAG_ORDER_TYPES)[number]['id'];

export function formatUsdFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateTagOrderTotal(quantity: number): {
  unitPriceCents: number;
  shippingCents: number;
  totalCents: number;
} {
  const unitPriceCents = TAG_UNIT_PRICE_CENTS;
  const shippingCents = TAG_SHIPPING_CENTS;
  const totalCents = unitPriceCents * quantity + shippingCents;
  return { unitPriceCents, shippingCents, totalCents };
}

export function formatOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
