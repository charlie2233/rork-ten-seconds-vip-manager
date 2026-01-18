import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Sparkles, Wallet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BrandBanner from '@/components/BrandBanner';
import TopBar from '@/components/TopBar';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getPointsPerDollar } from '@/lib/points';
import { getTierFromBalance, TIER_MIN_BALANCE, TIER_ORDER } from '@/lib/tier';

export default function HowItWorksScreen() {
  const { t, locale } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();
  const { user } = useAuth();

  const numberLocale = locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-ES' : 'en-US';

  const currentTier = useMemo(() => {
    if (!user) return null;
    return getTierFromBalance(user.balance);
  }, [user]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={backgroundGradient} style={StyleSheet.absoluteFill} />

      <TopBar title={t('howItWorks.title')} leftAction="back" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BrandBanner
          title={t('howItWorks.bannerTitle')}
          subtitle={t('howItWorks.bannerSubtitle')}
          style={{ marginBottom: 14 }}
        />

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Wallet size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: 15 * fontScale }]}>
              {t('howItWorks.balance.title')}
            </Text>
          </View>
          <Text style={styles.sectionBody}>{t('howItWorks.balance.body')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Sparkles size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: 15 * fontScale }]}>
              {t('howItWorks.points.title')}
            </Text>
          </View>
          <Text style={styles.sectionBody}>{t('howItWorks.points.body')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Gift size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: 15 * fontScale }]}>
              {t('howItWorks.coupons.title')}
            </Text>
          </View>
          <Text style={styles.sectionBody}>{t('howItWorks.coupons.body')}</Text>
        </View>

        <View style={styles.tableCard}>
          <Text style={[styles.tableTitle, { fontSize: 16 * fontScale }]}>
            {t('howItWorks.tiers.title')}
          </Text>

          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
              {t('howItWorks.tableHeader.tier')}
            </Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4, textAlign: 'right' }]}>
              {t('howItWorks.tableHeader.minBalance')}
            </Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.1, textAlign: 'right' }]}>
              {t('howItWorks.tableHeader.pointsRate')}
            </Text>
          </View>

          {TIER_ORDER.map((tier, index) => {
            const isCurrent = !!currentTier && currentTier === tier;
            return (
              <View
                key={tier}
                style={[
                  styles.tableRow,
                  isCurrent && styles.tableRowCurrent,
                  index === TIER_ORDER.length - 1 && styles.tableRowLast,
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1.2 }, isCurrent && styles.tableCellCurrent]}>
                  {t(`tier.${tier}`)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 1.4, textAlign: 'right' },
                    isCurrent && styles.tableCellCurrent,
                  ]}
                >
                  {`$${TIER_MIN_BALANCE[tier].toLocaleString(numberLocale)}`}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 1.1, textAlign: 'right' },
                    isCurrent && styles.tableCellCurrent,
                  ]}
                >
                  {getPointsPerDollar(tier).toLocaleString(numberLocale)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
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
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.18)',
  },
  sectionTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '900' as const,
  },
  sectionBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginTop: 4,
  },
  tableTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900' as const,
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  tableHeaderCell: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableRowCurrent: {
    backgroundColor: 'rgba(201, 169, 98, 0.10)',
    borderRadius: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    marginTop: 6,
  },
  tableCell: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  tableCellCurrent: {
    color: Colors.primary,
    fontWeight: '900' as const,
  },
});

