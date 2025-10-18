import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, User, Users, Mail, Shield, Edit, Trash2, CheckCircle, XCircle, Eye, Copy, Check, Info } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, getTempPassword } from '../../utils/userApi';
import { User as UserType, Role } from '../../types/User';
import UserForm from './UserForm';

// Helpers reutilizables a nivel de archivo
const getRoleColor = (role?: Role) => {
  if (!role) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  switch (role) {
    case 'Admin': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'Jefe': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
    case 'Supervisor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    case 'Especialista': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'Trabajador': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'Lector': return 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const getRoleLabel = (role?: Role) => role ?? 'Sin Rol';

const mapSingleArea = (a: string) => {
  switch (a) {
    case 'Admin': return 'Administración';
    case 'IT': return 'IT';
    case 'Transporte': return 'Transportes';
    case 'Taller': return 'Taller Mecánico';
    case 'Obras': return 'Obras civiles';
    case 'Aseo': return 'Aseo';
    case 'RRHH': return 'Recursos Humanos';
    case 'Finanza': return 'Finanzas';
    case 'P_Riesgo': return 'Prevención de Riesgos';
    default: return (a ?? '').toString().replace('_', ' ') || 'Sin Área';
  }
};

const ROLE_OPTIONS: Array<{ value: Role | 'all'; label: string }> = [
  { value: 'all', label: 'Todos los roles' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Jefe', label: 'Jefe' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Especialista', label: 'Especialista' },
  { value: 'Trabajador', label: 'Trabajador' },
  { value: 'Lector', label: 'Lector' },
];

const STATUS_OPTIONS: Array<{ value: 'all' | 'active' | 'inactive'; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

const USERS_PER_PAGE = 10;

// Modal para ver perfil
const ProfileModal: React.FC<{ user: UserType; onClose: () => void }> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <dialog open className="w-full max-w-2xl p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100">
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 id="profile-title" className="text-xl font-semibold">Perfil de Usuario</h3>
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">Cerrar</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40">
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">{user.username.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-medium">{user.username}</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                  {user.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400"><Mail className="w-4 h-4 mr-1" /> {user.email}</div>
            </div>
          </div>

          <div>
            <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Rol y Área</h5>
            {user.roleAssignments?.length ? (
              <div className="flex flex-wrap gap-2">
                {user.roleAssignments.filter(ra => ra.isActive).map((ra, i) => (
                  <span key={`${user.id}-${ra.area}-${ra.role}-${i}`} className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(ra.role)}`}>
                    {getRoleLabel(ra.role)}
                    <span className="ml-1 font-normal text-gray-600 dark:text-gray-300">@ {mapSingleArea(ra.area)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin asignaciones</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">Último acceso</p>
              <p className="text-sm">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}</p>
            </div>
            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">Creado</p>
              <p className="text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</p>
            </div>
            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">Actualizado</p>
              <p className="text-sm">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
};

const TempPasswordModal: React.FC<{ password: string; onClose: () => void }> = ({ password, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <dialog
        open
        className="w-full max-w-md p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-gray-900 dark:text-gray-100"
        aria-labelledby="temp-pass-title"
      >
        <h2 id="temp-pass-title" className="mb-4 text-xl font-bold">Contraseña temporal generada</h2>
        <div className="flex items-center p-3 mb-4 font-mono text-lg text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-md bg-blue-50 dark:bg-blue-900/30">
          <span className="flex-grow break-all">{password}</span>
          <button
            className={`p-2 ml-4 rounded-md transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'}`}
            onClick={handleCopy}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="mb-4 text-gray-600 dark:text-gray-400">Entrega esta contraseña al usuario para su primer acceso. Se le pedirá cambiarla al iniciar sesión.</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Cerrar</button>
        </div>
      </dialog>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const ce = event as CustomEvent<{ query: string }>;
      setSearchTerm(ce.detail?.query ?? '');
      setCurrentPage(1);
    };

    const maybeTarget = globalThis as unknown as {
      addEventListener?: EventTarget['addEventListener'];
      removeEventListener?: EventTarget['removeEventListener'];
    };

    if (typeof maybeTarget.addEventListener !== 'function' || typeof maybeTarget.removeEventListener !== 'function') {
      return undefined;
    }

    const listener = handler as EventListener;
    maybeTarget.addEventListener('global-search', listener);
    return () => {
      maybeTarget.removeEventListener?.('global-search', listener);
    };
  }, []);

  const handleCreate = async (data: Partial<UserType>) => {
    const response = await createUser(data);
    if (response.user) setUsers(prev => [...prev, response.user]);
    setShowForm(false);
    if (response.tempPassword) setTempPassword(response.tempPassword);
  };

  const handleEdit = async (data: Partial<UserType>) => {
    if (!editingUser) return;
    const updated = await updateUser(editingUser.id, data);
    setUsers(prev => prev.map(user => (user.id === updated.id ? updated : user)));
    setEditingUser(null);
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await deleteUser(id);
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter(user => {
      const matchesSearch = !query || user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      const matchesRole = filterRole === 'all' || user.roles.includes(filterRole);
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && user.active) ||
        (filterStatus === 'inactive' && !user.active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const totalPages = useMemo(() => {
    if (filteredUsers.length === 0) return 1;
    return Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  }, [filteredUsers.length]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const rangeStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(user => user.active).length;
    const inactive = total - active;
    const admins = users.filter(user => user.roles.includes('Admin')).length;
    const uniqueRoles = new Set(users.flatMap(user => user.roles)).size;
    const passwordResets = users.filter(user => user.mustChangePassword).length;
    const adoption = total > 0 ? Math.round((active / total) * 100) : 0;

    return [
      {
        id: 'users-total',
        label: 'Usuarios totales',
        value: String(total),
        helper: `${adoption}% activos`,
        accent: 'from-sky-500/25 via-indigo-500/20 to-sky-400/25',
        icon: <Users className="h-6 w-6" />,
      },
      {
        id: 'users-active',
        label: 'Activos',
        value: String(active),
        helper: `${inactive} inactivos`,
        accent: 'from-emerald-500/25 to-teal-500/25',
        icon: <CheckCircle className="h-6 w-6" />,
      },
      {
        id: 'users-roles',
        label: 'Administradores y jefaturas',
        value: String(admins),
        helper: `${uniqueRoles} roles disponibles`,
        accent: 'from-purple-500/25 to-fuchsia-500/25',
        icon: <Shield className="h-6 w-6" />,
      },
      {
        id: 'users-password',
        label: 'Cambios pendientes',
        value: String(passwordResets),
        helper: 'Solicita actualización en el primer ingreso',
        accent: 'from-amber-500/25 to-orange-500/25',
        icon: <Info className="h-6 w-6" />,
      },
    ];
  }, [users]);

  const roleDistribution = useMemo(() => {
    return ROLE_OPTIONS.filter(option => option.value !== 'all').map(option => ({
      value: option.value as Role,
      label: option.label,
      count: users.filter(user => user.roles.includes(option.value as Role)).length,
    }));
  }, [users]);

  const statusDistribution = useMemo(() => {
    const active = users.filter(user => user.active).length;
    const inactive = users.filter(user => !user.active).length;
    return [
      { value: 'active' as const, label: 'Activos', count: active },
      { value: 'inactive' as const, label: 'Inactivos', count: inactive },
    ];
  }, [users]);

  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' || filterRole !== 'all' || filterStatus !== 'all';
  }, [searchTerm, filterRole, filterStatus]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value: Role | 'all') => {
    setFilterRole(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: 'all' | 'active' | 'inactive') => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const paginate = (page: number) => {
    setCurrentPage(prev => {
      const next = Math.min(Math.max(page, 1), totalPages);
      return next === prev ? prev : next;
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getTimeSince = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return 'Ahora mismo';
  };

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Users className="h-4 w-4" /> Gestión de usuarios
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Controla accesos y roles con precisión</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Administra altas, permisos y contraseñas temporales dentro del nuevo panel traslúcido. Visualiza la adopción del sistema y detecta cuentas inactivas en segundos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Agregar usuario
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(stat => (
          <article
            key={stat.id}
            className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
                  {stat.icon}
                </span>
              </div>
              <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0.45))]" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <Shield className="h-4 w-4" /> Panel de filtros
              </span>
              <p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">
                Filtra por rol o estado para agilizar aprobaciones. El resumen lateral muestra la distribución actual de perfiles activos.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
                <label htmlFor="user-search" className="sr-only">Buscar usuarios</label>
                <input
                  id="user-search"
                  value={searchTerm}
                  onChange={event => handleSearchChange(event.target.value)}
                  placeholder="Busca por nombre o correo"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={filterRole}
                  onChange={event => handleRoleChange(event.target.value as Role | 'all')}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={event => handleStatusChange(event.target.value as 'all' | 'active' | 'inactive')}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80">
                {filteredUsers.length} usuarios visibles
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                  >
                    Restablecer filtros
                  </button>
                )}
                <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80">
                  Vista refinada
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/60 bg-white/75 px-5 py-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Distribución</p>
            <div className="space-y-3 text-sm text-slate-600 dark:text-blue-200/80">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {roleDistribution.map(({ value, label, count }) => (
                    <button
                      type="button"
                      key={`role-${value}`}
                      onClick={() => handleRoleChange(filterRole === value ? 'all' : value)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition hover:-translate-y-0.5 ${
                        filterRole === value
                          ? 'border-sky-300 bg-sky-100/80 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-100'
                          : 'border-slate-200 bg-white/70 text-slate-600 shadow-sm hover:border-sky-300 dark:border-white/10 dark:bg-white/10 dark:text-blue-100'
                      }`}
                    >
                      {label}
                      <span className="rounded-full bg-white/60 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600 dark:bg-white/10 dark:text-blue-100">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">Estado</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {statusDistribution.map(({ value, label, count }) => (
                    <button
                      type="button"
                      key={`status-${value}`}
                      onClick={() => handleStatusChange(filterStatus === value ? 'all' : value)}
                      className={`inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-blue-100 ${
                        filterStatus === value ? 'border-sky-300 text-sky-600 dark:border-sky-500/40 dark:text-sky-100' : ''
                      }`}
                    >
                      {label}
                      <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[0.65rem] font-bold dark:bg-white/10">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_rgba(15,23,42,0)_70%)]" />
          <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/60 text-sm dark:divide-white/10">
                <thead className="bg-white/70 text-[0.65rem] uppercase tracking-[0.28em] text-slate-500 dark:bg-white/10 dark:text-blue-200/70">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left">Usuario</th>
                    <th scope="col" className="px-6 py-4 text-left">Rol y área</th>
                    <th scope="col" className="px-6 py-4 text-left">Estado</th>
                    <th scope="col" className="px-6 py-4 text-left">Último acceso</th>
                    <th scope="col" className="px-6 py-4 text-left">Creado</th>
                    <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 bg-transparent dark:divide-white/10">
                  {currentUsers.map(user => (
                    <tr key={user.id} className="transition hover:bg-white/70 dark:hover:bg-white/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100">
                            <span className="text-sm font-semibold">{user.username.charAt(0)}</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.username}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-blue-200/80">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="break-all">{user.email}</span>
                              {user.mustChangePassword && (
                                <button
                                  type="button"
                                  title="Ver contraseña temporal"
                                  className="inline-flex items-center justify-center rounded-full border border-sky-300/60 bg-sky-500/10 p-1 text-sky-600 transition hover:bg-sky-500/20 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100"
                                  onClick={async () => {
                                    const temp = await getTempPassword(user.id);
                                    setTempPassword(temp);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.roleAssignments?.filter(assignment => assignment.isActive).map(assignment => (
                            <span
                              key={`${user.id}-${assignment.area}-${assignment.role}`}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getRoleColor(assignment.role)}`}
                            >
                              {getRoleLabel(assignment.role)}
                              <span className="ml-1 font-normal text-slate-600 dark:text-slate-300">@ {mapSingleArea(assignment.area)}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            user.active
                              ? 'border border-emerald-400/60 bg-emerald-500/15 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100'
                              : 'border border-rose-400/60 bg-rose-500/15 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100'
                          }`}
                        >
                          {user.active ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-blue-200/80">
                        <div>{getTimeSince(user.lastLogin)}</div>
                        <div className="text-xs text-slate-400 dark:text-blue-200/60">{formatDate(user.lastLogin)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-blue-200/70">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setProfileUser(user)}
                            title="Ver perfil"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white/80 p-2 text-slate-500 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setShowForm(true);
                            }}
                            className="inline-flex items-center justify-center rounded-full border border-sky-300/60 bg-sky-500/10 p-2 text-sky-600 transition hover:-translate-y-0.5 hover:bg-sky-500/20 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user.id)}
                            className="inline-flex items-center justify-center rounded-full border border-rose-400/60 bg-rose-500/10 p-2 text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-500/20 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-3xl border border-white/60 bg-white/70 px-6 py-4 text-sm shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando <span className="font-semibold text-slate-700 dark:text-slate-100">{rangeStart}</span> a{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-100">{rangeEnd}</span> de{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-100">{filteredUsers.length}</span> resultados
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 px-6 py-10 text-center shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(15,23,42,0)_70%)]" />
            <div className="relative space-y-3">
              <User className="mx-auto h-12 w-12 text-slate-400 dark:text-blue-200/70" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No se encontraron usuarios</h3>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">Ajusta los filtros o crea un nuevo perfil para comenzar.</p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" /> Registrar usuario
              </button>
            </div>
          </div>
        )}
      </section>

      {showForm && (
        <UserForm
          initialData={editingUser ?? {}}
          onSubmit={editingUser ? handleEdit : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
      {tempPassword && <TempPasswordModal password={tempPassword} onClose={() => setTempPassword(null)} />}
      {profileUser && <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} />}
    </div>
  );
};

export default UserManagement;