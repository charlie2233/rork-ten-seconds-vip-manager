import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QrCode, Wallet, Gift, TrendingUp, ChevronRight, LogIn, Sparkles, Crown, Star } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import * as bwipjs from 'bwip-js/generic';
import { useAuth } from '@/contexts/AuthContext';
import { storeLocations } from '@/mocks/data';
import { trpc } from '@/lib/trpc';
import { getTierFromBalance, TIER_MIN_BALANCE, TIER_ORDER } from '@/lib/tier';
import Colors from '@/constants/colors';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { getVipCardTheme } from '@/lib/vipCardTheme';
import { CardTexture } from '@/components/CardTexture';
import TopBar from '@/components/TopBar';
import BrandBanner from '@/components/BrandBanner';
import ContextualHelpChips from '@/components/ContextualHelpChips';
import { useSettings } from '@/contexts/SettingsContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = 240;

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { backgroundGradient, hideBalance, fontScale } = useSettings();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const storeAddress = storeLocations[0]?.address ?? '4535 Campus Dr, Irvine, CA 92612';
  const numberLocale = locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-ES' : 'en-US';

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    );
    shimmer.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    glow.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      shimmer.stop();
      glow.stop();
      pulse.stop();
    };
  }, [shimmerAnim, glowAnim, pulseAnim]);

  const { data: latestBalance } = trpc.menusafe.getBalance.useQuery(
    { memberId: user?.memberId ?? '' },
    { 
      enabled: !!user?.memberId,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    }
  );

  const displayBalance = latestBalance?.balance ?? user?.balance ?? 0;
  const displayPoints = user?.points ?? 0;
  const effectiveTier = user ? getTierFromBalance(displayBalance) : 'silver';
  const cardTheme = useMemo(() => getVipCardTheme(effectiveTier), [effectiveTier]);

  const currentTierIndex = TIER_ORDER.indexOf(effectiveTier);
  const nextTier = currentTierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIndex + 1] : null;
  const nextTierMin = nextTier ? TIER_MIN_BALANCE[nextTier] : null;
  const currentTierMin = TIER_MIN_BALANCE[effectiveTier];
  const progressToNext = nextTierMin 
    ? Math.max(
        0,
        Math.min(100, ((displayBalance - currentTierMin) / (nextTierMin - currentTierMin)) * 100)
      )
    : 100;
  const remainingToNext = nextTierMin ? Math.max(0, nextTierMin - displayBalance) : 0;

  const recentTransactionsQuery = trpc.transactions.getRecent.useQuery(
    { userId: user?.id, count: 3 },
    { enabled: !!user }
  );
  const recentTransactions = recentTransactionsQuery.data ?? [];

  const memberCode = useMemo(() => (user?.memberId ?? '').trim(), [user?.memberId]);

  const barcodeSvg = useMemo(() => {
    if (!memberCode) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'code128',
        text: memberCode,
        scale: 3,
        height: 12,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 8,
        paddingheight: 8,
      });
    } catch {
      return null;
    }
  }, [memberCode]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH * 1.5, CARD_WIDTH * 1.5],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const cardSurface = useMemo(() => {
    switch (effectiveTier) {
      case 'silver':
        return {
          patternCount: 10,
          patternRotation: '35deg',
          patternLineWidth: 1,
          textureColor: '#000',
          textureOpacity: 0.045,
          innerStrokeOpacity: 0.55,
          specularOpacity: 0.75,
          specularColors: ['transparent', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0.08)', 'transparent'] as const,
        };
      case 'gold':
        return {
          patternCount: 6,
          patternRotation: '42deg',
          patternLineWidth: 1,
          textureColor: '#000',
          textureOpacity: 0.035,
          innerStrokeOpacity: 0.35,
          specularOpacity: 0.7,
          specularColors: ['transparent', 'rgba(255,235,180,0.28)', 'rgba(255,255,255,0.08)', 'transparent'] as const,
        };
      case 'platinum':
        return {
          patternCount: 4,
          patternRotation: '55deg',
          patternLineWidth: 1.5,
          textureColor: '#FFF',
          textureOpacity: 0.055,
          innerStrokeOpacity: 0.4,
          specularOpacity: 0.8,
          specularColors: ['transparent', 'rgba(255,255,255,0.22)', 'rgba(165,243,252,0.10)', 'transparent'] as const,
        };
      case 'diamond':
        return {
          patternCount: 5,
          patternRotation: '50deg',
          patternLineWidth: 1.2,
          textureColor: '#FFF',
          textureOpacity: 0.06,
          innerStrokeOpacity: 0.35,
          specularOpacity: 0.75,
          specularColors: ['transparent', 'rgba(255,255,255,0.18)', 'rgba(64,224,208,0.12)', 'transparent'] as const,
        };
      case 'blackGold':
        return {
          patternCount: 0,
          patternRotation: '45deg',
          patternLineWidth: 1,
          textureColor: '#FFF',
          textureOpacity: 0.055,
          innerStrokeOpacity: 0.32,
          specularOpacity: 0.65,
          specularColors: ['transparent', 'rgba(212,175,55,0.20)', 'rgba(255,255,255,0.06)', 'transparent'] as const,
        };
      default:
        return {
          patternCount: 6,
          patternRotation: '45deg',
          patternLineWidth: 1,
          textureColor: '#FFF',
          textureOpacity: 0.05,
          innerStrokeOpacity: 0.35,
          specularOpacity: 0.7,
          specularColors: ['transparent', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)', 'transparent'] as const,
        };
    }
  }, [effectiveTier]);

  const getTierIcon = () => {
    switch (effectiveTier) {
      case 'blackGold': return <Crown size={16} color={cardTheme.accent} />;
      case 'diamond': return <Sparkles size={16} color={cardTheme.accent} />;
      case 'platinum': return <Star size={16} color={cardTheme.accent} />;
      default: return null;
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
          <BrandBanner
            subtitle={storeAddress}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.greeting, { fontSize: 16 * fontScale }]}>{t('home.welcomeBack')}</Text>
          <Text style={[styles.userName, { fontSize: 28 * fontScale }]}>{user?.name ?? ''}</Text>
        </View>

        <Animated.View style={[styles.cardContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={[styles.cardGlow, { 
            opacity: glowOpacity,
            shadowColor: cardTheme.glowColor,
            backgroundColor: cardTheme.glowColor,
          }]} />
          
          <LinearGradient
            colors={cardTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.vipCard, { borderColor: cardTheme.borderColor }]}
          >
            <LinearGradient
              colors={cardTheme.overlayGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardOverlay}
            />

            <View
              pointerEvents="none"
              style={[
                styles.innerStroke,
                { borderColor: cardTheme.borderGlow, opacity: cardSurface.innerStrokeOpacity },
              ]}
            />

            <CardTexture
              type={cardTheme.texture || 'none'}
              color={cardSurface.textureColor}
              opacity={cardSurface.textureOpacity}
            />

            <View
              pointerEvents="none"
              style={[styles.specularOverlay, { opacity: cardSurface.specularOpacity }]}
            >
              <LinearGradient
                colors={cardSurface.specularColors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.patternContainer}>
              {[...Array(cardSurface.patternCount)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.patternLine,
                    { 
                      backgroundColor: cardTheme.patternColor,
                      left: `${10 + (i * 80) / Math.max(1, cardSurface.patternCount - 1)}%`,
                      transform: [{ rotate: cardSurface.patternRotation }],
                      width: cardSurface.patternLineWidth,
                    }
                  ]} 
                />
              ))}
            </View>

            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }, { rotate: '15deg' }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', cardTheme.shimmerIntense, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.brandRow}>
                  <Text style={[styles.brandName, { color: cardTheme.accent }]}>
                    {t('brand.shortName')}
                  </Text>
                  <View style={[styles.chipContainer]}>
                    <LinearGradient
                      colors={cardTheme.chipGradient}
                      style={styles.chip}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.chipLines}>
                        <View style={[styles.chipLine, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
                        <View style={[styles.chipLine, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
                        <View style={[styles.chipLine, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
                      </View>
                    </LinearGradient>
                  </View>
                </View>
                <Text style={[styles.storeAddress, { color: cardTheme.textSecondary }]} numberOfLines={1}>
                  {storeAddress}
                </Text>
                
                <View style={styles.tierBadgeContainer}>
                  <LinearGradient
                    colors={cardTheme.tierBadgeGradient}
                    style={styles.tierBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {getTierIcon()}
                    <Text style={styles.tierBadgeText}>
                      {t(`tier.${effectiveTier}`)}
                    </Text>
                  </LinearGradient>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.qrButton, { 
                  backgroundColor: cardTheme.qrBackground, 
                  borderColor: cardTheme.borderColor,
                }]}
                onPress={() => (user ? router.push('/member-code') : router.push('/login'))}
                activeOpacity={0.7}
              >
                <QrCode size={26} color={cardTheme.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={[styles.balanceLabel, { color: cardTheme.textMuted }]}>
                {t('home.balance')}
              </Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.currencySymbol, { color: cardTheme.text }]}>$</Text>
                <Text style={[styles.balanceAmount, { color: cardTheme.text }]}>
                  {hideBalance
                    ? '••••'
                    : displayBalance.toLocaleString(numberLocale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </Text>
              </View>
              
              {nextTier && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressTrack, { backgroundColor: cardTheme.patternColor }]}>
                    <LinearGradient
                      colors={cardTheme.chipGradient}
                      style={[styles.progressFill, { width: `${progressToNext}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: cardTheme.textMuted }]}>
                    {hideBalance ? `••• ${t('home.toNextTier')}` : `$${remainingToNext.toFixed(0)} ${t('home.toNextTier')}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.memberIdSection}>
                <Text style={[styles.memberIdLabel, { color: cardTheme.textMuted }]}>
                  {t('home.memberId')}
                </Text>
                <Text style={[styles.memberId, { color: cardTheme.textSecondary }]}>
                  {memberCode}
                </Text>
                {user ? (
                  <View style={styles.barcodeContainer}>
                    {barcodeSvg ? (
                      <SvgXml
                        xml={barcodeSvg}
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid meet"
                      />
                    ) : (
                      <Text style={[styles.barcodeError, { color: cardTheme.textMuted }]}>
                        {t('home.barcodeFailed')}
                      </Text>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.loginPrompt, { backgroundColor: `${cardTheme.accent}15` }]}
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
                <Text style={[styles.pointsLabel, { color: cardTheme.textMuted }]}>
                  {t('home.points')}
                </Text>
                <View style={styles.pointsValueRow}>
                  <Sparkles size={14} color={cardTheme.accent} style={{ marginRight: 4 }} />
                  <Text style={[styles.pointsValue, { color: cardTheme.accent }]}>
                    {displayPoints.toLocaleString(numberLocale)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardDecoration}>
              <View style={[styles.decorCircle, styles.decorCircle1, { borderColor: cardTheme.decorationBorder }]} />
              <View style={[styles.decorCircle, styles.decorCircle2, { borderColor: cardTheme.decorationBorder }]} />
              <View style={[styles.decorCircle, styles.decorCircle3, { borderColor: cardTheme.decorationBorder }]} />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => router.push('/recharge')}
          >
            <LinearGradient
              colors={['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.08)']}
              style={styles.actionIcon}
            >
              <Wallet size={22} color={Colors.primary} />
            </LinearGradient>
            <Text style={styles.actionText}>{t('home.action.recharge')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => (user ? router.push('/(tabs)/benefits') : router.push('/login'))}
          >
            <LinearGradient
              colors={['rgba(212, 57, 58, 0.2)', 'rgba(212, 57, 58, 0.08)']}
              style={styles.actionIcon}
            >
              <Gift size={22} color={Colors.secondary} />
            </LinearGradient>
            <Text style={styles.actionText}>{t('home.action.coupons')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => (user ? router.push('/(tabs)/transactions') : router.push('/login'))}
          >
            <LinearGradient
              colors={['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.08)']}
              style={styles.actionIcon}
            >
              <TrendingUp size={22} color={Colors.success} />
            </LinearGradient>
            <Text style={styles.actionText}>{t('home.action.transactions')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => (user ? router.push('/member-code') : router.push('/login'))}
          >
            <LinearGradient
              colors={['rgba(255, 152, 0, 0.2)', 'rgba(255, 152, 0, 0.08)']}
              style={styles.actionIcon}
            >
              <QrCode size={22} color={Colors.warning} />
            </LinearGradient>
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
                      {hideBalance
                        ? transaction.amount > 0
                          ? '+$••••'
                          : '$••••'
                        : `${transaction.amount > 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}`}
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

        <ContextualHelpChips
          showTitle
          style={styles.helpChips}
        />

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
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  cardContainer: {
    marginBottom: 28,
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: -10,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  vipCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    minHeight: CARD_HEIGHT,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
  },
  specularOverlay: {
    position: 'absolute',
    top: -32,
    left: -110,
    width: CARD_WIDTH * 0.9,
    height: CARD_HEIGHT * 1.2,
    transform: [{ rotate: '18deg' }],
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 24,
  },
  patternLine: {
    position: 'absolute',
    width: 1,
    height: '200%',
    top: '-50%',
  },
  shimmer: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    bottom: -50,
    width: CARD_WIDTH * 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 1,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 12,
    minWidth: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  chipContainer: {
    width: 36,
    height: 26,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chip: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  chipLines: {
    width: '60%',
    gap: 3,
  },
  chipLine: {
    height: 2,
    borderRadius: 1,
  },
  storeAddress: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500' as const,
    opacity: 0.9,
  },
  tierBadgeContainer: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  qrButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    marginBottom: 20,
    zIndex: 1,
  },
  balanceLabel: {
    fontSize: 11,
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600' as const,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '600' as const,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  progressContainer: {
    marginTop: 12,
    width: '70%',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500' as const,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  memberIdLabel: {
    fontSize: 9,
    marginBottom: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600' as const,
  },
  memberId: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 1.5,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 9,
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600' as const,
  },
  pointsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  memberIdSection: {
    flex: 1,
    minWidth: 0,
  },
  barcodeContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 6,
    width: '100%',
    maxWidth: 160,
    height: 40,
    overflow: 'hidden',
  },
  barcodeError: {
    fontSize: 10,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  loginPromptText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  cardDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: 24,
    pointerEvents: 'none',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 1,
  },
  decorCircle1: {
    width: 250,
    height: 250,
    top: -130,
    right: -80,
  },
  decorCircle2: {
    width: 180,
    height: 180,
    bottom: -90,
    left: -60,
  },
  decorCircle3: {
    width: 100,
    height: 100,
    top: '40%',
    right: '20%',
    opacity: 0.5,
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
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
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
  helpChips: {
    marginTop: 20,
  },
});
