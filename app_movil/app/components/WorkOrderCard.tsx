import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { HardHat, Clock, MapPin, Users, CircleCheck as CheckCircle, Circle, Play, Camera, Package, TriangleAlert as AlertTriangle, Wrench, Building, Eye, Settings } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';

interface WorkOrderCardProps {
  readonly workOrder: any;
  readonly onPress: () => void;
}

export function WorkOrderCard({ workOrder, onPress }: WorkOrderCardProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      default: return '#16A34A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'in_progress': return '#F59E0B';
      case 'on_hold': return '#D97706';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      default: return Circle;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return Wrench;
      case 'construction': return Building;
      case 'repair': return AlertTriangle;
      case 'inspection': return Eye;
      case 'installation': return Settings;
      default: return HardHat;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      maintenance: 'Mantenimiento',
      construction: 'Construcción',
      repair: 'Reparación',
      inspection: 'Inspección',
      installation: 'Instalación',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      assigned: 'Asignada',
      in_progress: 'En Progreso',
      on_hold: 'En Espera',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const formatDuration = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  const getSafetyProgress = () => {
    if (!workOrder.safetyChecklist || workOrder.safetyChecklist.length === 0) return 0;
    const completed = workOrder.safetyChecklist.filter((item: any) => item.completed).length;
    return Math.round((completed / workOrder.safetyChecklist.length) * 100);
  };

  const priorityColor = getPriorityColor(workOrder.priority);
  const statusColor = getStatusColor(workOrder.status);
  const StatusIcon = getStatusIcon(workOrder.status);
  const TypeIcon = getTypeIcon(workOrder.type);
  const safetyProgress = getSafetyProgress();
  const getSafetyProgressColor = (p: number) => {
    if (p >= 80) return '#16A34A';
    if (p >= 50) return '#F59E0B';
    return '#DC2626';
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <View style={styles.typeSection}>
            <TypeIcon size={20} color="#F59E0B" />
            <Text style={styles.orderNumber}>{workOrder.orderNumber}</Text>
          </View>
          <Text style={styles.typeText}>{getTypeLabel(workOrder.type)}</Text>
        </View>
        
        <View style={styles.badgesSection}>
          <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {getPriorityLabel(workOrder.priority)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <StatusIcon size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(workOrder.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.orderTitle, { color: colors.text }]} numberOfLines={2}>
          {workOrder.title}
        </Text>

        {/* Location */}
        <View style={styles.locationSection}>
          <MapPin size={16} color="#64748B" />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {workOrder.location.site || workOrder.location.address}
          </Text>
        </View>

        {/* Team */}
        <View style={styles.teamSection}>
          <Users size={16} color="#64748B" />
          <Text style={[styles.teamText, { color: colors.textSecondary }]} numberOfLines={1}>
            {workOrder.assignedTo.join(', ')}
          </Text>
        </View>

        {/* Duration */}
        <View style={styles.durationSection}>
          <Clock size={16} color="#64748B" />
          <Text style={[styles.durationText, { color: colors.textSecondary }]}>
            Estimado: {formatDuration(workOrder.estimatedDuration)}
            {workOrder.actualDuration && ` • Real: ${formatDuration(workOrder.actualDuration)}`}
          </Text>
        </View>

        {/* Safety Progress */}
        {workOrder.safetyChecklist && workOrder.safetyChecklist.length > 0 && (
          <View style={styles.safetySection}>
            <Text style={[styles.safetyLabel, { color: colors.textSecondary }]}>
              Seguridad: {safetyProgress}%
            </Text>
            <View style={styles.safetyBar}>
              <View 
                style={[
                  styles.safetyFill, 
                  { 
                    width: `${safetyProgress}%`,
                    backgroundColor: getSafetyProgressColor(safetyProgress)
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          {workOrder.progressPhotos.length > 0 && (
            <View style={styles.photosIndicator}>
              <Camera size={14} color="#16A34A" />
              <Text style={styles.photosText}>
                {workOrder.progressPhotos.length} foto{workOrder.progressPhotos.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          
          {workOrder.materials.length > 0 && (
            <View style={styles.materialsIndicator}>
              <Package size={14} color="#F59E0B" />
              <Text style={styles.materialsText}>
                {workOrder.materials.length} material{workOrder.materials.length !== 1 ? 'es' : ''}
              </Text>
            </View>
          )}

          {workOrder.supervisorApproval?.approved && (
            <View style={styles.approvalIndicator}>
              <CheckCircle size={14} color="#16A34A" />
              <Text style={styles.approvalText}>Aprobado</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sync Status Indicator */}
      {workOrder.syncStatus === 'pending' && (
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    flexShrink: 1,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  badgesSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 24,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  teamSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  teamText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  durationText: {
    fontSize: 14,
    color: '#64748B',
  },
  safetySection: {
    marginBottom: 12,
  },
  safetyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  safetyBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
  },
  safetyFill: {
    height: '100%',
    borderRadius: 3,
  },
  additionalInfo: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  photosIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  photosText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  materialsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
  },
  materialsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  approvalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  approvalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
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