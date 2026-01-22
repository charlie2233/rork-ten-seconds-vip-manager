import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, WifiOff } from 'lucide-react-native';
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';
import { useSettings } from '@/contexts/SettingsContext';

type Props = {
  title: string;
  message?: string;
  lastUpdated?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export default function OfflineBanner({
  title,
  message,
  lastUpdated,
  onRetry,
  retryLabel,
  style,
}: Props) {
  const { fontScale } = useSettings();

  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={['rgba(255,152,0,0.16)', 'rgba(0,0,0,0.0)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <WifiOff size={18} color={Colors.warning} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.title, { fontSize: 13 * fontScale }]}>{title}</Text>
          {message ? (
            <Text style={[styles.message, { fontSize: 12 * fontScale, lineHeight: 16 * fontScale }]}>
              {message}
            </Text>
          ) : null}
          {lastUpdated ? (
            <Text style={[styles.meta, { fontSize: 11 * fontScale }]}>{lastUpdated}</Text>
          ) : null}
        </View>

        {onRetry ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={retryLabel ?? 'Retry'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RotateCcw size={16} color={Colors.background} />
            <Text style={[styles.retryText, { fontSize: 12 * fontScale }]}>{retryLabel ?? 'Retry'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.28)',
    backgroundColor: Colors.surface,
    padding: Layout.cardPadding,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,152,0,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.20)',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '900' as const,
  },
  message: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  meta: {
    marginTop: 6,
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 999,
    backgroundColor: Colors.warning,
  },
  retryText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '900' as const,
  },
});
