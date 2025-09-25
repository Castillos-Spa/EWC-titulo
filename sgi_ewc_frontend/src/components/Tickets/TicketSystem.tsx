import React, { useState, useEffect } from 'react';
import { getTickets } from '../../utils/ticketApi';
import { Plus, Search, MessageSquare, Paperclip, Calendar, User, AlertCircle, CheckCircle, Clock } from 'lucide-react';

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
  comments: number;
  attachments: number;
}


const TicketSystem: React.FC = () => {

  const [tickets] = useState<Ticket[]>([
    {
      id: 'TK-001',
      title: 'Network connectivity issues in warehouse',
      description: 'Unable to connect to the company network from warehouse terminals',
      category: 'it_support',
      priority: 'high',
      status: 'in_progress',
      createdBy: 'John Driver',
      assignedTo: 'IT Support',
      createdAt: '2025-01-27T09:00:00Z',
      updatedAt: '2025-01-27T10:30:00Z',
      comments: 3,
      attachments: 1
    },
    {
      status: 'pending',
      createdBy: 'Maria Cleaning',
      createdAt: '2025-01-27T08:15:00Z',
      updatedAt: '2025-01-27T08:15:00Z',
      comments: 0,
      attachments: 0
    },
    {
      category: 'maintenance',
      status: 'resolved',
      createdBy: 'Transport Supervisor',
      assignedTo: 'Maintenance Team',
      createdAt: '2025-01-26T14:00:00Z',
      updatedAt: '2025-01-27T11:00:00Z',
      comments: 5,
      attachments: 2
    },
    {
      category: 'incident',
      status: 'in_progress',
      createdBy: 'Carlos Rodriguez',
      assignedTo: 'Transport Supervisor',
      createdAt: '2025-01-26T16:30:00Z',
      updatedAt: '2025-01-27T09:45:00Z',
      comments: 2,
      attachments: 3
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

    const [newTickets, setNewTickets] = useState<Ticket[]>([]);


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

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'pending': return 'bg-gray-100 text-gray-800';
  //     case 'in_progress': return 'bg-blue-100 text-blue-800';
  //     case 'resolved': return 'bg-green-100 text-green-800';
  //     case 'closed': return 'bg-gray-100 text-gray-600';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'it_support': return 'IT Support';
      case 'supply_request': return 'Supply Request';
      case 'maintenance': return 'Maintenance';
      case 'incident': return 'Incident';
      default: return category;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
    });
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const tickets = await getTickets();
                console.log('Fetched tickets:', tickets);
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
            }
        };
        fetchTickets();
    }, []);

  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // };

  // Kanban columns
  const columns = [
    { id: 'pending', title: 'Pending', tickets: filteredTickets.filter(t => t.status === 'pending') },
    { id: 'in_progress', title: 'In Progress', tickets: filteredTickets.filter(t => t.status === 'in_progress') },
    { id: 'resolved', title: 'Resolved', tickets: filteredTickets.filter(t => t.status === 'resolved') },
    { id: 'closed', title: 'Closed', tickets: filteredTickets.filter(t => t.status === 'closed') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ticket System</h2>
          <p className="text-gray-600">Manage support tickets and requests across all areas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            </div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{tickets.filter(t => t.status === 'pending').length}</p>
            </div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{tickets.filter(t => t.status === 'in_progress').length}</p>
            </div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{tickets.filter(t => t.status === 'resolved').length}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
              placeholder="Search tickets by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="it_support">IT Support</option>
            <option value="supply_request">Supply Request</option>
            <option value="maintenance">Maintenance</option>
            <option value="incident">Incident</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
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
              {column.tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md">
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
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{ticket.createdBy}</span>
                      </div>
                      {ticket.comments > 0 && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{ticket.comments}</span>
                        </div>
                      )}
                      {ticket.attachments > 0 && (
                        <div className="flex items-center space-x-1">
                          <Paperclip className="w-3 h-3" />
                          <span>{ticket.attachments}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {ticket.assignedTo && (
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <div className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full">
                          <span className="font-medium text-blue-600">{ticket.assignedTo.charAt(0)}</span>
                        </div>
                        <span>Assigned to {ticket.assignedTo}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {column.tickets.length === 0 && (
                <div className="py-8 text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full">
                    {getStatusIcon(column.id)}
                  </div>
                  <p className="text-sm text-gray-600">No tickets</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Ticket Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Create New Ticket</h3>
              <p className="mt-1 text-gray-600">Submit a new support ticket or request</p>
            </div>
            
            <form className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  placeholder="Brief description of the issue or request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select category</option>
                    <option value="it_support">IT Support</option>
                    <option value="supply_request">Supply Request</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="incident">Incident Report</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed information about the issue or request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Attachments</label>
                <div className="p-6 text-center transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Drop files here or click to upload</p>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  <input type="file" multiple className="hidden" />
                </div>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



export default TicketSystem;