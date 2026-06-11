import {
  BREED_OTHER,
  getBreedsForSpecies,
  resolveBreedLabel,
  resolveCoatLabel,
} from '@/constants/breeds';
import {
  COAT_OPTIONS,
  MARKING_OTHER,
  MARKING_OPTIONS,
  SPECIES_OPTIONS,
} from '@/components/onboarding/pet-profile-fields';
import type { PetProfile } from '@/contexts/user-context';
import { resolveMarkings } from '@/lib/markings';
import { resolveWeightLabel, weightToFormInput } from '@/lib/weight-format';

export type PetFormState = {
  name: string;
  species: string;
  speciesOther: string;
  gender: string;
  coat: string;
  coatOther: string;
  coverPhotoUri: string | null;
  breed: string;
  breedOther: string;
  age: string;
  weight: string;
  markings: string[];
  markingOther: string;
  microchip: string;
  notes: string;
};

export const PET_VACCINES = [
  { name: 'Rabies', sub: 'Required by law', defaultOn: true },
  { name: 'DHPP', sub: 'Distemper, Parvovirus', defaultOn: true },
  { name: 'Bordetella', sub: 'Kennel cough', defaultOn: false },
] as const;

export function createInitialPetForm(): PetFormState {
  return {
    name: '',
    species: 'Dog',
    speciesOther: '',
    gender: 'Male',
    coat: 'Golden',
    coatOther: '',
    coverPhotoUri: null,
    breed: '',
    breedOther: '',
    age: '',
    weight: '',
    markings: [],
    markingOther: '',
    microchip: '',
    notes: '',
  };
}

const SPECIES_IDS = SPECIES_OPTIONS.map((option) => option.id);
const COAT_IDS = COAT_OPTIONS.map((option) => option.id);
const KNOWN_MARKINGS = MARKING_OPTIONS.map((option) => option.id).filter((id) => id !== MARKING_OTHER);

export function petProfileToFormState(pet: PetProfile): PetFormState {
  const species = SPECIES_IDS.includes(pet.species as (typeof SPECIES_IDS)[number])
    ? pet.species
    : 'Other';
  const speciesOther = species === 'Other' ? pet.species : '';

  const coat = COAT_IDS.includes(pet.coat as (typeof COAT_IDS)[number]) ? pet.coat : 'Other';
  const coatOther = coat === 'Other' ? pet.coat : '';

  const breeds = getBreedsForSpecies(species, speciesOther);
  let breed = '';
  let breedOther = '';
  if (breeds?.includes(pet.breed)) {
    breed = pet.breed;
  } else if (breeds) {
    breed = BREED_OTHER;
    breedOther = pet.breed;
  } else {
    breedOther = pet.breed;
  }

  const markings: string[] = [];
  let markingOther = '';
  for (const marking of pet.markings) {
    if (KNOWN_MARKINGS.includes(marking)) {
      markings.push(marking);
      continue;
    }
    if (!markings.includes(MARKING_OTHER)) {
      markings.push(MARKING_OTHER);
      markingOther = marking;
    } else {
      markingOther = markingOther ? `${markingOther}, ${marking}` : marking;
    }
  }

  return {
    name: pet.name,
    species,
    speciesOther,
    gender: pet.gender,
    coat,
    coatOther,
    coverPhotoUri: pet.coverPhotoUri,
    breed,
    breedOther,
    age: pet.age,
    weight: weightToFormInput(pet.weight),
    markings,
    markingOther,
    microchip: pet.microchip,
    notes: pet.notes,
  };
}

export function validatePetOnboardingStep(step: 1 | 2 | 3, petForm: PetFormState): string | null {
  if (step === 1) {
    if (!petForm.name.trim()) return "Please enter your pet's name";
    if (petForm.species === 'Other' && !petForm.speciesOther.trim()) return 'Please specify the species';
    if (petForm.coat === 'Other' && !petForm.coatOther.trim()) return 'Please specify the coat colour';
  }

  if (step === 2) {
    const breeds = getBreedsForSpecies(petForm.species, petForm.speciesOther);
    if (breeds) {
      if (!petForm.breed) return 'Please select a breed';
      if (petForm.breed === BREED_OTHER && !petForm.breedOther.trim()) return 'Please specify the breed';
    } else if (!petForm.breedOther.trim()) {
      return "Please enter your pet's breed";
    }
    if (petForm.markings.includes(MARKING_OTHER) && !petForm.markingOther.trim()) {
      return 'Please describe the other marking';
    }
  }

  return null;
}

export function petFormToProfileInput(petForm: PetFormState) {
  return {
    name: petForm.name,
    species: petForm.species === 'Other' ? petForm.speciesOther.trim() : petForm.species,
    gender: petForm.gender,
    coat: resolveCoatLabel(petForm.coat, petForm.coatOther),
    breed: getBreedsForSpecies(petForm.species, petForm.speciesOther)
      ? resolveBreedLabel(petForm.breed, petForm.breedOther)
      : petForm.breedOther.trim(),
    age: petForm.age,
    weight: resolveWeightLabel(petForm.weight),
    markings: resolveMarkings(petForm.markings, petForm.markingOther),
    microchip: petForm.microchip,
    notes: petForm.notes,
    coverPhotoUri: petForm.coverPhotoUri,
  };
}

export function togglePetMarking(petForm: PetFormState, marking: string): PetFormState {
  return {
    ...petForm,
    markings: petForm.markings.includes(marking)
      ? petForm.markings.filter((x) => x !== marking)
      : [...petForm.markings, marking],
    markingOther:
      marking === MARKING_OTHER && petForm.markings.includes(MARKING_OTHER) ? '' : petForm.markingOther,
  };
}
