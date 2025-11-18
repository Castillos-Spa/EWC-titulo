import React, { useState } from 'react';
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Sun, Moon } from 'lucide-react-native';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';

const { height } = Dimensions.get('window');

// Estilos (arriba para evitar "used before declaration")
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
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
  halosContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  haloTop: {
    position: 'absolute',
    top: -height * 0.1,
    left: -60,
    width: height * 0.35,
    height: height * 0.35,
    borderRadius: 9999,
    opacity: 0.7,
  },
  haloBottom: {
    position: 'absolute',
    bottom: -height * 0.15,
    right: -60,
    width: height * 0.38,
    height: height * 0.38,
    borderRadius: 9999,
    opacity: 0.6,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  themeToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
  },
  themeToggleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  heroSection: { gap: 12, marginBottom: 28 },
  heroBadge: {
    alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  heroText: { fontSize: 14 },
  heroChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
  },
  heroChipText: { fontSize: 12, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 999 },

  loginCard: {
    borderRadius: 20, padding: 20, marginHorizontal: 16, marginBottom: 32, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  cardIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '700' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  form: { gap: 16 },
  errorBanner: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontSize: 13, fontWeight: '600' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  eyeButton: { padding: 8 },
  loginButtonGradient: {
    paddingVertical: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 2,
  },
  loginButtonDisabled: { backgroundColor: '#9CA3AF' },
  loginButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  formActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkText: { fontSize: 12, fontWeight: '600' },
  cardFooter: { borderTopWidth: 1, marginTop: 20, paddingTop: 16, borderColor: '#00000010' },
  supportChip: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
  },
  supportChipText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  footer: { alignItems: 'center', paddingTop: 20 },
  footerText: { fontSize: 12 },
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const { getColors, toggleTheme, isDarkMode } = useThemeStore();

  const colors = getColors();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }
    clearError();
    await login(email.trim(), password);
  };

  const handleForgotPassword = async () => {
    try {
      const resetUrl = (process.env as any)?.EXPO_PUBLIC_RESET_URL as string | undefined;
      const target = resetUrl && typeof resetUrl === 'string' && resetUrl.length > 0
        ? resetUrl
        : 'mailto:soporte@ewc.local?subject=Restablecer%20contrase%C3%B1a';
      const can = await Linking.canOpenURL(target);
      if (can) await Linking.openURL(target);
      else Alert.alert('No se pudo abrir el enlace', 'Por favor contacta al administrador.');
    } catch {
      Alert.alert('No se pudo abrir el enlace', 'Por favor contacta al administrador.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fondo y halos */}
      <LinearGradient
        colors={[colors.primary + '22', '#00000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroGradient}
      />
      <View pointerEvents="none" style={styles.halosContainer}>
        <View style={[styles.haloTop, { backgroundColor: colors.accent + '33' }]} />
        <View style={[styles.haloBottom, { backgroundColor: colors.secondary + '33' }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Barra superior con toggle de tema */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => { void toggleTheme(); }}
            style={[styles.themeToggle, { borderColor: colors.border, backgroundColor: colors.surface }]}
            accessibilityLabel={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun size={16} color={colors.text} /> : <Moon size={16} color={colors.text} />}
            <Text style={[styles.themeToggleText, { color: colors.text }]}>
              {isDarkMode ? 'Claro' : 'Oscuro'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero informativo */}
        <View style={styles.heroSection}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accent + '22' }]}>
            <ShieldCheck size={14} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Seguridad corporativa</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Plataforma Integral de Gestión Operacional</Text>
          <Text style={[styles.heroText, { color: colors.textSecondary }]}>Administra activos, rutas, incidentes y equipos en un dashboard centralizado. Mantén el control con acceso autorizado y supervisión en tiempo real.</Text>
        </View>

        {/* Card de acceso */}
        <View style={[styles.loginCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={24} color={colors.text} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Inicia sesión</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Utiliza tus credenciales corporativas</Text>
            </View>
          </View>

          <View style={styles.form}>
            {!!error && (
              <View style={[styles.errorBanner, { borderColor: colors.error + '55', backgroundColor: colors.error + '22' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Correo electrónico</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <Mail size={18} color="#64748B" />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="nombre@empresa.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(t) => {
                    if (error) {
                      clearError();
                    }
                    setEmail(t);
                  }}
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
                  onChangeText={(t) => {
                    if (error) {
                      clearError();
                    }
                    setPassword(t);
                  }}
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

            <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.9}>
              <LinearGradient
                colors={[ '#38BDF8', colors.primary, '#A78BFA' ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.loginButtonGradient, isLoading && styles.loginButtonDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Acceder</Text>
                )}
              </LinearGradient>
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