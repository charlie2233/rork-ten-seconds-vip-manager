import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QrCode, Wallet, Gift, TrendingUp, ChevronRight, LogIn } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import * as bwipjs from 'bwip-js/generic';
import { useAuth } from '@/contexts/AuthContext';
import { storeLocations, tierInfo } from '@/mocks/data';
import { trpc } from '@/lib/trpc';
import { getTierFromBalance } from '@/lib/tier';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const VIP_CARD_GRADIENTS: Record<
  keyof typeof tierInfo,
  [string, string, string]
> = {
  silver: ['#2C2C2C', '#1A1A1A', '#111111'],
  gold: ['#2D2D2D', '#1F1F1F', '#171717'],
  diamond: ['#122C3D', '#0B1F2C', '#08131D'],
  platinum: ['#2B2B2F', '#1B1C1F', '#141414'],
  blackGold: ['#1A120A', '#0F0B07', '#090705'],
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useI18n();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const storeAddress = storeLocations[0]?.address ?? '4535 Campus Dr, Irvine, CA 92612';

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  // Auto-renew (refresh) balance from MenuSafe every 5 seconds when screen is focused
  const { data: latestBalance } = trpc.menusafe.getLatestBalance.useQuery(
    { memberId: user?.memberId ?? '' },
    { 
      enabled: !!user?.memberId,
      refetchInterval: 5000, // Poll every 5 seconds
      refetchOnWindowFocus: true,
    }
  );

  // Use latest polled balance if available, otherwise fall back to stored user balance
  const displayBalance = latestBalance?.balance ?? user?.balance ?? 0;
  const displayPoints = latestBalance?.points ?? user?.points ?? 0;
  const effectiveTier = user ? getTierFromBalance(displayBalance) : 'silver';
  const tier = tierInfo[effectiveTier];
  const cardAccent = tier.color;
  const cardTheme = useMemo(() => {
    const gradient = VIP_CARD_GRADIENTS[effectiveTier] ?? VIP_CARD_GRADIENTS.silver;
    return {
      gradient,
      accent: cardAccent,
      borderColor: `${cardAccent}66`,
      accentBackground: `${cardAccent}1A`,
      decorBorderColor: `${cardAccent}26`,
      shimmerColor: `${cardAccent}14`,
    };
  }, [cardAccent, effectiveTier]);

  const recentTransactionsQuery = trpc.transactions.getRecent.useQuery(
    { userId: user?.id, count: 3 },
    { enabled: !!user }
  );
  const recentTransactions = recentTransactionsQuery.data ?? [];

  const barcodeSvg = useMemo(() => {
    if (!user?.memberId) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'code128',
        text: user.memberId,
        scale: 2,
        height: 8,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 4,
        paddingheight: 4,
      });
    } catch {
      return null;
    }
  }, [user?.memberId]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

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
        <View style={styles.header}>
          <LanguageToggle style={styles.languageMenu} />
          <Text style={styles.greeting}>{t('home.welcomeBack')}</Text>
          <Text style={styles.userName}>{user?.name ?? ''}</Text>
        </View>

        <View style={styles.cardContainer}>
          <LinearGradient
            colors={cardTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.vipCard, { borderColor: cardTheme.borderColor }]}
          >
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', cardTheme.shimmerColor, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={[styles.brandName, { color: cardTheme.accent }]}>十秒到</Text>
                <Text style={styles.storeAddress} numberOfLines={1}>
                  {storeAddress}
                </Text>
                <Text style={[styles.tierName, { color: cardTheme.accent }]}>
                  {t(`tier.${effectiveTier}`)}
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.qrButton,
                  { backgroundColor: cardTheme.accentBackground, borderColor: cardTheme.borderColor },
                ]}
                onPress={() => router.push('/member-code')}
                activeOpacity={0.7}
              >
                <QrCode size={28} color={cardTheme.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>{t('home.balance')}</Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.currencySymbol, { color: cardTheme.accent }]}>$</Text>
                <Text style={styles.balanceAmount}>
                  {displayBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.memberIdSection}>
                <Text style={styles.memberIdLabel}>{t('home.memberId')}</Text>
                <Text style={styles.memberId}>{user?.memberId ?? ''}</Text>
                {user ? (
                  <View style={styles.barcodeContainer}>
                    {barcodeSvg ? (
                      <SvgXml xml={barcodeSvg} width="100%" height="100%" />
                    ) : (
                      <Text style={styles.barcodeError}>{t('home.barcodeFailed')}</Text>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.loginPrompt, { backgroundColor: cardTheme.accentBackground }]}
                    onPress={() => router.push('/login')}
                  >
                    <LogIn size={12} color={cardTheme.accent} />
                    <Text style={[styles.loginPromptText, { color: cardTheme.accent }]}>
                      {t('home.loginToShowBarcode')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsLabel}>{t('home.points')}</Text>
                <Text style={[styles.pointsValue, { color: cardTheme.accent }]}>
                  {displayPoints.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.cardDecoration}>
              <View
                style={[
                  styles.decorCircle,
                  styles.decorCircle1,
                  { borderColor: cardTheme.decorBorderColor },
                ]}
              />
              <View
                style={[
                  styles.decorCircle,
                  styles.decorCircle2,
                  { borderColor: cardTheme.decorBorderColor },
                ]}
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => router.push('/recharge')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(201, 169, 98, 0.15)' }]}>
              <Wallet size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>{t('home.action.recharge')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/benefits')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(212, 57, 58, 0.15)' }]}>
              <Gift size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.actionText}>{t('home.action.coupons')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/transactions')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
              <TrendingUp size={22} color={Colors.success} />
            </View>
            <Text style={styles.actionText}>{t('home.action.transactions')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => router.push('/member-code')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
              <QrCode size={22} color={Colors.warning} />
            </View>
            <Text style={styles.actionText}>{t('home.action.memberCode')}</Text>
          </TouchableOpacity>
        </View>

        {user && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.recentTransactions')}</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push('/(tabs)/transactions')}
              >
                <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.transactionsList}>
              {recentTransactionsQuery.isLoading ? (
                <View style={styles.transactionItem}>
                  <Text style={styles.transactionDesc}>{t('common.loading')}</Text>
                </View>
              ) : recentTransactions.length === 0 ? (
                <View style={styles.transactionItem}>
                  <Text style={styles.transactionDesc}>{t('transactions.noTransactions')}</Text>
                </View>
              ) : (
                recentTransactions.map((transaction, index) => (
                  <View
                    key={transaction.id}
                    style={[
                      styles.transactionItem,
                      index === recentTransactions.length - 1 && styles.lastItem,
                    ]}
                  >
                    <View style={styles.transactionLeft}>
                      <Text style={styles.transactionDesc} numberOfLines={1}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>{transaction.date}</Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount,
                      ]}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount.toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <View style={styles.promoCard}>
          <LinearGradient
            colors={[Colors.secondary, Colors.secondaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoGradient}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>{t('home.promoTitle')}</Text>
              <Text style={styles.promoDesc}>{t('home.promoDesc')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.promoButton}
              onPress={() => router.push('/promo')}
            >
              <Text style={styles.promoButtonText}>{t('home.promoCta')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

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
    marginBottom: 24,
  },
  languageMenu: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  greeting: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardContainer: {
    marginBottom: 24,
  },
  vipCard: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: CARD_WIDTH,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 12,
    minWidth: 0,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 2,
  },
  storeAddress: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  tierName: {
    fontSize: 15,
    fontWeight: '800' as const,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  memberIdLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  memberId: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    letterSpacing: 1,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  memberIdSection: {
    flex: 1,
  },
  barcodeContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 6,
    width: 140,
    height: 36,
  },
  barcodeError: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  loginPromptText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  cardDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: 20,
    pointerEvents: 'none',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.1)',
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -50,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 2,
  },
  transactionsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 16,
  },
  transactionDesc: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  positiveAmount: {
    color: Colors.success,
  },
  negativeAmount: {
    color: Colors.text,
  },
  promoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  promoButton: {
    backgroundColor: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  promoButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
});
