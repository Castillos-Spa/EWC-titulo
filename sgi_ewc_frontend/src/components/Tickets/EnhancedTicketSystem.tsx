import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, User, AlertCircle, CheckCircle, Clock, Eye, UserPlus, Paperclip, ThumbsUp, ThumbsDown, Send } from 'lucide-react'; // NOSONAR
import { getTickets, createTicket, updateTicket, CreateTicketPayload, approveTicketStep } from '../../utils/ticketApi'; // NOSONAR
import { getUsers } from '../../utils/userApi'; // Assuming getUsers is in userApi
import { Ticket, TicketStatus, TicketPriority } from '../../types/Ticket'; // NOSONAR
import { User as AppUser } from '../../types/User';

// 1. Importa tu hook de autenticación desde su ubicación correcta
import { useAuth } from '../../contexts/AuthContext';
// Esto debería venir idealmente de una carpeta de tipos compartida
const TICKET_CATEGORIES = ['Soporte IT', 'Solicitud Suministro', 'Mantenimiento', 'Reporte Incidente'];
const RECIPIENT_AREAS = ['IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanza', 'P_Riesgo'];


const EnhancedTicketSystem: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false); // NOSONAR
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [approvalComment, setApprovalComment] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    description: '',
    category: TICKET_CATEGORIES[0],
    priority: TicketPriority.Media,
    recipientArea: [] as string[], // Ahora es un array
    tags: '',
    // attachments: null, // Para futura implementación de archivos
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getTickets();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los tickets. Por favor, inténtelo de nuevo más tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error al cargar los usuarios:', err);
      // Opcional: mostrar un error al usuario
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'IT': return 'bg-blue-100 text-blue-800';
      case 'Transporte': return 'bg-yellow-100 text-yellow-800';
      case 'Obras': case 'Aseo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TicketPriority.Urgente: return 'bg-red-500';
      case TicketPriority.Alta: return 'bg-orange-500';
      case TicketPriority.Media: return 'bg-yellow-500';
      case TicketPriority.Baja: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case TicketStatus.Pendiente: return <Clock className="w-4 h-4" />;
      case TicketStatus.EnProgreso: return <AlertCircle className="w-4 h-4" />;
      case TicketStatus.Resuelto: return <CheckCircle className="w-4 h-4" />;
      case TicketStatus.Cerrado: return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TicketStatus.Pendiente: return 'bg-gray-100 text-gray-800';
      case TicketStatus.EnProgreso: return 'bg-blue-100 text-blue-800';
      case TicketStatus.Resuelto: return 'bg-green-100 text-green-800';
      case TicketStatus.Cerrado: return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace('_', ' ');
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case TicketPriority.Urgente: return 'Urgente';
      case TicketPriority.Alta: return 'Alta';
      case TicketPriority.Media: return 'Media';
      case TicketPriority.Baja: return 'Baja';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case TicketStatus.Pendiente: return 'Pendiente';
      case TicketStatus.EnProgreso: return 'En Progreso';
      case TicketStatus.Resuelto: return 'Resuelto';
      case TicketStatus.Cerrado: return 'Cerrado';
      default: return status;
    }
  };

  // --- IMPLEMENTACIÓN DINÁMICA ---
  // 2. Obtenemos el usuario del contexto de autenticación
  const { user } = useAuth(); // Esto obtiene el usuario que ha iniciado sesión

  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         String(ticket.id).includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority;
  
    if (!user) return false; // Si no hay usuario, no mostrar tickets

    // Lógica de Relevancia Mejorada
    const isCreator = ticket.createdBy?.id === user.id;
    const isAssigned = ticket.assignedTo?.id === user.id;
    const isRecipient = (ticket.recipientArea ?? []).some((area: string) => user.areas.includes(area));

    // El usuario es un aprobador pendiente en el flujo del ticket
    const isPendingApprover = (ticket.approvals ?? []).some(approval =>
      approval.status === 'Pendiente' &&
      user.roles.includes(approval.approverRole) &&
      user.areas.includes(approval.approverArea)
    );

    // Un supervisor o jefe puede ver todos los tickets creados por usuarios de su misma área.
    const canSupervise = (user.roles.includes('Supervisor') || user.roles.includes('Jefe')) &&
      (ticket.createdBy?.roleAssignments ?? []).some(assignment => user.areas.includes(assignment.area));

    const isRelevant = user.isAdmin || isCreator || isAssigned || isRecipient || isPendingApprover || canSupervise;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority && isRelevant;
  });

  const handleStatusChange = async (ticketId: number, newStatus: TicketStatus) => {
    try {
      const updated = await updateTicket(ticketId, { status: newStatus });
      setTickets(tickets.map((t: Ticket) => (t.id === ticketId ? { ...t, ...updated } : t)));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, ...updated });
 }
    } catch (error) {
      console.error("Error al actualizar el estado del ticket:", error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.title || !newTicketForm.category) {
      alert('El título y la categoría son obligatorios.');
      return;
    }
    
    try {
      const payload: CreateTicketPayload = { // NOSONAR
        title: newTicketForm.title,
        description: newTicketForm.description,
        category: newTicketForm.category,
        priority: newTicketForm.priority,
        tags: newTicketForm.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag),
      };

      // Solo incluir recipientArea si la categoría no es "Solicitud Suministro"
      if (newTicketForm.category !== 'Solicitud Suministro') {
        payload.recipientArea = newTicketForm.recipientArea;
      }

      await createTicket(payload); // NOSONAR

      setShowForm(false);
      setNewTicketForm({
        title: '',
        description: '',
        category: TICKET_CATEGORIES[0],
        priority: TicketPriority.Media,
        recipientArea: [],
        tags: '',
      });
      fetchTickets(); // Refetch tickets to show the new one
    } catch (error) {
      console.error("Error al crear el ticket:", error);
      alert('No se pudo crear el ticket.');
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket || !assigneeId) {
      alert('Por favor, selecciona un usuario para asignar el ticket.');
      return;
    }

    try {
      const payload = {
        assignedToId: parseInt(assigneeId, 10),
        status: TicketStatus.EnProgreso, // Cambia automáticamente el estado
      };
      const updated = await updateTicket(selectedTicket.id, payload);

      // Actualizar estado local
      setTickets(tickets.map((t: Ticket) => (t.id === updated.id ? updated : t)));
      setSelectedTicket(updated);
      setShowAssignModal(false);
      setAssigneeId('');
    } catch (error) {
      console.error("Error al asignar el ticket:", error);
      alert('No se pudo asignar el ticket.');
    }
  };

  const handleApprovalAction = async (approvalId: number, approved: boolean) => {
    if (!selectedTicket) return;

    try {
      const updatedTicket = await approveTicketStep(selectedTicket.id, approvalId, {
        approved,
        comments: approvalComment,
      });
      
      // Actualizar el estado local
      setTickets(tickets.map((t: Ticket) => (t.id === updatedTicket.id ? updatedTicket : t)));
      setSelectedTicket(updatedTicket);
      setApprovalComment(''); // Limpiar comentario

    } catch (error) {
      console.error('Error al procesar la aprobación:', error);
      // Idealmente, mostrar un toast o alerta más amigable
      alert(`Error: ${error instanceof Error ? error.message : 'No se pudo procesar la acción.'}`);
    }
  };


  const handleConfirmationChange = async (type: 'assigned' | 'requesting', isChecked: boolean) => {
    if (!selectedTicket) return;

    const payload: Partial<Ticket> = {};
    if (type === 'assigned') {
      payload.assignedUserConfirmation = isChecked;
    } else if (type === 'requesting') {
      payload.requestingUserConfirmation = isChecked;
    }

    try {
      const updated = await updateTicket(selectedTicket.id, payload);
      setTickets(tickets.map((t: Ticket) => (t.id === updated.id ? updated : t)));
      setSelectedTicket(updated);
    } catch (error) {
      console.error('Error al actualizar la confirmación:', error);
      alert('No se pudo actualizar la confirmación.');
    }
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
    const diffDays = Math.floor(diffHours / 24); // NOSONAR
    
    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Ahora mismo';
    }
  };

  // Kanban columns
  const columns = Object.values(TicketStatus).map(status => ({
    id: status,
    title: getStatusLabel(status),
    tickets: filteredTickets.filter((t: Ticket) => t.status === status),
  }));

  // Usuarios filtrados para el modal de asignación
  const assignableUsers = users.filter((user: AppUser) =>
    (selectedTicket?.recipientArea ?? []).some((ticketArea: string) =>
      (user.roleAssignments ?? []).some(assignment => assignment.area === ticketArea && assignment.isActive) // Assuming roleAssignments has { area: string, isActive: boolean }
    )
  );


  if (loading) {
    return <div>Cargando tickets...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Tickets</h2>
          <p className="text-gray-600">Gestiona solicitudes de soporte y seguimiento de tareas</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex p-1 bg-gray-100 rounded-lg">
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
            className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ticket</span>
          </button>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTickets.length}</p>
            </div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{getStatusLabel(TicketStatus.Pendiente)}</p>
              <p className="text-2xl font-bold text-gray-600">{tickets.filter((t: Ticket) => t.status === TicketStatus.Pendiente).length}</p>
            </div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{getStatusLabel(TicketStatus.EnProgreso)}</p>
              <p className="text-2xl font-bold text-blue-600">{tickets.filter((t: Ticket) => t.status === TicketStatus.EnProgreso).length}</p>
            </div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{getStatusLabel(TicketStatus.Resuelto)}</p>
              <p className="text-2xl font-bold text-green-600">{tickets.filter((t: Ticket) => t.status === TicketStatus.Resuelto).length}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
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
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Buscar tickets por título, descripción o ID..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los Estados</option>
            {Object.values(TicketStatus).map(status => (
              <option key={status} value={status}>{getStatusLabel(status as TicketStatus)}</option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas las Categorías</option>
            {TICKET_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas las Prioridades</option>
            {Object.values(TicketPriority).map(prio => (
              <option key={prio} value={prio}>{getPriorityLabel(prio)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board or List View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
          {columns.map((column) => (
            <div key={column.id} className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="px-2 py-1 text-sm text-gray-700 bg-gray-200 rounded-full">
                  {column.tickets.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {column.tickets.map((ticket: Ticket) => (
                  <button
                    key={ticket.id} 
                    className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md"
                    onClick={() => setSelectedTicket(ticket)}
                    type="button"
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
                    
                    <h4 className="mb-2 font-medium text-gray-900 line-clamp-2">
                      {ticket.title}
                    </h4>
                    
                    <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                      {ticket.description}
                    </p>

                    {/* Tags */}
                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ticket.tags.slice(0, 3).map((tag: string) => (
                          <span key={`${ticket.id}-${tag}`} className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{ticket.createdBy?.username || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{getTimeSince(ticket.createdAt)}</span>
                      </div>
                    </div>
                    
                    {ticket.assignedTo && (
                      <div className="pt-2 mt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <div className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full">
                            <span className="font-medium text-blue-600">{ticket.assignedTo.username.charAt(0)}</span>
                          </div>
                          <span>Asignado a {ticket.assignedTo.username}</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
                
                {column.tickets.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full">
                      {getStatusIcon(column.id as TicketStatus)}
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
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Asignado
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Actualizado
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket: Ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${getPriorityColor(ticket.priority)}`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                          <div className="max-w-xs text-sm text-gray-600 truncate">{ticket.title}</div>
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
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {ticket.assignedTo?.username || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {getTimeSince(ticket.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="mr-3 text-blue-600 hover:text-blue-900"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedTicket.id}</h3>
                  <p className="mt-1 text-gray-600">{selectedTicket.title}</p>
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
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="block text-sm font-medium text-gray-700">Prioridad</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedTicket.priority)}`}></div>
                    <span id="ticket-priority" className="text-sm">{getPriorityLabel(selectedTicket.priority)}</span>
                  </div>
                </div>
                <div>
                  <p className="block text-sm font-medium text-gray-700">Creado por</p>
 <p className="mt-1 text-sm">{selectedTicket.createdBy?.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="block text-sm font-medium text-gray-700">Asignado a</p>
                  <p className="mt-1 text-sm">{selectedTicket.assignedTo?.username || 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="block text-sm font-medium text-gray-700">Creado</p>
                  <p className="mt-1 text-sm">{formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="ticket-description" className="block mb-2 text-sm font-medium text-gray-700">Descripción</label>
                <p id="ticket-description" className="p-4 text-gray-600 rounded-lg bg-gray-50">{selectedTicket.description}</p>
              </div>

              {/* Status and Assign Actions */}
              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedTicket.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(selectedTicket.id, e.target.value as TicketStatus)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.values(TicketStatus).map(status => (
                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center px-4 py-2 space-x-2 text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Asignar</span>
                </button>
              </div>

              {/* Confirmation Workflow */}
              {selectedTicket.assignedTo && (
                <div className="p-4 border-t border-b border-gray-200 bg-gray-50">
                  <h4 className="mb-4 text-sm font-semibold text-gray-800">Flujo de Confirmación</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="assigned-confirm"
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                        checked={!!selectedTicket.assignedUserConfirmation}
                        disabled={user?.id !== selectedTicket.assignedTo?.id}
                        onChange={(e) => handleConfirmationChange('assigned', e.target.checked)}
                      />
                      <label htmlFor="assigned-confirm" className="ml-3 text-sm text-gray-700">
                        Confirmación de resolución por parte del asignado ({selectedTicket.assignedTo?.username})
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="requester-confirm"
                        type="checkbox"
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                        checked={!!selectedTicket.requestingUserConfirmation}
                        disabled={!selectedTicket.assignedUserConfirmation || user?.id !== selectedTicket.createdBy?.id}
                        onChange={(e) => handleConfirmationChange('requesting', e.target.checked)}
                      />
                      <label htmlFor="requester-confirm" className="ml-3 text-sm text-gray-700">
                        Confirmación de conformidad por parte del solicitante ({selectedTicket.createdBy?.username})
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* NUEVO: Flujo de Aprobación para Solicitudes de Suministro */}
              {selectedTicket.category === 'Solicitud_Suministro' && selectedTicket.approvals && selectedTicket.approvals.length > 0 && (
                <div className="p-4 border-t border-b border-gray-200 bg-gray-50">
                  <h4 className="mb-4 text-sm font-semibold text-gray-800">Flujo de Aprobación de Suministro</h4>
                  <div className="space-y-4">
                    {selectedTicket.approvals.map((approval, index) => {
                      const canApprove = user?.roles.includes(approval.approverRole) && user?.areas.includes(approval.approverArea);
                      const isPending = approval.status === 'Pendiente';
                      // Un usuario puede aprobar si es su turno (o un paso anterior fue aprobado) y tiene el rol/área correctos.
                      const isMyTurn = isPending && (index === 0 || selectedTicket.approvals[index - 1].status === 'Aprobado');

                      return (
                        <div key={approval.id} className="p-3 bg-white border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {approval.status === 'Aprobado' && <CheckCircle className="w-5 h-5 mr-2 text-green-500" />}
                              {approval.status === 'Rechazado' && <ThumbsDown className="w-5 h-5 mr-2 text-red-500" />}
                              {approval.status === 'Pendiente' && <Clock className="w-5 h-5 mr-2 text-yellow-500" />}
                              <p className="text-sm font-medium">
                                Paso {approval.step}: {approval.approverRole} de {approval.approverArea}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              approval.status === 'Aprobado' ? 'bg-green-100 text-green-800' :
                              approval.status === 'Rechazado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {approval.status}
                            </span>
                          </div>
                          {approval.approvedBy && (
                            <p className="mt-1 text-xs text-gray-500">
                              Por: {approval.approvedBy.username} el {formatDate(approval.approvedAt!)}
                            </p>
                          )}
                          {canApprove && isMyTurn && (
                            <div className="flex items-center mt-3 space-x-2">
                              <input type="text" placeholder="Comentario (opcional)..." value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} className="flex-grow px-2 py-1 text-sm border rounded"/>
                              <button onClick={() => handleApprovalAction(approval.id, true)} className="p-2 text-white bg-green-500 rounded-full hover:bg-green-600"><ThumbsUp className="w-4 h-4" /></button>
                              <button onClick={() => handleApprovalAction(approval.id, false)} className="p-2 text-white bg-red-500 rounded-full hover:bg-red-600"><ThumbsDown className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* Comments */}
              <div>
                <p className="block mb-4 text-sm font-medium text-gray-700">Comentarios</p>
                <p className="text-sm text-gray-500">La funcionalidad de comentarios se implementará próximamente.</p>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Crear Nuevo Ticket</h3>
              <p className="mt-1 text-gray-600">Envía una nueva solicitud de soporte o ticket</p>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleCreateTicket}>
              <div>
                <label htmlFor="new-ticket-title" className="block mb-2 text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  placeholder="Descripción breve del problema o solicitud"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newTicketForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                  required
                  id="new-ticket-title"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="new-ticket-category" className="block mb-2 text-sm font-medium text-gray-700">Categoría</label>
                  <select id="new-ticket-category"
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTicketForm.category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                    required
                  >
                    <option value="" disabled>Seleccionar categoría</option>
                    {TICKET_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-ticket-priority" className="block mb-2 text-sm font-medium text-gray-700">Prioridad</label>
                  <select id="new-ticket-priority"
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTicketForm.priority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTicketForm({ ...newTicketForm, priority: e.target.value as TicketPriority })}
                  >
                    {Object.values(TicketPriority).map(prio => (
                      <option key={prio} value={prio}>{getPriorityLabel(prio)}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Ocultar Área Destino si la categoría es Solicitud de Suministro */}
              {newTicketForm.category !== 'Solicitud Suministro' && (
                <div>
                  <label htmlFor="new-ticket-recipient" className="block mb-2 text-sm font-medium text-gray-700">Área Destino</label>
                  <select id="new-ticket-recipient"
                    multiple
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTicketForm.recipientArea}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTicketForm({ 
                      ...newTicketForm, 
                      recipientArea: Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value) 
                    })}
                    required
                  >
                    {RECIPIENT_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="new-ticket-description" className="block mb-2 text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  rows={4}
                  placeholder="Proporciona información detallada sobre el problema o solicitud..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newTicketForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  id="new-ticket-description"
                ></textarea>
              </div>

              <div>
                <label htmlFor="new-ticket-tags" className="block mb-2 text-sm font-medium text-gray-700">Etiquetas</label>
                <input
                  id="new-ticket-tags"
                  type="text"
                  placeholder="ej: urgente, red, almacen (separadas por comas)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newTicketForm.tags}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTicketForm({ ...newTicketForm, tags: e.target.value })}
                />
              </div>

              <div>
                <p className="block mb-2 text-sm font-medium text-gray-700">Archivos Adjuntos</p>
                <div className="p-6 text-center transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Arrastra archivos o haz clic para subir</p>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF hasta 10MB</p>
                  <input type="file" multiple className="hidden" />
                  <p className="mt-2 text-xs text-yellow-600">(Funcionalidad en desarrollo)</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Asignar Ticket</h3>
            </div>
            
            <div className="p-6">
              <label htmlFor="assign-user" className="block mb-2 text-sm font-medium text-gray-700">
                Asignar a (Área: {selectedTicket?.recipientArea.join(', ') || 'N/A'}):
              </label>
              <select 
                id="assign-user" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={assigneeId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAssigneeId(e.target.value)}
              >
                <option value="">Seleccionar usuario...</option>
                {assignableUsers.length > 0 ? (
                  assignableUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))
                ) : (
                  <option disabled>No hay usuarios en el área de destino</option>
                )}
              </select>
            </div>

            <div className="flex justify-end p-6 space-x-3 border-t border-gray-200">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleAssignTicket} className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
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