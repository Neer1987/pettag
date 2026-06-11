import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import {
  pickImageFromCamera,
  pickImageFromLibrary,
  showPhotoSourcePicker,
} from '@/lib/pick-image';

type PetPhotoPickerProps = {
  uri: string | null;
  onChange: (uri: string | null) => void;
};

export function PetPhotoPicker({ uri, onChange }: PetPhotoPickerProps) {
  const handlePick = () => {
    showPhotoSourcePicker(
      async () => {
        const picked = await pickImageFromCamera();
        if (picked) onChange(picked);
      },
      async () => {
        const picked = await pickImageFromLibrary();
        if (picked) onChange(picked);
      },
    );
  };

  return (
    <Pressable style={styles.box} onPress={handlePick}>
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
          <View style={styles.overlay}>
            <Text style={styles.changeText}>Tap to change photo</Text>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📷</Text>
          </View>
          <Text style={styles.title}>Add cover photo</Text>
          <Text style={styles.sub}>Camera or photo library</Text>
        </View>
      )}
    </Pressable>
  );
}

export const SPECIES_OPTIONS = [
  { id: 'Dog', icon: 'dog' as const, label: 'Dog' },
  { id: 'Cat', icon: 'cat' as const, label: 'Cat' },
  { id: 'Horse', icon: 'horse' as const, label: 'Horse' },
  { id: 'Other', icon: 'dots-horizontal-circle' as const, label: 'Other' },
] as const;

export const GENDER_OPTIONS = [
  { id: 'Male', icon: 'gender-male' as const, label: 'Male' },
  { id: 'Female', icon: 'gender-female' as const, label: 'Female' },
] as const;

export const COAT_OPTIONS = [
  { id: 'Golden', color: '#D4A574', textColor: '#1A1208' },
  { id: 'Black', color: '#1C1C1C', textColor: '#FFFFFF' },
  { id: 'White', color: '#F4F4F4', textColor: '#333333', border: true },
  { id: 'Brown', color: '#6B4226', textColor: '#FFFFFF' },
  { id: 'Spotted', color: '#C9A86C', textColor: '#1A1208', spotted: true },
  { id: 'Other', color: '#E8F2EC', textColor: '#0F2D1E', border: true },
] as const;

export const MARKING_OTHER = 'Other';

export const MARKING_OPTIONS = [
  { id: 'Fluffy tail', color: '#E8D5B7', textColor: '#4A3728' },
  { id: 'White chest', color: '#F4F4F4', textColor: '#333333', border: true },
  { id: 'Scar on ear', color: '#E8B4B4', textColor: '#5C2E2E' },
  { id: 'Blue eyes', color: '#A8C8E8', textColor: '#1E3A52' },
  { id: 'Other', color: '#E8F2EC', textColor: '#0F2D1E', border: true },
] as const;

type SwatchOption = {
  id: string;
  color: string;
  textColor: string;
  border?: boolean;
  spotted?: boolean;
};

