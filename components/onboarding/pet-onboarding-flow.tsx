import type { Dispatch, SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BreedSelector } from '@/components/onboarding/breed-selector';
import { FormField } from '@/components/onboarding/form-field';
import { inputStyles } from '@/components/onboarding/input-styles';
import {
  CoatSelector,
  GenderSelector,
  MarkingSelector,
  PetPhotoPicker,
  SpeciesSelector,
} from '@/components/onboarding/pet-profile-fields';
import { StepHeader } from '@/components/onboarding/step-chrome';
import { BREED_OTHER } from '@/constants/breeds';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { PET_VACCINES, type PetFormState } from '@/lib/pet-form';
import { formatWeightInput } from '@/lib/weight-format';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.toggle, on ? styles.toggleOn : styles.toggleOff]}>
      <View style={[styles.toggleKnob, on && styles.toggleKnobOn]} />
    </Pressable>
  );
}

type PetOnboardingFlowProps = {
  step: 1 | 2 | 3;
  petForm: PetFormState;
  updatePet: <K extends keyof PetFormState>(key: K, value: PetFormState[K]) => void;
  setPetForm: Dispatch<SetStateAction<PetFormState>>;
  toggleMarking: (marking: string) => void;
  vacStates: boolean[];
  setVacStates: Dispatch<SetStateAction<boolean[]>>;
  allergies: string[];
  allergyInput: string;
  setAllergyInput: (value: string) => void;
  addAllergy: () => void;
  removeAllergy: (value: string) => void;
};

export function PetOnboardingFlow({
  step,
  petForm,
  updatePet,
  setPetForm,
  toggleMarking,
  vacStates,
  setVacStates,
  allergies,
  allergyInput,
  setAllergyInput,
  addAllergy,
  removeAllergy,
}: PetOnboardingFlowProps) {
  if (step === 1) {
    return (
      <View style={styles.stepBody}>
        <StepHeader
          title="Meet your pet"
          subtitle="Add a photo and basic details to build their profile."
        />
        <PetPhotoPicker
          uri={petForm.coverPhotoUri}
          onChange={(uri) => updatePet('coverPhotoUri', uri)}
        />
        <View style={styles.form}>
          <SpeciesSelector
            value={petForm.species}
            otherValue={petForm.speciesOther}
            onChange={(s) =>
              setPetForm((prev) => ({
                ...prev,
                species: s,
                breed: '',
                breedOther: '',
              }))
            }
            onOtherChange={(t) =>
              setPetForm((prev) => ({
                ...prev,
                speciesOther: t,
                breed: '',
                breedOther: '',
              }))
            }
          />
          <GenderSelector value={petForm.gender} onChange={(g) => updatePet('gender', g)} />
          <CoatSelector
            value={petForm.coat}
            otherValue={petForm.coatOther}
            onChange={(c) =>
              setPetForm((prev) => ({
                ...prev,
                coat: c,
                coatOther: c === 'Other' ? prev.coatOther : '',
              }))
            }
            onOtherChange={(t) => updatePet('coatOther', t)}
          />
          <FormField
            label="Pet name"
            required
            placeholder="e.g. Buddy"
            value={petForm.name}
            onChangeText={(v) => updatePet('name', v)}
            returnKeyType="done"
            blurOnSubmit
            hint="This name appears on your pet's public profile."
          />
        </View>
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.stepBody}>
        <StepHeader
          title="Pet details"
          subtitle="Help others identify your pet with breed, age, and distinguishing features."
        />
        <View style={styles.form}>
          <BreedSelector
            species={petForm.species}
            speciesOther={petForm.speciesOther}
            breed={petForm.breed}
            breedOther={petForm.breedOther}
            onBreedChange={(b) =>
              setPetForm((prev) => ({
                ...prev,
                breed: b,
                breedOther: b === BREED_OTHER ? prev.breedOther : '',
              }))
            }
            onBreedOtherChange={(t) => updatePet('breedOther', t)}
          />
          <View style={styles.row2}>
            <View style={styles.half}>
              <FormField
                label="Age"
                placeholder="e.g. 3 years"
                value={petForm.age}
                onChangeText={(v) => updatePet('age', v)}
              />
            </View>
            <View style={styles.half}>
              <FormField
                label="Weight (lbs)"
                placeholder="e.g. 62"
                value={petForm.weight}
                onChangeText={(v) => updatePet('weight', formatWeightInput(v))}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <MarkingSelector
            values={petForm.markings}
            onToggle={toggleMarking}
            otherValue={petForm.markingOther}
            onOtherChange={(v) => updatePet('markingOther', v)}
          />
          <FormField
            label="Microchip ID (optional)"
            placeholder="e.g. 900008001234567"
            value={petForm.microchip}
            onChangeText={(v) => updatePet('microchip', v)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.stepBody}>
      <StepHeader
        title="Medical information"
        subtitle="Critical for vets or anyone who finds your pet. You can update this anytime."
      />
      <Text style={styles.sectionTitle}>VACCINATIONS</Text>
      {PET_VACCINES.map((v, i) => (
        <View key={v.name} style={styles.vacItem}>
          <View>
            <Text style={styles.vacTitle}>{v.name}</Text>
            <Text style={styles.vacSub}>{v.sub}</Text>
          </View>
          <Toggle
            on={vacStates[i]}
            onToggle={() => setVacStates((prev) => prev.map((s, j) => (j === i ? !s : s)))}
          />
        </View>
      ))}
      <Text style={[styles.sectionTitle, { paddingTop: 14 }]}>ALLERGIES</Text>
      <View style={styles.allergyRow}>
        {allergies.map((a) => (
          <View key={a} style={styles.allergyTag}>
            <Text style={styles.allergyText}>{a}</Text>
            <Pressable onPress={() => removeAllergy(a)}>
              <Text style={styles.allergyX}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.allergyInputRow}>
        <TextInput
          style={[inputStyles.base, { fontFamily: Fonts.sans }, styles.allergyField]}
          placeholder="Add allergy and press Add"
          placeholderTextColor={Colors.light}
          value={allergyInput}
          onChangeText={setAllergyInput}
          onSubmitEditing={addAllergy}
        />
        <Pressable style={styles.allergyAddBtn} onPress={addAllergy}>
          <Text style={styles.allergyAddText}>Add</Text>
        </Pressable>
      </View>
      <FormField
        label="Notes for finder or vet"
        placeholder="e.g. Friendly with strangers. On daily medication..."
        value={petForm.notes}
        onChangeText={(v) => updatePet('notes', v)}
        multiline
        style={styles.textarea}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stepBody: { paddingBottom: 8 },
  form: { paddingTop: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.light,
    marginBottom: 8,
    marginTop: 8,
  },
  vacItem: {
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  vacTitle: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.ink },
  vacSub: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.light, marginTop: 1 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: Colors.success },
  toggleOff: { backgroundColor: Colors.line },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
  },
  toggleKnobOn: { alignSelf: 'flex-end' },
  allergyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.dangerPale,
    borderRadius: 22,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  allergyText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.danger },
  allergyX: { fontSize: 13, color: Colors.danger, opacity: 0.6 },
  allergyInputRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  allergyField: { flex: 1 },
  allergyAddBtn: {
    backgroundColor: Colors.forest,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  allergyAddText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.white },
  textarea: { ...inputStyles.multiline },
});
