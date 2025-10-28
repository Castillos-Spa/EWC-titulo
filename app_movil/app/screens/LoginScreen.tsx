import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { LinearGradient } from 'expo-linear-gradient';
const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const { getColors } = useThemeStore();

  useEffect(() => {
    if (error) {
      Alert.alert('Error de Autenticación', error);
      clearError();
    }
  }, [error, clearError]);

  const colors = getColors();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }
    
    await login(email.trim(), password);
  };

  const handleForgotPassword = async () => {
    try {
      const resetUrl = (process.env as any)?.EXPO_PUBLIC_RESET_URL as string | undefined;
      const target = resetUrl && typeof resetUrl === 'string' && resetUrl.length > 0
        ? resetUrl
        : 'mailto:soporte@ewc.local?subject=Restablecer%20contrase%C3%B1a';
      const can = await Linking.canOpenURL(target);
      if (can) {
        await Linking.openURL(target);
      } else {
        Alert.alert('No se pudo abrir el enlace', 'Por favor contacta al administrador.');
      }
    } catch {
      Alert.alert('No se pudo abrir el enlace', 'Por favor contacta al administrador.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Brand gradient backdrop (web-like hero) */}
      <LinearGradient
        colors={[colors.primary + '22', '#00000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado similar a web */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.background }]}>
            <Image source={require('../../assets/images/icon.png')} style={{ width: 40, height: 40, borderRadius: 8 }} />
          </View>
          <Text style={[styles.companyName, { color: colors.text }]}>Empresas Wilson Castillo</Text>
          <Text style={[styles.companySubtitle, { color: colors.textSecondary }]}>Suite Operativa • Acceso</Text>
        </View>

        {/* Card de acceso (estilo web) */}
        <View style={[styles.loginCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.formTitle, { color: colors.text }]}>Iniciar sesión</Text>

          <View style={styles.form}>
            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Correo electrónico</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <Mail size={18} color="#64748B" />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="nombre@empresa.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  textContentType="username"
                />
              </View>
            </View>

            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Contraseña</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Lock size={18} color="#64748B" />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formActionsRow}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity disabled={isLoading} onPress={handleForgotPassword}>
                <Text style={[styles.linkText, { color: colors.primary }]}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Ingresar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Pie de página */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>© 2025 Empresas Wilson Castillo</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 60,
    minHeight: height,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  companySubtitle: {
    fontSize: 16,
  },
  loginCard: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 32,
    borderWidth: 1,
    // sombras suaves tipo web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  formActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testUsersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 48,
    marginTop: 16,
  },
  testUsersToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testUsersContainer: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 280,
    marginTop: 12,
  },
  testUsersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
  },
  testUsersTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  testUsersList: {
    maxHeight: 200,
  },
  testUserCard: {
    padding: 12,
    borderBottomWidth: 1,
  },
  testUserInfo: {
    gap: 4,
  },
  testUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  testUserEmail: {
    fontSize: 12,
    marginBottom: 6,
  },
  testUserRole: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  testUserRoleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
  },
});