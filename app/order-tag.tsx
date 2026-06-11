import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/app-back-button';
import { FormField } from '@/components/onboarding/form-field';
import { QrTagPreview } from '@/components/qr-tag-preview';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/section-label';
import {
  DEFAULT_QR_DESIGN_ID,
  QR_DESIGN_TEMPLATES,
  getQrDesign,
} from '@/constants/qr-templates';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { getErrorMessage } from '@/lib/errors';
import { isMissingSchemaError } from '@/lib/supabase/errors';
import { createTagOrder } from '@/lib/supabase/tag-orders';
import {
  TAG_MAX_QUANTITY,
  TAG_ORDER_TYPES,
  TAG_SHIPPING_CENTS,
  TAG_UNIT_PRICE_CENTS,
  calculateTagOrderTotal,
  formatUsdFromCents,
  type TagOrderType,
} from '@/lib/tag-orders';

export default function OrderTagScreen() {
  const insets = useSafeAreaInsets();
  const { pet: petParam } = useLocalSearchParams<{ pet?: string }>();
  const { showToast } = useToast();
  const { owner, pets, pet, isLoggedIn, hydrated } = useUser();
  const initialPetQrCodeId =
    (typeof petParam === 'string' && pets.some((entry) => entry.qrCodeId === petParam) ? petParam : null) ??
    pet?.qrCodeId ??
    pets[0]?.qrCodeId ??
    '';
  const [selectedPetQrCodeId, setSelectedPetQrCodeId] = useState(initialPetQrCodeId);
  const [orderType, setOrderType] = useState<TagOrderType>('replacement');
  const [quantity, setQuantity] = useState(1);
  const [designId, setDesignId] = useState(DEFAULT_QR_DESIGN_ID);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPet = pets.find((entry) => entry.qrCodeId === selectedPetQrCodeId) ?? pet ?? pets[0];
  const selectedDesign = getQrDesign(designId);
  const pricing = useMemo(() => calculateTagOrderTotal(quantity), [quantity]);

  useEffect(() => {
    if (hydrated && !isLoggedIn) {
      router.replace('/login');
    }
  }, [hydrated, isLoggedIn]);

  useEffect(() => {
    if (pet?.qrCodeId) {
      setSelectedPetQrCodeId(pet.qrCodeId);
      setDesignId(pet.qrDesignId ?? DEFAULT_QR_DESIGN_ID);
    }
  }, [pet?.qrCodeId, pet?.qrDesignId]);

  if (!hydrated || !isLoggedIn || !owner || !selectedPet) {
    return null;
  }

  const shipLine = [owner.address, owner.city, owner.state, owner.zip].filter(Boolean).join(', ');
  const canSubmit = Boolean(owner.address.trim() && owner.city.trim() && owner.zip.trim());

  const handleSubmit = async () => {
    if (!canSubmit) {
      showToast('Add a shipping address in Account before ordering');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createTagOrder({
        ownerEmail: owner.email,
        ownerName: owner.fullName,
        petQrCodeId: selectedPet.qrCodeId,
        petName: selectedPet.name,
        qrDesignId: designId,
        orderType,
        quantity,
        shipAddress: owner.address,
        shipCity: owner.city,
        shipState: owner.state,
        shipZip: owner.zip,
        shipPhone: owner.phone,
        notes,
      });

      router.replace({
        pathname: '/order-tag-success',
        params: {
          orderId: order.id,
          petName: selectedPet.name,
          quantity: String(quantity),
          designName: selectedDesign.name,
          total: formatUsdFromCents(order.totalCents),
        },
      });
    } catch (err) {
      if (isMissingSchemaError(err)) {
        showToast('Run supabase/migrations/005_tag_orders.sql in Supabase, then try again.');
      } else {
        showToast(getErrorMessage(err, 'Could not place your order.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <AppBackButton fallbackHref="/(tabs)/account" variant="icon" />
        <Text style={styles.topTitle}>Order a tag</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}>
        <Text style={styles.title}>Order another tag</Text>
        <Text style={styles.sub}>
          Durable steel QR tags laser-etched with {selectedPet.name}&apos;s profile link. Same QR code —
          no profile changes needed.
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
                      setDesignId(entry.qrDesignId ?? DEFAULT_QR_DESIGN_ID);
                    }}>
                    <Text style={[styles.petChipText, active && styles.petChipTextActive]}>{entry.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <SectionLabel label="Order type" />
        <View style={styles.typeRow}>
          {TAG_ORDER_TYPES.map((type) => {
            const active = orderType === type.id;
            return (
              <Pressable
                key={type.id}
                style={[styles.typeCard, active && styles.typeCardActive]}
                onPress={() => setOrderType(type.id)}>
                <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{type.label}</Text>
                <Text style={styles.typeSub}>{type.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionLabel label="Quantity" />
        <View style={styles.qtyRow}>
          <Pressable
            style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
            onPress={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}>
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <Pressable
            style={[styles.qtyBtn, quantity >= TAG_MAX_QUANTITY && styles.qtyBtnDisabled]}
            onPress={() => setQuantity((value) => Math.min(TAG_MAX_QUANTITY, value + 1))}
            disabled={quantity >= TAG_MAX_QUANTITY}>
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
          <Text style={styles.qtyHint}>Max {TAG_MAX_QUANTITY} per order</Text>
        </View>

        <SectionLabel label="Tag design" />
        <View style={styles.previewCard}>
          <QrTagPreview
            designId={designId}
            qrCodeId={selectedPet.qrCodeId}
            petName={selectedPet.name}
            size="lg"
          />
          <Text style={styles.previewName}>{selectedDesign.name}</Text>
          <Text style={styles.previewSub}>{selectedDesign.material}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.designRow}>
          {QR_DESIGN_TEMPLATES.map((template) => {
            const active = designId === template.id;
            return (
              <Pressable
                key={template.id}
                style={[styles.designChip, active && styles.designChipActive]}
                onPress={() => setDesignId(template.id)}>
                <QrTagPreview
                  designId={template.id}
                  qrCodeId={selectedPet.qrCodeId}
                  petName={selectedPet.name}
                  size="sm"
                  showLabel={false}
                />
                <Text style={[styles.designChipText, active && styles.designChipTextActive]} numberOfLines={1}>
                  {template.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable style={styles.designLink} onPress={() => router.push('/qr-design')}>
          <Text style={styles.designLinkText}>Browse full design gallery →</Text>
        </Pressable>

        <SectionLabel label="Ship to" />
        <View style={styles.shipCard}>
          <Text style={styles.shipName}>{owner.fullName}</Text>
          <Text style={styles.shipLine}>{shipLine || 'No address on file'}</Text>
          {owner.phone ? <Text style={styles.shipPhone}>{owner.phone}</Text> : null}
          {!canSubmit ? (
            <Text style={styles.shipWarn}>Update your address when signing up or contact support to ship.</Text>
          ) : null}
        </View>

        <FormField
          label="Order notes (optional)"
          placeholder="e.g. Engrave nickname, leave at front door"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.notesInput}
        />

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {quantity}× {selectedDesign.name} tag
            </Text>
            <Text style={styles.summaryValue}>{formatUsdFromCents(TAG_UNIT_PRICE_CENTS * quantity)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {TAG_SHIPPING_CENTS === 0 ? 'Free' : formatUsdFromCents(TAG_SHIPPING_CENTS)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatUsdFromCents(pricing.totalCents)}</Text>
          </View>
          <Text style={styles.summaryNote}>
            Payment is collected when we confirm your order by email. Tags ship in 5–7 business days.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={submitting ? 'Placing order…' : `Place order · ${formatUsdFromCents(pricing.totalCents)}`}
          variant="forest"
          onPress={() => void handleSubmit()}
          disabled={submitting || !canSubmit}
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
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  typeCardActive: { borderColor: Colors.forest, backgroundColor: Colors.sagePale },
  typeLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.ink },
  typeLabelActive: { color: Colors.forest },
  typeSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mid, marginTop: 4, lineHeight: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 20, color: Colors.forest },
  qtyValue: { fontFamily: Fonts.sansSemiBold, fontSize: 22, color: Colors.ink, minWidth: 24, textAlign: 'center' },
  qtyHint: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.light, flex: 1 },
  previewCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingVertical: 24,
    marginBottom: 12,
    ...Shadows.card,
  },
  previewName: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.forest, marginTop: 14 },
  previewSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mid, marginTop: 4 },
  designRow: { gap: 10, paddingBottom: 8 },
  designChip: {
    width: 108,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  designChipActive: { borderColor: Colors.forest, backgroundColor: Colors.sagePale },
  designChipText: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    color: Colors.mid,
    marginTop: 6,
    textAlign: 'center',
  },
  designChipTextActive: { color: Colors.forest },
  designLink: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 8 },
  designLinkText: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.forest },
  shipCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.card,
  },
  shipName: { fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.ink },
  shipLine: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.mid, marginTop: 6, lineHeight: 20 },
  shipPhone: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.light, marginTop: 4 },
  shipWarn: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.danger, marginTop: 10 },
  notesInput: { minHeight: 88, textAlignVertical: 'top' },
  summaryCard: {
    backgroundColor: Colors.forest,
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontFamily: Fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.78)' },
  summaryValue: { fontFamily: Fonts.sansMedium, fontSize: 13, color: Colors.white },
  summaryTotalRow: { marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  summaryTotalLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 16, color: Colors.white },
  summaryTotalValue: { fontFamily: Fonts.sansSemiBold, fontSize: 16, color: Colors.gold },
  summaryNote: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 10,
    lineHeight: 16,
  },
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
