import type { PetMediaItem } from '@/lib/pet-media';

export type Database = {
  public: {
    Tables: {
      owners: {
        Row: OwnerRow;
        Insert: Omit<OwnerRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<OwnerRow>;
      };
      pets: {
        Row: PetRow;
        Insert: Omit<PetRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<PetRow>;
      };
      otp_codes: {
        Row: OtpCodeRow;
        Insert: OtpCodeRow;
        Update: Partial<OtpCodeRow>;
      };
      messages: {
        Row: MessageRow;
        Insert: Omit<MessageRow, 'id' | 'created_at' | 'read'> & {
          id?: string;
          created_at?: string;
          read?: boolean;
        };
        Update: Partial<MessageRow>;
      };
      alert_notifications: {
        Row: AlertNotificationRow;
        Insert: Omit<AlertNotificationRow, 'id' | 'created_at' | 'read'> & {
          id?: string;
          created_at?: string;
          read?: boolean;
        };
        Update: Partial<AlertNotificationRow>;
      };
      tag_orders: {
        Row: TagOrderRow;
        Insert: Omit<TagOrderRow, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: string;
        };
        Update: Partial<TagOrderRow>;
      };
    };
  };
};

export type OwnerRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email_verified: boolean;
  active_pet_qr_code_id: string | null;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  push_token: string | null;
  alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type PetRow = {
  id: string;
  owner_id: string;
  qr_code_id: string;
  profile_slug: string;
  name: string;
  species: string;
  gender: string;
  coat: string;
  breed: string;
  age: string;
  weight: string;
  markings: string[];
  microchip: string;
  notes: string;
  cover_photo_uri: string | null;
  media: PetMediaItem[];
  qr_design_id: string;
  is_lost: boolean;
  lost_at: string | null;
  last_seen_location: string | null;
  lost_latitude: number | null;
  lost_longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type OtpCodeRow = {
  email: string;
  code: string;
  expires_at: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  recipient_email: string;
  pet_qr_code_id: string;
  pet_name: string;
  sender_name: string;
  sender_email: string;
  body: string;
  read: boolean;
  created_at: string;
};

export type OwnerPetJoinRow = PetRow & {
  owners: OwnerRow;
};

export type AlertNotificationRow = {
  id: string;
  recipient_email: string;
  pet_qr_code_id: string;
  pet_name: string;
  distance_km: number;
  read: boolean;
  created_at: string;
};

export type TagOrderRow = {
  id: string;
  owner_email: string;
  owner_name: string;
  pet_qr_code_id: string;
  pet_name: string;
  qr_design_id: string;
  order_type: string;
  quantity: number;
  ship_address: string;
  ship_city: string;
  ship_state: string;
  ship_zip: string;
  ship_phone: string;
  notes: string;
  unit_price_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
};
