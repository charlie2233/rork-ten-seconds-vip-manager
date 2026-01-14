import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Wallet, Gift, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';
import Colors from '@/constants/colors';

const RECHARGE_OPTIONS = [
  { amount: 100, bonus: 0 },
  { amount: 200, bonus: 10 },
  { amount: 500, bonus: 50 },
  { amount: 1000, bonus: 150 },
  { amount: 2000, bonus: 400 },
  { amount: 5000, bonus: 1200 },
];

export default function RechargeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const handleRecharge = () => {
    const amount = selectedAmount || parseInt(customAmount, 10);
    if (!amount || amount < 50) {
      Alert.alert(t('recharge.error'), t('recharge.minAmount'));
      return;
    }
    Alert.alert(
      t('recharge.confirmTitle'),
      t('recharge.confirmMessage', { amount: amount.toString() }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          onPress: () => {
            Alert.alert(t('recharge.success'), t('recharge.successMessage'));
            router.back();
          },
        },
      ]
    );
  };

  const selectedOption = RECHARGE_OPTIONS.find((o) => o.amount === selectedAmount);
  const totalBonus = selectedOption?.bonus || 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('recharge.title')}</Text>
        <LanguageToggle variant="icon" align="right" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#2D2D2D', '#1F1F1F']}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceIcon}>
              <Wallet size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.balanceLabel}>{t('recharge.currentBalance')}</Text>
              <Text style={styles.balanceValue}>
                ${(user?.balance ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>{t('recharge.selectAmount')}</Text>

        <View style={styles.optionsGrid}>
          {RECHARGE_OPTIONS.map((option) => {
            const isSelected = selectedAmount === option.amount;
            return (
              <TouchableOpacity
                key={option.amount}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => {
                  setSelectedAmount(option.amount);
                  setCustomAmount('');
                }}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={styles.checkMark}>
                    <Check size={14} color={Colors.background} />
                  </View>
                )}
                <Text style={[styles.optionAmount, isSelected && styles.optionAmountSelected]}>
                  ${option.amount}
                </Text>
                {option.bonus > 0 && (
                  <View style={styles.bonusBadge}>
                    <Gift size={12} color={Colors.secondary} />
                    <Text style={styles.bonusText}>+${option.bonus}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.customSection}>
          <Text style={styles.customLabel}>{t('recharge.customAmount')}</Text>
          <View style={styles.customInputWrapper}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.customInput}
              placeholder={t('recharge.customPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text);
                setSelectedAmount(null);
              }}
            />
          </View>
          <Text style={styles.minHint}>{t('recharge.minHint')}</Text>
          <Text style={styles.storeOnlyHint}>{t('recharge.storeOnlyHint')}</Text>
        </View>

        {(selectedAmount || customAmount) && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('recharge.rechargeAmount')}</Text>
              <Text style={styles.summaryValue}>
                ${selectedAmount || customAmount}
              </Text>
            </View>
            {totalBonus > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.bonusRow}>
                  <Sparkles size={16} color={Colors.primary} />
                  <Text style={styles.summaryBonusLabel}>{t('recharge.bonusAmount')}</Text>
                </View>
                <Text style={styles.summaryBonusValue}>+${totalBonus}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('recharge.totalCredit')}</Text>
              <Text style={styles.totalValue}>
                ${(selectedAmount || parseInt(customAmount, 10) || 0) + totalBonus}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.rechargeButton,
            (!selectedAmount && !customAmount) && styles.rechargeButtonDisabled,
          ]}
          onPress={handleRecharge}
          disabled={!selectedAmount && !customAmount}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rechargeGradient}
          >
            <Text style={styles.rechargeButtonText}>{t('recharge.confirmButton')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  balanceCard: {
    marginBottom: 28,
    borderRadius: 16,
    overflow: 'hidden',
  },
  balanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  optionCard: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  optionAmountSelected: {
    color: Colors.primary,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  customSection: {
    marginBottom: 24,
  },
  customLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    height: 56,
    fontSize: 18,
    color: Colors.text,
  },
  minHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  storeOnlyHint: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 6,
    fontWeight: '600' as const,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryBonusLabel: {
    fontSize: 14,
    color: Colors.primary,
  },
  summaryBonusValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  totalRow: {
    marginBottom: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rechargeButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  rechargeButtonDisabled: {
    opacity: 0.5,
  },
  rechargeGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechargeButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
