import { calculateTagOrderTotal, type TagOrderType } from '@/lib/tag-orders';
import { getSupabase } from '@/lib/supabase/client';
import type { TagOrderRow } from '@/lib/supabase/types';

export type TagOrder = {
  id: string;
  ownerEmail: string;
  ownerName: string;
  petQrCodeId: string;
  petName: string;
  qrDesignId: string;
  orderType: TagOrderType;
  quantity: number;
  shipAddress: string;
  shipCity: string;
  shipState: string;
  shipZip: string;
  shipPhone: string;
  notes: string;
  unitPriceCents: number;
  totalCents: number;
  status: string;
  createdAt: number;
};

function rowToOrder(row: TagOrderRow): TagOrder {
  return {
    id: row.id,
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    petQrCodeId: row.pet_qr_code_id,
    petName: row.pet_name,
    qrDesignId: row.qr_design_id,
    orderType: row.order_type as TagOrderType,
    quantity: row.quantity,
    shipAddress: row.ship_address,
    shipCity: row.ship_city,
    shipState: row.ship_state,
    shipZip: row.ship_zip,
    shipPhone: row.ship_phone,
    notes: row.notes,
    unitPriceCents: row.unit_price_cents,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function createTagOrder(input: {
  ownerEmail: string;
  ownerName: string;
  petQrCodeId: string;
  petName: string;
  qrDesignId: string;
  orderType: TagOrderType;
  quantity: number;
  shipAddress: string;
  shipCity: string;
  shipState: string;
  shipZip: string;
  shipPhone: string;
  notes?: string;
}): Promise<TagOrder> {
  const supabase = getSupabase();
  const { unitPriceCents, totalCents } = calculateTagOrderTotal(input.quantity);

  const { data, error } = await supabase
    .from('tag_orders')
    .insert({
      owner_email: input.ownerEmail.trim().toLowerCase(),
      owner_name: input.ownerName.trim(),
      pet_qr_code_id: input.petQrCodeId,
      pet_name: input.petName.trim(),
      qr_design_id: input.qrDesignId,
      order_type: input.orderType,
      quantity: input.quantity,
      ship_address: input.shipAddress.trim(),
      ship_city: input.shipCity.trim(),
      ship_state: input.shipState.trim(),
      ship_zip: input.shipZip.trim(),
      ship_phone: input.shipPhone.trim(),
      notes: (input.notes ?? '').trim(),
      unit_price_cents: unitPriceCents,
      total_cents: totalCents,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw error;
  return rowToOrder(data);
}

export async function fetchTagOrdersForOwner(ownerEmail: string): Promise<TagOrder[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tag_orders')
    .select('*')
    .eq('owner_email', ownerEmail.trim().toLowerCase())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToOrder);
}
