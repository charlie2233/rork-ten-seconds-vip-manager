import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Percent,
  Gift,
  Wallet,
  CalendarCheck,
  Headphones,
  Car,
  Crown,
  Sparkles,
  Lock,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { mockBenefits, tierInfo } from '@/mocks/data';
import Colors from '@/constants/colors';

const iconMap: Record<string, React.ComponentType<any>> = {
  percent: Percent,
  gift: Gift,
  wallet: Wallet,
  'calendar-check': CalendarCheck,
  headphones: Headphones,
  car: Car,
  crown: Crown,
  sparkles: Sparkles,
};

export default function BenefitsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  if (!user) return null;

  const currentTier = tierInfo[user.tier];
  const tierOrder = ['silver', 'gold', 'platinum', 'diamond'] as const;
  const currentTierIndex = tierOrder.indexOf(user.tier);

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
          <Text style={styles.title}>会员权益</Text>
          <View style={styles.tierBadge}>
            <Text style={[styles.tierText, { color: currentTier.color }]}>
              {currentTier.name}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>当前积分</Text>
            <Text style={styles.progressValue}>{user.points.toLocaleString()}</Text>
          </View>
          
          <View style={styles.tierProgress}>
            {tierOrder.map((tier, index) => {
              const info = tierInfo[tier];
              const isActive = index <= currentTierIndex;
              const isCurrent = index === currentTierIndex;
              
              return (
                <View key={tier} style={styles.tierItem}>
                  <View
                    style={[
                      styles.tierDot,
                      isActive && { backgroundColor: info.color },
                      isCurrent && styles.tierDotCurrent,
                    ]}
                  />
                  <Text
                    style={[
                      styles.tierLabel,
                      isActive && { color: info.color },
                    ]}
                  >
                    {info.name.replace('会员', '')}
                  </Text>
                </View>
              );
            })}
          </View>
          
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentTierIndex + 1) / tierOrder.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>我的权益</Text>
          
          {mockBenefits.map((benefit) => {
            const IconComponent = iconMap[benefit.icon] || Gift;
            const benefitTierIndex = tierOrder.indexOf(benefit.tier);
            const isUnlocked = benefitTierIndex <= currentTierIndex;
            
            return (
              <TouchableOpacity
                key={benefit.id}
                style={[
                  styles.benefitCard,
                  !isUnlocked && styles.benefitCardLocked,
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.benefitIcon,
                    !isUnlocked && styles.benefitIconLocked,
                  ]}
                >
                  <IconComponent
                    size={24}
                    color={isUnlocked ? Colors.primary : Colors.textMuted}
                  />
                </View>
                
                <View style={styles.benefitContent}>
                  <View style={styles.benefitHeader}>
                    <Text
                      style={[
                        styles.benefitTitle,
                        !isUnlocked && styles.benefitTitleLocked,
                      ]}
                    >
                      {benefit.title}
                    </Text>
                    {isUnlocked ? (
                      <View style={styles.unlockedBadge}>
                        <Check size={12} color={Colors.success} />
                        <Text style={styles.unlockedText}>已解锁</Text>
                      </View>
                    ) : (
                      <View style={styles.lockedBadge}>
                        <Lock size={12} color={Colors.textMuted} />
                        <Text style={styles.lockedText}>
                          {tierInfo[benefit.tier].name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.benefitDesc,
                      !isUnlocked && styles.benefitDescLocked,
                    ]}
                  >
                    {benefit.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.upgradeCard}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeGradient}
          >
            <View style={styles.upgradeContent}>
              <Text style={styles.upgradeTitle}>升级会员</Text>
              <Text style={styles.upgradeDesc}>
                再获得 {(tierInfo[tierOrder[Math.min(currentTierIndex + 1, 3)]].minPoints - user.points).toLocaleString()} 积分即可升级
              </Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>去充值</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
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
  progressSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  tierProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tierItem: {
    alignItems: 'center',
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
    marginBottom: 4,
  },
  tierDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.text,
  },
  tierLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  benefitCardLocked: {
    opacity: 0.6,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitIconLocked: {
    backgroundColor: Colors.surfaceLight,
  },
  benefitContent: {
    flex: 1,
  },
  benefitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  benefitTitleLocked: {
    color: Colors.textSecondary,
  },
  benefitDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  benefitDescLocked: {
    color: Colors.textMuted,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedText: {
    fontSize: 11,
    color: Colors.success,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  upgradeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
    marginBottom: 4,
  },
  upgradeDesc: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.7)',
  },
  upgradeButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
