import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Clock } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import type { RequestStatus, StockRequest } from '../types';
import Navigation from '../components/Navigation';

export default function Requests() {
  const navigate = useNavigate();
  const { stockRequests, currentUser, deleteStockRequest, staff } = useApp();
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  const filteredRequests = stockRequests.filter(req => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  const canCreate = currentUser?.role === 'staff' || currentUser?.role === 'inventory_manager' || currentUser?.role === 'super_admin';
  const canDelete = currentUser?.role === 'super_admin';

  const getRequesterName = (request: StockRequest) => {
    if (request.requesterName) return request.requesterName;
    // Fallback: look up staff by requestingStaff ID
    const staffMember = staff.find(s => s.id === request.requestingStaff);
    return staffMember?.name || 'Unknown';
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      await deleteStockRequest(id);
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'completed':
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'approved':
      case 'ready_for_collection':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending_approval':
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Navigation />
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8 mt-14 lg:mt-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
              <p className="text-gray-600 text-sm">View and manage stock requests</p>
            </div>
            {canCreate && (
              <button
                onClick={() => navigate('/requests/new')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Request</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="issued">Issued</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredRequests.length} of {stockRequests.length} requests
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
              <p className="text-gray-600 mb-4">
                {statusFilter === 'all' 
                  ? 'No requests have been submitted yet.' 
                  : `No requests with status "${statusFilter.replace('_', ' ')}".`}
              </p>
              {canCreate && (
                <button
                  onClick={() => navigate('/requests/new')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create New Request
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{request.requestNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getRequesterName(request)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {request.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.items.length} item(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {/* TODO: Add view details modal */}}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Details
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(request.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
