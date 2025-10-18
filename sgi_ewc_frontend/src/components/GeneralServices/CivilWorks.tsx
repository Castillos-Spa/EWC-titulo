import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, MapPin, HardHat, CheckCircle, Clock, AlertTriangle, Hammer } from 'lucide-react';
import type { CivilWork, CivilWorkStatus, CivilWorkType, CivilWorkTask, CreateCivilWorkPayload } from '../../types/CivilWork';
import { fetchCivilWorks, fetchCivilWorkById, createCivilWork, updateCivilWorkTasks } from '../../utils/civilWorkApi';

const CivilWorks: React.FC = () => {
  const [reports, setReports] = useState<Partial<CivilWork>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CivilWork | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCivilWorks();
        setReports(data.items);
      } catch (error) {
        console.error("Error al cargar las obras civiles:", error);
        // Aquí podrías mostrar una notificación de error al usuario
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleViewDetails = async (reportId: number) => {
    try {
      const fullReport = await fetchCivilWorkById(reportId);
      setSelectedReport(fullReport);
    } catch (error) {
      console.error(`Error al obtener los detalles de la obra #${reportId}:`, error);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const materialsUsed = (formData.get('materialsUsed') as string)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const taskNames = ((formData.get('tasks') as string) ?? '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const tasks = taskNames.map<CivilWorkTask>(taskName => ({ name: taskName, completed: false }));

    const payload: CreateCivilWorkPayload = {
      project: formData.get('project') as string,
      location: formData.get('location') as string,
      startDate: new Date(formData.get('startDate') as string).toISOString(),
      estimatedEndDate: new Date(formData.get('estimatedEndDate') as string).toISOString(),
      workType: formData.get('workType') as CivilWorkType,
  tasks,
      progress: 0, // El progreso siempre inicia en 0
      status: formData.get('status') as CivilWorkStatus,
      observations: formData.get('observations') as string || '',
      issues: (formData.get('issues') as string)
        .split('\n')
        .map(line => line.trim()).filter(Boolean),
      photos: [], // Manejar subida de fotos si es necesario
      // createdById no se envía, se obtiene del token en el backend
      responsibleStaffUsernames: (formData.get('responsibleStaffUsernames') as string)
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0),
      materialsUsed: materialsUsed,
    };

    try {
      const newReport = await createCivilWork(payload);
      setReports(prev => [newReport, ...prev]);
      setShowForm(false);
    } catch (error) {
      console.error("Error al crear la obra civil:", error);
      alert('No se pudo crear el reporte. Revisa la consola para más detalles.');
    }
  };

  const handleTaskToggle = async (reportId: number | undefined, taskIndex: number) => {
    if (typeof reportId !== 'number') return;

    const reportToUpdate = reports.find(r => r?.id === reportId);
    if (!reportToUpdate) return;

    const tasks = reportToUpdate.tasks;
    if (!tasks) return;

    const updatedTasks = tasks.map((task, index) => (
      index === taskIndex ? { ...task, completed: !task.completed } : task
    ));

    try {
      const updatedReport = await updateCivilWorkTasks(reportId, updatedTasks);
      setReports(prev => prev.map(r => (r?.id === reportId ? { ...r, ...updatedReport } : r)));
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(updatedReport);
      }
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);
    }
  };

  const getStatusColor = (status: CivilWorkStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'ON_HOLD':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getStatusIcon = (status: CivilWorkStatus) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Hammer className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'ON_HOLD': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getWorkTypeColor = (type: CivilWorkType) => {
    switch (type) {
      case 'CONSTRUCTION':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'REPAIR':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'MAINTENANCE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'INSPECTION':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getWorkTypeLabel = (type: CivilWorkType) => {
    switch (type) {
      case 'CONSTRUCTION': return 'Construcción';
      case 'REPAIR': return 'Reparación';
      case 'MAINTENANCE': return 'Mantenimiento';
      case 'INSPECTION': return 'Inspección';
      default: return type;
    }
  };

  const searchTermNormalized = searchTerm.trim().toLowerCase();
  const filteredReports = reports.filter((report) => {
    const matchesProject = report.project?.toLowerCase().includes(searchTermNormalized);
    const matchesLocation = report.location?.toLowerCase().includes(searchTermNormalized);
    const staffList = Array.isArray(report.responsibleStaffUsernames)
      ? report.responsibleStaffUsernames
      : [];
    const matchesStaff = staffList.some((staffName) => staffName.toLowerCase().includes(searchTermNormalized));

    return matchesProject || matchesLocation || matchesStaff;
  });

  const filteredReportsWithId = filteredReports.filter(
    (report): report is Partial<CivilWork> & Pick<CivilWork, 'id'> => typeof report?.id === 'number'
  );

  const renderDetailModal = () => {
    if (!selectedReport) {
      return null;
    }

    const {
      id,
      project,
      status,
      workType,
      progress,
      startDate,
      estimatedEndDate,
      actualEndDate,
      location,
      responsibleStaffUsernames,
      tasks,
      materialsUsed,
      issues,
      observations,
    } = selectedReport;

    const taskList = Array.isArray(tasks) ? tasks : [];
    const materialsList = Array.isArray(materialsUsed) ? materialsUsed : [];
    const issuesList = Array.isArray(issues) ? issues : [];
    const staffList = Array.isArray(responsibleStaffUsernames) ? responsibleStaffUsernames : [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Detalle del Proyecto</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{project}</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                  {status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Trabajo</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getWorkTypeColor(workType)}`}>
                  {getWorkTypeLabel(workType)}
                </span>
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</p>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{progress}% completado</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full dark:bg-slate-700">
                  <div
                    className="h-3 bg-blue-600 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio</p>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{startDate ? new Date(startDate).toLocaleDateString('es-CL') : 'N/A'}</p>
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Estimada de Término</p>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{estimatedEndDate ? new Date(estimatedEndDate).toLocaleDateString('es-CL') : 'N/A'}</p>
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Real de Término</p>
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {actualEndDate ? new Date(actualEndDate).toLocaleDateString('es-CL') : 'Aún en progreso'}
                </p>
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</p>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{location}</p>
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Personal Responsable</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {staffList.map((staff) => (
                  <span key={`${id}-${staff}`} className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-100">
                    {staff}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tareas Realizadas</p>
              <div className="mt-2 space-y-2">
                {taskList.map((task, index) => (
                  <div key={`${id}-detail-${task.name}-${index}`} className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-slate-800/50">
                    <input type="checkbox" checked={task.completed} onChange={() => handleTaskToggle(id, index)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{task.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Materiales Utilizados</p>
              <div className="grid grid-cols-2 gap-3 mt-2 md:grid-cols-3">
                {materialsList.map((material, index) => (
                  <div key={`${id}-material-detail-${index}`} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{material}</div>
                  </div>
                ))}
              </div>
            </div>

            {issuesList.length > 0 && (
              <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Incidencias</p>
                <div className="mt-2 space-y-2">
                  {issuesList.map((issue) => (
                    <div key={`${id}-${issue}`} className="flex items-start p-3 space-x-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">{observations}</p>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setSelectedReport(null)}
              className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg dark:bg-slate-700 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Obras Civiles</h2>
          <p className="text-gray-600 dark:text-gray-400">Gestión de proyectos de construcción, reparación y mantenimiento</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Reporte</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Proyectos Activos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isLoading ? '...' : reports.length}</p>
            </div>
            <HardHat className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
              <p className="text-2xl font-bold text-green-600">{isLoading ? '...' : reports.filter(r => r.status === 'COMPLETED').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Progreso</p>
              <p className="text-2xl font-bold text-blue-600">{isLoading ? '...' : reports.filter(r => r.status === 'IN_PROGRESS').length}</p>
            </div>
            <Hammer className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{isLoading ? '...' : reports.filter(r => r.status === 'PENDING' || r.status === 'ON_HOLD').length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por proyecto, ubicación o personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar reportes de obras civiles"
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-spin" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">Cargando reportes...</h3>
            <p className="text-gray-600 dark:text-gray-400">Por favor, espera un momento.</p>
          </div>
        ) : (
          filteredReportsWithId.map((report) => {
          const status = report.status ?? 'PENDING';
          const workType = report.workType ?? 'CONSTRUCTION';
          const taskList = Array.isArray(report.tasks) ? report.tasks : [];
          const materialsList = Array.isArray(report.materialsUsed) ? report.materialsUsed : [];
          const issuesList = Array.isArray(report.issues) ? report.issues : [];
          const staffList = Array.isArray(report.responsibleStaffUsernames) ? report.responsibleStaffUsernames : [];

          return (
          <div key={report.id} className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg dark:bg-orange-900/30">
                      <HardHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{report.project}</h3>
                      <p className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-3 h-3 mr-1" />
                        {report.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWorkTypeColor(workType)}`}>
                      {getWorkTypeLabel(workType)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{report.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-slate-700">
                    <div
                      className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
                      style={{ width: `${report.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Inicio:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{report.startDate ? new Date(report.startDate).toLocaleDateString('es-CL') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Término Est:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{report.estimatedEndDate ? new Date(report.estimatedEndDate).toLocaleDateString('es-CL') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Personal:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{staffList.length} personas</span>
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Tareas Realizadas:</h4>
                  <div className="space-y-1">
                    {taskList.slice(0, 3).map((task, index) => (
                      <div key={`${report.id}-${task.name}-${index}`} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{task.name}</span>
                      </div>
                    ))}
                  </div>
                  {taskList.length > 3 && <p className="mt-1 text-xs text-gray-500">...y {taskList.length - 3} más</p>}
                </div>

                {/* Materials */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Materiales Utilizados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {materialsList.slice(0, 3).map((material, index) => (
                      <span key={`${report.id}-material-${index}`} className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-200">{material}</span>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                {issuesList.length > 0 && (
                  <div>
                    <h4 className="flex items-center mb-2 space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>Incidencias:</span>
                    </h4>
                    <div className="space-y-1">
                      {issuesList.map((issue) => (
                        <div key={`${report.id}-${issue}`} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observations */}
                {report.observations && (
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
                    <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">Observaciones:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{report.observations}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleViewDetails(report.id)}
                  className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg dark:bg-slate-700 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-600"
                >
                  Ver Detalles
                </button>
                <button className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                  Editar
                </button>
              </div>
            </div>
          </div>
        );
        })
        )}
      </div>

      {!isLoading && filteredReports.length === 0 && (
        <div className="py-12 text-center">
          <HardHat className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron reportes</h3>
          <p className="text-gray-600 dark:text-gray-400">Intenta ajustar tu búsqueda o crear un nuevo reporte de obras civiles.</p>
        </div>
      )}

      {/* New Report Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nuevo Reporte de Obras Civiles</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">Registra un nuevo proyecto o actividad de construcción</p>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cw-startDate" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio</label>
                  <input
                    type="date"
                    id="cw-startDate"
                    name="startDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label htmlFor="cw-type" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Trabajo</label>
                  <select id="cw-type" name="workType" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                    <option value="CONSTRUCTION">Construcción</option>
                    <option value="REPAIR">Reparación</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                    <option value="INSPECTION">Inspección</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cw-project" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Proyecto</label>
                <input
                  type="text"
                  name="project"
                  placeholder="Reparación de Muro Perimetral - Sector Norte"
                  id="cw-project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="cw-location" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Perímetro Norte - Warehouse A"
                  id="cw-location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cw-estimatedEndDate" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Estimada de Término</label>
                  <input
                    type="date"
                    id="cw-estimatedEndDate"
                    name="estimatedEndDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label htmlFor="cw-progress" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Progreso (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="progress" // Mantenemos el nombre para consistencia, pero se ignora
                    placeholder="0"
                    value="0"
                    disabled
                    id="cw-progress"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cw-staff" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Personal Responsable (nombres de usuario separados por coma)</label>
                <textarea
                  rows={2}
                  name="responsibleStaffUsernames"
                  placeholder="Ej: jdoe, msmith, cjohnson"
                  id="cw-staff"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>

              <fieldset>
                <legend className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tareas a Realizar (separadas por coma)</legend>
                <input
                  type="text"
                  name="tasks"
                  placeholder="Ej: Preparar terreno, Instalar cimientos, Levantar muros"
                  id="cw-tasks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </fieldset>

              <div>
                <label htmlFor="cw-materials" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Materiales Utilizados</label>
                <textarea
                  rows={4}
                  name="materialsUsed"
                  placeholder="Cemento: 10 sacos&#10;Arena: 2 m³&#10;Ladrillos: 500 unidades&#10;Hierro 3/8: 20 varillas"
                  id="cw-materials"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>

              <div>
                <label htmlFor="cw-issues" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Incidencias o Problemas</label>
                <textarea
                  rows={3}
                  name="issues"
                  defaultValue=""
                  placeholder="Describe cualquier incidencia o problema encontrado durante el trabajo..."
                  id="cw-issues"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>

              <div>
                <label htmlFor="cw-observations" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                <textarea
                  rows={3}
                  name="observations"
                  defaultValue=""
                  placeholder="Observaciones adicionales sobre el progreso del proyecto..."
                  id="cw-observations"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>

              <div>
                <label htmlFor="cw-status" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado del Proyecto</label>
                <select id="cw-status" name="status" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="ON_HOLD">En Espera</option>
                </select>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg dark:border-slate-600 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Guardar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  );
};

export default CivilWorks;