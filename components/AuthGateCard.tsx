import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Lock, LogIn } from 'lucide-react-native';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import PressableScale from '@/components/PressableScale';
import Colors from '@/constants/colors';
import { useI18n } from '@/contexts/I18nContext';

type Props = {
  title: string;
  message?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function AuthGateCard({
  title,
  message,
  ctaLabel,
  onPressCta,
  style,
}: Props) {
  const { t } = useI18n();

  return (
    <View style={[styles.card, style]}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.iconCircle}>
        <Lock size={20} color={Colors.background} />
      </LinearGradient>

      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <PressableScale
        containerStyle={styles.ctaButton}
        onPress={onPressCta ?? (() => router.push('/login'))}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel ?? t('auth.login')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <LogIn size={16} color={Colors.background} />
          <Text style={styles.ctaText}>{ctaLabel ?? t('auth.login')}</Text>
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 18,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  ctaText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
});
