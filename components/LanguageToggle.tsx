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
  style?: StyleProp<ViewStyle>;
};

export default function LanguageToggle({ style }: Props) {
  const { locale, setLocale } = useI18n();
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
        style={[styles.button, style]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
        testID="language-toggle"
      >
        <Languages size={16} color={Colors.textSecondary} />
        <Text style={styles.text}>{currentLabel}</Text>
        <ChevronDown size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={[styles.modalOverlay, { paddingTop: insets.top + 54 }]}>
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
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
    height: 48,
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
