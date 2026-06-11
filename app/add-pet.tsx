import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetOnboardingFlow } from '@/components/onboarding/pet-onboarding-flow';
import { StepChrome } from '@/components/onboarding/step-chrome';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { getErrorMessage } from '@/lib/errors';
import {
  createInitialPetForm,
  PET_VACCINES,
  petFormToProfileInput,
  togglePetMarking,
  validatePetOnboardingStep,
} from '@/lib/pet-form';

const TOTAL_STEPS = 3;

export default function AddPetScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { owner, isLoggedIn, addPet } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [petForm, setPetForm] = useState(createInitialPetForm);
  const [vacStates, setVacStates] = useState(PET_VACCINES.map((v) => v.defaultOn));
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const updatePet = <K extends keyof typeof petForm>(key: K, value: (typeof petForm)[K]) =>
    setPetForm((prev) => ({ ...prev, [key]: value }));

  const toggleMarking = (marking: string) => {
    setPetForm((prev) => togglePetMarking(prev, marking));
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (!trimmed) return;
    setAllergies((prev) => [...prev, trimmed]);
    setAllergyInput('');
  };

  const validateStep = () => {
    const error = validatePetOnboardingStep(step, petForm);
    if (error) {
      showToast(error);
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) setStep((step + 1) as 1 | 2 | 3);
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
    else router.back();
  };

  const completeAddPet = async () => {
    if (!validateStep()) return;

    if (!isLoggedIn || !owner) {
      showToast('Please log in to add a pet');
      router.push('/login');
      return;
    }

    try {
      await addPet(petFormToProfileInput(petForm));
      router.replace({
        pathname: '/success',
        params: { petName: petForm.name, ownerName: owner.fullName.split(' ')[0] },
      });
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save pet.'));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <StepChrome step={step} totalSteps={TOTAL_STEPS} onBack={goBack} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}>
        <PetOnboardingFlow
          step={step}
          petForm={petForm}
          updatePet={updatePet}
          setPetForm={setPetForm}
          toggleMarking={toggleMarking}
          vacStates={vacStates}
          setVacStates={setVacStates}
          allergies={allergies}
          allergyInput={allergyInput}
          setAllergyInput={setAllergyInput}
          addAllergy={addAllergy}
          removeAllergy={(value) => setAllergies((prev) => prev.filter((x) => x !== value))}
        />
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
        {step < TOTAL_STEPS ? (
          <Button label="Continue" onPress={goNext} variant="forest" />
        ) : (
          <Button label="Create pet profile" variant="gold" onPress={completeAddPet} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, flexGrow: 1 },
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
});
