import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QrCode, Wallet, Gift, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { tierInfo, mockTransactions } from '@/mocks/data';
import Colors from '@/constants/colors';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  if (!user) return null;

  const tier = tierInfo[user.tier];
  const recentTransactions = mockTransactions.slice(0, 3);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

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
        <View style={styles.header}>
          <Text style={styles.greeting}>欢迎回来</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>

        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#2D2D2D', '#1F1F1F', '#171717']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vipCard}
          >
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.brandName}>十秒到</Text>
                <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
              </View>
              <TouchableOpacity 
                style={styles.qrButton}
                onPress={() => router.push('/member-code')}
                activeOpacity={0.7}
              >
                <QrCode size={28} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>账户余额</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.currencySymbol}>¥</Text>
                <Text style={styles.balanceAmount}>
                  {user.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.memberIdLabel}>会员ID</Text>
                <Text style={styles.memberId}>{user.memberId}</Text>
              </View>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsLabel}>积分</Text>
                <Text style={styles.pointsValue}>{user.points.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.cardDecoration}>
              <View style={[styles.decorCircle, styles.decorCircle1]} />
              <View style={[styles.decorCircle, styles.decorCircle2]} />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(201, 169, 98, 0.15)' }]}>
              <Wallet size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>充值</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/benefits')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(212, 57, 58, 0.15)' }]}>
              <Gift size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.actionText}>权益</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/transactions')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
              <TrendingUp size={22} color={Colors.success} />
            </View>
            <Text style={styles.actionText}>账单</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.7}
            onPress={() => router.push('/member-code')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
              <QrCode size={22} color={Colors.warning} />
            </View>
            <Text style={styles.actionText}>付款码</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近交易</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <Text style={styles.seeAllText}>查看全部</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction, index) => (
              <View
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  index === recentTransactions.length - 1 && styles.lastItem,
                ]}
              >
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionDesc} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount,
                  ]}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.promoCard}>
          <LinearGradient
            colors={[Colors.secondary, Colors.secondaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoGradient}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>会员日特惠</Text>
              <Text style={styles.promoDesc}>每周三充值享双倍积分</Text>
            </View>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={styles.promoButtonText}>立即参与</Text>
            </TouchableOpacity>
          </LinearGradient>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardContainer: {
    marginBottom: 24,
  },
  vipCard: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: CARD_WIDTH,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 2,
  },
  tierName: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 4,
    letterSpacing: 1,
  },
  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  memberIdLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  memberId: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    letterSpacing: 1,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  cardDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    borderRadius: 20,
    pointerEvents: 'none',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.1)',
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -50,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -50,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 2,
  },
  transactionsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 16,
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
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  positiveAmount: {
    color: Colors.success,
  },
  negativeAmount: {
    color: Colors.text,
  },
  promoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  promoDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  promoButton: {
    backgroundColor: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  promoButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
});
