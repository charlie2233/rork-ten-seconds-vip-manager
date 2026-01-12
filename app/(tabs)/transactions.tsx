import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDownLeft, ArrowUpRight, Gift, RotateCcw } from 'lucide-react-native';
import { mockTransactions } from '@/mocks/data';
import Colors from '@/constants/colors';
import { Transaction } from '@/types';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';

type FilterType = 'all' | 'deposit' | 'spend' | 'bonus';

const filterOptions: { key: FilterType; labelKey: string }[] = [
  { key: 'all', labelKey: 'transactions.filter.all' },
  { key: 'deposit', labelKey: 'transactions.filter.deposit' },
  { key: 'spend', labelKey: 'transactions.filter.spend' },
  { key: 'bonus', labelKey: 'transactions.filter.bonus' },
];

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'deposit':
      return ArrowDownLeft;
    case 'spend':
      return ArrowUpRight;
    case 'bonus':
      return Gift;
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
    case 'bonus':
      return Colors.primary;
    case 'refund':
      return Colors.warning;
    default:
      return Colors.text;
  }
};

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredTransactions = mockTransactions.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.type === activeFilter;
  });

  const totalDeposit = mockTransactions
    .filter((t) => t.type === 'deposit' || t.type === 'bonus')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpend = Math.abs(
    mockTransactions
      .filter((t) => t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0)
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
          {filteredTransactions.length === 0 ? (
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
