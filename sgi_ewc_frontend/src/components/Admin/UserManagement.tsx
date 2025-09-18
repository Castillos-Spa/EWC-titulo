import React, { useState, useEffect } from 'react';
import { Plus, Search, User, Mail, Shield, Edit, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, getTempPassword } from '../../utils/userApi';
import { User as UserType } from '../../types/User';
import UserForm from './UserForm';

const TempPasswordModal: React.FC<{ password: string; onClose: () => void }> = ({ password, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 className="mb-4 text-xl font-bold">Contraseña temporal generada</h2>
      <div className="flex items-center mb-4 font-mono text-lg text-blue-700 break-all select-all">
        {password}
        <button
          className="px-2 py-1 ml-2 text-xs bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => {
            navigator.clipboard.writeText(password);
          }}
        >
          Copiar
        </button>
      </div>
      <p className="mb-4 text-gray-600">Entrega esta contraseña al usuario para su primer acceso. Se le pedirá cambiarla al iniciar sesión.</p>
      <div className="flex justify-end">
        <button onClick={onClose} className="px-4 py-2 text-white bg-blue-600 rounded-lg">Cerrar</button>
      </div>
    </div>
  </div>
);

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  const handleCreate = async (data: Partial<User>) => {
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

  const getRoleColor = (role: string) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-800';
      case 'Transporte': return 'bg-blue-100 text-blue-800';
      case 'Driver': return 'bg-green-100 text-green-800';
      // case 'general_services': return 'bg-yellow-100 text-yellow-800';
      case 'IT': return 'bg-indigo-100 text-indigo-800';
      case 'Aseo': return 'bg-teal-100 text-teal-800';
      case 'Obras': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    if (!role) return 'Sin Rol';
    switch (role) {
      case 'Admin': return 'Administrador';
      case 'Transporte': return 'Supervisor Transporte';
      case 'Driver': return 'Conductor';
      // case 'general_services': return 'Servicios Generales';
      case 'IT': return 'Personal IT';
      case 'Aseo': return 'Personal Limpieza';
      case 'Obras': return 'Obras Civiles';
      default: return role.replace('_', ' ');
    }
  };

  const getAreaLabel = (area: string) => {
    switch (area) {
      case 'water_transport': return 'Transporte Acuático';
      case 'general_services': return 'Servicios Generales';
      case 'IT': return 'IT';
      case 'Admin': return 'Administración';
      default: return area.replace('_', ' ');
    }
  };

  // Corrección de filtros
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.roles.includes(filterRole);
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.active) ||
      (filterStatus === 'inactive' && !user.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

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
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600">Gestiona cuentas de usuario, roles y permisos</p>
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
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.active).length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Inactivos</p>
              <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.active).length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Roles</p>
              <p className="text-2xl font-bold text-purple-600">{new Set(users.flatMap(u => u.roles)).size}</p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los Roles</option>
            <option value="admin">Administrador</option>
            <option value="transport_supervisor">Supervisor Transporte</option>
            <option value="driver">Conductor</option>
            <option value="general_services">Servicios Generales</option>
            <option value="it_staff">Personal IT</option>
            <option value="cleaning">Personal Limpieza</option>
            <option value="civil_works">Obras Civiles</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Rol y Área
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Creado
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">
                          {user.username.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                          {user.mustChangePassword && (
                            <button
                              title="Ver contraseña temporal"
                              className="p-1 ml-2 text-blue-600 hover:text-blue-900"
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
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.roles[0])}`}>
                        {getRoleLabel(user.roles[0])}
                      </span>
                      <div className="text-xs text-gray-500">{getAreaLabel(user.area)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    <div>{getTimeSince(user.lastLogin)}</div>
                    <div className="text-xs text-gray-500">{formatDate(user.lastLogin)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => { setEditingUser(user); setShowForm(true); }}
                        className="p-1 text-blue-600 rounded hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-red-600 rounded hover:text-red-900"
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

      {filteredUsers.length === 0 && (
        <div className="py-12 text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No se encontraron usuarios</h3>
          <p className="text-gray-600">Intenta ajustar tu búsqueda o filtros.</p>
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
    </div>
  );
};

export default UserManagement;