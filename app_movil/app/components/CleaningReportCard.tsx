import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Sparkles as Cleaning, Clock, MapPin, Users, CircleCheck as CheckCircle, Circle, Play, Camera, Package } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';

interface CleaningReportCardProps {
  readonly report: any;
  readonly onPress: () => void;
}

export function CleaningReportCard({ report, onPress }: CleaningReportCardProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'in_progress': return '#06B6D4';
      default: return '#F59E0B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      default: return Circle;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      default: return 'Pendiente';
    }
  };

  const getShiftLabel = (shift: string) => {
    const shifts = {
      morning: 'Mañana',
      afternoon: 'Tarde',
      night: 'Noche',
    };
    return shifts[shift as keyof typeof shifts] || shift;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTaskProgress = () => {
    if (!report.tasks || report.tasks.length === 0) return { completed: 0, total: 0 };
    const completed = report.tasks.filter((task: any) => task.completed).length;
    return { completed, total: report.tasks.length };
  };

  const statusColor = getStatusColor(report.status);
  const StatusIcon = getStatusIcon(report.status);
  const { completed, total } = getTaskProgress();

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.reportInfo}>
          <View style={styles.shiftBadge}>
            <Cleaning size={16} color="#06B6D4" />
            <Text style={styles.shiftText}>
              Turno {getShiftLabel(report.shift)}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(report.date).toLocaleDateString('es-ES')}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
          <StatusIcon size={16} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(report.status)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Progreso: {completed}/{total} tareas
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: total > 0 ? `${(completed / total) * 100}%` : '0%',
                  backgroundColor: statusColor 
                }
              ]} 
            />
          </View>
        </View>

        {/* Areas */}
        <View style={styles.areasSection}>
          <MapPin size={16} color="#64748B" />
          <Text style={[styles.areasText, { color: colors.textSecondary }]}>
            {report.areas.length} área{report.areas.length !== 1 ? 's' : ''} asignada{report.areas.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Crew */}
        <View style={styles.crewSection}>
          <Users size={16} color="#64748B" />
          <Text style={[styles.crewText, { color: colors.textSecondary }]}>
            {report.crewMembers.join(', ')}
          </Text>
        </View>

        {/* Time */}
        <View style={styles.timeSection}>
          <Clock size={16} color="#64748B" />
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            Inicio: {formatTime(report.startTime)}
            {report.endTime && ` • Fin: ${formatTime(report.endTime)}`}
          </Text>
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          {report.photos.length > 0 && (
            <View style={styles.photosIndicator}>
              <Camera size={14} color="#16A34A" />
              <Text style={styles.photosText}>
                {report.photos.length} foto{report.photos.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          
          {report.supplies.length > 0 && (
            <View style={styles.suppliesIndicator}>
              <Package size={14} color="#06B6D4" />
              <Text style={styles.suppliesText}>
                {report.supplies.length} insumo{report.supplies.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {report.supervisorApproval?.approved && (
            <View style={styles.approvalIndicator}>
              <CheckCircle size={14} color="#16A34A" />
              <Text style={styles.approvalText}>Aprobado</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sync Status Indicator */}
      {report.syncStatus === 'pending' && (
        <View style={styles.syncIndicator}>
          <View style={styles.syncDot} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default CleaningReportCard;

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
  reportInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  shiftText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06B6D4',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
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
  areasSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  areasText: {
    fontSize: 14,
    color: '#64748B',
  },
  crewSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  crewText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
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
  suppliesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
  },
  suppliesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#06B6D4',
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