import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Gift, Wallet, Megaphone, MessageCircle } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

const NOTIFICATION_SETTINGS = [
  { key: 'transactions', icon: Wallet, labelKey: 'notifications.transactions' },
  { key: 'promotions', icon: Gift, labelKey: 'notifications.promotions' },
  { key: 'announcements', icon: Megaphone, labelKey: 'notifications.announcements' },
  { key: 'messages', icon: MessageCircle, labelKey: 'notifications.messages' },
];

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'promo',
    titleKey: 'notifications.item.promo.title',
    descKey: 'notifications.item.promo.desc',
    timeKey: 'time.hoursAgo',
    timeParams: { count: 2 },
    read: false,
  },
  {
    id: '2',
    type: 'transaction',
    titleKey: 'notifications.item.transaction.title',
    descKey: 'notifications.item.transaction.desc',
    timeKey: 'time.yesterday',
    read: true,
  },
  {
    id: '3',
    type: 'system',
    titleKey: 'notifications.item.system.title',
    descKey: 'notifications.item.system.desc',
    timeKey: 'time.daysAgo',
    timeParams: { count: 3 },
    read: true,
  },
];

export default function NotificationsScreen() {
  const { t } = useI18n();
  const { backgroundGradient } = useSettings();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    transactions: true,
    promotions: true,
    announcements: false,
    messages: true,
  });

  const toggleSetting = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('notifications.title')} leftAction="back" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.settingsTitle')}</Text>
          <View style={styles.settingsCard}>
            {NOTIFICATION_SETTINGS.map((setting, index) => {
              const IconComponent = setting.icon;
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
                      <IconComponent size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.settingLabel}>{t(setting.labelKey)}</Text>
                  </View>
                  <Switch
                    value={settings[setting.key]}
                    onValueChange={() => toggleSetting(setting.key)}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.text}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.recentTitle')}</Text>
          {MOCK_NOTIFICATIONS.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {MOCK_NOTIFICATIONS.map((notification, index) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.unreadCard,
                    index === MOCK_NOTIFICATIONS.length - 1 && styles.lastCard,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {t(notification.titleKey)}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationDesc} numberOfLines={2}>
                    {t(notification.descKey)}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {t(notification.timeKey, notification.timeParams)}
                  </Text>
                </TouchableOpacity>
              ))}
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
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
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
  },
  unreadCard: {
    borderColor: Colors.primary,
    borderLeftWidth: 3,
  },
  lastCard: {},
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
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
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
