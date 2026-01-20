import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { couponCatalog } from '@/mocks/data';
import { CouponDefinition, CouponStatus, UserCoupon } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getTierFromBalance, isTierAtLeast } from '@/lib/tier';

const COUPONS_STORAGE_PREFIX = 'coupons_v1';
const TIER_PROGRESS_STORAGE_PREFIX = 'coupon_tier_progress_v1';
const FAVORITES_STORAGE_KEY = 'coupon_favorites_v1';

const TIER_UPGRADE_GIFTS: Partial<Record<(typeof couponCatalog)[number]['tier'], string[]>> = {
  gold: ['c3'],
  diamond: ['c6'],
  platinum: ['c5'],
  blackGold: ['c7'],
};

function makeCouponInstanceId(couponId: string, claimedAtIso: string, suffix?: number): string {
  const cleaned = claimedAtIso ? claimedAtIso.replace(/[^0-9]/g, '') : `${Date.now()}`;
  return `${couponId}_${cleaned}${suffix === undefined ? '' : `_${suffix}`}`;
}

function createCouponInstance(couponId: string, claimedAtIso?: string): UserCoupon {
  const claimedAt = claimedAtIso ?? new Date().toISOString();
  return {
    id: makeCouponInstanceId(couponId, claimedAt),
    couponId,
    status: 'available',
    claimedAt,
  };
}

function getDefaultClaimedCoupons(userTier: (typeof couponCatalog)[number]['tier']): UserCoupon[] {
  const now = new Date().toISOString();
  const claimed: UserCoupon[] = [createCouponInstance('c1', now)];

  if (isTierAtLeast(userTier, 'gold')) {
    claimed.push(createCouponInstance('c3', now));
  }
  if (isTierAtLeast(userTier, 'platinum')) {
    claimed.push(createCouponInstance('c5', now));
  }

  return claimed;
}

function safeParseCoupons(value: string | null): UserCoupon[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;

    const next: UserCoupon[] = [];
    for (let i = 0; i < parsed.length; i += 1) {
      const raw = parsed[i] as any;
      if (!raw || typeof raw !== 'object') return null;

      const couponId = raw.couponId;
      const status = raw.status;
      const claimedAt = typeof raw.claimedAt === 'string' ? raw.claimedAt : new Date().toISOString();

      if (typeof couponId !== 'string') return null;
      if (!['available', 'used', 'expired'].includes(status)) return null;

      const id =
        typeof raw.id === 'string' ? raw.id : makeCouponInstanceId(couponId, claimedAt, i);
      const usedAt = typeof raw.usedAt === 'string' ? raw.usedAt : undefined;

      next.push({ id, couponId, status, claimedAt, usedAt });
    }

    return next;
  } catch {
    return null;
  }
}

function safeParseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === 'string');
  } catch {
    return [];
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
  const { user, spendPoints } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const effectiveTier = useMemo(() => {
    if (!user) return 'silver';
    return getTierFromBalance(user.balance);
  }, [user]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const storageKey = user ? `${COUPONS_STORAGE_PREFIX}:${user.id}` : null;
  const tierProgressKey = user ? `${TIER_PROGRESS_STORAGE_PREFIX}:${user.id}` : null;

  const persistFavorites = useCallback(async (next: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback(
    async (next: UserCoupon[]) => {
      if (!storageKey) return;
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        const parsed = safeParseStringArray(stored);
        if (isMounted) setFavoriteIds(parsed);
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const hydrate = useCallback(async () => {
    if (!user || !storageKey || !tierProgressKey) {
      setCoupons([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      const parsed = safeParseCoupons(stored);
      const initial = parsed ?? getDefaultClaimedCoupons(effectiveTier);

      const now = new Date();
      const normalized = initial.map((c) => {
        const definition = couponCatalog.find((d) => d.id === c.couponId);
        if (!definition) return c;
        if (c.status === 'available' && isExpired(definition, now)) {
          return { ...c, status: 'expired' as CouponStatus };
        }
        return c;
      });

      let nextCoupons = normalized;

      const storedTier = await AsyncStorage.getItem(tierProgressKey);
      const tierOrder = ['silver', 'gold', 'diamond', 'platinum', 'blackGold'] as const;
      const currentTierIndex = tierOrder.indexOf(effectiveTier);
      const storedTierIndex = tierOrder.indexOf(
        storedTier as (typeof tierOrder)[number]
      );

      if (!storedTier || storedTierIndex < 0) {
        await AsyncStorage.setItem(tierProgressKey, effectiveTier);
      } else if (currentTierIndex > storedTierIndex) {
        const gifts: string[] = [];
        for (let i = storedTierIndex + 1; i <= currentTierIndex; i += 1) {
          const tier = tierOrder[i];
          gifts.push(...(TIER_UPGRADE_GIFTS[tier] ?? []));
        }

      if (gifts.length > 0) {
          const existing = new Set(nextCoupons.map((c) => c.couponId));
          const grantNow = new Date().toISOString();
          const additions = gifts
            .filter((id) => !existing.has(id))
            .map((couponId) => createCouponInstance(couponId, grantNow));
          if (additions.length > 0) nextCoupons = [...additions, ...nextCoupons];
        }

        await AsyncStorage.setItem(tierProgressKey, effectiveTier);
      }

      setCoupons(nextCoupons);
      if (!parsed || JSON.stringify(parsed) !== JSON.stringify(nextCoupons)) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(nextCoupons));
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveTier, storageKey, tierProgressKey, user]);

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

  const instancesByCouponId = useMemo(() => {
    const map = new Map<string, UserCoupon[]>();
    for (const c of coupons) {
      const existing = map.get(c.couponId);
      if (existing) {
        existing.push(c);
      } else {
        map.set(c.couponId, [c]);
      }
    }
    return map;
  }, [coupons]);

  const claimCoupon = useCallback(
    async (couponId: string) => {
      if (!user || !storageKey) return;
      const definition = couponCatalog.find((c) => c.id === couponId);
      if (!definition) return;
      if (!isTierAtLeast(effectiveTier, definition.tier)) return;

      const now = new Date();
      const existingInstances = instancesByCouponId.get(couponId) ?? [];
      const isRepeatable = definition.repeatable !== false;

      if (!isRepeatable && existingInstances.length > 0) return;

      const hasUsableInstance = existingInstances.some((c) => {
        if (c.status !== 'available') return false;
        return !isExpired(definition, now);
      });
      if (hasUsableInstance) return;

      const cost = Math.max(0, Math.floor(definition.costPoints ?? 0));
      if (cost > 0) {
        const ok = await spendPoints(cost, { couponId });
        if (!ok) return;
      }

      setCoupons((current) => {
        const currentInstances = current.filter((c) => c.couponId === couponId);
        if (!isRepeatable && currentInstances.length > 0) return current;

        const nowInner = new Date();
        const alreadyHasUsable = currentInstances.some((c) => {
          if (c.status !== 'available') return false;
          return !isExpired(definition, nowInner);
        });
        if (alreadyHasUsable) return current;

        const claimedAt = new Date().toISOString();
        const next: UserCoupon[] = [
          {
            id: makeCouponInstanceId(couponId, claimedAt),
            couponId,
            status: 'available',
            claimedAt,
          },
          ...current,
        ];
        void persist(next);
        return next;
      });
    },
    [effectiveTier, instancesByCouponId, persist, spendPoints, storageKey, user]
  );

  const markCouponUsed = useCallback(
    async (couponInstanceId: string) => {
      if (!user || !storageKey) return;
      setCoupons((current) => {
        const next = current.map((c) => {
          if (c.id !== couponInstanceId) return c;
          if (c.status !== 'available') return c;
          return { ...c, status: 'used' as CouponStatus, usedAt: new Date().toISOString() };
        });
        void persist(next);
        return next;
      });
    },
    [persist, storageKey, user]
  );

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
    const now = new Date();
    return couponCatalog
      .filter((definition) => {
        const instances = instancesByCouponId.get(definition.id) ?? [];
        if (definition.repeatable === false) {
          return instances.length === 0;
        }
        const hasUsable = instances.some((c) => {
          if (c.status !== 'available') return false;
          return !isExpired(definition, now);
        });
        return !hasUsable;
      })
      .map((definition) => ({
        definition,
        isUnlocked: isTierAtLeast(effectiveTier, definition.tier),
      }));
  }, [effectiveTier, instancesByCouponId, user]);

  const getCoupon = useCallback((couponId: string, couponInstanceId?: string | null) => {
    const definition = couponCatalog.find((c) => c.id === couponId) ?? null;
    if (!definition) return { definition: null, state: null };

    const instances = instancesByCouponId.get(couponId) ?? [];
    const now = new Date();
    const state =
      (couponInstanceId
        ? coupons.find((c) => c.id === couponInstanceId && c.couponId === couponId) ?? null
        : instances.find((c) => c.status === 'available' && !isExpired(definition, now)) ??
          instances[0] ??
          null);

    return { definition, state };
  }, [coupons, instancesByCouponId]);

  const isFavorite = useCallback((couponId: string) => favoriteSet.has(couponId), [favoriteSet]);

  const toggleFavorite = useCallback(
    (couponId: string) => {
      if (!couponId) return;
      setFavoriteIds((current) => {
        const nextSet = new Set(current);
        if (nextSet.has(couponId)) {
          nextSet.delete(couponId);
        } else {
          nextSet.add(couponId);
        }
        const next = Array.from(nextSet);
        void persistFavorites(next);
        return next;
      });
    },
    [persistFavorites]
  );

  return {
    isLoading,
    coupons,
    claimedCoupons,
    offers,
    claimCoupon,
    markCouponUsed,
    refresh: hydrate,
    getCoupon,
    favoriteIds,
    isFavorite,
    toggleFavorite,
  };
});
