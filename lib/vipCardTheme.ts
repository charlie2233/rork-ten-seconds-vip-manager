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
    // Industrial Silver: Brushed metal look, clean but tangible
    gradient: ['#E8EAEF', '#BCC6CC', '#8B9AA5', '#52616D'], 
    overlayGradient: ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.0)', 'rgba(0,0,0,0.1)'],
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderGlow: 'rgba(192,192,192,0.4)',
    accent: '#2C3E50', // Dark text for contrast on bright silver
    accentLight: '#52616D',
    text: '#1A2633', // Dark text
    textSecondary: 'rgba(26, 38, 51, 0.8)',
    textMuted: 'rgba(26, 38, 51, 0.6)',
    qrBackground: 'rgba(255,255,255,0.8)',
    shimmer: 'rgba(255,255,255,0.4)',
    shimmerIntense: 'rgba(255,255,255,0.8)',
    decorationBorder: 'rgba(26, 38, 51, 0.1)',
    patternColor: 'rgba(26, 38, 51, 0.05)',
    glowColor: 'rgba(188, 198, 204, 0.5)',
    chipGradient: ['#E0E5E9', '#A4B0B9'],
    tierBadgeGradient: ['#F5F7FA', '#D7DEE5'],
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
    // Premium Platinum: Dark, sleek, futuristic, "liquid metal"
    gradient: ['#495057', '#8E9EAB', '#CED4DA', '#ADB5BD', '#343A40'],
    overlayGradient: ['rgba(255,255,255,0.15)', 'rgba(0,0,0,0.5)'],
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderGlow: 'rgba(206, 212, 218, 0.5)',
    accent: '#F8F9FA',
    accentLight: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.9)',
    textMuted: 'rgba(255,255,255,0.6)',
    qrBackground: 'rgba(255,255,255,0.9)',
    shimmer: 'rgba(255,255,255,0.2)',
    shimmerIntense: 'rgba(165, 243, 252, 0.4)', // Cyan tinted shimmer for platinum
    decorationBorder: 'rgba(255,255,255,0.15)',
    patternColor: 'rgba(255,255,255,0.05)',
    glowColor: 'rgba(142, 158, 171, 0.6)',
    chipGradient: ['#E9ECEF', '#6C757D'],
    tierBadgeGradient: ['#DEE2E6', '#6C757D'],
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
