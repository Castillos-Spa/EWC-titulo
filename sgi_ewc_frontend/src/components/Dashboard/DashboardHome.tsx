import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Truck, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Wrench,
  Ticket
} from 'lucide-react';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  const getStatsForRole = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { label: 'Usuarios Activos', value: '47', icon: Users, color: 'bg-blue-500', change: '+2.5%' },
          { label: 'Tickets Abiertos', value: '23', icon: Ticket, color: 'bg-yellow-500', change: '-5.2%' },
          { label: 'Vehículos de Flota', value: '18', icon: Truck, color: 'bg-green-500', change: '+1' },
          { label: 'Tareas Pendientes', value: '12', icon: Clock, color: 'bg-purple-500', change: '+3' },
        ];
      case 'transport_supervisor':
        return [
          { label: 'Conductores Activos', value: '12', icon: Users, color: 'bg-blue-500', change: '0%' },
          { label: 'Viajes Hoy', value: '8', icon: Truck, color: 'bg-green-500', change: '+2' },
          { label: 'Mantenimiento Vencido', value: '3', icon: Wrench, color: 'bg-yellow-500', change: '+1' },
          { label: 'Incidentes', value: '1', icon: AlertTriangle, color: 'bg-red-500', change: '0' },
        ];
      case 'driver':
        return [
          { label: 'Viajes Completados', value: '156', icon: CheckCircle, color: 'bg-green-500', change: '+5' },
          { label: 'Horas Conducidas', value: '42.5', icon: Clock, color: 'bg-blue-500', change: '+8.2' },
          { label: 'Eficiencia Combustible', value: '8.5L', icon: TrendingUp, color: 'bg-purple-500', change: '-0.3L' },
          { label: 'Puntuación Ruta', value: '95%', icon: Truck, color: 'bg-green-500', change: '+2%' },
        ];
      case 'it_staff':
        return [
          { label: 'Tickets Abiertos', value: '15', icon: Ticket, color: 'bg-yellow-500', change: '+3' },
          { label: 'Resueltos Hoy', value: '7', icon: CheckCircle, color: 'bg-green-500', change: '+2' },
          { label: 'Alta Prioridad', value: '4', icon: AlertTriangle, color: 'bg-red-500', change: '+1' },
          { label: 'Respuesta Promedio', value: '2.3h', icon: Clock, color: 'bg-blue-500', change: '-0.5h' },
        ];
      default:
        return [
          { label: 'Tareas Hoy', value: '8', icon: CheckCircle, color: 'bg-green-500', change: '+2' },
          { label: 'Elementos Pendientes', value: '3', icon: Clock, color: 'bg-yellow-500', change: '-1' },
          { label: 'Completados', value: '24', icon: TrendingUp, color: 'bg-blue-500', change: '+6' },
          { label: 'Puntuación Equipo', value: '92%', icon: Users, color: 'bg-purple-500', change: '+3%' },
        ];
    }
  };

  const getRecentActivities = () => {
    const activities = [
      { id: 1, action: 'Viaje completado', details: 'Ruta A-B por John Driver', time: 'hace 10 min', type: 'success' },
      { id: 2, action: 'Mantenimiento programado', details: 'Camión TK-001 inspección frenos', time: 'hace 25 min', type: 'warning' },
      { id: 3, action: 'Ticket resuelto', details: 'Problema de conectividad solucionado', time: 'hace 1 hora', type: 'success' },
      { id: 4, action: 'Solicitud de suministros', details: 'Suministros de limpieza solicitados', time: 'hace 2 horas', type: 'info' },
      { id: 5, action: 'Usuario agregado', details: 'Nueva conductora Maria Santos', time: 'hace 3 horas', type: 'info' },
    ];

    return activities.slice(0, user?.role === 'admin' ? 5 : 3);
  };

  const stats = getStatsForRole();
  const activities = getRecentActivities();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">¡Bienvenido de nuevo, {user?.name}!</h2>
        <p className="text-blue-100">
          {user?.role === 'admin' ? 'Resumen del sistema y herramientas de gestión' :
           user?.role === 'transport_supervisor' ? 'Monitorea tu flota y operaciones' :
           user?.role === 'driver' ? 'Tu rendimiento de conducción y asignaciones' :
           user?.role === 'it_staff' ? 'Tickets de soporte y estado del sistema' :
           'Tus tareas diarias y progreso'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      stat.change.startsWith('+') && !stat.change.includes('L') ? 'bg-green-100 text-green-800' : 
                      stat.change.startsWith('-') && !stat.change.includes('L') ? 'bg-red-100 text-red-800' :
                      stat.change.includes('L') && stat.change.startsWith('-') ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  activity.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            {user?.role === 'transport_supervisor' && (
              <>
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                  <Truck className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Nuevo Viaje</p>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                  <Wrench className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Programar Mantenimiento</p>
                </button>
              </>
            )}
            {user?.role === 'driver' && (
              <>
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                  <CheckCircle className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Reportar Viaje</p>
                </button>
                <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Reportar Incidente</p>
                </button>
              </>
            )}
            {user?.role === 'it_staff' && (
              <>
                <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                  <Ticket className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Ver Tickets</p>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                  <Users className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Soporte Usuario</p>
                </button>
              </>
            )}
            {['general_services', 'cleaning', 'civil_works'].includes(user?.role || '') && (
              <>
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                  <CheckCircle className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Reporte Diario</p>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                  <Ticket className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Solicitar Suministros</p>
                </button>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                  <Users className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Gestionar Usuarios</p>
                </button>
                <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                  <Ticket className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Reportes del Sistema</p>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;