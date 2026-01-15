import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, RefreshCw, Copy, Check, Wallet, AlertCircle } from 'lucide-react-native';
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

// const CODE_SIZE = width * 0.6;

export default function MemberCodeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncedBalance, setSyncedBalance] = useState<number | null>(null);

  const memberCode = useMemo(() => (user?.memberId ?? '').trim(), [user?.memberId]);

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

  // If no user, we shouldn't really be here, but handle it gracefully
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
      // In production, this URL points to your actual backend
      // e.g. https://api.rork.com/api/pass/VIP123
      const passUrl = `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000'}/api/pass/${memberCode}`;
      
      const supported = await Linking.canOpenURL(passUrl);
      if (supported) {
        await Linking.openURL(passUrl);
      } else {
        // Fallback or explain
        Alert.alert(t('memberCode.walletPassTitle'), t('memberCode.walletOpenFail'));
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('memberCode.walletAddFail'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with blur effect simulation */}
      <View style={styles.backdrop} />
      
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Close button area - tapping outside could close */}
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

        <View style={styles.card}>
          <LinearGradient
            colors={[Colors.surface, Colors.surfaceLight]}
            style={styles.cardGradient}
          >
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userTier}>{t(`tier.${effectiveTier}`)}</Text>
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
              <Text style={styles.memberIdLabel}>{t('memberCode.memberCardNo')}</Text>
              <View style={styles.memberIdValueContainer}>
                <Text style={styles.memberIdValue}>{memberCode}</Text>
                {copied ? (
                  <Check size={16} color={Colors.success} style={styles.copyIcon} />
                ) : (
                  <Copy size={16} color={Colors.textMuted} style={styles.copyIcon} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsText}>{t('memberCode.showToCashier')}</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <RefreshCw size={14} color={Colors.primary} />
                <Text style={styles.refreshText}>{t('common.refresh')}</Text>
              </TouchableOpacity>
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

          </LinearGradient>
        </View>

        <View style={styles.balanceCard}>
          {menusafeQuery.isFetching && (
            <View style={styles.syncingOverlay}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.syncingText}>{t('common.syncing')}</Text>
            </View>
          )}
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>{t('memberCode.balance')}</Text>
            <Text style={styles.balanceValue}>${displayBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>{t('memberCode.points')}</Text>
            <Text style={[styles.balanceValue, { color: Colors.primary }]}>
              {displayPoints}
            </Text>
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
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 24,
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
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.background,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  userTier: {
    fontSize: 12,
    color: Colors.primary,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  qrCode: {
    width: '100%',
    height: '100%',
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
    fontWeight: '600',
  },
  barcodeWrapper: {
    width: '100%',
    height: 84,
  },
  barcode: {
    width: '100%',
    height: '100%',
  },
  memberIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  memberIdLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  memberIdValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberIdValue: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.text,
    marginRight: 8,
    letterSpacing: 1,
  },
  copyIcon: {
    opacity: 0.7,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  tipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tipsText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    color: Colors.primary,
  },
  walletButton: {
    marginTop: 20,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  walletButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'black',
  },
  walletButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
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
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
});
