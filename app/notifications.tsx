import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  Gift, 
  Wallet, 
  Megaphone, 
  MessageCircle, 
  Clock, 
  Award,
  Ticket,
  CheckCheck,
  Trash2,
  BellRing,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import EmptyState from '@/components/EmptyState';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';
import { useNotifications, NotificationCategory } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';

const NOTIFICATION_SETTINGS = [
  { key: 'couponExpiring' as const, icon: Ticket, labelKey: 'notifications.couponExpiring' },
  { key: 'tierUpgrade' as const, icon: Award, labelKey: 'notifications.tierUpgrade' },
  { key: 'promoExpiring' as const, icon: Clock, labelKey: 'notifications.promoExpiring' },
  { key: 'transactions' as const, icon: Wallet, labelKey: 'notifications.transactions' },
  { key: 'promotions' as const, icon: Gift, labelKey: 'notifications.promotions' },
  { key: 'announcements' as const, icon: Megaphone, labelKey: 'notifications.announcements' },
  { key: 'messages' as const, icon: MessageCircle, labelKey: 'notifications.messages' },
];

function getNotificationIcon(type: NotificationCategory) {
  switch (type) {
    case 'couponExpiring':
      return Ticket;
    case 'tierUpgrade':
      return Award;
    case 'promoExpiring':
      return Clock;
    case 'transactions':
      return Wallet;
    case 'promotions':
      return Gift;
    case 'announcements':
      return Megaphone;
    case 'messages':
      return MessageCircle;
    default:
      return Bell;
  }
}

function formatTimeAgo(dateString: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return t('time.justNow');
  } else if (diffHours < 24) {
    return t('time.hoursAgo', { count: diffHours });
  } else if (diffDays === 1) {
    return t('time.yesterday');
  } else {
    return t('time.daysAgo', { count: diffDays });
  }
}

export default function NotificationsScreen() {
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();
  const { isAuthenticated } = useAuth();
  const {
    settings,
    notifications,
    hasPermission,
    unreadCount,
    toggleSetting,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestPermission,
  } = useNotifications();

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar 
        title={t('notifications.title')} 
        leftAction="back"
        right={unreadCount > 0 ? (
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={markAllAsRead}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.markAllRead')}
          >
            <CheckCheck size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : undefined}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {Platform.OS !== 'web' && hasPermission === false && (
          <TouchableOpacity 
            style={styles.permissionBanner}
            onPress={handleRequestPermission}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.permissionTitle')}
          >
            <View style={styles.permissionIcon}>
              <BellRing size={24} color={Colors.secondary} />
            </View>
            <View style={styles.permissionContent}>
              <Text style={[styles.permissionTitle, { fontSize: 15 * fontScale }]}>{t('notifications.permissionTitle')}</Text>
              <Text style={[styles.permissionDesc, { fontSize: 13 * fontScale, lineHeight: 18 * fontScale }]}>
                {t('notifications.permissionDesc')}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 14 * fontScale }]}>{t('notifications.settingsTitle')}</Text>
            <View style={styles.masterToggle}>
              <Text style={[styles.masterToggleLabel, { fontSize: 13 * fontScale }]}>{t('notifications.enabled')}</Text>
              <Switch
                value={settings.enabled}
                onValueChange={() => toggleSetting('enabled')}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>
          </View>
          <View style={[styles.settingsCard, !settings.enabled && styles.settingsDisabled]}>
            {NOTIFICATION_SETTINGS.map((setting, index) => {
              const IconComponent = setting.icon;
              const settingKey = setting.key;
              return (
                <View
                  key={setting.key}
                  style={[
                    styles.settingRow,
                    index === NOTIFICATION_SETTINGS.length - 1 && styles.lastRow,
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <IconComponent size={20} color={settings.enabled ? Colors.primary : Colors.textMuted} />
                    </View>
                    <Text style={[styles.settingLabel, { fontSize: 15 * fontScale }, !settings.enabled && styles.textDisabled]}>
                      {t(setting.labelKey)}
                    </Text>
                  </View>
                  <Switch
                    value={settings[settingKey]}
                    onValueChange={() => toggleSetting(settingKey)}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.text}
                    disabled={!settings.enabled}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 14 * fontScale }]}>
              {t('notifications.recentTitle')}
              {unreadCount > 0 && (
                <Text style={styles.unreadBadge}> ({unreadCount})</Text>
              )}
            </Text>
            {notifications.length > 0 && (
              <TouchableOpacity 
                style={styles.headerAction}
                onPress={clearNotifications}
                activeOpacity={0.75}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.clearAll')}
              >
                <Trash2 size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          
          {!isAuthenticated ? (
            <EmptyState
              title={t('notifications.loginRequired')}
              icon={<Bell size={20} color={Colors.primary} />}
            />
          ) : notifications.length === 0 ? (
            <EmptyState
              title={t('notifications.empty')}
              icon={<Bell size={20} color={Colors.primary} />}
            />
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((notification, index) => {
                const IconComponent = getNotificationIcon(notification.type);
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.read && styles.unreadCard,
                      index === notifications.length - 1 && styles.lastCard,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => markAsRead(notification.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t(notification.titleKey, notification.titleParams)}
                  >
                    <View style={styles.notificationIconContainer}>
                      <IconComponent 
                        size={20} 
                        color={notification.read ? Colors.textMuted : Colors.primary} 
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={[
                          styles.notificationTitle,
                          { fontSize: 15 * fontScale },
                          notification.read && styles.readTitle
                        ]}>
                          {t(notification.titleKey, notification.titleParams)}
                        </Text>
                        {!notification.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text
                        style={[styles.notificationDesc, { fontSize: 13 * fontScale, lineHeight: 18 * fontScale }]}
                        numberOfLines={2}
                      >
                        {t(notification.descKey, notification.descParams)}
                      </Text>
                      <Text style={[styles.notificationTime, { fontSize: 12 * fontScale }]}>
                        {formatTimeAgo(notification.date, t)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  permissionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  unreadBadge: {
    color: Colors.secondary,
    fontWeight: '700' as const,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masterToggleLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsDisabled: {
    opacity: 0.6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  textDisabled: {
    color: Colors.textMuted,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
  },
  unreadCard: {
    borderColor: Colors.primary,
    borderLeftWidth: 3,
    backgroundColor: 'rgba(201, 169, 98, 0.05)',
  },
  lastCard: {},
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  readTitle: {
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
    marginLeft: 8,
  },
  notificationDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
