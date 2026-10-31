import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Check, X, Clock, Package, AlertTriangle, User, Calendar } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import type { RequestStatus } from '../types';
import Navigation from '../components/Navigation';

export default function Approvals() {
  const navigate = useNavigate();
  const { stockRequests, currentUser, staff, updateStockRequest } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [itemApprovals, setItemApprovals] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const canApprove = currentUser?.role === 'manager';

  const filteredRequests = stockRequests.filter(req => {
    if (statusFilter === 'pending') return req.status === 'submitted' || req.status === 'pending_approval';
    if (statusFilter === 'approved') return req.status === 'approved' || req.status === 'partially_approved' || req.status === 'ready_for_collection' || req.status === 'issued' || req.status === 'completed';
    if (statusFilter === 'rejected') return req.status === 'rejected';
    return true;
  });

  const selectedRequestData = selectedRequest ? stockRequests.find(req => req.id === selectedRequest) : null;

  const handleApproveAll = () => {
    if (!selectedRequestData) return;

    updateStockRequest(selectedRequestData.id, {
      status: 'approved',
      items: selectedRequestData.items.map(item => ({
        ...item,
        approvedQuantity: item.requestedQuantity,
        status: 'approved' as RequestStatus,
      })),
    });

    setSelectedRequest(null);
    setApprovalComments('');
    setRejectionReason('');
    setItemApprovals({});
  };

  const handleApproveSelected = () => {
    if (!selectedRequestData) return;

    const updatedItems = selectedRequestData.items.map(item => ({
      ...item,
      approvedQuantity: itemApprovals[item.itemId] || item.requestedQuantity,
      status: (itemApprovals[item.itemId] || item.requestedQuantity) > 0 ? 'approved' as RequestStatus : 'rejected' as RequestStatus,
    }));

    const hasApprovedItems = updatedItems.some(item => item.status === 'approved');
    const hasRejectedItems = updatedItems.some(item => item.status === 'rejected');

    updateStockRequest(selectedRequestData.id, {
      status: hasApprovedItems && hasRejectedItems ? 'partially_approved' : hasApprovedItems ? 'approved' : 'rejected',
      items: updatedItems,
    });

    setSelectedRequest(null);
    setApprovalComments('');
    setRejectionReason('');
    setItemApprovals({});
  };

  const handleReject = () => {
    if (!selectedRequestData || !rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    updateStockRequest(selectedRequestData.id, {
      status: 'rejected',
      items: selectedRequestData.items.map(item => ({
        ...item,
        status: 'rejected' as RequestStatus,
      })),
    });

    setSelectedRequest(null);
    setApprovalComments('');
    setRejectionReason('');
    setItemApprovals({});
  };

  const getItemApprovalStatus = (item: any) => {
    const approvedQty = itemApprovals[item.itemId] ?? item.approvedQuantity ?? item.requestedQuantity;
    if (approvedQty === 0) return 'rejected';
    if (approvedQty < item.requestedQuantity) return 'partial';
    return 'approved';
  };

  if (!canApprove) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to approve requests</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Navigation />
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8 mt-14 lg:mt-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
              <p className="text-gray-600 text-sm">Review and approve stock requests</p>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Status Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stockRequests.filter(req => req.status === 'submitted' || req.status === 'pending_approval').length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved ({stockRequests.filter(req => req.status === 'approved' || req.status === 'partially_approved' || req.status === 'ready_for_collection' || req.status === 'issued' || req.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({stockRequests.filter(req => req.status === 'rejected').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stockRequests.length})
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h2>
            <p className="text-gray-600">There are no requests with the selected status.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Request List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requests ({filteredRequests.length})</h2>
              {filteredRequests.map((request) => {
                const requester = staff.find(s => s.id === request.requestingStaff);
                return (
                  <button
                    key={request.id}
                    onClick={() => {
                      setSelectedRequest(request.id);
                      setItemApprovals({});
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition ${
                      selectedRequest === request.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-gray-900">{request.requestNumber}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.priority === 'high' ? 'bg-red-100 text-red-800' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.priority}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        {requester?.name || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(request.requiredDate)}
                      </div>
                      <div className="text-gray-600">{request.items.length} item(s)</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Request Details */}
            <div className="lg:col-span-2">
              {selectedRequestData ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedRequestData.requestNumber}</h2>
                      <p className="text-gray-600 text-sm mt-1">Status: {selectedRequestData.status.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Requester Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Requester Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">{staff.find(s => s.id === selectedRequestData.requestingStaff)?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="ml-2 font-medium">{selectedRequestData.employeeId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Department:</span>
                        <span className="ml-2 font-medium">{selectedRequestData.department}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Required Date:</span>
                        <span className="ml-2 font-medium">{formatDate(selectedRequestData.requiredDate)}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-gray-600">Purpose:</span>
                      <span className="ml-2 font-medium">{selectedRequestData.purpose}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Items Requested</h3>
                    <div className="space-y-3">
                      {selectedRequestData.items.map((item, index) => {
                        const status = getItemApprovalStatus(item);
                        const approvedQty = itemApprovals[item.itemId] ?? item.approvedQuantity ?? item.requestedQuantity;
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{item.itemName}</p>
                                  <p className="text-sm text-gray-600">
                                    Requested: {item.requestedQuantity} | Available: {item.availableStock}
                                  </p>
                                </div>
                              </div>
                              {item.requestedQuantity > item.availableStock && (
                                <div className="flex items-center gap-1 text-yellow-600 text-sm">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>Insufficient Stock</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Approved Quantity
                                </label>
                                <input
                                  type="number"
                                  value={approvedQty}
                                  onChange={(e) => setItemApprovals({
                                    ...itemApprovals,
                                    [item.itemId]: Number(e.target.value),
                                  })}
                                  min="0"
                                  max={item.requestedQuantity}
                                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                status === 'approved' ? 'bg-green-100 text-green-800' :
                                status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approval Comments</label>
                    <textarea
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Add any comments about this approval..."
                    />
                  </div>

                  {/* Rejection Reason */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Provide a reason for rejection..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleApproveAll}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      <Check className="w-5 h-5" />
                      Approve All
                    </button>
                    <button
                      onClick={handleApproveSelected}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      <Check className="w-5 h-5" />
                      Approve Selected
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      <X className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Request</h3>
                  <p className="text-gray-600">Choose a request from the list to review and approve.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
