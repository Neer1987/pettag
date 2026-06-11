import { DynamicQrCode } from '@/components/dynamic-qr-code';
import { getPetScanUrl } from '@/lib/pet-url';

type PetQrCodeProps = {
  qrCodeId: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
};

export function PetQrCode({
  qrCodeId,
  size = 108,
  color = '#0F2D1E',
  backgroundColor = '#FFFFFF',
}: PetQrCodeProps) {
  return (
    <DynamicQrCode
      value={getPetScanUrl(qrCodeId)}
      size={size}
      color={color}
      backgroundColor={backgroundColor}
    />
  );
}
