import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TimelinePoint } from '@/app/services/DashboardInsights';

type ThemePalette = {
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  background: string;
};

type Props = {
  data: TimelinePoint[];
  loading: boolean;
  colors: ThemePalette & Partial<Record<'success' | 'warning', string>>;
};

const CHART_HEIGHT = 140;

export function DashboardTimelineCard(props: Readonly<Props>) {
  const { data, loading, colors } = props;
  const hasData = data.length > 0;
  const maxValue = Math.max(1, ...data.map(point => Math.max(point.workload, point.alerts)));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Actividad semanal</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Carga operativa vs alertas críticas</Text>
        </View>
      </View>

      {hasData ? (
        <>
          <View style={styles.chartContainer}>
            {data.map(point => {
              const workloadHeight = Math.max(4, (point.workload / maxValue) * CHART_HEIGHT);
              const alertHeight = Math.max(4, (point.alerts / maxValue) * CHART_HEIGHT);
              return (
                <View key={point.label} style={styles.chartColumn}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[styles.workloadBar, {
                        height: workloadHeight,
                        backgroundColor: colors.primary,
                      }]}
                    />
                    <View
                      style={[styles.alertBar, {
                        height: alertHeight,
                        backgroundColor: colors.warning ?? '#f97316',
                      }]}
                    />
                  </View>
                  <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>{point.label}</Text>
                  <Text style={[styles.columnValue, { color: colors.text }]}>{point.workload}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Carga total</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning ?? '#f97316' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Alertas</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ color: colors.textSecondary }}>
            {loading ? 'Cargando actividad...' : 'No hay actividad reciente.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  workloadBar: {
    width: 18,
    borderRadius: 6,
    marginRight: 4,
  },
  alertBar: {
    width: 14,
    borderRadius: 6,
  },
  columnLabel: {
    fontSize: 11,
    marginTop: 8,
  },
  columnValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
});

export default DashboardTimelineCard;
