import QRCode from 'qrcode';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

type DynamicQrCodeProps = {
  value: string;
  size: number;
  color?: string;
  backgroundColor?: string;
};

export function DynamicQrCode({
  value,
  size,
  color = '#0F2D1E',
  backgroundColor = '#FFFFFF',
}: DynamicQrCodeProps) {
  const matrix = useMemo(() => {
    if (!value.trim()) return null;
    try {
      return QRCode.create(value, { errorCorrectionLevel: 'M' });
    } catch {
      return null;
    }
  }, [value]);

  if (!matrix) {
    return <View style={{ width: size, height: size, backgroundColor }} />;
  }

  const count = matrix.modules.size;
  const cellSize = size / count;
  const cells = [];

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!matrix.modules.get(row, col)) continue;
      cells.push(
        <View
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            left: col * cellSize,
            top: row * cellSize,
            width: cellSize,
            height: cellSize,
            backgroundColor: color,
          }}
        />,
      );
    }
  }

  return (
    <View
      style={[styles.wrap, { width: size, height: size, backgroundColor }]}
      accessibilityLabel="Pet profile QR code">
      {cells}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
