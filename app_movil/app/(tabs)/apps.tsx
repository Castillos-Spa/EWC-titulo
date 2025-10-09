import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { useAuthz } from '@/hooks/useAuthz';
import { router } from 'expo-router';
import { useNavigationStore } from '../stores/navigationStore';
import {
  Home,
  Ticket,
  Map,
  Car,
  Fuel,
  Bell,
  Wrench,
  Sparkles as Cleaning,
  HardHat,
  AlertTriangle,
  Settings,
  type LucideIcon,
} from 'lucide-react-native';

type ModuleItem = Readonly<{
  key: string;
  title: string;
  route: string; // ruta dentro de /(tabs)
  icon: LucideIcon;
  visible: boolean;
  category: 'Transporte' | 'Taller' | 'Aseo' | 'Obras' | 'General';
}>;

export default function AppsHubScreen() {
  const { getColors } = useThemeStore();
  const colors = getColors();
  const [query, setQuery] = useState('');
  const { markUsed } = useNavigationStore();
  const {
    canRoutes,
    canFuel,
    canMaintenance,
    canCleaning,
    canCivilWorks,
    canTickets,
    canIncidents,
  } = useAuthz();

  const modules = useMemo<ModuleItem[]>(() => (
    [
      { key: 'home', title: 'Inicio', route: 'index', icon: Home, visible: true, category: 'General' },
      { key: 'tickets', title: 'Sistema de Tickets', route: 'work', icon: Ticket, visible: canTickets, category: 'General' },
      { key: 'routes', title: 'Gestión de Rutas', route: 'routes', icon: Map, visible: canRoutes, category: 'Transporte' },
      { key: 'fleet', title: 'Registro de Flota', route: 'fleet', icon: Car, visible: canFuel, category: 'Transporte' },
      { key: 'fuel', title: 'Combustible', route: 'fuel', icon: Fuel, visible: canFuel, category: 'Transporte' },
      { key: 'notifications', title: 'Notificaciones', route: 'notifications', icon: Bell, visible: true, category: 'General' },
      { key: 'maintenance', title: 'Mantenimiento', route: 'maintenance', icon: Wrench, visible: canMaintenance, category: 'Taller' },
      { key: 'cleaning', title: 'Aseo', route: 'cleaning', icon: Cleaning, visible: canCleaning, category: 'Aseo' },
      { key: 'civil-works', title: 'Obras Civiles', route: 'civil-works', icon: HardHat, visible: canCivilWorks, category: 'Obras' },
      { key: 'incidents', title: 'Incidentes', route: 'incidents', icon: AlertTriangle, visible: canIncidents, category: 'General' },
      { key: 'settings', title: 'Configuración', route: 'settings', icon: Settings, visible: true, category: 'General' },
    ]
  ), [canRoutes, canFuel, canMaintenance, canCleaning, canCivilWorks, canTickets, canIncidents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter(m => m.visible && (q.length === 0 || m.title.toLowerCase().includes(q)));
  }, [modules, query]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ModuleItem[]>>((acc, m) => {
      const key = m.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: colors.text }]}>Aplicaciones</Text>
      <TextInput
        placeholder="Buscar módulo..."
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        style={[styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
      />

      {Object.entries(grouped).map(([category, items]) => (
        <View key={category} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{category}</Text>
          <View style={styles.grid}>
            {items.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => { markUsed(item.route); router.push(`/(tabs)/${item.route}` as any); }}
              >
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                  <item.icon size={22} color={colors.primary} />
                </View>
                <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  card: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 84,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 13, fontWeight: '600' },
});
