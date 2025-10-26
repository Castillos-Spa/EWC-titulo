import React, { useMemo, useState } from 'react';
import {
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Globe,
  Sparkles,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { changePassword as apiChangePassword } from '../../../utils/userApi';
import { useIntlFormat } from '../../../app/intl/format';

const UserProfile: React.FC = () => {
  const { formatDateTime } = useIntlFormat();
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
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    maintenanceAlerts: true,
    tripUpdates: false,
  });

  const initials = useMemo(() => {
    const base = user?.username?.trim();
    if (!base) return '?';
    const segments = base.split(' ').filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[0].charAt(0)}${segments[1].charAt(0)}`.toUpperCase();
    }
    return base.slice(0, 2).toUpperCase();
  }, [user?.username]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(previous => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleNotificationChange = (key: string) => {
    setNotifications(previous => ({
      ...previous,
      [key]: !previous[key as keyof typeof previous],
    }));
  };

  const handleSavePersonal = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Guardando datos personales:', formData);
    setIsEditing(false);
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setFormData(previous => ({
        ...previous,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
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
      case 'water_transport': return 'Transporte Acuático';
      case 'general_services': return 'Servicios Generales';
      default: return area?.replace('_', ' ') || 'Área';
    }
  };

  const primaryRole = useMemo(() => getRoleLabel(user?.roles?.[0] ?? ''), [user?.roles]);
  const areaBadges = useMemo(() => (Array.isArray(user?.areas) ? user?.areas : []), [user?.areas]);

  const profileStats = useMemo(() => {
    const rolesCount = user?.roles?.length ?? 0;
    const areaCount = user?.areas?.length ?? 0;
    const assignments = user?.roleAssignments?.length ?? 0;
    const activeAssignments = user?.roleAssignments?.filter(assignment => assignment.isActive !== false).length ?? 0;
    const lastLogin = formatDateTime(user?.lastLogin);
    const statusLabel = user?.active ? 'Activo' : 'Inactivo';
    return [
      {
        id: 'profile-roles',
        label: 'Roles activos',
        value: String(rolesCount),
        helper: rolesCount > 1 ? 'Multiples responsabilidades' : 'Rol principal asignado',
        accent: 'from-sky-500/25 via-blue-500/20 to-sky-400/25',
        icon: <Shield className="h-5 w-5" />,
      },
      {
        id: 'profile-areas',
        label: 'Áreas asignadas',
        value: String(areaCount),
        helper: areaCount > 0 ? 'Cobertura multidisciplinaria' : 'Área por definir',
        accent: 'from-violet-500/25 via-purple-500/20 to-violet-400/25',
        icon: <Globe className="h-5 w-5" />,
      },
      {
        id: 'profile-assignments',
        label: 'Asignaciones activas',
        value: `${activeAssignments}/${assignments}`,
        helper: assignments > 0 ? 'Asignaciones vigentes' : 'Sin coordinaciones activas',
        accent: 'from-amber-500/25 via-orange-500/20 to-amber-400/25',
        icon: <Activity className="h-5 w-5" />,
      },
      {
        id: 'profile-status',
        label: 'Estado de cuenta',
        value: statusLabel,
        helper: lastLogin === 'Sin registro' ? 'Aún sin actividad registrada' : `Último acceso ${lastLogin}`,
        accent: 'from-emerald-500/25 via-teal-500/20 to-emerald-400/25',
        icon: <CheckCircle2 className="h-5 w-5" />,
      },
    ];
  }, [user, formatDateTime]);

  const tabs = [
    { id: 'personal', label: 'Información Personal', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-emerald-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-900/10">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/25" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-emerald-500 text-2xl font-semibold text-white shadow-lg shadow-sky-400/40">
              {initials}
            </div>
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <Sparkles className="h-4 w-4" /> Perfil corporativo
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{user?.username ?? 'Usuario sin nombre'}</h1>
              <p className="text-sm text-slate-600 dark:text-blue-100/80">{user?.email ?? 'Sin correo registrado'}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                  <Shield className="h-3.5 w-3.5" /> {primaryRole}
                </span>
                {areaBadges.map(area => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                  >
                    <Globe className="h-3.5 w-3.5" /> {getAreaLabel(area)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {profileStats.map(stat => (
          <article
            key={stat.id}
            className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
            <div className="relative flex flex-col gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-slate-100">
                {stat.icon}
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</p>
              <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_70%)]" />
        <div className="relative">
          <nav className="flex flex-wrap gap-2 border-b border-slate-200/60 px-6 py-4 dark:border-white/10">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'personal') {
                      setIsEditing(false);
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-900'
                      : 'border border-slate-200/70 bg-white/70 text-slate-500 hover:border-sky-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-200/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="space-y-6 px-6 py-8">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Información personal</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(current => !current)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      isEditing
                        ? 'border border-rose-200/70 bg-rose-50/80 text-rose-600 shadow-sm hover:border-rose-300 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100'
                        : 'bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-lg shadow-sky-400/40 hover:-translate-y-0.5'
                    }`}
                  >
                    {isEditing ? 'Cancelar' : 'Editar perfil'}
                  </button>
                </header>

                <form onSubmit={handleSavePersonal} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">
                      <span>Nombre completo</span>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                          id="profile-name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                          type="text"
                        />
                      </div>
                    </label>
                    <label className="space-y-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">
                      <span>Correo electrónico</span>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                          id="profile-email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                          type="email"
                        />
                      </div>
                    </label>
                    <label className="space-y-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">
                      <span>Teléfono</span>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                          id="profile-phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Número de contacto"
                          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                          type="tel"
                        />
                      </div>
                    </label>
                    <label className="space-y-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">
                      <span>Dirección</span>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                          id="profile-address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Dirección completa"
                          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                          type="text"
                        />
                      </div>
                    </label>
                  </div>

                  <section className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/70 px-5 py-5 shadow-inner shadow-slate-200/30 dark:border-white/10 dark:bg-white/5">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">Información del sistema</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Rol principal</span>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <Shield className="h-4 w-4" />
                          {primaryRole}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Áreas</span>
                        <div className="flex flex-wrap gap-2">
                          {areaBadges.length > 0 ? (
                            areaBadges.map(area => (
                              <span
                                key={area}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                              >
                                {getAreaLabel(area)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500 dark:text-slate-400">Sin áreas asignadas</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {isEditing && (
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
                      >
                        <Save className="h-4 w-4" /> Guardar cambios
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <header className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Cambiar contraseña</h3>
                  <p className="text-sm text-slate-500 dark:text-blue-200/80">Refuerza la seguridad personalizando tus credenciales.</p>
                </header>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
                    <span>Contraseña actual</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(value => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
                    <span>Nueva contraseña</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(value => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
                    <span>Confirmar contraseña</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white/80 px-11 py-3 text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
                        placeholder="Confirma tu contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(value => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  <div className="rounded-3xl border border-sky-200/70 bg-sky-50/80 px-5 py-4 text-sky-700 shadow-inner shadow-sky-200/40 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]">Requisitos sugeridos</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Mínimo 8 caracteres</li>
                      <li>• Incluye mayúsculas y minúsculas</li>
                      <li>• Añade números y caracteres especiales</li>
                      <li>• Evita credenciales usadas recientemente</li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
                    >
                      <Lock className="h-4 w-4" /> Cambiar contraseña
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <header className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Preferencias de notificación</h3>
                  <p className="text-sm text-slate-500 dark:text-blue-200/80">Configura cómo deseas recibir alertas operacionales en el día a día.</p>
                </header>

                <div className="space-y-4">
                  {[
                    {
                      id: 'emailNotifLabel',
                      label: 'Notificaciones por email',
                      description: 'Recibe comunicados críticos y resúmenes diarios en tu bandeja.',
                      key: 'emailNotifications' as const,
                    },
                    {
                      id: 'pushNotifLabel',
                      label: 'Notificaciones push',
                      description: 'Mantente al día con alertas en el navegador en tiempo real.',
                      key: 'pushNotifications' as const,
                    },
                    {
                      id: 'maintNotifLabel',
                      label: 'Alertas de mantenimiento',
                      description: 'Recibe recordatorios sobre mantenimientos programados o vencidos.',
                      key: 'maintenanceAlerts' as const,
                    },
                    {
                      id: 'tripNotifLabel',
                      label: 'Actualizaciones de viajes',
                      description: 'Sigue el estado de los viajes y asignaciones de transporte.',
                      key: 'tripUpdates' as const,
                    },
                  ].map(option => (
                    <div
                      key={option.id}
                      className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 px-5 py-4 shadow-inner shadow-slate-200/30 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 id={option.id} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {option.label}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-blue-200/80">{option.description}</p>
                        </div>
                        <label className="relative inline-flex h-7 w-14 cursor-pointer items-center rounded-full bg-slate-200 transition peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:bg-slate-700">
                          <input
                            type="checkbox"
                            aria-labelledby={option.id}
                            className="sr-only"
                            checked={notifications[option.key]}
                            onChange={() => handleNotificationChange(option.key)}
                          />
                          <span
                            className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                              notifications[option.key] ? 'translate-x-7 bg-gradient-to-br from-sky-500 to-indigo-500 shadow-sky-400/40' : ''
                            }`}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => console.log('Guardando preferencias:', notifications)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
                  >
                    <Save className="h-4 w-4" /> Guardar preferencias
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
