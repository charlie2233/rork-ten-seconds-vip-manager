import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, ChevronRight, ChevronUp, Lock, Ticket, Wallet } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCoupons } from '@/contexts/CouponsContext';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';
import ImageCarousel from '@/components/ImageCarousel';
import { tierInfo } from '@/mocks/data';
import Colors from '@/constants/colors';
import { CouponStatus, User } from '@/types';
import { getTierFromBalance } from '@/lib/tier';

type SegmentKey = CouponStatus;

const COUPON_BANNERS = [
  { key: 'classic', source: require('../../banners/banner-classic.jpg') },
  { key: 'spicy', source: require('../../banners/banner-spicy.jpg') },
  { key: 'golden', source: require('../../banners/banner-golden.jpg') },
];

const MAX_VISIBLE_COUPONS = 3;

const SEGMENTS: { key: SegmentKey; labelKey: string }[] = [
  { key: 'available', labelKey: 'coupons.segment.available' },
  { key: 'used', labelKey: 'coupons.segment.used' },
  { key: 'expired', labelKey: 'coupons.segment.expired' },
];

function formatTierKey(tier: User['tier']) {
  return `tier.${tier}`;
}

export default function CouponsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { claimedCoupons, offers, claimCoupon } = useCoupons();
  const { t } = useI18n();
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('available');
  const [isExpanded, setIsExpanded] = useState(false);

  const availablePoints = user?.points ?? 0;

  useEffect(() => {
    setIsExpanded(false);
  }, [activeSegment]);

  const effectiveTier = user ? getTierFromBalance(user.balance) : 'silver';
  const currentTier = tierInfo[effectiveTier];

  const segmentedCoupons = useMemo(() => {
    return claimedCoupons.filter((c) => {
      const effective: CouponStatus =
        c.state.status === 'used' ? 'used' : c.isExpired ? 'expired' : 'available';
      return effective === activeSegment;
    });
  }, [activeSegment, claimedCoupons]);

  const hasMoreCoupons = segmentedCoupons.length > MAX_VISIBLE_COUPONS;
  const visibleCoupons = isExpanded ? segmentedCoupons : segmentedCoupons.slice(0, MAX_VISIBLE_COUPONS);
  const remainingCount = Math.max(0, segmentedCoupons.length - MAX_VISIBLE_COUPONS);

  const emptyKey =
    activeSegment === 'available'
      ? 'coupons.empty.available'
      : activeSegment === 'used'
        ? 'coupons.empty.used'
        : 'coupons.empty.expired';

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

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{t('coupons.title')}</Text>
            <TouchableOpacity 
              style={styles.rechargeButton}
              onPress={() => router.push('/recharge')}
              activeOpacity={0.7}
            >
              <Wallet size={16} color={Colors.primary} />
              <Text style={styles.rechargeButtonText}>{t('home.action.recharge')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tierRow}>
            <View style={styles.tierBadge}>
              <Text style={[styles.tierText, { color: currentTier.color }]}>
                {t(formatTierKey(effectiveTier))}
              </Text>
            </View>
            {user ? (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeLabel}>{t('home.points')}</Text>
                <Text style={styles.pointsBadgeValue}>{availablePoints.toLocaleString()}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <ImageCarousel images={COUPON_BANNERS} height={170} style={styles.bannerCarousel} />

        <View style={styles.segmentContainer}>
          {SEGMENTS.map((segment) => {
            const isActive = activeSegment === segment.key;
            return (
              <TouchableOpacity
                key={segment.key}
                style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                onPress={() => setActiveSegment(segment.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {t(segment.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.couponList}>
          {segmentedCoupons.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t(emptyKey)}</Text>
            </View>
          ) : (
            <>
              {visibleCoupons.map(({ definition, state, isExpired }) => {
                const status: CouponStatus =
                  state.status === 'used' ? 'used' : isExpired ? 'expired' : 'available';
                const statusLabel =
                  status === 'used'
                    ? t('couponDetail.used')
                    : status === 'expired'
                      ? t('couponDetail.expired')
                      : '';

                return (
                  <TouchableOpacity
                    key={definition.id}
                    style={styles.couponCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/coupon/${definition.id}`)}
                  >
                    <View style={styles.couponLeft}>
                      <View
                        style={[
                          styles.couponValueBox,
                          { backgroundColor: `${definition.themeColor ?? Colors.primary}22` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.couponValue,
                            { color: definition.themeColor ?? Colors.primary },
                          ]}
                        >
                          {t(definition.discountText)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.couponContent}>
                      <View style={styles.couponHeader}>
                        <Text style={styles.couponTitle} numberOfLines={1}>
                          {t(definition.title)}
                        </Text>
                        {status !== 'available' && (
                          <View style={styles.statusPill}>
                            <Text style={styles.statusText}>{statusLabel}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.couponDesc} numberOfLines={2}>
                        {t(definition.description)}
                      </Text>
                      <View style={styles.couponMetaRow}>
                        <Text style={styles.couponMetaText}>
                          {t('coupons.validTo', { date: definition.validTo })}
                        </Text>
                        <ChevronRight size={18} color={Colors.textMuted} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {hasMoreCoupons ? (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setIsExpanded((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.expandText}>
                    {isExpanded
                      ? t('coupons.showLess')
                      : t('coupons.showMore', { count: remainingCount })}
                  </Text>
                  {isExpanded ? (
                    <ChevronUp size={18} color={Colors.textSecondary} />
                  ) : (
                    <ChevronDown size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>

        {offers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.sectionTitle}>{t('coupons.section.offers')}</Text>

            {offers.map(({ definition, isUnlocked }) => (
              <View key={definition.id} style={styles.offerCard}>
                <View style={styles.offerLeft}>
                  <Ticket size={20} color={definition.themeColor ?? Colors.primary} />
                  <View style={styles.offerTextBlock}>
                    <Text style={styles.offerTitle} numberOfLines={1}>
                      {t(definition.title)}
                    </Text>
                    <Text style={styles.offerDesc} numberOfLines={1}>
                      {t(definition.minSpendText ?? definition.description)}
                    </Text>
                  </View>
                </View>

                {isUnlocked ? (() => {
                  const cost = Math.max(0, Math.floor(definition.costPoints ?? 0));
                  const missing = Math.max(0, cost - availablePoints);
                  const canAfford = cost === 0 || missing === 0;
                  const buttonLabel = !canAfford
                    ? t('coupons.needMorePoints', { count: missing })
                    : cost > 0
                      ? t('coupons.redeemForPoints', { points: cost })
                      : t('coupons.claim');

                  return (
                    <TouchableOpacity
                      style={[styles.claimButton, !canAfford && styles.claimButtonDisabled]}
                      disabled={!canAfford}
                      onPress={() => void claimCoupon(definition.id)}
                      activeOpacity={0.8}
                    >
                      {canAfford ? (
                        <Check size={16} color={Colors.background} />
                      ) : (
                        <Lock size={14} color={Colors.textMuted} />
                      )}
                      <Text style={[styles.claimText, !canAfford && styles.claimTextDisabled]}>
                        {buttonLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })() : (
                  <View style={styles.lockedBadge}>
                    <Lock size={14} color={Colors.textMuted} />
                    <Text style={styles.lockedText}>
                      {t('coupons.requiresTier', { tier: t(formatTierKey(definition.tier)) })}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

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
  header: {
    marginBottom: 20,
  },
  bannerCarousel: {
    marginBottom: 18,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
  },
  rechargeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pointsBadgeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  pointsBadgeValue: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '800' as const,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.background,
    fontWeight: '600' as const,
  },
  couponList: {
    marginBottom: 16,
  },
  expandButton: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  couponLeft: {
    width: 72,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponValueBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  couponContent: {
    flex: 1,
  },
  couponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  couponTitle: {
    flex: 1,
    marginRight: 10,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  couponDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  couponMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponMetaText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  offersSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  offerTextBlock: {
    marginLeft: 10,
    flex: 1,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  offerDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
  },
  claimButtonDisabled: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  claimText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  claimTextDisabled: {
    color: Colors.textMuted,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockedText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
