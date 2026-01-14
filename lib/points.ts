import type { User } from '@/types';

export const POINTS_PER_DOLLAR: Readonly<Record<User['tier'], number>> = {
  silver: 0.5,
  gold: 0.75,
  diamond: 1,
  platinum: 1.25,
  blackGold: 1.5,
};

export function getPointsPerDollar(tier: User['tier']): number {
  return POINTS_PER_DOLLAR[tier] ?? POINTS_PER_DOLLAR.silver;
}

export function calculatePointsEarned(amountDollars: number, tier: User['tier']): number {
  const amount = Number.isFinite(amountDollars) ? amountDollars : 0;
  if (amount <= 0) return 0;

  const rate = getPointsPerDollar(tier);
  return Math.floor(amount * rate);
}

