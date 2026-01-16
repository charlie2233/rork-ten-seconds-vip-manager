import type { User } from '@/types';

export type VipCardTheme = {
  gradient: readonly [string, string, ...string[]];
  overlayGradient: readonly [string, string, ...string[]];
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
  chipGradient: readonly [string, string, ...string[]];
  tierBadgeGradient: readonly [string, string, ...string[]];
  tierIcon: string;
  texture?: 'brushed' | 'grain' | 'carbon' | 'none';
};

const THEMES: Readonly<Record<User['tier'], VipCardTheme>> = {
  silver: {
    // Silver: brushed aluminum — clean, crisp highlights, subtle depth
    gradient: ['#FAFBFD', '#E3E9EF', '#B6C2CE', '#6E7F90'],
    overlayGradient: ['rgba(255,255,255,0.62)', 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.14)'],
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderGlow: 'rgba(80, 110, 140, 0.18)',
    accent: '#13202D',
    accentLight: '#334B60',
    text: '#0B1B2B',
    textSecondary: 'rgba(11, 27, 43, 0.82)',
    textMuted: 'rgba(11, 27, 43, 0.6)',
    qrBackground: 'rgba(255,255,255,0.88)',
    shimmer: 'rgba(255,255,255,0.38)',
    shimmerIntense: 'rgba(255,255,255,0.9)',
    decorationBorder: 'rgba(11, 27, 43, 0.12)',
    patternColor: 'rgba(11, 27, 43, 0.035)',
    glowColor: 'rgba(195, 210, 225, 0.5)',
    chipGradient: ['#F2F5F8', '#B7C3CF'],
    tierBadgeGradient: ['rgba(255,255,255,0.9)', 'rgba(217, 228, 238, 0.75)'],
    tierIcon: '🥈',
    texture: 'brushed',
  },
  gold: {
    // Luxurious Gold: Warm, rich, radiant
    gradient: ['#FAD961', '#F76B1C', '#8A4B06'], // More vibrant amber/gold
    overlayGradient: ['rgba(255, 255, 255, 0.3)', 'rgba(0,0,0,0.2)'],
    borderColor: 'rgba(255, 223, 128, 0.8)',
    borderGlow: 'rgba(255, 215, 0, 0.6)',
    accent: '#FFF8E7',
    accentLight: '#FFF2C2',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.95)',
    textMuted: 'rgba(255,255,255,0.75)',
    qrBackground: 'rgba(255,255,255,0.95)',
    shimmer: 'rgba(255, 255, 255, 0.3)',
    shimmerIntense: 'rgba(255, 255, 200, 0.6)',
    decorationBorder: 'rgba(255, 255, 255, 0.3)',
    patternColor: 'rgba(255, 255, 255, 0.15)',
    glowColor: 'rgba(247, 107, 28, 0.5)',
    chipGradient: ['#FFD700', '#DAA520'],
    tierBadgeGradient: ['#FFF8E7', '#FAD961'],
    tierIcon: '🥇',
    texture: 'grain',
  },
  platinum: {
    // Platinum: deep graphite with an icy specular highlight — premium and futuristic
    gradient: ['#0B0F14', '#1B232C', '#6D7E8E', '#25313C', '#0B0F14'],
    overlayGradient: ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.55)'],
    borderColor: 'rgba(255, 255, 255, 0.46)',
    borderGlow: 'rgba(165, 243, 252, 0.22)',
    accent: '#E6F6FF',
    accentLight: '#FFFFFF',
    text: '#F8FAFC',
    textSecondary: 'rgba(248,250,252,0.92)',
    textMuted: 'rgba(248,250,252,0.68)',
    qrBackground: 'rgba(255,255,255,0.92)',
    shimmer: 'rgba(255,255,255,0.18)',
    shimmerIntense: 'rgba(165, 243, 252, 0.55)', // Icy shimmer for platinum
    decorationBorder: 'rgba(230, 246, 255, 0.14)',
    patternColor: 'rgba(230, 246, 255, 0.04)',
    glowColor: 'rgba(152, 181, 200, 0.55)',
    chipGradient: ['#F8FAFC', '#97A8B8'],
    tierBadgeGradient: ['rgba(255,255,255,0.86)', 'rgba(158, 171, 184, 0.55)'],
    tierIcon: '⭐',
    texture: 'grain',
  },
  diamond: {
    gradient: ['#2C5364', '#203A43', '#0F2027'],
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
    texture: 'grain',
  },
  blackGold: {
    gradient: ['#1C1C1C', '#000000', '#1C1C1C'],
    overlayGradient: ['rgba(212, 175, 55, 0.1)', 'rgba(0,0,0,0.6)'],
    borderColor: 'rgba(212, 175, 55, 0.8)',
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
    texture: 'carbon',
  },
};

export function getVipCardTheme(tier: User['tier']): VipCardTheme {
  return THEMES[tier] ?? THEMES.silver;
}
