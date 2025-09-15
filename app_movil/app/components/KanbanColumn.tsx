import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { KanbanTaskCard } from './KanbanTaskCard';
import { useThemeStore } from '../stores/themeStore';

interface KanbanColumnProps {
  title: string;
  status: string;
  tasks: any[];
  onTaskPress: (task: any) => void;
  color: string;
}

export function KanbanColumn({ title, status, tasks, onTaskPress, color }: KanbanColumnProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  return (
    <View style={[styles.column, { backgroundColor: colors.background }]}>
      <View style={[styles.columnHeader, { borderTopColor: color, backgroundColor: colors.surface }]}>
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
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginRight: 16,
    maxHeight: 600,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  taskCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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