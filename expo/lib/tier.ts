import type { User } from '@/types';

export const TIER_ORDER: readonly User['tier'][] = [
  'silver',
  'gold',
  'diamond',
  'platinum',
  'blackGold',
];

export const TIER_MIN_BALANCE: Readonly<Record<User['tier'], number>> = {
  silver: 100,
  gold: 200,
  diamond: 300,
  platinum: 500,
  blackGold: 1000,
};

export function getTierFromBalance(balance: number): User['tier'] {
  const amount = Number.isFinite(balance) ? balance : 0;

  let current: User['tier'] = 'silver';
  for (const tier of TIER_ORDER) {
    if (amount >= TIER_MIN_BALANCE[tier]) current = tier;
  }
  return current;
}

export function isTierAtLeast(userTier: User['tier'], requiredTier: User['tier']) {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

