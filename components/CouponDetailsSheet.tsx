import { LinearGradient } from 'expo-linear-gradient';
import { Check, Copy, Lock, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import * as bwipjs from 'bwip-js/generic';
import Colors from '@/constants/colors';
import AuthGateCard from '@/components/AuthGateCard';
import { useAuth } from '@/contexts/AuthContext';
import { useCoupons } from '@/contexts/CouponsContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatShortDateTime } from '@/lib/datetime';
import { getTierFromBalance, isTierAtLeast } from '@/lib/tier';
import type { CouponStatus } from '@/types';

type Props = {
  visible: boolean;
  couponId: string | null;
  couponInstanceId?: string | null;
  onClose: () => void;
};

type ToastType = 'redeemed' | 'claimed';

export default function CouponDetailsSheet({
  visible,
  couponId,
  couponInstanceId,
  onClose,
}: Props) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { getCoupon, claimCoupon, markCouponUsed } = useCoupons();
  const [copied, setCopied] = useState(false);
  const [toastType, setToastType] = useState<ToastType | null>(null);
  const [toastSeconds, setToastSeconds] = useState(0);

  useEffect(() => {
    if (!visible) {
      setCopied(false);
      setToastType(null);
      setToastSeconds(0);
      return;
    }
  }, [visible]);

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
    if (toastType === 'redeemed') onClose();
  }, [onClose, toastSeconds, toastType]);

  const { definition, state } = useMemo(() => {
    if (!couponId) return { definition: null, state: null };
    return getCoupon(couponId, couponInstanceId);
  }, [couponId, couponInstanceId, getCoupon]);

  const computed = useMemo(() => {
    if (!definition) {
      return {
        status: 'unclaimed' as const,
        redeemCode: null as string | null,
        isExpired: false,
        statusLabel: '',
        statusLabelWithTime: '',
        lockedHint: '',
        canRedeem: false,
        canClaim: false,
        claimDisabledReason: null as string | null,
        costPoints: 0,
        missingPoints: 0,
      };
    }

    const now = new Date();
    const expiresAt = new Date(definition.validTo);
    const isExpired = Number.isFinite(expiresAt.valueOf()) && now > expiresAt;
    const status: CouponStatus | 'unclaimed' =
      state?.status === 'used' ? 'used' : isExpired ? 'expired' : state ? 'available' : 'unclaimed';

    const redeemCode =
      status === 'available' && state ? state.id : null;

    const effectiveTier = user ? getTierFromBalance(user.balance) : 'silver';
    const isUnlocked = !!user && isTierAtLeast(effectiveTier, definition.tier);
    const costPoints = Math.max(0, Math.floor(definition.costPoints ?? 0));
    const availablePoints = user?.points ?? 0;
    const missingPoints = Math.max(0, costPoints - availablePoints);
    const canAfford = costPoints === 0 || missingPoints === 0;
    const canClaim = status === 'unclaimed' && isUnlocked && canAfford;

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
            ? !user
              ? t('coupons.loginRequired.message')
              : !isUnlocked
                ? t('coupons.requiresTier', { tier: t(`tier.${definition.tier}`) })
                : !canAfford && costPoints > 0
                  ? t('coupons.needMorePoints', { count: missingPoints })
                  : t('couponDetail.claimToGetCode')
            : '';

    const claimDisabledReason =
      status !== 'unclaimed'
        ? null
        : !user
          ? t('coupons.loginRequired.title')
          : !isUnlocked
            ? t('coupons.requiresTier', { tier: t(`tier.${definition.tier}`) })
            : !canAfford && costPoints > 0
              ? t('coupons.needMorePoints', { count: missingPoints })
              : null;

    return {
      status,
      redeemCode,
      isExpired,
      statusLabel,
      statusLabelWithTime,
      lockedHint,
      canRedeem,
      canClaim,
      claimDisabledReason,
      costPoints,
      missingPoints,
    };
  }, [definition, locale, state, t, user]);

  const qrSvg = useMemo(() => {
    if (!computed.redeemCode) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'qrcode',
        text: computed.redeemCode,
        scale: 4,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 8,
        paddingheight: 8,
      });
    } catch {
      return null;
    }
  }, [computed.redeemCode]);

  const barcodeSvg = useMemo(() => {
    if (!computed.redeemCode) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'code128',
        text: computed.redeemCode,
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
  }, [computed.redeemCode]);

  const copyToClipboard = async () => {
    if (!computed.redeemCode) return;
    await Clipboard.setStringAsync(computed.redeemCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const claimNow = async () => {
    if (!definition) return;
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

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('couponDetail.title')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <X size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {!couponId ? (
              <View style={styles.missingBox}>
                <Text style={styles.missingText}>{t('notFound.message')}</Text>
              </View>
            ) : !user ? (
              <AuthGateCard
                title={t('coupons.loginRequired.title')}
                message={t('coupons.loginRequired.message')}
              />
            ) : !definition ? (
              <View style={styles.missingBox}>
                <Text style={styles.missingText}>{t('notFound.message')}</Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryTopRow}>
                    <View style={styles.summaryLeft}>
                      <View
                        style={[
                          styles.valueBox,
                          { backgroundColor: `${definition.themeColor ?? Colors.primary}22` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.valueText,
                            { color: definition.themeColor ?? Colors.primary },
                          ]}
                        >
                          {t(definition.discountText)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.summaryRight}>
                      <Text style={styles.couponTitle} numberOfLines={2}>
                        {t(definition.title)}
                      </Text>
                      <Text style={styles.couponDesc} numberOfLines={2}>
                        {t(definition.description)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{t('coupons.validTo', { date: definition.validTo })}</Text>
                    {definition.minSpendText ? (
                      <Text style={styles.metaText}>{t(definition.minSpendText)}</Text>
                    ) : null}
                  </View>

                  {computed.status !== 'available' ? (
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{computed.statusLabelWithTime}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.codeCard}>
                  {computed.canRedeem ? (
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

                      <TouchableOpacity
                        style={styles.codeRow}
                        onPress={copyToClipboard}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.codeLabel}>{t('couponDetail.codeLabel')}</Text>
                        <View style={styles.codeValueContainer}>
                          <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode="middle">
                            {computed.redeemCode ?? ''}
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
                    <View style={styles.lockedBox}>
                      <View style={styles.lockedIcon}>
                        <Lock size={18} color={Colors.textMuted} />
                      </View>
                      <Text style={styles.lockedTitle}>{computed.statusLabelWithTime}</Text>
                      <Text style={styles.lockedText}>{computed.lockedHint}</Text>
                    </View>
                  )}
                </View>

                {computed.status === 'unclaimed' ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (!computed.canClaim || !!computed.claimDisabledReason) && styles.primaryButtonDisabled,
                    ]}
                    disabled={!computed.canClaim}
                    onPress={() => void claimNow()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>
                      {computed.claimDisabledReason
                        ? computed.claimDisabledReason
                        : computed.costPoints > 0
                          ? t('coupons.redeemForPoints', { points: computed.costPoints })
                          : t('coupons.claim')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryButton, !computed.canRedeem && styles.primaryButtonDisabled]}
                    disabled={!computed.canRedeem}
                    onPress={() => void redeemNow()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>
                      {computed.canRedeem ? t('couponDetail.markUsed') : computed.statusLabel}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!toastType && toastSeconds > 0}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setToastType(null);
          setToastSeconds(0);
        }}
      >
        <View style={styles.toastOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setToastType(null);
              setToastSeconds(0);
            }}
          />
          <View style={styles.toastCard}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.toastIcon}>
              <Sparkles size={26} color={Colors.background} />
            </LinearGradient>
            <Text style={styles.toastTitle}>
              {toastType === 'redeemed' ? t('couponDetail.redeemedTitle') : t('couponDetail.claimedTitle')}
            </Text>
            <Text style={styles.toastSubtitle}>
              {toastType === 'redeemed'
                ? t('couponDetail.redeemedMessage')
                : t('couponDetail.claimedMessage', { coupon: definition ? t(definition.title) : '' })}
            </Text>
            <Text style={styles.toastCountdown}>
              {t('common.closingIn', { seconds: String(toastSeconds) })}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 18,
  },
  sheet: {
    borderRadius: 22,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900' as const,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  missingBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  missingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  summaryLeft: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '900' as const,
  },
  summaryRight: {
    flex: 1,
  },
  couponTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900' as const,
    marginBottom: 6,
  },
  couponDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  codeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 12,
  },
  hintText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  qrBox: {
    width: 190,
    height: 190,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barcodeBox: {
    width: '100%',
    height: 64,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  codeError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeErrorText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  codeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
    maxWidth: 200,
  },
  codeValue: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 1,
    flexShrink: 1,
  },
  lockedBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  lockedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '900' as const,
  },
  lockedText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 16,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '900' as const,
  },
  toastOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  toastCard: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  toastIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  toastTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900' as const,
    marginBottom: 6,
    textAlign: 'center',
  },
  toastSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  toastCountdown: {
    marginTop: 12,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700' as const,
  },
});

