import Colors from '@/constants/colors';
import type { User } from '@/types';

export type VipCardTheme = {
  gradient: readonly [string, string, string];
  borderColor: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  qrBackground: string;
  shimmer: string;
  decorationBorder: string;
};

const BASE_TEXT = '#FFFFFF';

const THEMES: Readonly<Record<User['tier'], VipCardTheme>> = {
  silver: {
    gradient: ['#2A2A2A', '#1F1F1F', '#141414'],
    borderColor: 'rgba(192,192,192,0.35)',
    accent: '#C0C0C0',
    text: BASE_TEXT,
    textSecondary: 'rgba(255,255,255,0.78)',
    textMuted: 'rgba(255,255,255,0.55)',
    qrBackground: 'rgba(192,192,192,0.12)',
    shimmer: 'rgba(255,255,255,0.06)',
    decorationBorder: 'rgba(192,192,192,0.12)',
  },
  gold: {
    gradient: ['#3A2E1B', '#241C11', '#15110B'],
    borderColor: 'rgba(201,169,98,0.45)',
    accent: Colors.primary,
    text: BASE_TEXT,
    textSecondary: 'rgba(255,255,255,0.78)',
    textMuted: 'rgba(255,255,255,0.55)',
    qrBackground: 'rgba(201,169,98,0.12)',
    shimmer: 'rgba(255,255,255,0.06)',
    decorationBorder: 'rgba(201,169,98,0.12)',
  },
  diamond: {
    gradient: ['#1D2F3B', '#14232C', '#0F181E'],
    borderColor: 'rgba(185,242,255,0.38)',
    accent: '#B9F2FF',
    text: '#EAFBFF',
    textSecondary: 'rgba(234,251,255,0.78)',
    textMuted: 'rgba(234,251,255,0.55)',
    qrBackground: 'rgba(185,242,255,0.12)',
    shimmer: 'rgba(255,255,255,0.07)',
    decorationBorder: 'rgba(185,242,255,0.12)',
  },
  platinum: {
    gradient: ['#2E2E2E', '#1F1F1F', '#141414'],
    borderColor: 'rgba(229,228,226,0.40)',
    accent: '#E5E4E2',
    text: BASE_TEXT,
    textSecondary: 'rgba(255,255,255,0.78)',
    textMuted: 'rgba(255,255,255,0.55)',
    qrBackground: 'rgba(229,228,226,0.12)',
    shimmer: 'rgba(255,255,255,0.06)',
    decorationBorder: 'rgba(229,228,226,0.12)',
  },
  blackGold: {
    gradient: ['#1A140C', '#120E09', '#0B0906'],
    borderColor: 'rgba(244,228,186,0.42)',
    accent: '#F4E4BA',
    text: '#FFF9E6',
    textSecondary: 'rgba(255,249,230,0.78)',
    textMuted: 'rgba(255,249,230,0.55)',
    qrBackground: 'rgba(244,228,186,0.12)',
    shimmer: 'rgba(255,255,255,0.06)',
    decorationBorder: 'rgba(244,228,186,0.12)',
  },
};

export function getVipCardTheme(tier: User['tier']): VipCardTheme {
  return THEMES[tier] ?? THEMES.silver;
}

