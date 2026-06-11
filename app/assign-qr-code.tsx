import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/app-back-button';
import { FormField } from '@/components/onboarding/form-field';
import { QrTagPreview } from '@/components/qr-tag-preview';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/section-label';
import { DEFAULT_QR_DESIGN_ID } from '@/constants/qr-templates';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { getPetProfilePath, getPetScanUrl } from '@/lib/pet-url';
import { parseQrCodeIdFromInput } from '@/lib/qr-code-id';

export default function AssignQrCodeScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { owner, pets, pet, isLoggedIn, hydrated, assignPetQrCode } = useUser();
  const [selectedPetQrCodeId, setSelectedPetQrCodeId] = useState(pet?.qrCodeId ?? pets[0]?.qrCodeId ?? '');
  const [codeInput, setCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPet = pets.find((entry) => entry.qrCodeId === selectedPetQrCodeId) ?? pet ?? pets[0];
  const previewCode = useMemo(() => {
    const parsed = parseQrCodeIdFromInput(codeInput);
    return parsed ?? selectedPet?.qrCodeId ?? '';
  }, [codeInput, selectedPet?.qrCodeId]);

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.replace('/login');
    }
  }, [hydrated, isLoggedIn]);

  useEffect(() => {
    if (selectedPet?.qrCodeId) {
      setCodeInput(selectedPet.qrCodeId);
    }
  }, [selectedPet?.qrCodeId]);

  if (!hydrated || !isLoggedIn || !owner || !selectedPet) {
    return null;
  }

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const result = await assignPetQrCode({
        petQrCodeId: selectedPet.qrCodeId,
        nextQrCodeId: codeInput,
      });

      if (!result.ok) {
        showToast(result.error ?? 'Could not save QR code.');
        return;
      }

      showToast(`QR code updated to ${previewCode}`);
      router.back();
    } finally {
      setSubmitting(false);
    }
  };

  const hasChange = previewCode !== selectedPet.qrCodeId;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <AppBackButton fallbackHref="/(tabs)/account" variant="icon" />
        <Text style={styles.topTitle}>Custom QR code</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}>
        <Text style={styles.title}>Link your tag</Text>
        <Text style={styles.sub}>
          Paste the code printed on your physical tag or a profile link. This becomes the QR code for{' '}
          {selectedPet.name}&apos;s profile.
        </Text>

        {pets.length > 1 ? (
          <>
            <SectionLabel label="Pet" />
            <View style={styles.petRow}>
              {pets.map((entry) => {
                const active = entry.qrCodeId === selectedPetQrCodeId;
                return (
                  <Pressable
                    key={entry.qrCodeId}
                    style={[styles.petChip, active && styles.petChipActive]}
                    onPress={() => {
                      setSelectedPetQrCodeId(entry.qrCodeId);
                      setCodeInput(entry.qrCodeId);
                    }}>
                    <Text style={[styles.petChipText, active && styles.petChipTextActive]}>{entry.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <SectionLabel label="Current code" />
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>QR ID</Text>
          <Text style={styles.currentValue}>{selectedPet.qrCodeId}</Text>
          <Text style={styles.currentUrl}>{getPetProfilePath(selectedPet.qrCodeId)}</Text>
        </View>

        <FormField
          label="New QR code"
          placeholder="e.g. pt-abc123 or https://pettag.app/pet/my-tag"
          value={codeInput}
          onChangeText={setCodeInput}
          autoCapitalize="none"
          autoCorrect={false}
          hint="3–40 characters. Letters, numbers, hyphens, and underscores only."
        />

        <SectionLabel label="Preview" />
        <View style={styles.previewCard}>
          <QrTagPreview
            designId={selectedPet.qrDesignId ?? DEFAULT_QR_DESIGN_ID}
            qrCodeId={previewCode}
            petName={selectedPet.name}
            size="lg"
          />
          <Text style={styles.previewUrl}>{getPetScanUrl(previewCode).replace(/^https?:\/\//, '')}</Text>
        </View>

        {hasChange ? (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>Before you save</Text>
            <Text style={styles.warnText}>
              Your old tag link ({selectedPet.qrCodeId}) will stop opening this profile. Make sure your physical tag
              matches the new code.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={submitting ? 'Saving…' : hasChange ? 'Save QR code' : 'No changes'}
          variant="forest"
          onPress={() => void handleSave()}
          disabled={submitting || !codeInput.trim() || !hasChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  topTitle: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.ink, textAlign: 'center' },
  topSpacer: { width: 42 },
  scroll: { paddingHorizontal: 20 },
  title: { fontFamily: Fonts.serifItalic, fontSize: 28, color: Colors.ink, marginTop: 8 },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 8,
  },
  petRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  petChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  petChipActive: { backgroundColor: Colors.sagePale, borderColor: Colors.forest },
  petChipText: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.mid },
  petChipTextActive: { color: Colors.forest },
  currentCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  currentLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.light,
  },
  currentValue: { fontFamily: Fonts.mono, fontSize: 18, color: Colors.forest, marginTop: 6 },
  currentUrl: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mid, marginTop: 6 },
  previewCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingVertical: 24,
    marginBottom: 12,
    ...Shadows.card,
  },
  previewUrl: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.mid, marginTop: 14, textAlign: 'center' },
  warnCard: {
    backgroundColor: Colors.goldPale,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginTop: 4,
  },
  warnTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink },
  warnText: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.mid, lineHeight: 18, marginTop: 4 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
});
