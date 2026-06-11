import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

import { inputStyles } from './input-styles';

type FormFieldProps = TextInputProps & {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

export function FormField({
  label,
  required,
  hint,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[
          inputStyles.base,
          { fontFamily: Fonts.sans },
          focused && inputStyles.focused,
          error ? inputStyles.error : null,
          style,
        ]}
        placeholderTextColor={Colors.light}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginTop: 18 },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 8,
  },
  required: {
    color: Colors.danger,
  },
  hint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mid,
    marginTop: 6,
    lineHeight: 18,
  },
  errorText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
  },
});
