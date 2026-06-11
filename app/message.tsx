import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/app-back-button';
import { FormField } from '@/components/onboarding/form-field';
import { Button } from '@/components/ui/button';
import { Colors, Fonts } from '@/constants/theme';
import { useInbox } from '@/contexts/inbox-context';
import { useToast } from '@/contexts/toast-context';
import { useUser } from '@/contexts/user-context';
import { getErrorMessage } from '@/lib/errors';

function foundPetTemplate(petName: string) {
  return `Hi! I believe I found ${petName}. They appear safe. Please contact me so we can reunite you. I'm currently at: `;
}

export default function MessageScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { sendMessage } = useInbox();
  const { owner, isLoggedIn } = useUser();
  const { petName, petSlug, recipientEmail, foundPet } = useLocalSearchParams<{
    petName?: string;
    petSlug?: string;
    recipientEmail?: string;
    foundPet?: string;
  }>();

  const isFoundPet = foundPet === '1';
  const initialBody = useMemo(
    () => (isFoundPet && petName ? foundPetTemplate(petName) : ''),
    [isFoundPet, petName],
  );

  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    if (isLoggedIn && owner) {
      setSenderName(owner.fullName);
      setSenderEmail(owner.email);
    }
  }, [isLoggedIn, owner]);

  const handleSend = async () => {
    if (!senderName.trim() || !body.trim()) {
      showToast('Please enter your name and message');
      return;
    }
    if (!recipientEmail?.trim() || !petName || !petSlug) {
      showToast('Unable to send message');
      return;
    }
    if (!senderEmail.trim()) {
      showToast('Please enter your email so the pet parent can reply in the app');
      return;
    }

    try {
      await sendMessage({
        recipientEmail,
        petName,
        petSlug,
        senderName,
        senderEmail: senderEmail.trim(),
        body,
        notifyKind: isFoundPet ? 'pet_found' : 'inbox_message',
      });
      showToast(
        isFoundPet
          ? 'Message sent — the pet parent will be notified in PetTag'
          : 'Message sent to pet parent',
      );
      router.back();
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to send message.'));
    }
  };

  const title = isFoundPet ? 'Report pet found' : 'Message pet parent';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <AppBackButton variant="icon" fallbackHref="/(tabs)/inbox" />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.sub}>
          {isFoundPet
            ? `Let ${petName ?? 'the owner'} know you may have found their pet. Add your email so they can reply in the PetTag app.`
            : `Send a message about ${petName ?? 'this pet'}. The owner will be notified in their PetTag inbox.`}
        </Text>

        <FormField
          label="Your name"
          placeholder="e.g. Alex Morgan"
          value={senderName}
          onChangeText={setSenderName}
        />
        <FormField
          label="Your email (for in-app replies)"
          placeholder="you@email.com"
          value={senderEmail}
          onChangeText={setSenderEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.msgLabel}>Message</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Hi, I found your pet near..."
          placeholderTextColor={Colors.light}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />

        <Button
          label={isFoundPet ? 'Send found-pet alert' : 'Send message'}
          variant="forest"
          onPress={handleSend}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  title: { flex: 1, fontFamily: Fonts.serifItalic, fontSize: 22, color: Colors.ink },
  topSpacer: { width: 42 },
  scroll: { paddingHorizontal: 20 },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.mid,
    lineHeight: 21,
    marginBottom: 18,
  },
  msgLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  textarea: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.ink,
    minHeight: 140,
    marginBottom: 20,
  },
});
