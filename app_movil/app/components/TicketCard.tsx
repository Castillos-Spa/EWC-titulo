import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Clock, MapPin, User, CircleCheck as CheckCircle, Circle, Play, Pause, X, Wrench, Package, Eye, TriangleAlert as AlertTriangle, FileText, Camera } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';

interface TicketCardProps {
  readonly ticket: any;
  readonly onPress: () => void;
}

export function TicketCard({ ticket, onPress }: TicketCardProps) {
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
      case 'in_progress': return '#2563EB';
      case 'on_hold': return '#D97706';
      case 'cancelled': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      case 'on_hold': return Pause;
      case 'cancelled': return X;
      default: return Circle;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return Wrench;
      case 'delivery': return Package;
      case 'pickup': return Package;
      case 'inspection': return Eye;
      case 'repair': return AlertTriangle;
      default: return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      maintenance: 'Mantenimiento',
      delivery: 'Entrega',
      pickup: 'Recogida',
      inspection: 'Inspección',
      repair: 'Reparación',
      other: 'Otro',
    };
    return labels[type as keyof typeof labels] || type;
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

  const getStatusLabel = (status: string) => {
    const labels = {
      assigned: 'Asignado',
      in_progress: 'En Progreso',
      on_hold: 'En Espera',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);
  const StatusIcon = getStatusIcon(ticket.status);
  const TypeIcon = getTypeIcon(ticket.type);

  const getProgress = () => {
    if (!ticket.checklist || ticket.checklist.length === 0) return null;
    const completed = ticket.checklist.filter((item: any) => item.completed).length;
    return `${completed}/${ticket.checklist.length}`;
  };

  const progress = getProgress();

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.ticketInfo}>
          <View style={styles.typeSection}>
            <TypeIcon size={20} color="#2563EB" />
            <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
          </View>
          <Text style={styles.typeText}>{getTypeLabel(ticket.type)}</Text>
        </View>
        
        <View style={styles.badgesSection}>
          <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {getPriorityLabel(ticket.priority)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
            <StatusIcon size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(ticket.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.ticketTitle, { color: colors.text }]} numberOfLines={2}>
          <Text style={[styles.ticketTitle, { color: colors.text }]}>{ticket.title}</Text>
        </Text>
        
        {ticket.clientName && (
          <Text style={[styles.clientName, { color: colors.primary }]}>Cliente: {ticket.clientName}</Text>
        )}

        {/* Progress */}
        {progress && (
          <View style={styles.progressSection}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>Progreso: {progress}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(parseInt(progress.split('/')[0]) / parseInt(progress.split('/')[1])) * 100}%`,
                    backgroundColor: statusColor 
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Clock size={16} color="#64748B" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatDate(ticket.scheduledDate)} • {formatDuration(ticket.estimatedDuration)}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <MapPin size={16} color="#64748B" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {ticket.location.address || 'Ubicación GPS'}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <User size={16} color="#64748B" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Asignado por: {ticket.assignedBy}</Text>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          {ticket.photos.length > 0 && (
            <View style={styles.photosIndicator}>
              <Camera size={14} color="#16A34A" />
              <Text style={styles.photosText}>
                {ticket.photos.length} foto{ticket.photos.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          
          {ticket.materials && ticket.materials.length > 0 && (
            <View style={styles.materialsIndicator}>
              <Package size={14} color="#2563EB" />
              <Text style={styles.materialsText}>
                {ticket.materials.length} material{ticket.materials.length !== 1 ? 'es' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sync Status Indicator */}
      {ticket.syncStatus === 'pending' && (
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
  ticketInfo: {
    flex: 1,
    minWidth: 0, // Allow flex shrinking
    marginRight: 12,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    flexShrink: 1,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    flexShrink: 1,
  },
  badgesSection: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
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
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 24,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  materialsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
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