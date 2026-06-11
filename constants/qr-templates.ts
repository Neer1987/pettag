export const DEFAULT_QR_DESIGN_ID = 'classic-forest';

export type QrThemeStyle =
  | 'classic'
  | 'patriotic'
  | 'fairy'
  | 'hero'
  | 'galaxy'
  | 'rainbow'
  | 'ocean';

export type QrDesignCategory = 'Classic' | 'Kids & Fun' | 'Hero' | 'Patriotic';

export type QrDesignTemplate = {
  id: string;
  name: string;
  subtitle: string;
  material: string;
  category: QrDesignCategory;
  theme: QrThemeStyle;
  frameBg: string;
  frameBorder: string;
  accent: string;
  labelColor: string;
  qrBoxBg: string;
  badge?: string;
  emoji?: string;
  gradient?: readonly [string, string, ...string[]];
  qrColor?: string;
};

export const QR_DESIGN_TEMPLATES: QrDesignTemplate[] = [
  {
    id: 'stars-stripes',
    name: 'Stars & Stripes',
    subtitle: 'Bold red, white & blue — show your pride',
    material: 'Enamel steel · patriotic finish',
    category: 'Patriotic',
    theme: 'patriotic',
    frameBg: '#B22234',
    frameBorder: '#002868',
    accent: '#002868',
    labelColor: '#002868',
    qrBoxBg: '#FFFFFF',
    badge: 'Hot',
    emoji: '🇺🇸',
  },
  {
    id: 'fairy-tale-magic',
    name: 'Fairy Tale Magic',
    subtitle: 'Castle sparkles & storybook wonder',
    material: 'Gloss enamel · iridescent edge',
    category: 'Kids & Fun',
    theme: 'fairy',
    frameBg: '#6B21A8',
    frameBorder: '#FBBF24',
    accent: '#7C3AED',
    labelColor: '#FFFFFF',
    qrBoxBg: '#FFFFFF',
    gradient: ['#7C3AED', '#EC4899', '#FBBF24'],
    badge: 'Kids pick',
    emoji: '🏰',
  },
  {
    id: 'arc-hero',
    name: 'Arc Hero',
    subtitle: 'Power-armor red & gold energy core',
    material: 'Metallic red steel · gold inlay',
    category: 'Hero',
    theme: 'hero',
    frameBg: '#9B1B1B',
    frameBorder: '#FBBF24',
    accent: '#7F1D1D',
    labelColor: '#FBBF24',
    qrBoxBg: '#FFF7ED',
    gradient: ['#DC2626', '#991B1B', '#450A0A'],
    qrColor: '#7F1D1D',
    badge: 'Hero',
    emoji: '🦸',
  },
  {
    id: 'galaxy-explorer',
    name: 'Galaxy Explorer',
    subtitle: 'Deep space purples & shooting stars',
    material: 'Midnight enamel · glow edge',
    category: 'Kids & Fun',
    theme: 'galaxy',
    frameBg: '#1E1B4B',
    frameBorder: '#818CF8',
    accent: '#312E81',
    labelColor: '#E0E7FF',
    qrBoxBg: '#FFFFFF',
    gradient: ['#312E81', '#4C1D95', '#0F172A'],
    emoji: '🚀',
  },
  {
    id: 'rainbow-unicorn',
    name: 'Rainbow Unicorn',
    subtitle: 'Pastel rainbow joy for every pet',
    material: 'Soft-touch enamel · holo rim',
    category: 'Kids & Fun',
    theme: 'rainbow',
    frameBg: '#FDF2F8',
    frameBorder: '#EC4899',
    accent: '#DB2777',
    labelColor: '#831843',
    qrBoxBg: '#FFFFFF',
    gradient: ['#F472B6', '#A78BFA', '#38BDF8', '#4ADE80'],
    emoji: '🦄',
  },
  {
    id: 'ocean-adventure',
    name: 'Ocean Adventure',
    subtitle: 'Waves, bubbles & seaside vibes',
    material: 'Brushed aqua steel',
    category: 'Kids & Fun',
    theme: 'ocean',
    frameBg: '#0C4A6E',
    frameBorder: '#22D3EE',
    accent: '#0369A1',
    labelColor: '#FFFFFF',
    qrBoxBg: '#F0FDFA',
    gradient: ['#0284C7', '#06B6D4', '#0E7490'],
    emoji: '🐠',
  },
  {
    id: 'classic-forest',
    name: 'Classic Forest',
    subtitle: 'Deep green with gold trim',
    material: 'Matte stainless steel',
    category: 'Classic',
    theme: 'classic',
    frameBg: '#0F2D1E',
    frameBorder: '#C8962A',
    accent: '#C8962A',
    labelColor: '#FFFFFF',
    qrBoxBg: '#FFFFFF',
    badge: 'Classic',
  },
  {
    id: 'sage-minimal',
    name: 'Sage Minimal',
    subtitle: 'Soft green, clean lines',
    material: 'Brushed steel finish',
    category: 'Classic',
    theme: 'classic',
    frameBg: '#E8F2EC',
    frameBorder: '#7AAB8A',
    accent: '#2C6444',
    labelColor: '#0F2D1E',
    qrBoxBg: '#FFFFFF',
  },
  {
    id: 'gold-premium',
    name: 'Gold Premium',
    subtitle: 'Warm gold accent ring',
    material: 'Polished steel · gold inlay',
    category: 'Classic',
    theme: 'classic',
    frameBg: '#FBF4E6',
    frameBorder: '#C8962A',
    accent: '#0F2D1E',
    labelColor: '#0F2D1E',
    qrBoxBg: '#FFFFFF',
    badge: 'Premium',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    subtitle: 'Dark slate with silver edge',
    material: 'Black PVD coating',
    category: 'Classic',
    theme: 'classic',
    frameBg: '#0F1B14',
    frameBorder: '#5C7265',
    accent: '#C8962A',
    labelColor: '#FFFFFF',
    qrBoxBg: '#F8F5F0',
  },
  {
    id: 'cream-elegance',
    name: 'Cream Elegance',
    subtitle: 'Light and understated',
    material: 'Satin stainless steel',
    category: 'Classic',
    theme: 'classic',
    frameBg: '#F8F5F0',
    frameBorder: '#0F2D1E',
    accent: '#7AAB8A',
    labelColor: '#0F2D1E',
    qrBoxBg: '#FFFFFF',
  },
  {
    id: 'forest-outline',
    name: 'Forest Outline',
    subtitle: 'White tag, forest border',
    material: 'Enamel white steel',
    category: 'Classic',
    theme: 'classic',
    frameBg: '#FFFFFF',
    frameBorder: '#0F2D1E',
    accent: '#0F2D1E',
    labelColor: '#0F2D1E',
    qrBoxBg: '#F8F5F0',
  },
];

export const QR_DESIGN_CATEGORIES: QrDesignCategory[] = [
  'Patriotic',
  'Kids & Fun',
  'Hero',
  'Classic',
];

export function getQrDesign(id: string | undefined): QrDesignTemplate {
  return QR_DESIGN_TEMPLATES.find((t) => t.id === id) ?? QR_DESIGN_TEMPLATES[0];
}

export function getTemplatesByCategory(category: QrDesignCategory | 'All') {
  if (category === 'All') return QR_DESIGN_TEMPLATES;
  return QR_DESIGN_TEMPLATES.filter((t) => t.category === category);
}
