import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { TrendingUp, Gauge, Fuel, Award, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import type { FuelAnalyticsSnapshot, FuelEfficiencyBadge } from '@/stores/fuelStore';

interface FuelAnalyticsProps {
  readonly analytics: FuelAnalyticsSnapshot | null;
}

export function FuelAnalytics({ analytics }: FuelAnalyticsProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();
  if (!analytics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          No hay suficientes datos para mostrar análisis
        </Text>
      </View>
    );
  }

  const getEfficiencyColor = (efficiency: FuelEfficiencyBadge) => {
    switch (efficiency) {
      case 'excellent': return '#16A34A';
      case 'good': return '#65A30D';
      case 'watch': return '#D97706';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getEfficiencyIcon = (efficiency: FuelEfficiencyBadge) => {
    switch (efficiency) {
      case 'excellent': return Award;
      case 'good':
      case 'watch':
        return TrendingUp;
      case 'critical':
        return AlertTriangle;
      default:
        return Gauge;
    }
  };

  const getEfficiencyLabel = (efficiency: FuelEfficiencyBadge) => {
    const labels = {
      excellent: 'Excelente',
      good: 'Buena',
      watch: 'Vigilancia',
      critical: 'Crítica',
      unknown: 'Sin datos',
    };
    return labels[efficiency as keyof typeof labels] || efficiency;
  };

  const efficiencyColor = getEfficiencyColor(analytics.efficiency);
  const EfficiencyIcon = getEfficiencyIcon(analytics.efficiency);

  const formatLastRefuel = () => {
    if (!analytics.lastRefuel) return 'No registrado';
    const date = new Date(analytics.lastRefuel.date);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Hoy';
    if (daysAgo === 1) return 'Ayer';
    return `Hace ${daysAgo} días`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Análisis de Combustible</Text>
      
      {/* Main Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={styles.statIcon}>
            <Gauge size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {analytics.averageConsumption > 0 ? analytics.averageConsumption.toFixed(1) : '--'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>L/100 km</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={styles.statIcon}>
            <TrendingUp size={24} color={colors.success} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {analytics.totalLiters.toFixed(1)} L
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Litros cargados</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <View style={styles.statIcon}>
            <Fuel size={24} color={colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {analytics.totalDistance > 0 ? analytics.totalDistance.toLocaleString('es-CL') : '--'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>KM recorridos</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}> 
          <View style={styles.statIcon}>
            <EfficiencyIcon size={24} color={efficiencyColor} />
          </View>
          <Text style={[styles.statValue, { color: efficiencyColor }]}>
            {getEfficiencyLabel(analytics.efficiency)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Eficiencia</Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.additionalInfo}>
        <View style={styles.infoRow}>
          <Fuel size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Última carga</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatLastRefuel()}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <TrendingUp size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Número de cargas</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{analytics.refuelCount}</Text>
          </View>
        </View>

        {analytics.efficiency === 'critical' && (
          <View style={[styles.tipsCard, { backgroundColor: `${colors.warning}15`, borderLeftColor: colors.warning }]}>
            <AlertTriangle size={20} color={colors.warning} />
            <View style={styles.tipsContent}>
              <Text style={[styles.tipsTitle, { color: colors.warning }]}>Consumo crítico</Text>
              <Text style={[styles.tipsText, { color: colors.text }]}>Repite la medición tras la próxima ruta y revisa hábitos de conducción y presiones de neumáticos.</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    maxWidth: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  additionalInfo: {
    gap: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  tipsCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FEF3F2',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#7C2D12',
    lineHeight: 20,
  },
});