import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';

type SelectFieldProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  hint?: string;
};

export function SelectField({
  label,
  required,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  hint,
}: SelectFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{label}</Text>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const selected = value === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
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
  required: { color: Colors.danger },
  trigger: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.ink,
    flex: 1,
  },
  placeholder: { color: Colors.light },
  chevron: {
    fontSize: 14,
    color: Colors.mid,
    marginLeft: 8,
  },
  hint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mid,
    marginTop: 6,
    lineHeight: 18,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,27,20,0.45)',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 22,
    color: Colors.ink,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: Colors.sagePale,
  },
  optionText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.ink,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.forest,
  },
  check: {
    fontSize: 16,
    color: Colors.forest,
    marginLeft: 8,
  },
});
