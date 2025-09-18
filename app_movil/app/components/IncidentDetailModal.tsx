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
  TriangleAlert as AlertTriangle, 
  Camera, 
  Navigation, 
  CircleCheck as CheckCircle, 
  CircleAlert as AlertCircle, 
  Circle as XCircle, 
  Zap 
} from 'lucide-react-native';

interface IncidentDetailModalProps {
  readonly incident: any;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function IncidentDetailModal({ incident, visible, onClose }: IncidentDetailModalProps) {
  // Validación de props para evitar crashes
  if (!incident) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      default: return '#16A34A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#16A34A';
      case 'in_progress': return '#2563EB';
      case 'acknowledged': return '#D97706';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return CheckCircle;
      case 'in_progress': return Zap;
      case 'acknowledged': return AlertCircle;
      default: return XCircle;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      vehicle_breakdown: 'Avería de Vehículo',
      accident: 'Accidente',
      traffic_delay: 'Retraso de Tráfico',
      weather: 'Clima Adverso',
      security: 'Seguridad',
      other: 'Otro',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getSeverityLabel = (severity: string) => {
    const labels = {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo',
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      reported: 'Reportado',
      acknowledged: 'Reconocido',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Fecha no válida';
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openInMaps = () => {
    if (!incident.location || typeof incident.location.latitude !== 'number' || typeof incident.location.longitude !== 'number') {
      return;
    }
    const { latitude, longitude } = incident.location;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    void Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
    });
  };

  const severityColor = getSeverityColor(incident.severity || 'low');
  const statusColor = getStatusColor(incident.status || 'reported');
  const StatusIcon = getStatusIcon(incident.status || 'reported');

  // Validar que photos sea un array
  const photos = Array.isArray(incident.photos) ? incident.photos : [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle del Incidente</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status and Severity */}
          <View style={styles.statusSection}>
            <View style={[styles.severityBadge, { backgroundColor: `${severityColor}15` }]}>
              <AlertTriangle size={20} color={severityColor} />
              <Text style={[styles.severityText, { color: severityColor }]}>
                {getSeverityLabel(incident.severity || 'low')}
              </Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <StatusIcon size={20} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(incident.status || 'reported')}
              </Text>
            </View>
          </View>

          {/* Main Info */}
          <View style={styles.mainInfo}>
            <Text style={styles.incidentType}>
              {getTypeLabel(incident.type || 'other')}
            </Text>
            <Text style={styles.incidentTitle}>
              {incident.title || 'Sin título'}
            </Text>
            <Text style={styles.incidentDescription}>
              {incident.description || 'Sin descripción'}
            </Text>
          </View>

          {/* Meta Information */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <User size={20} color="#64748B" />
              <View style={styles.metaContent}>
                <Text style={styles.metaLabel}>Reportado por</Text>
                <Text style={styles.metaValue}>
                  {incident.reportedBy || 'Usuario desconocido'}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Clock size={20} color="#64748B" />
              <View style={styles.metaContent}>
                <Text style={styles.metaLabel}>Fecha y hora</Text>
                <Text style={styles.metaValue}>
                  {formatDateTime(incident.reportedAt || new Date().toISOString())}
                </Text>
              </View>
            </View>
          </View>

          {/* Location */}
          {incident.location && (
            <View style={styles.locationSection}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <View style={styles.locationCard}>
                <View style={styles.locationInfo}>
                  <MapPin size={20} color="#2563EB" />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationAddress}>
                      {incident.location.address || 'Ubicación GPS'}
                    </Text>
                    <Text style={styles.locationCoords}>
                      {typeof incident.location.latitude === 'number' && typeof incident.location.longitude === 'number'
                        ? `${incident.location.latitude.toFixed(6)}, ${incident.location.longitude.toFixed(6)}`
                        : 'Coordenadas no disponibles'
                      }
                    </Text>
                  </View>
                </View>
                {typeof incident.location.latitude === 'number' && typeof incident.location.longitude === 'number' && (
                  <TouchableOpacity style={styles.mapsButton} onPress={openInMaps}>
                    <Navigation size={20} color="#2563EB" />
                    <Text style={styles.mapsButtonText}>Ver en Mapas</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.sectionTitle}>
                <Camera size={20} color="#374151" /> Evidencia Fotográfica
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {photos.map((photo: string, index: number) => (
                    <View key={photo} style={styles.photoContainer}>
                      <Image 
                        source={{ uri: photo }} 
                        style={styles.photo}
                        onError={() => console.warn(`Error loading image: ${photo}`)}
                      />
                      <View style={styles.photoIndex}>
                        <Text style={styles.photoIndexText}>{index + 1}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Sync Status */}
          <View style={styles.syncSection}>
            <Text style={styles.sectionTitle}>Estado de Sincronización</Text>
            <View style={styles.syncCard}>
              <View style={[
                styles.syncIndicator,
                { backgroundColor: (incident.syncStatus === 'synced') ? '#16A34A' : '#F59E0B' }
              ]} />
              <Text style={styles.syncText}>
                {(incident.syncStatus === 'synced') ? 'Sincronizado' : 'Pendiente de sincronización'}
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
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 1,
    minWidth: 100,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 1,
    minWidth: 100,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  mainInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  incidentType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  incidentTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 28,
    flexWrap: 'wrap',
  },
  incidentDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  metaSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metaContent: {
    flex: 1,
    minWidth: 0,
  },
  metaLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flexWrap: 'wrap',
  },
  locationSection: {
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
    flexWrap: 'wrap',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  locationDetails: {
    flex: 1,
    minWidth: 0,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  locationCoords: {
    fontSize: 14,
    color: '#64748B',
    flexWrap: 'wrap',
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
    minHeight: 48,
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    flexShrink: 1,
  },
  photosSection: {
    marginBottom: 20,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  photoIndex: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  photoIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    flex: 1,
    flexWrap: 'wrap',
  },
});