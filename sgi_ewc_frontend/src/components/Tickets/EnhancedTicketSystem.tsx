import React, { useState } from 'react';
import { Plus, Search, Filter, MessageSquare, Paperclip, Calendar, User, AlertCircle, CheckCircle, Clock, Send, Eye, UserPlus, Tag, Star } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isInternal: boolean;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: 'it_support' | 'supply_request' | 'maintenance' | 'incident';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  attachments: string[];
  tags: string[];
  rating?: number;
  estimatedHours?: number;
  actualHours?: number;
}

const EnhancedTicketSystem: React.FC = () => {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TK-001',
      title: 'Problemas de conectividad de red en almacén',
      description: 'No se puede conectar a la red de la empresa desde las terminales del almacén',
      category: 'it_support',
      priority: 'high',
      status: 'in_progress',
      createdBy: 'John Driver',
      assignedTo: 'IT Support',
      createdAt: '2025-01-27T09:00:00Z',
      updatedAt: '2025-01-27T10:30:00Z',
      comments: [
        {
          id: '1',
          author: 'IT Support',
          content: 'Hemos identificado el problema. Parece ser un issue con el switch principal. Trabajando en la solución.',
          timestamp: '2025-01-27T10:30:00Z',
          isInternal: false
        },
        {
          id: '2',
          author: 'John Driver',
          content: 'Gracias por la actualización. ¿Cuánto tiempo estimado para la resolución?',
          timestamp: '2025-01-27T11:00:00Z',
          isInternal: false
        }
      ],
      attachments: ['network_diagram.pdf'],
      tags: ['red', 'almacén', 'urgente'],
      estimatedHours: 4,
      actualHours: 2.5
    },
    {
      id: 'TK-002',
      title: 'Solicitud de suministros de limpieza',
      description: 'Necesitamos más suministros de limpieza industrial para las operaciones diarias',
      category: 'supply_request',
      priority: 'medium',
      status: 'pending',
      createdBy: 'Maria Cleaning',
      createdAt: '2025-01-27T08:15:00Z',
      updatedAt: '2025-01-27T08:15:00Z',
      comments: [],
      attachments: [],
      tags: ['limpieza', 'suministros'],
      estimatedHours: 1
    },
    {
      id: 'TK-003',
      title: 'Mantenimiento sistema de frenos TK-001',
      description: 'Mantenimiento programado para reemplazo del sistema de frenos',
      category: 'maintenance',
      priority: 'urgent',
      status: 'resolved',
      createdBy: 'Transport Supervisor',
      assignedTo: 'Maintenance Team',
      createdAt: '2025-01-26T14:00:00Z',
      updatedAt: '2025-01-27T11:00:00Z',
      comments: [
        {
          id: '3',
          author: 'Maintenance Team',
          content: 'Mantenimiento completado exitosamente. Sistema de frenos reemplazado completamente.',
          timestamp: '2025-01-27T11:00:00Z',
          isInternal: false
        }
      ],
      attachments: ['maintenance_report.pdf', 'before_after_photos.zip'],
      tags: ['mantenimiento', 'frenos', 'TK-001'],
      rating: 5,
      estimatedHours: 6,
      actualHours: 5.5
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'it_support': return 'bg-blue-100 text-blue-800';
      case 'supply_request': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'incident': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'it_support': return 'Soporte IT';
      case 'supply_request': return 'Solicitud Suministros';
      case 'maintenance': return 'Mantenimiento';
      case 'incident': return 'Incidente';
      default: return category;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelto';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus as any, updatedAt: new Date().toISOString() }
        : ticket
    ));
  };

  const handleAssignTicket = (ticketId: string, assignee: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, assignedTo: assignee, updatedAt: new Date().toISOString() }
        : ticket
    ));
  };

  const handleAddComment = (ticketId: string) => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Current User',
      content: newComment,
      timestamp: new Date().toISOString(),
      isInternal: false
    };

    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, comments: [...ticket.comments, comment], updatedAt: new Date().toISOString() }
        : ticket
    ));
    
    setNewComment('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSince = (dateString: string) => {
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

  // Kanban columns
  const columns = [
    { id: 'pending', title: 'Pendientes', tickets: filteredTickets.filter(t => t.status === 'pending') },
    { id: 'in_progress', title: 'En Progreso', tickets: filteredTickets.filter(t => t.status === 'in_progress') },
    { id: 'resolved', title: 'Resueltos', tickets: filteredTickets.filter(t => t.status === 'resolved') },
    { id: 'closed', title: 'Cerrados', tickets: filteredTickets.filter(t => t.status === 'closed') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('tickets.title')}</h2>
          <p className="text-gray-600">{t('tickets.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Lista
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('tickets.newTicket')}</span>
          </button>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('tickets.totalTickets')}</p>
              <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            </div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('tickets.pending')}</p>
              <p className="text-2xl font-bold text-gray-600">{tickets.filter(t => t.status === 'pending').length}</p>
            </div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('tickets.inProgress')}</p>
              <p className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'in_progress').length}</p>
            </div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('tickets.resolved')}</p>
              <p className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'resolved').length}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-purple-600">2.3h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar tickets por título, descripción o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En Progreso</option>
            <option value="resolved">Resueltos</option>
            <option value="closed">Cerrados</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas las Categorías</option>
            <option value="it_support">Soporte IT</option>
            <option value="supply_request">Solicitud Suministros</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="incident">Incidente</option>
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Kanban Board or List View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
          {columns.map((column) => (
            <div key={column.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
                  {column.tickets.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {column.tickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(ticket.priority)}`}></div>
                        <span className="text-sm font-medium text-gray-900">{ticket.id}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {ticket.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>

                    {/* Tags */}
                    {ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {ticket.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                        {ticket.tags.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{ticket.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{ticket.createdBy}</span>
                        </div>
                        {ticket.comments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{ticket.comments.length}</span>
                          </div>
                        )}
                        {ticket.attachments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="w-3 h-3" />
                            <span>{ticket.attachments.length}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{getTimeSince(ticket.createdAt)}</span>
                      </div>
                    </div>
                    
                    {ticket.assignedTo && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">{ticket.assignedTo.charAt(0)}</span>
                          </div>
                          <span>Asignado a {ticket.assignedTo}</span>
                        </div>
                      </div>
                    )}

                    {/* Progress indicator for estimated vs actual hours */}
                    {ticket.estimatedHours && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Tiempo: {ticket.actualHours || 0}h / {ticket.estimatedHours}h</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full" 
                              style={{ width: `${Math.min(((ticket.actualHours || 0) / ticket.estimatedHours) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {column.tickets.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      {getStatusIcon(column.id)}
                    </div>
                    <p className="text-sm text-gray-600">Sin tickets</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actualizado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${getPriorityColor(ticket.priority)}`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                          <div className="text-sm text-gray-600 max-w-xs truncate">{ticket.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(ticket.category)}`}>
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getPriorityLabel(ticket.priority)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{getStatusLabel(ticket.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.assignedTo || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeSince(ticket.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedTicket.id}</h3>
                  <p className="text-gray-600 mt-1">{selectedTicket.title}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedTicket.category)}`}>
                    {getCategoryLabel(selectedTicket.category)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusLabel(selectedTicket.status)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedTicket.priority)}`}></div>
                    <span className="text-sm">{getPriorityLabel(selectedTicket.priority)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Creado por</label>
                  <p className="mt-1 text-sm">{selectedTicket.createdBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asignado a</label>
                  <p className="mt-1 text-sm">{selectedTicket.assignedTo || 'Sin asignar'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Creado</label>
                  <p className="mt-1 text-sm">{formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>

              {/* Time tracking */}
              {selectedTicket.estimatedHours && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seguimiento de Tiempo</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        {selectedTicket.actualHours || 0}h / {selectedTicket.estimatedHours}h
                      </span>
                      <span className="text-sm text-gray-600">
                        {Math.round(((selectedTicket.actualHours || 0) / selectedTicket.estimatedHours) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(((selectedTicket.actualHours || 0) / selectedTicket.estimatedHours) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedTicket.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedTicket.description}</p>
              </div>

              {/* Attachments */}
              {selectedTicket.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntos</label>
                  <div className="space-y-2">
                    {selectedTicket.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{attachment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              {selectedTicket.rating && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-5 h-5 ${star <= selectedTicket.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({selectedTicket.rating}/5)</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
                
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Asignar</span>
                </button>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Comentarios ({selectedTicket.comments.length})</label>
                
                {/* Comment List */}
                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                  {selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">{comment.author.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">{getTimeSince(comment.timestamp)}</span>
                          {comment.isInternal && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Interno</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-600">U</span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Agregar un comentario..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleAddComment(selectedTicket.id)}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">{t('tickets.createNew')}</h3>
              <p className="text-gray-600 mt-1">{t('tickets.submitRequest')}</p>
            </div>
            
            <form className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('tickets.title_field')}</label>
                <input
                  type="text"
                  placeholder="Descripción breve del problema o solicitud"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('tickets.category')}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Seleccionar categoría</option>
                    <option value="it_support">Soporte IT</option>
                    <option value="supply_request">Solicitud Suministros</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="incident">Reporte de Incidente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('tickets.priority')}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo Estimado (horas)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="2.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                <input
                  type="text"
                  placeholder="red, almacén, urgente (separadas por comas)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('tickets.description')}</label>
                <textarea
                  rows={4}
                  placeholder="Proporciona información detallada sobre el problema o solicitud..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('tickets.attachments')}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Arrastra archivos aquí o haz clic para subir</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF hasta 10MB</p>
                  <input type="file" multiple className="hidden" />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Asignar Ticket</h3>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Asignar a:</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Seleccionar usuario</option>
                <option value="IT Support">IT Support</option>
                <option value="Maintenance Team">Equipo de Mantenimiento</option>
                <option value="Admin">Administrador</option>
                <option value="Transport Supervisor">Supervisor de Transporte</option>
              </select>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Handle assignment logic here
                  setShowAssignModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTicketSystem;