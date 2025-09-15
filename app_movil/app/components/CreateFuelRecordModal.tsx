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
  Switch,
} from 'react-native';
import { 
  X, 
  Camera, 
  MapPin, 
  Fuel, 
  Save, 
  Navigation, 
  Gauge,
  Receipt,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFuelStore } from '../stores/fuelStore';
import { useAuthStore } from '../stores/authStore';

interface CreateFuelRecordModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: 'consumption' | 'refuel';
  vehicleId?: string;
  vehiclePlate?: string;
}

export function CreateFuelRecordModal({ 
  visible, 
  onClose, 
  initialType = 'consumption',
  vehicleId = 'truck-001',
  vehiclePlate = 'ABC-123'
}: CreateFuelRecordModalProps) {
  const { createFuelRecord, isSubmitting } = useFuelStore();
  const { user } = useAuthStore();
  
  const [type, setType] = useState<'consumption' | 'refuel'>(initialType);
  const [amount, setAmount] = useState('');
  const [odometer, setOdometer] = useState('');
  const [stationName, setStationName] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<any>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
      setType(initialType);
    }
  }, [visible, initialType]);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación para registrar combustible');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get address from coordinates
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
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos de cámara para tomar fotos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Ingresa una cantidad válida de combustible');
      return;
    }

    if (!odometer.trim() || isNaN(parseInt(odometer))) {
      Alert.alert('Error', 'Ingresa un kilometraje válido');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Se requiere la ubicación para el registro');
      return;
    }

    if (type === 'refuel' && !stationName.trim()) {
      Alert.alert('Error', 'El nombre de la estación es obligatorio para reabastecimientos');
      return;
    }

    try {
      await createFuelRecord({
        vehicleId,
        vehiclePlate,
        driverId: user?.id || '1',
        driverName: user?.name || 'Usuario',
        type,
        amount: parseFloat(amount),
        odometer: parseInt(odometer),
        location,
        stationName: stationName.trim() || undefined,
        receiptPhoto: receiptPhoto || undefined,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setAmount('');
      setOdometer('');
      setStationName('');
      setReceiptPhoto(null);
      setNotes('');
      setLocation(null);
      
      onClose();
      Alert.alert('Éxito', 'Registro de combustible guardado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el registro');
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
          <Text style={styles.title}>Registro de Combustible</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Registro</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'consumption' && styles.typeButtonSelected,
                ]}
                onPress={() => setType('consumption')}
              >
                <TrendingDown size={24} color={type === 'consumption' ? '#2563EB' : '#64748B'} />
                <Text style={[
                  styles.typeButtonText,
                  type === 'consumption' && styles.typeButtonTextSelected,
                ]}>
                  Consumo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'refuel' && styles.typeButtonSelected,
                ]}
                onPress={() => setType('refuel')}
              >
                <TrendingUp size={24} color={type === 'refuel' ? '#16A34A' : '#64748B'} />
                <Text style={[
                  styles.typeButtonText,
                  type === 'refuel' && styles.typeButtonTextSelected,
                ]}>
                  Reabastecimiento
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleInfo}>
            <Fuel size={20} color="#2563EB" />
            <Text style={styles.vehicleText}>Vehículo: {vehiclePlate}</Text>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Cantidad de Combustible (Litros)
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder={type === 'refuel' ? 'Ej: 150.5' : 'Ej: 25.3'}
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Odometer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kilometraje Actual</Text>
            <View style={styles.inputWithIcon}>
              <Gauge size={20} color="#64748B" />
              <TextInput
                style={styles.inputWithIconText}
                value={odometer}
                onChangeText={setOdometer}
                placeholder="Ej: 125000"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.inputUnit}>km</Text>
            </View>
          </View>

          {/* Station Name (only for refuel) */}
          {type === 'refuel' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estación de Servicio</Text>
              <TextInput
                style={styles.input}
                value={stationName}
                onChangeText={setStationName}
                placeholder="Nombre de la estación"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.locationCard}>
              {isGettingLocation ? (
                <View style={styles.locationLoading}>
                  <Navigation size={24} color="#2563EB" />
                  <Text style={styles.locationLoadingText}>Obteniendo ubicación...</Text>
                </View>
              ) : location ? (
                <View style={styles.locationInfo}>
                  <MapPin size={20} color="#16A34A" />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationAddress}>
                      {location.address || 'Ubicación capturada'}
                    </Text>
                    <Text style={styles.locationCoords}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                  <MapPin size={24} color="#2563EB" />
                  <Text style={styles.locationButtonText}>Obtener Ubicación Actual</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Receipt Photo (optional for refuel) */}
          {type === 'refuel' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Foto del Recibo (Opcional)</Text>
              
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Camera size={24} color="#2563EB" />
                <Text style={styles.photoButtonText}>
                  {receiptPhoto ? 'Cambiar Foto' : 'Tomar Foto del Recibo'}
                </Text>
              </TouchableOpacity>

              {receiptPhoto && (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: receiptPhoto }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setReceiptPhoto(null)}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas Adicionales (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Observaciones, comentarios..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#94A3B8"
              maxLength={300}
            />
            <Text style={styles.charCount}>{notes.length}/300</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
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
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    gap: 8,
  },
  typeButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeButtonTextSelected: {
    color: '#2563EB',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 4,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    gap: 12,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 16,
  },
  inputUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  textArea: {
    minHeight: 96,
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
    alignItems: 'center',
    gap: 12,
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
  photoPreview: {
    marginTop: 16,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
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
    backgroundColor: '#16A34A',
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