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
};

const BASE_TEXT = '#FFFFFF';

const THEMES: Readonly<Record<User['tier'], VipCardTheme>> = {
  silver: {
    gradient: ['#3D3D3D', '#2A2A2A', '#1A1A1A'],
    overlayGradient: ['rgba(192,192,192,0.08)', 'rgba(192,192,192,0)'],
    borderColor: 'rgba(192,192,192,0.4)',
    borderGlow: 'rgba(192,192,192,0.3)',
    accent: '#C0C0C0',
    accentLight: '#E8E8E8',
    text: BASE_TEXT,
    textSecondary: 'rgba(255,255,255,0.85)',
    textMuted: 'rgba(255,255,255,0.6)',
    qrBackground: 'rgba(192,192,192,0.15)',
    shimmer: 'rgba(255,255,255,0.12)',
    shimmerIntense: 'rgba(192,192,192,0.25)',
    decorationBorder: 'rgba(192,192,192,0.15)',
    patternColor: 'rgba(192,192,192,0.06)',
    glowColor: 'rgba(192,192,192,0.4)',
    chipGradient: ['#A8A8A8', '#808080'],
    tierBadgeGradient: ['#D4D4D4', '#A0A0A0'],
    tierIcon: '🥈',
  },
  gold: {
    gradient: ['#4A3A1F', '#2E2415', '#1C160C'],
    overlayGradient: ['rgba(201,169,98,0.12)', 'rgba(201,169,98,0)'],
    borderColor: 'rgba(212,175,55,0.55)',
    borderGlow: 'rgba(212,175,55,0.4)',
    accent: '#D4AF37',
    accentLight: '#F4E4BA',
    text: BASE_TEXT,
    textSecondary: 'rgba(255,255,255,0.88)',
    textMuted: 'rgba(255,255,255,0.62)',
    qrBackground: 'rgba(212,175,55,0.15)',
    shimmer: 'rgba(255,255,255,0.15)',
    shimmerIntense: 'rgba(212,175,55,0.35)',
    decorationBorder: 'rgba(212,175,55,0.18)',
    patternColor: 'rgba(212,175,55,0.08)',
    glowColor: 'rgba(212,175,55,0.5)',
    chipGradient: ['#D4AF37', '#AA8A2A'],
    tierBadgeGradient: ['#F4D03F', '#C9A227'],
    tierIcon: '🥇',
  },
  diamond: {
    gradient: ['#1A3A4A', '#122B38', '#0A1C25'],
    overlayGradient: ['rgba(185,242,255,0.1)', 'rgba(185,242,255,0)'],
    borderColor: 'rgba(185,242,255,0.5)',
    borderGlow: 'rgba(185,242,255,0.4)',
    accent: '#B9F2FF',
    accentLight: '#E0FAFF',
    text: '#F0FCFF',
    textSecondary: 'rgba(240,252,255,0.88)',
    textMuted: 'rgba(240,252,255,0.62)',
    qrBackground: 'rgba(185,242,255,0.15)',
    shimmer: 'rgba(255,255,255,0.18)',
    shimmerIntense: 'rgba(185,242,255,0.4)',
    decorationBorder: 'rgba(185,242,255,0.18)',
    patternColor: 'rgba(185,242,255,0.08)',
    glowColor: 'rgba(185,242,255,0.5)',
    chipGradient: ['#B9F2FF', '#7DD8E8'],
    tierBadgeGradient: ['#E0FAFF', '#7DD8E8'],
    tierIcon: '💎',
  },
  platinum: {
    gradient: ['#3A3A3A', '#282828', '#181818'],
    overlayGradient: ['rgba(229,228,226,0.1)', 'rgba(229,228,226,0)'],
    borderColor: 'rgba(229,228,226,0.5)',
    borderGlow: 'rgba(229,228,226,0.35)',
    accent: '#E5E4E2',
    accentLight: '#FFFFFF',
    text: BASE_TEXT,
    textSecondary: 'rgba(255,255,255,0.88)',
    textMuted: 'rgba(255,255,255,0.62)',
    qrBackground: 'rgba(229,228,226,0.15)',
    shimmer: 'rgba(255,255,255,0.18)',
    shimmerIntense: 'rgba(229,228,226,0.35)',
    decorationBorder: 'rgba(229,228,226,0.18)',
    patternColor: 'rgba(229,228,226,0.07)',
    glowColor: 'rgba(229,228,226,0.45)',
    chipGradient: ['#E5E4E2', '#B8B8B8'],
    tierBadgeGradient: ['#FFFFFF', '#D4D4D4'],
    tierIcon: '⭐',
  },
  blackGold: {
    gradient: ['#1F1810', '#15100A', '#0A0805'],
    overlayGradient: ['rgba(244,228,186,0.12)', 'rgba(244,228,186,0)'],
    borderColor: 'rgba(244,228,186,0.55)',
    borderGlow: 'rgba(244,228,186,0.45)',
    accent: '#F4E4BA',
    accentLight: '#FFF8E7',
    text: '#FFF9E6',
    textSecondary: 'rgba(255,249,230,0.9)',
    textMuted: 'rgba(255,249,230,0.65)',
    qrBackground: 'rgba(244,228,186,0.15)',
    shimmer: 'rgba(255,255,255,0.15)',
    shimmerIntense: 'rgba(244,228,186,0.4)',
    decorationBorder: 'rgba(244,228,186,0.2)',
    patternColor: 'rgba(244,228,186,0.1)',
    glowColor: 'rgba(244,228,186,0.55)',
    chipGradient: ['#F4E4BA', '#C9B896'],
    tierBadgeGradient: ['#FFF8E7', '#E8D5A3'],
    tierIcon: '👑',
  },
};

export function getVipCardTheme(tier: User['tier']): VipCardTheme {
  return THEMES[tier] ?? THEMES.silver;
}
