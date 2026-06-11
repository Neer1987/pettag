import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_EMAIL_KEY = '@pettag/session_email';

export async function loadSessionEmail(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SESSION_EMAIL_KEY);
  } catch {
    return null;
  }
}

export async function saveSessionEmail(email: string | null) {
  if (!email) {
    await AsyncStorage.removeItem(SESSION_EMAIL_KEY);
    return;
  }
  await AsyncStorage.setItem(SESSION_EMAIL_KEY, email.trim().toLowerCase());
}

export async function clearSessionEmail() {
  await AsyncStorage.removeItem(SESSION_EMAIL_KEY);
}
