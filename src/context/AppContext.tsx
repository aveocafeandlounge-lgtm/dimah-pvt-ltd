import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, InventoryItem, StockRequest, StockReceipt, StockIssue, StockTransaction, Department, Staff, Category, Supplier } from '../types';
import { demoUsers, demoInventoryItems, demoStockRequests, demoStockReceipts, demoStockIssues, demoStockTransactions, demoDepartments, demoStaff, demoCategories, demoSuppliers } from '../utils/demoData';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

interface AppContextType {
  isDemoMode: boolean;
  currentUser: User | null;
  users: User[];
  inventoryItems: InventoryItem[];
  stockRequests: StockRequest[];
  stockReceipts: StockReceipt[];
  stockIssues: StockIssue[];
  stockTransactions: StockTransaction[];
  departments: Department[];
  staff: Staff[];
  categories: Category[];
  suppliers: Supplier[];
  login: (email: string) => boolean;
  logout: () => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addStockRequest: (request: StockRequest) => Promise<void>;
  updateStockRequest: (id: string, request: Partial<StockRequest>) => Promise<void>;
  deleteStockRequest: (id: string) => Promise<void>;
  addStockReceipt: (receipt: StockReceipt) => Promise<void>;
  updateStockReceipt: (id: string, receipt: Partial<StockReceipt>) => Promise<void>;
  deleteStockReceipt: (id: string) => Promise<void>;
  addStockIssue: (issue: StockIssue) => Promise<void>;
  addStockTransaction: (transaction: StockTransaction) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addDepartment: (department: Department) => Promise<void>;
  updateDepartment: (id: string, department: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addStaff: (staffMember: Staff) => Promise<void>;
  updateStaff: (id: string, staffMember: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, _setIsDemoMode] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, _setUsers] = useState<User[]>(demoUsers);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(demoInventoryItems);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>(demoStockRequests);
  const [stockReceipts, setStockReceipts] = useState<StockReceipt[]>(demoStockReceipts);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>(demoStockIssues);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(demoStockTransactions);
  const [departments, setDepartments] = useState<Department[]>(demoDepartments);
  const [staff, setStaff] = useState<Staff[]>(demoStaff);
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [suppliers, setSuppliers] = useState<Supplier[]>(demoSuppliers);

