import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { User } from '@/types';
import Colors from '@/constants/colors';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/contexts/SettingsContext';
import { TIER_ORDER, TIER_MIN_BALANCE } from '@/lib/tier';
import { getPointsPerDollar } from '@/lib/points';
import { getVipCardTheme } from '@/lib/vipCardTheme';
import { CardTexture } from '@/components/CardTexture';

type Props = {
  currentTier?: User['tier'] | null;
  currentBalance?: number | null;
};

type Surface = {
  textureColor: string;
  textureOpacity: number;
  innerStrokeOpacity: number;
  specularOpacity: number;
  specularColors: readonly [string, string, string, string];
};

function getTierSurface(tier: User['tier']): Surface {
  switch (tier) {
    case 'silver':
      return {
        textureColor: '#000',
        textureOpacity: 0.05,
        innerStrokeOpacity: 0.55,
        specularOpacity: 0.8,
        specularColors: ['transparent', 'rgba(255,255,255,0.30)', 'rgba(255,255,255,0.08)', 'transparent'],
      };
    case 'gold':
      return {
        textureColor: '#000',
        textureOpacity: 0.04,
        innerStrokeOpacity: 0.38,
        specularOpacity: 0.75,
        specularColors: ['transparent', 'rgba(255,235,180,0.26)', 'rgba(255,255,255,0.08)', 'transparent'],
      };
    case 'platinum':
      return {
        textureColor: '#FFF',
        textureOpacity: 0.055,
        innerStrokeOpacity: 0.4,
        specularOpacity: 0.8,
        specularColors: ['transparent', 'rgba(255,255,255,0.22)', 'rgba(165,243,252,0.11)', 'transparent'],
      };
    case 'diamond':
      return {
        textureColor: '#FFF',
        textureOpacity: 0.06,
        innerStrokeOpacity: 0.36,
        specularOpacity: 0.78,
        specularColors: ['transparent', 'rgba(255,255,255,0.18)', 'rgba(64,224,208,0.14)', 'transparent'],
      };
    case 'blackGold':
      return {
        textureColor: '#FFF',
        textureOpacity: 0.06,
        innerStrokeOpacity: 0.32,
        specularOpacity: 0.7,
        specularColors: ['transparent', 'rgba(212,175,55,0.22)', 'rgba(255,255,255,0.06)', 'transparent'],
      };
    default:
      return {
        textureColor: '#FFF',
        textureOpacity: 0.055,
        innerStrokeOpacity: 0.35,
        specularOpacity: 0.75,
        specularColors: ['transparent', 'rgba(255,255,255,0.20)', 'rgba(255,255,255,0.06)', 'transparent'],
      };
  }
}

