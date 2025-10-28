import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '@/app/stores/themeStore';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function Card(props: Readonly<Props>) {
  const { children, style } = props;
  const { getColors } = useThemeStore();
  const colors = getColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});

export default Card;
