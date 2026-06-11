import { BREED_OTHER, getBreedsForSpecies } from '@/constants/breeds';

import { FormField } from './form-field';
import { SelectField } from './select-field';

type BreedSelectorProps = {
  species: string;
  speciesOther: string;
  breed: string;
  breedOther: string;
  onBreedChange: (breed: string) => void;
  onBreedOtherChange: (text: string) => void;
};

export function BreedSelector({
  species,
  speciesOther,
  breed,
  breedOther,
  onBreedChange,
  onBreedOtherChange,
}: BreedSelectorProps) {
  const breeds = getBreedsForSpecies(species, speciesOther);
  const speciesLabel =
    species === 'Other' ? speciesOther.trim() || 'your pet' : species.toLowerCase();

  if (!breeds) {
    return (
      <FormField
        label="Breed"
        required
        placeholder="e.g. Parrot, Hamster, Iguana..."
        value={breedOther}
        onChangeText={onBreedOtherChange}
        hint="Enter your pet's breed or type."
      />
    );
  }

  return (
    <>
      <SelectField
        label="Breed"
        required
        placeholder={`Select ${speciesLabel} breed`}
        value={breed}
        options={breeds}
        onChange={onBreedChange}
        hint={`Choose from common ${speciesLabel} breeds, or select Other.`}
      />
      {breed === BREED_OTHER && (
        <FormField
          label="Specify breed"
          required
          placeholder="e.g. Mini Goldendoodle"
          value={breedOther}
          onChangeText={onBreedOtherChange}
        />
      )}
    </>
  );
}
