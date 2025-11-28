import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings, User, Shield, Fingerprint, Bell, Moon, Globe, CircleHelp as HelpCircle, LogOut, ChevronRight, Lock, Info } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { AuthService } from '@/services/AuthService';
import { useThemeStore } from '@/stores/themeStore';
import { BiometricService } from '@/services/BiometricService';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, enableBiometricForCurrentSession } = useAuthStore();
  const { isDarkMode, toggleTheme, getColors } = useThemeStore();
  
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('es');
  // Estado para cambio de contraseña (reemplaza Alert.prompt no soportado en web)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // Estado para confirmación de cierre de sesión (web-safe)
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadBiometricSettings();
    loadAppSettings();
  }, []);

  const loadBiometricSettings = async () => {
    try {
      const supported = await BiometricService.isSupported();
      const settings = await BiometricService.getBiometricSettings();
      
      setBiometricSupported(supported);
      setBiometricEnabled(settings.isEnabled);
      setSupportedTypes(settings.supportedTypes);
    } catch (error) {
      console.warn('Error loading biometric settings:', error);
    }
  };

  const loadAppSettings = async () => {
    // En una app real, cargarías estas configuraciones desde AsyncStorage o SecureStore
    try {
      // Simular carga de configuraciones
      setNotificationsEnabled(true);
      setLanguage('es');
    } catch (error) {
      console.warn('Error loading app settings:', error);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!biometricSupported) {
      Alert.alert(
        'No Disponible',
        'La autenticación biométrica no está disponible en este dispositivo o no tienes datos biométricos registrados.'
      );
      return;
    }

    setIsLoading(true);
    
    try {
      if (enabled) {
        try {
          const ok = await enableBiometricForCurrentSession();
          if (ok) {
            setBiometricEnabled(true);
            Alert.alert('Éxito', 'Autenticación biométrica habilitada correctamente');
          } else {
            Alert.alert('Error', 'No se pudo habilitar la autenticación biométrica');
          }
        } catch (e) {
          console.error('enableBiometricForCurrentSession failed', e);
          Alert.alert('Error', 'No se pudo habilitar la autenticación biométrica');
        }
      } else {
        // Disable biometric
        Alert.alert(
          'Deshabilitar Biometría',
          '¿Estás seguro de que quieres deshabilitar el acceso biométrico?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Deshabilitar', 
              style: 'destructive',
              onPress: () => {
                BiometricService.disableBiometric()
                  .then(() => {
                    setBiometricEnabled(false);
                    Alert.alert('Éxito', 'Autenticación biométrica deshabilitada');
                  })
                  .catch((error) => {
                    console.error('disableBiometric failed', error);
                    Alert.alert('Error', 'No se pudo deshabilitar la autenticación biométrica');
                  });
              }
            },
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Flujos con prompts de email/contraseña se reemplazaron por enableBiometricForCurrentSession

  const handleNotificationsToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    // En una app real, guardarías esta configuración
    Alert.alert(
      'Notificaciones',
      enabled ? 'Notificaciones habilitadas' : 'Notificaciones deshabilitadas'
    );
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    await toggleTheme();
    Alert.alert(
      'Tema',
      enabled ? 'Tema oscuro activado' : 'Tema claro activado',
      [{ text: 'Entendido' }]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Cambiar Idioma',
      'Selecciona el idioma de la aplicación:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Español', onPress: () => setLanguage('es') },
        { text: 'English', onPress: () => setLanguage('en') },
        { text: 'Português', onPress: () => setLanguage('pt') },
      ]
    );
  };

  const handleChangePassword = () => {
    // Abrimos modal propio para compatibilidad con web (Alert.prompt no está soportado)
    setPasswordError(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  const submitPasswordChange = async () => {
    // Validaciones simples
    if (!currentPassword) {
      setPasswordError('Debes ingresar tu contraseña actual.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setChangingPassword(true);
    setPasswordError(null);
    try {
      const userId = user?.id;
      if (!userId) throw new Error('Usuario no disponible');
      await AuthService.changePassword(userId, currentPassword, newPassword);
      closePasswordModal();
      // Cerrar sesión automáticamente para reingresar con la nueva contraseña
      await logout();
      Alert.alert('Contraseña actualizada', 'Inicia sesión nuevamente con tu nueva contraseña');
    } catch (e) {
      console.error('Error cambiando contraseña', e);
      const msg = e instanceof Error ? e.message : 'No se pudo cambiar la contraseña';
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      'Privacidad y Seguridad',
      'Configuraciones de privacidad:',
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Limpiar Datos Locales', onPress: () => handleClearLocalData() },
        { text: 'Ver Política de Privacidad', onPress: () => handleViewPrivacyPolicy() },
      ]
    );
  };

  const handleClearLocalData = () => {
    Alert.alert(
      'Limpiar Datos Locales',
      '¿Estás seguro? Esto eliminará todos los datos almacenados localmente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpiar', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Éxito', 'Datos locales eliminados correctamente');
          }
        },
      ]
    );
  };

  const handleViewPrivacyPolicy = () => {
    Alert.alert(
      'Política de Privacidad',
      'Empresas Wilson Castillo se compromete a proteger tu privacidad y datos personales de acuerdo con las normativas vigentes.\n\nTus datos se utilizan únicamente para operaciones corporativas y no se comparten con terceros.',
      [{ text: 'Entendido' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Ayuda y Soporte',
      'Opciones de soporte disponibles:',
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'FAQ', onPress: () => showFAQ() },
        { text: 'Contactar Soporte', onPress: () => contactSupport() },
        { text: 'Reportar Bug', onPress: () => reportBug() },
      ]
    );
  };

  const showFAQ = () => {
    Alert.alert(
      'Preguntas Frecuentes',
      '• ¿Cómo reporto un incidente?\n  Ve a la pestaña Incidentes y presiona el botón +\n\n• ¿Puedo usar la app sin internet?\n  Sí, la app funciona offline y sincroniza cuando hay conexión\n\n• ¿Cómo cambio mi contraseña?\n  Ve a Configuración > Seguridad > Cambiar Contraseña',
      [{ text: 'Entendido' }]
    );
  };

  const contactSupport = () => {
    Alert.alert(
      'Contactar Soporte',
      'Soporte TIC - Empresas Wilson Castillo\n\n📧 soporte@wilsoncastillo.com\n📞 +54 11 1234-5678\n\nHorario: Lunes a Viernes 8:00 - 18:00',
      [{ text: 'Entendido' }]
    );
  };

  const reportBug = () => {
    Alert.alert(
      'Reportar Bug',
      'Para reportar un problema técnico, contacta al área TIC con:\n\n• Descripción del problema\n• Pasos para reproducirlo\n• Capturas de pantalla si es posible',
      [{ text: 'Entendido' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de Field Operations',
      'Hub Corporativo Móvil\nEmpresas Wilson Castillo\n\nVersión: 1.0.0\nBuild: 2025.01.001\n\nDesarrollado para optimizar las operaciones de campo y mejorar la productividad empresarial.\n\n© 2025 Empresas Wilson Castillo\nTodos los derechos reservados.',
      [{ text: 'Cerrar' }]
    );
  };

  const handleLogout = async () => {
    // Abrimos modal propio en lugar de Alert con múltiples botones (compatibilidad web)
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => setShowLogoutModal(false);
  const confirmLogout = () => {
    setLoggingOut(true);
    try {
      void logout();
      // Si logout redirige, el modal se desmontará; en otro caso lo cerramos
      setShowLogoutModal(false);
    } catch (e) {
      console.error('Error en logout', e);
    } finally {
      setLoggingOut(false);
    }
  };

  const getBiometricTypeText = () => {
    if (supportedTypes.length === 0) return 'No disponible';
    
    const types = supportedTypes.map(type => 
      BiometricService.getAuthenticationTypeLabel(type)
    );
    
    return types.join(', ');
  };

  const getRoleDisplayName = (role: string) => {
    const roles = {
      driver: 'Conductor',
      supervisor: 'Supervisor',
      technician: 'Técnico',
      admin: 'Administrador',
      cleaning_crew: 'Personal de Aseo',
      civil_works: 'Obras Civiles',
      it_support: 'Soporte TIC',
      manager: 'Gerente',
      finance: 'Finanzas',
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getDepartmentName = (department: string) => {
    const departments = {
      transport: 'Transporte',
      cleaning: 'Aseo',
      civil_works: 'Obras Civiles',
      it: 'Tecnología',
      management: 'Gerencia',
      finance: 'Finanzas',
    };
    return departments[department as keyof typeof departments] || department;
  };

  const getLanguageLabel = (lang: string) => {
    const languages = {
      es: 'Español',
      en: 'English',
      pt: 'Português',
    };
    return languages[lang as keyof typeof languages] || lang;
  };

  const biometricStatusText = biometricEnabled ? 'Habilitada' : 'Deshabilitada';
  const biometricSubtitle = biometricSupported
    ? `${getBiometricTypeText()} • ${biometricStatusText}`
    : 'No disponible en este dispositivo';

  const settingsSections = [
    {
      title: 'Seguridad',
      items: [
        {
          icon: Fingerprint,
          title: 'Autenticación Biométrica',
          subtitle: biometricSubtitle,
          hasSwitch: biometricSupported,
          switchValue: biometricEnabled,
          onSwitchChange: (v: boolean) => { void handleBiometricToggle(v); },
          disabled: !biometricSupported || isLoading,
        },
        {
          icon: Lock,
          title: 'Cambiar Contraseña',
          subtitle: 'Actualiza tu contraseña de acceso',
          onPress: handleChangePassword,
          disabled: false,
        },
        {
          icon: Shield,
          title: 'Privacidad y Seguridad',
          subtitle: 'Configuración de privacidad y datos',
          onPress: handlePrivacySettings,
          disabled: false,
        },
      ],
    },
    {
      title: 'Aplicación',
      items: [
        {
          icon: Bell,
          title: 'Notificaciones',
          subtitle: notificationsEnabled ? 'Habilitadas' : 'Deshabilitadas',
          hasSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchChange: (v: boolean) => { void handleNotificationsToggle(v); },
          disabled: false,
        },
        {
          icon: Moon,
          title: 'Tema',
          subtitle: isDarkMode ? 'Oscuro' : 'Claro',
          hasSwitch: true,
          switchValue: isDarkMode,
          onSwitchChange: (v: boolean) => { void handleDarkModeToggle(v); },
          disabled: false,
        },
        {
          icon: Globe,
          title: 'Idioma',
          subtitle: getLanguageLabel(language),
          onPress: handleLanguageChange,
          disabled: false,
        },
      ],
    },
    {
      title: 'Soporte',
      items: [
        {
          icon: HelpCircle,
          title: 'Ayuda y Soporte',
          subtitle: 'FAQ, contacto y reportar problemas',
          onPress: handleHelpSupport,
          disabled: false,
        },
        {
          icon: Info,
          title: 'Acerca de',
          subtitle: 'Versión 1.0.0 • Build 2025.01.001',
          onPress: handleAbout,
          disabled: false,
        },
      ],
    },
  ];

  const colors = getColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitle}>
          <Settings size={28} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Configuración</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile */}
        <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
          <View style={styles.avatar}>
            <User size={32} color="#2563EB" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
            <View style={styles.userBadges}>
              <View style={styles.userRole}>
                <Text style={styles.userRoleText}>
                  {getRoleDisplayName(user?.role || '')}
                </Text>
              </View>
              <View style={styles.userDepartment}>
                <Text style={styles.userDepartmentText}>
                  {getDepartmentName(user?.department || '')}
                </Text>
              </View>
            </View>
            <Text style={[styles.employeeId, { color: colors.textSecondary }]}>ID: {user?.employeeId}</Text>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={`${section.title}-${item.title}`}
                  style={[
                    styles.settingItem,
                    // border for all but last item
                    section.items.findIndex(i => i.title === item.title) < section.items.length - 1 && styles.settingItemBorder,
                    item.disabled && styles.settingItemDisabled,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled || item.hasSwitch}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={styles.settingIcon}>
                      <item.icon size={24} color="#2563EB" />
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.settingItemRight}>
                    {item.hasSwitch ? (
                      <Switch
                        value={item.switchValue}
                        onValueChange={(v) => { item.onSwitchChange?.(v); }}
                        disabled={item.disabled}
                        trackColor={{ false: colors.border, true: colors.success }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor={colors.border}
                      />
                    ) : (
                      <ChevronRight size={20} color="#94A3B8" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.error }]} onPress={handleLogout}>
            <LogOut size={24} color="#DC2626" />
            <Text style={[styles.logoutButtonText, { color: colors.error }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={[styles.appInfo, { backgroundColor: colors.surface }]}>
          <Text style={[styles.appInfoText, { color: colors.text }]}>
            Field Operations v1.0.0
          </Text>
          <Text style={[styles.appInfoSubtext, { color: colors.primary }]}>
            Hub Corporativo Móvil • Empresas Wilson Castillo
          </Text>
          <Text style={[styles.appInfoCopyright, { color: colors.textSecondary }]}>
            © 2025 Todos los derechos reservados
          </Text>
        </View>
      </ScrollView>
      {/* Modal Cambio de Contraseña (compatible Web) */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
      >
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Cambiar Contraseña</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Por favor ingresa tu contraseña actual y la nueva.</Text>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Contraseña Actual</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Nueva Contraseña</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Confirmar Nueva Contraseña</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                autoCapitalize="none"
              />
            </View>

            {passwordError ? (
              <Text style={[styles.modalError, { color: colors.error }]}>{passwordError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closePasswordModal}
                style={[styles.modalButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                disabled={changingPassword}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitPasswordChange}
                style={[styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                disabled={changingPassword}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonTextPrimary]}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal Cerrar Sesión (compatible Web) */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={closeLogoutModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Cerrar Sesión</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>¿Estás seguro de que quieres cerrar sesión?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeLogoutModal}
                style={[styles.modalButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                disabled={loggingOut}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                style={[styles.modalButtonPrimary, { backgroundColor: colors.error }]}
                disabled={loggingOut}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextPrimary}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: '#EFF6FF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  userRole: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  userDepartment: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userDepartmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  employeeId: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 72,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
  settingItemRight: {
    marginLeft: 12,
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 16,
    minHeight: 56,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 8,
    textAlign: 'center',
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalField: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalError: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalButtonPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});