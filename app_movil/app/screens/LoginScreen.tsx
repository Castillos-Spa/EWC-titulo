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
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { Building2, Lock, Mail, Eye, EyeOff, Users, Info } from 'lucide-react-native';
import { AuthService } from '../services/AuthService';
import { useThemeStore } from '../stores/themeStore';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTestUsers, setShowTestUsers] = useState(false);
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

  const handleTestUserSelect = (testUser: any) => {
    setEmail(testUser.email);
    setPassword(testUser.password);
    setShowTestUsers(false);
  };

  const testUsers = AuthService.getTestUsers();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'driver': return '#2563EB';
      case 'supervisor': return '#7C3AED';
      case 'technician': return '#16A34A';
      case 'admin': return '#DC2626';
      case 'cleaning_crew': return '#06B6D4';
      case 'civil_works': return '#F59E0B';
      case 'it_support': return '#8B5CF6';
      case 'manager': return '#1F2937';
      case 'finance': return '#059669';
      default: return '#6B7280';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'driver': return 'Conductor';
      case 'supervisor': return 'Supervisor';
      case 'technician': return 'Técnico';
      case 'admin': return 'Administrador';
      case 'cleaning_crew': return 'Personal de Aseo';
      case 'civil_works': return 'Obras Civiles';
      case 'it_support': return 'Soporte TIC';
      case 'manager': return 'Gerente';
      case 'finance': return 'Finanzas';
      default: return role;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Building2 size={64} color="#2563EB" strokeWidth={2} />
          </View>
          <Text style={[styles.companyName, { color: colors.text }]}>Wilson Castillo</Text>
          <Text style={[styles.companySubtitle, { color: colors.textSecondary }]}>Hub Corporativo Móvil</Text>
        </View>

        {/* Login Form */}
        <View style={[styles.loginCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Iniciar Sesión</Text>

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Mail size={20} color="#64748B" />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={20} color="#64748B" />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Contraseña"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748B" />
                ) : (
                  <Eye size={20} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            {/* Test Users */}
            <TouchableOpacity 
              style={[styles.testUsersToggle, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowTestUsers(!showTestUsers)}
            >
              <Users size={18} color="#2563EB" />
              <Text style={[styles.testUsersToggleText, { color: colors.primary }]}>
                {showTestUsers ? 'Ocultar' : 'Ver'} Usuarios de Prueba
              </Text>
            </TouchableOpacity>

            {showTestUsers && (
              <View style={[styles.testUsersContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.testUsersHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                  <Info size={16} color="#2563EB" />
                  <Text style={[styles.testUsersTitle, { color: colors.primary }]}>Usuarios de Prueba</Text>
                </View>
                
                <ScrollView style={styles.testUsersList} nestedScrollEnabled>
                  {testUsers.map((testUser, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.testUserCard, { borderBottomColor: colors.border }]}
                      onPress={() => handleTestUserSelect(testUser)}
                    >
                      <View style={styles.testUserInfo}>
                        <Text style={[styles.testUserName, { color: colors.text }]}>{testUser.name}</Text>
                        <Text style={[styles.testUserEmail, { color: colors.textSecondary }]}>{testUser.email}</Text>
                        <View style={[
                          styles.testUserRole,
                          { backgroundColor: `${getRoleColor(testUser.role)}15` }
                        ]}>
                          <Text style={[
                            styles.testUserRoleText,
                            { color: getRoleColor(testUser.role) }
                          ]}>
                            {getRoleLabel(testUser.role)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            © 2025 Empresas Wilson Castillo
          </Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  companySubtitle: {
    fontSize: 16,
  },
  loginCard: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    minHeight: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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