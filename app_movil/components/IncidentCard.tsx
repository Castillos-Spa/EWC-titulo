import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TriangleAlert as AlertTriangle, Clock, MapPin, Camera, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Circle as XCircle, Zap } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';

interface IncidentCardProps {
  readonly incident: any;
  readonly onPress: () => void;
}

export function IncidentCard({ incident, onPress }: IncidentCardProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      default: return '#16A34A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#16A34A';
      case 'in_progress': return '#2563EB';
      case 'acknowledged': return '#D97706';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return CheckCircle;
      case 'in_progress': return Zap;
      case 'acknowledged': return AlertCircle;
      default: return XCircle;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      vehicle_breakdown: 'Avería de Vehículo',
      accident: 'Accidente',
      traffic_delay: 'Retraso de Tráfico',
      weather: 'Clima Adverso',
      security: 'Seguridad',
      other: 'Otro',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getSeverityLabel = (severity: string) => {
    const labels = {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo',
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      reported: 'Reportado',
      acknowledged: 'Reconocido',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const severityColor = getSeverityColor(incident.severity);
  const statusColor = getStatusColor(incident.status);
  const StatusIcon = getStatusIcon(incident.status);
  const photos: string[] = Array.isArray(incident.photos) ? incident.photos : [];
  const loc = incident.location as
    | { latitude?: number; longitude?: number; address?: string }
    | undefined;
  const locationText =
    loc?.address ??
    (typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number'
      ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
      : 'Sin ubicación');

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.typeSection}>
          <View style={[styles.severityBadge, { backgroundColor: `${severityColor}15` }]}>
            <AlertTriangle size={16} color={severityColor} />
            <Text style={[styles.severityText, { color: severityColor }]}>
              {getSeverityLabel(incident.severity)}
            </Text>
          </View>
          <Text style={styles.typeText}>{getTypeLabel(incident.type)}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
          <StatusIcon size={16} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(incident.status)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.incidentTitle, { color: colors.text }]}>{incident.title}</Text>
        <Text style={[styles.incidentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {incident.description}
        </Text>

        {/* Location and Time */}
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <MapPin size={16} color="#64748B" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationText}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={16} color="#64748B" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatTime(incident.reportedAt)}
            </Text>
          </View>
        </View>

        {/* Photos indicator */}
        {photos.length > 0 && (
          <View style={styles.photosSection}>
            <Camera size={16} color="#64748B" />
            <Text style={[styles.photosText, { color: colors.textSecondary }]}>
              {photos.length} foto{photos.length !== 1 ? 's' : ''}
            </Text>
            {photos.slice(0, 3).map((photo: string) => (
              <Image key={photo} source={{ uri: photo }} style={styles.photoThumbnail} />
            ))}
            {photos.length > 3 && (
              <View style={styles.morePhotos}>
                <Text style={styles.morePhotosText}>+{photos.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Sync Status Indicator */}
      {incident.syncStatus === 'pending' && (
        <View style={styles.syncIndicator}>
          <View style={styles.syncDot} />
        </View>
      )}
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
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  typeSection: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    flexShrink: 1,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  incidentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 24,
  },
  incidentDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfo: {
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  photosSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  photosText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  photoThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  morePhotos: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  syncIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
});