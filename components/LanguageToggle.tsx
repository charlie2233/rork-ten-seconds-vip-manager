import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Check, ChevronDown, Languages } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { Locale, useI18n } from '@/contexts/I18nContext';

type Props = {
  align?: 'left' | 'right';
  variant?: 'full' | 'icon';
  style?: StyleProp<ViewStyle>;
};

export default function LanguageToggle({
  style,
  variant = 'full',
  align = 'left',
}: Props) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const options = useMemo(
    (): { locale: Locale; label: string }[] => [
      { locale: 'zh', label: '中文' },
      { locale: 'en', label: 'English' },
      { locale: 'es', label: 'Español' },
    ],
    []
  );

  const currentLabel =
    options.find((opt) => opt.locale === locale)?.label ?? options[0]?.label ?? '中文';

  const chooseLanguage = async (next: Locale) => {
    await setLocale(next);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, variant === 'icon' && styles.iconButton, style]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${t('preferences.language')}: ${currentLabel}`}
        accessibilityHint={t('a11y.languageHint')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="language-toggle"
      >
        <Languages size={16} color={Colors.textSecondary} />
        {variant === 'full' ? (
          <>
            <Text style={styles.text}>{currentLabel}</Text>
            <ChevronDown size={16} color={Colors.textMuted} />
          </>
        ) : null}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              paddingTop: insets.top + 54,
              alignItems: align === 'right' ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsOpen(false)} />
          <View style={styles.menu}>
            {options.map((opt) => {
              const selected = opt.locale === locale;
              return (
                <TouchableOpacity
                  key={opt.locale}
                  style={styles.menuItem}
                  onPress={() => chooseLanguage(opt.locale)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.menuText, selected && styles.menuTextSelected]}>
                    {opt.label}
                  </Text>
                  {selected ? <Check size={18} color={Colors.primary} /> : <View style={styles.spacer} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    gap: 8,
    minHeight: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconButton: {
    width: 44,
    minHeight: 40,
    paddingHorizontal: 0,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  menu: {
    width: 220,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  menuTextSelected: {
    color: Colors.primary,
  },
  spacer: {
    width: 18,
    height: 18,
  },
});
