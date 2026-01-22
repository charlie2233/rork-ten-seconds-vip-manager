import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, CreditCard, Lock, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurity } from '@/contexts/SecurityContext';
import Colors from '@/constants/colors';
import { useI18n } from '@/contexts/I18nContext';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

export default function LoginScreen() {
  const { login, enterGuestMode, isLoggingIn, loginError } = useAuth();
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();
  const { 
    isAccountLocked, 
    getRemainingAttempts, 
    lockoutRemaining, 
    maxAttempts,
    recordLoginAttempt,
    createSession 
  } = useSecurity();
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleLogin = async () => {
    if (isAccountLocked()) {
      setErrorKey('auth.accountLocked');
      return;
    }
    if (!memberId.trim()) {
      setErrorKey('auth.memberIdRequired');
      return;
    }
    if (!password.trim()) {
      setErrorKey('auth.passwordRequired');
      return;
    }
    setErrorKey(null);
    try {
      await login(memberId, password);
      await recordLoginAttempt(memberId, true);
      await createSession();
      router.replace('/');
    } catch (e: any) {
      await recordLoginAttempt(memberId, false);
      const remaining = getRemainingAttempts();
      if (remaining <= 0) {
        setErrorKey('auth.accountLocked');
      } else {
        const key =
          typeof e?.message === 'string' && e.message.startsWith('auth.')
            ? e.message
            : 'auth.loginFailed';
        setErrorKey(key);
      }
    }
  };

  const displayedErrorKey = errorKey ?? loginError;
  const controlHeight = Math.round(56 + Math.max(0, (fontScale - 1) * 14));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar
        title={t('auth.login')}
        right={
          <TouchableOpacity
            style={styles.closeButton}
            onPress={async () => {
              await enterGuestMode();
              router.replace('/');
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="login-close"
          >
            <X size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        }
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.content, { paddingTop: 24 }]}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.logoGradient}
            >
              <Text style={[styles.logoText, { fontSize: 36 * fontScale }]}>{t('brand.shortName')}</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.subtitle, { fontSize: 16 * fontScale }]}>{t('auth.subtitle')}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <CreditCard size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: 16 * fontScale, height: controlHeight }]}
              placeholder={t('auth.memberId')}
              placeholderTextColor={Colors.textMuted}
              value={memberId}
              onChangeText={setMemberId}
              autoCapitalize="characters"
              autoCorrect={false}
              testID="member-id-input"
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Lock size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: 16 * fontScale, height: controlHeight }]}
              placeholder={t('auth.password')}
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              testID="password-input"
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

          {isAccountLocked() && lockoutRemaining > 0 ? (
            <View style={styles.lockoutContainer}>
              <Text style={[styles.lockoutText, { fontSize: 14 * fontScale }]}>
                {t('auth.accountLockedTimer', { minutes: Math.ceil(lockoutRemaining / 60) })}
              </Text>
            </View>
          ) : displayedErrorKey ? (
            <View>
              <Text style={[styles.errorText, { fontSize: 14 * fontScale }]}>{t(displayedErrorKey)}</Text>
              {getRemainingAttempts() < maxAttempts && getRemainingAttempts() > 0 && (
                <Text style={[styles.attemptsText, { fontSize: 12 * fontScale }]}>
                  {t('auth.remainingAttempts', { count: getRemainingAttempts() })}
                </Text>
              )}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginButton, (isLoggingIn || isAccountLocked()) && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoggingIn || isAccountLocked()}
            activeOpacity={0.8}
            testID="login-button"
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.loginGradient, { height: controlHeight }]}
            >
              {isLoggingIn ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={[styles.loginButtonText, { fontSize: 18 * fontScale }]}>{t('auth.login')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={() => router.push('/forgot-password')} accessibilityRole="button">
              <Text style={[styles.linkText, { fontSize: 14 * fontScale }]}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/register')} accessibilityRole="button">
              <Text style={[styles.linkText, { fontSize: 14 * fontScale }]}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { fontSize: 12 * fontScale }]}>{t('auth.firstLoginHint')}</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.background,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  formContainer: {
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
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.background,
    letterSpacing: 2,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  lockoutContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  lockoutText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  attemptsText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center' as const,
    marginTop: 4,
  },
});
