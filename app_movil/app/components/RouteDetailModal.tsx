import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Clock, Play, Truck } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useRouteStore, Route } from '../stores/routeStore';

interface RouteDetailModalProps {
  readonly route: Route;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export default function RouteDetailModal({ route, visible, onClose }: RouteDetailModalProps) {
  const { startTrip, setSelectedTrip } = useRouteStore();
  const [starting, setStarting] = useState(false);
  const { getColors } = useThemeStore();
  const colors = getColors();

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'in_progress': return 'En Progreso';
      default: return 'Planificada';
    }
  };

  const handleStartRouteTrip = async () => {
    setStarting(true);
    try {
      await startTrip('');
      const trip = route.trips[0];
      if (trip) {
        setSelectedTrip(trip);
      }
    } catch (error) {
      console.error('Error al iniciar el viaje', error);
      Alert.alert('Error', 'No se pudo iniciar el viaje');
    } finally {
      setStarting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.card }]} onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Detalle de Ruta</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Route Info */}
          <View style={[styles.routeInfo, { backgroundColor: colors.surface }]}>
            <View style={styles.routeHeader}>
              <Truck size={24} color={colors.primary} />
              <View style={styles.routeDetails}>
                <Text style={[styles.routeTitle, { color: colors.text }]}>{route.vehiclePlate}</Text>
                <Text style={[styles.routeDriver, { color: colors.textSecondary }]}>Conductor: {route.driverName}</Text>
              </View>
            </View>
            
            <View style={styles.routeStats}>
              <View style={styles.stat}>
                {(() => {
                  let symbol = '●';
                  if (route.status === 'completed') symbol = '✔';
                  else if (route.status === 'in_progress') symbol = '▶';
                  return (
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {symbol}
                    </Text>
                  );
                })()}
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{getStatusText(route.status)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{route.code || '-'}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Código</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{route.date}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fecha</Text>
              </View>
            </View>
          </View>

          {/* Route actions */}
          <View style={styles.stopsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Acciones</Text>
            {(route.status === 'planned' || (route.status === 'in_progress' && route.trips.length === 0)) && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => { void handleStartRouteTrip(); }}
                disabled={starting}
                activeOpacity={0.7}
              >
                <Play size={18} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>{starting ? 'Iniciando...' : 'Iniciar viaje'}</Text>
              </TouchableOpacity>
            )}
            {route.status === 'in_progress' && route.trips.length > 0 && (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={() => setSelectedTrip(route.trips[0])}
                activeOpacity={0.7}
              >
                <Clock size={18} color={colors.primary} />
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Continuar viaje</Text>
              </TouchableOpacity>
            )}
            {route.status === 'completed' && (
              <Text style={[styles.completedText, { color: colors.success }]}>Viaje completado</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  routeInfo: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  routeDetails: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: '700',
    
    marginBottom: 4,
  },
  routeDriver: {
    fontSize: 14,
    
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    
    fontWeight: '600',
  },
  stopsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    
    marginBottom: 16,
  },
  stopCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  stopCardActive: {
    
  },
  stopCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stopOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopOrderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stopMainInfo: {
    flex: 1,
  },
  stopClient: {
    fontSize: 16,
    fontWeight: '700',
    
    marginBottom: 2,
  },
  stopJob: {
    fontSize: 14,
    
  },
  stopStatus: {
    padding: 8,
    borderRadius: 20,
  },
  stopCardContent: {
    gap: 8,
    marginBottom: 12,
  },
  stopTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stopAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stopAddressText: {
    fontSize: 14,
    
    flex: 1,
    lineHeight: 20,
  },
  stopCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    
  },
});