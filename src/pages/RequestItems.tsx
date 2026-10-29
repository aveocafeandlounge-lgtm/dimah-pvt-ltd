import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, ArrowLeft, Check, Package, AlertTriangle, Clock } from 'lucide-react';
import { generateId, formatDate } from '../utils/helpers';
import type { StockRequest, StockRequestItem } from '../types';

interface RequestItem {
  itemId: string;
  itemName: string;
  availableStock: number;
  requestedQuantity: number;
}

export default function RequestItems() {
  const navigate = useNavigate();
  const { inventoryItems, stockRequests, currentUser, staff, addStockRequest, updateStockRequest, deleteStockRequest } = useApp();
  const [requiredDate, setRequiredDate] = useState(formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmployeeId, setRequesterEmployeeId] = useState('');
  const [requesterDepartment, setRequesterDepartment] = useState('');
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'new'>('list');
  const [editingRequest, setEditingRequest] = useState<StockRequest | null>(null);

  // Find staff record for logged-in user
  const currentStaff = staff.find(s => s.employeeId === currentUser?.employeeId);

  // Auto-fill requester information from logged-in user's staff record
  useEffect(() => {
    if (currentStaff) {
      setRequesterName(currentStaff.name);
      setRequesterEmployeeId(currentStaff.employeeId);
      setRequesterDepartment(currentStaff.department);
    } else if (currentUser) {
      // Fallback to user data if no staff record found
      setRequesterName(currentUser.name);
      setRequesterEmployeeId(currentUser.employeeId || '');
      setRequesterDepartment(currentUser.department || '');
    }
  }, [currentStaff, currentUser]);

  const addItem = () => {
    setRequestItems([
      ...requestItems,
      {
        itemId: '',
        itemName: '',
        availableStock: 0,
        requestedQuantity: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RequestItem, value: string | number) => {
    const updated = [...requestItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill item details when item is selected
    if (field === 'itemId') {
      const item = inventoryItems.find(i => i.id === value);
      if (item) {
        updated[index].itemName = item.name;
        updated[index].availableStock = item.currentStock;
      }
    }

    setRequestItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (requestItems.length === 0) {
      alert('Please add at least one item to your request');
      return;
    }

    if (!purpose) {
      alert('Please specify the purpose of this request');
      return;
    }

    if (!requesterName || !requesterEmployeeId || !requesterDepartment) {
      alert('Please fill in all requester information fields');
      return;
    }

    // Check for insufficient stock
    const insufficientStock = requestItems.filter(item => item.requestedQuantity > item.availableStock);
    if (insufficientStock.length > 0) {
      const items = insufficientStock.map(i => `${i.itemName} (requested: ${i.requestedQuantity}, available: ${i.availableStock})`).join(', ');
      alert(`Warning: The following items have insufficient stock: ${items}. You may still submit, but approval may be delayed.`);
    }

    if (editingRequest) {
      // Update existing request
      updateStockRequest(editingRequest.id, {
        requiredDate: new Date(requiredDate),
        items: requestItems.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          availableStock: item.availableStock,
          requestedQuantity: item.requestedQuantity,
          status: 'submitted',
        })) as StockRequestItem[],
        purpose,
        priority,
        additionalNotes: additionalNotes || undefined,
        requestingStaff: currentUser?.id || '',
        employeeId: requesterEmployeeId,
        department: requesterDepartment,
        updatedAt: new Date(),
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleCancel();
      }, 2000);
    } else {
      // Create new request
      const requestNumber = `DIM-REQ-${new Date().getFullYear()}-${String(requestCount + 1).padStart(4, '0')}`;

      const request: StockRequest = {
        id: generateId('req'),
        requestNumber,
        requestingStaff: currentUser?.id || '',
        employeeId: requesterEmployeeId,
        department: requesterDepartment,
        requestDate: new Date(),
        requiredDate: new Date(requiredDate),
        items: requestItems.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          availableStock: item.availableStock,
          requestedQuantity: item.requestedQuantity,
          status: 'submitted',
        })) as StockRequestItem[],
        purpose,
        priority,
        additionalNotes: additionalNotes || undefined,
        status: 'submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addStockRequest(request);
      setShowSuccess(true);

      // Reset form
      setRequiredDate(formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
      setPurpose('');
      setPriority('medium');
      setAdditionalNotes('');
      setRequesterName('');
      setRequesterEmployeeId('');
      setRequesterDepartment('');
      setRequestItems([]);

      setTimeout(() => {
        setShowSuccess(false);
        handleCancel();
      }, 2000);
    }
  };

  const requestCount = stockRequests.length;

  const handleEdit = (request: StockRequest) => {
    setEditingRequest(request);
    setRequiredDate(formatDate(request.requiredDate));
    setPurpose(request.purpose);
    setPriority(request.priority);
    setAdditionalNotes(request.additionalNotes || '');
    setRequestItems(request.items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      availableStock: item.availableStock,
      requestedQuantity: item.requestedQuantity,
    })));
    setViewMode('new');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      deleteStockRequest(id);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setRequiredDate(formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    setPurpose('');
    setPriority('medium');
    setAdditionalNotes('');
    setRequestItems([]);
    setEditingRequest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Request Stationery</h1>
              <p className="text-gray-600 text-sm">Submit a request for office supplies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Request submitted successfully!</span>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">My Requests</h2>
              <button
                onClick={() => setViewMode('new')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockRequests.filter(r => r.requestingStaff === currentUser?.id).map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.requestNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(request.requestDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.items.length}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{request.purpose}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            request.priority === 'high' ? 'bg-red-100 text-red-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            request.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {request.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleEdit(request)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {stockRequests.filter(r => r.requestingStaff === currentUser?.id).length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
                  <p className="text-gray-600 mb-4">You haven't submitted any requests yet.</p>
                  <button
                    onClick={() => setViewMode('new')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Create First Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form View */}
        {viewMode === 'new' && (
          <div className="max-w-4xl mx-auto">
            {/* Requester Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Requester Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={requesterName || currentStaff?.name || currentUser?.name || ''}
                onChange={(e) => setRequesterName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
              <input
                type="text"
                value={requesterEmployeeId || currentStaff?.employeeId || ''}
                onChange={(e) => setRequesterEmployeeId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter employee ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                value={requesterDepartment || currentStaff?.department || currentUser?.department || ''}
                onChange={(e) => setRequesterDepartment(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter department"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Date *</label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Reason *</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., Monthly office supplies, Project documentation, etc."
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Items Requested</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {requestItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No items added yet. Click "Add Item" to begin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requestItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                        <select
                          value={item.itemId}
                          onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="">Select Item</option>
                          {inventoryItems.map((invItem) => (
                            <option key={invItem.id} value={invItem.id}>
                              {invItem.name} ({invItem.code}) - Available: {invItem.currentStock} {invItem.unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requested Quantity *</label>
                        <input
                          type="number"
                          value={item.requestedQuantity || ''}
                          onChange={(e) => updateItem(index, 'requestedQuantity', Number(e.target.value))}
                          required
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      {item.itemId && (
                        <div className="md:col-span-2">
                          <div className={`p-3 rounded-lg flex items-center gap-2 ${
                            item.requestedQuantity > item.availableStock
                              ? 'bg-yellow-50 border border-yellow-200'
                              : 'bg-green-50 border border-green-200'
                          }`}>
                            {item.requestedQuantity > item.availableStock ? (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            ) : (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                            <span className={`text-sm ${
                              item.requestedQuantity > item.availableStock
                                ? 'text-yellow-800'
                                : 'text-green-800'
                            }`}>
                              Available Stock: {item.availableStock} {inventoryItems.find(i => i.id === item.itemId)?.unit}
                              {item.requestedQuantity > item.availableStock && ' - Insufficient stock'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Add any additional information about your request..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={requestItems.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="w-5 h-5 inline mr-2" />
              {editingRequest ? 'Update Request' : 'Submit Request'}
            </button>
          </div>
        </form>
        </div>
        )}
      </div>
    </div>
  );
}
