import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/app-back-button';
import { Button } from '@/components/ui/button';
import { Colors, Fonts } from '@/constants/theme';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { openPetProfileFromScan, parsePetQrCodeId } from '@/lib/pet-link';

export default function ScanQrScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { pets } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const scannedRef = useRef(false);

  const ownPetQrCodeIds = pets.map((pet) => pet.qrCodeId);

  const handleBarcode = useCallback(
    (raw: string) => {
      if (!scanning || scannedRef.current) return;

      const qrCodeId = parsePetQrCodeId(raw);
      if (!qrCodeId) {
        showToast('This is not a PetTag QR code');
        return;
      }

      scannedRef.current = true;
      setScanning(false);

      if (ownPetQrCodeIds.includes(qrCodeId)) {
        showToast('This is your pet’s tag — opening your profile');
      }

      openPetProfileFromScan(qrCodeId, { ownPetQrCodeIds, replace: true });
    },
    [ownPetQrCodeIds, scanning, showToast],
  );

  const resumeScan = () => {
    scannedRef.current = false;
    setScanning(true);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 24 }]}>
        <StatusBar style="dark" />
        <AppBackButton fallbackHref="/(tabs)/" />
        <Text style={styles.webTitle}>Scan on your phone</Text>
        <Text style={styles.webSub}>
          QR scanning needs the PetTag app on iOS or Android. Point your camera at a pet tag, or open the
          profile link in your browser.
        </Text>
        <Button label="Back to app" variant="forest" onPress={() => router.back()} />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 24 }]}>
        <StatusBar style="dark" />
        <Text style={styles.webSub}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 24, paddingHorizontal: 28 }]}>
        <StatusBar style="dark" />
        <AppBackButton fallbackHref="/(tabs)/" />
        <Text style={styles.webTitle}>Camera access needed</Text>
        <Text style={styles.webSub}>
          Allow camera access to scan a PetTag QR code on a found pet’s collar or tag.
        </Text>
        <Button label="Allow camera" variant="forest" onPress={() => void requestPermission()} />
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>Not now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? ({ data }) => handleBarcode(data) : undefined}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.topBar}>
          <AppBackButton fallbackHref="/(tabs)/" variant="pill" light />
        </View>

        <View style={styles.centerBlock}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.hintTitle}>Scan PetTag QR</Text>
          <Text style={styles.hintSub}>
            Point at the QR on a pet’s tag. If you have PetTag, the profile opens here in the app.
          </Text>
        </View>

        {!scanning ? (
          <Pressable style={styles.scanAgainBtn} onPress={resumeScan}>
            <Text style={styles.scanAgainText}>Scan another tag</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const FRAME = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ink },
  centered: { alignItems: 'stretch' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15,27,20,0.35)',
  },
  topBar: { paddingHorizontal: 16 },
  centerBlock: { alignItems: 'center', paddingHorizontal: 28 },
  frame: {
    width: FRAME,
    height: FRAME,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: Colors.white,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  hintTitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 28,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  hintSub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 21,
  },
  scanAgainBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  scanAgainText: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.white },
  webTitle: {
    fontFamily: Fonts.serifItalic,
    fontSize: 26,
    color: Colors.ink,
    marginTop: 24,
    marginBottom: 10,
  },
  webSub: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.mid,
    lineHeight: 22,
    marginBottom: 24,
  },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  secondaryBtnText: { fontFamily: Fonts.sansMedium, fontSize: 14, color: Colors.forest },
});
