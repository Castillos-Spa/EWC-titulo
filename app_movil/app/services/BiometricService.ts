import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface BiometricSettings {
  isEnabled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  lastUsed?: string;
}

export type BiometricAuthData =
  | { email: string; password: string }
  | { refreshToken: string };

class BiometricServiceClass {
  private readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private readonly BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';
  private readonly BIOMETRIC_REFRESH_TOKEN_KEY = 'biometric_refresh_token';

  async isSupported(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false; // Biometric not supported on web
      }
      
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.warn('Error checking biometric support:', error);
      return false;
    }
  }

  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      if (Platform.OS === 'web') {
        return []; // No biometric types on web
      }
      
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.warn('Error getting supported types:', error);
      return [];
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.warn('Error checking biometric enabled status:', error);
      return false;
    }
  }

  async enableBiometric(email: string, password: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        throw new Error('La autenticación biométrica no está disponible en la web');
      }
      
      const isSupported = await this.isSupported();
      if (!isSupported) {
        throw new Error('La autenticación biométrica no está disponible en este dispositivo');
      }

      // Authenticate first to confirm user identity
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad para habilitar el acceso biométrico',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña',
      });

      if (!result.success) {
        throw new Error('Autenticación biométrica fallida');
      }

      // Store credentials securely
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(this.BIOMETRIC_CREDENTIALS_KEY, credentials);
      await SecureStore.setItemAsync(this.BIOMETRIC_ENABLED_KEY, 'true');
      await SecureStore.setItemAsync('biometric_last_used', new Date().toISOString());

      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  // Recomendado: habilitar usando la sesión actual (usa refreshToken almacenado por la app)
  async enableBiometricUsingSession(): Promise<boolean> {
    if (Platform.OS === 'web') {
      throw new Error('La autenticación biométrica no está disponible en la web');
    }
    const isSupported = await this.isSupported();
    if (!isSupported) {
      throw new Error('La autenticación biométrica no está disponible en este dispositivo');
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirma tu identidad para habilitar el acceso biométrico',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
    });
    if (!result.success) {
      throw new Error('Autenticación biométrica fallida');
    }
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      throw new Error('No hay sesión válida para habilitar biometría');
    }
    await SecureStore.setItemAsync(this.BIOMETRIC_REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(this.BIOMETRIC_ENABLED_KEY, 'true');
    await SecureStore.setItemAsync('biometric_last_used', new Date().toISOString());
    return true;
  }

  async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(this.BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(this.BIOMETRIC_REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync('biometric_last_used');
    } catch (error) {
      console.warn('Error disabling biometric:', error);
    }
  }

  async authenticateWithBiometric(): Promise<BiometricAuthData | null> {
    try {
      if (Platform.OS === 'web') {
        return null; // Biometric not supported on web
      }
      
      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return null;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Usa tu huella dactilar o Face ID para iniciar sesión',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña',
      });

      if (!result.success) {
        return null;
      }

      // Primero, intentar con refreshToken si existe (estrategia recomendada)
      const storedRefresh = await SecureStore.getItemAsync(this.BIOMETRIC_REFRESH_TOKEN_KEY);
      if (storedRefresh) {
        await SecureStore.setItemAsync('biometric_last_used', new Date().toISOString());
        return { refreshToken: storedRefresh };
      }

      const credentialsString = await SecureStore.getItemAsync(this.BIOMETRIC_CREDENTIALS_KEY);
      if (!credentialsString) {
        // Credentials not found, disable biometric
        await this.disableBiometric();
        return null;
      }

      const credentials = JSON.parse(credentialsString);
      await SecureStore.setItemAsync('biometric_last_used', new Date().toISOString());
      
      return credentials;
    } catch (error) {
      console.error('Error authenticating with biometric:', error);
      return null;
    }
  }

  async getBiometricSettings(): Promise<BiometricSettings> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      const supportedTypes = await this.getSupportedTypes();
      const lastUsed = await SecureStore.getItemAsync('biometric_last_used');

      return {
        isEnabled,
        supportedTypes,
        lastUsed: lastUsed || undefined,
      };
    } catch (error) {
      console.warn('Error getting biometric settings:', error);
      return {
        isEnabled: false,
        supportedTypes: [],
      };
    }
  }

  getAuthenticationTypeLabel(type: LocalAuthentication.AuthenticationType): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Huella dactilar';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Reconocimiento facial';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Reconocimiento de iris';
      default:
        return 'Autenticación biométrica';
    }
  }
}

export const BiometricService = new BiometricServiceClass();