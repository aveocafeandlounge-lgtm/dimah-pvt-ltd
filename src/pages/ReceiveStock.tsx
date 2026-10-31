import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TrendingUp, Plus, Trash2, ArrowLeft, Check, Package } from 'lucide-react';
import { generateId, formatCurrency } from '../utils/helpers';
import type { StockReceipt, StockReceiptItem } from '../types';

interface ReceiptItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  storageLocation?: string;
}

export default function ReceiveStock() {
  const navigate = useNavigate();
  const { inventoryItems, suppliers, stockReceipts, currentUser, addStockReceipt, updateStockReceipt, deleteStockReceipt, updateInventoryItem, addStockTransaction } = useApp();
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [remarks, setRemarks] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'new'>('list');
  const [editingReceipt, setEditingReceipt] = useState<StockReceipt | null>(null);

  const canReceive = currentUser?.role === 'inventory_staff' || currentUser?.role === 'manager';

  const addItem = () => {
    setReceiptItems([
      ...receiptItems,
      {
        itemId: '',
        itemName: '',
        quantity: 0,
        unitCost: 0,
        totalCost: 0,
        storageLocation: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const updated = [...receiptItems];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate total cost when quantity or unit cost changes
    if (field === 'quantity' || field === 'unitCost') {
      updated[index].totalCost = Number(updated[index].quantity) * Number(updated[index].unitCost);
    }

    // Auto-fill item name when item is selected
    if (field === 'itemId') {
      const item = inventoryItems.find(i => i.id === value);
      if (item) {
        updated[index].itemName = item.name;
        updated[index].unitCost = item.unitCost;
        updated[index].storageLocation = item.storageLocation || '';
        updated[index].totalCost = Number(updated[index].quantity) * item.unitCost;
      }
    }

    setReceiptItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier || receiptItems.length === 0) {
      alert('Please select a supplier and add at least one item');
      return;
    }

    if (editingReceipt) {
      // Update existing receipt
      updateStockReceipt(editingReceipt.id, {
        supplier: selectedSupplier,
        invoiceNumber: invoiceNumber || undefined,
        items: receiptItems as StockReceiptItem[],
        remarks: remarks || undefined,
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleCancel();
      }, 2000);
    } else {
      // Create new receipt
      const receiptNumber = `DIM-REC-${new Date().getFullYear()}-${String(stockReceiptsCount + 1).padStart(4, '0')}`;

      const receipt: StockReceipt = {
        id: generateId('receipt'),
        receiptNumber,
        dateReceived: new Date(),
        supplier: selectedSupplier,
        invoiceNumber: invoiceNumber || undefined,
        items: receiptItems as StockReceiptItem[],
        receivedBy: currentUser?.id || '',
        remarks: remarks || undefined,
        createdAt: new Date(),
      };

      // Update inventory stock for each item
      receipt.items.forEach((item) => {
        const inventoryItem = inventoryItems.find(i => i.id === item.itemId);
        if (inventoryItem) {
          const newStock = inventoryItem.currentStock + item.quantity;
          updateInventoryItem(inventoryItem.id, { currentStock: newStock });

          // Add stock transaction
          addStockTransaction({
            id: generateId('trans'),
            itemId: item.itemId,
            itemName: item.itemName,
            transactionType: 'stock_received',
            referenceNumber: receiptNumber,
            quantityIn: item.quantity,
            quantityOut: 0,
            balanceAfter: newStock,
            userId: currentUser?.id || '',
            userName: currentUser?.name || '',
            createdAt: new Date(),
          });
        }
      });

      addStockReceipt(receipt);
      setShowSuccess(true);

      // Reset form
      setSelectedSupplier('');
      setInvoiceNumber('');
      setReceiptItems([]);
      setRemarks('');

      setTimeout(() => {
        setShowSuccess(false);
        handleCancel();
      }, 2000);
    }
  };

  const stockReceiptsCount = stockReceipts.length;

  const totalCost = receiptItems.reduce((sum, item) => sum + item.totalCost, 0);

  const handleEdit = (receipt: StockReceipt) => {
    setEditingReceipt(receipt);
    setSelectedSupplier(receipt.supplier);
    setInvoiceNumber(receipt.invoiceNumber || '');
    setRemarks(receipt.remarks || '');
    setReceiptItems(receipt.items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
      storageLocation: item.storageLocation,
    })));
    setViewMode('new');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this receipt? This will reverse the stock updates.')) {
      // Reverse stock updates
      const receipt = stockReceipts.find(r => r.id === id);
      if (receipt) {
        receipt.items.forEach((item) => {
          const inventoryItem = inventoryItems.find(i => i.id === item.itemId);
          if (inventoryItem) {
            const newStock = inventoryItem.currentStock - item.quantity;
            updateInventoryItem(inventoryItem.id, { currentStock: newStock });
          }
        });
      }
      deleteStockReceipt(id);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedSupplier('');
    setInvoiceNumber('');
    setReceiptItems([]);
    setRemarks('');
    setEditingReceipt(null);
  };

  if (!canReceive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to receive stock</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Receive Stock</h1>
              <p className="text-gray-600 text-sm">Record incoming inventory items</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Stock received successfully!</span>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Stock Receipts History</h2>
              <button
                onClick={() => setViewMode('new')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                New Receipt
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockReceipts.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{receipt.receiptNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(receipt.dateReceived).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{suppliers.find(s => s.id === receipt.supplier)?.name || receipt.supplier}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{receipt.invoiceNumber || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{receipt.items.length}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          MVR {receipt.items.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleEdit(receipt)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                          >
                            View/Edit
                          </button>
                          <button
                            onClick={() => handleDelete(receipt.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {stockReceipts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Receipts Found</h3>
                  <p className="text-gray-600 mb-4">No stock receipts have been recorded yet.</p>
                  <button
                    onClick={() => setViewMode('new')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Record First Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form View */}
        {viewMode === 'new' && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supp) => (
                    <option key={supp.id} value={supp.id}>
                      {supp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice / Delivery Note</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., INV-2026-1001"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Items Received</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {receiptItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No items added yet. Click "Add Item" to begin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receiptItems.map((item, index) => {
                  return (
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

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
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
                                {invItem.name} ({invItem.code}) - Stock: {invItem.currentStock} {invItem.unit}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            required
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (MVR) *</label>
                          <input
                            type="number"
                            value={item.unitCost || ''}
                            onChange={(e) => updateItem(index, 'unitCost', Number(e.target.value))}
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                          <input
                            type="text"
                            value={item.storageLocation || ''}
                            onChange={(e) => updateItem(index, 'storageLocation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium">
                            {formatCurrency(item.totalCost)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {receiptItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                <div className="text-lg font-semibold">
                  Total: {formatCurrency(totalCost)}
                </div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h2>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Add any additional notes about this receipt..."
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
              disabled={receiptItems.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              {editingReceipt ? 'Update Receipt' : 'Receive Stock'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
