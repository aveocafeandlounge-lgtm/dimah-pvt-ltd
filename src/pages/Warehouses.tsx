import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Edit, Trash2, Warehouse as WarehouseIcon } from 'lucide-react';
import { generateId } from '../utils/helpers';
import type { Warehouse } from '../types';
import Navigation from '../components/Navigation';

export default function Warehouses() {
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse, currentUser, inventoryItems } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
  });

  console.log('Warehouses page - current warehouses:', warehouses);
  console.log('Warehouses page - current user:', currentUser);

  const canManage = currentUser?.role === 'manager';

  // Calculate item count for each warehouse
  const warehouseItemCount = warehouses.reduce((acc, warehouse) => {
    acc[warehouse.id] = inventoryItems.filter(item => item.warehouseId === warehouse.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Get items for selected warehouse
  const warehouseItems = selectedWarehouse
    ? inventoryItems.filter(item => item.warehouseId === selectedWarehouse)
    : [];

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called - formData:', formData);
    console.log('handleSubmit called - editingWarehouse:', editingWarehouse);
    
    if (editingWarehouse) {
      console.log('Updating warehouse:', editingWarehouse.id);
      updateWarehouse(editingWarehouse.id, {
        ...formData,
        updatedAt: new Date(),
      });
    } else {
      console.log('Adding new warehouse');
      const newWarehouse = {
        id: generateId('warehouse'),
        name: formData.name,
        location: formData.location,
        isActive: true,
        createdAt: new Date(),
      };
      console.log('New warehouse data:', newWarehouse);
      addWarehouse(newWarehouse);
    }

    setFormData({ name: '', location: '' });
    setEditingWarehouse(null);
    setShowForm(false);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      location: warehouse.location,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse? This will affect inventory items in this warehouse.')) {
      deleteWarehouse(id);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', location: '' });
    setEditingWarehouse(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Navigation />
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8 mt-14 lg:mt-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
              <p className="text-gray-600 text-sm">Manage warehouse locations</p>
            </div>
            {canManage && (
              <button
                onClick={() => {
                  setEditingWarehouse(null);
                  setFormData({ name: '', location: '' });
                  setShowForm(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Warehouse</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Form */}
        {showForm && canManage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Main Warehouse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Male, Maldives"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingWarehouse ? 'Update Warehouse' : 'Add Warehouse'}
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

        {/* Warehouses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWarehouses.map((warehouse) => (
            <div key={warehouse.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <WarehouseIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                    <p className="text-sm text-gray-500">{warehouse.location}</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(warehouse)}
                      className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(warehouse.id)}
                      className="p-1 hover:bg-red-50 text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items assigned:</span>
                  <span className="text-sm font-semibold text-gray-900">{warehouseItemCount[warehouse.id] || 0}</span>
                </div>
                {warehouseItemCount[warehouse.id] > 0 && (
                  <button
                    onClick={() => setSelectedWarehouse(warehouse.id)}
                    className="mt-2 w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View items →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Warehouse Items */}
        {selectedWarehouse && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Items in {warehouses.find(w => w.id === selectedWarehouse)?.name}
              </h2>
              <button
                onClick={() => setSelectedWarehouse(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
            {warehouseItems.length === 0 ? (
              <p className="text-gray-600">No items assigned to this warehouse yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {warehouseItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.code}</p>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium text-gray-900 ml-1">{item.currentStock} {item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredWarehouses.length === 0 && (
          <div className="text-center py-12">
            <WarehouseIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Warehouses Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try a different search term.' : 'No warehouses have been created yet.'}
            </p>
            {canManage && !searchTerm && (
              <button
                onClick={() => {
                  setEditingWarehouse(null);
                  setFormData({ name: '', location: '' });
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add First Warehouse
              </button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
