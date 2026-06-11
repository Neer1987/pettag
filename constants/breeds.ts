export const BREED_OTHER = 'Other';

export const DOG_BREEDS = [
  'Affenpinscher',
  'Airedale Terrier',
  'Akita',
  'Alaskan Malamute',
  'American Bulldog',
  'Australian Cattle Dog',
  'Australian Shepherd',
  'Basset Hound',
  'Beagle',
  'Bernese Mountain Dog',
  'Border Collie',
  'Boston Terrier',
  'Boxer',
  'Bulldog',
  'Cavalier King Charles Spaniel',
  'Chihuahua',
  'Cocker Spaniel',
  'Collie',
  'Dachshund',
  'Dalmatian',
  'Doberman Pinscher',
  'English Springer Spaniel',
  'French Bulldog',
  'German Shepherd',
  'German Shorthaired Pointer',
  'Golden Retriever',
  'Great Dane',
  'Great Pyrenees',
  'Havanese',
  'Labrador Retriever',
  'Maltese',
  'Mastiff',
  'Miniature Schnauzer',
  'Mixed Breed',
  'Newfoundland',
  'Pembroke Welsh Corgi',
  'Pit Bull Terrier',
  'Pointer',
  'Pomeranian',
  'Poodle',
  'Pug',
  'Rhodesian Ridgeback',
  'Rottweiler',
  'Saint Bernard',
  'Samoyed',
  'Shetland Sheepdog',
  'Shih Tzu',
  'Siberian Husky',
  'Staffordshire Bull Terrier',
  'Vizsla',
  'Weimaraner',
  'West Highland White Terrier',
  'Yorkshire Terrier',
  BREED_OTHER,
] as const;

export const CAT_BREEDS = [
  'Abyssinian',
  'American Shorthair',
  'Balinese',
  'Bengal',
  'Birman',
  'Bombay',
  'British Shorthair',
  'Burmese',
  'Devon Rex',
  'Domestic Longhair',
  'Domestic Shorthair',
  'Exotic Shorthair',
  'Himalayan',
  'Maine Coon',
  'Manx',
  'Mixed Breed',
  'Norwegian Forest Cat',
  'Oriental Shorthair',
  'Persian',
  'Ragdoll',
  'Russian Blue',
  'Scottish Fold',
  'Siamese',
  'Siberian',
  'Somali',
  'Sphynx',
  'Tonkinese',
  BREED_OTHER,
] as const;

export const HORSE_BREEDS = [
  'Andalusian',
  'Appaloosa',
  'Arabian',
  'Belgian',
  'Clydesdale',
  'Friesian',
  'Gypsy Vanner',
  'Hanoverian',
  'Holsteiner',
  'Miniature Horse',
  'Mixed Breed',
  'Morgan',
  'Mustang',
  'Paint Horse',
  'Palomino',
  'Percheron',
  'Quarter Horse',
  'Shetland Pony',
  'Standardbred',
  'Tennessee Walking Horse',
  'Thoroughbred',
  'Warmblood',
  BREED_OTHER,
] as const;

export function getBreedsForSpecies(
  species: string,
  speciesOther: string,
): readonly string[] | null {
  const key = species === 'Other' ? speciesOther.trim().toLowerCase() : species.toLowerCase();

  if (key === 'dog') return DOG_BREEDS;
  if (key === 'cat') return CAT_BREEDS;
  if (key === 'horse') return HORSE_BREEDS;
  return null;
}

export function resolveBreedLabel(breed: string, breedOther: string): string {
  if (breed === BREED_OTHER) return breedOther.trim();
  return breed.trim();
}

export function resolveCoatLabel(coat: string, coatOther: string): string {
  if (coat === 'Other') return coatOther.trim();
  return coat;
}
