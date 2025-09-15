import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Route, Sparkles as Cleaning, HardHat, Monitor, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle, User, Calendar } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';

interface KanbanTaskCardProps {
  task: any;
  onPress: () => void;
}

export function KanbanTaskCard({ task, onPress }: KanbanTaskCardProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'route': return Route;
      case 'cleaning': return Cleaning;
      case 'civil_work': return HardHat;
      case 'it_ticket': return Monitor;
      default: return CheckCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'route': return '#2563EB';
      case 'cleaning': return '#06B6D4';
      case 'civil_work': return '#F59E0B';
      case 'it_ticket': return '#8B5CF6';
      case 'approval': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      default: return '#16A34A';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return 'Vencida';
    } else if (diffHours < 24) {
      return `${diffHours}h restantes`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d restantes`;
    }
  };

  const TypeIcon = getTypeIcon(task.type);
  const typeColor = getTypeColor(task.type);
  const priorityColor = getPriorityColor(task.priority);

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
          <TypeIcon size={16} color={typeColor} />
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {task.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
          {task.title}
        </Text>
        
        <Text style={[styles.taskDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {task.description}
        </Text>

        {/* Progress */}
        {task.progress > 0 && (
          <View style={styles.progressSection}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{task.progress}%</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${task.progress}%`,
                    backgroundColor: typeColor 
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <View style={styles.dueDateSection}>
            <Calendar size={14} color="#64748B" />
            <Text style={[
              styles.dueDateText, 
              { color: colors.textSecondary },
              new Date(task.dueDate) < new Date() && styles.overdue
            ]}>
              {formatDueDate(task.dueDate)}
            </Text>
          </View>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <View style={styles.tagsSection}>
            {task.tags.slice(0, 2).map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {task.tags.length > 2 && (
              <Text style={styles.moreTags}>+{task.tags.length - 2}</Text>
            )}
          </View>
        )}

        {/* Approvals */}
        {task.approvals && task.approvals.length > 0 && (
          <View style={styles.approvalsSection}>
            <CheckCircle size={14} color="#F59E0B" />
            <Text style={styles.approvalsText}>
              Pendiente aprobación
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  typeIcon: {
    padding: 6,
    borderRadius: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    padding: 12,
    paddingTop: 0,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 18,
  },
  taskDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  progressSection: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  dueDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  dueDateText: {
    fontSize: 12,
    color: '#64748B',
  },
  overdue: {
    color: '#DC2626',
    fontWeight: '600',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  moreTags: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  approvalsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  approvalsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
});