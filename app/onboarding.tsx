import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, HelpCircle, MapPin, Sparkles, Wallet, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useI18n } from '@/contexts/I18nContext';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

const ONBOARDING_SEEN_KEY = 'onboarding_seen_v1';

type Slide = {
  key: string;
  icon: React.ReactNode;
  titleKey: string;
  bodyKey: string;
};

export default function OnboardingScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { backgroundGradient, fontScale } = useSettings();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1);
  const didMarkSeenRef = useRef(false);

  const markSeen = useCallback(async () => {
    if (didMarkSeenRef.current) return;
    didMarkSeenRef.current = true;
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      void markSeen();
    };
  }, [markSeen]);

  const slides: Slide[] = useMemo(
    () => [
      {
        key: 'balance',
        icon: <Wallet size={26} color={Colors.background} />,
        titleKey: 'onboarding.balance.title',
        bodyKey: 'onboarding.balance.body',
      },
      {
        key: 'points',
        icon: <Sparkles size={26} color={Colors.background} />,
        titleKey: 'onboarding.points.title',
        bodyKey: 'onboarding.points.body',
      },
      {
        key: 'coupons',
        icon: <Gift size={26} color={Colors.background} />,
        titleKey: 'onboarding.coupons.title',
        bodyKey: 'onboarding.coupons.body',
      },
      {
        key: 'storeOnly',
        icon: <MapPin size={26} color={Colors.background} />,
        titleKey: 'onboarding.storeOnly.title',
        bodyKey: 'onboarding.storeOnly.body',
      },
      {
        key: 'help',
        icon: <HelpCircle size={26} color={Colors.background} />,
        titleKey: 'onboarding.help.title',
        bodyKey: 'onboarding.help.body',
      },
    ],
    []
  );

  const isLast = activeIndex === slides.length - 1;

  const close = useCallback(async () => {
    await markSeen();
    router.back();
  }, [markSeen]);

  const goNext = useCallback(async () => {
    if (isLast) {
      await close();
      return;
    }
    const next = Math.min(slides.length - 1, activeIndex + 1);
    scrollRef.current?.scrollTo({ x: next * containerWidth, y: 0, animated: true });
    setActiveIndex(next);
  }, [activeIndex, close, containerWidth, isLast, slides.length]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
      setActiveIndex(Math.max(0, Math.min(slides.length - 1, next)));
    },
    [containerWidth, slides.length]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar
        title={t('onboarding.title')}
        right={
          <TouchableOpacity
            style={styles.closeButton}
            onPress={close}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      <View
        style={styles.carouselContainer}
        onLayout={(e) => setContainerWidth(Math.max(1, Math.round(e.nativeEvent.layout.width)))}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {slides.map((slide) => (
            <View key={slide.key} style={[styles.slide, { width: containerWidth }]}>
              <View style={styles.card}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.iconCircle}
                >
                  {slide.icon}
                </LinearGradient>
                <Text style={[styles.slideTitle, { fontSize: 20 * fontScale }]}>{t(slide.titleKey)}</Text>
                <Text style={[styles.slideBody, { fontSize: 14 * fontScale, lineHeight: 20 * fontScale }]}>
                  {t(slide.bodyKey)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotsRow}>
          {slides.map((s, i) => {
            const isActive = i === activeIndex;
            return <View key={`dot-${s.key}`} style={[styles.dot, isActive && styles.dotActive]} />;
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(18, insets.bottom + 12) }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={close}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.skipText, { fontSize: 14 * fontScale }]}>{t('common.skip')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={goNext}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            <Text style={[styles.nextText, { fontSize: 14 * fontScale }]}>
              {isLast ? t('onboarding.getStarted') : t('common.next')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
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
  carouselContainer: {
    flex: 1,
    paddingTop: 18,
  },
  slide: {
    paddingHorizontal: 18,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: 22,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  slideTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  slideBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  dotsRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  nextButton: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
});
