import { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { OTP_LENGTH } from '@/lib/auth-otp';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');
  const [focusedIndex, setFocusedIndex] = useState(0);

  const updateDigit = (index: number, char: string) => {
    const cleaned = char.replace(/\D/g, '').slice(-1);
    const next = value.split('');
    while (next.length < OTP_LENGTH) next.push('');
    next[index] = cleaned;
    onChange(next.join('').slice(0, OTP_LENGTH));
    if (cleaned && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => {
        const filled = Boolean(digits[i]?.trim());
        const focused = focusedIndex === i;
        return (
          <Pressable
            key={i}
            style={[
              styles.box,
              filled && styles.boxFilled,
              focused && styles.boxFocused,
              error && styles.boxError,
            ]}
            onPress={() => inputs.current[i]?.focus()}>
            <TextInput
              ref={(el) => {
                inputs.current[i] = el;
              }}
              style={styles.input}
              value={digits[i]?.trim() ?? ''}
              onChangeText={(t) => updateDigit(i, t)}
              onKeyPress={(e) => handleKeyPress(i, e)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(-1)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function TestOtpBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerIcon}>✉️</Text>
      <View style={styles.bannerText}>
        <Text style={styles.bannerTitle}>Test mode</Text>
        <Text style={styles.bannerSub}>
          OTP sent to email. Use code <Text style={styles.bannerCode}>123456</Text> to verify.
        </Text>
      </View>
    </View>
  );
}

const boxSize = 48;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  box: {
    flex: 1,
    maxWidth: 52,
    height: boxSize,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: Colors.forest2,
    backgroundColor: Colors.sagePale,
  },
  boxFocused: {
    borderColor: Colors.forest,
    borderWidth: 2,
  },
  boxError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerPale,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: Fonts.monoMedium,
    fontSize: 22,
    color: Colors.ink,
    padding: 0,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.goldPale,
    borderWidth: 1,
    borderColor: 'rgba(200,150,42,0.25)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  bannerIcon: { fontSize: 22, marginTop: 2 },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.forest,
    marginBottom: 4,
  },
  bannerSub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.mid,
    lineHeight: 20,
  },
  bannerCode: {
    fontFamily: Fonts.monoMedium,
    fontSize: 14,
    color: Colors.forest,
    letterSpacing: 1,
  },
});
