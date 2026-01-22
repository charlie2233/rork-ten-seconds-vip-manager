import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Gift,
  Wallet,
  ShieldCheck,
  HelpCircle,
  MessageCircle,
  Send,
  Lightbulb,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

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
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [isSending, setIsSending] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSendSuggestion = async () => {
    if (!suggestion.trim()) {
      Alert.alert(t('common.error'), t('help.suggestion.empty'));
      return;
    }

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const subject = encodeURIComponent('App Suggestion / 应用建议');
    const body = encodeURIComponent(suggestion);
    const mailtoUrl = `mailto:charliehan112@gmail.com?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setSuggestion('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(t('common.error'), t('help.suggestion.noEmail'));
      }
    } catch (error) {
      console.log('Error opening email:', error);
      Alert.alert(t('common.error'), t('help.suggestion.failed'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('help.title')} leftAction="back" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { fontSize: 24 * fontScale }]}>{t('help.heroTitle')}</Text>
          <Text style={[styles.heroSubtitle, { fontSize: 14 * fontScale }]}>{t('help.heroSubtitle')}</Text>
        </View>

        <Text style={[styles.sectionTitle, { fontSize: 16 * fontScale }]}>{t('help.faqTitle')}</Text>

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
                  accessibilityRole="button"
                  accessibilityLabel={t(faq.questionKey)}
                  accessibilityState={{ expanded: isExpanded }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={styles.faqLeft}>
                    <View style={styles.faqIcon}>
                      <IconComponent size={18} color={Colors.primary} />
                    </View>
                    <Text style={[styles.faqQuestion, { fontSize: 15 * fontScale }]}>{t(faq.questionKey)}</Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqAnswer}>
                    <Text style={[styles.answerText, { fontSize: 14 * fontScale, lineHeight: 22 * fontScale }]}>
                      {t(faq.answerKey)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.suggestionSection}>
          <View style={styles.suggestionHeader}>
            <Lightbulb size={20} color={Colors.primary} />
            <Text style={[styles.suggestionTitle, { fontSize: 16 * fontScale }]}>{t('help.suggestion.title')}</Text>
          </View>
          <Text style={[styles.suggestionSubtitle, { fontSize: 13 * fontScale }]}>{t('help.suggestion.subtitle')}</Text>
          <View style={styles.suggestionInputContainer}>
            <TextInput
              style={[styles.suggestionInput, { fontSize: 15 * fontScale }]}
              placeholder={t('help.suggestion.placeholder')}
              placeholderTextColor={Colors.textMuted}
              value={suggestion}
              onChangeText={setSuggestion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !suggestion.trim() && styles.sendButtonDisabled]}
            onPress={handleSendSuggestion}
            activeOpacity={0.8}
            disabled={isSending || !suggestion.trim()}
            accessibilityRole="button"
            accessibilityLabel={t('help.suggestion.send')}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <>
                <Send size={18} color={Colors.background} />
                <Text style={[styles.sendButtonText, { fontSize: 15 * fontScale }]}>{t('help.suggestion.send')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.contactSection}>
          <Text style={[styles.contactTitle, { fontSize: 14 * fontScale }]}>{t('help.stillNeedHelp')}</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/support-chat')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('help.contactSupport')}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.contactGradient}
            >
              <MessageCircle size={20} color={Colors.background} />
              <Text style={[styles.contactButtonText, { fontSize: 16 * fontScale }]}>{t('help.contactSupport')}</Text>
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
  suggestionSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  suggestionInputContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  suggestionInput: {
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 100,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.background,
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
