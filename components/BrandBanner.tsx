import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/contexts/SettingsContext';

type Props = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function BrandBanner({ title, subtitle, right, style }: Props) {
  const { t } = useI18n();
  const { fontScale, theme } = useSettings();

  const bannerColors = useMemo(() => {
    if (theme === 'warm') {
      return ['rgba(212,175,55,0.20)', 'rgba(201,169,98,0.08)', 'rgba(0,0,0,0.10)'] as const;
    }
    return ['rgba(201,169,98,0.16)', 'rgba(201,169,98,0.06)', 'rgba(0,0,0,0.10)'] as const;
  }, [theme]);

  const displayTitle = title ?? t('brand.shortName');
  const displaySubtitle = subtitle ?? t('brand.fullName');

  return (
    <View style={[styles.outer, style]}>
      <View style={styles.shadow}>
        <View style={styles.card}>
          <LinearGradient
            colors={bannerColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.row}>
            <View style={styles.left}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.textBlock}>
                <Text style={[styles.title, { fontSize: 18 * fontScale }]} numberOfLines={1}>
                  {displayTitle}
                </Text>
                <Text style={[styles.subtitle, { fontSize: 12 * fontScale }]} numberOfLines={1}>
                  {displaySubtitle}
                </Text>
              </View>
            </View>

            {right ? <View style={styles.right}>{right}</View> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
  },
  shadow: {
    borderRadius: 18,
    shadowColor: Colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 34,
    height: 34,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontWeight: '900' as const,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
});

