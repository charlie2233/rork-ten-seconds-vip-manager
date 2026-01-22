import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Shield, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

type Step = 'phone' | 'code' | 'success';

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const controlHeight = Math.round(56 + Math.max(0, (fontScale - 1) * 14));
  const codeHeight = Math.round(64 + Math.max(0, (fontScale - 1) * 16));

  const handleSendCode = () => {
    if (!phone.trim() || phone.length < 11) {
      Alert.alert(t('forgot.error'), t('forgot.invalidPhone'));
      return;
    }
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setStep('code');
  };

  const handleVerifyCode = () => {
    if (!code.trim() || code.length < 4) {
      Alert.alert(t('forgot.error'), t('forgot.invalidCode'));
      return;
    }
    setStep('success');
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('auth.forgotPassword')} leftAction="back" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {step === 'phone' && (
          <>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.iconGradient}
              >
                <Phone size={32} color={Colors.background} />
              </LinearGradient>
            </View>
            <Text style={[styles.title, { fontSize: 24 * fontScale }]}>{t('forgot.phoneTitle')}</Text>
            <Text style={[styles.subtitle, { fontSize: 14 * fontScale, lineHeight: 20 * fontScale }]}>
              {t('forgot.phoneSubtitle')}
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputPrefix, { fontSize: 16 * fontScale }]}>+86</Text>
              <TextInput
                style={[styles.input, { fontSize: 16 * fontScale, height: controlHeight }]}
                placeholder={t('forgot.phonePlaceholder')}
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={11}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, !phone && styles.primaryButtonDisabled]}
              onPress={handleSendCode}
              disabled={!phone}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('forgot.sendCode')}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.buttonGradient, { height: controlHeight }]}
              >
                <Text style={[styles.buttonText, { fontSize: 18 * fontScale }]}>{t('forgot.sendCode')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {step === 'code' && (
          <>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.iconGradient}
              >
                <Shield size={32} color={Colors.background} />
              </LinearGradient>
            </View>
            <Text style={[styles.title, { fontSize: 24 * fontScale }]}>{t('forgot.codeTitle')}</Text>
            <Text style={[styles.subtitle, { fontSize: 14 * fontScale, lineHeight: 20 * fontScale }]}>
              {t('forgot.codeSubtitle', { phone: phone.slice(-4) })}
            </Text>

            <View style={styles.codeInputWrapper}>
              <TextInput
                style={[styles.codeInput, { fontSize: 28 * fontScale, height: codeHeight }]}
                placeholder="------"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResend}
              disabled={countdown > 0}
              accessibilityRole="button"
              accessibilityLabel={t('forgot.resend')}
            >
              <Text
                style={[
                  styles.resendText,
                  { fontSize: 14 * fontScale },
                  countdown > 0 && styles.resendTextDisabled,
                ]}
              >
                {countdown > 0
                  ? t('forgot.resendIn', { seconds: countdown.toString() })
                  : t('forgot.resend')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                code.length < 4 && styles.primaryButtonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={code.length < 4}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('forgot.verify')}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.buttonGradient, { height: controlHeight }]}
              >
                <Text style={[styles.buttonText, { fontSize: 18 * fontScale }]}>{t('forgot.verify')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {step === 'success' && (
          <>
            <View style={styles.iconContainer}>
              <View style={styles.successIcon}>
                <CheckCircle size={48} color={Colors.success} />
              </View>
            </View>
            <Text style={[styles.title, { fontSize: 24 * fontScale }]}>{t('forgot.successTitle')}</Text>
            <Text style={[styles.subtitle, { fontSize: 14 * fontScale, lineHeight: 20 * fontScale }]}>
              {t('forgot.successSubtitle')}
            </Text>

            <View style={styles.tempPasswordCard}>
              <Text style={[styles.tempPasswordLabel, { fontSize: 13 * fontScale }]}>{t('forgot.tempPassword')}</Text>
              <Text style={[styles.tempPasswordValue, { fontSize: 32 * fontScale }]}>888888</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/login')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('forgot.backToLogin')}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.buttonGradient, { height: controlHeight }]}
              >
                <Text style={[styles.buttonText, { fontSize: 18 * fontScale }]}>{t('forgot.backToLogin')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: 18,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: Colors.text,
    paddingHorizontal: 16,
  },
  codeInputWrapper: {
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 64,
    fontSize: 28,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 8,
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
  },
  resendTextDisabled: {
    color: Colors.textMuted,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  tempPasswordCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tempPasswordLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tempPasswordValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: 4,
  },
});
