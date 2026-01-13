import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Moon, Volume2, Vibrate, Globe, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n, Locale } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';
import Colors from '@/constants/colors';

const LANGUAGES: { key: Locale; label: string }[] = [
  { key: 'zh', label: '中文' },
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Español' },
];

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useI18n();
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);

  const currentLanguage = LANGUAGES.find((l) => l.key === locale)?.label || '中文';

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
        <Text style={styles.headerTitle}>{t('preferences.title')}</Text>
        <LanguageToggle variant="icon" align="right" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences.displaySection')}</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Moon size={20} color={Colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{t('preferences.darkMode')}</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>

            <TouchableOpacity
              style={[styles.menuRow, styles.lastRow]}
              onPress={() => setShowLanguageSheet(!showLanguageSheet)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Globe size={20} color={Colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{t('preferences.language')}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{currentLanguage}</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {showLanguageSheet && (
          <View style={styles.languageSheet}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.languageOption,
                  locale === lang.key && styles.languageOptionActive,
                ]}
                onPress={() => {
                  setLocale(lang.key);
                  setShowLanguageSheet(false);
                }}
              >
                <Text
                  style={[
                    styles.languageText,
                    locale === lang.key && styles.languageTextActive,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences.soundSection')}</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Volume2 size={20} color={Colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{t('preferences.sound')}</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>

            <View style={[styles.toggleRow, styles.lastRow]}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Vibrate size={20} color={Colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{t('preferences.vibration')}</Text>
              </View>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>
          </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 6,
  },
  languageSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  languageOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageOptionActive: {
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
  },
  languageText: {
    fontSize: 15,
    color: Colors.text,
  },
  languageTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
