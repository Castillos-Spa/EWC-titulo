import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthz } from '@/hooks/useAuthz';
import { router } from 'expo-router';
import { useNavigationStore } from '@/stores/navigationStore';
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
  LayoutGrid,
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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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

  // Responsive grid: calcular columnas y ancho de tarjeta según ancho
  const { columns, cardWidth, gutter } = useMemo(() => {
    // Breakpoints sencillos
    let cols: number;
    if (width >= 1024) {
      cols = 5;
    } else if (width >= 768) {
      cols = 4;
    } else if (width >= 600) {
      cols = 3;
    } else {
      cols = 2;
    }
    const containerPadding = 16; // coincide con contentContainerStyle
    const g = 12; // espacio horizontal entre tarjetas
    const available = width - containerPadding * 2 - g * (cols - 1);
    const cw = Math.max(120, Math.floor(available / cols));
    return { columns: cols, cardWidth: cw, gutter: g };
  }, [width]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Header fijo y seguro */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <View style={styles.headerTop}>
          <View style={styles.headerTitle}>
            <LayoutGrid size={28} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Aplicaciones</Text>
          </View>
          {/* Reservado para acciones futuras */}
          <View style={{ width: 1 }} />
        </View>
      </View>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 100 }}
      >
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
            {items.map((item, i) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    marginRight: (i % columns) === (columns - 1) ? 0 : gutter,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 92,
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
