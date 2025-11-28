import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import type { ModuleAlert } from '@/utils/dashboard';

type ThemePalette = {
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  background: string;
  primary: string;
};

type Props = {
  alerts: ModuleAlert[];
  secondary: ModuleAlert[];
  loading: boolean;
  filter: 'critical' | 'all';
  onFilterChange: (next: 'critical' | 'all') => void;
  colors: ThemePalette;
};

export function DashboardAlertsCard(props: Readonly<Props>) {
  const { alerts, secondary, loading, filter, onFilterChange, colors } = props;
  const activeList = filter === 'critical' ? alerts : secondary;
  const displayed = activeList.slice(0, 6);
  const hasAlerts = displayed.length > 0;

  let body: React.ReactNode = (
    <View style={styles.emptyState}>
      <Text style={{ color: colors.textSecondary }}>Sin alertas priorizadas en este rango.</Text>
    </View>
  );

  if (loading) {
    body = (
      <View style={styles.emptyState}>
        <Text style={{ color: colors.textSecondary }}>Cargando alertas...</Text>
      </View>
    );
  } else if (hasAlerts) {
    body = (
      <View style={styles.alertList}>
        {displayed.map(alert => (
          <View key={alert.id} style={[styles.alertItem, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.alertIcon, { backgroundColor: colors.primary + '12' }]}
            >
              <AlertTriangle size={18} color={colors.primary} />
            </View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: colors.text }]} numberOfLines={1}>
                {alert.label}
              </Text>
              <Text style={[styles.alertMeta, { color: colors.textSecondary }]}
              >
                {alert.owner} • {alert.priority}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Alertas Prioritarias</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Filtra alertas críticas o el total acumulado</Text>
        </View>
        <View style={styles.filterGroup}>
          <TouchableOpacity
            onPress={() => onFilterChange('critical')}
            style={[
              styles.filterChip,
              filter === 'critical' && { backgroundColor: colors.primary + '22' },
            ]}
          >
            <Text style={{ color: filter === 'critical' ? colors.primary : colors.textSecondary }}>Críticas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onFilterChange('all')}
            style={[
              styles.filterChip,
              filter === 'all' && { backgroundColor: colors.primary + '22' },
            ]}
          >
            <Text style={{ color: filter === 'all' ? colors.primary : colors.textSecondary }}>Todas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {body}
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  alertList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMeta: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
});

export default DashboardAlertsCard;
