import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  TriangleAlert as AlertTriangle,
  Clock,
  MapPin,
  Camera,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Circle as XCircle,
  Zap,
  Shield,
} from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import type { Incident, IncidentStatus } from '@/stores/incidentStore';

interface IncidentCardProps {
  readonly incident: Incident;
  readonly onPress: () => void;
  readonly onAdvanceStatus?: () => void;
  readonly advancing?: boolean;
}

type NextActionMeta = {
  label: string;
  icon: React.FC<{ size?: number; color?: string }>;
  tone: '#2563EB' | '#F59E0B' | '#16A34A';
} | null;

const STATUS_SEQUENCE: Record<IncidentStatus, IncidentStatus | null> = {
  reported: 'acknowledged',
  acknowledged: 'in_progress',
  in_progress: 'resolved',
  resolved: null,
};

const STATUS_ACTION_META: Record<IncidentStatus, NextActionMeta> = {
  reported: { label: 'Marcar revisado', icon: AlertCircle, tone: '#F59E0B' },
  acknowledged: { label: 'Iniciar atención', icon: Zap, tone: '#2563EB' },
  in_progress: { label: 'Resolver incidente', icon: CheckCircle, tone: '#16A34A' },
  resolved: null,
};

const TYPE_LABEL: Record<Incident['type'], string> = {
  vehicle_breakdown: 'Avería de vehículo',
  accident: 'Accidente',
  traffic_delay: 'Retraso de tráfico',
  weather: 'Clima adverso',
  security: 'Seguridad',
  other: 'Otro',
};

const SEVERITY_LABEL: Record<Incident['severity'], string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

const STATUS_LABEL: Record<Incident['status'], string> = {
  reported: 'Reportado',
  acknowledged: 'Reconocido',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
};

const SEVERITY_COLOR: Record<Incident['severity'], string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#16A34A',
};

const STATUS_COLOR: Record<Incident['status'], string> = {
  reported: '#6B7280',
  acknowledged: '#D97706',
  in_progress: '#2563EB',
  resolved: '#16A34A',
};

const STATUS_ICON: Record<Incident['status'], React.FC<{ size?: number; color?: string }>> = {
  reported: XCircle,
  acknowledged: AlertCircle,
  in_progress: Zap,
  resolved: CheckCircle,
};

export function IncidentCard({ incident, onPress, onAdvanceStatus, advancing = false }: IncidentCardProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const photos = Array.isArray(incident.photos) ? incident.photos : [];
  const locationText = (() => {
    if (!incident.location) return 'Sin ubicación';
    if (incident.location.address) return incident.location.address;
    if (typeof incident.location.latitude === 'number' && typeof incident.location.longitude === 'number') {
      return `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`;
    }
    return 'Sin ubicación';
  })();

  const formattedTime = useMemo(() => {
    const date = new Date(incident.reportedAt);
    return date.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }, [incident.reportedAt]);

  const nextStatus = STATUS_SEQUENCE[incident.status];
  const nextAction = nextStatus ? STATUS_ACTION_META[incident.status] : null;
  const StatusIcon = STATUS_ICON[incident.status] ?? XCircle;
  const severityColor = SEVERITY_COLOR[incident.severity] ?? '#16A34A';
  const statusColor = STATUS_COLOR[incident.status] ?? '#64748B';

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.ribbonContainer}>
        <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
          <AlertTriangle size={14} color={severityColor} />
          <Text style={[styles.severityText, { color: severityColor }]}>{SEVERITY_LABEL[incident.severity]}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <StatusIcon size={14} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABEL[incident.status]}</Text>
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>{TYPE_LABEL[incident.type]}</Text>
        <View style={[styles.areaChip, { borderColor: `${colors.primary}33`, backgroundColor: `${colors.primary}12` }]}>
          <Shield size={14} color={colors.primary} />
          <Text style={[styles.areaText, { color: colors.primary }]} numberOfLines={1}>
            {incident.area}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {incident.title}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
        {incident.description}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MapPin size={16} color={colors.textSecondary} />
          <Text style={[styles.metaValue, { color: colors.textSecondary }]} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={[styles.metaValue, { color: colors.textSecondary }]}>{formattedTime}</Text>
        </View>
      </View>

      {photos.length > 0 && (
        <View style={styles.photoRow}>
          <Camera size={16} color={colors.textSecondary} />
          <Text style={[styles.photoText, { color: colors.textSecondary }]}>
            {photos.length} evidencia{photos.length === 1 ? '' : 's'}
          </Text>
          {photos.slice(0, 3).map((photo) => (
            <Image key={photo} source={{ uri: photo }} style={styles.photoThumb} />
          ))}
          {photos.length > 3 && (
            <View style={styles.photoOverflow}>
              <Text style={styles.photoOverflowText}>+{photos.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {nextStatus && nextAction && onAdvanceStatus && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.advanceButton, { backgroundColor: `${nextAction.tone}15`, borderColor: `${nextAction.tone}40` }]}
          onPress={(event) => {
            event.stopPropagation();
            onAdvanceStatus();
          }}
          disabled={advancing}
        >
          <nextAction.icon size={16} color={nextAction.tone} />
          <Text style={[styles.advanceText, { color: nextAction.tone }]}>
            {advancing ? 'Actualizando…' : nextAction.label}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 1,
  },
  ribbonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '60%',
  },
  areaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginBottom: 12,
  },
  photoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  photoThumb: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  photoOverflow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverflowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  advanceText: {
    fontSize: 14,
    fontWeight: '700',
  },
});