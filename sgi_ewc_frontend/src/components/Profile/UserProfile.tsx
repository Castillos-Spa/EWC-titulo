import React, { useState } from 'react';
import { User, Lock, Mail, Phone, MapPin, Save, Eye, EyeOff, Shield, Bell, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { changePassword as apiChangePassword } from '../../utils/userApi';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    maintenanceAlerts: true,
    tripUpdates: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar los datos personales
    console.log('Guardando datos personales:', formData);
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    if (!user) {
      alert('Error: No se pudo identificar al usuario.');
      return;
    }

    try {
      await apiChangePassword(user.id, formData.currentPassword, formData.newPassword);
      alert('Contraseña cambiada con éxito.');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      alert(`Error al cambiar la contraseña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return 'Administrador';
      case 'Jefe': return 'Jefe';
      case 'Supervisor': return 'Supervisor';
      case 'Especialista': return 'Especialista';
      case 'Trabajador': return 'Trabajador';
      case 'Lector': return 'Lector';
      // Fallbacks antiguos
      case 'transport_supervisor': return 'Supervisor de Transporte';
      case 'driver': return 'Conductor';
      case 'general_services': return 'Servicios Generales';
      case 'cleaning': return 'Personal de Limpieza';
      case 'civil_works': return 'Obras Civiles';
      default: return role || 'Usuario';
    }
  };

  const getAreaLabel = (area: string) => {
    switch (area) {
      case 'Admin': return 'Administración';
      case 'IT': return 'Tecnología';
      case 'Transporte': return 'Transportes';
      case 'Taller': return 'Taller Mecánico';
      case 'Obras': return 'Obras Civiles';
      case 'Aseo': return 'Aseo';
      case 'RRHH': return 'Recursos Humanos';
      case 'Finanza': return 'Finanzas';
      case 'P_Riesgo': return 'Prevención de Riesgos';
      // Fallbacks antiguos
      case 'water_transport': return 'Transporte Acuático';
      case 'general_services': return 'Servicios Generales';
      default: return area?.replace('_', ' ') || 'Área';
    }
  };

  const tabs = [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-600">
            <span className="text-2xl font-bold text-white">{user?.username?.charAt(0) ?? '?'}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.username}</h1>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            <div className="flex items-center mt-2 flex-wrap gap-2">
              <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {getRoleLabel(Array.isArray(user?.roles) ? (user?.roles?.[0] ?? '') : (user?.roles as unknown as string) || '')}
              </span>
              {Array.isArray(user?.areas) && user?.areas?.length > 0 && user.areas.map((a) => (
                <span key={a} className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {getAreaLabel(a)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex px-6 space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Información Personal */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Información Personal</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="profile-name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="absolute w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="profile-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="profile-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-phone" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="profile-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Número de teléfono"
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-address" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dirección
                    </label>
                    <div className="relative">
                      <MapPin className="absolute w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                      <input
                        id="profile-address"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Dirección completa"
                        className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Información del Sistema */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100 text-md">Información del Sistema</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Rol</p>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-900 dark:text-gray-100">{getRoleLabel(Array.isArray(user?.roles) ? (user?.roles?.[0] ?? '') : (user?.roles as unknown as string) || '')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Áreas</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        {Array.isArray(user?.areas) && user.areas.length > 0 ? (
                          user.areas.map((a) => (
                            <span key={a} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{getAreaLabel(a)}</span>
                          ))
                        ) : (
                          <span className="text-gray-900 dark:text-gray-100">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-4 space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 transition-colors border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Seguridad */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Cambiar Contraseña</h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <Lock className="absolute w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="Ingresa tu contraseña actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute text-gray-400 dark:text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="Ingresa tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute text-gray-400 dark:text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute text-gray-400 dark:text-gray-500 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
                  <h4 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-200">Requisitos de Contraseña:</h4>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                    <li>• Mínimo 8 caracteres</li>
                    <li>• Al menos una letra mayúscula</li>
                    <li>• Al menos una letra minúscula</li>
                    <li>• Al menos un número</li>
                    <li>• Al menos un carácter especial</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Cambiar Contraseña</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notificaciones */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Preferencias de Notificaciones</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 id="emailNotifLabel" className="text-sm font-medium text-gray-900 dark:text-gray-100">Notificaciones por Email</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Recibir notificaciones importantes por correo electrónico</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={() => handleNotificationChange('emailNotifications')}
                      className="sr-only peer"
                      aria-labelledby="emailNotifLabel"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 id="pushNotifLabel" className="text-sm font-medium text-gray-900 dark:text-gray-100">Notificaciones Push</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Recibir notificaciones en tiempo real en el navegador</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={() => handleNotificationChange('pushNotifications')}
                      className="sr-only peer"
                      aria-labelledby="pushNotifLabel"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 id="maintNotifLabel" className="text-sm font-medium text-gray-900 dark:text-gray-100">Alertas de Mantenimiento</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notificaciones sobre mantenimientos programados y vencidos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.maintenanceAlerts}
                      onChange={() => handleNotificationChange('maintenanceAlerts')}
                      className="sr-only peer"
                      aria-labelledby="maintNotifLabel"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 id="tripNotifLabel" className="text-sm font-medium text-gray-900 dark:text-gray-100">Actualizaciones de Viajes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notificaciones sobre el estado de los viajes asignados</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.tripUpdates}
                      onChange={() => handleNotificationChange('tripUpdates')}
                      className="sr-only peer"
                      aria-labelledby="tripNotifLabel"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => console.log('Guardando preferencias:', notifications)}
                  className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Preferencias</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;