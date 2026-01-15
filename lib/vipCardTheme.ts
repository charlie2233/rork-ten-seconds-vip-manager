import type { User } from '@/types';

export type VipCardTheme = {
  gradient: readonly [string, string, string];
  overlayGradient: readonly [string, string];
  borderColor: string;
  borderGlow: string;
  accent: string;
  accentLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  qrBackground: string;
  shimmer: string;
  shimmerIntense: string;
  decorationBorder: string;
  patternColor: string;
  glowColor: string;
  chipGradient: readonly [string, string];
  tierBadgeGradient: readonly [string, string];
  tierIcon: string;
  backgroundImage?: string; // Placeholder for potential background images
};

const BASE_TEXT = '#FFFFFF';

const THEMES: Readonly<Record<User['tier'], VipCardTheme>> = {
  silver: {
    gradient: ['#8E9EAB', '#5C6B7F', '#2C3E50'], // Cool metallic silver/blue-grey
    overlayGradient: ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.2)'],
    borderColor: 'rgba(224, 231, 239, 0.5)',
    borderGlow: 'rgba(192,192,192,0.6)',
    accent: '#E0E7EF',
    accentLight: '#FFFFFF',
    text: BASE_TEXT,
    textSecondary: 'rgba(255,255,255,0.9)',
    textMuted: 'rgba(255,255,255,0.7)',
    qrBackground: 'rgba(255,255,255,0.9)',
    shimmer: 'rgba(255,255,255,0.2)',
    shimmerIntense: 'rgba(255,255,255,0.5)',
    decorationBorder: 'rgba(255,255,255,0.15)',
    patternColor: 'rgba(255,255,255,0.05)',
    glowColor: 'rgba(142, 158, 171, 0.6)',
    chipGradient: ['#D7DDE8', '#757F9A'],
    tierBadgeGradient: ['#E0E7EF', '#B4C6DB'],
    tierIcon: '🥈',
  },
  gold: {
    gradient: ['#DBA514', '#AA771C', '#583C08'], // Richer, deeper gold
    overlayGradient: ['rgba(255, 223, 128, 0.15)', 'rgba(0,0,0,0.3)'],
    borderColor: 'rgba(255, 215, 0, 0.6)',
    borderGlow: 'rgba(255, 215, 0, 0.5)',
    accent: '#FFD700',
    accentLight: '#FFF2C2',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.95)',
    textMuted: 'rgba(255,255,255,0.75)',
    qrBackground: 'rgba(255,255,255,0.95)',
    shimmer: 'rgba(255, 255, 255, 0.25)',
    shimmerIntense: 'rgba(255, 215, 0, 0.5)',
    decorationBorder: 'rgba(255, 215, 0, 0.25)',
    patternColor: 'rgba(255, 215, 0, 0.1)',
    glowColor: 'rgba(219, 165, 20, 0.7)',
    chipGradient: ['#FFD700', '#B8860B'],
    tierBadgeGradient: ['#FFE57F', '#D4AF37'],
    tierIcon: '🥇',
  },
  platinum: {
    gradient: ['#E3E3E3', '#8E8E8E', '#2B2B2B'], // High contrast platinum
    overlayGradient: ['rgba(255,255,255,0.2)', 'rgba(0,0,0,0.4)'],
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderGlow: 'rgba(255, 255, 255, 0.6)',
    accent: '#FFFFFF',
    accentLight: '#FFFFFF',
    text: BASE_TEXT,
    textSecondary: 'rgba(255,255,255,0.95)',
    textMuted: 'rgba(255,255,255,0.7)',
    qrBackground: 'rgba(255,255,255,0.9)',
    shimmer: 'rgba(255,255,255,0.3)',
    shimmerIntense: 'rgba(255,255,255,0.6)',
    decorationBorder: 'rgba(255,255,255,0.2)',
    patternColor: 'rgba(255,255,255,0.08)',
    glowColor: 'rgba(200, 200, 200, 0.6)',
    chipGradient: ['#FFFFFF', '#A9A9A9'],
    tierBadgeGradient: ['#F5F5F5', '#C0C0C0'],
    tierIcon: '⭐',
  },
  diamond: {
    gradient: ['#2C5364', '#203A43', '#0F2027'], // Deep mysterious blue/teal
    overlayGradient: ['rgba(0, 255, 255, 0.1)', 'rgba(0,0,0,0.4)'],
    borderColor: 'rgba(64, 224, 208, 0.5)',
    borderGlow: 'rgba(0, 255, 255, 0.4)',
    accent: '#40E0D0',
    accentLight: '#E0FFFF',
    text: '#F0FFFF',
    textSecondary: 'rgba(240, 255, 255, 0.9)',
    textMuted: 'rgba(240, 255, 255, 0.7)',
    qrBackground: 'rgba(255,255,255,0.9)',
    shimmer: 'rgba(255, 255, 255, 0.2)',
    shimmerIntense: 'rgba(64, 224, 208, 0.5)',
    decorationBorder: 'rgba(64, 224, 208, 0.2)',
    patternColor: 'rgba(64, 224, 208, 0.1)',
    glowColor: 'rgba(44, 83, 100, 0.7)',
    chipGradient: ['#7FFFD4', '#2C5364'],
    tierBadgeGradient: ['#E0FFFF', '#40E0D0'],
    tierIcon: '💎',
  },
  blackGold: {
    gradient: ['#1C1C1C', '#000000', '#1C1C1C'], // Matte black texture
    overlayGradient: ['rgba(212, 175, 55, 0.1)', 'rgba(0,0,0,0.6)'],
    borderColor: 'rgba(212, 175, 55, 0.8)', // Gold border
    borderGlow: 'rgba(212, 175, 55, 0.6)',
    accent: '#D4AF37',
    accentLight: '#F7E7CE',
    text: '#FFF8E7',
    textSecondary: 'rgba(255, 248, 231, 0.9)',
    textMuted: 'rgba(255, 248, 231, 0.6)',
    qrBackground: 'rgba(255,255,255,0.9)',
    shimmer: 'rgba(255, 215, 0, 0.2)',
    shimmerIntense: 'rgba(255, 215, 0, 0.5)',
    decorationBorder: 'rgba(212, 175, 55, 0.3)',
    patternColor: 'rgba(212, 175, 55, 0.15)',
    glowColor: 'rgba(212, 175, 55, 0.4)',
    chipGradient: ['#D4AF37', '#8B6914'],
    tierBadgeGradient: ['#F7E7CE', '#C5A028'],
    tierIcon: '👑',
  },
};

export function getVipCardTheme(tier: User['tier']): VipCardTheme {
  return THEMES[tier] ?? THEMES.silver;
}