function TierPreviewCard({ tier, isCurrent }: { tier: User['tier']; isCurrent: boolean }) {
  const { t } = useI18n();
  const { fontScale } = useSettings();
  const theme = useMemo(() => getVipCardTheme(tier), [tier]);
  const surface = useMemo(() => getTierSurface(tier), [tier]);

  return (
    <View style={[styles.previewShadow, { shadowColor: theme.glowColor }]}>
      <View style={[styles.previewCard, { borderColor: theme.borderColor }]}>
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <LinearGradient
          colors={theme.overlayGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <CardTexture
          type={theme.texture || 'none'}
          color={surface.textureColor}
          opacity={surface.textureOpacity}
        />

        <View
          pointerEvents="none"
          style={[
            styles.previewInnerStroke,
            { borderColor: theme.borderGlow, opacity: surface.innerStrokeOpacity },
          ]}
        />

        <View
          pointerEvents="none"
          style={[styles.previewSpecular, { opacity: surface.specularOpacity }]}
        >
          <LinearGradient
            colors={surface.specularColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.previewContent}>
          <Text
            style={[styles.previewBrand, { color: theme.textMuted, fontSize: 11 * fontScale }]}
            numberOfLines={1}
          >
            {t('brand.shortName')} · {t('common.vip')}
          </Text>
          <Text style={[styles.previewTier, { color: theme.text, fontSize: 18 * fontScale }]} numberOfLines={1}>
            {t(`tier.${tier}`)}
          </Text>
          <View style={styles.previewFooter}>
            <View style={styles.previewChip}>
              <LinearGradient
                colors={theme.chipGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View style={[styles.previewDot, { backgroundColor: theme.accent }]} />
          </View>
        </View>

        {isCurrent ? (
          <View style={styles.currentBadge}>
            <Text style={[styles.currentBadgeText, { color: theme.text, fontSize: 11 * fontScale }]}>
              {t('profile.vipLevelsCurrent')}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function VipLevelsShowcase({ currentTier = null, currentBalance = null }: Props) {
  const { t, locale } = useI18n();
  const { hideBalance, fontScale } = useSettings();

  const numberLocale = locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-ES' : 'en-US';

  const nextTier = useMemo(() => {
    if (!currentTier) return null;
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    if (currentIndex < 0) return null;
    return currentIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentIndex + 1] : null;
  }, [currentTier]);

  const nextTierTheme = useMemo(() => (nextTier ? getVipCardTheme(nextTier) : null), [nextTier]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { fontSize: 16 * fontScale }]}>{t('profile.vipLevelsTitle')}</Text>
        <Text style={[styles.subtitle, { fontSize: 12 * fontScale, lineHeight: 16 * fontScale }]}>
          {t('profile.vipLevelsSubtitle')}
        </Text>
      </View>

      {currentTier && typeof currentBalance === 'number' && Number.isFinite(currentBalance) ? (
        nextTier ? (
          (() => {
            const currentMin = currentTier === 'silver' ? 0 : TIER_MIN_BALANCE[currentTier];
            const nextMin = TIER_MIN_BALANCE[nextTier];
            const remaining = Math.max(0, nextMin - currentBalance);
            const denom = Math.max(1, nextMin - currentMin);
            const raw = (currentBalance - currentMin) / denom;
            const pct = Math.max(0, Math.min(1, raw));
            const percentText = `${Math.round(pct * 100)}%`;
            const remainingText = hideBalance
              ? '•••'
              : Math.ceil(remaining).toLocaleString(numberLocale, { maximumFractionDigits: 0 });
            const nextTierName = t(`tier.${nextTier}`);
            const fillColors = nextTierTheme?.chipGradient ?? ['#FFFFFF', Colors.primary];
            return (
              <View style={styles.progressCard}>
                <View style={styles.progressTopRow}>
                  <Text style={[styles.progressNext, { fontSize: 13 * fontScale }]} numberOfLines={1}>
                    {t('profile.vipProgressNext', { tier: nextTierName })}
                  </Text>
                  <Text style={[styles.progressPercent, { fontSize: 12 * fontScale }]} numberOfLines={1}>
                    {percentText}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={fillColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${pct * 100}%` }]}
                  />
                </View>

                <Text style={[styles.progressHint, { fontSize: 12 * fontScale }]}>
                  {t('profile.vipProgressNeed', { amount: remainingText, tier: nextTierName })}
                </Text>
              </View>
            );
          })()
        ) : (
          <View style={styles.progressCard}>
            <Text style={[styles.progressNext, { fontSize: 13 * fontScale }]}>{t('profile.vipProgressMax')}</Text>
          </View>
        )
      ) : (
        <View style={styles.progressCard}>
          <Text style={[styles.progressNext, { fontSize: 13 * fontScale }]}>{t('profile.vipProgressLoginHint')}</Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      >
        {TIER_ORDER.map((tier) => (
          <View key={tier} style={styles.item}>
            <TierPreviewCard tier={tier} isCurrent={!!currentTier && currentTier === tier} />
            <Text style={[styles.itemLine, { fontSize: 12 * fontScale }]}>
              {t('profile.vipLevelsRequirement', { amount: TIER_MIN_BALANCE[tier] })}
            </Text>
            <Text style={[styles.itemLineMuted, { fontSize: 12 * fontScale }]}>
              {t('profile.vipLevelsPointsRate', { rate: getPointsPerDollar(tier) })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  headerRow: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 4,
    marginBottom: 14,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  progressNext: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  progressHint: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  carouselContent: {
    paddingHorizontal: 4,
    paddingRight: 20,
    gap: 14,
  },
  item: {
    width: 220,
  },
  itemLine: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  itemLineMuted: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  previewShadow: {
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  previewCard: {
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewInnerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
  },
  previewSpecular: {
    position: 'absolute',
    top: '-25%',
    left: '-55%',
    width: '160%',
    height: '140%',
    transform: [{ rotate: '18deg' }],
  },
  previewContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  previewBrand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  previewTier: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewChip: {
    width: 44,
    height: 30,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    opacity: 0.9,
  },
  currentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
