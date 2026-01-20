import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { HelpCircle, BookOpen, MessageSquare, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';

type ChipType = 'howItWorks' | 'faq' | 'aiChat';

interface ChipConfig {
  type: ChipType;
  icon: React.ElementType;
  labelKey: string;
  route: string;
  color: string;
  bgColor: string;
}

const CHIP_CONFIGS: ChipConfig[] = [
  {
    type: 'howItWorks',
    icon: BookOpen,
    labelKey: 'helpChips.howItWorks',
    route: '/how-it-works',
    color: Colors.primary,
    bgColor: 'rgba(201, 169, 98, 0.12)',
  },
  {
    type: 'faq',
    icon: HelpCircle,
    labelKey: 'helpChips.faq',
    route: '/help-center',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
  },
  {
    type: 'aiChat',
    icon: MessageSquare,
    labelKey: 'helpChips.askAI',
    route: '/support-chat',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
  },
];

interface ContextualHelpChipsProps {
  chips?: ChipType[];
  style?: object;
  scrollable?: boolean;
  showTitle?: boolean;
  compact?: boolean;
}

export default function ContextualHelpChips({
  chips = ['howItWorks', 'faq', 'aiChat'],
  style,
  scrollable = true,
  showTitle = false,
  compact = false,
}: ContextualHelpChipsProps) {
  const { t } = useI18n();

  const visibleChips = CHIP_CONFIGS.filter((config) => chips.includes(config.type));

  const renderChips = () => (
    <>
      {visibleChips.map((config) => {
        const IconComponent = config.icon;
        return (
          <TouchableOpacity
            key={config.type}
            style={[
              styles.chip,
              { backgroundColor: config.bgColor },
              compact && styles.chipCompact,
            ]}
            onPress={() => router.push(config.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.chipIconContainer, { backgroundColor: config.bgColor }]}>
              {config.type === 'aiChat' ? (
                <Sparkles size={compact ? 14 : 16} color={config.color} />
              ) : (
                <IconComponent size={compact ? 14 : 16} color={config.color} />
              )}
            </View>
            <Text style={[styles.chipText, { color: config.color }, compact && styles.chipTextCompact]}>
              {t(config.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );

  return (
    <View style={[styles.container, style]}>
      {showTitle && (
        <Text style={styles.title}>{t('helpChips.title')}</Text>
      )}
      {scrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderChips()}
        </ScrollView>
      ) : (
        <View style={styles.staticContent}>
          {renderChips()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 10,
    marginLeft: 2,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 10,
  },
  staticContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  chipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  chipIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  chipTextCompact: {
    fontSize: 12,
  },
});
