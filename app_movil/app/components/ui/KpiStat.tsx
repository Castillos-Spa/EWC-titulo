import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TrendTone } from '@/app/utils/dashboard';
import { useThemeStore } from '@/app/stores/themeStore';

type Props = {
  label: string;
  value: string;
  trend?: string;
  tone?: TrendTone;
};

export function KpiStat(props: Readonly<Props>) {
  const { label, value, trend, tone = 'neutral' } = props;
  const { getColors } = useThemeStore();
  const colors = getColors();

  let toneColor = colors.textSecondary;
  if (tone === 'up') toneColor = colors.success;
  else if (tone === 'down') toneColor = colors.error;

  return (
    <View style={styles.col}>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      {trend ? (
        <Text style={[styles.trend, { color: toneColor }]} numberOfLines={1}>{trend}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    minWidth: 120,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  trend: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default KpiStat;
