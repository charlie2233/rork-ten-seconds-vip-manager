import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { couponCatalog } from '@/mocks/data';
import { CouponDefinition, CouponStatus, UserCoupon } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getTierFromBalance, isTierAtLeast } from '@/lib/tier';

const COUPONS_STORAGE_PREFIX = 'coupons_v1';

function getDefaultClaimedCoupons(
  userTier: (typeof couponCatalog)[number]['tier'],
  claimedAt: string = new Date().toISOString()
): UserCoupon[] {
  const claimed: UserCoupon[] = [{ couponId: 'c1', status: 'available', claimedAt }];

  if (isTierAtLeast(userTier, 'gold')) {
    claimed.push({ couponId: 'c3', status: 'available', claimedAt });
  }
  if (isTierAtLeast(userTier, 'diamond')) {
    claimed.push({ couponId: 'c4', status: 'available', claimedAt });
  }
  if (isTierAtLeast(userTier, 'platinum')) {
    claimed.push({ couponId: 'c5', status: 'available', claimedAt });
  }
  if (isTierAtLeast(userTier, 'blackGold')) {
    claimed.push({ couponId: 'c6', status: 'available', claimedAt });
  }

  return claimed;
}

function safeParseCoupons(value: string | null): UserCoupon[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;
    const isValid = parsed.every((c) => {
      return (
        c &&
        typeof c === 'object' &&
        typeof (c as any).couponId === 'string' &&
        (c as any).status &&
        ['available', 'used', 'expired'].includes((c as any).status)
      );
    });
    return isValid ? (parsed as UserCoupon[]) : null;
  } catch {
    return null;
  }
}

function isExpired(definition: CouponDefinition, now: Date) {
  const until = new Date(definition.validTo);
  return Number.isFinite(until.valueOf()) && now > until;
}

export type CouponWithState = {
  definition: CouponDefinition;
  state: UserCoupon;
  isExpired: boolean;
};

export type CouponOffer = {
  definition: CouponDefinition;
  isUnlocked: boolean;
};

export const [CouponsProvider, useCoupons] = createContextHook(() => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const effectiveTier = useMemo(() => {
    if (!user) return 'silver';
    return getTierFromBalance(user.balance);
  }, [user]);

  const storageKey = user ? `${COUPONS_STORAGE_PREFIX}:${user.id}` : null;

  const persist = useCallback(
    async (next: UserCoupon[]) => {
      if (!storageKey) return;
      setCoupons(next);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const hydrate = useCallback(async () => {
    if (!user || !storageKey) {
      setCoupons([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      const parsed = safeParseCoupons(stored);
      const claimedAt = new Date().toISOString();
      const defaults = getDefaultClaimedCoupons(effectiveTier, claimedAt);

      let initial = parsed ?? defaults;
      if (parsed) {
        const existing = new Set(initial.map((c) => c.couponId));
        const missingDefaults = defaults.filter((c) => !existing.has(c.couponId));
        if (missingDefaults.length > 0) {
          initial = [...missingDefaults, ...initial];
        }
      }

      const now = new Date();
      const normalized = initial.map((c) => {
        const definition = couponCatalog.find((d) => d.id === c.couponId);
        if (!definition) return c;
        if (c.status === 'available' && isExpired(definition, now)) {
          return { ...c, status: 'expired' as CouponStatus };
        }
        return c;
      });

      setCoupons(normalized);
      if (!parsed || JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(normalized));
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveTier, storageKey, user]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isMounted) return;
      await hydrate();
    })();
    return () => {
      isMounted = false;
    };
  }, [hydrate]);

  const claimCoupon = useCallback(
    async (couponId: string) => {
      if (!user || !storageKey) return;
      const definition = couponCatalog.find((c) => c.id === couponId);
      if (!definition) return;
      if (!isTierAtLeast(effectiveTier, definition.tier)) return;

      setCoupons((current) => {
        if (current.some((c) => c.couponId === couponId)) return current;
        const next: UserCoupon[] = [
          { couponId, status: 'available', claimedAt: new Date().toISOString() },
          ...current,
        ];
        void persist(next);
        return next;
      });
    },
    [effectiveTier, persist, storageKey, user]
  );

  const markCouponUsed = useCallback(
    async (couponId: string) => {
      if (!user || !storageKey) return;
      setCoupons((current) => {
        const next = current.map((c) => {
          if (c.couponId !== couponId) return c;
          if (c.status !== 'available') return c;
          return { ...c, status: 'used' as CouponStatus, usedAt: new Date().toISOString() };
        });
        void persist(next);
        return next;
      });
    },
    [persist, storageKey, user]
  );

  const claimedById = useMemo(() => {
    const map = new Map<string, UserCoupon>();
    for (const c of coupons) map.set(c.couponId, c);
    return map;
  }, [coupons]);

  const claimedCoupons = useMemo((): CouponWithState[] => {
    const now = new Date();
    return coupons
      .map((state) => {
        const definition = couponCatalog.find((c) => c.id === state.couponId);
        if (!definition) return null;
        return { definition, state, isExpired: isExpired(definition, now) };
      })
      .filter(Boolean) as CouponWithState[];
  }, [coupons]);

  const offers = useMemo((): CouponOffer[] => {
    if (!user) {
      return couponCatalog.map((definition) => ({ definition, isUnlocked: false }));
    }
    return couponCatalog
      .filter((definition) => !claimedById.has(definition.id))
      .map((definition) => ({
        definition,
        isUnlocked: isTierAtLeast(effectiveTier, definition.tier),
      }));
  }, [claimedById, effectiveTier, user]);

  const getCoupon = useCallback((couponId: string) => {
    const definition = couponCatalog.find((c) => c.id === couponId) ?? null;
    const state = claimedById.get(couponId) ?? null;
    return { definition, state };
  }, [claimedById]);

  return {
    isLoading,
    coupons,
    claimedCoupons,
    offers,
    claimCoupon,
    markCouponUsed,
    refresh: hydrate,
    getCoupon,
  };
});
