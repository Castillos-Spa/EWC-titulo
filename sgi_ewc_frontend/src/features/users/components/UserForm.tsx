import React, { useEffect, useMemo, useState } from 'react';
import { User, RoleAssignment, Role } from '../../../types/User';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';

interface UserFormProps {
  open?: boolean;
  initialData?: Partial<User>;
  onSubmit: (data: Partial<User>) => void;
  onCancel: () => void;
}

// Opciones para los dropdowns, directamente desde los tipos para consistencia
const roleOptions: Role[] = ["Admin", "Jefe", "Supervisor", "Especialista", "Trabajador", "Lector"];
const areaOptions = ["Admin", "IT", "Transporte", "Taller", "Obras", "Aseo", "RRHH", "Finanza", "P_Riesgo"];

const UserForm: React.FC<UserFormProps> = ({ open = true, initialData = {}, onSubmit, onCancel }) => {
  const [form, setForm] = useState<Partial<User>>({ active: true, ...initialData });
  const editing = Boolean(initialData?.id);
  const title = useMemo(() => editing ? 'Editar usuario' : 'Registrar usuario', [editing]);
  const subtitle = 'Completa los datos del usuario y sus asignaciones de rol y área.';

  useEffect(() => {
    // Si no hay asignaciones iniciales, agregar una vacía para empezar
    if (!form.roleAssignments || form.roleAssignments.length === 0) {
      setForm(f => ({ ...f, roleAssignments: [{ area: '', role: '' as Role }] }));
    }
  }, [form.roleAssignments]);

  // El componente Modal maneja Escape y backdrop; aquí no es necesario duplicarlo

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
    const username = (form.username ?? '').toString().trim();
    const email = (form.email ?? '').toString().trim();
    const active = form.active === true;
    const roleAssignments = (form.roleAssignments || [])
      .filter(ra => (ra.area || '').toString().trim() && (ra.role || '').toString().trim())
      .map(ra => ({
        area: (ra.area || '').toString().trim(),
        role: ra.role,
        ...(ra.specialty ? { specialty: ra.specialty } : {}),
        ...(Array.isArray(ra.additionalPermissions) && ra.additionalPermissions.length > 0
          ? { additionalPermissions: ra.additionalPermissions.filter(Boolean) }
          : {}),
      }));

    const payload: Partial<User> & {
      roleAssignments?: { area: string; role: Role; specialty?: any; additionalPermissions?: string[] }[];
    } = {
      ...(username ? { username } : {}),
      ...(email ? { email } : {}),
      active,
      ...(roleAssignments.length > 0 ? { roleAssignments } : {}),
    };

    onSubmit(payload);
  };

  const labelCls = 'mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70';
  const inputCls = 'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500';

  return (
    <Modal open={open} title={title} subtitle={subtitle} onClose={onCancel} size="lg">
        <form className="mt-2 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="user-username" className={labelCls}>Nombre completo</label>
            <input
              id="user-username"
              name="username"
              type="text"
              value={form.username ?? ''}
              onChange={handleChange}
              placeholder="Wilson Castillo"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="user-email" className={labelCls}>Correo electrónico</label>
            <input
              id="user-email"
              name="email"
              type="email"
              value={form.email ?? ''}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              className={inputCls}
            />
          </div>

          {/* Asignaciones de Rol y Área */}
          <fieldset className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/60 p-5 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_rgba(226,232,240,0.06))] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_rgba(15,23,42,0.35))]" />
            <div className="relative space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Asignaciones de rol</legend>
              <div className="space-y-3">
                {(form.roleAssignments || []).map((assignment, index) => (
                  <div key={`${assignment.area}-${assignment.role}-${index}`} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <label htmlFor={`area-${index}`} className={labelCls}>Área</label>
                      <select
                        id={`area-${index}`}
                        value={assignment.area}
                        onChange={(e) => handleAssignmentChange(index, 'area', e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Seleccionar Área</option>
                        {areaOptions.map(area => <option key={area} value={area}>{area}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`role-${index}`} className={labelCls}>Rol</label>
                      <select
                        id={`role-${index}`}
                        value={assignment.role}
                        onChange={(e) => handleAssignmentChange(index, 'role', e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Seleccionar Rol</option>
                        {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </div>
                    <div className="flex sm:justify-end">
                      <button
                        type="button"
                        onClick={() => removeAssignment(index)}
                        className="inline-flex items-center justify-center rounded-2xl border border-rose-300/60 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100"
                        title="Eliminar asignación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAssignment}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                >
                  <Plus className="w-4 h-4" />
                  Agregar asignación
                </button>
              </div>
            </div>
          </fieldset>

          <div>
            <span className={labelCls}>Estado</span>
            <div className="inline-flex w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <button
                type="button"
                aria-pressed={form.active === true}
                onClick={() => setForm({ ...form, active: true })}
                className={`flex-1 px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:focus-visible:ring-sky-500 ${form.active ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-200/50 dark:shadow-sky-900/50' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}
              >
                Activo
              </button>
              <button
                type="button"
                aria-pressed={form.active === false}
                onClick={() => setForm({ ...form, active: false })}
                className={`flex-1 px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:focus-visible:ring-sky-500 ${form.active ? 'hover:bg-slate-100 dark:hover:bg-white/10' : 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md shadow-rose-200/50 dark:shadow-rose-900/40'}`}
              >
                Inactivo
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-blue-200/70">Controla si el usuario puede acceder actualmente al sistema.</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/60 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
            <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-blue-100">Permisos del rol</h4>
            <div className="space-y-1 text-sm text-slate-600 dark:text-blue-200/80">
              <p>• Acceso a módulos del área asignada</p>
              <p>• Crear y gestionar tickets</p>
              <p>• Ver reportes y análisis</p>
              <p>• Funcionalidad específica según el rol seleccionado</p>
            </div>
          </div>

          <footer className="flex flex-col gap-3 pt-2 text-sm md:flex-row md:items-center md:justify-end md:space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
            >
              {editing ? 'Guardar cambios' : 'Registrar usuario'}
            </button>
          </footer>
        </form>
    </Modal>
  );
};

export default UserForm;
