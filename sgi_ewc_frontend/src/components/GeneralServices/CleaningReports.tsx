import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { Aseo } from '../../types/Aseo';
import { fetchAseos, createAseo, updateAseo } from '../../utils/aseoApi';

const CleaningReports: React.FC = () => {
  const [reports, setReports] = useState<Aseo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Aseo | null>(null);
  const [editingReport, setEditingReport] = useState<Aseo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchAseos()
      .then((list) => {
        if (!mounted) return;
        setReports(list);
      })
      .catch((err) => console.error('Failed loading aseo', err));
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
  const dateVal = fd.get('date');
  const date = typeof dateVal === 'string' && dateVal ? dateVal : new Date().toISOString();

  const timeSpentVal = fd.get('timeSpent');
  const timeSpent = typeof timeSpentVal === 'string' && timeSpentVal ? Number(timeSpentVal) : 0;

  const areaVal = fd.get('area');
  const area = typeof areaVal === 'string' ? areaVal.trim() : '';

  const responsibleStaffVal = fd.get('responsibleStaff');
  const responsibleStaff = typeof responsibleStaffVal === 'string' ? responsibleStaffVal.trim() : '';

  const tasks = fd.getAll('tasks').map((v) => (typeof v === 'string' ? v : '')).filter(Boolean);

  const issuesVal = fd.get('issues');
  const issuesText = typeof issuesVal === 'string' ? issuesVal : '';
  const issues = issuesText ? issuesText.split('\n').map(s => s.trim()).filter(Boolean) : [];

  const observationsVal = fd.get('observations');
  const observations = typeof observationsVal === 'string' && observationsVal.trim() ? observationsVal.trim() : undefined;

  const statusVal = fd.get('status');
  const status = (typeof statusVal === 'string' ? statusVal : 'PENDING').toUpperCase() as Aseo['status'];

    const payload: Partial<Aseo> = {
      date,
      area,
      tasks,
      responsibleStaff,
      timeSpent,
      issues,
      status,
      observations,
    };

    try {
      const created = await createAseo(payload);
      setReports((prev) => [created, ...prev]);
      setShowForm(false);
      form.reset();
    } catch (err) {
      console.error('Failed creating aseo', err);
      alert('No se pudo crear el reporte. Revisa la consola.');
    }
  };

  const formatDate = (iso?: string) => {
    try {
      const d = iso ? new Date(iso) : new Date();
      return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch (err) {
      return iso ?? '';
    }
  };

  const isoToDateInput = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const openDetails = (r: Aseo) => {
    setSelectedReport(r);
    setShowDetails(true);
  };

  const openEdit = (r: Aseo) => {
    setEditingReport(r);
    setShowEdit(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingReport) return;
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    const dateVal = fd.get('date');
    const date = typeof dateVal === 'string' && dateVal ? dateVal : editingReport.date;

    const timeSpentVal = fd.get('timeSpent');
    const timeSpent = typeof timeSpentVal === 'string' && timeSpentVal ? Number(timeSpentVal) : editingReport.timeSpent;

    const areaVal = fd.get('area');
    const area = typeof areaVal === 'string' ? areaVal.trim() : editingReport.area;

    const responsibleStaffVal = fd.get('responsibleStaff');
    const responsibleStaff = typeof responsibleStaffVal === 'string' ? responsibleStaffVal.trim() : editingReport.responsibleStaff;

    const tasks = fd.getAll('tasks').map((v) => (typeof v === 'string' ? v : '')).filter(Boolean);

    const issuesVal = fd.get('issues');
    const issuesText = typeof issuesVal === 'string' ? issuesVal : '';
    const issues = issuesText ? issuesText.split('\n').map(s => s.trim()).filter(Boolean) : editingReport.issues;

    const observationsVal = fd.get('observations');
    const observations = typeof observationsVal === 'string' && observationsVal.trim() ? observationsVal.trim() : editingReport.observations;

    const statusVal = fd.get('status');
    const status = (typeof statusVal === 'string' ? statusVal : editingReport.status).toUpperCase() as Aseo['status'];

    const payload: Partial<Aseo> = {
      date,
      area,
      tasks,
      responsibleStaff,
      timeSpent,
      issues,
      status,
      observations,
    };

    try {
      const updated = await updateAseo(editingReport.id, payload);
      setReports((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setShowEdit(false);
      setEditingReport(null);
    } catch (err) {
      console.error('Failed updating aseo', err);
      alert('No se pudo actualizar el reporte. Revisa la consola.');
    }
  };

  const filteredReports = reports.filter((report) =>
    report.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.responsibleStaff.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Aseo['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'PENDING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getStatusIcon = (status: Aseo['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'PARTIAL': return <AlertTriangle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes de Limpieza</h2>
          <p className="text-gray-600 dark:text-gray-400">Actividades diarias de limpieza y reportes de mantenimiento</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Nuevo Reporte</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tareas de Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{reports.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'COMPLETED').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Horas Trabajadas</p>
              <p className="text-2xl font-bold text-blue-600">{reports.reduce((sum, r) => sum + r.timeSpent, 0)}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Problemas Encontrados</p>
              <p className="text-2xl font-bold text-yellow-600">{reports.reduce((sum, r) => sum + (r.issues?.length || 0), 0)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por área o personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar reportes"
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                      <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{report.area}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Report #{report.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span className="capitalize">{report.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(report.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Tiempo:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{report.timeSpent}h</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">Personal:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{report.responsibleStaff}</span>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Tareas Completadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.tasks.map((task) => (
                      <span key={`${report.id}-${task}`} className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-100">{task}</span>
                    ))}
                  </div>
                </div>

                {report.issues.length > 0 && (
                  <div>
                    <h4 className="flex items-center mb-2 space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100"><AlertTriangle className="w-4 h-4 text-yellow-600" /> <span>Problemas Encontrados:</span></h4>
                    <div className="space-y-1">
                      {report.issues.map((issue) => (
                        <div key={`${report.id}-${issue}`} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.observations && (
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
                    <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">Observaciones:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{report.observations}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button onClick={() => openDetails(report)} className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg dark:bg-slate-700 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-600">Ver Detalles</button>
                <button onClick={() => openEdit(report)} className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">Editar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="py-12 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron reportes</h3>
          <p className="text-gray-600 dark:text-gray-400">Intenta ajustar tu búsqueda o crear un nuevo reporte de limpieza.</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nuevo Reporte de Limpieza</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">Registrar actividades diarias de limpieza y problemas encontrados</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="report-date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                  <input type="date" id="report-date" name="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label htmlFor="report-time" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tiempo Trabajado (horas)</label>
                  <input type="number" step="0.5" placeholder="4.5" id="report-time" name="timeSpent" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
                </div>
              </div>

              <div>
                <label htmlFor="report-area" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Área/Ubicación</label>
                <input type="text" placeholder="Almacén A - Planta Principal" id="report-area" name="area" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
              </div>

              <div>
                <label htmlFor="report-staff" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Personal Responsable</label>
                <select id="report-staff" name="responsibleStaff" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                  <option>Seleccionar personal</option>
                  <option>Maria Cleaning</option>
                  <option>Ana Rodriguez</option>
                  <option>Carlos Maintenance</option>
                </select>
              </div>

              <fieldset>
                <legend className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tareas Completadas</legend>
                <div className="grid grid-cols-2 gap-2">
                  {['Trapear pisos', 'Limpiar ventanas', 'Recolección basura', 'Sanitización baños', 'Limpiar escritorios', 'Aspirar alfombras', 'Área cocina', 'Salas reuniones'].map((task, idx) => {
                    const id = `task-${idx}`;
                    return (
                      <div key={task} className="flex items-center gap-2">
                        <input id={id} name="tasks" value={task} type="checkbox" className="text-blue-600 border-gray-300 rounded dark:border-slate-600 focus:ring-blue-500" />
                        <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">{task}</label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="report-issues" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Problemas Encontrados</label>
                <textarea rows={3} placeholder="Describe cualquier problema encontrado durante la limpieza..." id="report-issues" name="issues" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"></textarea>
              </div>

              <div>
                <label htmlFor="report-observations" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                <textarea rows={3} placeholder="Observaciones adicionales o notas..." id="report-observations" name="observations" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"></textarea>
              </div>

              <div>
                <label htmlFor="report-status" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                <select id="report-status" name="status" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                  <option value="COMPLETED">Completado</option>
                  <option value="PARTIAL">Parcialmente Completado</option>
                  <option value="PENDING">Pendiente</option>
                </select>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg dark:border-slate-600 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">Guardar Reporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg p-6 text-gray-900 bg-white border border-gray-200 dark:bg-slate-800 dark:text-slate-100 rounded-xl dark:border-slate-700">
            <h3 className="mb-2 text-lg font-semibold">Detalle Reporte #{selectedReport.id}</h3>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Área: <span className="font-medium">{selectedReport.area}</span></p>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Fecha: <span className="font-medium">{formatDate(selectedReport.date)}</span></p>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Personal: <span className="font-medium">{selectedReport.responsibleStaff}</span></p>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Tiempo: <span className="font-medium">{selectedReport.timeSpent}h</span></p>
            <div className="mb-2">
              <h4 className="text-sm font-medium">Tareas</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedReport.tasks.map((t) => (<span key={t} className="px-2 py-1 text-xs bg-green-100 rounded-full dark:bg-green-900">{t}</span>))}
              </div>
            </div>
            {selectedReport.issues.length > 0 && (
              <div className="mb-2">
                <h4 className="text-sm font-medium">Problemas</h4>
                <ul className="mt-1 text-sm text-gray-700 list-disc list-inside dark:text-gray-300">
                  {selectedReport.issues.map((it) => <li key={it}>{it}</li>)}
                </ul>
              </div>
            )}
            {selectedReport.observations && (
              <div className="mb-2">
                <h4 className="text-sm font-medium">Observaciones</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReport.observations}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowDetails(false); setSelectedReport(null); }}
                className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded dark:border-slate-600 dark:text-slate-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
              >Cerrar</button>
              <button
                onClick={() => { setShowDetails(false); openEdit(selectedReport); }}
                className="px-3 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
              >Editar</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Editar Reporte #{editingReport.id}</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="edit-date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                  <input id="edit-date" type="date" name="date" defaultValue={isoToDateInput(editingReport.date)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
                </div>
                <div>
                  <label htmlFor="edit-time" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tiempo Trabajado (horas)</label>
                  <input id="edit-time" type="number" step="0.5" name="timeSpent" defaultValue={String(editingReport.timeSpent)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label htmlFor="edit-area" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Área/Ubicación</label>
                <input id="edit-area" name="area" defaultValue={editingReport.area} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
              </div>
              <div>
                <label htmlFor="edit-staff" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Personal Responsable</label>
                <input id="edit-staff" name="responsibleStaff" defaultValue={editingReport.responsibleStaff} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
              </div>
              <fieldset>
                <legend className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tareas Completadas</legend>
                <div className="grid grid-cols-2 gap-2">
                  {['Trapear pisos', 'Limpiar ventanas', 'Recolección basura', 'Sanitización baños', 'Limpiar escritorios', 'Aspirar alfombras', 'Área cocina', 'Salas reuniones'].map((task, idx) => {
                    const id = `edit-task-${idx}`;
                    return (
                      <div key={task} className="flex items-center gap-2">
                        <input id={id} name="tasks" value={task} type="checkbox" defaultChecked={editingReport.tasks.includes(task)} className="text-blue-600 border border-gray-300 rounded dark:border-slate-600 focus:ring-blue-500" />
                        <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">{task}</label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
              <div>
                <label htmlFor="edit-issues" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Problemas Encontrados</label>
                <textarea id="edit-issues" name="issues" defaultValue={editingReport.issues.join('\n')} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" rows={3} />
              </div>
              <div>
                <label htmlFor="edit-observations" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                <textarea id="edit-observations" name="observations" defaultValue={editingReport.observations ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" rows={3} />
              </div>
              <div>
                <label htmlFor="edit-status" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                <select id="edit-status" name="status" defaultValue={editingReport.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                  <option value="COMPLETED">Completado</option>
                  <option value="PARTIAL">Parcialmente Completado</option>
                  <option value="PENDING">Pendiente</option>
                </select>
              </div>
              <div className="flex justify-end pt-4 space-x-3">
                <button type="button" onClick={() => { setShowEdit(false); setEditingReport(null); }} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded dark:border-slate-600 dark:text-slate-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningReports;
