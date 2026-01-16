import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PointsRecord, User } from '@/types';
import { mockUser, testAccounts } from '@/mocks/data';
import { getTierFromBalance } from '@/lib/tier';
import { calculatePointsEarned } from '@/lib/points';

const AUTH_STORAGE_KEY = 'auth_user';
const GUEST_STORAGE_KEY = 'auth_guest_mode';
const POINTS_HISTORY_STORAGE_PREFIX = 'points_history_v1';

function safeParsePointsHistory(value: string | null): PointsRecord[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    const out: PointsRecord[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== 'object') continue;
      const rec = raw as any;
      if (typeof rec.id !== 'string') continue;
      if (typeof rec.delta !== 'number' || !Number.isFinite(rec.delta)) continue;
      if (typeof rec.date !== 'string') continue;
      if (typeof rec.balance !== 'number' || !Number.isFinite(rec.balance)) continue;

      out.push({
        id: rec.id,
        delta: rec.delta,
        date: rec.date,
        balance: rec.balance,
        description: typeof rec.description === 'string' ? rec.description : undefined,
        couponId: typeof rec.couponId === 'string' ? rec.couponId : undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}

function makePointsRecordId() {
  return `pt_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      console.log('[AuthContext] Loading auth state...');
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        console.log('[AuthContext] Stored auth:', stored ? 'found' : 'not found');
        if (stored) {
          const userData = JSON.parse(stored) as User;
          return userData;
        }
      } catch (error) {
        console.error('[AuthContext] Failed to restore auth state:', error);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return null;
    },
    staleTime: Infinity,
    retry: false,
  });

  const guestQuery = useQuery({
    queryKey: ['auth_guest'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        return stored === '1';
      } catch {
        return false;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  // Derive state directly from the query cache to avoid synchronization issues
  const user = authQuery.data ?? null;
  const isAuthenticated = !!user;
  const isGuest = guestQuery.data ?? false;

  const pointsHistoryQuery = useQuery({
    queryKey: ['points_history', user?.id ?? 'none'],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const stored = await AsyncStorage.getItem(`${POINTS_HISTORY_STORAGE_PREFIX}:${user.id}`);
        return safeParsePointsHistory(stored);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: Infinity,
    retry: false,
  });

  const appendPointsRecord = async (entry: PointsRecord) => {
    if (!user?.id) return;
    const queryKey = ['points_history', user.id] as const;
    const current = queryClient.getQueryData<PointsRecord[]>(queryKey) ?? [];
    const next = [entry, ...current].slice(0, 200);
    queryClient.setQueryData(queryKey, next);
    try {
      await AsyncStorage.setItem(`${POINTS_HISTORY_STORAGE_PREFIX}:${user.id}`, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const loginMutation = useMutation({
    mutationFn: async ({ memberId, password }: { memberId: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const normalizedMemberId = memberId.trim().toUpperCase();
      const normalizedPassword = password.trim().toLowerCase();
      
      const testAccount = testAccounts.find(
        (acc) => acc.memberId.toUpperCase() === normalizedMemberId && 
                 acc.password.toLowerCase() === normalizedPassword
      );
      
      if (testAccount) {
        console.log('[AuthContext] Logging in as test account:', testAccount.user.name);
        const userData: User = { ...testAccount.user };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        return userData;
      }
      
      if (memberId.length >= 4 && password.length >= 4) {
        const userData: User = {
          ...mockUser,
          id: `user_${Date.now()}`,
          memberId: normalizedMemberId,
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        return userData;
      }
      throw new Error('auth.invalidCredentials');
    },
    onSuccess: (userData) => {
      // Update query cache immediately
      queryClient.setQueryData(['auth'], userData);
      // Logged in: exit guest mode
      queryClient.setQueryData(['auth_guest'], false);
      void AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    },
    onSuccess: () => {
      // Update query cache immediately
      queryClient.setQueryData(['auth'], null);
      // Keep the app usable after logout
      queryClient.setQueryData(['auth_guest'], true);
      void AsyncStorage.setItem(GUEST_STORAGE_KEY, '1');
    },
  });

  const login = (memberId: string, password: string) => {
    return loginMutation.mutateAsync({ memberId, password });
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  const setGuestMode = async (next: boolean) => {
    queryClient.setQueryData(['auth_guest'], next);
    try {
      if (next) {
        await AsyncStorage.setItem(GUEST_STORAGE_KEY, '1');
      } else {
        await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  const enterGuestMode = () => setGuestMode(true);
  const exitGuestMode = () => setGuestMode(false);

  const isLoading =
    (authQuery.isLoading && !authQuery.isFetched) || (guestQuery.isLoading && !guestQuery.isFetched);
  
  console.log('[AuthContext] State:', { isLoading, isAuthenticated, queryStatus: authQuery.status });

  return {
    user,
    isAuthenticated,
    isLoading,
    isGuest,
    pointsHistory: pointsHistoryQuery.data ?? [],
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message || null,
    login,
    logout,
    enterGuestMode,
    exitGuestMode,
    setUserName: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const current = queryClient.getQueryData<User | null>(['auth']);
      if (!current) return;
      const next: User = { ...current, name: trimmed };
      queryClient.setQueryData(['auth'], next);
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    spendPoints: async (
      points: number,
      meta?: { couponId?: string; description?: string }
    ) => {
      const cost = Math.max(0, Math.floor(Number.isFinite(points) ? points : 0));
      if (cost <= 0) return true;

      const current = queryClient.getQueryData<User | null>(['auth']);
      if (!current) return false;

      const currentPoints = current.points ?? 0;
      if (currentPoints < cost) return false;

      const next: User = { ...current, points: currentPoints - cost };
      queryClient.setQueryData(['auth'], next);
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }

      const entry: PointsRecord = {
        id: makePointsRecordId(),
        delta: -cost,
        couponId: meta?.couponId,
        description: meta?.description,
        date: new Date().toISOString(),
        balance: next.points ?? 0,
      };
      await appendPointsRecord(entry);
      return true;
    },
    applyTopUp: async (amount: number, bonus: number = 0) => {
      const paidAmount = Number.isFinite(amount) ? amount : 0;
      const bonusAmount = Number.isFinite(bonus) ? bonus : 0;

      const current = queryClient.getQueryData<User | null>(['auth']);
      if (!current) {
        return { pointsEarned: 0, balance: 0, tier: 'silver' as const };
      }

      const nextBalance = (current.balance ?? 0) + paidAmount + bonusAmount;
      const nextTier = getTierFromBalance(nextBalance);
      const pointsEarned = calculatePointsEarned(paidAmount, nextTier);

      const next: User = {
        ...current,
        balance: nextBalance,
        points: (current.points ?? 0) + pointsEarned,
        tier: nextTier,
      };

      queryClient.setQueryData(['auth'], next);
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }

      if (pointsEarned > 0) {
        const entry: PointsRecord = {
          id: makePointsRecordId(),
          delta: pointsEarned,
          description: 'points.record.topUpBonus',
          date: new Date().toISOString(),
          balance: next.points ?? 0,
        };
        await appendPointsRecord(entry);
      }

      return { pointsEarned, balance: nextBalance, tier: nextTier };
    },
  };
});
