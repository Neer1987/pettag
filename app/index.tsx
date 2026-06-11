import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Colors, Fonts } from '@/constants/theme';

export default function LandingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 28 }]}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <View style={styles.imageRing}>
          <Image
            source={require('@/assets/images/landing-pet.jpg')}
            style={styles.petImage}
            contentFit="cover"
            transition={300}
          />
        </View>

        <Text style={styles.title}>
          Pet<Text style={styles.titleAccent}>Tag</Text>
        </Text>
        <Text style={styles.subtitle}>
          Professional pet profiles with QR tags, medical records, and lost-pet alerts.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button label="Sign Up" variant="gold" onPress={() => router.push('/signup')} />
        <Pressable style={styles.loginLink} onPress={() => router.push('/login')}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginBold}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.forest,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 42,
    color: Colors.white,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleAccent: {
    color: Colors.gold,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300,
  },
  footer: {
    gap: 16,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },
  loginBold: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.gold,
  },
});
