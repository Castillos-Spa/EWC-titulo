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
import { 
  X, 
  Camera, 
  MapPin, 
  Fuel, 
  Save, 
  Navigation, 
  Gauge,
  // Receipt,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFuelStore } from '@/stores/fuelStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

interface CreateFuelRecordModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly initialType?: 'consumption' | 'refuel';
  readonly vehicleId?: string;
  readonly vehiclePlate?: string;
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
  const { getColors } = useThemeStore();
  const colors = getColors();
  
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
      console.error('Error al obtener ubicación actual', error);
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
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = Number.parseFloat(amount);
    if (!amount.trim() || Number.isNaN(parsedAmount)) {
      Alert.alert('Error', 'Ingresa una cantidad válida de combustible');
      return;
    }

    const parsedOdometer = Number.parseInt(odometer, 10);
    if (!odometer.trim() || Number.isNaN(parsedOdometer)) {
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
        amount: parsedAmount,
        odometer: parsedOdometer,
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
      console.error('Error al guardar registro de combustible', error);
      Alert.alert('Error', 'No se pudo guardar el registro');
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
          <Text style={[styles.title, { color: colors.text }]}>Registro de Combustible</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tipo de Registro</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  type === 'consumption' && { borderColor: colors.primary },
                ]}
                onPress={() => setType('consumption')}
              >
                <TrendingDown size={24} color={type === 'consumption' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.typeButtonText,
                  { color: colors.textSecondary },
                  type === 'consumption' && { color: colors.primary },
                ]}>
                  Consumo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  type === 'refuel' && { borderColor: colors.success },
                ]}
                onPress={() => setType('refuel')}
              >
                <TrendingUp size={24} color={type === 'refuel' ? colors.success : colors.textSecondary} />
                <Text style={[
                  styles.typeButtonText,
                  { color: colors.textSecondary },
                  type === 'refuel' && { color: colors.success },
                ]}>
                  Reabastecimiento
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={[styles.vehicleInfo, { backgroundColor: colors.card }]}>
            <Fuel size={20} color={colors.primary} />
            <Text style={[styles.vehicleText, { color: colors.primary }]}>Vehículo: {vehiclePlate}</Text>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Cantidad de Combustible (Litros)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder={type === 'refuel' ? 'Ej: 150.5' : 'Ej: 25.3'}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Odometer */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Kilometraje Actual</Text>
            <View style={[styles.inputWithIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Gauge size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.inputWithIconText, { color: colors.text }]}
                value={odometer}
                onChangeText={setOdometer}
                placeholder="Ej: 125000"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={[styles.inputUnit, { color: colors.textSecondary }]}>km</Text>
            </View>
          </View>

          {/* Station Name (only for refuel) */}
          {type === 'refuel' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Estación de Servicio</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={stationName}
                onChangeText={setStationName}
                placeholder="Nombre de la estación"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ubicación</Text>
            <View style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Extraído ternario anidado para mejorar legibilidad */}
              {(() => {
                if (isGettingLocation) {
                  return (
                    <View style={styles.locationLoading}>
                      <Navigation size={24} color={colors.primary} />
                      <Text style={[styles.locationLoadingText, { color: colors.primary }]}>Obteniendo ubicación...</Text>
                    </View>
                  );
                }
                if (location) {
                  return (
                    <View style={styles.locationInfo}>
                      <MapPin size={20} color={colors.success} />
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
                  <TouchableOpacity style={styles.locationButton} onPress={() => void getCurrentLocation()}>
                    <MapPin size={24} color={colors.primary} />
                    <Text style={[styles.locationButtonText, { color: colors.primary }]}>Obtener Ubicación Actual</Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>

          {/* Receipt Photo (optional for refuel) */}
          {type === 'refuel' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Foto del Recibo (Opcional)</Text>
              
              <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={() => void handleTakePhoto()}>
                <Camera size={24} color={colors.primary} />
                <Text style={[styles.photoButtonText, { color: colors.primary }]}>
                  {receiptPhoto ? 'Cambiar Foto' : 'Tomar Foto del Recibo'}
                </Text>
              </TouchableOpacity>

              {receiptPhoto && (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: receiptPhoto }} style={styles.photo} />
                  <TouchableOpacity
                    style={[styles.removePhotoButton, { backgroundColor: colors.error }]}
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notas Adicionales (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Observaciones, comentarios..."
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textSecondary}
              maxLength={300}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>{notes.length}/300</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.card }]} onPress={onClose}>
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.success }, isSubmitting && styles.buttonDisabled]} 
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
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