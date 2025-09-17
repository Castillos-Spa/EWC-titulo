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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg" onSubmit={handleSubmit}>
        <input
          name="username"
          type="text"
          value={form.username ?? ''}
          onChange={handleChange}
          placeholder="Nombre de usuario"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <input
          name="email"
          type="email"
          value={form.email ?? ''}
          onChange={handleChange}
          placeholder="Correo electrónico"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <select
          name="area"
          value={form.area ?? ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Seleccionar área</option>
          <option value="admin">Administración</option>
          <option value="water_transport">Transporte Acuático</option>
          <option value="general_services">Servicios Generales</option>
          <option value="it">IT</option>
        </select>
        <select
          name="roles"
          value={form.roles?.[0] ?? ''}
          onChange={e => setForm({ ...form, roles: [e.target.value] })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Seleccionar rol</option>
          <option value="admin">Administrador</option>
          <option value="transport_supervisor">Supervisor Transporte</option>
          <option value="driver">Conductor</option>
          <option value="civil_works">Obras Civiles</option>
          <option value="cleaning">Personal Limpieza</option>
          <option value="IT">Personal IT</option>
          <option value="user">Usuario</option>
        </select>
        <div className="flex space-x-4">
          <label>
            <input
              type="radio"
              name="active"
              value="true"
              checked={form.active === true}
              onChange={() => setForm({ ...form, active: true })}
            /> Activo
          </label>
          <label>
            <input
              type="radio"
              name="active"
              value="false"
              checked={form.active === false}
              onChange={() => setForm({ ...form, active: false })}
            /> Inactivo
          </label>
        </div>
        <div className="flex justify-end pt-4 space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg">Guardar</button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;