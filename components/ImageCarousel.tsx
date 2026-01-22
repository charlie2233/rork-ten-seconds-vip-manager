import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Colors from '@/constants/colors';
import Skeleton from '@/components/Skeleton';

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
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const count = images.length;

  const prefetchSignature = useMemo(() => images.map((img) => img.key).join('|'), [images]);

  const canAutoPlay = autoPlay && count > 1 && containerWidth > 0;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const nextWidth = Math.round(e.nativeEvent.layout.width);
    if (nextWidth && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  }, [containerWidth]);

  useEffect(() => {
    setLoaded({});
  }, [count]);

  useEffect(() => {
    if (count === 0) return;
    (async () => {
      try {
        const uris = images
          .map((img) => {
            const src = img.source as any;
            if (typeof src === 'string') return src;
            if (src && typeof src === 'object' && typeof src.uri === 'string') return src.uri;
            return null;
          })
          .filter((v): v is string => typeof v === 'string' && v.length > 0);

        if (uris.length) {
          await Image.prefetch(uris, 'memory-disk').catch(() => false);
        }

        await Promise.all(
          images
            .map((img) => img.source)
            .filter((src) => typeof src === 'number')
            .map((src) => Image.loadAsync(src).catch(() => null))
        );
      } catch {
        // ignore
      }
    })();
  }, [count, images, prefetchSignature]);

  const markLoaded = useCallback((key: string) => {
    setLoaded((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

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
      const label = `Banner ${i + 1} of ${count}`;
      return (
        <TouchableOpacity
          key={`dot-${img.key}`}
          style={styles.dotButton}
          onPress={() => scrollToIndex(i, true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: isActive }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.dot, isActive && styles.dotActive]} />
        </TouchableOpacity>
      );
    });
  }, [activeIndex, count, images, scrollToIndex]);

  if (count === 0) return null;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <View style={[styles.carousel, { height }]}>
        {containerWidth ? (
          <>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              scrollEventThrottle={16}
            >
              {images.map((img) => {
                const isLoaded = !!loaded[img.key];
                return (
                  <View key={img.key} style={{ width: containerWidth, height }}>
                    <Image
                      source={img.source}
                      style={styles.image}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={180}
                      onLoadEnd={() => markLoaded(img.key)}
                      onError={() => markLoaded(img.key)}
                    />
                    {!isLoaded ? (
                      <View pointerEvents="none" style={styles.loadingOverlay}>
                        <Skeleton style={StyleSheet.absoluteFill} borderRadius={0} />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>

            {count > 1 ? <View style={styles.dotsRow}>{dots}</View> : null}
          </>
        ) : (
          <Skeleton style={StyleSheet.absoluteFill} borderRadius={0} />
        )}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  dotButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
