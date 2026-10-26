import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Download, FileText, Package, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function Reports() {
  const navigate = useNavigate();
  const { inventoryItems, stockRequests, stockTransactions, departments } = useApp();
  const [selectedReport, setSelectedReport] = useState<string>('stock-balance');

  const reports = [
    { id: 'stock-balance', name: 'Current Stock Balance', icon: Package, description: 'View current inventory levels' },
    { id: 'stock-movement', name: 'Stock Movement', icon: TrendingUp, description: 'Stock received and issued over time' },
    { id: 'low-stock', name: 'Low Stock Report', icon: AlertTriangle, description: 'Items at or below minimum stock level' },
    { id: 'requests', name: 'Request Summary', icon: FileText, description: 'Overview of all stock requests' },
    { id: 'department', name: 'Department Consumption', icon: Users, description: 'Stock usage by department' },
  ];

  const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStockLevel);

  const handleExportCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'stock-balance':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Stock Balance</h3>
              <button
                onClick={() => handleExportCSV(inventoryItems.map(item => ({
                  Item: item.name,
                  Code: item.code,
                  Category: item.category,
                  Stock: item.currentStock,
                  Unit: item.unit,
                  'Min Level': item.minStockLevel,
                  'Unit Cost': item.unitCost,
                  Location: item.storageLocation || 'N/A',
                })), 'stock-balance')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min Level</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value (MVR)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.code}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        item.currentStock === 0 ? 'text-red-600' :
                        item.currentStock <= item.minStockLevel ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {item.currentStock}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">{item.minStockLevel}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {(item.currentStock * item.unitCost).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.storageLocation || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Items:</span>
                  <span className="ml-2 font-medium">{inventoryItems.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Stock Value:</span>
                  <span className="ml-2 font-medium">
                    MVR {inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Low Stock Items:</span>
                  <span className="ml-2 font-medium text-yellow-600">{lowStockItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'low-stock':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Report</h3>
              <button
                onClick={() => handleExportCSV(lowStockItems.map(item => ({
                  Item: item.name,
                  Code: item.code,
                  'Current Stock': item.currentStock,
                  'Min Level': item.minStockLevel,
                  'Reorder Qty': item.reorderQuantity,
                  Status: item.currentStock === 0 ? 'Out of Stock' : 'Low Stock',
                })), 'low-stock')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No items are currently low on stock.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min Level</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lowStockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.code}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{item.currentStock}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{item.minStockLevel}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">{item.reorderQuantity}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.currentStock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'requests':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Request Summary</h3>
              <button
                onClick={() => handleExportCSV(stockRequests.map(req => ({
                  'Request No': req.requestNumber,
                  'Request Date': formatDate(req.requestDate),
                  Department: req.department,
                  Purpose: req.purpose,
                  Status: req.status,
                  Items: req.items.length,
                })), 'requests-summary')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{req.requestNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(req.requestDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{req.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{req.purpose}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          req.status === 'completed' ? 'bg-green-100 text-green-800' :
                          req.status === 'approved' || req.status === 'ready_for_collection' ? 'bg-blue-100 text-blue-800' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{req.items.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'stock-movement':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Stock Movement</h3>
              <button
                onClick={() => handleExportCSV(stockTransactions.map(trans => ({
                  Date: formatDate(trans.createdAt),
                  Item: trans.itemName,
                  Type: trans.transactionType,
                  Reference: trans.referenceNumber,
                  'Qty In': trans.quantityIn,
                  'Qty Out': trans.quantityOut,
                  Balance: trans.balanceAfter,
                  User: trans.userName,
                })), 'stock-movement')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">In</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Out</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockTransactions.map((trans) => (
                    <tr key={trans.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(trans.createdAt)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{trans.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{trans.transactionType.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{trans.referenceNumber}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">{trans.quantityIn > 0 ? trans.quantityIn : '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">{trans.quantityOut > 0 ? trans.quantityOut : '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{trans.balanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'department':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Department Consumption</h3>
              <button
                onClick={() => {
                  const deptData = departments.map(dept => {
                    const deptRequests = stockRequests.filter(req => req.department === dept.name);
                    const totalItems = deptRequests.reduce((sum, req) => sum + req.items.length, 0);
                    return {
                      Department: dept.name,
                      'Total Requests': deptRequests.length,
                      'Total Items': totalItems,
                    };
                  });
                  handleExportCSV(deptData, 'department-consumption');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => {
                const deptRequests = stockRequests.filter(req => req.department === dept.name);
                const totalItems = deptRequests.reduce((sum, req) => sum + req.items.length, 0);
                return (
                  <div key={dept.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <h4 className="font-medium text-gray-900">{dept.name}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Requests:</span>
                        <span className="font-medium">{deptRequests.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-medium">{totalItems}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return <div>Select a report</div>;
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
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600 text-sm">View and export inventory reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Report Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports</h2>
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition text-left ${
                      selectedReport === report.id
                        ? 'bg-blue-50 border border-blue-500'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <report.icon className={`w-5 h-5 ${
                      selectedReport === report.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <p className={`font-medium ${
                        selectedReport === report.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {report.name}
                      </p>
                      <p className="text-xs text-gray-600">{report.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {renderReport()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
