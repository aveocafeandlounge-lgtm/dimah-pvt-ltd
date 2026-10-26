import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, ArrowLeft, Check, Package, Printer, User, AlertTriangle } from 'lucide-react';
import { generateId, formatDate, formatDateTime } from '../utils/helpers';
import type { StockIssue, StockIssueItem } from '../types';

interface IssueItem {
  itemId: string;
  itemName: string;
  approvedQuantity: number;
  availableStock: number;
  issuedQuantity: number;
  unit: string;
}

export default function IssueStock() {
  const navigate = useNavigate();
  const { stockRequests, inventoryItems, currentUser, staff, addStockIssue, updateStockRequest, updateInventoryItem, addStockTransaction } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [issueItems, setIssueItems] = useState<IssueItem[]>([]);
  const [remarks, setRemarks] = useState('');
  const [showVoucher, setShowVoucher] = useState(false);
  const [issuedVoucher, setIssuedVoucher] = useState<StockIssue | null>(null);

  const canIssue = currentUser?.role === 'super_admin' || currentUser?.role === 'inventory_manager';

  const approvedRequests = stockRequests.filter(req =>
    req.status === 'approved' || req.status === 'ready_for_collection' || req.status === 'partially_approved'
  );

  const selectedRequestData = selectedRequest ? stockRequests.find(req => req.id === selectedRequest) : null;

  const handleSelectRequest = (requestId: string) => {
    const request = stockRequests.find(req => req.id === requestId);
    if (!request) return;

    setSelectedRequest(requestId);
    const items: IssueItem[] = request.items
      .filter(item => (item.approvedQuantity || item.requestedQuantity) > 0)
      .map(item => {
        const inventoryItem = inventoryItems.find(inv => inv.id === item.itemId);
        return {
          itemId: item.itemId,
          itemName: item.itemName,
          approvedQuantity: item.approvedQuantity || item.requestedQuantity,
          availableStock: inventoryItem?.currentStock || 0,
          issuedQuantity: Math.min(item.approvedQuantity || item.requestedQuantity, inventoryItem?.currentStock || 0),
          unit: inventoryItem?.unit || 'piece',
        };
      });
    setIssueItems(items);
  };

  const updateIssueQuantity = (itemId: string, quantity: number) => {
    setIssueItems(issueItems.map(item => 
      item.itemId === itemId 
        ? { ...item, issuedQuantity: Math.min(quantity, item.availableStock, item.approvedQuantity) }
        : item
    ));
  };

  const handleIssue = () => {
    if (!selectedRequestData || !currentUser) return;

    const totalIssued = issueItems.reduce((sum, item) => sum + item.issuedQuantity, 0);
    if (totalIssued === 0) {
      alert('Please issue at least one item');
      return;
    }

    // Check for insufficient stock
    const insufficientStock = issueItems.filter(item => item.issuedQuantity > item.availableStock);
    if (insufficientStock.length > 0) {
      alert('Some items have insufficient stock. Please adjust the quantities.');
      return;
    }

    const issueNumber = `DIM-ISS-${new Date().getFullYear()}-${String(issueCount + 1).padStart(4, '0')}`;
    const requester = staff.find(s => s.id === selectedRequestData.requestingStaff);

    const issue: StockIssue = {
      id: generateId('issue'),
      issueNumber,
      requestId: selectedRequestData.id,
      requestNumber: selectedRequestData.requestNumber,
      recipientName: requester?.name || 'Unknown',
      employeeId: selectedRequestData.employeeId,
      department: selectedRequestData.department,
      items: issueItems.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        approvedQuantity: item.approvedQuantity,
        issuedQuantity: item.issuedQuantity,
        unit: item.unit as any,
      })) as StockIssueItem[],
      issuedBy: currentUser.id,
      issueDate: new Date(),
      remarks: remarks || undefined,
      recipientConfirmed: false,
      createdAt: new Date(),
    };

    // Update inventory stock for each item
    issue.items.forEach((item) => {
      const inventoryItem = inventoryItems.find(i => i.id === item.itemId);
      if (inventoryItem && item.issuedQuantity > 0) {
        const newStock = inventoryItem.currentStock - item.issuedQuantity;
        updateInventoryItem(inventoryItem.id, { currentStock: newStock });

        // Add stock transaction
        addStockTransaction({
          id: generateId('trans'),
          itemId: item.itemId,
          itemName: item.itemName,
          transactionType: 'stock_issued',
          referenceNumber: issueNumber,
          quantityIn: 0,
          quantityOut: item.issuedQuantity,
          balanceAfter: newStock,
          userId: currentUser.id,
          userName: currentUser.name,
          createdAt: new Date(),
        });
      }
    });

    // Update request status
    const allFullyIssued = issue.items.every(item => item.issuedQuantity === item.approvedQuantity);
    const someIssued = issue.items.some(item => item.issuedQuantity > 0);

    updateStockRequest(selectedRequestData.id, {
      status: allFullyIssued ? 'issued' : someIssued ? 'partially_issued' : 'approved',
      items: selectedRequestData.items.map(item => {
        const issuedItem = issue.items.find(i => i.itemId === item.itemId);
        return {
          ...item,
          issuedQuantity: (item.issuedQuantity || 0) + (issuedItem?.issuedQuantity || 0),
          status: (issuedItem?.issuedQuantity || 0) === item.approvedQuantity ? 'issued' as any : 
                   (issuedItem?.issuedQuantity || 0) > 0 ? 'partially_issued' as any : item.status,
        };
      }),
    });

    addStockIssue(issue);
    setIssuedVoucher(issue);
    setShowVoucher(true);
  };

  const issueCount = 0; // This would come from context in a real implementation

  const handlePrintVoucher = () => {
    window.print();
  };

  const handleConfirmReceipt = () => {
    if (!issuedVoucher) return;
    
    // In a real app, this would update the voucher with recipient confirmation
    setShowVoucher(false);
    setIssuedVoucher(null);
    setSelectedRequest(null);
    setIssueItems([]);
    setRemarks('');
    navigate('/dashboard');
  };

  if (!canIssue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to issue stock</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Issue Stock</h1>
              <p className="text-gray-600 text-sm">Issue approved items to staff</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {showVoucher && issuedVoucher ? (
          /* Issue Voucher */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Issue Voucher</h2>
              <button
                onClick={handlePrintVoucher}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>

            <div className="border-2 border-gray-300 rounded-lg p-6">
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Dimah PVT LTD</h3>
                <p className="text-gray-600">Office Inventory Management System</p>
                <p className="text-sm text-gray-500 mt-1">Stock Issue Voucher</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-gray-600">Voucher Number:</span>
                  <span className="ml-2 font-medium">{issuedVoucher.issueNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">{formatDate(issuedVoucher.issueDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Request Number:</span>
                  <span className="ml-2 font-medium">{issuedVoucher.requestNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <span className="ml-2 font-medium">{formatDateTime(issuedVoucher.issueDate).split(',')[1]}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Recipient Name:</span>
                    <span className="ml-2 font-medium">{issuedVoucher.recipientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="ml-2 font-medium">{issuedVoucher.employeeId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <span className="ml-2 font-medium">{issuedVoucher.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Issued By:</span>
                    <span className="ml-2 font-medium">{currentUser?.name}</span>
                  </div>
                </div>
              </div>

              <table className="w-full mb-6 text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Approved Qty</th>
                    <th className="text-center py-2">Issued Qty</th>
                    <th className="text-center py-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedVoucher.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2">{item.itemName}</td>
                      <td className="text-center py-2">{item.approvedQuantity}</td>
                      <td className="text-center py-2 font-medium">{item.issuedQuantity}</td>
                      <td className="text-center py-2">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {issuedVoucher.remarks && (
                <div className="mb-6">
                  <span className="text-gray-600 text-sm">Remarks:</span>
                  <p className="mt-1 text-sm">{issuedVoucher.remarks}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2 mt-8">
                    <p className="text-sm text-gray-600">Issued By</p>
                    <p className="font-medium">{currentUser?.name}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2 mt-8">
                    <p className="text-sm text-gray-600">Recipient Acknowledgment</p>
                    <p className="font-medium">{issuedVoucher.recipientName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowVoucher(false);
                  setIssuedVoucher(null);
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={handleConfirmReceipt}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                <Check className="w-5 h-5 inline mr-2" />
                Confirm Receipt
              </button>
            </div>
          </div>
        ) : (
          <>
            {approvedRequests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Approved Requests</h2>
                <p className="text-gray-600">There are no approved requests awaiting issue at this time.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Request List */}
                <div className="lg:col-span-1 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Approved Requests ({approvedRequests.length})</h2>
                  {approvedRequests.map((request) => {
                    const requester = staff.find(s => s.id === request.requestingStaff);
                    return (
                      <button
                        key={request.id}
                        onClick={() => handleSelectRequest(request.id)}
                        className={`w-full text-left p-4 rounded-xl border transition ${
                          selectedRequest === request.id
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 mb-2">{request.requestNumber}</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            {requester?.name || 'Unknown'}
                          </div>
                          <div className="text-gray-600">{request.department}</div>
                          <div className="text-gray-600">{request.items.length} item(s)</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Issue Form */}
                <div className="lg:col-span-2">
                  {selectedRequestData ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">{selectedRequestData.requestNumber}</h2>
                          <p className="text-gray-600 text-sm mt-1">Issue approved items</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedRequest(null);
                            setIssueItems([]);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Recipient Info */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-gray-900 mb-3">Recipient Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Name:</span>
                            <span className="ml-2 font-medium">{staff.find(s => s.id === selectedRequestData.requestingStaff)?.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Employee ID:</span>
                            <span className="ml-2 font-medium">{selectedRequestData.employeeId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Department:</span>
                            <span className="ml-2 font-medium">{selectedRequestData.department}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mb-6">
                        <h3 className="font-medium text-gray-900 mb-3">Items to Issue</h3>
                        <div className="space-y-3">
                          {issueItems.map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Package className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-900">{item.itemName}</p>
                                    <p className="text-sm text-gray-600">
                                      Approved: {item.approvedQuantity} {item.unit} | Available: {item.availableStock} {item.unit}
                                    </p>
                                  </div>
                                </div>
                                {item.issuedQuantity > item.availableStock && (
                                  <div className="flex items-center gap-1 text-red-600 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Insufficient Stock</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity to Issue
                                  </label>
                                  <input
                                    type="number"
                                    value={item.issuedQuantity}
                                    onChange={(e) => updateIssueQuantity(item.itemId, Number(e.target.value))}
                                    min="0"
                                    max={Math.min(item.availableStock, item.approvedQuantity)}
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                  />
                                </div>
                                <div className="text-sm text-gray-600">
                                  Remaining: {item.approvedQuantity - item.issuedQuantity} {item.unit}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Add any remarks about this issue..."
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedRequest(null);
                            setIssueItems([]);
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleIssue}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          <ArrowRight className="w-5 h-5" />
                          Issue Items
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Request</h3>
                      <p className="text-gray-600">Choose an approved request from the list to issue items.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
