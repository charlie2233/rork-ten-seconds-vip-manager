import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

export default function PressableScale({
  children,
  containerStyle,
  scaleTo = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) {
          Animated.spring(scale, {
            toValue: scaleTo,
            useNativeDriver: true,
            speed: 20,
            bounciness: 2,
          }).start();
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 2,
        }).start();
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[{ transform: [{ scale }] }, containerStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

