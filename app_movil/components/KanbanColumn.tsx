import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { KanbanTaskCard } from './KanbanTaskCard';
import { useThemeStore } from '@/stores/themeStore';

interface KanbanColumnProps {
  readonly title: string;
  readonly status: string;
  readonly tasks: any[];
  readonly onTaskPress: (task: any) => void;
  readonly color: string;
}

export function KanbanColumn({ title, status, tasks, onTaskPress, color }: KanbanColumnProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  return (
    <View style={[
      styles.column,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
    ]}>
      <View style={[styles.columnHeader, { borderTopColor: color, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.columnTitle, { color: colors.text }]}>{title}</Text>
        <View style={[styles.taskCount, { backgroundColor: `${color}15` }]}>
          <Text style={[styles.taskCountText, { color }]}>{tasks.length}</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.columnContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {tasks.map((task) => (
          <KanbanTaskCard
            key={task.id}
            task={task}
            onPress={() => onTaskPress(task)}
          />
        ))}
        
        {tasks.length === 0 && (
          <View style={styles.emptyColumn}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay tareas</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    maxHeight: 600,
    borderWidth: 1,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 4,
    borderBottomWidth: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  taskCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    minWidth: 24,
    alignItems: 'center',
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  columnContent: {
    flex: 1,
    padding: 12,
  },
  emptyColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});