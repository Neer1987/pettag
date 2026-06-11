import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField } from '@/components/onboarding/form-field';
import { OtpInput, TestOtpBanner } from '@/components/onboarding/otp-input';
import { PetOnboardingFlow } from '@/components/onboarding/pet-onboarding-flow';
import { StepChrome, StepHeader } from '@/components/onboarding/step-chrome';
import { Button } from '@/components/ui/button';
import { Colors, Fonts } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { isValidEmail, sendOtpToEmail, verifyOtpCode } from '@/lib/auth-otp';
import { getErrorMessage } from '@/lib/errors';
import { isOwnerRegistered } from '@/lib/supabase/owners';
import {
  createInitialPetForm,
  PET_VACCINES,
  petFormToProfileInput,
  togglePetMarking,
  validatePetOnboardingStep,
} from '@/lib/pet-form';
import { formatUSPhone, isValidUSPhone } from '@/lib/phone-format';

const TOTAL_STEPS = 5;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { registerUser, markEmailVerified } = useUser();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [owner, setOwnerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const [petForm, setPetForm] = useState(createInitialPetForm);
  const [vacStates, setVacStates] = useState(PET_VACCINES.map((v) => v.defaultOn));
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  const updateOwner = (key: keyof typeof owner, value: string) =>
    setOwnerForm((prev) => ({ ...prev, [key]: value }));

  const updatePet = <K extends keyof typeof petForm>(key: K, value: (typeof petForm)[K]) =>
    setPetForm((prev) => ({ ...prev, [key]: value }));

  const toggleMarking = (marking: string) => {
    setPetForm((prev) => togglePetMarking(prev, marking));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!owner.fullName.trim() || !owner.phone.trim() || !owner.email.trim()) {
        showToast('Please fill in name, phone, and email');
        return false;
      }
      if (!isValidEmail(owner.email)) {
        showToast('Please enter a valid email address');
        return false;
      }
      if (!isValidUSPhone(owner.phone)) {
        showToast('Enter a valid 10-digit phone number');
        return false;
      }
      if (!owner.address.trim() || !owner.city.trim() || !owner.state.trim()) {
        showToast('Please complete your address');
        return false;
      }
    }
    if (step === 2) {
      if (otp.length < 6) {
        setOtpError(true);
        showToast('Enter the 6-digit verification code');
        return false;
      }
    }
    if (step >= 3) {
      const petStep = (step - 2) as 1 | 2 | 3;
      const error = validatePetOnboardingStep(petStep, petForm);
      if (error) {
        showToast(error);
        return false;
      }
    }
    return true;
  };

  const goNext = async () => {
    if (!validateStep()) return;

    if (step === 1) {
      try {
        const email = owner.email.trim().toLowerCase();
        if (await isOwnerRegistered(email)) {
          showToast('An account with this email already exists. Please log in.');
          return;
        }
        await sendOtpToEmail(email);
        showToast(`Verification code sent to ${email}`);
        setOtp('');
        setOtpError(false);
        setStep(2);
      } catch (err) {
        showToast(getErrorMessage(err, 'Unable to send verification code.'));
      }
      return;
    }

    if (step === 2) {
      try {
        const email = owner.email.trim().toLowerCase();
        const valid = await verifyOtpCode(email, otp);
        if (!valid) {
          setOtpError(true);
          showToast('Invalid or expired code. Use 123456 for testing.');
          return;
        }
        await markEmailVerified(email);
        setEmailVerified(true);
        setStep(3);
      } catch (err) {
        showToast(getErrorMessage(err, 'Unable to verify email.'));
      }
      return;
    }

    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const completeSignup = async () => {
    if (!validateStep()) return;
    if (!emailVerified) {
      showToast('Please verify your email first');
      setStep(2);
      return;
    }

    try {
      await registerUser(owner, petFormToProfileInput(petForm));
      router.replace({
        pathname: '/success',
        params: { petName: petForm.name, ownerName: owner.fullName.split(' ')[0] },
      });
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not create account.'));
    }
  };

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (!trimmed) return;
    setAllergies((prev) => [...prev, trimmed]);
    setAllergyInput('');
  };

  const petStep = step >= 3 ? ((step - 2) as 1 | 2 | 3) : 1;

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
        {step === 1 && (
          <View style={styles.stepBody}>
            <StepHeader
              title="Your information"
              subtitle="We'll use this so finders and vets can reach you if your pet is lost."
            />
            <View style={styles.form}>
              <FormField
                label="Full name"
                required
                placeholder="e.g. Sarah Johnson"
                value={owner.fullName}
                onChangeText={(v) => updateOwner('fullName', v)}
                autoCapitalize="words"
              />
              <FormField
                label="Phone number"
                required
                placeholder="641-451-4761"
                value={owner.phone}
                onChangeText={(v) => updateOwner('phone', formatUSPhone(v))}
                keyboardType="phone-pad"
                maxLength={12}
                hint="Format: 641-451-4761"
              />
              <FormField
                label="Email address"
                required
                placeholder="e.g. sarah@email.com"
                value={owner.email}
                onChangeText={(v) => updateOwner('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormField
                label="Street address"
                required
                placeholder="e.g. 124 Oak Street"
                value={owner.address}
                onChangeText={(v) => updateOwner('address', v)}
              />
              <View style={styles.row2}>
                <View style={styles.half}>
                  <FormField
                    label="City"
                    required
                    placeholder="Austin"
                    value={owner.city}
                    onChangeText={(v) => updateOwner('city', v)}
                  />
                </View>
                <View style={styles.half}>
                  <FormField
                    label="State"
                    required
                    placeholder="Texas"
                    value={owner.state}
                    onChangeText={(v) => updateOwner('state', v)}
                  />
                </View>
              </View>
              <FormField
                label="ZIP / Postal code"
                placeholder="78701"
                value={owner.zip}
                onChangeText={(v) => updateOwner('zip', v)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepBody}>
            <StepHeader
              title="Verify your email"
              subtitle={`Enter the 6-digit code we sent to ${owner.email.trim().toLowerCase()}`}
            />
            <Text style={styles.otpLabel}>Verification code</Text>
            <OtpInput
              value={otp}
              onChange={(v) => {
                setOtp(v);
                setOtpError(false);
              }}
              error={otpError}
            />
            <TestOtpBanner />
          </View>
        )}

        {step >= 3 && (
          <PetOnboardingFlow
            step={petStep}
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
        )}
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 12 }]}>
        {step < TOTAL_STEPS ? (
          <Button
            label={step === 2 ? 'Verify & continue' : step === 1 ? 'Send code & continue' : 'Continue'}
            onPress={goNext}
            variant={step === 2 ? 'gold' : 'forest'}
          />
        ) : (
          <Button label="Create account" variant="gold" onPress={completeSignup} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 20, flexGrow: 1 },
  stepBody: { paddingBottom: 8 },
  form: { paddingTop: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  otpLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
    paddingHorizontal: 0,
  },
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
