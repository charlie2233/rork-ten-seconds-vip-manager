import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Phone,
  CreditCard,
  Calendar,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  MessageSquare,
  Info,
  LogOut,
  LogIn,
  Settings,
  MapPin,
  RefreshCw,
  Crown,
  Gem,
  Star,
  Sparkles,
  QrCode,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { useI18n } from '@/contexts/I18nContext';
import TopBar from '@/components/TopBar';
import { migrationService } from '@/lib/migration';
import { getTierFromBalance } from '@/lib/tier';
import { getVipCardTheme } from '@/lib/vipCardTheme';
import { CardTexture } from '@/components/CardTexture';
import VipLevelsShowcase from '@/components/VipLevelsShowcase';
import { useSettings } from '@/contexts/SettingsContext';

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
      { icon: Info, labelKey: 'profile.item.howItWorks', value: '', route: '/how-it-works' },
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
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { backgroundGradient, fontScale, hideBalance } = useSettings();

  const effectiveTier = user ? getTierFromBalance(user.balance) : 'silver';
  const cardTheme = useMemo(() => getVipCardTheme(effectiveTier), [effectiveTier]);
  const cardSurface = useMemo(() => {
    switch (effectiveTier) {
      case 'silver':
        return {
          textureColor: '#000',
          textureOpacity: 0.04,
          innerStrokeOpacity: 0.5,
          specularOpacity: 0.55,
          specularColors: ['transparent', 'rgba(255,255,255,0.24)', 'rgba(255,255,255,0.07)', 'transparent'] as const,
        };
      case 'gold':
        return {
          textureColor: '#000',
          textureOpacity: 0.03,
          innerStrokeOpacity: 0.3,
          specularOpacity: 0.5,
          specularColors: ['transparent', 'rgba(255,235,180,0.22)', 'rgba(255,255,255,0.07)', 'transparent'] as const,
        };
      case 'platinum':
        return {
          textureColor: '#FFF',
          textureOpacity: 0.05,
          innerStrokeOpacity: 0.35,
          specularOpacity: 0.6,
          specularColors: ['transparent', 'rgba(255,255,255,0.18)', 'rgba(165,243,252,0.09)', 'transparent'] as const,
        };
      case 'diamond':
        return {
          textureColor: '#FFF',
          textureOpacity: 0.055,
          innerStrokeOpacity: 0.3,
          specularOpacity: 0.58,
          specularColors: ['transparent', 'rgba(255,255,255,0.16)', 'rgba(64,224,208,0.10)', 'transparent'] as const,
        };
      case 'blackGold':
        return {
          textureColor: '#FFF',
          textureOpacity: 0.05,
          innerStrokeOpacity: 0.28,
          specularOpacity: 0.5,
          specularColors: ['transparent', 'rgba(212,175,55,0.18)', 'rgba(255,255,255,0.06)', 'transparent'] as const,
        };
      default:
        return {
          textureColor: '#FFF',
          textureOpacity: 0.05,
          innerStrokeOpacity: 0.3,
          specularOpacity: 0.55,
          specularColors: ['transparent', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.06)', 'transparent'] as const,
        };
    }
  }, [effectiveTier]);
  
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
              const balance = Number(result?.balance ?? 0);
              Alert.alert(
                t('profile.migration.success'),
                `${t('home.balance')}: ${hideBalance ? '$••••' : `$${balance.toFixed(2)}`}`
              );
            } catch {
              Alert.alert(t('forgot.error'), t('profile.migration.notFound'));
            }
          },
        },
      ]
    );
  };

  const getTierIcon = () => {
    switch (effectiveTier) {
      case 'blackGold': return <Crown size={16} color={cardTheme.accent} fill={cardTheme.accent} fillOpacity={0.2} />;
      case 'diamond': return <Gem size={16} color={cardTheme.accent} fill={cardTheme.accent} fillOpacity={0.2} />;
      case 'platinum': return <Star size={16} color={cardTheme.accent} fill={cardTheme.accent} fillOpacity={0.2} />;
      default: return <Sparkles size={16} color={cardTheme.accent} />;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('brand.shortName')} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: 28 * fontScale }]}>{t('profile.title')}</Text>
        </View>

        {user ? (
          <TouchableOpacity
            style={[styles.profileCard, { 
              shadowColor: cardTheme.glowColor,
              borderColor: cardTheme.borderColor 
            }]}
            activeOpacity={0.9}
            onPress={() => router.push('/member-code')}
            accessibilityRole="button"
            accessibilityLabel={t('memberCode.title')}
          >
            {/* Main Card Background */}
            <LinearGradient
              colors={cardTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Texture Overlay */}
            <CardTexture 
              type={cardTheme.texture || 'none'} 
              color={cardSurface.textureColor} 
              opacity={cardSurface.textureOpacity} 
            />

            <View
              pointerEvents="none"
              style={[
                styles.cardInnerStroke,
                { borderColor: cardTheme.borderGlow, opacity: cardSurface.innerStrokeOpacity },
              ]}
            />

            {/* Pattern Overlay */}
            <View style={styles.cardPattern}>
              <View style={[styles.circleDecor, { borderColor: cardTheme.decorationBorder, width: 200, height: 200, top: -80, right: -60 }]} />
              <View style={[styles.circleDecor, { borderColor: cardTheme.decorationBorder, width: 140, height: 140, bottom: -40, left: -30 }]} />
            </View>

            {/* Shimmer Effect */}
            <LinearGradient
              colors={cardTheme.overlayGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View
              pointerEvents="none"
              style={[styles.cardSpecular, { opacity: cardSurface.specularOpacity }]}
            >
              <LinearGradient
                colors={cardSurface.specularColors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={cardTheme.chipGradient}
                    style={styles.avatar}
                  >
                    <Text style={[styles.avatarText, { color: '#000', fontSize: 24 * fontScale }]}>
                      {user.name.charAt(0)}
                    </Text>
                  </LinearGradient>
                  <View>
                     <Text style={[styles.profileName, { color: cardTheme.text, fontSize: 20 * fontScale }]}>
                       {user.name}
                     </Text>
                     <View style={styles.tierBadgeRow}>
                        {getTierIcon()}
                        <Text style={[styles.profileTier, { color: cardTheme.accent, fontSize: 12 * fontScale }]}>
                          {t(`tier.${effectiveTier}`)}
                        </Text>
                     </View>
                  </View>
                </View>

                <View style={[styles.qrButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                   <QrCode size={20} color={cardTheme.text} />
                </View>
              </View>

              <View style={styles.cardFooter}>
                 <View style={styles.memberIdContainer}>
                    <Text style={[styles.memberIdLabel, { color: cardTheme.textMuted, fontSize: 11 * fontScale }]}>
                      {t('memberCode.memberCardNo')}
                    </Text>
                    <Text style={[styles.memberIdValue, { color: cardTheme.text, fontSize: 16 * fontScale }]}>
                      {user.memberId}
                    </Text>
                 </View>
                 <View style={styles.tapHint}>
                    <Text style={[styles.tapHintText, { color: cardTheme.accent, fontSize: 12 * fontScale }]}>
                      {t('profile.tapToView')}
                    </Text>
                    <ChevronRight size={14} color={cardTheme.accent} />
                 </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginCard}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('auth.login')}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.loginContent}>
              <View style={styles.loginIconContainer}>
                <LogIn size={24} color={Colors.background} />
              </View>
              <View>
                <Text style={[styles.loginTitle, { fontSize: 18 * fontScale }]}>{t('auth.login')}</Text>
                <Text style={[styles.loginSubtitle, { fontSize: 13 * fontScale }]}>{t('profile.signInHint')}</Text>
              </View>
              <ChevronRight size={20} color={Colors.background} style={{ marginLeft: 'auto' }} />
            </View>
          </TouchableOpacity>
        )}

        <VipLevelsShowcase
          currentTier={user ? effectiveTier : null}
          currentBalance={user?.balance ?? null}
        />

        {user ? (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <CreditCard size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.infoLabel, { fontSize: 14 * fontScale }]}>{t('profile.memberId')}</Text>
              <Text style={[styles.infoValue, { fontSize: 14 * fontScale }]}>{user.memberId}</Text>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Phone size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.infoLabel, { fontSize: 14 * fontScale }]}>{t('profile.phone')}</Text>
              <Text style={[styles.infoValue, { fontSize: 14 * fontScale }]}>{user.phone}</Text>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.infoLabel, { fontSize: 14 * fontScale }]}>{t('profile.joinDate')}</Text>
              <Text style={[styles.infoValue, { fontSize: 14 * fontScale }]}>{user.joinDate}</Text>
            </View>
          </View>
        ) : null}

        {sections.map((section) => (
          <View key={section.titleKey} style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { fontSize: 14 * fontScale }]}>{t(section.titleKey)}</Text>
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
                    accessibilityRole="button"
                    accessibilityLabel={t(item.labelKey)}
                  >
                    <View style={styles.menuIcon}>
                      <IconComponent size={20} color={Colors.textSecondary} />
                    </View>
                    <Text style={[styles.menuLabel, { fontSize: 15 * fontScale }]}>{t(item.labelKey)}</Text>
                    <View style={styles.menuRight}>
                      {item.value && (
                        <Text style={[styles.menuValue, { fontSize: 14 * fontScale }]}>{item.value}</Text>
                      )}
                      <ChevronRight size={18} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {user && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('profile.logout')}
          >
            <LogOut size={20} color={Colors.error} />
            <Text style={[styles.logoutText, { fontSize: 16 * fontScale }]}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.version, { fontSize: 12 * fontScale }]}>
          {t('profile.version', { version: '1.0.0' })}
        </Text>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  profileCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 180,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cardInnerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardSpecular: {
    position: 'absolute',
    top: '-25%',
    left: '-35%',
    width: '120%',
    height: '120%',
    transform: [{ rotate: '18deg' }],
  },
  circleDecor: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    opacity: 0.3,
  },
  cardContent: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  profileTier: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  memberIdContainer: {
    gap: 4,
  },
  memberIdLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  memberIdValue: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    letterSpacing: 1,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    minHeight: 100,
  },
  loginContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loginIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background,
    marginBottom: 2,
  },
  loginSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
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
    fontWeight: '500',
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
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
