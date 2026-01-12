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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, CreditCard, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoggingIn, loginError } = useAuth();
  const { t } = useI18n();
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleLogin = async () => {
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
    } catch (e: any) {
      const key =
        typeof e?.message === 'string' && e.message.startsWith('auth.')
          ? e.message
          : 'auth.loginFailed';
      setErrorKey(key);
    }
  };

  const displayedErrorKey = errorKey ?? loginError;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight, Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.langToggle, { top: insets.top + 16 }]}>
        <LanguageToggle />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.content, { paddingTop: insets.top + 60 }]}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>十秒到</Text>
            </LinearGradient>
          </View>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <CreditCard size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={styles.input}
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
              style={styles.input}
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
            >
              {showPassword ? (
                <EyeOff size={20} color={Colors.textSecondary} />
              ) : (
                <Eye size={20} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {displayedErrorKey && (
            <Text style={styles.errorText}>{t(displayedErrorKey)}</Text>
          )}

          <TouchableOpacity
            style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoggingIn}
            activeOpacity={0.8}
            testID="login-button"
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              {isLoggingIn ? (
                <ActivityIndicator color={Colors.background} />
              ) : (
                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <TouchableOpacity>
              <Text style={styles.linkText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.linkText}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.firstLoginHint')}</Text>
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
  langToggle: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
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
    height: 56,
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
});
