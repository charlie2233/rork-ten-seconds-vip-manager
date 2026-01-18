import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import Colors from '@/constants/colors';
import { Transaction } from '@/types';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import LanguageToggle from '@/components/LanguageToggle';
import AuthGateCard from '@/components/AuthGateCard';
import { couponCatalog } from '@/mocks/data';

type FilterType = 'all' | 'deposit' | 'spend' | 'points';

const filterOptions: { key: FilterType; labelKey: string }[] = [
  { key: 'all', labelKey: 'transactions.filter.all' },
  { key: 'deposit', labelKey: 'transactions.filter.deposit' },
  { key: 'spend', labelKey: 'transactions.filter.spend' },
  { key: 'points', labelKey: 'transactions.filter.points' },
];

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'deposit':
      return ArrowDownLeft;
    case 'spend':
      return ArrowUpRight;
    case 'refund':
      return RotateCcw;
    default:
      return ArrowUpRight;
  }
};

const getTransactionColor = (type: Transaction['type']) => {
  switch (type) {
    case 'deposit':
      return Colors.success;
    case 'spend':
      return Colors.text;
    case 'refund':
      return Colors.warning;
    default:
      return Colors.text;
  }
};

function parseDateLike(value: string): number {
  const direct = Date.parse(value);
  if (Number.isFinite(direct)) return direct;
  const normalized = Date.parse(value.replace(' ', 'T'));
  return Number.isFinite(normalized) ? normalized : 0;
}

