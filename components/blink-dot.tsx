import { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

export function BlinkDot({ style, color = Colors.white }: { style?: ViewStyle; color?: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 550, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity }, style]}
    />
  );
}
