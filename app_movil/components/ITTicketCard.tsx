import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Monitor, Clock, MapPin, User, CircleCheck as CheckCircle, Circle, Play, MessageCircle, Paperclip, TriangleAlert as AlertTriangle, Smartphone, Printer, Wifi, Mail, Phone } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';

interface ITTicketCardProps {
  readonly ticket: any;
  readonly onPress: () => void;
}

export function ITTicketCard({ ticket, onPress }: ITTicketCardProps) {
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
      case 'resolved': return '#16A34A';
      case 'closed': return '#6B7280';
      case 'in_progress': return '#8B5CF6';
      case 'waiting_user': return '#F59E0B';
      default: return '#DC2626';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return CheckCircle;
      case 'closed': return CheckCircle;
      case 'in_progress': return Play;
      default: return Circle;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hardware': return Monitor;
      case 'software': return Smartphone;
      case 'network': return Wifi;
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'printer': return Printer;
      default: return AlertTriangle;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      hardware: 'Hardware',
      software: 'Software',
      network: 'Red',
      email: 'Email',
      phone: 'Teléfono',
      printer: 'Impresora',
      other: 'Otro',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      waiting_user: 'Esperando Usuario',
      resolved: 'Resuelto',
      closed: 'Cerrado',
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `Hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);
  const StatusIcon = getStatusIcon(ticket.status);
  const CategoryIcon = getCategoryIcon(ticket.category);
  const commentCount = ticket.comments.length;
  const attachmentCount = ticket.attachments.length;
  const commentSuffix = commentCount === 1 ? '' : 's';
  const attachmentSuffix = attachmentCount === 1 ? '' : 's';

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.ticketInfo}>
          <View style={styles.categorySection}>
            <CategoryIcon size={20} color="#8B5CF6" />
            <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
          </View>
          <Text style={styles.categoryText}>{getCategoryLabel(ticket.category)}</Text>
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
          {ticket.title}
        </Text>
        
        <Text style={[styles.ticketDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {ticket.description}
        </Text>

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <User size={16} color="#64748B" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Reportado por: {ticket.reportedBy}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <MapPin size={16} color="#64748B" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {ticket.location.building} - {ticket.location.office || ticket.location.floor}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Clock size={16} color="#64748B" />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatTime(ticket.createdAt)}
            </Text>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          {commentCount > 0 && (
            <View style={styles.commentsIndicator}>
              <MessageCircle size={14} color="#8B5CF6" />
              <Text style={styles.commentsText}>
                {commentCount} comentario{commentSuffix}
              </Text>
            </View>
          )}
          
          {attachmentCount > 0 && (
            <View style={styles.attachmentsIndicator}>
              <Paperclip size={14} color="#64748B" />
              <Text style={styles.attachmentsText}>
                {attachmentCount} archivo{attachmentSuffix}
              </Text>
            </View>
          )}

          {ticket.assignedTo && (
            <View style={styles.assignedIndicator}>
              <User size={14} color="#2563EB" />
              <Text style={styles.assignedText}>Asignado a {ticket.assignedTo}</Text>
            </View>
          )}
        </View>
      </View>

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
    minWidth: 0,
    marginRight: 12,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    flexShrink: 1,
  },
  categoryText: {
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
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 24,
  },
  ticketDescription: {
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
  additionalInfo: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  commentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
  },
  commentsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  attachmentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  attachmentsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  assignedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  assignedText: {
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