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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, RefreshCw, Copy, Check, Wallet, AlertCircle, Sparkles, Crown, Star } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import * as bwipjs from 'bwip-js/generic';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';
import { trpc } from '@/lib/trpc';
import { getTierFromBalance } from '@/lib/tier';
import { getVipCardTheme } from '@/lib/vipCardTheme';

const { width } = Dimensions.get('window');

export default function MemberCodeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncedBalance, setSyncedBalance] = useState<number | null>(null);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const numberLocale = locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-ES' : 'en-US';

  const memberCode = useMemo(() => (user?.memberId ?? '').trim(), [user?.memberId]);

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
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

    return () => {
      shimmer.stop();
      glow.stop();
    };
  }, [shimmerAnim, glowAnim]);

  const menusafeQuery = trpc.menusafe.getLatestBalance.useQuery(
    { memberId: user?.memberId || '' },
    {
      enabled: !!user?.memberId,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    }
  );

  useEffect(() => {
    if (menusafeQuery.data) {
      setSyncedBalance(menusafeQuery.data.balance);
    }
  }, [menusafeQuery.data]);

  const displayBalance = syncedBalance ?? user?.balance ?? 0;
  const displayPoints = user?.points ?? 0;
  const effectiveTier = user ? getTierFromBalance(displayBalance) : 'silver';
  const cardTheme = useMemo(() => getVipCardTheme(effectiveTier), [effectiveTier]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getTierIcon = () => {
    switch (effectiveTier) {
      case 'blackGold': return <Crown size={14} color={cardTheme.accent} />;
      case 'diamond': return <Sparkles size={14} color={cardTheme.accent} />;
      case 'platinum': return <Star size={14} color={cardTheme.accent} />;
      default: return null;
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
        paddingwidth: 10,
        paddingheight: 10,
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
        height: 14,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 10,
        paddingheight: 10,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberCode, refreshKey]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.backdrop} />

        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        <TouchableOpacity
          style={styles.closeOverlay}
          activeOpacity={1}
          onPress={() => router.back()}
        />

        <View style={[styles.topBar, { top: insets.top + 16 }]}>
          <LanguageToggle />
          <TouchableOpacity
            style={styles.closePill}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <X size={18} color={Colors.text} />
            <Text style={styles.closePillText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>{t('memberCode.pleaseLoginFirst')}</Text>
            <Text style={styles.errorSubtitle}>{t('memberCode.loginHint')}</Text>
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginButton}>
              <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
            </TouchableOpacity>
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
      <View style={styles.backdrop} />
      
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.98)']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity 
        style={styles.closeOverlay} 
        activeOpacity={1} 
        onPress={() => router.back()}
      />

      <View style={[styles.topBar, { top: insets.top + 16 }]}>
        <LanguageToggle />
        <TouchableOpacity
          style={styles.closePill}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <X size={18} color={Colors.text} />
          <Text style={styles.closePillText}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('memberCode.title')}</Text>

        <View style={styles.cardContainer}>
          <Animated.View style={[styles.cardGlow, { 
            opacity: glowOpacity,
            shadowColor: cardTheme.glowColor,
            backgroundColor: cardTheme.glowColor,
          }]} />
          
          <LinearGradient
            colors={cardTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor: cardTheme.borderColor }]}
          >
            <LinearGradient
              colors={cardTheme.overlayGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardOverlay}
            />

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
              <View style={styles.userInfo}>
                <LinearGradient
                  colors={cardTheme.chipGradient}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                </LinearGradient>
                <View>
                  <Text style={[styles.userName, { color: cardTheme.text }]}>{user.name}</Text>
                  <View style={styles.tierBadgeContainer}>
                    <LinearGradient
                      colors={cardTheme.tierBadgeGradient}
                      style={styles.tierBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {getTierIcon()}
                      <Text style={styles.tierBadgeText}>{t(`tier.${effectiveTier}`)}</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.codeContainer}>
              <View style={styles.qrCodeWrapper}>
                {qrSvg ? (
                  <SvgXml
                    key={`qr-${refreshKey}`}
                    xml={qrSvg}
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : (
                  <View style={styles.codeError}>
                    <Text style={styles.codeErrorText}>{t('code.qrFailed')}</Text>
                  </View>
                )}
              </View>

              <View style={styles.barcodeWrapper}>
                {barcodeSvg ? (
                  <SvgXml
                    key={`bar-${refreshKey}`}
                    xml={barcodeSvg}
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : (
                  <View style={styles.codeError}>
                    <Text style={styles.codeErrorText}>{t('code.barcodeFailed')}</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.memberIdRow}
              onPress={copyToClipboard}
              activeOpacity={0.7}
            >
              <Text style={[styles.memberIdLabel, { color: cardTheme.textMuted }]}>{t('memberCode.memberCardNo')}</Text>
              <View style={[styles.memberIdValueContainer, { 
                backgroundColor: cardTheme.qrBackground,
                borderColor: cardTheme.borderColor,
              }]}>
                <Text style={[styles.memberIdValue, { color: cardTheme.text }]}>{memberCode}</Text>
                {copied ? (
                  <Check size={16} color={Colors.success} style={styles.copyIcon} />
                ) : (
                  <Copy size={16} color={cardTheme.textMuted} style={styles.copyIcon} />
                )}
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: cardTheme.decorationBorder }]} />

            <View style={styles.tipsContainer}>
              <Text style={[styles.tipsText, { color: cardTheme.textMuted }]}>{t('memberCode.showToCashier')}</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <RefreshCw size={14} color={cardTheme.accent} />
                <Text style={[styles.refreshText, { color: cardTheme.accent }]}>{t('common.refresh')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardDecoration}>
              <View style={[styles.decorCircle, styles.decorCircle1, { borderColor: cardTheme.decorationBorder }]} />
              <View style={[styles.decorCircle, styles.decorCircle2, { borderColor: cardTheme.decorationBorder }]} />
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity 
          style={styles.walletButton}
          onPress={handleAddToWallet}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#000000', '#1a1a1a']}
            style={styles.walletButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Wallet size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.walletButtonText}>{t('memberCode.addToWallet')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.balanceCard}>
          {menusafeQuery.isFetching && (
            <View style={styles.syncingOverlay}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.syncingText}>{t('common.syncing')}</Text>
            </View>
          )}
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>{t('memberCode.balance')}</Text>
            <Text style={styles.balanceValue}>
              ${displayBalance.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>{t('memberCode.points')}</Text>
            <View style={styles.pointsRow}>
              <Sparkles size={14} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.balanceValue, { color: Colors.primary }]}>
                {displayPoints.toLocaleString(numberLocale)}
              </Text>
            </View>
          </View>
        </View>

        {menusafeQuery.isError && (
          <View style={styles.syncErrorBanner}>
            <AlertCircle size={14} color={Colors.warning} />
            <Text style={styles.syncErrorText}>
              {t('memberCode.syncError')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  closeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  closePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  closePillText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  cardContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: -8,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  card: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  shimmer: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    bottom: -50,
    width: width * 0.5,
  },
  cardHeader: {
    marginBottom: 20,
    zIndex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  tierBadgeContainer: {
    alignSelf: 'flex-start',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  codeContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  qrCodeWrapper: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  codeError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
  },
  codeErrorText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  barcodeWrapper: {
    width: '100%',
    height: 70,
  },
  memberIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    zIndex: 1,
  },
  memberIdLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  memberIdValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  memberIdValue: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginRight: 8,
    letterSpacing: 1.5,
    fontWeight: '600' as const,
  },
  copyIcon: {
    opacity: 0.7,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 16,
    zIndex: 1,
  },
  tipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  tipsText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
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
    borderRadius: 150,
    borderWidth: 1,
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -60,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -50,
  },
  walletButton: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  walletButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'black',
  },
  walletButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  balanceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
  },
  balanceLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  syncingText: {
    color: Colors.text,
    fontSize: 12,
  },
  syncErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  syncErrorText: {
    color: Colors.warning,
    fontSize: 12,
  },
  errorContainer: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  loginButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: Colors.background,
    fontWeight: '700' as const,
  },
});
