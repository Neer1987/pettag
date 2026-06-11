import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QrTagPreview } from '@/components/qr-tag-preview';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_QR_DESIGN_ID,
  QR_DESIGN_CATEGORIES,
  QR_DESIGN_TEMPLATES,
  getQrDesign,
  getTemplatesByCategory,
  type QrDesignCategory,
} from '@/constants/qr-templates';
import { Colors, Fonts, Shadows } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';

const CATEGORY_FILTERS: Array<QrDesignCategory | 'All'> = ['All', ...QR_DESIGN_CATEGORIES];

export default function QrDesignScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { pet, setQrDesign } = useUser();
  const [selected, setSelected] = useState(pet?.qrDesignId ?? DEFAULT_QR_DESIGN_ID);
  const [category, setCategory] = useState<QrDesignCategory | 'All'>('All');

  const selectedDesign = getQrDesign(selected);
  const templates = useMemo(() => getTemplatesByCategory(category), [category]);

  const handleConfirm = () => {
    setQrDesign(selected);
    showToast(`${selectedDesign.name} tag design saved!`);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.topTitle}>Pick your tag style</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <Text style={styles.title}>Make it unforgettable</Text>
        <Text style={styles.sub}>
          Choose a tag design {pet?.name ? `${pet.name} ` : ''}will love — patriotic pride, fairy-tale magic,
          hero power, and more. Laser-etched on durable steel.
        </Text>

        <View style={styles.heroPreview}>
          <QrTagPreview designId={selected} qrCodeId={pet?.qrCodeId} petName={pet?.name} size="lg" />
          <Text style={styles.heroCaption}>
            {selectedDesign.emoji ? `${selectedDesign.emoji} ` : ''}
            {selectedDesign.name}
          </Text>
          <Text style={styles.heroSub}>{selectedDesign.subtitle}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CATEGORY_FILTERS.map((item) => {
            const active = category === item;
            return (
              <Pressable
                key={item}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setCategory(item)}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.gridLabel}>
          {category === 'All' ? 'All designs' : `${category} designs`} · {templates.length}
        </Text>
        <View style={styles.grid}>
          {templates.map((template) => {
            const isSelected = selected === template.id;
            return (
              <Pressable
                key={template.id}
                style={[styles.templateCard, isSelected && styles.templateCardSelected]}
                onPress={() => setSelected(template.id)}>
                {template.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{template.badge}</Text>
                  </View>
                ) : null}
                <View style={styles.previewWrap}>
                  <QrTagPreview
                    designId={template.id}
                    qrCodeId={pet?.qrCodeId}
                    petName={pet?.name}
                    size="sm"
                    showLabel={false}
                  />
                </View>
                <View style={styles.templateTitleRow}>
                  {template.emoji ? <Text style={styles.templateEmoji}>{template.emoji}</Text> : null}
                  <Text style={styles.templateName}>{template.name}</Text>
                </View>
                <Text style={styles.templateSub}>{template.subtitle}</Text>
                <Text style={styles.templateMaterial}>{template.material}</Text>
                {isSelected ? (
                  <View style={styles.selectedMark}>
                    <Text style={styles.selectedMarkText}>✓ Selected</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label={`Confirm ${selectedDesign.name}`} variant="forest" onPress={handleConfirm} />
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  backText: { fontSize: 18, color: Colors.forest },
  topTitle: { flex: 1, fontFamily: Fonts.sansSemiBold, fontSize: 15, color: Colors.ink, textAlign: 'center' },
  topSpacer: { width: 38 },
  scroll: { paddingHorizontal: 20 },
  title: {
    fontFamily: Fonts.serifItalic,
    fontSize: 28,
    color: Colors.ink,
    marginTop: 8,
    marginBottom: 8,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    lineHeight: 22,
    marginBottom: 24,
  },
  heroPreview: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginBottom: 20,
    ...Shadows.card,
  },
  heroCaption: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.forest,
    marginTop: 16,
  },
  heroSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.mid,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  filterChipActive: {
    backgroundColor: Colors.forest,
    borderColor: Colors.forest,
  },
  filterText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.mid },
  filterTextActive: { color: Colors.white },
  gridLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Colors.light,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadows.card,
    position: 'relative',
  },
  templateCardSelected: {
    borderColor: Colors.forest,
    backgroundColor: Colors.sagePale,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  badgeText: { fontFamily: Fonts.sansSemiBold, fontSize: 8, color: Colors.white, letterSpacing: 0.3 },
  previewWrap: { alignItems: 'center', marginBottom: 10, minHeight: 100 },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateEmoji: { fontSize: 14 },
  templateName: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.ink, flex: 1 },
  templateSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.mid, marginTop: 2 },
  templateMaterial: { fontFamily: Fonts.sans, fontSize: 9, color: Colors.light, marginTop: 4 },
  selectedMark: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.forest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  selectedMarkText: { fontFamily: Fonts.sansSemiBold, fontSize: 9, color: Colors.white },
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
