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
import { X, MapPin, Clock, CircleCheck as CheckCircle, Circle, Play, Truck, ChevronRight } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useRouteStore } from '../stores/routeStore';

interface RouteDetailModalProps {
  readonly route: any;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export default function RouteDetailModal({ route, visible, onClose }: RouteDetailModalProps) {
  const { startTrip, setSelectedTrip } = useRouteStore();
  const [startingStopId, setStartingStopId] = useState<string | null>(null);
  const { getColors } = useThemeStore();
  const colors = getColors();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'in_progress': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      default: return Circle;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'in_progress': return 'En Progreso';
      default: return 'Planificada';
    }
  };

  const handleStartTrip = async (stopId: string) => {
    setStartingStopId(stopId);
    try {
      await startTrip(stopId);
      // Find the created trip and open it
      const trip = route.trips.find((t: any) => t.stopId === stopId);
      if (trip) {
        setSelectedTrip(trip);
      }
    } catch (error) {
      console.error('Error al iniciar el viaje', error);
      Alert.alert('Error', 'No se pudo iniciar el viaje');
    } finally {
      setStartingStopId(null);
    }
  };

  const handleStopPress = (stop: any) => {
    if (stop.status === 'planned') {
      Alert.alert(
        'Iniciar Viaje',
        `¿Deseas iniciar el viaje a ${stop.clientName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar', onPress: () => { void handleStartTrip(stop.id); } },
        ]
      );
    } else if (stop.status === 'in_progress') {
      const trip = route.trips.find((t: any) => t.stopId === stop.id);
      if (trip) {
        setSelectedTrip(trip);
      }
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
                <Text style={[styles.statValue, { color: colors.primary }]}>{route.stops.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paradas</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {route.stops.filter((s: any) => s.status === 'completed').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completadas</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {route.stops.filter((s: any) => s.status === 'in_progress').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En Progreso</Text>
              </View>
            </View>
          </View>

          {/* Stops List */}
          <View style={styles.stopsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Paradas Programadas</Text>
            
            {route.stops.map((stop: any, index: number) => {
              const StatusIcon = getStatusIcon(stop.status);
              const statusColor = getStatusColor(stop.status);
              const isStartingForThisStop = startingStopId === stop.id;

              return (
                <TouchableOpacity
                  key={stop.id}
                  style={[
                    styles.stopCard,
                    stop.status === 'in_progress' && styles.stopCardActive,
                  ]}
                  onPress={() => handleStopPress(stop)}
                  disabled={isStartingForThisStop}
                  activeOpacity={0.7}
                >
                  <View style={styles.stopCardHeader}>
                    <View style={styles.stopOrder}>
                      <Text style={styles.stopOrderText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stopMainInfo}>
                      <Text style={[styles.stopClient, { color: colors.text }]}>{stop.clientName}</Text>
                      <Text style={[styles.stopJob, { color: colors.textSecondary }]}>{stop.jobDescription}</Text>
                    </View>
                    <View style={[styles.stopStatus, { backgroundColor: `${statusColor}15` }]}>
                      <StatusIcon size={16} color={statusColor} />
                    </View>
                  </View>

                  <View style={styles.stopCardContent}>
                    <View style={styles.stopTime}>
                      <Clock size={16} color={colors.textSecondary} />
                      <Text style={[styles.stopTimeText, { color: colors.textSecondary }]}>{stop.timeSlot}</Text>
                    </View>
                    <View style={styles.stopAddress}>
                      <MapPin size={16} color={colors.textSecondary} />
                      <Text style={[styles.stopAddressText, { color: colors.textSecondary }]}>{stop.address}</Text>
                    </View>
                  </View>

                  <View style={styles.stopCardFooter}>
                    <Text style={[styles.stopStatusText, { color: statusColor }]}>
                      {getStatusText(stop.status)}
                    </Text>
                    {stop.status !== 'completed' && (
                      <ChevronRight size={16} color={colors.textSecondary} />
                    )}
                  </View>

                  {isStartingForThisStop && (
                    <View style={[styles.loadingOverlay, { backgroundColor: `${colors.background}E6` }]}>
                      <Text style={[styles.loadingText, { color: colors.primary }]}>Iniciando...</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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