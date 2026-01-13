import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

type Props = {
  images: ImageSourcePropType[];
  autoPlay?: boolean;
  intervalMs?: number;
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
};

export default function ImageCarousel({
  images,
  autoPlay = true,
  intervalMs = 3500,
  aspectRatio = 16 / 9,
  style,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const isDraggingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || images.length <= 1 || !containerWidth) return;

    const timer = setInterval(() => {
      if (isDraggingRef.current) return;
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, containerWidth, images.length, intervalMs]);

  useEffect(() => {
    if (!containerWidth || images.length === 0) return;
    scrollRef.current?.scrollTo({ x: activeIndex * containerWidth, animated: true });
  }, [activeIndex, containerWidth, images.length]);

  if (images.length === 0) return null;

  const height = containerWidth ? Math.round(containerWidth / aspectRatio) : 0;

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!containerWidth) return;
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
    setActiveIndex(Math.max(0, Math.min(images.length - 1, nextIndex)));
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <View style={[styles.viewport, height ? { height } : null]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          onMomentumScrollEnd={handleMomentumEnd}
          onScrollBeginDrag={() => {
            isDraggingRef.current = true;
          }}
          onScrollEndDrag={() => {
            isDraggingRef.current = false;
          }}
          scrollEventThrottle={16}
        >
          {images.map((img, index) => (
            <View key={index} style={{ width: containerWidth, height }}>
              <Image
                source={img}
                style={styles.image}
                contentFit="cover"
                transition={250}
              />
              <View style={styles.imageOverlay} />
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.dotsRow}>
        {images.map((_, index) => {
          const active = index === activeIndex;
          return <View key={index} style={[styles.dot, active && styles.dotActive]} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  viewport: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  dotsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
    opacity: 0.7,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
    opacity: 1,
  },
});

