import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Building2 } from 'lucide-react';
import { generateId } from '../utils/helpers';
import type { Supplier } from '../types';
import Navigation from '../components/Navigation';

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Maldives',
    paymentTerms: '',
    notes: '',
  });

  const canManage = currentUser?.role === 'inventory_staff' || currentUser?.role === 'manager';

  const filteredSuppliers = suppliers.filter(supp =>
    supp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supp.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        ...formData,
        updatedAt: new Date(),
      });
    } else {
      addSupplier({
        id: generateId('supp'),
        code: formData.code || `SUPP-${String(suppliers.length + 1).padStart(3, '0')}`,
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email || undefined,
        phone: formData.phone,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country,
        paymentTerms: formData.paymentTerms || undefined,
        notes: formData.notes || undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Maldives',
      paymentTerms: '',
      notes: '',
    });
    setEditingSupplier(null);
    setShowForm(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone,
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      paymentTerms: supplier.paymentTerms || '',
      notes: supplier.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier? This will affect associated stock receipts.')) {
      deleteSupplier(id);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Maldives',
      paymentTerms: '',
      notes: '',
    });
    setEditingSupplier(null);
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
              <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
              <p className="text-gray-600 text-sm">Manage supplier information</p>
            </div>
            {canManage && (
              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setFormData({
                    name: '',
                    code: '',
                    contactPerson: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    country: 'Maldives',
                    paymentTerms: '',
                    notes: '',
                  });
                  setShowForm(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Supplier</span>
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
                placeholder="Search suppliers..."
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
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., Office Supplies Ltd"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., SUPP-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., Ali Ahmed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., +960 1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., supplier@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., Net 30 days"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., Male'"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Additional notes about this supplier..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
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

        {/* Suppliers List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No suppliers match your search.' : 'No suppliers have been added yet.'}
              </p>
              {canManage && !showForm && (
                <button
                  onClick={() => {
                    setEditingSupplier(null);
                    setFormData({
                      name: '',
                      code: '',
                      contactPerson: '',
                      email: '',
                      phone: '',
                      address: '',
                      city: '',
                      country: 'Maldives',
                      paymentTerms: '',
                      notes: '',
                    });
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add First Supplier
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.code}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-xs text-gray-500">{supplier.contactPerson}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{supplier.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{supplier.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{supplier.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canManage && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
