import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { X, RotateCcw, Save } from 'lucide-react-native';
import { Platform } from 'react-native';

// Only import signature canvas on native platforms
let SignatureScreen: any = null;
if (Platform.OS !== 'web') {
  try {
    SignatureScreen = require('react-native-signature-canvas').default;
  } catch (error) {
    console.warn('Signature canvas not available:', error);
  }
}

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

export function SignatureModal({ 
  visible, 
  onClose, 
  onSave, 
  title = "Capturar Firma" 
}: SignatureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const signatureRef = useRef<any>(null);

  const { width, height } = Dimensions.get('window');
  const signatureHeight = Math.min(height * 0.4, 300);

  const handleOK = (signature: string) => {
    if (!signature) {
      Alert.alert('Error', 'Por favor dibuja tu firma antes de guardar');
      return;
    }
    
    setIsLoading(true);
    try {
      onSave(signature);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la firma');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmpty = () => {
    Alert.alert('Error', 'Por favor dibuja tu firma antes de guardar');
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };

  const handleBegin = () => {
    // Signature started
  };

  const handleEnd = () => {
    // Signature ended
  };

  // If signature canvas is not available, show alternative
  if (!SignatureScreen) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.notAvailableContainer}>
            <Shield size={64} color="#94A3B8" />
            <Text style={styles.notAvailableTitle}>Firma Digital No Disponible</Text>
            <Text style={styles.notAvailableText}>
              La funcionalidad de firma digital no está disponible en esta plataforma.
              En un entorno de producción, esta función estaría habilitada.
            </Text>
            <TouchableOpacity style={styles.mockSignatureButton} onPress={() => {
              onSave('data:image/png;base64,mock-signature-data');
              onClose();
            }}>
              <Text style={styles.mockSignatureText}>Simular Firma (Demo)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const style = `
    .m-signature-pad--footer {
      display: none;
      margin: 0px;
    }
    .m-signature-pad {
      position: fixed;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border: none;
      background-color: #ffffff;
    }
    body,html {
      width: 100%; 
      height: 100%;
      margin: 0;
      padding: 0;
    }
  `;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Dibuja tu firma en el área blanca de abajo
          </Text>
        </View>

        {/* Signature Area */}
        <View style={[styles.signatureContainer, { height: signatureHeight }]}>
          <SignatureScreen
            ref={signatureRef}
            onOK={handleOK}
            onEmpty={handleEmpty}
            onBegin={handleBegin}
            onEnd={handleEnd}
            autoClear={false}
            descriptionText=""
            clearText="Limpiar"
            confirmText="Guardar"
            webStyle={style}
            backgroundColor="#ffffff"
            penColor="#000000"
            trimWhitespace={true}
            rotateClockwise={false}
            imageType="image/png"
          />
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClear}
          >
            <RotateCcw size={20} color="#64748B" />
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.buttonDisabled]} 
            onPress={() => signatureRef.current?.readSignature()}
            disabled={isLoading}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Guardando...' : 'Guardar Firma'}
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
  instructions: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  instructionText: {
    fontSize: 16,
    color: '#2563EB',
    textAlign: 'center',
    fontWeight: '500',
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
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
  clearButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  notAvailableContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  notAvailableTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  notAvailableText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  mockSignatureButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  mockSignatureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});