import React, { useState, useEffect } from 'react';
import { User, RoleAssignment, Role } from '../../types/User';
import { Plus, Trash2 } from 'lucide-react';

interface UserFormProps {
  initialData?: Partial<User>;
  onSubmit: (data: Partial<User>) => void;
  onCancel: () => void;
}

// Opciones para los dropdowns, directamente desde los tipos para consistencia
const roleOptions: Role[] = ["Admin", "Jefe", "Supervisor", "Especialista", "Trabajador", "Lector"];
const areaOptions = ["Admin", "IT", "Transporte", "Taller", "Obras", "Aseo", "RRHH", "Finanza", "P_Riesgo"];

const UserForm: React.FC<UserFormProps> = ({ initialData = {}, onSubmit, onCancel }) => {
  const [form, setForm] = useState<Partial<User>>({ active: true, ...initialData });

  useEffect(() => {
    // Si no hay asignaciones iniciales, agregar una vacía para empezar
    if (!form.roleAssignments || form.roleAssignments.length === 0) {
      setForm(f => ({ ...f, roleAssignments: [{ area: '', role: '' as Role }] }));
    }
  }, [form.roleAssignments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAssignmentChange = (index: number, field: keyof RoleAssignment, value: string) => {
    const updatedAssignments = [...(form.roleAssignments || [])];
    updatedAssignments[index] = { ...updatedAssignments[index], [field]: value };
    setForm({ ...form, roleAssignments: updatedAssignments });
  };

  const addAssignment = () => {
    setForm({ ...form, roleAssignments: [...(form.roleAssignments || []), { area: '', role: '' as Role }] });
  };

  const removeAssignment = (index: number) => {
    const updatedAssignments = [...(form.roleAssignments || [])];
    updatedAssignments.splice(index, 1);
    setForm({ ...form, roleAssignments: updatedAssignments });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Los permisos ahora se asignan en el backend basados en los roles.
    // No es necesario enviarlos desde el frontend a menos que se quieran sobreescribir manualmente.
    const data = {
      ...form,
      // El backend espera el valor del 'area' (ej: 'admin'), no la etiqueta.
      active: form.active === true,
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{initialData.id ? 'Editar' : 'Agregar'} Usuario</h3>
        </div>
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
        <label htmlFor="user-username" className="block mb-2 text-sm font-medium text-gray-700">Nombre Completo</label>
        <input
          id="user-username"
          name="username"
          type="text"
          value={form.username ?? ''}
          onChange={handleChange}
          placeholder="Wilson Castillo"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label htmlFor="user-email" className="block mb-2 text-sm font-medium text-gray-700">Correo Electrónico</label>
        <input
          id="user-email"
          name="email"
          type="email"
          value={form.email ?? ''}
          onChange={handleChange}
          placeholder="ejemplo@correo.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        {/* Asignaciones de Rol y Área */}
        <fieldset className="p-4 border border-gray-200 rounded-lg">
          <legend className="px-2 text-sm font-medium text-gray-700">Asignaciones de Rol</legend>
          <div className="space-y-3">
            {(form.roleAssignments || []).map((assignment, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={assignment.area}
                  onChange={(e) => handleAssignmentChange(index, 'area', e.target.value)}
                  className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar Área</option>
                  {areaOptions.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
                <select
                  value={assignment.role}
                  onChange={(e) => handleAssignmentChange(index, 'role', e.target.value)}
                  className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar Rol</option>
                  {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeAssignment(index)}
                  className="p-2 text-red-500 rounded-md hover:bg-red-100"
                  title="Eliminar asignación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAssignment}
              className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm text-blue-600 border-2 border-gray-300 border-dashed rounded-lg hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              Agregar Asignación
            </button>
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="block mb-2 text-sm font-medium text-gray-700">Estado</legend>
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
        <div className="p-4 rounded-lg bg-blue-50">
                <h4 className="mb-2 text-sm font-medium text-blue-900">Permisos del Rol:</h4>
                <div className="space-y-1 text-sm text-blue-800">
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