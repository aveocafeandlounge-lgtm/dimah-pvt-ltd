import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Plus, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { generateId, formatDate } from '../utils/helpers';

type AdjustmentType = 'staff_return' | 'supplier_return' | 'damage' | 'adjustment';

export default function Adjustments() {
  const navigate = useNavigate();
  const { inventoryItems, stockTransactions, addStockTransaction, updateInventoryItem, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('adjustment');
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: 0,
    reason: '',
    referenceNumber: '',
  });

  const canManage = currentUser?.role === 'super_admin' || currentUser?.role === 'inventory_manager';

  const adjustmentTransactions = stockTransactions.filter(trans => 
    trans.transactionType === 'staff_return' || trans.transactionType === 'supplier_return' || trans.transactionType === 'damage' || trans.transactionType === 'adjustment'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const item = inventoryItems.find(i => i.id === formData.itemId);
    if (!item) return;

    const quantityChange = formData.quantity;
    const newStock = item.currentStock + quantityChange;

    if (newStock < 0) {
      alert('Insufficient stock for this adjustment');
      return;
    }

    // Update inventory item stock
    updateInventoryItem(item.id, {
      currentStock: newStock,
      updatedAt: new Date(),
    });

    // Create transaction record
    addStockTransaction({
      id: generateId('trans'),
      itemId: item.id,
      itemName: item.name,
      transactionType: adjustmentType,
      referenceNumber: formData.referenceNumber || `ADJ-${Date.now()}`,
      quantityIn: quantityChange > 0 ? quantityChange : 0,
      quantityOut: quantityChange < 0 ? Math.abs(quantityChange) : 0,
      balanceAfter: newStock,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      reason: formData.reason,
      createdAt: new Date(),
    });

    setFormData({
      itemId: '',
      quantity: 0,
      reason: '',
      referenceNumber: '',
    });
    setShowForm(false);
  };

  const handleCancel = () => {
    setFormData({
      itemId: '',
      quantity: 0,
      reason: '',
      referenceNumber: '',
    });
    setShowForm(false);
  };

  const getAdjustmentColor = (type: string) => {
    switch (type) {
      case 'staff_return':
      case 'supplier_return':
        return 'bg-green-100 text-green-800';
      case 'damage':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'staff_return':
      case 'supplier_return':
        return <RefreshCw className="w-5 h-5" />;
      case 'damage':
        return <AlertTriangle className="w-5 h-5" />;
      case 'adjustment':
        return <Package className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
              <p className="text-gray-600 text-sm">Manage returns, damages, and stock adjustments</p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Adjustment</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Form */}
        {showForm && canManage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Stock Adjustment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type *</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="adjustment">Stock Adjustment</option>
                    <option value="return">Return to Stock</option>
                    <option value="damage">Damage/Loss</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                  <select
                    value={formData.itemId}
                    onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Item</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Stock: {item.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity {adjustmentType === 'damage' ? '(to deduct)' : (adjustmentType === 'staff_return' || adjustmentType === 'supplier_return') ? '(to add)' : '(positive to add, negative to deduct)'} *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., 5 or -5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., ADJ-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., Damaged during transit"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Record Adjustment
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Adjustments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">In</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Out</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adjustmentTransactions.map((trans) => (
                  <tr key={trans.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(trans.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getAdjustmentColor(trans.transactionType)}`}>
                        {getAdjustmentIcon(trans.transactionType)}
                        {trans.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {trans.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {trans.quantityIn > 0 ? trans.quantityIn : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {trans.quantityOut > 0 ? trans.quantityOut : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {trans.balanceAfter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {trans.referenceNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {trans.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {trans.userName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {adjustmentTransactions.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Adjustments Found</h3>
              <p className="text-gray-600 mb-4">No stock adjustments have been recorded yet.</p>
              {canManage && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Record Adjustment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
