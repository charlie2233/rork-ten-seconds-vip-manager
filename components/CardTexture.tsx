import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect, LinearGradient, Stop } from 'react-native-svg';

export type TextureType = 'brushed' | 'grain' | 'carbon' | 'none';

interface CardTextureProps {
  type: TextureType;
  opacity?: number;
  color?: string;
}

export const CardTexture: React.FC<CardTextureProps> = ({ type, opacity = 0.1, color = '#FFF' }) => {
  if (type === 'none') return null;

  return (
    <View style={[StyleSheet.absoluteFill, { opacity, overflow: 'hidden' }]}>
      <Svg height="100%" width="100%">
        <Defs>
          {type === 'brushed' && (
            <LinearGradient id="brushedGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color} stopOpacity="0.1" />
              <Stop offset="0.2" stopColor={color} stopOpacity="0.3" />
              <Stop offset="0.4" stopColor={color} stopOpacity="0.1" />
              <Stop offset="0.6" stopColor={color} stopOpacity="0.3" />
              <Stop offset="0.8" stopColor={color} stopOpacity="0.1" />
              <Stop offset="1" stopColor={color} stopOpacity="0.3" />
            </LinearGradient>
          )}
          
          {type === 'carbon' && (
             <Pattern
               id="carbonPattern"
               patternUnits="userSpaceOnUse"
               width="8"
               height="8"
               patternTransform="rotate(45)"
             >
               <Rect x="0" y="0" width="4" height="4" fill={color} opacity="0.5" />
               <Rect x="4" y="4" width="4" height="4" fill={color} opacity="0.5" />
             </Pattern>
          )}

          {type === 'grain' && (
            <Pattern
                id="grainPattern"
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
            >
                <Rect x="0" y="0" width="1" height="1" fill={color} opacity="0.3" />
                <Rect x="2" y="2" width="1" height="1" fill={color} opacity="0.3" />
            </Pattern>
          )}
        </Defs>

        {type === 'brushed' && (
           <Rect width="100%" height="100%" fill="url(#brushedGrad)" />
        )}

        {type === 'carbon' && (
           <Rect width="100%" height="100%" fill="url(#carbonPattern)" />
        )}

        {type === 'grain' && (
            <Rect width="100%" height="100%" fill="url(#grainPattern)" />
        )}
      </Svg>
    </View>
  );
};
