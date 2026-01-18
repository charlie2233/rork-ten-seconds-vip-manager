import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';
import Layout from '@/constants/layout';

type Props = {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function EmptyState({ title, message, icon, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={['rgba(201,169,98,0.14)', 'rgba(0,0,0,0.0)']}
        style={StyleSheet.absoluteFill}
      />
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Layout.cardPadding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.16)',
    marginBottom: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '900' as const,
    textAlign: 'center',
  },
  message: {
    marginTop: 6,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

