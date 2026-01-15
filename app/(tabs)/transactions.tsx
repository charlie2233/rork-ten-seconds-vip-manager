import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDownLeft, ArrowUpRight, RotateCcw, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Transaction } from '@/types';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import LanguageToggle from '@/components/LanguageToggle';
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

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { user, pointsHistory } = useAuth();
  const { t, locale } = useI18n();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
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

        <View style={styles.transactionsList}>
          {!user ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('transactions.loginRequired')}</Text>
            </View>
          ) : activeFilter === 'points' ? (
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
});
