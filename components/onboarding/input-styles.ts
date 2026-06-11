import { Platform, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';

export const inputStyles = StyleSheet.create({
  base: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    paddingHorizontal: 18,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.ink,
    minHeight: 54,
  },
  focused: {
    borderColor: Colors.forest,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: Colors.forest,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  error: {
    borderColor: Colors.danger,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
});
