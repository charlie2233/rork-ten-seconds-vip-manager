import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCoupons, CouponWithState } from '@/contexts/CouponsContext';
import { useI18n } from '@/contexts/I18nContext';
import { trpc } from '@/lib/trpc';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings_v1';
const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications_v1';
const PREVIOUS_TIER_KEY = 'previous_tier_v1';

export type NotificationCategory = 
  | 'couponExpiring'
  | 'promoExpiring'
  | 'tierUpgrade'
  | 'transactions'
  | 'promotions'
  | 'announcements'
  | 'messages';

export type NotificationSettings = {
  enabled: boolean;
  couponExpiring: boolean;
  promoExpiring: boolean;
  tierUpgrade: boolean;
  transactions: boolean;
  promotions: boolean;
  announcements: boolean;
  messages: boolean;
};

export type StoredNotification = {
  id: string;
  type: NotificationCategory;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  descKey: string;
  descParams?: Record<string, string | number>;
  date: string;
  read: boolean;
  data?: Record<string, unknown>;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  couponExpiring: true,
  promoExpiring: true,
  tierUpgrade: true,
  transactions: true,
  promotions: true,
  announcements: false,
  messages: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function safeParseSettings(raw: string | null): NotificationSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as NotificationSettings;
  } catch {
    return null;
  }
}

function safeParseNotifications(raw: string | null): StoredNotification[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredNotification[];
  } catch {
    return [];
  }
}

function safeParseScheduledIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as string[];
  } catch {
    return [];
  }
}

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { user } = useAuth();
  const { claimedCoupons } = useCoupons();
  const { t } = useI18n();
  
  const [settings, setSettingsState] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledCouponIds, setScheduledCouponIds] = useState<string[]>([]);
  const [previousTier, setPreviousTier] = useState<string | null>(null);

  const registerPushTokenMutation = trpc.notifications.registerPushToken.useMutation();
  const sendPushNotificationMutation = trpc.notifications.sendNotification.useMutation();

  const userStorageKey = user ? `${NOTIFICATION_SETTINGS_KEY}:${user.id}` : null;
  const notificationsStorageKey = user ? `notifications_history_v1:${user.id}` : null;
  const scheduledKey = user ? `${SCHEDULED_NOTIFICATIONS_KEY}:${user.id}` : null;
  const tierKey = user ? `${PREVIOUS_TIER_KEY}:${user.id}` : null;

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setHasPermission(false);
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      setHasPermission(granted);
      console.log('[NotificationsContext] Permission status:', finalStatus);

      if (granted && user?.id) {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          console.log('[NotificationsContext] Push Token:', tokenData.data);
          registerPushTokenMutation.mutate({ userId: user.id, token: tokenData.data });
        } catch (error) {
          console.error('[NotificationsContext] Error getting push token:', error);
        }
      }

      return granted;
    } catch (error) {
      console.error('[NotificationsContext] Error requesting permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (userStorageKey) {
          const stored = await AsyncStorage.getItem(userStorageKey);
          const parsed = safeParseSettings(stored);
          if (parsed) {
            setSettingsState({ ...DEFAULT_SETTINGS, ...parsed });
          }
        }

        if (notificationsStorageKey) {
          const stored = await AsyncStorage.getItem(notificationsStorageKey);
          setNotifications(safeParseNotifications(stored));
        }

        if (scheduledKey) {
          const stored = await AsyncStorage.getItem(scheduledKey);
          setScheduledCouponIds(safeParseScheduledIds(stored));
        }

        if (tierKey) {
          const stored = await AsyncStorage.getItem(tierKey);
          setPreviousTier(stored);
        }

        if (Platform.OS !== 'web') {
          const { status } = await Notifications.getPermissionsAsync();
          setHasPermission(status === 'granted');
        }
      } catch (error) {
        console.error('[NotificationsContext] Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userStorageKey, notificationsStorageKey, scheduledKey, tierKey]);

  const persistSettings = useCallback(
    async (next: NotificationSettings) => {
      if (!userStorageKey) return;
      try {
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [userStorageKey]
  );

  const persistNotifications = useCallback(
    async (next: StoredNotification[]) => {
      if (!notificationsStorageKey) return;
      try {
        await AsyncStorage.setItem(notificationsStorageKey, JSON.stringify(next.slice(0, 50)));
      } catch {
        // ignore
      }
    },
    [notificationsStorageKey]
  );

  const persistScheduledIds = useCallback(
    async (ids: string[]) => {
      if (!scheduledKey) return;
      try {
        await AsyncStorage.setItem(scheduledKey, JSON.stringify(ids));
      } catch {
        // ignore
      }
    },
    [scheduledKey]
  );

  const persistTier = useCallback(
    async (tier: string) => {
      if (!tierKey) return;
      try {
        await AsyncStorage.setItem(tierKey, tier);
      } catch {
        // ignore
      }
    },
    [tierKey]
  );

  const updateSetting = useCallback(
    async <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
      const next = { ...settings, [key]: value };
      setSettingsState(next);
      await persistSettings(next);
    },
    [persistSettings, settings]
  );

  const toggleSetting = useCallback(
    async (key: keyof NotificationSettings) => {
      const current = settings[key];
      if (typeof current === 'boolean') {
        await updateSetting(key, !current);
      }
    },
    [settings, updateSetting]
  );

  const addNotification = useCallback(
    async (notification: Omit<StoredNotification, 'id' | 'date' | 'read'>) => {
      const newNotification: StoredNotification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        date: new Date().toISOString(),
        read: false,
      };

      setNotifications((current) => {
        const next = [newNotification, ...current].slice(0, 50);
        void persistNotifications(next);
        return next;
      });

      return newNotification;
    },
    [persistNotifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((current) => {
        const next = current.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        void persistNotifications(next);
        return next;
      });
    },
    [persistNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) => {
      const next = current.map((n) => ({ ...n, read: true }));
      void persistNotifications(next);
      return next;
    });
  }, [persistNotifications]);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    await persistNotifications([]);
  }, [persistNotifications]);

  const scheduleLocalNotification = useCallback(
    async (
      title: string,
      body: string,
      triggerDate: Date,
      data?: Record<string, unknown>
    ) => {
      if (Platform.OS === 'web' || !hasPermission) {
        console.log('[NotificationsContext] Cannot schedule: web or no permission');
        return null;
      }

      try {
        const trigger = triggerDate.getTime() - Date.now();
        if (trigger <= 0) {
          console.log('[NotificationsContext] Trigger date is in the past');
          return null;
        }

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: data ?? {},
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.floor(trigger / 1000),
          },
        });

        console.log('[NotificationsContext] Scheduled notification:', id);
        return id;
      } catch (error) {
        console.error('[NotificationsContext] Error scheduling notification:', error);
        return null;
      }
    },
    [hasPermission]
  );

  const scheduleCouponExpiryNotifications = useCallback(
    async (coupons: CouponWithState[]) => {
      if (!settings.enabled || !settings.couponExpiring || Platform.OS === 'web') {
        return;
      }

      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      

      const expiringSoon = coupons.filter((c) => {
        if (c.state.status !== 'available' || c.isExpired) return false;
        const validTo = new Date(c.definition.validTo);
        return validTo > now && validTo <= threeDaysFromNow;
      });

      const newScheduledIds = [...scheduledCouponIds];

      for (const coupon of expiringSoon) {
        const instanceId = coupon.state.id;
        if (scheduledCouponIds.includes(instanceId)) continue;

        const validTo = new Date(coupon.definition.validTo);
        const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        let triggerDate: Date;
        if (daysUntilExpiry <= 1) {
          triggerDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        } else {
          triggerDate = new Date(validTo.getTime() - 24 * 60 * 60 * 1000);
        }

        if (triggerDate <= now) {
          triggerDate = new Date(now.getTime() + 60 * 1000);
        }

        const title = t('notifications.couponExpiring.title');
        const body = t('notifications.couponExpiring.body', {
          coupon: t(coupon.definition.title),
          days: daysUntilExpiry,
        });

        // Use backend push notification for expired coupons if permission granted
        if (Platform.OS !== 'web' && hasPermission && user?.id) {
           sendPushNotificationMutation.mutate({
             userId: user.id,
             title,
             body,
             data: {
               type: 'couponExpiring',
               couponId: coupon.definition.id,
               instanceId,
             },
           });
        } else {
          // Fallback to local
          await scheduleLocalNotification(title, body, triggerDate, {
            type: 'couponExpiring',
            couponId: coupon.definition.id,
            instanceId,
          });
        }

        newScheduledIds.push(instanceId);
      }

      if (newScheduledIds.length !== scheduledCouponIds.length) {
        setScheduledCouponIds(newScheduledIds);
        await persistScheduledIds(newScheduledIds);
      }
    },
    [settings.enabled, settings.couponExpiring, scheduledCouponIds, t, scheduleLocalNotification, persistScheduledIds]
  );

  useEffect(() => {
    if (!user || isLoading) return;
    scheduleCouponExpiryNotifications(claimedCoupons);
  }, [user, claimedCoupons, isLoading, scheduleCouponExpiryNotifications]);

  const sendTierUpgradeNotification = useCallback(
    async (newTier: string) => {
      if (!settings.enabled || !settings.tierUpgrade) return;

      const title = t('notifications.tierUpgrade.title');
      const body = t('notifications.tierUpgrade.body', { tier: t(`tier.${newTier}`) });

      await addNotification({
        type: 'tierUpgrade',
        titleKey: 'notifications.tierUpgrade.title',
        descKey: 'notifications.tierUpgrade.body',
        descParams: { tier: t(`tier.${newTier}`) },
        data: { tier: newTier },
      });

      if (Platform.OS !== 'web' && hasPermission) {
        if (user?.id) {
          sendPushNotificationMutation.mutate({
            userId: user.id,
            title,
            body,
            data: { type: 'tierUpgrade', tier: newTier },
          });
        } else {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { type: 'tierUpgrade', tier: newTier },
              sound: true,
            },
            trigger: null,
          });
        }
      }
    },
    [settings.enabled, settings.tierUpgrade, t, addNotification, hasPermission, user?.id, sendPushNotificationMutation]
  );

  useEffect(() => {
    if (!user || isLoading || !tierKey) return;

    const currentTier = user.tier;
    
    if (previousTier && previousTier !== currentTier) {
      const tierOrder = ['silver', 'gold', 'diamond', 'platinum', 'blackGold'];
      const prevIndex = tierOrder.indexOf(previousTier);
      const currentIndex = tierOrder.indexOf(currentTier);

      if (currentIndex > prevIndex) {
        console.log('[NotificationsContext] Tier upgrade detected:', previousTier, '->', currentTier);
        sendTierUpgradeNotification(currentTier);
      }
    }

    if (previousTier !== currentTier) {
      setPreviousTier(currentTier);
      persistTier(currentTier);
    }
  }, [user, isLoading, tierKey, previousTier, sendTierUpgradeNotification, persistTier]);

  const sendPromoNotification = useCallback(
    async (promoKey: string, expiresAt?: Date) => {
      if (!settings.enabled || !settings.promoExpiring) return;

      await addNotification({
        type: 'promoExpiring',
        titleKey: 'notifications.promoExpiring.title',
        descKey: promoKey,
        data: { expiresAt: expiresAt?.toISOString() },
      });

      if (Platform.OS !== 'web' && hasPermission) {
        const title = t('notifications.promoExpiring.title');
        const body = t(promoKey);

        if (user?.id) {
          sendPushNotificationMutation.mutate({
            userId: user.id,
            title,
            body,
            data: { type: 'promoExpiring', promoKey },
          });
        } else {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { type: 'promoExpiring', promoKey },
              sound: true,
            },
            trigger: null,
          });
        }
      }
    },
    [settings.enabled, settings.promoExpiring, t, addNotification, hasPermission, user?.id, sendPushNotificationMutation]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return {
    settings,
    notifications,
    hasPermission,
    isLoading,
    unreadCount,
    requestPermission,
    updateSetting,
    toggleSetting,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    scheduleLocalNotification,
    sendTierUpgradeNotification,
    sendPromoNotification,
  };
});
