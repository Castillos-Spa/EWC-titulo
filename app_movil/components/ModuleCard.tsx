import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ModuleHighlight } from '@/utils/dashboard';

export type ThemePalette = {
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  background: string;
  primary: string;
  success?: string;
};

type Props = {
  title: string;
  highlights: ModuleHighlight[];
  colors: ThemePalette;
  onPress?: () => void;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  gradientFrom?: string;
  gradientTo?: string;
};

export function ModuleCard(props: Readonly<Props>) {
  const { title, highlights, colors, onPress, icon: Icon, gradientFrom, gradientTo } = props;
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress as any}
    >
      {gradientFrom && gradientTo ? (
        <LinearGradient
          colors={[gradientFrom, gradientTo]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBg}
        />
      ) : null}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {Icon ? (
          <View style={[styles.iconWrap, { backgroundColor: colors.background + '66' }]}>
            <Icon size={18} color={colors.primary} />
          </View>
        ) : null}
      </View>
      <View style={styles.items}>
        {highlights.slice(0, 3).map((h) => {
          let toneColor = colors.textSecondary;
          if (h.trendTone === 'up') toneColor = colors.success ?? '#16A34A';
          else if (h.trendTone === 'down') toneColor = '#DC2626';
          return (
            <View key={h.label} style={styles.itemRow}>
              <Text style={[styles.itemLabel, { color: colors.textSecondary }]} numberOfLines={1}>{h.label}</Text>
              <Text style={[styles.itemValue, { color: colors.text }]}>{h.value}</Text>
              {h.trend ? (
                <Text style={[styles.itemTrend, { color: toneColor }]} numberOfLines={1}>{h.trend}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    margin: 6,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  items: {
    gap: 10,
  },
  itemRow: {
    gap: 4,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemTrend: {
    fontSize: 12,
  },
});

export default ModuleCard;
