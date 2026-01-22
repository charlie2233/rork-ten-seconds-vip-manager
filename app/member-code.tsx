import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, RefreshCw, Copy, Check, Wallet, AlertCircle, Sparkles, Crown, Star, Gem } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import * as bwipjs from 'bwip-js/generic';
import { useI18n } from '@/contexts/I18nContext';
import AuthGateCard from '@/components/AuthGateCard';
import Skeleton from '@/components/Skeleton';
import { trpc } from '@/lib/trpc';
import { getTierFromBalance } from '@/lib/tier';
import { getVipCardTheme } from '@/lib/vipCardTheme';
import { CardTexture } from '@/components/CardTexture';
import { useSettings } from '@/contexts/SettingsContext';
import TopBar from '@/components/TopBar';
import OfflineBanner from '@/components/OfflineBanner';
import { formatShortDateTime } from '@/lib/datetime';
import { isProbablyOffline } from '@/lib/offline';
import {
  loadMenusafeBalanceSnapshot,
  saveMenusafeBalanceSnapshot,
  type MenusafeBalanceSnapshot,
} from '@/lib/menusafeBalanceCache';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 48, 400);

export default function MemberCodeScreen() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { hideBalance, backgroundGradient, fontScale } = useSettings();
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [balanceSnapshot, setBalanceSnapshot] = useState<MenusafeBalanceSnapshot | null>(null);
  
  // Animation values
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  const numberLocale = locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-ES' : 'en-US';

  const memberCode = useMemo(() => (user?.memberId ?? '').trim(), [user?.memberId]);

  useEffect(() => {
    // Entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Continuous shimmer effect
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    );
    shimmerLoop.start();

    // Subtle breathing/tilt effect
    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    tiltLoop.start();

    return () => {
      shimmerLoop.stop();
      tiltLoop.stop();
    };
  }, [shimmerAnim, tiltAnim, scaleAnim]);

  const menusafeQuery = trpc.menusafe.getBalance.useQuery(
    { memberId: user?.memberId || '' },
    {
      enabled: !!user?.memberId,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    }
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!user?.memberId) {
        if (isMounted) setBalanceSnapshot(null);
        return;
      }
      const loaded = await loadMenusafeBalanceSnapshot(user.memberId);
      if (isMounted) setBalanceSnapshot(loaded);
    })();
    return () => {
      isMounted = false;
    };
  }, [user?.memberId]);

  useEffect(() => {
    if (!user?.memberId) return;
    const nextBalance = menusafeQuery.data?.balance;
    if (typeof nextBalance !== 'number' || !Number.isFinite(nextBalance)) return;
    (async () => {
      const saved = await saveMenusafeBalanceSnapshot(user.memberId, nextBalance);
      setBalanceSnapshot(saved);
    })();
  }, [menusafeQuery.data?.balance, user?.memberId]);

  const isOffline = !!menusafeQuery.error && isProbablyOffline(menusafeQuery.error);
  const displayBalance =
    menusafeQuery.data?.balance ?? balanceSnapshot?.balance ?? user?.balance ?? 0;
  const displayPoints = user?.points ?? 0;
  const effectiveTier = user ? getTierFromBalance(displayBalance) : 'silver';
  const cardTheme = useMemo(() => getVipCardTheme(effectiveTier), [effectiveTier]);
  const cardSurface = useMemo(() => {
    switch (effectiveTier) {
      case 'silver':
        return {
          textureColor: '#000',
          textureOpacity: 0.05,
          innerStrokeOpacity: 0.6,
          specularOpacity: 0.8,
          specularColors: ['transparent', 'rgba(255,255,255,0.30)', 'rgba(255,255,255,0.08)', 'transparent'] as const,
        };
      case 'gold':
        return {
          textureColor: '#000',
          textureOpacity: 0.04,
          innerStrokeOpacity: 0.4,
          specularOpacity: 0.75,
          specularColors: ['transparent', 'rgba(255,235,180,0.28)', 'rgba(255,255,255,0.08)', 'transparent'] as const,
        };
      case 'platinum':
        return {
          textureColor: '#FFF',
          textureOpacity: 0.06,
          innerStrokeOpacity: 0.45,
          specularOpacity: 0.85,
          specularColors: ['transparent', 'rgba(255,255,255,0.22)', 'rgba(165,243,252,0.11)', 'transparent'] as const,
        };
      case 'diamond':
        return {
          textureColor: '#FFF',
          textureOpacity: 0.065,
          innerStrokeOpacity: 0.4,
          specularOpacity: 0.82,
          specularColors: ['transparent', 'rgba(255,255,255,0.18)', 'rgba(64,224,208,0.14)', 'transparent'] as const,
        };
      case 'blackGold':
        return {
          textureColor: '#FFF',
          textureOpacity: 0.06,
          innerStrokeOpacity: 0.38,
          specularOpacity: 0.7,
          specularColors: ['transparent', 'rgba(212,175,55,0.22)', 'rgba(255,255,255,0.06)', 'transparent'] as const,
        };
      default:
        return {
          textureColor: '#FFF',
          textureOpacity: 0.055,
          innerStrokeOpacity: 0.4,
          specularOpacity: 0.75,
          specularColors: ['transparent', 'rgba(255,255,255,0.20)', 'rgba(255,255,255,0.06)', 'transparent'] as const,
        };
    }
  }, [effectiveTier]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH * 1.5, CARD_WIDTH * 1.5],
  });

  const cardRotateY = tiltAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-1deg', '1deg'],
  });

  const getTierIcon = () => {
    switch (effectiveTier) {
      case 'blackGold': return <Crown size={16} color={cardTheme.accent} fill={cardTheme.accent} fillOpacity={0.2} />;
      case 'diamond': return <Gem size={16} color={cardTheme.accent} fill={cardTheme.accent} fillOpacity={0.2} />;
      case 'platinum': return <Star size={16} color={cardTheme.accent} fill={cardTheme.accent} fillOpacity={0.2} />;
      default: return <Sparkles size={16} color={cardTheme.accent} />;
    }
  };

  const qrSvg = useMemo(() => {
    if (!memberCode) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'qrcode',
        text: memberCode,
        scale: 4,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 0,
        paddingheight: 0,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberCode, refreshKey]);

  const barcodeSvg = useMemo(() => {
    if (!memberCode) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'code128',
        text: memberCode,
        scale: 4,
        height: 12,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 0,
        paddingheight: 0,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberCode, refreshKey]);

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
        <TopBar
          title={t('memberCode.title')}
          right={
            <TouchableOpacity
              style={[
                styles.closePill,
                { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)' },
              ]}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#FFF" />
              <Text style={[styles.closePillText, { color: '#FFF', fontSize: 12 * fontScale }]}>
                {t('common.close')}
              </Text>
            </TouchableOpacity>
          }
        />
        <View style={styles.centerContent}>
          <AuthGateCard
            title={t('memberCode.pleaseLoginFirst')}
            message={t('memberCode.loginHint')}
            style={{ width: '100%', maxWidth: 380 }}
          />

          <View style={styles.guestCodePreview}>
            <View style={styles.guestCodeCard}>
              <View style={styles.guestCodeHeader}>
                <Skeleton style={{ height: 12, width: 140, borderRadius: 8 }} />
                <Skeleton style={{ height: 12, width: 80, borderRadius: 8 }} />
              </View>

              <View style={styles.guestCodeBody}>
                <Skeleton style={styles.guestQrSkeleton} borderRadius={16} />
                <View style={styles.guestCodeMeta}>
                  <Skeleton style={{ height: 12, width: 120, borderRadius: 8 }} />
                  <Skeleton style={{ height: 12, width: 92, borderRadius: 8, marginTop: 10 }} />
                  <Skeleton style={{ height: 34, width: 120, borderRadius: 18, marginTop: 14 }} />
                </View>
              </View>

              <Skeleton style={styles.guestBarcodeSkeleton} borderRadius={12} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(memberCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    if (user?.memberId) menusafeQuery.refetch();
  };

  const handleAddToWallet = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(t('common.error'), t('memberCode.walletIosOnly'));
      return;
    }

    try {
      const passUrl = `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000'}/api/pass/${memberCode}`;
      const supported = await Linking.canOpenURL(passUrl);
      if (supported) {
        await Linking.openURL(passUrl);
      } else {
        Alert.alert(t('memberCode.walletPassTitle'), t('memberCode.walletOpenFail'));
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('memberCode.walletAddFail'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Background based on tier */}
      <LinearGradient
        colors={cardTheme.gradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.5, 1]}
      >
        <View style={[styles.backdropOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
      </LinearGradient>

      <TopBar
        title={t('memberCode.title')}
        right={
          <TouchableOpacity
            style={[
              styles.closePill,
              { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)' },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#FFF" />
            <Text style={[styles.closePillText, { color: '#FFF', fontSize: 12 * fontScale }]}>
              {t('common.close')}
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <Animated.View style={[
          styles.cardWrapper,
          { 
            transform: [
              { scale: scaleAnim },
              { perspective: 1000 },
              { rotateY: cardRotateY }
            ]
          }
        ]}>
          
          {/* Main Card */}
          <View style={[
              styles.cardContainer,
              { 
                borderColor: cardTheme.borderColor,
                backgroundColor: cardTheme.gradient[0] // Fallback
              }
            ]}>
            
            {/* Card Background Gradient */}
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

            {/* Decorative Patterns */}
            <View style={styles.cardPattern}>
               <View style={[styles.circleDecor, { borderColor: cardTheme.decorationBorder, width: 300, height: 300, top: -100, right: -100 }]} />
               <View style={[styles.circleDecor, { borderColor: cardTheme.decorationBorder, width: 200, height: 200, bottom: -50, left: -50 }]} />
            </View>

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

            {/* Shimmer Effect */}
            <Animated.View
              style={[
                styles.shimmerLayer,
                { transform: [{ translateX: shimmerTranslate }, { rotate: '25deg' }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', cardTheme.shimmerIntense, 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Content Layer */}
            <View style={styles.cardContent}>
              
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.appName, { color: cardTheme.textMuted, fontSize: 12 * fontScale }]}>
                    VIP MEMBER
                  </Text>
                  <View style={styles.tierContainer}>
                    {getTierIcon()}
                    <Text style={[styles.tierName, { color: cardTheme.accent, fontSize: 14 * fontScale }]}>
                      {t(`tier.${effectiveTier}`)}
                    </Text>
                  </View>
                </View>
                {/* Chip Icon */}
                <View style={styles.chipIcon}>
                  <LinearGradient
                    colors={cardTheme.chipGradient}
                    style={styles.chipInner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.chipLine1} />
                    <View style={styles.chipLine2} />
                  </LinearGradient>
                </View>
              </View>

              {/* User Details */}
              <View style={styles.userDetails}>
                <Text style={[styles.userNameLabel, { color: cardTheme.textMuted, fontSize: 11 * fontScale }]}>
                  {t('memberCode.member')}
                </Text>
                <Text
                  style={[
                    styles.userName,
                    {
                      color: cardTheme.text,
                      fontSize: 24 * fontScale,
                      textShadowColor: cardTheme.glowColor,
                      textShadowRadius: 10,
                    },
                  ]}
                >
                  {user.name}
                </Text>
              </View>

              {/* QR Code Section - Ticket Style */}
              <View style={styles.ticketSection}>
                 <View style={styles.qrContainer}>
                    {qrSvg ? (
                      <SvgXml xml={qrSvg} width="100%" height="100%" />
                    ) : (
                      <ActivityIndicator color={Colors.primary} />
                    )}
                 </View>
                 
                 <View style={styles.barcodeSection}>
                    {barcodeSvg && (
                      <View style={styles.barcodeContainer}>
                         <SvgXml xml={barcodeSvg} width="100%" height="100%" preserveAspectRatio="none" />
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.codeTextContainer}
                      onPress={copyToClipboard}
                      activeOpacity={0.6}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('common.copy')}: ${memberCode}`}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.codeText, { fontSize: 14 * fontScale }]}>{memberCode}</Text>
                      {copied ? <Check size={14} color={Colors.success} /> : <Copy size={14} color="#666" />}
                    </TouchableOpacity>
                 </View>
              </View>

              {/* Bottom Footer */}
              <View style={styles.cardFooter}>
                 <TouchableOpacity 
                    style={styles.refreshBtn}
                    onPress={handleRefresh}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.refresh')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                 >
                    <RefreshCw size={14} color={cardTheme.textMuted} />
                    <Text style={[styles.refreshLabel, { color: cardTheme.textMuted, fontSize: 11 * fontScale }]}>
                      {t('common.refresh')}
                    </Text>
                 </TouchableOpacity>
                 <Text style={[styles.memberSince, { color: cardTheme.textMuted, fontSize: 11 * fontScale }]}>
                    {t('profile.joinDate')}: {user.joinDate}
                 </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons & Info */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.walletButton}
            onPress={handleAddToWallet}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={t('memberCode.addToWallet')}
          >
            <LinearGradient
              colors={['#111', '#333']}
              style={styles.walletGradient}
              start={{x:0, y:0}} end={{x:1, y:0}}
            >
              <Wallet size={20} color="#FFF" />
              <Text style={[styles.walletText, { fontSize: 16 * fontScale }]}>{t('memberCode.addToWallet')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {isOffline ? (
            <OfflineBanner
              title={t('offline.title')}
              message={t('offline.message')}
              lastUpdated={
                balanceSnapshot?.updatedAt
                  ? t('offline.lastUpdated', {
                      time: formatShortDateTime(balanceSnapshot.updatedAt, locale),
                    })
                  : undefined
              }
              onRetry={() => menusafeQuery.refetch()}
              retryLabel={t('offline.retry')}
              style={{ marginBottom: 12 }}
            />
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
               <Text style={[styles.statLabel, { fontSize: 12 * fontScale }]}>{t('memberCode.balance')}</Text>
               <Text style={[styles.statValue, { fontSize: 20 * fontScale }]}>
                 {hideBalance
                   ? '$••••'
                   : `$${displayBalance.toLocaleString(numberLocale, {
                       minimumFractionDigits: 2,
                       maximumFractionDigits: 2,
                     })}`}
               </Text>
               {menusafeQuery.isFetching && <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />}
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
               <Text style={[styles.statLabel, { fontSize: 12 * fontScale }]}>{t('memberCode.points')}</Text>
               <Text style={[styles.statValue, { fontSize: 20 * fontScale }]}>
                 {displayPoints.toLocaleString(numberLocale)}
               </Text>
            </View>
          </View>
          
          {menusafeQuery.isError && !isOffline && (
             <View style={styles.errorBanner}>
               <AlertCircle size={14} color="#FF6B6B" />
               <Text style={[styles.errorBannerText, { fontSize: 12 * fontScale }]}>{t('memberCode.syncError')}</Text>
             </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  closePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    aspectRatio: 0.62, // Vertical card ratio
    position: 'relative',
  },
  cardInnerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardSpecular: {
    position: 'absolute',
    top: '-12%',
    left: '-55%',
    width: '160%',
    height: '140%',
    transform: [{ rotate: '18deg' }],
  },
  cardPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circleDecor: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    opacity: 0.3,
  },
  shimmerLayer: {
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    bottom: -100,
    zIndex: 10,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    zIndex: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appName: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
    opacity: 0.8,
  },
  tierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tierName: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipIcon: {
    width: 45,
    height: 34,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipInner: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  chipLine1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  chipLine2: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  userDetails: {
    marginVertical: 20,
  },
  userNameLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ticketSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrContainer: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  barcodeSection: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  barcodeContainer: {
    width: '100%',
    height: 40,
    overflow: 'hidden',
  },
  codeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  refreshLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberSince: {
    fontSize: 11,
    opacity: 0.8,
  },
  actionContainer: {
    width: '100%',
    marginTop: 32,
    gap: 16,
  },
  walletButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  walletGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  walletText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  loader: {
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  errorBannerText: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  guestCodePreview: {
    width: '100%',
    maxWidth: 380,
    marginTop: 16,
  },
  guestCodeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
  },
  guestCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  guestCodeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  guestQrSkeleton: {
    width: 138,
    height: 138,
  },
  guestCodeMeta: {
    flex: 1,
  },
  guestBarcodeSkeleton: {
    height: 42,
    marginTop: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
