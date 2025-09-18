import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { TrendingUp, TrendingDown, Gauge, Fuel, Award, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface FuelAnalyticsProps {
  readonly analytics: any;
}

export function FuelAnalytics({ analytics }: FuelAnalyticsProps) {
  if (!analytics) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>
          No hay suficientes datos para mostrar análisis
        </Text>
      </View>
    );
  }

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return '#16A34A';
      case 'good': return '#65A30D';
      case 'average': return '#D97706';
      case 'poor': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getEfficiencyIcon = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return Award;
      case 'good': return TrendingUp;
      case 'average': return Gauge;
      case 'poor': return AlertTriangle;
      default: return Gauge;
    }
  };

  const getEfficiencyLabel = (efficiency: string) => {
    const labels = {
      excellent: 'Excelente',
      good: 'Buena',
      average: 'Promedio',
      poor: 'Deficiente',
    };
    return labels[efficiency as keyof typeof labels] || efficiency;
  };

  const efficiencyColor = getEfficiencyColor(analytics.efficiency);
  const EfficiencyIcon = getEfficiencyIcon(analytics.efficiency);

  const formatLastRefuel = () => {
    if (!analytics.lastRefuel) return 'No registrado';
    
    const date = new Date(analytics.lastRefuel.recordedAt);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Hoy';
    if (daysAgo === 1) return 'Ayer';
    return `Hace ${daysAgo} días`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Análisis de Combustible</Text>
      
      {/* Main Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingDown size={24} color="#2563EB" />
          </View>
          <Text style={styles.statValue}>
            {analytics.totalConsumption.toFixed(1)}L
          </Text>
          <Text style={styles.statLabel}>Consumo Total</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingUp size={24} color="#16A34A" />
          </View>
          <Text style={styles.statValue}>
            {analytics.totalRefueled.toFixed(1)}L
          </Text>
          <Text style={styles.statLabel}>Reabastecido</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Gauge size={24} color="#D97706" />
          </View>
          <Text style={styles.statValue}>
            {analytics.averageConsumption > 0 ? `${analytics.averageConsumption.toFixed(1)}` : '--'}
          </Text>
          <Text style={styles.statLabel}>L/100km</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: `${efficiencyColor}10` }]}>
          <View style={styles.statIcon}>
            <EfficiencyIcon size={24} color={efficiencyColor} />
          </View>
          <Text style={[styles.statValue, { color: efficiencyColor }]}>
            {getEfficiencyLabel(analytics.efficiency)}
          </Text>
          <Text style={styles.statLabel}>Eficiencia</Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.additionalInfo}>
        <View style={styles.infoRow}>
          <Fuel size={20} color="#64748B" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Último Reabastecimiento</Text>
            <Text style={styles.infoValue}>{formatLastRefuel()}</Text>
          </View>
        </View>

        {analytics.nextRefuelEstimate && (
          <View style={styles.infoRow}>
            <AlertTriangle size={20} color="#EA580C" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Próximo Reabastecimiento</Text>
              <Text style={styles.infoValue}>
                En ~{Math.round(analytics.nextRefuelEstimate)} km
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Efficiency Tips */}
      {analytics.efficiency === 'poor' && (
        <View style={styles.tipsCard}>
          <AlertTriangle size={20} color="#EA580C" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Consejos para Mejorar Eficiencia</Text>
            <Text style={styles.tipsText}>
              • Mantén velocidad constante{'\n'}
              • Evita aceleraciones bruscas{'\n'}
              • Revisa presión de neumáticos{'\n'}
              • Programa mantenimiento preventivo
            </Text>
          </View>
        </View>
      )}
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