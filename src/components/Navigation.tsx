import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Package,
  FolderOpen,
  Layers,
  CheckCircle,
  TrendingUp,
  LogOut,
  Menu,
  Users,
  Building2,
  Truck,
} from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { title: 'Dashboard', icon: FolderOpen, path: '/dashboard', roles: ['super_admin', 'inventory_manager', 'inventory_clerk', 'approver', 'staff'] },
    { title: 'Inventory', icon: Package, path: '/inventory', roles: ['super_admin', 'inventory_manager', 'inventory_clerk'] },
    { title: 'Categories', icon: Layers, path: '/categories', roles: ['super_admin', 'inventory_manager', 'inventory_clerk'] },
    { title: 'Staff', icon: Users, path: '/staff', roles: ['super_admin'] },
    { title: 'Departments', icon: Building2, path: '/departments', roles: ['super_admin'] },
    { title: 'Suppliers', icon: Truck, path: '/suppliers', roles: ['super_admin', 'inventory_manager'] },
    { title: 'Users', icon: CheckCircle, path: '/users', roles: ['super_admin'] },
    { title: 'Requests', icon: Package, path: '/requests', roles: ['super_admin', 'inventory_manager', 'inventory_clerk', 'staff'] },
    { title: 'Approvals', icon: CheckCircle, path: '/approvals', roles: ['super_admin', 'inventory_manager', 'approver'] },
    { title: 'Stock Ledger', icon: TrendingUp, path: '/stock/ledger', roles: ['super_admin', 'inventory_manager', 'inventory_clerk'] },
    { title: 'Reports', icon: TrendingUp, path: '/reports', roles: ['super_admin', 'inventory_manager', 'inventory_clerk'] },
  ];

  const currentPath = window.location.pathname;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Dimah Inventory</h1>
        <div className="w-10" />
      </div>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-14" />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-0 lg:flex lg:flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Dimah PVT LTD</h1>
                <p className="text-xs text-gray-500">Inventory System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems
              .filter(item => item.roles.includes(currentUser?.role || 'staff'))
              .map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition ${
                  currentPath === item.path
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4 px-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="font-medium text-gray-600">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg hover:bg-red-50 text-red-600"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
