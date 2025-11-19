import React, { useState, useEffect, useMemo } from 'react';
import { Plus, User, Users, Mail, Shield, Edit, Trash2, CheckCircle, XCircle, Eye, Copy, Check, Info } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, getTempPassword } from '../../../utils/userApi';
import { User as UserType, Role } from '../../../types/User';
import UserForm from '../components/UserForm';
import { useIntlFormat } from '../../../app/intl/format';
import { useAuth } from '../../../contexts/AuthContext';

// Tipos y helpers reutilizables a nivel de archivo
// Tipos para filtros (si se reactivan)

const USERS_PER_PAGE = 10;

// Opciones de rol (si se reactivan filtros, mover a un selector)

// Nota: si se desean filtros por estado, reintroducir STATUS_OPTIONS y el estado asociado

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

// Modal para ver perfil (patrón unificado)
const ProfileModal: React.FC<{ user: UserType; onClose: () => void }> = ({ user, onClose }) => {
  const { formatDateTime, formatDate } = useIntlFormat();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 text-slate-800 shadow-2xl shadow-slate-300/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-blue-200/60">Detalle</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Perfil de Usuario</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/70">Visualiza información del perfil, roles y actividad reciente.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-blue-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-full w-14 h-14 bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100">
              <span className="text-lg font-semibold">{user.username.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-medium">{user.username}</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.active ? 'border border-emerald-400/60 bg-emerald-500/15 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100' : 'border border-rose-400/60 bg-rose-500/15 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100'}`}>
                  {user.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex items-center text-sm text-slate-600 dark:text-blue-200/80"><Mail className="w-4 h-4 mr-1" /> {user.email}</div>
            </div>
          </div>

          <div>
            <h5 className="mb-2 text-sm font-semibold text-slate-700 dark:text-blue-100">Rol y Área</h5>
            {user.roleAssignments?.length ? (
              <div className="flex flex-wrap gap-2">
                {user.roleAssignments.filter(ra => ra.isActive).map((ra, i) => (
                  <span key={`${user.id}-${ra.area}-${ra.role}-${i}`} className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${getRoleColor(ra.role)}`}>
                    {getRoleLabel(ra.role)}
                    <span className="ml-1 font-normal text-slate-600 dark:text-slate-300">@ {mapSingleArea(ra.area)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-blue-200/80">Sin asignaciones</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="p-3 rounded-lg border border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs text-slate-500 dark:text-blue-200/70">Último acceso</p>
              <p className="text-sm">{formatDateTime(user.lastLogin) || 'Nunca'}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs text-slate-500 dark:text-blue-200/70">Creado</p>
              <p className="text-sm">{formatDate(user.createdAt) || '-'}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs text-slate-500 dark:text-blue-200/70">Actualizado</p>
              <p className="text-sm">{formatDate(user.updatedAt) || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

const TempPasswordModal: React.FC<{ password: string; onClose: () => void }> = ({ password, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 text-slate-800 shadow-2xl shadow-slate-300/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-blue-200/60">Credenciales</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Contraseña temporal generada</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/70">Entrega esta contraseña al usuario para su primer acceso.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-blue-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center p-3 font-mono text-lg text-sky-700 rounded-2xl border border-sky-200/60 bg-sky-50/70 dark:text-sky-300 dark:border-sky-500/30 dark:bg-sky-500/10">
            <span className="flex-grow break-all">{password}</span>
            <button
              className={`ml-4 inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-semibold transition ${copied ? 'bg-emerald-500 text-white' : 'border border-slate-200 bg-white/80 text-slate-700 hover:border-sky-300 dark:border-white/10 dark:bg-white/10 dark:text-blue-100'}`}
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <footer className="mt-6 flex items-center justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
          >
            Cerrar
          </button>
        </footer>
      </div>
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
  // Filtros avanzados deshabilitados por ahora
  const [currentPage, setCurrentPage] = useState(1);
  const { formatDateTime, formatDate } = useIntlFormat();
  const { user: currentUser } = useAuth();

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
    try {
      const updated = await updateUser(editingUser.id, data);
      const ra = (updated as any).roleAssignments ?? [];
      const rolesArr: string[] = Array.from(new Set(ra.map((r: any) => r?.role).filter(Boolean)));
      const areasArr: string[] = Array.from(new Set(ra.map((r: any) => r?.area).filter(Boolean)));
      const rolesByArea = ra.reduce((acc: Record<string, { role: string; specialty?: string | null; permissions: string[] }>, r: any) => {
        if (!r?.area) return acc;
        let permissions: string[] = [];
        if (Array.isArray(r?.additionalPermissions)) {
          permissions = r.additionalPermissions as string[];
        } else if (Array.isArray(r?.permissions)) {
          permissions = r.permissions as string[];
        }
        acc[r.area] = { role: r.role, specialty: r.specialty ?? null, permissions };
        return acc;
      }, {} as Record<string, { role: string; specialty?: string | null; permissions: string[] }>);
      const updatedWithDerived = { ...updated, roles: rolesArr, areas: areasArr, rolesByArea } as UserType;
      setUsers(prev => prev.map(user => (user.id === updatedWithDerived.id ? updatedWithDerived : user)));
      if (currentUser?.id === updatedWithDerived.id) {
        try { localStorage.setItem('userData', JSON.stringify(updatedWithDerived)); } catch {}
        globalThis.dispatchEvent?.(new CustomEvent('session-refreshed', { detail: updatedWithDerived }));
      }
      setEditingUser(null);
      setShowForm(false);
    } catch (error) {
      console.error('No se pudo actualizar el usuario', error);
      alert(`No se pudieron guardar los cambios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteUser(id);
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter(user => {
      const matchesSearch = !query || user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [users, searchTerm]);

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
    const admins = users.filter(user => user.roles?.includes('Admin')).length;
    const uniqueRoles = new Set(users.flatMap(user => user.roles || [])).size;
    const passwordResets = users.filter(user => user.mustChangePassword).length;
    const adoption = total > 0 ? Math.round((active / total) * 100) : 0;

    return [
      {
        id: 'users-total',
        label: 'Usuarios totales',
        value: String(total),
        helper: `${adoption}% activos`,
        accent: 'from-sky-500/25 via-indigo-500/20 to-sky-400/25',
        icon: <Users className="w-6 h-6" />,
      },
      {
        id: 'users-active',
        label: 'Activos',
        value: String(active),
        helper: `${inactive} inactivos`,
        accent: 'from-emerald-500/25 to-teal-500/25',
        icon: <CheckCircle className="w-6 h-6" />,
      },
      {
        id: 'users-roles',
        label: 'Administradores y jefaturas',
        value: String(admins),
        helper: `${uniqueRoles} roles disponibles`,
        accent: 'from-purple-500/25 to-fuchsia-500/25',
        icon: <Shield className="w-6 h-6" />,
      },
      {
        id: 'users-password',
        label: 'Cambios pendientes',
        value: String(passwordResets),
        helper: 'Solicita actualización en el primer ingreso',
        accent: 'from-amber-500/25 to-orange-500/25',
        icon: <Info className="w-6 h-6" />,
      },
    ];
  }, [users]);

  const paginate = (page: number) => {
    setCurrentPage(prev => {
      const next = Math.min(Math.max(page, 1), totalPages);
      return next === prev ? prev : next;
    });
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
      <section className="relative px-8 py-6 overflow-hidden border shadow-xl rounded-3xl border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="absolute -translate-y-1/2 rounded-full pointer-events-none -left-24 top-1/2 h-96 w-96 bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="absolute rounded-full pointer-events-none -right-20 -top-24 h-80 w-80 bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Users className="w-4 h-4" /> Gestión de usuarios
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
            <Plus className="w-4 h-4" /> Agregar usuario
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
                <span className="flex items-center justify-center w-10 h-10 shadow-sm rounded-2xl bg-white/70 text-slate-700 backdrop-blur dark:bg-white/10 dark:text-blue-100">
                  {stat.icon}
                </span>
              </div>
              <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="relative overflow-hidden border shadow-xl rounded-3xl border-slate-200/60 bg-white/70 shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_rgba(15,23,42,0)_70%)]" />
          <div className="relative overflow-hidden border shadow-sm rounded-3xl border-white/60 bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-slate-200/60 dark:divide-white/10">
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
                <tbody className="bg-transparent divide-y divide-slate-200/60 dark:divide-white/10">
                  {currentUsers.map(user => (
                    <tr key={user.id} className="transition hover:bg-white/70 dark:hover:bg-white/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center rounded-full h-11 w-11 bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100">
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
                                  className="inline-flex items-center justify-center p-1 transition border rounded-full border-sky-300/60 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100"
                                  onClick={async () => {
                                    const temp = await getTempPassword(user.id);
                                    setTempPassword(temp);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
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
                        <div className="text-xs text-slate-400 dark:text-blue-200/60">{formatDateTime(user.lastLogin)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-blue-200/70">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setProfileUser(user)}
                            title="Ver perfil"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white/80 p-2 text-slate-500 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setShowForm(true);
                            }}
                            className="inline-flex items-center justify-center rounded-full border border-sky-300/60 bg-sky-500/10 p-2 text-sky-600 transition hover:-translate-y-0.5 hover:bg-sky-500/20 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user.id)}
                            className="inline-flex items-center justify-center rounded-full border border-rose-400/60 bg-rose-500/10 p-2 text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-500/20 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="flex flex-col gap-3 px-6 py-4 text-sm border shadow-sm rounded-3xl border-white/60 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="relative px-6 py-10 overflow-hidden text-center border shadow-lg rounded-3xl border-slate-200/70 bg-white/80 shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(15,23,42,0)_70%)]" />
            <div className="relative space-y-3">
              <User className="w-12 h-12 mx-auto text-slate-400 dark:text-blue-200/70" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No se encontraron usuarios</h3>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">Ajusta los filtros o crea un nuevo perfil para comenzar.</p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" /> Registrar usuario
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