function formatMonthLabel(date: Date, locale: string): string {
  try {
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
  } catch {
    return date.toISOString().slice(0, 7);
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function PointsBarChart({ values }: { values: number[] }) {
  const chartWidth = 160;
  const chartHeight = 52;
  const padding = 6;
  const gap = 4;
  const count = Math.max(1, values.length);
  const baselineY = Math.round(chartHeight / 2);
  const maxBarHeight = baselineY - padding - 2;
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const barWidth = (chartWidth - padding * 2 - gap * (count - 1)) / count;

  return (
    <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
      <Line
        x1={padding}
        y1={baselineY}
        x2={chartWidth - padding}
        y2={baselineY}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
      />
      {values.map((v, i) => {
        const h = (Math.abs(v) / maxAbs) * maxBarHeight;
        const x = padding + i * (barWidth + gap);
        const y = v >= 0 ? baselineY - h : baselineY;
        const fill =
          v >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.75)';
        return (
          <Rect
            key={`bar-${i}`}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={2}
            fill={fill}
          />
        );
      })}
    </Svg>
  );
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { user, pointsHistory } = useAuth();
  const { t, locale } = useI18n();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [howOpen, setHowOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const numberLocale = locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es-ES' : 'en-US';

  const transactionsQuery = trpc.transactions.list.useQuery(
    { userId: user?.id, limit: 50 },
    { enabled: !!user }
  );
  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);

  const billingTransactions = transactions.filter((tx) => tx.type !== 'bonus');

  const filteredTransactions = billingTransactions.filter((tx) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'points') return false;
    return tx.type === activeFilter;
  });

  const totalDeposit = transactions
    .filter((tx) => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSpend = Math.abs(
    transactions
      .filter((tx) => tx.type === 'spend')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  const pointsItems = useMemo(() => {
    const local = (pointsHistory ?? []).map((r) => ({
      id: r.id,
      delta: r.delta,
      couponId: r.couponId,
      description: r.description,
      date: r.date,
      balance: r.balance,
      source: 'local' as const,
    }));

    const bonus = transactions
      .filter((tx) => tx.type === 'bonus')
      .map((tx) => ({
        id: `bonus_${tx.id}`,
        delta: Math.round(tx.amount),
        description: tx.description,
        date: tx.date,
        source: 'bonus' as const,
        couponId: undefined as string | undefined,
      }));

    return [...local, ...bonus].sort((a, b) => parseDateLike(b.date) - parseDateLike(a.date));
  }, [pointsHistory, transactions]);

  const renderPointsDescription = useCallback(
    (item: (typeof pointsItems)[number]) => {
      if (item.couponId) {
        const def = couponCatalog.find((c) => c.id === item.couponId) ?? null;
        const title = def ? t(def.title) : item.couponId;
        return t('points.record.couponRedeem', { coupon: title });
      }
      if (item.description) return t(item.description);
      return t('points.record.adjust');
    },
    [t]
  );

  const pointsSummary = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    let earned = 0;
    let spent = 0;

    for (const item of pointsItems) {
      const ts = parseDateLike(item.date);
      if (!ts) continue;
      if (ts < monthStart.valueOf() || ts >= nextMonthStart.valueOf()) continue;
      if (item.delta >= 0) earned += item.delta;
      else spent += Math.abs(item.delta);
    }

    const days = 14;
    const todayStart = startOfDay(now).valueOf();
    const dayMs = 24 * 60 * 60 * 1000;
    const series: number[] = [];

    for (let i = days - 1; i >= 0; i -= 1) {
      const dayStart = todayStart - i * dayMs;
      const dayEnd = dayStart + dayMs;
      const net = pointsItems.reduce((sum, item) => {
        const ts = parseDateLike(item.date);
        if (!ts) return sum;
        if (ts >= dayStart && ts < dayEnd) return sum + item.delta;
        return sum;
      }, 0);
      series.push(net);
    }

    return {
      monthLabel: formatMonthLabel(now, numberLocale),
      earned,
      spent,
      net: earned - spent,
      series,
    };
  }, [numberLocale, pointsItems]);

  const sharePointsSummary = useCallback(async () => {
    const balance = user?.points ?? 0;
    const message = t('pointsCenter.shareMessage', {
      month: pointsSummary.monthLabel,
      earned: pointsSummary.earned.toLocaleString(numberLocale),
      spent: pointsSummary.spent.toLocaleString(numberLocale),
      net: pointsSummary.net.toLocaleString(numberLocale),
      balance: balance.toLocaleString(numberLocale),
    });

    try {
      await Clipboard.setStringAsync(message);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      // ignore
    }

    try {
      await Share.share({ message });
    } catch {
      // ignore
    }
  }, [numberLocale, pointsSummary, t, user?.points]);

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

        <Text style={styles.title}>{t('transactions.title')}</Text>

        {!user ? (
          <AuthGateCard
            title={t('transactions.loginRequired')}
            message={t('auth.gate.billing.message')}
            style={{ marginBottom: 20 }}
          />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.05)']}
                  style={styles.statGradient}
                >
                  <Text style={styles.statLabel}>{t('transactions.totalDeposit')}</Text>
                  <Text style={[styles.statValue, { color: Colors.success }]}>
                    +${totalDeposit.toFixed(2)}
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
                  style={styles.statGradient}
                >
                  <Text style={styles.statLabel}>{t('transactions.totalSpend')}</Text>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>
                    -${totalSpend.toFixed(2)}
                  </Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.filterContainer}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterButton,
                    activeFilter === option.key && styles.filterButtonActive,
                  ]}
                  onPress={() => setActiveFilter(option.key)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === option.key && styles.filterTextActive,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeFilter === 'points' ? (
              <View style={styles.pointsCenterCard}>
                <View style={styles.pointsCenterHeader}>
                  <View>
                    <Text style={styles.pointsCenterTitle}>{t('pointsCenter.title')}</Text>
                    <Text style={styles.pointsCenterSubtitle}>
                      {t('pointsCenter.thisMonth', { month: pointsSummary.monthLabel })}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={sharePointsSummary}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t('pointsCenter.share')}
                    accessibilityHint={t('pointsCenter.shareHint')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Share2 size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                {shareCopied ? (
                  <Text style={styles.shareCopiedText}>{t('common.copied')}</Text>
                ) : null}

                <View style={styles.pointsBalanceRow}>
                  <Text style={styles.pointsBalanceValue}>
                    {(user.points ?? 0).toLocaleString(numberLocale)}
                  </Text>
                  <Text style={styles.pointsBalanceUnit}>{t('points.unit')}</Text>
                </View>

                <View style={styles.pointsSummaryRow}>
                  <View style={styles.pointsSummaryItem}>
                    <Text style={styles.pointsSummaryLabel}>{t('pointsCenter.earned')}</Text>
                    <Text style={[styles.pointsSummaryValue, { color: Colors.success }]}>
                      +{pointsSummary.earned.toLocaleString(numberLocale)}
                    </Text>
                  </View>
                  <View style={styles.pointsSummaryDivider} />
                  <View style={styles.pointsSummaryItem}>
                    <Text style={styles.pointsSummaryLabel}>{t('pointsCenter.spent')}</Text>
                    <Text style={[styles.pointsSummaryValue, { color: Colors.error }]}>
                      -{pointsSummary.spent.toLocaleString(numberLocale)}
                    </Text>
                  </View>
                  <View style={styles.pointsSummaryDivider} />
                  <View style={styles.pointsSummaryItem}>
                    <Text style={styles.pointsSummaryLabel}>{t('pointsCenter.net')}</Text>
                    <Text style={styles.pointsSummaryValue}>
                      {pointsSummary.net >= 0 ? '+' : ''}
                      {pointsSummary.net.toLocaleString(numberLocale)}
                    </Text>
                  </View>
                </View>

                <View
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={t('pointsCenter.chartA11y', {
                    earned: pointsSummary.earned.toLocaleString(numberLocale),
                    spent: pointsSummary.spent.toLocaleString(numberLocale),
                    net: pointsSummary.net.toLocaleString(numberLocale),
                  })}
                >
                  <PointsBarChart values={pointsSummary.series} />
                </View>

                <TouchableOpacity
                  style={styles.howToggle}
                  onPress={() => setHowOpen((v) => !v)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('pointsCenter.howTitle')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.howTitle}>{t('pointsCenter.howTitle')}</Text>
                  {howOpen ? (
                    <ChevronUp size={18} color={Colors.textSecondary} />
                  ) : (
                    <ChevronDown size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>

                {howOpen ? (
                  <View style={styles.howContent}>
                    <Text style={styles.howSectionTitle}>{t('pointsCenter.howEarnTitle')}</Text>
                    <Text style={styles.howBullet}>• {t('pointsCenter.howEarn1')}</Text>
                    <Text style={styles.howBullet}>• {t('pointsCenter.howEarn2')}</Text>

                    <View style={{ height: 10 }} />

                    <Text style={styles.howSectionTitle}>{t('pointsCenter.howSpendTitle')}</Text>
                    <Text style={styles.howBullet}>• {t('pointsCenter.howSpend1')}</Text>
                    <Text style={styles.howBullet}>• {t('pointsCenter.howSpend2')}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.transactionsList}>
              {activeFilter === 'points' ? (
                pointsItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{t('points.empty')}</Text>
                  </View>
                ) : (
                  pointsItems.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.transactionItem,
                        index === pointsItems.length - 1 && styles.lastItem,
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIcon,
                          { backgroundColor: `${Colors.primary}15` },
                        ]}
                      >
                        <Sparkles size={20} color={Colors.primary} />
                      </View>

                      <View style={styles.transactionContent}>
                        <Text style={styles.transactionDesc} numberOfLines={1}>
                          {renderPointsDescription(item)}
                        </Text>
                        <Text style={styles.transactionDate}>{item.date}</Text>
                      </View>

                      <View style={styles.transactionRight}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            item.delta >= 0 ? styles.positiveAmount : styles.negativeAmount,
                          ]}
                        >
                          {item.delta >= 0 ? '+' : ''}
                          {Math.abs(item.delta).toLocaleString(numberLocale)} {t('points.unit')}
                        </Text>
                        {'balance' in item && typeof item.balance === 'number' ? (
                          <Text style={styles.transactionBalance}>
                            {t('points.balancePrefix')}: {item.balance.toLocaleString(numberLocale)}{' '}
                            {t('points.unit')}
                          </Text>
                        ) : (
                          <Text style={styles.transactionBalance} />
                        )}
                      </View>
                    </View>
                  ))
                )
              ) : transactionsQuery.isLoading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{t('common.loading')}</Text>
                </View>
              ) : filteredTransactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{t('transactions.empty')}</Text>
                </View>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const IconComponent = getTransactionIcon(transaction.type);
                  const iconColor = getTransactionColor(transaction.type);

                  return (
                <View
                  key={transaction.id}
                  style={[
                    styles.transactionItem,
                    index === filteredTransactions.length - 1 && styles.lastItem,
                  ]}
                >
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: `${iconColor}15` },
                    ]}
                  >
                    <IconComponent size={20} color={iconColor} />
                  </View>
                  
                  <View style={styles.transactionContent}>
                    <Text style={styles.transactionDesc} numberOfLines={1}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                  </View>
                  
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        transaction.amount > 0
                          ? styles.positiveAmount
                          : styles.negativeAmount,
                      ]}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                    <Text style={styles.transactionBalance}>
                      {t('transactions.balancePrefix')}: ${transaction.balance.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
                })
              )}
            </View>
          </>
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
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.background,
    fontWeight: '600' as const,
  },
  transactionsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
    marginRight: 12,
  },
  transactionDesc: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  positiveAmount: {
    color: Colors.success,
  },
  negativeAmount: {
    color: Colors.text,
  },
  transactionBalance: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  pointsCenterCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 14,
  },
  pointsCenterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  pointsCenterTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800' as const,
  },
  pointsCenterSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareCopiedText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: -4,
    marginBottom: 6,
  },
  pointsBalanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 12,
  },
  pointsBalanceValue: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
  pointsBalanceUnit: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  pointsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  pointsSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  pointsSummaryLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  pointsSummaryValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800' as const,
  },
  pointsSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  howToggle: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  howTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  howContent: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
    padding: 12,
  },
  howSectionTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  howBullet: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
