import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Volume2, Vibrate, Globe, Eye, ChevronRight, User, ZapOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n, Locale } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { FontSize, useSettings } from '@/contexts/SettingsContext';
import TopBar from '@/components/TopBar';

const LANGUAGES: { key: Locale; label: string }[] = [
  { key: 'zh', label: '中文' },
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Español' },
];

const FONT_SIZES: { key: FontSize; labelKey: string }[] = [
  { key: 'sm', labelKey: 'preferences.fontSize.small' },
  { key: 'md', labelKey: 'preferences.fontSize.default' },
  { key: 'lg', labelKey: 'preferences.fontSize.large' },
  { key: 'xl', labelKey: 'preferences.fontSize.xlarge' },
];

export default function PreferencesScreen() {
  const { t, locale, setLocale } = useI18n();
  const { user, setUserName } = useAuth();
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    hideBalance,
    setHideBalance,
    backgroundGradient,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    reduceMotion,
    setReduceMotion,
  } = useSettings();
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showFontSheet, setShowFontSheet] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingName, setPendingName] = useState('');

  const currentLanguage = LANGUAGES.find((l) => l.key === locale)?.label || '中文';
  const currentFontLabelKey =
    FONT_SIZES.find((f) => f.key === fontSize)?.labelKey ?? 'preferences.fontSize.default';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('preferences.title')} leftAction="back" />

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
                <Text style={styles.rowLabel}>{t('preferences.theme')}</Text>
              </View>
              <Switch
                value={theme === 'warm'}
                onValueChange={(next) => setTheme(next ? 'warm' : 'classic')}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setShowFontSheet((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Text style={styles.fontIconText}>Aa</Text>
                </View>
                <Text style={styles.rowLabel}>{t('preferences.fontSize')}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{t(currentFontLabelKey)}</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>

            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Eye size={20} color={Colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{t('preferences.hideBalance')}</Text>
              </View>
              <Switch
                value={hideBalance}
                onValueChange={setHideBalance}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <ZapOff size={20} color={Colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{t('preferences.reduceMotion')}</Text>
              </View>
              <Switch
                value={reduceMotion}
                onValueChange={setReduceMotion}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                setPendingName(user.name ?? '');
                setShowNameModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <User size={20} color={Colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{t('preferences.userName')}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{user?.name ?? t('auth.login')}</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>

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

        {showFontSheet && (
          <View style={styles.languageSheet}>
            {FONT_SIZES.map((opt) => {
              const selected = opt.key === fontSize;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.languageOption, selected && styles.languageOptionActive]}
                  onPress={() => {
                    setFontSize(opt.key);
                    setShowFontSheet(false);
                  }}
                >
                  <Text style={[styles.languageText, selected && styles.languageTextActive]}>
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Modal
          visible={showNameModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNameModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowNameModal(false)}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalCenter}
            >
              <Pressable style={styles.modalCard} onPress={() => {}}>
                <Text style={styles.modalTitle}>{t('preferences.userName')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={pendingName}
                  onChangeText={setPendingName}
                  placeholder={t('preferences.userNamePlaceholder')}
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                  maxLength={24}
                  returnKeyType="done"
                  onSubmitEditing={async () => {
                    await setUserName(pendingName);
                    setShowNameModal(false);
                  }}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => setShowNameModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalButtonSecondaryText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={async () => {
                      await setUserName(pendingName);
                      setShowNameModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonPrimaryText}>{t('common.ok')}</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>

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
  fontIconText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.3,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 24,
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonSecondaryText: {
    color: Colors.text,
    fontWeight: '700' as const,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  modalButtonPrimaryText: {
    color: Colors.background,
    fontWeight: '800' as const,
  },
});
