import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronDown, ChevronRight, ChevronUp, Lock, LogIn, Search, Sparkles, Star, Ticket, Wallet } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useCoupons } from '@/contexts/CouponsContext';
import { useI18n } from '@/contexts/I18nContext';
import ImageCarousel from '@/components/ImageCarousel';
import AuthGateCard from '@/components/AuthGateCard';
import ConfettiBurst from '@/components/ConfettiBurst';
import EmptyState from '@/components/EmptyState';
import PressableScale from '@/components/PressableScale';
import Skeleton from '@/components/Skeleton';
import TopBar from '@/components/TopBar';
import BrandBanner from '@/components/BrandBanner';
import CouponDetailsSheet from '@/components/CouponDetailsSheet';
import ContextualHelpChips from '@/components/ContextualHelpChips';
import { tierInfo } from '@/mocks/data';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { CouponStatus, User } from '@/types';
import { getTierFromBalance } from '@/lib/tier';
import { formatShortDateTime } from '@/lib/datetime';
import { useSettings } from '@/contexts/SettingsContext';

type SegmentKey = CouponStatus;
type SortKey = 'default' | 'expiringSoon' | 'newest' | 'recentlyUsed';

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
  const { user } = useAuth();
  const { isLoading: couponsLoading, claimedCoupons, offers, claimCoupon, isFavorite, toggleFavorite } = useCoupons();
  const { t, locale } = useI18n();
  const { backgroundGradient } = useSettings();
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('available');
  const [isExpanded, setIsExpanded] = useState(false);
  const [claimedCouponName, setClaimedCouponName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [unlockedOffersOnly, setUnlockedOffersOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('expiringSoon');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const availablePoints = user?.points ?? 0;

  useEffect(() => {
    setIsExpanded(false);
    setExpiringSoonOnly(false);
    setSortKey(activeSegment === 'used' ? 'recentlyUsed' : 'expiringSoon');
  }, [activeSegment]);

  const effectiveTier = user ? getTierFromBalance(user.balance) : 'silver';
  const currentTier = tierInfo[effectiveTier];

  const segmentedCoupons = useMemo(() => {
    const normalize = (value: string) => value.trim().toLowerCase();
    const query = normalize(searchQuery);
    const now = new Date();
    const soonCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const filtered = claimedCoupons.filter((c) => {
      const effective: CouponStatus =
        c.state.status === 'used' ? 'used' : c.isExpired ? 'expired' : 'available';
      if (effective !== activeSegment) return false;

      if (favoritesOnly && !isFavorite(c.definition.id)) return false;

      if (freeOnly) {
        const cost = Math.max(0, Math.floor(c.definition.costPoints ?? 0));
        if (cost > 0) return false;
      }

      if (query) {
        const title = normalize(t(c.definition.title));
        const desc = normalize(t(c.definition.description));
        if (!title.includes(query) && !desc.includes(query)) return false;
      }

      if (activeSegment === 'available' && expiringSoonOnly) {
        const until = new Date(c.definition.validTo);
        if (!Number.isFinite(until.valueOf())) return false;
        if (until > soonCutoff) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const key = sortKey === 'default' ? (activeSegment === 'used' ? 'recentlyUsed' : 'expiringSoon') : sortKey;

      if (key === 'recentlyUsed') {
        const atA = a.state.usedAt ? Date.parse(a.state.usedAt) : 0;
        const atB = b.state.usedAt ? Date.parse(b.state.usedAt) : 0;
        if (atA !== atB) return atB - atA;
        return Date.parse(b.state.claimedAt) - Date.parse(a.state.claimedAt);
      }

      if (key === 'newest') {
        return Date.parse(b.state.claimedAt) - Date.parse(a.state.claimedAt);
      }

      if (key === 'expiringSoon') {
        const untilA = Date.parse(a.definition.validTo);
        const untilB = Date.parse(b.definition.validTo);
        const safeA = Number.isFinite(untilA) ? untilA : Number.MAX_SAFE_INTEGER;
        const safeB = Number.isFinite(untilB) ? untilB : Number.MAX_SAFE_INTEGER;
        if (safeA !== safeB) return activeSegment === 'expired' ? safeB - safeA : safeA - safeB;
        return Date.parse(b.state.claimedAt) - Date.parse(a.state.claimedAt);
      }

      return 0;
    });

    return sorted;
  }, [activeSegment, claimedCoupons, expiringSoonOnly, favoritesOnly, freeOnly, isFavorite, searchQuery, sortKey, t]);

  const filteredOffers = useMemo(() => {
    const normalize = (value: string) => value.trim().toLowerCase();
    const query = normalize(searchQuery);

    const base = offers.filter(({ definition, isUnlocked }) => {
      if (favoritesOnly && !isFavorite(definition.id)) return false;

      if (freeOnly) {
        const cost = Math.max(0, Math.floor(definition.costPoints ?? 0));
        if (cost > 0) return false;
      }

      if (unlockedOffersOnly && !isUnlocked) return false;

      if (!query) return true;
      const title = normalize(t(definition.title));
      const desc = normalize(t(definition.description));
      const minSpend = normalize(t(definition.minSpendText ?? definition.description));
      return title.includes(query) || desc.includes(query) || minSpend.includes(query);
    });

    const sort = sortKey === 'default' ? 'expiringSoon' : sortKey;
    const effectiveSort = sort === 'recentlyUsed' ? 'expiringSoon' : sort;

    const sorted = [...base].sort((a, b) => {
      if (effectiveSort === 'expiringSoon') {
        const untilA = Date.parse(a.definition.validTo);
        const untilB = Date.parse(b.definition.validTo);
        const safeA = Number.isFinite(untilA) ? untilA : Number.MAX_SAFE_INTEGER;
        const safeB = Number.isFinite(untilB) ? untilB : Number.MAX_SAFE_INTEGER;
        if (safeA !== safeB) return safeA - safeB;
        return a.definition.id.localeCompare(b.definition.id);
      }

      if (effectiveSort === 'newest') {
        const untilA = Date.parse(a.definition.validTo);
        const untilB = Date.parse(b.definition.validTo);
        const safeA = Number.isFinite(untilA) ? untilA : 0;
        const safeB = Number.isFinite(untilB) ? untilB : 0;
        if (safeA !== safeB) return safeB - safeA;
        return a.definition.id.localeCompare(b.definition.id);
      }

      return 0;
    });

    return sorted;
  }, [favoritesOnly, freeOnly, isFavorite, offers, searchQuery, sortKey, t, unlockedOffersOnly]);

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
            title={t('coupons.title')}
            right={
              <TouchableOpacity
                style={styles.rechargeButton}
                onPress={() => router.push('/recharge')}
                activeOpacity={0.7}
              >
                <Wallet size={16} color={Colors.primary} />
                <Text style={styles.rechargeButtonText}>{t('home.action.recharge')}</Text>
              </TouchableOpacity>
            }
            style={{ marginBottom: 10 }}
          />
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

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('coupons.searchPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.sortPill}
            onPress={() => setSortSheetOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.sortText}>{t(`coupons.sort.${sortKey}`)}</Text>
            <ChevronDown size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {!user ? (
          <AuthGateCard
            title={t('coupons.loginRequired.title')}
            message={t('coupons.loginRequired.message')}
            style={{ marginBottom: 18 }}
          />
        ) : null}

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
          <View style={styles.filtersRow}>
            {activeSegment === 'available' ? (
              <TouchableOpacity
                style={[styles.filterChip, expiringSoonOnly && styles.filterChipActive]}
                onPress={() => setExpiringSoonOnly((v) => !v)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text style={[styles.filterChipText, expiringSoonOnly && styles.filterChipTextActive]}>
                  {t('coupons.filter.expiringSoon7')}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.filterChip, favoritesOnly && styles.filterChipActive]}
              onPress={() => setFavoritesOnly((v) => !v)}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Star
                size={14}
                color={favoritesOnly ? Colors.primary : Colors.textMuted}
                fill={favoritesOnly ? Colors.primary : 'transparent'}
              />
              <Text style={[styles.filterChipText, favoritesOnly && styles.filterChipTextActive]}>
                {t('coupons.filter.favorites')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, freeOnly && styles.filterChipActive]}
              onPress={() => setFreeOnly((v) => !v)}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={[styles.filterChipText, freeOnly && styles.filterChipTextActive]}>
                {t('coupons.filter.free')}
              </Text>
            </TouchableOpacity>
          </View>

          {couponsLoading && user ? (
            <>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={`coupon-skeleton-${index}`} style={styles.couponCard}>
                  <View style={styles.couponLeft}>
                    <Skeleton style={{ width: 64, height: 64, borderRadius: 16 }} />
                  </View>
                  <View style={styles.couponContent}>
                    <Skeleton style={{ width: '70%', height: 16, borderRadius: 8, marginBottom: 10 }} />
                    <Skeleton style={{ width: '92%', height: 12, borderRadius: 8, marginBottom: 6 }} />
                    <Skeleton style={{ width: '78%', height: 12, borderRadius: 8, marginBottom: 12 }} />
                    <Skeleton style={{ width: '52%', height: 12, borderRadius: 8 }} />
                  </View>
                </View>
              ))}
            </>
          ) : segmentedCoupons.length === 0 ? (
            <EmptyState title={t(emptyKey)} icon={<Ticket size={20} color={Colors.primary} />} />
          ) : (
            <>
              {visibleCoupons.map(({ definition, state, isExpired }) => {
                const status: CouponStatus =
                  state.status === 'used' ? 'used' : isExpired ? 'expired' : 'available';
                const statusLabel =
                  status === 'used'
                    ? (() => {
                        const usedAt = state.usedAt
                          ? formatShortDateTime(state.usedAt, locale)
                          : '';
                        return usedAt ? `${t('couponDetail.used')} · ${usedAt}` : t('couponDetail.used');
                      })()
                    : status === 'expired'
                      ? `${t('couponDetail.expired')} · ${definition.validTo}`
                      : '';
                const favored = isFavorite(definition.id);

                return (
                  <TouchableOpacity
                    key={state.id}
                    style={styles.couponCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!user) {
                        router.push('/login');
                        return;
                      }
                      setSelectedCouponId(definition.id);
                      setSelectedClaimId(state.id);
                      setDetailsOpen(true);
                    }}
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
                        <View style={styles.couponHeaderRight}>
                          {status !== 'available' ? (
                            <View style={styles.statusPill}>
                              <Text style={styles.statusText}>{statusLabel}</Text>
                            </View>
                          ) : null}
                          <PressableScale
                            containerStyle={[
                              styles.favoriteButton,
                              favored && styles.favoriteButtonActive,
                            ]}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              toggleFavorite(definition.id);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="button"
                            accessibilityLabel={
                              favored ? t('coupons.unfavorite') : t('coupons.favorite')
                            }
                          >
                            <Star
                              size={16}
                              color={favored ? Colors.primary : Colors.textMuted}
                              fill={favored ? Colors.primary : 'transparent'}
                            />
                          </PressableScale>
                        </View>
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

            <View style={styles.offerFiltersRow}>
              <TouchableOpacity
                style={[styles.filterChip, unlockedOffersOnly && styles.filterChipActive]}
                onPress={() => setUnlockedOffersOnly((v) => !v)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text style={[styles.filterChipText, unlockedOffersOnly && styles.filterChipTextActive]}>
                  {t('coupons.filter.unlocked')}
                </Text>
              </TouchableOpacity>
            </View>

            {couponsLoading && user ? (
              <>
                {Array.from({ length: 2 }).map((_, index) => (
                  <View key={`offer-skeleton-${index}`} style={styles.offerCard}>
                    <View style={styles.offerLeft}>
                      <View style={styles.offerIconSkeleton}>
                        <Skeleton style={{ width: 20, height: 20, borderRadius: 6 }} />
                      </View>
                      <View style={styles.offerTextBlock}>
                        <Skeleton style={{ width: '78%', height: 14, borderRadius: 8, marginBottom: 8 }} />
                        <Skeleton style={{ width: '60%', height: 12, borderRadius: 8 }} />
                      </View>
                    </View>
                    <Skeleton style={{ width: 86, height: 32, borderRadius: 16 }} />
                  </View>
                ))}
              </>
            ) : filteredOffers.length === 0 ? (
              <EmptyState
                variant="inline"
                style={styles.offersEmptyState}
                title={t('coupons.empty.offers')}
                icon={<Ticket size={20} color={Colors.primary} />}
              />
            ) : (
              <>
                {filteredOffers.map(({ definition, isUnlocked }) => (
                  <TouchableOpacity
                    key={definition.id}
                    style={styles.offerCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!user) {
                        router.push('/login');
                        return;
                      }
                      setSelectedCouponId(definition.id);
                      setSelectedClaimId(null);
                      setDetailsOpen(true);
                    }}
                  >
                    <PressableScale
                      containerStyle={[
                        styles.offerFavoriteButton,
                        isFavorite(definition.id) && styles.offerFavoriteButtonActive,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        toggleFavorite(definition.id);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isFavorite(definition.id) ? t('coupons.unfavorite') : t('coupons.favorite')
                      }
                    >
                      <Star
                        size={16}
                        color={isFavorite(definition.id) ? Colors.primary : Colors.textMuted}
                        fill={isFavorite(definition.id) ? Colors.primary : 'transparent'}
                      />
                    </PressableScale>

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
                        <PressableScale
                          containerStyle={[styles.claimButton, !canAfford && styles.claimButtonDisabled]}
                          disabled={!canAfford}
                          onPress={async () => {
                            await claimCoupon(definition.id);
                            const title = t(definition.title);
                            setClaimedCouponName(title);
                            setTimeout(() => setClaimedCouponName(null), 1500);
                          }}
                          accessibilityRole="button"
                        >
                          {canAfford ? (
                            <Check size={16} color={Colors.background} />
                          ) : (
                            <Lock size={14} color={Colors.textMuted} />
                          )}
                          <Text style={[styles.claimText, !canAfford && styles.claimTextDisabled]}>
                            {buttonLabel}
                          </Text>
                        </PressableScale>
                      );
                    })() : (
                      user ? (
                        <View style={styles.lockedBadge}>
                          <Lock size={14} color={Colors.textMuted} />
                          <Text style={styles.lockedText}>
                            {t('coupons.requiresTier', { tier: t(formatTierKey(definition.tier)) })}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.loginBadge}
                          onPress={() => router.push('/login')}
                          activeOpacity={0.8}
                        >
                          <LogIn size={14} color={Colors.primary} />
                          <Text style={styles.loginText}>{t('coupons.signInToUnlock')}</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

	        <ContextualHelpChips
          chips={['howItWorks', 'aiChat']}
          compact
          style={styles.helpChips}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <CouponDetailsSheet
        visible={detailsOpen}
        couponId={selectedCouponId}
        couponInstanceId={selectedClaimId}
        onClose={() => setDetailsOpen(false)}
      />

      <Modal
        visible={sortSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortSheetOpen(false)}
      >
        <View style={styles.sortOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSortSheetOpen(false)} />
          <View style={styles.sortSheet}>
            {(['default', 'expiringSoon', 'newest', 'recentlyUsed'] as const).map((key, index, arr) => {
              const selected = key === sortKey;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.sortRow, index === arr.length - 1 && styles.sortRowLast]}
                  onPress={() => {
                    setSortKey(key);
                    setSortSheetOpen(false);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.sortRowText, selected && styles.sortRowTextSelected]}>
                    {t(`coupons.sort.${key}`)}
                  </Text>
                  {selected ? <Check size={18} color={Colors.primary} /> : <View style={styles.sortSpacer} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

	      <Modal
	        visible={!!claimedCouponName}
	        transparent
	        animationType="fade"
	        onRequestClose={() => setClaimedCouponName(null)}
	      >
	        <View style={styles.claimedOverlay}>
	          <Pressable style={StyleSheet.absoluteFill} onPress={() => setClaimedCouponName(null)} />
	          <View style={styles.claimedCard}>
              <ConfettiBurst active={!!claimedCouponName} />
	            <LinearGradient
	              colors={[Colors.primary, Colors.primaryDark]}
	              style={styles.claimedIcon}
	            >
	              <Sparkles size={26} color={Colors.background} />
	            </LinearGradient>
	            <Text style={styles.claimedTitle}>{t('couponDetail.claimedTitle')}</Text>
	            <Text style={styles.claimedSubtitle}>
	              {t('couponDetail.claimedMessage', { coupon: claimedCouponName ?? '' })}
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
    paddingHorizontal: Layout.screenPadding,
  },
  header: {
    marginBottom: 20,
  },
  bannerCarousel: {
    marginBottom: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(201, 169, 98, 0.14)',
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  sortOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sortSheet: {
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sortRowLast: {
    borderBottomWidth: 0,
  },
  sortRowText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  sortRowTextSelected: {
    color: Colors.primary,
  },
  sortSpacer: {
    width: 18,
    height: 18,
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
  couponHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  favoriteButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(201, 169, 98, 0.14)',
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
  offerFiltersRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  offersEmptyState: {
    paddingVertical: 18,
  },
  claimedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  claimedCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    overflow: 'hidden',
  },
  claimedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  claimedTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  claimedSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
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
  offerFavoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 10,
  },
  offerFavoriteButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(201, 169, 98, 0.14)',
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  offerIconSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.16)',
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
  loginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.35)',
  },
  loginText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  helpChips: {
    marginTop: 16,
  },
});
