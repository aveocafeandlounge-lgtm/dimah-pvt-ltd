// User Roles
export type UserRole = 'super_admin' | 'inventory_manager' | 'inventory_clerk' | 'approver' | 'staff';

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  employeeId?: string;
  isActive: boolean;
  createdAt: Date;
}

// Department
export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Staff
export interface Staff {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Category
export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Unit of Measurement
export type Unit = 'piece' | 'box' | 'pack' | 'ream' | 'bottle' | 'roll' | 'set' | 'carton' | 'kilogram' | 'litre' | 'other';

// Inventory Item
export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  unit: Unit;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderQuantity: number;
  storageLocation?: string;
  supplier?: string;
  unitCost: number;
  imageUrl?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Supplier
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Stock Receipt
export interface StockReceipt {
  id: string;
  receiptNumber: string;
  dateReceived: Date;
  supplier: string;
  invoiceNumber?: string;
  items: StockReceiptItem[];
  receivedBy: string;
  remarks?: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface StockReceiptItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  storageLocation?: string;
}

// Stock Request
export type RequestStatus = 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'partially_approved' | 'rejected' | 'ready_for_collection' | 'partially_issued' | 'issued' | 'completed' | 'cancelled';

export interface StockRequest {
  id: string;
  requestNumber: string;
  requestingStaff: string;
  requesterName: string;
  employeeId: string;
  department: string;
  requestDate: Date;
  requiredDate: Date;
  items: StockRequestItem[];
  purpose: string;
  priority: 'low' | 'medium' | 'high';
  additionalNotes?: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockRequestItem {
  itemId: string;
  itemName: string;
  availableStock: number;
  requestedQuantity: number;
  approvedQuantity?: number;
  issuedQuantity?: number;
  status?: RequestStatus;
}

// Approval
export interface Approval {
  id: string;
  requestId: string;
  approverId: string;
  approverName: string;
  decision: 'approved' | 'rejected' | 'partially_approved';
  comments?: string;
  rejectionReason?: string;
  approvedItems?: { itemId: string; approvedQuantity: number }[];
  createdAt: Date;
}

// Stock Issue
export interface StockIssue {
  id: string;
  issueNumber: string;
  requestId: string;
  requestNumber: string;
  recipientName: string;
  employeeId: string;
  department: string;
  items: StockIssueItem[];
  issuedBy: string;
  issueDate: Date;
  remarks?: string;
  recipientConfirmed?: boolean;
  confirmedAt?: Date;
  createdAt: Date;
}

export interface StockIssueItem {
  itemId: string;
  itemName: string;
  approvedQuantity: number;
  issuedQuantity: number;
  unit: Unit;
}

// Stock Transaction
export type TransactionType = 'opening_balance' | 'stock_received' | 'stock_issued' | 'staff_return' | 'supplier_return' | 'damage' | 'write_off' | 'adjustment';

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  transactionType: TransactionType;
  referenceNumber: string;
  quantityIn: number;
  quantityOut: number;
  balanceAfter: number;
  userId: string;
  userName: string;
  reason?: string;
  createdAt: Date;
}

// Stock Return
export interface StockReturn {
  id: string;
  returnNumber: string;
  itemId: string;
  itemName: string;
  quantity: number;
  returnReason: string;
  condition: 'reusable' | 'damaged' | 'unsuitable';
  returnedBy: string;
  approvedBy?: string;
  remarks?: string;
  createdAt: Date;
}

// Stock Adjustment
export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  itemId: string;
  itemName: string;
  previousQuantity: number;
  newQuantity: number;
  adjustmentType: 'increase' | 'decrease';
  reason: string;
  approvedBy: string;
  remarks?: string;
  createdAt: Date;
}

// Notification
export type NotificationType = 'request_submitted' | 'approval_required' | 'request_approved' | 'request_rejected' | 'items_ready' | 'items_issued' | 'low_stock' | 'out_of_stock' | 'stock_received';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: Date;
}

// Audit Log
export type AuditAction = 'login' | 'item_created' | 'item_updated' | 'stock_received' | 'request_submitted' | 'request_approved' | 'request_rejected' | 'stock_issued' | 'stock_returned' | 'stock_adjusted' | 'user_created' | 'user_updated' | 'permission_changed';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  affectedRecord?: string;
  recordId?: string;
  details?: string;
  reason?: string;
  timestamp: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingRequests: number;
  awaitingApproval: number;
  readyForIssue: number;
  issuedToday: number;
  receivedThisMonth: number;
}

// Report Filters
export interface ReportFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  category?: string;
  item?: string;
  department?: string;
  employee?: string;
  supplier?: string;
  transactionType?: TransactionType;
  requestStatus?: RequestStatus;
}
