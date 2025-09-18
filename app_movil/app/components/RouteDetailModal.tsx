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
import { useRouteStore } from '../stores/routeStore';

interface RouteDetailModalProps {
  readonly route: any;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export default function RouteDetailModal({ route, visible, onClose }: RouteDetailModalProps) {
  const { startTrip, setSelectedTrip } = useRouteStore();
  const [startingStopId, setStartingStopId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'in_progress': return '#EA580C';
      default: return '#6B7280';
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle de Ruta</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Route Info */}
          <View style={styles.routeInfo}>
            <View style={styles.routeHeader}>
              <Truck size={24} color="#2563EB" />
              <View style={styles.routeDetails}>
                <Text style={styles.routeTitle}>{route.vehiclePlate}</Text>
                <Text style={styles.routeDriver}>Conductor: {route.driverName}</Text>
              </View>
            </View>
            
            <View style={styles.routeStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{route.stops.length}</Text>
                <Text style={styles.statLabel}>Paradas</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {route.stops.filter((s: any) => s.status === 'completed').length}
                </Text>
                <Text style={styles.statLabel}>Completadas</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {route.stops.filter((s: any) => s.status === 'in_progress').length}
                </Text>
                <Text style={styles.statLabel}>En Progreso</Text>
              </View>
            </View>
          </View>

          {/* Stops List */}
          <View style={styles.stopsSection}>
            <Text style={styles.sectionTitle}>Paradas Programadas</Text>
            
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
                      <Text style={styles.stopClient}>{stop.clientName}</Text>
                      <Text style={styles.stopJob}>{stop.jobDescription}</Text>
                    </View>
                    <View style={[styles.stopStatus, { backgroundColor: `${statusColor}15` }]}>
                      <StatusIcon size={16} color={statusColor} />
                    </View>
                  </View>

                  <View style={styles.stopCardContent}>
                    <View style={styles.stopTime}>
                      <Clock size={16} color="#64748B" />
                      <Text style={styles.stopTimeText}>{stop.timeSlot}</Text>
                    </View>
                    <View style={styles.stopAddress}>
                      <MapPin size={16} color="#64748B" />
                      <Text style={styles.stopAddressText}>{stop.address}</Text>
                    </View>
                  </View>

                  <View style={styles.stopCardFooter}>
                    <Text style={[styles.stopStatusText, { color: statusColor }]}>
                      {getStatusText(stop.status)}
                    </Text>
                    {stop.status !== 'completed' && (
                      <ChevronRight size={16} color="#94A3B8" />
                    )}
                  </View>

                  {isStartingForThisStop && (
                    <View style={styles.loadingOverlay}>
                      <Text style={styles.loadingText}>Iniciando...</Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  routeInfo: {
    backgroundColor: '#FFFFFF',
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
    color: '#1E293B',
    marginBottom: 4,
  },
  routeDriver: {
    fontSize: 14,
    color: '#64748B',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  stopsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  stopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  stopCardActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FEF3F2',
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
    color: '#1E293B',
    marginBottom: 2,
  },
  stopJob: {
    fontSize: 14,
    color: '#64748B',
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
    color: '#475569',
  },
  stopAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stopAddressText: {
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
});