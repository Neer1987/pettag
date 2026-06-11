import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(msg);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 16, duration: 260, useNativeDriver: true }),
        ]).start();
      }, 2800);
    },
    [opacity, translateY],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Animated.View
        style={[styles.toast, { opacity, transform: [{ translateY }] }]}
        pointerEvents="none">
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    zIndex: 300,
  },
  toastText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.white,
  },
});
