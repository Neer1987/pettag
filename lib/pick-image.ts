import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function pickImageFromCamera(): Promise<string | null> {
  const allowed = await requestCameraPermission();
  if (!allowed) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function pickImageFromLibrary(): Promise<string | null> {
  const allowed = await requestLibraryPermission();
  if (!allowed) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export function showPhotoSourcePicker(
  onCamera: () => void,
  onLibrary: () => void,
): void {
  if (Platform.OS === 'web') {
    onLibrary();
    return;
  }

  Alert.alert('Add cover photo', 'Choose how you want to add a photo', [
    { text: 'Take photo', onPress: onCamera },
    { text: 'Choose from library', onPress: onLibrary },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function showMediaSourcePicker(handlers: {
  onPhotoCamera: () => void;
  onPhotoLibrary: () => void;
}): void {
  if (Platform.OS === 'web') {
    handlers.onPhotoLibrary();
    return;
  }

  Alert.alert('Add photo', 'Photos appear on your public pet page.', [
    { text: 'Take photo', onPress: handlers.onPhotoCamera },
    { text: 'Choose photo', onPress: handlers.onPhotoLibrary },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

type CoverPhotoOption = {
  uri: string;
  label: string;
};

export function showCoverPhotoPicker(options: {
  existingPhotos: CoverPhotoOption[];
  onSelect: (uri: string) => void;
}): void {
  const pickFromCamera = async () => {
    const uri = await pickImageFromCamera();
    if (uri) options.onSelect(uri);
  };

  const pickFromLibrary = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) options.onSelect(uri);
  };

  const pickNewPhoto = () => {
    showPhotoSourcePicker(
      () => void pickFromCamera(),
      () => void pickFromLibrary(),
    );
  };

  const chooseExisting = () => {
    const { existingPhotos } = options;
    if (existingPhotos.length === 1) {
      options.onSelect(existingPhotos[0].uri);
      return;
    }

    Alert.alert(
      'Choose from photos',
      'Select a photo to use as the cover.',
      [
        ...existingPhotos.map((photo) => ({
          text: photo.label,
          onPress: () => options.onSelect(photo.uri),
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  if (Platform.OS === 'web') {
    if (options.existingPhotos.length > 0) {
      Alert.alert('Change cover photo', 'Choose a new cover or pick from your photos.', [
        { text: 'Choose from photos', onPress: chooseExisting },
        { text: 'Upload photo', onPress: pickNewPhoto },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      pickNewPhoto();
    }
    return;
  }

  const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }[] = [];

  if (options.existingPhotos.length > 0) {
    buttons.push({ text: 'Choose from photos', onPress: chooseExisting });
  }
  buttons.push(
    { text: 'Take photo', onPress: () => void pickFromCamera() },
    { text: 'Choose from library', onPress: () => void pickFromLibrary() },
    { text: 'Cancel', style: 'cancel' },
  );

  Alert.alert(
    'Change cover photo',
    'This photo appears at the top of your pet profile and on the home screen.',
    buttons,
  );
}
