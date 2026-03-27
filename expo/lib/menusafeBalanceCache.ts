import AsyncStorage from '@react-native-async-storage/async-storage';

const BALANCE_CACHE_PREFIX = 'menusafe_balance_cache_v1';

export type MenusafeBalanceSnapshot = {
  balance: number;
  updatedAt: string;
};

function cacheKey(memberId: string) {
  return `${BALANCE_CACHE_PREFIX}:${memberId}`;
}

export async function loadMenusafeBalanceSnapshot(
  memberId: string
): Promise<MenusafeBalanceSnapshot | null> {
  try {
    const stored = await AsyncStorage.getItem(cacheKey(memberId));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const raw = parsed as any;
    const balance = raw.balance;
    const updatedAt = raw.updatedAt;

    if (typeof balance !== 'number' || !Number.isFinite(balance)) return null;
    if (typeof updatedAt !== 'string') return null;

    return { balance, updatedAt };
  } catch {
    return null;
  }
}

export async function saveMenusafeBalanceSnapshot(
  memberId: string,
  balance: number
): Promise<MenusafeBalanceSnapshot> {
  const snapshot: MenusafeBalanceSnapshot = {
    balance,
    updatedAt: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(cacheKey(memberId), JSON.stringify(snapshot));
  } catch {
    // ignore
  }
  return snapshot;
}

