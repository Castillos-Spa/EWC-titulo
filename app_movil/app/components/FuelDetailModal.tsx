import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { 
  X, 
  MapPin, 
  Clock, 
  User, 
  Fuel, 
  Camera, 
  Navigation, 
  Gauge,
  Receipt,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react-native';

interface FuelDetailModalProps {
  record: any;
  visible: boolean;
  onClose: () => void;
}

export function FuelDetailModal({ record, visible, onClose }: FuelDetailModalProps) {
  const getTypeColor = (type: string) => {
    return type === 'refuel' ? '#16A34A' : '#2563EB';
  };

  const getTypeIcon = (type: string) => {
    return type === 'refuel' ? TrendingUp : TrendingDown;
  };

  const getTypeLabel = (type: string) => {
    return type === 'refuel' ? 'Reabastecimiento' : 'Consumo';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openInMaps = () => {
    const { latitude, longitude } = record.location;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const typeColor = getTypeColor(record.type);
  const TypeIcon = getTypeIcon(record.type);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle del Registro</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type and Amount */}
          <View style={styles.mainInfo}>
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
              <TypeIcon size={24} color={typeColor} />
              <Text style={[styles.typeText, { color: typeColor }]}>
                {getTypeLabel(record.type)}
              </Text>
            </View>
            
            <View style={styles.amountSection}>
              <Text style={styles.amountValue}>{record.amount.toFixed(1)}</Text>
              <Text style={styles.amountUnit}>Litros</Text>
            </View>
          </View>

          {/* Vehicle and Driver Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Fuel size={20} color="#64748B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Vehículo</Text>
                <Text style={styles.infoValue}>{record.vehiclePlate}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <User size={20} color="#64748B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Conductor</Text>
                <Text style={styles.infoValue}>{record.driverName}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Gauge size={20} color="#64748B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Kilometraje</Text>
                <Text style={styles.infoValue}>{record.odometer.toLocaleString()} km</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Clock size={20} color="#64748B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Fecha y hora</Text>
                <Text style={styles.infoValue}>{formatDateTime(record.recordedAt)}</Text>
              </View>
            </View>
          </View>

          {/* Station Name (for refuels) */}
          {record.stationName && (
            <View style={styles.stationSection}>
              <Text style={styles.sectionTitle}>Estación de Servicio</Text>
              <View style={styles.stationCard}>
                <Fuel size={20} color="#16A34A" />
                <Text style={styles.stationName}>{record.stationName}</Text>
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <MapPin size={20} color="#2563EB" />
                <View style={styles.locationDetails}>
                  <Text style={styles.locationAddress}>
                    {record.location.address || 'Ubicación GPS'}
                  </Text>
                  <Text style={styles.locationCoords}>
                    {record.location.latitude.toFixed(6)}, {record.location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.mapsButton} onPress={openInMaps}>
                <Navigation size={20} color="#2563EB" />
                <Text style={styles.mapsButtonText}>Ver en Mapas</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Receipt Photo */}
          {record.receiptPhoto && (
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>
                <Receipt size={20} color="#374151" /> Recibo
              </Text>
              <View style={styles.photoContainer}>
                <Image source={{ uri: record.receiptPhoto }} style={styles.photo} />
              </View>
            </View>
          )}

          {/* Notes */}
          {record.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>
                <FileText size={20} color="#374151" /> Notas
              </Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{record.notes}</Text>
              </View>
            </View>
          )}

          {/* Sync Status */}
          <View style={styles.syncSection}>
            <Text style={styles.sectionTitle}>Estado de Sincronización</Text>
            <View style={styles.syncCard}>
              <View style={[
                styles.syncIndicator,
                { backgroundColor: record.syncStatus === 'synced' ? '#16A34A' : '#F59E0B' }
              ]} />
              <Text style={styles.syncText}>
                {record.syncStatus === 'synced' ? 'Sincronizado' : 'Pendiente de sincronización'}
              </Text>
            </View>
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
    paddingHorizontal: 20,
  },
  mainInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountSection: {
    alignItems: 'center',
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1E293B',
  },
  amountUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  stationSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  locationSection: {
    marginBottom: 20,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#64748B',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  photoSection: {
    marginBottom: 20,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  notesText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  syncSection: {
    marginBottom: 20,
  },
  syncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  syncText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
});