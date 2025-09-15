import React, { useState } from 'react';
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
  FileText,
  User,
  Fuel,
  PenTool,
  Save,
  MapPin,
  Clock,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouteStore } from '../stores/routeStore';
import { SignatureModal } from './SignatureModal';

interface TripModalProps {
  trip: any;
  visible: boolean;
  onClose: () => void;
}

export default function TripModal({ trip, visible, onClose }: TripModalProps) {
  const { completeTrip, addTripPhoto, currentRoute } = useRouteStore();
  const [fuelConsumption, setFuelConsumption] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStop = currentRoute?.stops.find(stop => stop.id === trip?.stopId);

  const handleTakePhoto = async () => {
    try {
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

      if (!result.canceled && result.assets[0] && trip) {
        addTripPhoto(trip.id, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleComplete = async () => {
    if (!trip) return;

    if (!recipient.trim()) {
      Alert.alert('Error', 'El nombre del receptor es obligatorio');
      return;
    }

    if (trip.photos.length === 0) {
      Alert.alert('Error', 'Se requiere al menos una foto como evidencia');
      return;
    }

    if (!signature) {
      Alert.alert('Error', 'Se requiere la firma del receptor');
      return;
    }
    setIsSubmitting(true);
    try {
      await completeTrip({
        id: trip.id,
        fuelConsumption: fuelConsumption ? parseFloat(fuelConsumption) : undefined,
        recipient: recipient.trim(),
        notes: notes.trim(),
        signaturePath: signature,
      });
      onClose();
      Alert.alert('Éxito', 'Viaje completado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar el viaje');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignatureModal(false);
  };
  if (!trip) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Completar Viaje</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stop Info */}
          {currentStop && (
            <View style={styles.stopInfo}>
              <View style={styles.stopHeader}>
                <MapPin size={20} color="#2563EB" />
                <Text style={styles.stopTitle}>{currentStop.clientName}</Text>
              </View>
              <Text style={styles.stopJob}>{currentStop.jobDescription}</Text>
              <View style={styles.stopDetails}>
                <Clock size={16} color="#64748B" />
                <Text style={styles.stopTime}>{currentStop.timeSlot}</Text>
              </View>
              <Text style={styles.stopAddress}>{currentStop.address}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Fuel Consumption */}
            <View style={styles.field}>
              <Text style={styles.label}>
                <Fuel size={16} color="#64748B" /> Consumo de Combustible (L)
              </Text>
              <TextInput
                style={styles.input}
                value={fuelConsumption}
                onChangeText={setFuelConsumption}
                placeholder="Ej: 25.5"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Recipient */}
            <View style={styles.field}>
              <Text style={styles.label}>
                <User size={16} color="#64748B" /> Receptor (Obligatorio)
              </Text>
              <TextInput
                style={[styles.input, !recipient.trim() && styles.inputRequired]}
                value={recipient}
                onChangeText={setRecipient}
                placeholder="Nombre completo del receptor"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>
                <FileText size={16} color="#64748B" /> Notas Adicionales
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Observaciones, comentarios..."
                multiline
                numberOfLines={3}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Photos Section */}
            <View style={styles.field}>
              <Text style={styles.label}>
                <Camera size={16} color="#64748B" /> Evidencia Fotográfica
              </Text>
              <Text style={styles.photoRequirement}>
                * Se requiere al menos 1 foto
              </Text>
              
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Camera size={24} color="#2563EB" />
                <Text style={styles.photoButtonText}>Tomar Foto</Text>
              </TouchableOpacity>

              {trip.photos && trip.photos.length > 0 && (
                <View style={styles.photoGrid}>
                  {trip.photos.map((photo: string, index: number) => (
                    <View key={index} style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.photo} />
                      <Text style={styles.photoIndex}>{index + 1}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Digital Signature */}
            <View style={styles.field}>
              <Text style={styles.label}>
                <PenTool size={16} color="#64748B" /> Firma Digital
              </Text>
              <TouchableOpacity 
                style={styles.signatureButton}
                onPress={() => setShowSignatureModal(true)}
              >
                <PenTool size={24} color="#2563EB" />
                <Text style={styles.signatureButtonText}>
                  {signature ? 'Cambiar Firma' : 'Capturar Firma'}
                </Text>
              </TouchableOpacity>
              
              {signature && (
                <View style={styles.signaturePreview}>
                  <Image source={{ uri: signature }} style={styles.signatureImage} />
                  <Text style={styles.signatureConfirm}>✓ Firma capturada</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.completeButton, isSubmitting && styles.buttonDisabled]} 
            onPress={handleComplete}
            disabled={isSubmitting}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>
              {isSubmitting ? 'Guardando...' : 'Completar Viaje'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Signature Modal */}
      <SignatureModal
        visible={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureSave}
        title="Firma del Receptor"
      />
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
    paddingBottom: 20,
  },
  stopInfo: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  stopTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    minWidth: 0,
  },
  stopJob: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 22,
  },
  stopDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  stopTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  stopAddress: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  inputRequired: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
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
  photoIndex: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 20,
    minHeight: 64,
  },
  signatureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
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
  completeButton: {
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
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signaturePreview: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
  },
  signatureImage: {
    width: 200,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  signatureConfirm: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
});