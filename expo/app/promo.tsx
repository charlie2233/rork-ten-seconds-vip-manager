import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, Gift, Sparkles, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

const PROMOTIONS = [
  {
    id: '1',
    titleKey: 'promo.item.wednesday.title',
    descKey: 'promo.item.wednesday.desc',
    icon: Sparkles,
    color: Colors.primary,
    bgColor: 'rgba(201, 169, 98, 0.15)',
  },
  {
    id: '2',
    titleKey: 'promo.item.newMember.title',
    descKey: 'promo.item.newMember.desc',
    icon: Gift,
    color: Colors.secondary,
    bgColor: 'rgba(212, 57, 58, 0.15)',
  },
  {
    id: '3',
    titleKey: 'promo.item.birthday.title',
    descKey: 'promo.item.birthday.desc',
    icon: Calendar,
    color: '#9C27B0',
    bgColor: 'rgba(156, 39, 176, 0.15)',
  },
];

export default function PromoScreen() {
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('promo.title')} leftAction="back" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[Colors.secondary, Colors.secondaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroDecor}>
              <View style={[styles.heroCircle, styles.heroCircle1]} />
              <View style={[styles.heroCircle, styles.heroCircle2]} />
            </View>
            <View style={styles.heroContent}>
              <Text style={[styles.heroTitle, { fontSize: 24 * fontScale }]}>{t('promo.heroTitle')}</Text>
              <Text style={[styles.heroDesc, { fontSize: 14 * fontScale, lineHeight: 20 * fontScale }]}>
                {t('promo.heroDesc')}
              </Text>
              <View style={styles.heroBadge}>
                <Clock size={14} color={Colors.text} />
                <Text style={[styles.heroBadgeText, { fontSize: 12 * fontScale }]}>{t('promo.heroTime')}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: 18 * fontScale }]}>{t('promo.currentPromos')}</Text>

        {PROMOTIONS.map((promo) => {
          const IconComponent = promo.icon;
          return (
            <TouchableOpacity
              key={promo.id}
              style={styles.promoCard}
              activeOpacity={0.7}
              onPress={() => router.push('/recharge')}
              accessibilityRole="button"
              accessibilityLabel={t(promo.titleKey)}
            >
              <View style={[styles.promoIcon, { backgroundColor: promo.bgColor }]}>
                <IconComponent size={24} color={promo.color} />
              </View>
              <View style={styles.promoContent}>
                <Text style={[styles.promoTitle, { fontSize: 16 * fontScale }]}>{t(promo.titleKey)}</Text>
                <Text style={[styles.promoDesc, { fontSize: 13 * fontScale }]}>{t(promo.descKey)}</Text>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          );
        })}

        <View style={styles.rulesCard}>
          <Text style={[styles.rulesTitle, { fontSize: 14 * fontScale }]}>{t('promo.rulesTitle')}</Text>
          <View style={styles.rulesList}>
            <Text style={[styles.ruleItem, { fontSize: 13 * fontScale, lineHeight: 18 * fontScale }]}>• {t('promo.rule1')}</Text>
            <Text style={[styles.ruleItem, { fontSize: 13 * fontScale, lineHeight: 18 * fontScale }]}>• {t('promo.rule2')}</Text>
            <Text style={[styles.ruleItem, { fontSize: 13 * fontScale, lineHeight: 18 * fontScale }]}>• {t('promo.rule3')}</Text>
            <Text style={[styles.ruleItem, { fontSize: 13 * fontScale, lineHeight: 18 * fontScale }]}>• {t('promo.rule4')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/recharge')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('promo.ctaButton')}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={[styles.ctaText, { fontSize: 18 * fontScale }]}>{t('promo.ctaButton')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
  },
  heroGradient: {
    padding: 24,
    position: 'relative',
  },
  heroDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroCircle1: {
    width: 150,
    height: 150,
    top: -50,
    right: -30,
  },
  heroCircle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: -20,
  },
  heroContent: {
    position: 'relative',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
    lineHeight: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promoIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rulesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
