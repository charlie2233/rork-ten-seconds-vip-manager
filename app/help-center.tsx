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
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Gift,
  Wallet,
  ShieldCheck,
  HelpCircle,
  MessageCircle,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';
import Colors from '@/constants/colors';

type FAQ = {
  id: string;
  questionKey: string;
  answerKey: string;
  icon: React.ElementType;
};

const FAQ_LIST: FAQ[] = [
  {
    id: '1',
    questionKey: 'help.faq.recharge.q',
    answerKey: 'help.faq.recharge.a',
    icon: Wallet,
  },
  {
    id: '2',
    questionKey: 'help.faq.coupon.q',
    answerKey: 'help.faq.coupon.a',
    icon: Gift,
  },
  {
    id: '3',
    questionKey: 'help.faq.points.q',
    answerKey: 'help.faq.points.a',
    icon: CreditCard,
  },
  {
    id: '4',
    questionKey: 'help.faq.tier.q',
    answerKey: 'help.faq.tier.a',
    icon: ShieldCheck,
  },
  {
    id: '5',
    questionKey: 'help.faq.password.q',
    answerKey: 'help.faq.password.a',
    icon: HelpCircle,
  },
];

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
        <Text style={styles.headerTitle}>{t('help.title')}</Text>
        <LanguageToggle variant="icon" align="right" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{t('help.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('help.heroSubtitle')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('help.faqTitle')}</Text>

        <View style={styles.faqList}>
          {FAQ_LIST.map((faq) => {
            const IconComponent = faq.icon;
            const isExpanded = expandedId === faq.id;
            return (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleExpand(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqLeft}>
                    <View style={styles.faqIcon}>
                      <IconComponent size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.faqQuestion}>{t(faq.questionKey)}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.answerText}>{t(faq.answerKey)}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>{t('help.stillNeedHelp')}</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/support-chat')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.contactGradient}
            >
              <MessageCircle size={20} color={Colors.background} />
              <Text style={styles.contactButtonText}>{t('help.contactSupport')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

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
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  faqList: {
    gap: 12,
    marginBottom: 32,
  },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  faqIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  answerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    paddingTop: 16,
  },
  contactSection: {
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  contactButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 10,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
