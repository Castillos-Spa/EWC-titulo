import React, { useState } from 'react';
import { User } from '../../types/User';

interface UserFormProps {
  initialData?: Partial<User>;
  onSubmit: (data: Partial<User>) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ initialData = {}, onSubmit, onCancel }) => {
  const [form, setForm] = useState<Partial<User>>(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Los permisos ahora se asignan en el backend basados en los roles.
    // No es necesario enviarlos desde el frontend a menos que se quieran sobreescribir manualmente.
    const data = {
      ...form,
      // El backend espera el valor del 'area' (ej: 'admin'), no la etiqueta.
      active: form.active === true ,
      roles: Array.isArray(form.roles) ? form.roles.filter(r => r) : [form.roles ?? ''],
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Agregar Nuevo Usuario</h3>
        </div>
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
        <label htmlFor="user-username" className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
        <input
          id="user-username"
          name="username"
          type="text"
          value={form.username ?? ''}
          onChange={handleChange}
          placeholder="Wilson Castillo"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
        <input
          id="user-email"
          name="email"
          type="email"
          value={form.email ?? ''}
          onChange={handleChange}
          placeholder="ejemplo@correo.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label htmlFor="user-area" className="block text-sm font-medium text-gray-700 mb-2">Área</label>
        <select
          id="user-area"
          name="area"
          value={form.area ?? ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        > 
          <option value="">Seleccionar área</option>
          <option value="Admin">Administración</option>
          <option value="IT">IT</option>
          <option value="Transporte">Transportes</option>
          <option value="Taller">Taller mecanico</option>
          <option value="Obras">Obras civiles</option>
          <option value="Aseo">Aseo</option>
          <option value="RRHH">Recursos Humanos</option>
          <option value="Finanza">Finanzas</option>
          <option value="P_Riesgo">Prevencion de Riesgo</option>
        </select>
        <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
        <select
          id="user-role"
          name="roles"
          value={form.roles?.[0] ?? ''}
          onChange={e => setForm({ ...form, roles: [e.target.value] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccionar rol</option>
          <option value="Admin">Administrador</option>
          <option value="Obras">Obras Civiles</option>
          <option value="Aseo">Personal Limpieza</option>
          <option value="IT">Personal IT</option>
          <option value="Transporte">Supervisor Transporte</option>
          <option value="Driver">Conductor</option>
          <option value="Mecanico">Mecanico</option>
          <option value="Lector">Lector</option>
          <option value="RRHH">Recursos Humanos</option>
          <option value="Finanza">Finanzas</option>
          <option value="P_Riesgo">Prevencion de Riesgo</option>

        </select>
        <fieldset className="space-y-2">
          <legend className="block text-sm font-medium text-gray-700 mb-2">Estado</legend>
          <div className="flex space-x-4">
            <label htmlFor="user-active-true">
              <input
                id="user-active-true"
                type="radio"
                name="active"
                value="true"
                checked={form.active === true}
                onChange={() => setForm({ ...form, active: true })}
              /> Activo
            </label>
            <label htmlFor="user-active-false">
              <input
                id="user-active-false"
                type="radio"
                name="active"
                value="false"
                checked={form.active === false}
                onChange={() => setForm({ ...form, active: false })}
              /> Inactivo
            </label>
          </div>
        </fieldset>
        <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Permisos del Rol:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Acceso a módulos del área asignada</p>
                  <p>• Crear y gestionar tickets</p>
                  <p>• Ver reportes y análisis</p>
                  <p>• Funcionalidad específica según el rol seleccionado</p>
                </div>
              </div>
        <div className="flex justify-end pt-4 space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg">Guardar</button>
        </div>
      </form>
      </div>
      
    </div>
  );
};

export default UserForm;