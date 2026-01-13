import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronLeft, Copy, Lock } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import * as bwipjs from 'bwip-js/generic';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useCoupons } from '@/contexts/CouponsContext';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';
import { CouponStatus, User } from '@/types';

const TIER_ORDER: readonly User['tier'][] = ['silver', 'gold', 'platinum', 'diamond'];
function isTierAtLeast(userTier: User['tier'], requiredTier: User['tier']) {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

export default function CouponDetailScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getCoupon, claimCoupon, markCouponUsed } = useCoupons();
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { definition, state } = useMemo(() => {
    if (!id) return { definition: null, state: null };
    return getCoupon(id);
  }, [id, getCoupon]);

  const qrSvg = useMemo(() => {
    if (!definition?.code) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'qrcode',
        text: definition.code,
        scale: 4,
        includetext: false,
        backgroundcolor: 'FFFFFF',
        paddingwidth: 10,
        paddingheight: 10,
      });
    } catch {
      return null;
    }
  }, [definition?.code]);

  const barcodeSvg = useMemo(() => {
    if (!definition?.code) return null;
    try {
      return bwipjs.toSVG({
        bcid: 'code128',
        text: definition.code,
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
  }, [definition?.code]);

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('couponDetail.title')}</Text>
          </View>
          <View style={styles.notFoundBox}>
            <Text style={styles.notFoundText}>{t('memberCode.pleaseLoginFirst')}</Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { marginTop: 20, width: '100%' }]}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.primaryButtonText}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!id) return null;

  if (!definition) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
          <View style={styles.languageRow}>
            <LanguageToggle />
          </View>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('couponDetail.title')}</Text>
          </View>
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

  const isUnlocked = isTierAtLeast(user.tier, definition.tier);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(definition.code);
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

  const canRedeem = status === 'available';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.languageRow}>
          <LanguageToggle />
        </View>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('couponDetail.title')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.couponTitle}>{definition.title}</Text>
              <Text style={styles.couponDesc}>{definition.description}</Text>
            </View>
            {status !== 'available' && (
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {t('coupons.validTo', { date: definition.validTo })}
            </Text>
            {definition.minSpendText ? (
              <Text style={styles.metaText}>{definition.minSpendText}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.codeCard}>
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
              <Text style={styles.codeValue}>{definition.code}</Text>
              {copied ? (
                <Check size={16} color={Colors.success} />
              ) : (
                <Copy size={16} color={Colors.textMuted} />
              )}
            </View>
          </TouchableOpacity>

          {status === 'unclaimed' && !isUnlocked && (
            <View style={styles.lockRow}>
              <Lock size={16} color={Colors.textMuted} />
              <Text style={styles.lockText}>
                {t('coupons.requiresTier', { tier: t(`tier.${definition.tier}`) })}
              </Text>
            </View>
          )}
        </View>

        {status === 'unclaimed' ? (
          <TouchableOpacity
            style={[styles.primaryButton, !isUnlocked && styles.primaryButtonDisabled]}
            disabled={!isUnlocked}
            onPress={() => claimCoupon(definition.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isUnlocked ? t('coupons.claim') : t('coupons.locked')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, !canRedeem && styles.primaryButtonDisabled]}
            disabled={!canRedeem}
            onPress={() => markCouponUsed(definition.id)}
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
  languageRow: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
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
});
