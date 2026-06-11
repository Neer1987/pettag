import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField } from '@/components/onboarding/form-field';
import { OtpInput, TestOtpBanner } from '@/components/onboarding/otp-input';
import { Button } from '@/components/ui/button';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { isValidEmail, sendOtpToEmail, verifyOtpCode } from '@/lib/auth-otp';
import { getErrorMessage } from '@/lib/errors';
import { isOwnerRegistered } from '@/lib/supabase/owners';

const PET_HERO = require('@/assets/images/landing-pet.jpg');

type LoginPhase = 'email' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { loginWithEmail } = useUser();
  const [phase, setPhase] = useState<LoginPhase>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError('');

    try {
      await sendOtpToEmail(trimmed);
      setPhase('otp');
      setOtp('');
      setOtpError(false);
      showToast(`Verification code sent to ${trimmed}`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to send verification code.'));
    }
  };

  const handleVerifyLogin = async () => {
    const trimmed = email.trim().toLowerCase();
    if (otp.length < 6) {
      setOtpError(true);
      showToast('Enter the 6-digit code');
      return;
    }

    try {
      const valid = await verifyOtpCode(trimmed, otp);
      if (!valid) {
        setOtpError(true);
        showToast('Invalid or expired code. Use 123456 for testing.');
        return;
      }

      const registered = await isOwnerRegistered(trimmed);
      if (!registered) {
        showToast('No account found. Please sign up first.');
        return;
      }

      const ok = await loginWithEmail(trimmed);
      if (ok) router.replace('/(tabs)');
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to sign in.'));
    }
  };

  const handleBack = () => {
    if (phase === 'otp') {
      setPhase('email');
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <StatusBar style="dark" />

        <Pressable style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back">
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.heroBlock}>
            <View style={styles.imageRing}>
              <Image source={PET_HERO} style={styles.petImage} contentFit="cover" transition={300} />
            </View>
            <Text style={styles.brand}>
              Pet<Text style={styles.brandAccent}>Tag</Text>
            </Text>
            <Text style={styles.tagline}>Sign in to manage your pet profiles</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{phase === 'email' ? 'Welcome back' : 'Enter your code'}</Text>
            <Text style={styles.subtitle}>
              {phase === 'email'
                ? 'We\'ll email you a secure one-time code. No password needed.'
                : `Code sent to ${email.trim().toLowerCase()}`}
            </Text>

            {phase === 'email' ? (
              <View style={styles.form}>
                <FormField
                  label="Email address"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={emailError}
                />
                <Button label="Send verification code" onPress={handleSendCode} />
              </View>
            ) : (
              <View style={styles.form}>
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
                <View style={styles.spacer12} />
                <Button label="Verify & log in" variant="gold" onPress={handleVerifyLogin} />
                <Pressable style={styles.resend} onPress={handleSendCode}>
                  <Text style={styles.resendText}>Resend code</Text>
                </Pressable>
              </View>
            )}
          </View>

          <Pressable style={styles.signupLink} onPress={() => router.replace('/signup')}>
            <Text style={styles.signupText}>
              New to PetTag? <Text style={styles.signupBold}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  backText: { fontSize: 18, color: Colors.forest },
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  heroBlock: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
  },
  imageRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.card,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  brand: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    color: Colors.forest,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: Colors.gold,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  title: {
    fontFamily: Fonts.serifItalic,
    fontSize: 28,
    color: Colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    lineHeight: 22,
    marginBottom: 24,
  },
  form: { gap: 4 },
  otpLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 4,
  },
  spacer12: { height: 12 },
  resend: { alignItems: 'center', marginTop: 16 },
  resendText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    color: Colors.forest,
  },
  signupLink: {
    alignItems: 'center',
    marginTop: 28,
    paddingVertical: 8,
  },
  signupText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
  },
  signupBold: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.forest,
  },
});
