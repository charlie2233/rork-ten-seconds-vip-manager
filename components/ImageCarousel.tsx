import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Colors from '@/constants/colors';

export type CarouselImage = {
  key: string;
  source: any;
};

type Props = {
  images: CarouselImage[];
  height?: number;
  intervalMs?: number;
  autoPlay?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function ImageCarousel({
  images,
  height = 160,
  intervalMs = 3500,
  autoPlay = true,
  style,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = images.length;

  const canAutoPlay = autoPlay && count > 1 && containerWidth > 0;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = Math.round(e.nativeEvent.layout.width);
    if (nextWidth && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  }, [containerWidth]);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      if (!scrollRef.current || !containerWidth || count === 0) return;
      const next = ((index % count) + count) % count;
      scrollRef.current.scrollTo({ x: next * containerWidth, y: 0, animated });
      setActiveIndex(next);
    },
    [containerWidth, count]
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!containerWidth) return;
      const nextIndex = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
      setActiveIndex(nextIndex);
    },
    [containerWidth]
  );

  useEffect(() => {
    if (!canAutoPlay) return;
    const id = setInterval(() => {
      scrollToIndex(activeIndex + 1, true);
    }, intervalMs);
    return () => clearInterval(id);
  }, [activeIndex, canAutoPlay, intervalMs, scrollToIndex]);

  useEffect(() => {
    if (!containerWidth) return;
    scrollRef.current?.scrollTo({ x: activeIndex * containerWidth, y: 0, animated: false });
  }, [containerWidth]);

  const dots = useMemo(() => {
    return images.map((img, i) => {
      const isActive = i === activeIndex;
      return (
        <View
          key={`dot-${img.key}`}
          style={[
            styles.dot,
            isActive && styles.dotActive,
          ]}
        />
      );
    });
  }, [activeIndex, images]);

  if (count === 0) return null;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <View style={[styles.carousel, { height }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {images.map((img) => (
            <View key={img.key} style={{ width: containerWidth || 1, height }}>
              <Image source={img.source} style={styles.image} resizeMode="cover" />
            </View>
          ))}
        </ScrollView>

        {count > 1 ? <View style={styles.dotsRow}>{dots}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  carousel: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
  },
});

