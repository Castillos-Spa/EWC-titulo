import React, { useState } from 'react';
import { Plus, Search, Calendar, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface CleaningReport {
  id: string;
  date: string;
  area: string;
  tasks: string[];
  responsibleStaff: string;
  timeSpent: number;
  issues: string[];
  status: 'completed' | 'partial' | 'pending';
  observations: string;
}

const CleaningReports: React.FC = () => {
  const [reports] = useState<CleaningReport[]>([
    {
      id: '1',
      date: '2025-01-27',
      area: 'Warehouse A - Main Floor',
      tasks: ['Floor mopping', 'Window cleaning', 'Trash collection', 'Restroom sanitization'],
      responsibleStaff: 'Maria Cleaning',
      timeSpent: 4.5,
      issues: ['Broken window in section C'],
      status: 'completed',
      observations: 'Area cleaned thoroughly, found broken window that needs repair'
    },
    {
      id: '2',
      date: '2025-01-27',
      area: 'Office Building - 2nd Floor',
      tasks: ['Desk cleaning', 'Vacuum carpets', 'Kitchen area', 'Meeting rooms'],
      responsibleStaff: 'Ana Rodriguez',
      timeSpent: 3.0,
      issues: [],
      status: 'completed',
      observations: 'All areas completed as scheduled'
    },
    {
      id: '3',
      date: '2025-01-27',
      area: 'Parking Lot - External Areas',
      tasks: ['Sweeping', 'Litter collection', 'Drain cleaning'],
      responsibleStaff: 'Carlos Maintenance',
      timeSpent: 2.0,
      issues: ['Clogged drain in section B'],
      status: 'partial',
      observations: 'Weather prevented complete cleaning of external areas'
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'partial': return <AlertTriangle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredReports = reports.filter(report =>
    report.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.responsibleStaff.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cleaning Reports</h2>
          <p className="text-gray-600">Daily cleaning activities and maintenance reports</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Report</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'completed').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hours Worked</p>
              <p className="text-2xl font-bold text-blue-600">{reports.reduce((sum, r) => sum + r.timeSpent, 0)}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Issues Found</p>
              <p className="text-2xl font-bold text-yellow-600">{reports.reduce((sum, r) => sum + r.issues.length, 0)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by area or staff member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.area}</h3>
                      <p className="text-sm text-gray-600">Report #{report.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span className="capitalize">{report.status}</span>
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{report.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Time Spent:</span>
                    <span className="font-medium">{report.timeSpent}h</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Staff:</span>
                    <span className="font-medium">{report.responsibleStaff}</span>
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Completed Tasks:</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.tasks.map((task, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {task}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                {report.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>Issues Found:</span>
                    </h4>
                    <div className="space-y-1">
                      {report.issues.map((issue, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observations */}
                {report.observations && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Observations:</h4>
                    <p className="text-sm text-gray-600">{report.observations}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  View Details
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-600">Try adjusting your search or create a new cleaning report.</p>
        </div>
      )}

      {/* New Report Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">New Cleaning Report</h3>
              <p className="text-gray-600 mt-1">Record daily cleaning activities and any issues found</p>
            </div>
            
            <form className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Spent (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="4.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area/Location</label>
                <input
                  type="text"
                  placeholder="Warehouse A - Main Floor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Responsible Staff</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Select staff member</option>
                  <option>Maria Cleaning</option>
                  <option>Ana Rodriguez</option>
                  <option>Carlos Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tasks Completed</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Floor mopping', 'Window cleaning', 'Trash collection', 'Restroom sanitization', 'Desk cleaning', 'Vacuum carpets', 'Kitchen area', 'Meeting rooms'].map((task) => (
                    <label key={task} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">{task}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issues Found</label>
                <textarea
                  rows={3}
                  placeholder="Describe any issues or problems encountered during cleaning..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observations</label>
                <textarea
                  rows={3}
                  placeholder="Additional observations or notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="completed">Completed</option>
                  <option value="partial">Partially Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningReports;