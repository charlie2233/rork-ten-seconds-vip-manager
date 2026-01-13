import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Phone,
  CreditCard,
  Calendar,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  MessageSquare,
  LogOut,
  LogIn,
  Settings,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { tierInfo } from '@/mocks/data';
import Colors from '@/constants/colors';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';
import { migrationService } from '@/lib/migration';
import { getTierFromBalance } from '@/lib/tier';

interface MenuItem {
  icon: typeof Bell;
  labelKey: string;
  value: string;
  route?: string;
  action?: string;
}

interface MenuSection {
  titleKey: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    titleKey: 'profile.section.account',
    items: [
      { icon: Bell, labelKey: 'profile.item.notifications', value: '', route: '/notifications' },
      { icon: Shield, labelKey: 'profile.item.security', value: '', route: '/security' },
      { icon: Settings, labelKey: 'profile.item.preferences', value: '', route: '/preferences' },
    ],
  },
  {
    titleKey: 'profile.section.migration',
    items: [
      { icon: RefreshCw, labelKey: 'profile.item.menusafe', value: '', action: 'sync' },
    ],
  },
  {
    titleKey: 'profile.section.support',
    items: [
      { icon: MapPin, labelKey: 'profile.item.nearbyStores', value: '', route: '/locations' },
      { icon: MessageSquare, labelKey: 'profile.item.supportChat', value: '', route: '/support-chat' },
      { icon: HelpCircle, labelKey: 'profile.item.helpCenter', value: '', route: '/help-center' },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const effectiveTier = user ? getTierFromBalance(user.balance) : 'silver';
  const tier = tierInfo[effectiveTier];
  const sections = user
    ? menuSections
    : menuSections.filter((section) => section.titleKey !== 'profile.section.migration');

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleSync = async () => {
    if (!user) return;
    
    Alert.alert(
      t('profile.migration.confirmTitle'),
      t('profile.migration.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
              onPress: async () => {
            try {
              const result = await migrationService.syncUser(user.memberId);
              Alert.alert(
                t('profile.migration.success'),
                `${t('home.balance')}: $${result.balance}\n${t('home.points')}: ${result.points}`
              );
              // In a real app, you would refresh the user context here
            } catch {
              Alert.alert(t('forgot.error'), t('profile.migration.notFound'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.languageRow}>
          <LanguageToggle />
        </View>

        <Text style={styles.title}>{t('profile.title')}</Text>

        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={user ? 1 : 0.8}
          disabled={!!user}
          onPress={() => router.push('/login')}
        >
          <LinearGradient
            colors={[Colors.surface, Colors.surfaceLight]}
            style={styles.profileGradient}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {user ? user.name?.charAt(0) ?? '' : ''}
                </Text>
              </LinearGradient>
              <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                <Text style={styles.tierBadgeText}>VIP</Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              {user ? (
                <>
                  <Text style={styles.profileName}>{user.name}</Text>
                  <Text style={[styles.profileTier, { color: tier.color }]}>
                    {t(`tier.${effectiveTier}`)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.profileName}>{t('auth.login')}</Text>
                  <Text style={styles.profileSignInHint}>{t('profile.signInHint')}</Text>
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {user ? (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <CreditCard size={18} color={Colors.primary} />
              </View>
              <Text style={styles.infoLabel}>{t('profile.memberId')}</Text>
              <Text style={styles.infoValue}>{user.memberId}</Text>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Phone size={18} color={Colors.primary} />
              </View>
              <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color={Colors.primary} />
              </View>
              <Text style={styles.infoLabel}>{t('profile.joinDate')}</Text>
              <Text style={styles.infoValue}>{user.joinDate}</Text>
            </View>
          </View>
        ) : null}

        {sections.map((section) => (
          <View key={section.titleKey} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.labelKey}
                    style={[
                      styles.menuItem,
                      index === section.items.length - 1 && styles.lastMenuItem,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (item.action === 'sync') {
                        handleSync();
                      } else if (item.route) {
                        router.push(item.route as any);
                      }
                    }}
                  >
                    <View style={styles.menuIcon}>
                      <IconComponent size={20} color={Colors.textSecondary} />
                    </View>
                    <Text style={styles.menuLabel}>{t(item.labelKey)}</Text>
                    <View style={styles.menuRight}>
                      {item.value && (
                        <Text style={styles.menuValue}>{item.value}</Text>
                      )}
                      <ChevronRight size={18} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {user ? (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <LogIn size={20} color={Colors.background} />
            <Text style={styles.signInText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>{t('profile.version', { version: '1.0.0' })}</Text>

        <View style={{ height: 100 }} />
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
  languageRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  tierBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  profileTier: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  profileSignInHint: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  signInText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: '700' as const,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
