export type PetMediaItem = {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  caption?: string;
};

export type OwnerProfile = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

export type PetProfile = {
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
  vaccinations: string[];
  allergies: string[];
  coverPhotoUri: string | null;
  media: PetMediaItem[];
  qrCodeId: string;
  profileSlug: string;
  qrDesignId: string;
  isLost: boolean;
};

export type PublicProfile = {
  owner: OwnerProfile;
  pet: PetProfile;
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
  push_token: string | null;
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
  vaccinations?: string[] | null;
  allergies?: string[] | null;
  cover_photo_uri: string | null;
  media: PetMediaItem[] | string | null;
  qr_design_id: string;
  is_lost: boolean;
};