  // Load from localStorage on mount (demo mode) or Firebase auth
  useEffect(() => {
    if (isDemoMode) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } else {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch user data from Firestore
          const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', firebaseUser.email)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data() as User;
            setCurrentUser(userData);
          }
        } else {
          setCurrentUser(null);
        }
      });
      return () => unsubscribe();
    }
  }, [isDemoMode]);

  const login = (email: string): boolean => {
    // In demo mode, accept any password for demo users
    const user = users.find(u => u.email === email);
    if (user && user.isActive) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (!isDemoMode) {
      await auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const addInventoryItem = async (item: InventoryItem) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'inventory', item.id), item);
    }
    setInventoryItems(prev => [...prev, item]);
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!isDemoMode) {
      await updateDoc(doc(db, 'inventory', id), { ...updates, updatedAt: new Date() });
    }
    setInventoryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item));
  };

  const deleteInventoryItem = async (id: string) => {
    if (!isDemoMode) {
      await deleteDoc(doc(db, 'inventory', id));
    }
    setInventoryItems(prev => prev.filter(item => item.id !== id));
  };

  const addStockRequest = async (request: StockRequest) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'stockRequests', request.id), request);
    }
    setStockRequests(prev => [...prev, request]);
  };

  const updateStockRequest = async (id: string, updates: Partial<StockRequest>) => {
    if (!isDemoMode) {
      await updateDoc(doc(db, 'stockRequests', id), { ...updates, updatedAt: new Date() });
    }
    setStockRequests(prev => prev.map(req => req.id === id ? { ...req, ...updates, updatedAt: new Date() } : req));
  };

  const deleteStockRequest = async (id: string) => {
    if (!isDemoMode) {
      await deleteDoc(doc(db, 'stockRequests', id));
    }
    setStockRequests(prev => prev.filter(req => req.id !== id));
  };

  const addStockReceipt = async (receipt: StockReceipt) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'stockReceipts', receipt.id), receipt);
    }
    setStockReceipts(prev => [...prev, receipt]);
  };

  const updateStockReceipt = async (id: string, updates: Partial<StockReceipt>) => {
    if (!isDemoMode) {
      await updateDoc(doc(db, 'stockReceipts', id), updates);
    }
    setStockReceipts(prev => prev.map(receipt => receipt.id === id ? { ...receipt, ...updates } : receipt));
  };

  const deleteStockReceipt = async (id: string) => {
    if (!isDemoMode) {
      await deleteDoc(doc(db, 'stockReceipts', id));
    }
    setStockReceipts(prev => prev.filter(receipt => receipt.id !== id));
  };

  const addStockIssue = async (issue: StockIssue) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'stockIssues', issue.id), issue);
    }
    setStockIssues(prev => [...prev, issue]);
  };

  const addStockTransaction = async (transaction: StockTransaction) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'stockTransactions', transaction.id), transaction);
    }
    setStockTransactions(prev => [...prev, transaction]);
  };

  const addCategory = async (category: Category) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'categories', category.id), category);
    }
    setCategories(prev => [...prev, category]);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!isDemoMode) {
      await updateDoc(doc(db, 'categories', id), { ...updates, updatedAt: new Date() });
    }
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates, updatedAt: new Date() } : cat));
  };

  const deleteCategory = async (id: string) => {
    if (!isDemoMode) {
      await deleteDoc(doc(db, 'categories', id));
    }
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const addSupplier = async (supplier: Supplier) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'suppliers', supplier.id), supplier);
    }
    setSuppliers(prev => [...prev, supplier]);
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!isDemoMode) {
      await updateDoc(doc(db, 'suppliers', id), { ...updates, updatedAt: new Date() });
    }
    setSuppliers(prev => prev.map(supp => supp.id === id ? { ...supp, ...updates, updatedAt: new Date() } : supp));
  };

  const deleteSupplier = async (id: string) => {
    if (!isDemoMode) {
      await deleteDoc(doc(db, 'suppliers', id));
    }
    setSuppliers(prev => prev.filter(supp => supp.id !== id));
  };

  const addDepartment = async (department: Department) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'departments', department.id), department);
    }
    setDepartments(prev => [...prev, department]);
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    if (!isDemoMode) {
      await updateDoc(doc(db, 'departments', id), { ...updates, updatedAt: new Date() });
    }
    setDepartments(prev => prev.map(dept => dept.id === id ? { ...dept, ...updates, updatedAt: new Date() } : dept));
  };

  const deleteDepartment = async (id: string) => {
    if (!isDemoMode) {
      await deleteDoc(doc(db, 'departments', id));
    }
    setDepartments(prev => prev.filter(dept => dept.id !== id));
  };

  const addStaff = async (staffMember: Staff) => {
    if (!isDemoMode) {
      await setDoc(doc(db, 'staff', staffMember.id), staffMember);
    }
    setStaff(prev => [...prev, staffMember]);
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    if (!isDemoMode) {
      await updateDoc(doc(db, 'staff', id), { ...updates, updatedAt: new Date() });
    }
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s));
  };

  const deleteStaff = async (id: string) => {
    if (!isDemoMode) {
      await deleteDoc(doc(db, 'staff', id));
    }
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        isDemoMode,
        currentUser,
        users,
        inventoryItems,
        stockRequests,
        stockReceipts,
        stockIssues,
        stockTransactions,
        departments,
        staff,
        categories,
        suppliers,
        login,
        logout,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addStockRequest,
        updateStockRequest,
        deleteStockRequest,
        addStockReceipt,
        updateStockReceipt,
        deleteStockReceipt,
        addStockIssue,
        addStockTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addStaff,
        updateStaff,
        deleteStaff,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
