import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface UIState {
  showListFilters: boolean;
  showKanbanFilters: boolean;
  viewMode: 'list' | 'kanban';
  // Filtros compartidos Lista/Kanban
  ticketFilterStatus: string; // 'all' | 'assigned' | 'in_progress' | 'completed'
  ticketFilterPriority: string; // 'all' | 'urgent' | 'high' | 'medium' | 'low'
  ticketFilterCategory: string; // 'all' | backend categories
  ticketSearch: string;
  setShowListFilters: (value: boolean) => Promise<void>;
  setShowKanbanFilters: (value: boolean) => Promise<void>;
  setViewMode: (mode: 'list' | 'kanban') => Promise<void>;
  setTicketFilterStatus: (v: string) => Promise<void>;
  setTicketFilterPriority: (v: string) => Promise<void>;
  setTicketFilterCategory: (v: string) => Promise<void>;
  setTicketSearch: (v: string) => Promise<void>;
  loadUIPreferences: () => Promise<void>;
}

const SHOW_LIST_FILTERS_KEY = 'ui_showListFilters';
const SHOW_KANBAN_FILTERS_KEY = 'ui_showKanbanFilters';
const VIEW_MODE_KEY = 'ui_viewMode';
const FILTER_STATUS_KEY = 'ui_ticketFilterStatus';
const FILTER_PRIORITY_KEY = 'ui_ticketFilterPriority';
const FILTER_CATEGORY_KEY = 'ui_ticketFilterCategory';
const FILTER_SEARCH_KEY = 'ui_ticketSearch';

export const useUIStore = create<UIState>((set) => ({
  showListFilters: false,
  showKanbanFilters: false,
  viewMode: 'list',
  ticketFilterStatus: 'all',
  ticketFilterPriority: 'all',
  ticketFilterCategory: 'all',
  ticketSearch: '',

  setShowListFilters: async (value: boolean) => {
    set({ showListFilters: value });
    try {
      await SecureStore.setItemAsync(SHOW_LIST_FILTERS_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('Error saving list filters visibility:', error);
    }
  },

  setShowKanbanFilters: async (value: boolean) => {
    set({ showKanbanFilters: value });
    try {
      await SecureStore.setItemAsync(SHOW_KANBAN_FILTERS_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('Error saving kanban filters visibility:', error);
    }
  },

  setViewMode: async (mode: 'list' | 'kanban') => {
    set({ viewMode: mode });
    try {
      await SecureStore.setItemAsync(VIEW_MODE_KEY, mode);
    } catch (error) {
      console.warn('Error saving view mode:', error);
    }
  },

  setTicketFilterStatus: async (v: string) => {
    set({ ticketFilterStatus: v });
    try {
      await SecureStore.setItemAsync(FILTER_STATUS_KEY, v);
    } catch (error) {
      console.warn('Error saving ticketFilterStatus:', error);
    }
  },
  setTicketFilterPriority: async (v: string) => {
    set({ ticketFilterPriority: v });
    try {
      await SecureStore.setItemAsync(FILTER_PRIORITY_KEY, v);
    } catch (error) {
      console.warn('Error saving ticketFilterPriority:', error);
    }
  },
  setTicketFilterCategory: async (v: string) => {
    set({ ticketFilterCategory: v });
    try {
      await SecureStore.setItemAsync(FILTER_CATEGORY_KEY, v);
    } catch (error) {
      console.warn('Error saving ticketFilterCategory:', error);
    }
  },
  setTicketSearch: async (v: string) => {
    set({ ticketSearch: v });
    try {
      await SecureStore.setItemAsync(FILTER_SEARCH_KEY, v);
    } catch (error) {
      console.warn('Error saving ticketSearch:', error);
    }
  },

  loadUIPreferences: async () => {
    try {
      const [listRaw, kanbanRaw, modeRaw, statusRaw, priorityRaw, categoryRaw, searchRaw] = await Promise.all([
        SecureStore.getItemAsync(SHOW_LIST_FILTERS_KEY),
        SecureStore.getItemAsync(SHOW_KANBAN_FILTERS_KEY),
        SecureStore.getItemAsync(VIEW_MODE_KEY),
        SecureStore.getItemAsync(FILTER_STATUS_KEY),
        SecureStore.getItemAsync(FILTER_PRIORITY_KEY),
        SecureStore.getItemAsync(FILTER_CATEGORY_KEY),
        SecureStore.getItemAsync(FILTER_SEARCH_KEY),
      ]);
      const list = listRaw === null ? false : JSON.parse(listRaw);
      const kanban = kanbanRaw === null ? false : JSON.parse(kanbanRaw);
      const viewMode = modeRaw === 'kanban' ? 'kanban' : 'list';
      set({
        showListFilters: !!list,
        showKanbanFilters: !!kanban,
        viewMode,
        ticketFilterStatus: statusRaw || 'all',
        ticketFilterPriority: priorityRaw || 'all',
        ticketFilterCategory: categoryRaw || 'all',
        ticketSearch: searchRaw || '',
      });
    } catch (error) {
      console.warn('Error loading UI preferences:', error);
    }
  },
}));