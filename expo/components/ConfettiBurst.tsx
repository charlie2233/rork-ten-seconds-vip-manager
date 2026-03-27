import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Colors from '@/constants/colors';

type Particle = {
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
};

type AnimatedParticle = {
  progress: Animated.Value;
};

type Props = {
  active: boolean;
  count?: number;
};

const COLOR_POOL = [
  Colors.primary,
  Colors.secondary,
  Colors.success,
  Colors.warning,
  '#FFFFFF',
] as const;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function ConfettiBurst({ active, count = 14 }: Props) {
  const particles = useMemo((): Particle[] => {
    return Array.from({ length: count }).map(() => ({
      x: rand(-120, 120),
      size: rand(6, 10),
      color: COLOR_POOL[Math.floor(rand(0, COLOR_POOL.length))] ?? Colors.primary,
      delay: Math.floor(rand(0, 180)),
      duration: Math.floor(rand(650, 1100)),
      drift: rand(-30, 30),
      rotate: rand(-220, 220),
    }));
  }, [count]);

  const anim = useRef<AnimatedParticle[]>(
    Array.from({ length: count }).map(() => ({ progress: new Animated.Value(0) }))
  ).current;

  useEffect(() => {
    if (!active) return;

    for (const a of anim) {
      a.progress.stopAnimation();
      a.progress.setValue(0);
    }

    const running = anim.map((a, idx) => {
      const p = particles[idx];
      return Animated.timing(a.progress, {
        toValue: 1,
        duration: p?.duration ?? 900,
        delay: p?.delay ?? 0,
        useNativeDriver: true,
      });
    });

    const group = Animated.stagger(20, running);
    group.start();
    return () => group.stop();
  }, [active, anim, particles]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {anim.map((a, idx) => {
        const p = particles[idx];
        if (!p) return null;

        const translateY = a.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 140],
        });

        const translateX = a.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.drift],
        });

        const opacity = a.progress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });

        const rotate = a.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotate}deg`],
        });

        return (
          <Animated.View
            key={`confetti-${idx}`}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                left: '50%',
                marginLeft: p.x,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    borderRadius: 3,
  },
});

