import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Phone, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

export default function RegisterScreen() {
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const controlHeight = Math.round(56 + Math.max(0, (fontScale - 1) * 14));

  const handleRegister = () => {
    if (!name.trim()) {
      Alert.alert(t('register.error'), t('register.nameRequired'));
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      Alert.alert(t('register.error'), t('register.phoneInvalid'));
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert(t('register.error'), t('register.passwordWeak'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('register.error'), t('register.passwordMismatch'));
      return;
    }
    if (!agreed) {
      Alert.alert(t('register.error'), t('register.agreeRequired'));
      return;
    }

    Alert.alert(
      t('register.successTitle'),
      t('register.successMessage'),
      [
        {
          text: t('common.ok'),
          onPress: () => router.replace('/login'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('register.title')} leftAction="back" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.logoGradient}
          >
            <Text style={[styles.logoText, { fontSize: 28 * fontScale }]}>{t('brand.shortName')}</Text>
          </LinearGradient>
        </View>

        <Text style={[styles.subtitle, { fontSize: 14 * fontScale }]}>{t('register.subtitle')}</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <User size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: 16 * fontScale, height: controlHeight }]}
              placeholder={t('register.namePlaceholder')}
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Phone size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: 16 * fontScale, height: controlHeight }]}
              placeholder={t('register.phonePlaceholder')}
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Lock size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: 16 * fontScale, height: controlHeight }]}
              placeholder={t('register.passwordPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.textSecondary} />
              ) : (
                <Eye size={20} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Lock size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: 16 * fontScale, height: controlHeight }]}
              placeholder={t('register.confirmPasswordPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={Colors.textSecondary} />
              ) : (
                <Eye size={20} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.agreeRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            <View
              style={[styles.checkbox, agreed && styles.checkboxChecked]}
            >
              {agreed && <CheckCircle size={16} color={Colors.background} />}
            </View>
            <Text style={[styles.agreeText, { fontSize: 13 * fontScale, lineHeight: 20 * fontScale }]}>
              {t('register.agreePrefix')}{' '}
              <Text style={styles.agreeLink}>{t('register.terms')}</Text>
              {' '}{t('register.and')}{' '}
              <Text style={styles.agreeLink}>{t('register.privacy')}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.registerGradient, { height: controlHeight }]}
            >
              <Text style={[styles.registerButtonText, { fontSize: 18 * fontScale }]}>{t('register.submit')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { fontSize: 14 * fontScale }]}>{t('register.hasAccount')}</Text>
            <TouchableOpacity onPress={() => router.replace('/login')} accessibilityRole="button">
              <Text style={[styles.loginLink, { fontSize: 14 * fontScale }]}>{t('register.loginNow')}</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  logoGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.background,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 16,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  agreeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  agreeLink: {
    color: Colors.primary,
  },
  registerButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  registerGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.background,
    letterSpacing: 2,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
});
