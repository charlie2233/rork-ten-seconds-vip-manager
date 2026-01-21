import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transaction } from '@/types';

const TRANSACTIONS_CACHE_PREFIX = 'transactions_cache_v1';

export type TransactionsSnapshot = {
  transactions: Transaction[];
  updatedAt: string;
};

function cacheKey(userId: string) {
  return `${TRANSACTIONS_CACHE_PREFIX}:${userId}`;
}

export async function loadTransactionsSnapshot(
  userId: string
): Promise<TransactionsSnapshot | null> {
  try {
    const stored = await AsyncStorage.getItem(cacheKey(userId));
    if (!stored) return null;
    const parsed = JSON.parse(stored) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const raw = parsed as any;
    const updatedAt = raw.updatedAt;
    const transactions = raw.transactions;

    if (typeof updatedAt !== 'string') return null;
    if (!Array.isArray(transactions)) return null;

    const validated: Transaction[] = [];
    for (const item of transactions) {
      if (!item || typeof item !== 'object') continue;
      const tx = item as any;

      if (typeof tx.id !== 'string') continue;
      if (tx.type !== 'deposit' && tx.type !== 'spend' && tx.type !== 'bonus' && tx.type !== 'refund') continue;
      if (typeof tx.amount !== 'number' || !Number.isFinite(tx.amount)) continue;
      if (typeof tx.description !== 'string') continue;
      if (typeof tx.date !== 'string') continue;
      if (typeof tx.balance !== 'number' || !Number.isFinite(tx.balance)) continue;

      validated.push({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        balance: tx.balance,
      });
    }

    return { updatedAt, transactions: validated };
  } catch {
    return null;
  }
}

export async function saveTransactionsSnapshot(
  userId: string,
  transactions: Transaction[]
): Promise<TransactionsSnapshot> {
  const snapshot: TransactionsSnapshot = {
    transactions,
    updatedAt: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(snapshot));
  } catch {
    // ignore
  }
  return snapshot;
}

