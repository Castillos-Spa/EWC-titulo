import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { X, Camera, MapPin, Save, Navigation } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useIncidentStore } from '../stores/incidentStore';
import type { Incident } from '../stores/incidentStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';

interface CreateIncidentModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function CreateIncidentModal({ visible, onClose }: CreateIncidentModalProps) {
  const { createIncident, isSubmitting } = useIncidentStore();
  const { user } = useAuthStore();
  const { getColors } = useThemeStore();
  const colors = getColors();
  
  const [type, setType] = useState<Incident['type']>('other');
  const [severity, setSeverity] = useState<Incident['severity']>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const incidentTypes: readonly { value: Incident['type']; label: string; icon: string }[] = [
    { value: 'vehicle_breakdown', label: 'Avería de Vehículo', icon: '🚛' },
    { value: 'accident', label: 'Accidente', icon: '⚠️' },
    { value: 'traffic_delay', label: 'Retraso de Tráfico', icon: '🚦' },
    { value: 'weather', label: 'Clima Adverso', icon: '🌧️' },
    { value: 'security', label: 'Seguridad', icon: '🔒' },
    { value: 'other', label: 'Otro', icon: '📝' },
  ];

  const severityLevels: readonly { value: Incident['severity']; label: string; color: string }[] = [
    { value: 'low', label: 'Bajo', color: '#16A34A' },
    { value: 'medium', label: 'Medio', color: '#D97706' },
    { value: 'high', label: 'Alto', color: '#EA580C' },
    { value: 'critical', label: 'Crítico', color: '#DC2626' },
  ];

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación para reportar incidentes');
        setIsGettingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get address from coordinates
      try {
        const address = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address[0] ? 
            `${address[0].street || ''} ${address[0].streetNumber || ''}, ${address[0].city || ''}`.trim() :
            undefined,
        });
      } catch (addressError) {
        // If reverse geocoding fails, still save the coordinates
        console.warn('Fallo el reverseGeocode, usando solo coordenadas', addressError);
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: 'Ubicación GPS',
        });
      }
    } catch (error) {
      console.error('Error al obtener la ubicación actual', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de cámara para tomar fotos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error al acceder a la cámara', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Se requiere la ubicación para reportar el incidente');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Error', 'Se requiere al menos una foto como evidencia');
      return;
    }

    try {
      await createIncident({
        type,
        severity,
        title: title.trim(),
        description: description.trim(),
        location,
        photos,
        reportedBy: user?.name || 'Usuario',
        status: 'reported',
      });

      // Reset form
      setType('other');
      setSeverity('medium');
      setTitle('');
      setDescription('');
      setPhotos([]);
      setLocation(null);
      
      onClose();
      Alert.alert('Éxito', 'Incidente reportado correctamente');
    } catch (error) {
      console.error('Error al crear incidente', error);
      Alert.alert('Error', 'No se pudo crear el incidente');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Reportar Incidente</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tipo de Incidente</Text>
            <View style={styles.typeGrid}>
              {incidentTypes.map((incidentType) => (
                <TouchableOpacity
                  key={incidentType.value}
                  style={[
                    styles.typeCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    type === incidentType.value && styles.typeCardSelected,
                  ]}
                  onPress={() => setType(incidentType.value)}
                >
                  <Text style={styles.typeIcon}>{incidentType.icon}</Text>
                  <Text style={[
                    styles.typeLabel,
                    { color: colors.textSecondary },
                    type === incidentType.value && styles.typeLabelSelected,
                  ]}>
                    {incidentType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Severity Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nivel de Severidad</Text>
            <View style={styles.severityGrid}>
              {severityLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.severityButton,
                    { borderColor: level.color, backgroundColor: colors.surface },
                    severity === level.value && { backgroundColor: `${level.color}15` },
                  ]}
                  onPress={() => setSeverity(level.value)}
                >
                  <Text style={[
                    styles.severityLabel,
                    { color: colors.textSecondary },
                    { color: level.color },
                    severity === level.value && styles.severityLabelSelected,
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Título del Incidente</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Vehículo averiado en ruta principal"
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Descripción Detallada</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el incidente con el mayor detalle posible..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>{description.length}/500</Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ubicación</Text>
            <View style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {(() => {
                if (isGettingLocation) {
                  return (
                    <View style={styles.locationLoading}>
                      <Navigation size={24} color="#2563EB" />
                      <Text style={[styles.locationLoadingText, { color: colors.primary }]}>Obteniendo ubicación...</Text>
                    </View>
                  );
                }
                if (location) {
                  return (
                    <View style={styles.locationInfo}>
                      <MapPin size={20} color="#16A34A" />
                      <View style={styles.locationDetails}>
                        <Text style={[styles.locationAddress, { color: colors.text }]}>
                          {location.address || 'Ubicación capturada'}
                        </Text>
                        <Text style={[styles.locationCoords, { color: colors.textSecondary }]}>
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </Text>
                      </View>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                    <MapPin size={24} color="#2563EB" />
                    <Text style={[styles.locationButtonText, { color: colors.primary }]}>Obtener Ubicación Actual</Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Evidencia Fotográfica</Text>
            <Text style={[styles.photoRequirement, { color: colors.error }]}>
              * Se requiere al menos 1 foto
            </Text>
            
            <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={handleTakePhoto}>
              <Camera size={24} color="#2563EB" />
              <Text style={[styles.photoButtonText, { color: colors.primary }]}>Tomar Foto</Text>
            </TouchableOpacity>

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={photo} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Reportando...' : 'Reportar Incidente'}
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  typeCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  typeLabelSelected: {
    color: '#2563EB',
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  severityLabelSelected: {
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 56,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    minHeight: 64,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  locationLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  photoRequirement: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
    fontWeight: '500',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    minHeight: 64,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    justifyContent: 'flex-start',
  },
  photoContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});