function ColorSwatch({
  item,
  selected,
  onPress,
  compact,
}: {
  item: SwatchOption;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.swatch,
        compact && styles.swatchCompact,
        { backgroundColor: item.color },
        item.border ? styles.swatchPaleBorder : null,
        !selected && styles.swatchIdle,
        selected && styles.swatchSelected,
      ]}
      onPress={onPress}>
      {item.spotted ? <Text style={styles.spotPattern}>• • •</Text> : null}
      <Text
        style={[
          styles.swatchText,
          compact && styles.swatchTextCompact,
          { color: item.textColor },
          selected && styles.swatchTextSelected,
        ]}
        numberOfLines={2}>
        {item.id}
      </Text>
      {selected ? (
        <View style={styles.checkBadge}>
          <MaterialCommunityIcons name="check-bold" size={13} color={Colors.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

type SpeciesSelectorProps = {
  value: string;
  otherValue: string;
  onChange: (species: string) => void;
  onOtherChange: (text: string) => void;
};

export function SpeciesSelector({ value, otherValue, onChange, onOtherChange }: SpeciesSelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Species</Text>
      <View style={styles.speciesGrid}>
        {SPECIES_OPTIONS.map((item) => {
          const selected = value === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.speciesCard, selected && styles.speciesCardSelected]}
              onPress={() => onChange(item.id)}>
              <MaterialCommunityIcons
                name={item.icon}
                size={44}
                color={selected ? Colors.forest : Colors.mid}
              />
              <Text style={[styles.speciesLabel, selected && styles.speciesLabelSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {value === 'Other' && (
        <View style={styles.otherWrap}>
          <Text style={styles.otherHint}>Specify species</Text>
          <TextInput
            style={styles.otherInput}
            placeholder="e.g. Parrot, Hamster, Horse..."
            placeholderTextColor={Colors.light}
            value={otherValue}
            onChangeText={onOtherChange}
            autoCapitalize="words"
          />
        </View>
      )}
    </View>
  );
}

type GenderSelectorProps = {
  value: string;
  onChange: (gender: string) => void;
};

export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Gender</Text>
      <View style={styles.genderRow}>
        {GENDER_OPTIONS.map((item) => {
          const selected = value === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.genderCard, selected && styles.genderCardSelected]}
              onPress={() => onChange(item.id)}>
              <MaterialCommunityIcons
                name={item.icon}
                size={40}
                color={selected ? Colors.white : Colors.forest}
              />
              <Text style={[styles.genderLabel, selected && styles.genderLabelSelected]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type CoatSelectorProps = {
  value: string;
  otherValue: string;
  onChange: (coat: string) => void;
  onOtherChange: (text: string) => void;
};

export function CoatSelector({ value, otherValue, onChange, onOtherChange }: CoatSelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Coat colour</Text>
      <View style={styles.swatchGrid}>
        {COAT_OPTIONS.map((item) => (
          <ColorSwatch
            key={item.id}
            item={item}
            selected={value === item.id}
            onPress={() => onChange(item.id)}
          />
        ))}
      </View>
      {value === 'Other' && (
        <View style={styles.otherWrap}>
          <Text style={styles.otherHint}>Specify coat colour</Text>
          <TextInput
            style={styles.otherInput}
            placeholder="e.g. Brindle, Merle, Tri-colour..."
            placeholderTextColor={Colors.light}
            value={otherValue}
            onChangeText={onOtherChange}
            autoCapitalize="words"
          />
        </View>
      )}
    </View>
  );
}

type MarkingSelectorProps = {
  values: string[];
  onToggle: (marking: string) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
};

export function MarkingSelector({ values, onToggle, otherValue = '', onOtherChange }: MarkingSelectorProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Distinctive markings</Text>
      <Text style={styles.sectionHint}>Select all that apply</Text>
      <View style={styles.swatchGrid}>
        {MARKING_OPTIONS.map((item) => (
          <ColorSwatch
            key={item.id}
            item={item}
            selected={values.includes(item.id)}
            onPress={() => onToggle(item.id)}
            compact
          />
        ))}
      </View>
      {values.includes(MARKING_OTHER) && onOtherChange ? (
        <View style={styles.otherWrap}>
          <Text style={styles.otherHint}>Describe other markings</Text>
          <TextInput
            style={styles.otherInput}
            placeholder="e.g. Black mask, docked tail, three legs..."
            placeholderTextColor={Colors.light}
            value={otherValue}
            onChangeText={onOtherChange}
            autoCapitalize="sentences"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 168,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,45,30,0.35)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  changeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.white,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.sagePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: { fontSize: 26 },
  title: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.forest },
  sub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mid },
  section: { marginTop: 22 },
  sectionLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 10,
  },
  sectionHint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mid,
    marginTop: -6,
    marginBottom: 10,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  speciesCard: {
    width: '47%',
    minHeight: 96,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  speciesCardSelected: {
    borderColor: Colors.forest,
    backgroundColor: Colors.sagePale,
  },
  speciesLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.mid,
  },
  speciesLabelSelected: { color: Colors.forest },
  otherWrap: { marginTop: 12 },
  otherHint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mid,
    marginBottom: 8,
  },
  otherInput: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.ink,
    minHeight: 54,
  },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: {
    flex: 1,
    minHeight: 88,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  genderCardSelected: {
    borderColor: Colors.forest,
    backgroundColor: Colors.forest,
  },
  genderLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  genderLabelSelected: { color: Colors.white },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: '30%',
    flexGrow: 1,
    minWidth: 96,
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 10,
    position: 'relative',
  },
  swatchCompact: {
    minWidth: '47%',
    width: '47%',
    minHeight: 58,
  },
  swatchPaleBorder: {
    borderColor: Colors.line,
  },
  swatchIdle: {
    opacity: 0.72,
  },
  swatchSelected: {
    opacity: 1,
    borderColor: Colors.forest,
    borderWidth: 3,
    transform: [{ scale: 1.04 }],
    ...Platform.select({
      ios: {
        shadowColor: Colors.forest,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  swatchText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  swatchTextCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  swatchTextSelected: {
    fontFamily: Fonts.sansSemiBold,
  },
  checkBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.forest,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  spotPattern: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 8,
    color: 'rgba(0,0,0,0.25)',
    letterSpacing: 2,
  },
});
