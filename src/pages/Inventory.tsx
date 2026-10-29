import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, XCircle } from 'lucide-react';
import { generateId } from '../utils/helpers';
import type { InventoryItem, Unit } from '../types';
import Navigation from '../components/Navigation';

export default function Inventory() {
  const navigate = useNavigate();
  const { inventoryItems, categories, suppliers, currentUser, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const canEdit = currentUser?.role === 'super_admin' || currentUser?.role === 'inventory_manager' || currentUser?.role === 'inventory_clerk';
  const canDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'inventory_manager';

  const units: Unit[] = ['piece', 'box', 'pack', 'ream', 'bottle', 'roll', 'set', 'carton', 'kilogram', 'litre', 'other'];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const itemData: InventoryItem = {
      id: editingItem?.id || generateId('item'),
      itemId: editingItem?.itemId || `DIM-ITEM-${String(inventoryItems.length + 1).padStart(3, '0')}`,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string || undefined,
      unit: formData.get('unit') as Unit,
      currentStock: Number(formData.get('currentStock')),
      minStockLevel: Number(formData.get('minStockLevel')),
      maxStockLevel: formData.get('maxStockLevel') ? Number(formData.get('maxStockLevel')) : undefined,
      reorderQuantity: Number(formData.get('reorderQuantity')),
      storageLocation: formData.get('storageLocation') as string || undefined,
      supplier: formData.get('supplier') as string || undefined,
      unitCost: Number(formData.get('unitCost')),
      imageUrl: undefined,
      isActive: true,
      createdBy: currentUser?.id || '',
      createdAt: editingItem?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingItem) {
      updateInventoryItem(editingItem.id, itemData);
    } else {
      addInventoryItem(itemData);
    }

    setShowAddForm(false);
    setEditingItem(null);
    form.reset();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteInventoryItem(id);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (item.currentStock <= item.minStockLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Navigation />
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8 mt-14 lg:mt-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="text-gray-600 text-sm">Manage office stationery and supplies</p>
            </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/categories')}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Category</span>
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowAddForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  name="name"
                  defaultValue={editingItem?.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Code/SKU *</label>
                <input
                  name="code"
                  defaultValue={editingItem?.code}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  name="category"
                  defaultValue={editingItem?.category}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  name="unit"
                  defaultValue={editingItem?.unit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.description}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                <input
                  type="number"
                  name="currentStock"
                  defaultValue={editingItem?.currentStock}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level *</label>
                <input
                  type="number"
                  name="minStockLevel"
                  defaultValue={editingItem?.minStockLevel}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
                <input
                  type="number"
                  name="maxStockLevel"
                  defaultValue={editingItem?.maxStockLevel}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity *</label>
                <input
                  type="number"
                  name="reorderQuantity"
                  defaultValue={editingItem?.reorderQuantity}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                <input
                  name="storageLocation"
                  defaultValue={editingItem?.storageLocation}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  name="supplier"
                  defaultValue={editingItem?.supplier}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (MVR)</label>
                <input
                  type="number"
                  name="unitCost"
                  defaultValue={editingItem?.unitCost}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const stockStatus = getStockStatus(item);
            const category = categories.find(c => c.id === item.category);

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.code}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">{category?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium text-gray-900">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Level:</span>
                    <span className="font-medium text-gray-900">{item.minStockLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Cost:</span>
                    <span className="font-medium text-gray-900">MVR {item.unitCost.toFixed(2)}</span>
                  </div>
                  {item.storageLocation && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-gray-900">{item.storageLocation}</span>
                    </div>
                  )}
                </div>

                {item.currentStock <= item.minStockLevel && item.currentStock > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-yellow-800">Low stock - consider reordering</span>
                  </div>
                )}

                {item.currentStock === 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-xs text-red-800">Out of stock</span>
                  </div>
                )}

                {canEdit && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No items found</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
