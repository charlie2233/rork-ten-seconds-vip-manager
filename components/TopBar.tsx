import { router } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useSettings } from '@/contexts/SettingsContext';
import LanguageToggle from '@/components/LanguageToggle';

type LeftAction = 'back' | 'close' | 'none';

type Props = {
  title?: string;
  leftAction?: LeftAction;
  onPressLeft?: () => void;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function TopBar({
  title,
  leftAction = 'none',
  onPressLeft,
  right,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const { fontScale } = useSettings();

  const LeftIcon = leftAction === 'close' ? X : ArrowLeft;
  const showLeft = leftAction !== 'none';

  const computedTitleStyle = useMemo(() => {
    const size = 16 * fontScale;
    return { fontSize: size };
  }, [fontScale]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }, style]}>
      <View style={styles.row}>
        <View style={styles.leftCluster}>
          {showLeft ? (
            <TouchableOpacity
              style={styles.leftButton}
              onPress={onPressLeft ?? (() => router.back())}
              activeOpacity={0.75}
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <LeftIcon size={20} color={Colors.text} />
            </TouchableOpacity>
          ) : null}

          <LanguageToggle variant="icon" align="left" />
        </View>

        <Text style={[styles.title, computedTitleStyle]} numberOfLines={1}>
          {title ?? ''}
        </Text>

        <View style={styles.rightCluster}>{right ?? <View style={{ width: 44 }} />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 88,
  },
  leftButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
  },
  rightCluster: {
    minWidth: 88,
    alignItems: 'flex-end',
  },
});

