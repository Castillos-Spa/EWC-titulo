import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Mail, Shield, Edit, Trash2, CheckCircle, XCircle, Eye, Copy, Check, Info } from 'lucide-react';
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
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  // Sincroniza con la búsqueda global del Header
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ query: string }>;
      setSearchTerm(ce.detail?.query ?? '');
      setCurrentPage(1);
    };
    window.addEventListener('global-search', handler as EventListener);
    return () => window.removeEventListener('global-search', handler as EventListener);
  }, []);

  const handleCreate = async (data: Partial<UserType>) => {
    const response = await createUser(data);
    if (response.user) setUsers([...users, response.user]);
    setShowForm(false);
    if (response.tempPassword) {
      setTempPassword(response.tempPassword);
    }
  };

  const handleEdit = async (data: Partial<UserType>) => {
    if (!editingUser) return;
    const updated = await updateUser(editingUser.id, data);
    setUsers(users.map(u => u.id === updated.id ? updated : u));
    setEditingUser(null);
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    await deleteUser(id);
    setUsers(users.filter(u => u.id !== id));
  };

  // helpers ahora están a nivel de archivo

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.roles.includes(filterRole as Role);
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.active) ||
      (filterStatus === 'inactive' && !user.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSince = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Ahora mismo';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestión de Usuarios</h2>
          <p className="text-gray-600 dark:text-gray-400">Gestiona cuentas de usuario, roles y permisos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios Activos</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.active).length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios Inactivos</p>
              <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.active).length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Roles</p>
              <p className="text-2xl font-bold text-purple-600">{new Set(users.flatMap(u => u.roles)).size}</p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <label htmlFor="user-search" className="sr-only">Buscar usuarios</label>
            <input
              id="user-search"
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar usuarios por nombre o correo"
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-role" className="sr-only">Filtrar por rol</label>
            <select
              id="filter-role"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            > 
              <option value="all">Todos los Roles</option>
              <option value="Admin">Admin</option>
              <option value="Jefe">Jefe</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Especialista">Especialista</option>
              <option value="Trabajador">Trabajador</option>
              <option value="Lector">Lector</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-status" className="sr-only">Filtrar por estado</label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                  Rol y Área
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                  Creado
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                          {user.username.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                          {user.mustChangePassword && (
                            <button
                              title="Ver contraseña temporal"
                              className="p-1 ml-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.roleAssignments?.filter(ra => ra.isActive).map((assignment) => (
                        <span key={`${user.id}-${assignment.area}-${assignment.role}`} className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(assignment.role)}`}>
                          {getRoleLabel(assignment.role)}
                          <span className="ml-1 font-normal text-gray-600 dark:text-gray-300">@ {mapSingleArea(assignment.area)}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {user.active ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    <div>{getTimeSince(user.lastLogin)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(user.lastLogin)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setProfileUser(user)}
                        title="Ver perfil"
                        className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setEditingUser(user); setShowForm(true); }}
                        className="p-1 text-blue-600 rounded hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-red-600 rounded hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg sm:px-6">
          <div className="flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{indexOfFirstUser + 1}</span> a <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> de{' '}
                <span className="font-medium">{filteredUsers.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-l-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-r-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="py-12 text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron usuarios</h3>
          <p className="text-gray-600 dark:text-gray-400">Intenta ajustar tu búsqueda o filtros.</p>
        </div>
      )}

      {/* Add User Form Modal */}
      {showForm && (
        <UserForm
          initialData={editingUser ?? {}}
          onSubmit={editingUser ? handleEdit : handleCreate}
          onCancel={() => { setShowForm(false); setEditingUser(null); }}
        />
      )}
      {tempPassword && (
        <TempPasswordModal password={tempPassword} onClose={() => setTempPassword(null)} />
      )}
      {profileUser && (
        <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </div>
  );
};

export default UserManagement;