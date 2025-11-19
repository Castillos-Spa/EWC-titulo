import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Truck, MapPin, Clock, CircleCheck as CheckCircle, Circle, Play, ChevronRight, Navigation2 } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';

import { Route } from '../stores/routeStore';

interface RouteCardProps {
  readonly route: Route;
  readonly onPress: () => void;
  readonly progress: string;
}

export function RouteCard({ route, onPress, progress }: RouteCardProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'in_progress': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      default: return Circle;
    }
  };

  const StatusIcon = getStatusIcon(route.status);
  const statusColor = getStatusColor(route.status);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'in_progress': return 'En Progreso';
      default: return 'Planificada';
    }
  };

  const headerLabel = (route.code && route.code.trim().length > 0) ? route.code.trim() : route.vehiclePlate;
  const hasStops = route.stops && route.stops.length > 0;
  const progressParts = progress.split('/');
  const done = Number.parseInt(progressParts[0], 10) || 0;
  const total = Number.parseInt(progressParts[1], 10) || 0;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.vehicleInfo}>
          <Navigation2 size={24} color={colors.primary} />
          <Text style={[styles.vehiclePlate, { color: colors.text }]}>{headerLabel}</Text>
        </View>
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <StatusIcon size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{getStatusText(route.status)}</Text>
          </View>
          {hasStops ? (
            <Text style={styles.progressText}>{done}/{total} paradas</Text>
          ) : (
            <Text style={styles.progressText}>Sin paradas</Text>
          )}
        </View>

        {hasStops && (
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${total > 0 ? (done / total) * 100 : 0}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
        )}

        {(route.origin || route.destination) && (
          <View style={styles.odRow}>
            <Truck size={16} color={colors.textSecondary} />
            <Text style={[styles.odText, { color: colors.textSecondary }]}> {(route.origin || '¿Origen?')} → {(route.destination || '¿Destino?')} </Text>
          </View>
        )}

        <View style={styles.stopsInfo}>
          <MapPin size={16} color={colors.textSecondary} />
          <Text style={[styles.stopsCount, { color: colors.textSecondary }]}>
            {hasStops ? `${route.stops.length} paradas programadas` : 'No hay paradas programadas'}
          </Text>
        </View>

        {hasStops && route.stops.slice(0, 1).map((stop) => (
          <View key={stop.id} style={styles.nextStop}>
            <Text style={[styles.nextStopLabel, { color: colors.textSecondary }]}>Próxima parada:</Text>
            <Text style={[styles.nextStopClient, { color: colors.text }]}>{stop.clientName}</Text>
            <View style={styles.nextStopTime}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>{stop.timeSlot}</Text>
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  vehiclePlate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    flexShrink: 1,
  },
  cardContent: {
    padding: 20,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stopsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  odRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  odText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stopsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  nextStop: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  nextStopLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  nextStopClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  nextStopTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
  },
});