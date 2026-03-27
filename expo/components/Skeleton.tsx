import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';

type Props = {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

export default function Skeleton({ style, borderRadius = 12 }: Props) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.95,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.block, { borderRadius, opacity }, style]} />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: Colors.surfaceLight,
  },
});

