import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import type { Category } from '../types';
import Navigation from '../components/Navigation';

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const canManage = currentUser?.role === 'inventory_staff' || currentUser?.role === 'manager';
  const canDelete = currentUser?.role === 'manager';

  const filteredCategories = categories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateCategory(editingCategory.id, {
        ...formData,
        updatedAt: new Date(),
      });
    } else {
      addCategory({
        id: generateId('cat'),
        code: formData.code || `CAT-${String(categories.length + 1).padStart(3, '0')}`,
        name: formData.name,
        description: formData.description || undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    setFormData({ name: '', code: '', description: '' });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will affect items in this category.')) {
      deleteCategory(id);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', code: '', description: '' });
    setEditingCategory(null);
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
              <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
              <p className="text-gray-600 text-sm">Manage inventory categories</p>
            </div>
            {canManage && (
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setFormData({ name: '', code: '', description: '' });
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Category
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="CAT-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Office Supplies"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Category description..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingCategory ? 'Update' : 'Add'} Category
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{category.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {canManage && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No categories found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
