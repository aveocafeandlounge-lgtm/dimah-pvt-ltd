import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  FolderOpen,
  Layers,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Navigation from '../components/Navigation';

export default function Dashboard() {
  const { currentUser, inventoryItems, stockRequests, stockIssues, stockReceipts, stockTransactions } = useApp();
  const navigate = useNavigate();

  // Calculate dashboard stats
  const totalItems = inventoryItems.length;
  const totalStock = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStockLevel && item.currentStock > 0).length;
  const outOfStockItems = inventoryItems.filter(item => item.currentStock === 0).length;
  const pendingRequests = stockRequests.filter(req => req.status === 'pending_approval').length;
  const readyForIssue = stockRequests.filter(req => req.status === 'approved' || req.status === 'ready_for_collection').length;
  const issuedToday = stockIssues.filter(issue => {
    const today = new Date();
    const issueDate = new Date(issue.issueDate);
    return issueDate.toDateString() === today.toDateString();
  }).length;
  const receivedThisMonth = stockReceipts.filter(receipt => {
    const now = new Date();
    const receiptDate = new Date(receipt.dateReceived);
    return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
  }).length;

  // Chart data
  const stockByCategory = inventoryItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.currentStock;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(stockByCategory).map(([name, value]) => ({ name, value }));

  // Calculate real monthly data from stock transactions
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  const monthlyData = months.map((month, index) => {
    const monthTransactions = stockTransactions.filter(trans => {
      const transDate = new Date(trans.createdAt);
      return transDate.getMonth() === index && transDate.getFullYear() === currentYear;
    });
    
    const received = monthTransactions
      .filter(t => t.transactionType === 'stock_received' || t.transactionType === 'supplier_return')
      .reduce((sum, t) => sum + t.quantityIn, 0);
    
    const issued = monthTransactions
      .filter(t => t.transactionType === 'stock_issued' || t.transactionType === 'staff_return')
      .reduce((sum, t) => sum + t.quantityOut, 0);
    
    return { month, received, issued };
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const quickActions = [
    { title: 'Add Inventory Item', icon: Package, path: '/inventory/add', color: 'bg-blue-500' },
    { title: 'Receive Stock', icon: TrendingUp, path: '/stock/receive', color: 'bg-green-500' },
    { title: 'Request Items', icon: Clock, path: '/requests/new', color: 'bg-purple-500' },
    { title: 'Approve Requests', icon: CheckCircle, path: '/approvals', color: 'bg-yellow-500' },
    { title: 'Issue Items', icon: ArrowRight, path: '/stock/issue', color: 'bg-indigo-500' },
    { title: 'View Reports', icon: FolderOpen, path: '/reports', color: 'bg-pink-500' },
  ];

  const canPerformAction = (path: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'inventory_manager') {
      return ['/inventory/add', '/stock/receive', '/stock/issue', '/reports'].includes(path);
    }
    if (currentUser.role === 'approver') {
      return ['/approvals', '/reports'].includes(path);
    }
    if (currentUser.role === 'staff') {
      return ['/requests/new', '/reports'].includes(path);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Navigation />
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8 mt-14 lg:mt-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {currentUser?.name}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{totalItems}</span>
              </div>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Layers className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">{totalStock}</span>
              </div>
              <p className="text-sm text-gray-600">Total Stock Units</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <span className="text-2xl font-bold text-gray-900">{lowStockItems}</span>
              </div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
                <span className="text-2xl font-bold text-gray-900">{outOfStockItems}</span>
              </div>
              <p className="text-sm text-gray-600">Out of Stock</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">{pendingRequests}</span>
              </div>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{readyForIssue}</span>
              </div>
              <p className="text-sm text-gray-600">Ready for Issue</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">{issuedToday}</span>
              </div>
              <p className="text-sm text-gray-600">Issued Today</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <FolderOpen className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl font-bold text-gray-900">{receivedThisMonth}</span>
              </div>
              <p className="text-sm text-gray-600">Received This Month</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions
                .filter(action => canPerformAction(action.path))
                .map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">{action.title}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Stock Movement</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="received" fill="#10B981" name="Received" />
                  <Bar dataKey="issued" fill="#3B82F6" name="Issued" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Warning */}
          {lowStockItems > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Low Stock Alert</h3>
                  <p className="text-yellow-800 text-sm mb-3">
                    {lowStockItems} items are running low on stock. Consider reordering soon.
                  </p>
                  <button
                    onClick={() => navigate('/inventory')}
                    className="text-sm font-medium text-yellow-900 hover:text-yellow-700 underline"
                  >
                    View Low Stock Items →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
