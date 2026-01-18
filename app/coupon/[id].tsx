import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Check, Copy, Lock, Sparkles } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import * as bwipjs from 'bwip-js/generic';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useCoupons } from '@/contexts/CouponsContext';
import { useI18n } from '@/contexts/I18nContext';
import AuthGateCard from '@/components/AuthGateCard';
import TopBar from '@/components/TopBar';
import { CouponStatus } from '@/types';
import { getTierFromBalance, isTierAtLeast } from '@/lib/tier';
import { formatShortDateTime } from '@/lib/datetime';
import { useSettings } from '@/contexts/SettingsContext';

export default function CouponDetailScreen() {
  const { user } = useAuth();
  const { getCoupon, claimCoupon, markCouponUsed } = useCoupons();
  const { t, locale } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();
  const { id, claim } = useLocalSearchParams<{ id: string; claim?: string }>();
  const [copied, setCopied] = useState(false);
  const [toastType, setToastType] = useState<'redeemed' | 'claimed' | null>(null);
  const [toastSeconds, setToastSeconds] = useState(0);

  useEffect(() => {
    if (!toastType || toastSeconds <= 0) return;
    const timer = setInterval(() => {
      setToastSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [toastSeconds, toastType]);

  useEffect(() => {
    if (!toastType || toastSeconds !== 0) return;
    setToastType(null);
  }, [toastSeconds, toastType]);

  const { definition, state } = useMemo(() => {
    const couponId = Array.isArray(id) ? id[0] : id;
    const claimId = Array.isArray(claim) ? claim[0] : claim;
    if (!couponId) return { definition: null, state: null };
    return getCoupon(couponId, claimId);
  }, [claim, getCoupon, id]);

  const redeemCode = (() => {
    if (!definition || !state) return null;
    if (state.status !== 'available') return null;
    const expiresAt = new Date(definition.validTo);
    const isExpired =
      Number.isFinite(expiresAt.valueOf()) && new Date().valueOf() > expiresAt.valueOf();
    if (isExpired) return null;
    return state.id;
  })();

  const qrSvg = useMemo(() => {
    if (!redeemCode) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'qrcode',
        text: redeemCode,
        scale: 4,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 10,
        paddingheight: 10,
      });
    } catch {
      return null;
    }
  }, [redeemCode]);

  const barcodeSvg = useMemo(() => {
    if (!redeemCode) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'code128',
        text: redeemCode,
        scale: 3,
        height: 10,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 10,
        paddingheight: 10,
      });
    } catch {
      return null;
    }
  }, [redeemCode]);

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
        <TopBar title={t('couponDetail.title')} leftAction="back" />
        <View style={styles.content}>
          <AuthGateCard
            title={t('memberCode.pleaseLoginFirst')}
            message={t('coupons.loginRequired.message')}
            style={{ marginTop: 40 }}
          />
        </View>
      </View>
    );
  }

  if (!id) return null;

  if (!definition) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={backgroundGradient}
          style={StyleSheet.absoluteFill}
        />
        <TopBar title={t('couponDetail.title')} leftAction="back" />
        <View style={styles.content}>
          <View style={styles.notFoundBox}>
            <Text style={styles.notFoundText}>{t('notFound.message')}</Text>
          </View>
        </View>
      </View>
    );
  }

  const now = new Date();
  const expiresAt = new Date(definition.validTo);
  const isExpired = Number.isFinite(expiresAt.valueOf()) && now > expiresAt;
  const status: CouponStatus | 'unclaimed' =
    state?.status === 'used' ? 'used' : isExpired ? 'expired' : state ? 'available' : 'unclaimed';

  const effectiveTier = getTierFromBalance(user.balance);
  const isUnlocked = isTierAtLeast(effectiveTier, definition.tier);
  const costPoints = Math.max(0, Math.floor(definition.costPoints ?? 0));
  const availablePoints = user.points ?? 0;
  const missingPoints = Math.max(0, costPoints - availablePoints);
  const canAfford = costPoints === 0 || missingPoints === 0;

  const copyToClipboard = async () => {
    if (!redeemCode) return;
    await Clipboard.setStringAsync(redeemCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const statusLabel =
    status === 'used'
      ? t('couponDetail.used')
      : status === 'expired'
        ? t('couponDetail.expired')
        : status === 'unclaimed'
          ? t('couponDetail.notClaimed')
          : '';

  const usedAtLabel =
    status === 'used' && state?.usedAt ? formatShortDateTime(state.usedAt, locale) : '';
  const statusLabelWithTime =
    status === 'used' && usedAtLabel ? `${statusLabel} · ${usedAtLabel}` : statusLabel;

  const canRedeem = status === 'available' && !!redeemCode;

  const lockedHint =
    status === 'used'
      ? t('couponDetail.usedHint')
      : status === 'expired'
        ? t('couponDetail.expiredHint')
        : status === 'unclaimed'
          ? !isUnlocked
            ? t('coupons.requiresTier', { tier: t(`tier.${definition.tier}`) })
            : !canAfford && costPoints > 0
              ? t('coupons.needMorePoints', { count: missingPoints })
              : t('couponDetail.claimToGetCode')
          : '';

  const claimNow = async () => {
    await claimCoupon(definition.id);
    setToastType('claimed');
    setToastSeconds(2);
  };

  const redeemNow = async () => {
    if (!state) return;
    await markCouponUsed(state.id);
    setToastType('redeemed');
    setToastSeconds(3);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('couponDetail.title')} leftAction="back" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleBlock}>
              <Text style={[styles.couponTitle, { fontSize: 18 * fontScale }]}>{t(definition.title)}</Text>
              <Text style={styles.couponDesc}>{t(definition.description)}</Text>
            </View>
            {status !== 'available' && (
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{statusLabelWithTime}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {t('coupons.validTo', { date: definition.validTo })}
            </Text>
            {definition.minSpendText ? (
              <Text style={styles.metaText}>{t(definition.minSpendText)}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.codeCard}>
          {canRedeem ? (
            <>
              <Text style={styles.hintText}>{t('couponDetail.redeemHint')}</Text>

              <View style={styles.qrBox}>
                {qrSvg ? (
                  <SvgXml xml={qrSvg} width="100%" height="100%" />
                ) : (
                  <View style={styles.codeError}>
                    <Text style={styles.codeErrorText}>{t('code.qrFailed')}</Text>
                  </View>
                )}
              </View>

              <View style={styles.barcodeBox}>
                {barcodeSvg ? (
                  <SvgXml xml={barcodeSvg} width="100%" height="100%" />
                ) : (
                  <View style={styles.codeError}>
                    <Text style={styles.codeErrorText}>{t('code.barcodeFailed')}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.codeRow} onPress={copyToClipboard} activeOpacity={0.7}>
                <Text style={styles.codeLabel}>{t('couponDetail.codeLabel')}</Text>
                <View style={styles.codeValueContainer}>
                  <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode="middle">
                    {redeemCode ?? ''}
                  </Text>
                  {copied ? (
                    <Check size={16} color={Colors.success} />
                  ) : (
                    <Copy size={16} color={Colors.textMuted} />
                  )}
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.codeLockedBox}>
              <View style={styles.codeLockedIcon}>
                <Lock size={18} color={Colors.textMuted} />
              </View>
              <Text style={styles.codeLockedTitle}>{statusLabelWithTime}</Text>
              <Text style={styles.codeLockedText}>{lockedHint}</Text>
            </View>
          )}

          {status === 'unclaimed' && !isUnlocked && (
            <View style={styles.lockRow}>
              <Lock size={16} color={Colors.textMuted} />
              <Text style={styles.lockText}>
                {t('coupons.requiresTier', { tier: t(`tier.${definition.tier}`) })}
              </Text>
            </View>
          )}

          {status === 'unclaimed' && isUnlocked && !canAfford && costPoints > 0 && (
            <View style={styles.lockRow}>
              <Lock size={16} color={Colors.textMuted} />
              <Text style={styles.lockText}>
                {t('coupons.needMorePoints', { count: missingPoints })}
              </Text>
            </View>
          )}
        </View>

	        {status === 'unclaimed' ? (
	          <TouchableOpacity
	            style={[
	              styles.primaryButton,
	              (!isUnlocked || !canAfford) && styles.primaryButtonDisabled,
	            ]}
	            disabled={!isUnlocked || !canAfford}
	            onPress={() => void claimNow()}
	            activeOpacity={0.8}
	          >
	            <Text style={styles.primaryButtonText}>
	              {!isUnlocked
	                ? t('coupons.locked')
                : !canAfford
                  ? t('coupons.needMorePoints', { count: missingPoints })
                  : costPoints > 0
                    ? t('coupons.redeemForPoints', { points: costPoints })
                    : t('coupons.claim')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, !canRedeem && styles.primaryButtonDisabled]}
            disabled={!canRedeem}
            onPress={() => void redeemNow()}
            activeOpacity={0.8}
          >
            {canRedeem ? (
              <Text style={styles.primaryButtonText}>{t('couponDetail.markUsed')}</Text>
            ) : (
              <Text style={styles.primaryButtonText}>{statusLabel}</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={!!toastType && toastSeconds > 0}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setToastType(null);
          setToastSeconds(0);
        }}
      >
        <View style={styles.redeemedOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setToastType(null);
              setToastSeconds(0);
            }}
          />
          <View style={styles.redeemedCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.redeemedIcon}
            >
              <Sparkles size={26} color={Colors.background} />
            </LinearGradient>
            <Text style={styles.redeemedTitle}>
              {toastType === 'redeemed' ? t('couponDetail.redeemedTitle') : t('couponDetail.claimedTitle')}
            </Text>
            <Text style={styles.redeemedSubtitle}>
              {toastType === 'redeemed'
                ? t('couponDetail.redeemedMessage')
                : t('couponDetail.claimedMessage', { coupon: t(definition.title) })}
            </Text>
            <Text style={styles.redeemedCountdown}>
              {t('common.closingIn', { seconds: String(toastSeconds) })}
            </Text>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 24,
  },
  notFoundBox: {
    marginTop: 40,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  notFoundText: {
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  couponDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  codeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  hintText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  codeLockedBox: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  codeLockedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLockedTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800' as const,
  },
  codeLockedText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  qrBox: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barcodeBox: {
    width: '100%',
    height: 70,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  codeError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeErrorText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  codeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  codeValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  lockText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  redeemedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  redeemedCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  redeemedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  redeemedTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  redeemedSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  redeemedCountdown: {
    marginTop: 12,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
