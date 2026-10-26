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
  const [isDemoMode, _setIsDemoMode] = useState(false);
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
      // Load data from Firestore on mount
      const loadFirestoreData = async () => {
        try {
          const [inventorySnap, categoriesSnap, suppliersSnap, departmentsSnap, staffSnap, requestsSnap, receiptsSnap, issuesSnap, transactionsSnap] = await Promise.all([
            getDocs(collection(db, 'inventory')),
            getDocs(collection(db, 'categories')),
            getDocs(collection(db, 'suppliers')),
            getDocs(collection(db, 'departments')),
            getDocs(collection(db, 'staff')),
            getDocs(collection(db, 'stockRequests')),
            getDocs(collection(db, 'stockReceipts')),
            getDocs(collection(db, 'stockIssues')),
            getDocs(collection(db, 'stockTransactions')),
          ]);

          setInventoryItems(inventorySnap.docs.map(doc => doc.data() as InventoryItem));
          setCategories(categoriesSnap.docs.map(doc => doc.data() as Category));
          setSuppliers(suppliersSnap.docs.map(doc => doc.data() as Supplier));
          setDepartments(departmentsSnap.docs.map(doc => doc.data() as Department));
          setStaff(staffSnap.docs.map(doc => doc.data() as Staff));
          setStockRequests(requestsSnap.docs.map(doc => doc.data() as StockRequest));
          setStockReceipts(receiptsSnap.docs.map(doc => doc.data() as StockReceipt));
          setStockIssues(issuesSnap.docs.map(doc => doc.data() as StockIssue));
          setStockTransactions(transactionsSnap.docs.map(doc => doc.data() as StockTransaction));
        } catch (error) {
          console.error('Error loading Firestore data:', error);
        }
      };

      loadFirestoreData();

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
      try {
        await setDoc(doc(db, 'inventory', item.id), item);
        console.log('Item saved to Firestore:', item.id);
      } catch (error) {
        console.error('Error saving item to Firestore:', error);
        throw error;
      }
    }
    setInventoryItems(prev => [...prev, item]);
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!isDemoMode) {
      try {
        await updateDoc(doc(db, 'inventory', id), { ...updates, updatedAt: new Date() });
        console.log('Item updated in Firestore:', id);
      } catch (error) {
        console.error('Error updating item in Firestore:', error);
        throw error;
      }
    }
    setInventoryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item));
  };

  const deleteInventoryItem = async (id: string) => {
    if (!isDemoMode) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        console.log('Item deleted from Firestore:', id);
      } catch (error) {
        console.error('Error deleting item from Firestore:', error);
        throw error;
      }
    }
    setInventoryItems(prev => prev.filter(item => item.id !== id));
  };

  const addStockRequest = async (request: StockRequest) => {
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, 'stockRequests', request.id), request);
        console.log('Stock request saved to Firestore:', request.id);
      } catch (error) {
        console.error('Error saving stock request to Firestore:', error);
        throw error;
      }
    }
    setStockRequests(prev => [...prev, request]);
  };

  const updateStockRequest = async (id: string, updates: Partial<StockRequest>) => {
    if (!isDemoMode) {
      try {
        await updateDoc(doc(db, 'stockRequests', id), { ...updates, updatedAt: new Date() });
        console.log('Stock request updated in Firestore:', id);
      } catch (error) {
        console.error('Error updating stock request in Firestore:', error);
        throw error;
      }
    }
    setStockRequests(prev => prev.map(req => req.id === id ? { ...req, ...updates, updatedAt: new Date() } : req));
  };

  const deleteStockRequest = async (id: string) => {
    if (!isDemoMode) {
      try {
        await deleteDoc(doc(db, 'stockRequests', id));
        console.log('Stock request deleted from Firestore:', id);
      } catch (error) {
        console.error('Error deleting stock request from Firestore:', error);
        throw error;
      }
    }
    setStockRequests(prev => prev.filter(req => req.id !== id));
  };

  const addStockReceipt = async (receipt: StockReceipt) => {
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, 'stockReceipts', receipt.id), receipt);
        console.log('Stock receipt saved to Firestore:', receipt.id);
      } catch (error) {
        console.error('Error saving stock receipt to Firestore:', error);
        throw error;
      }
    }
    setStockReceipts(prev => [...prev, receipt]);
  };

  const updateStockReceipt = async (id: string, updates: Partial<StockReceipt>) => {
    if (!isDemoMode) {
      try {
        await updateDoc(doc(db, 'stockReceipts', id), updates);
        console.log('Stock receipt updated in Firestore:', id);
      } catch (error) {
        console.error('Error updating stock receipt in Firestore:', error);
        throw error;
      }
    }
    setStockReceipts(prev => prev.map(receipt => receipt.id === id ? { ...receipt, ...updates } : receipt));
  };

  const deleteStockReceipt = async (id: string) => {
    if (!isDemoMode) {
      try {
        await deleteDoc(doc(db, 'stockReceipts', id));
        console.log('Stock receipt deleted from Firestore:', id);
      } catch (error) {
        console.error('Error deleting stock receipt from Firestore:', error);
        throw error;
      }
    }
    setStockReceipts(prev => prev.filter(receipt => receipt.id !== id));
  };

  const addStockIssue = async (issue: StockIssue) => {
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, 'stockIssues', issue.id), issue);
        console.log('Stock issue saved to Firestore:', issue.id);
      } catch (error) {
        console.error('Error saving stock issue to Firestore:', error);
        throw error;
      }
    }
    setStockIssues(prev => [...prev, issue]);
  };

  const addStockTransaction = async (transaction: StockTransaction) => {
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, 'stockTransactions', transaction.id), transaction);
        console.log('Stock transaction saved to Firestore:', transaction.id);
      } catch (error) {
        console.error('Error saving stock transaction to Firestore:', error);
        throw error;
      }
    }
    setStockTransactions(prev => [...prev, transaction]);
  };

  const addCategory = async (category: Category) => {
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, 'categories', category.id), category);
        console.log('Category saved to Firestore:', category.id);
      } catch (error) {
        console.error('Error saving category to Firestore:', error);
        throw error;
      }
    }
    setCategories(prev => [...prev, category]);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!isDemoMode) {
      try {
        await updateDoc(doc(db, 'categories', id), { ...updates, updatedAt: new Date() });
        console.log('Category updated in Firestore:', id);
      } catch (error) {
        console.error('Error updating category in Firestore:', error);
        throw error;
      }
    }
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates, updatedAt: new Date() } : cat));
  };

  const deleteCategory = async (id: string) => {
    if (!isDemoMode) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        console.log('Category deleted from Firestore:', id);
      } catch (error) {
        console.error('Error deleting category from Firestore:', error);
        throw error;
      }
    }
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const addSupplier = async (supplier: Supplier) => {
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, 'suppliers', supplier.id), supplier);
        console.log('Supplier saved to Firestore:', supplier.id);
      } catch (error) {
        console.error('Error saving supplier to Firestore:', error);
        throw error;
      }
    }
    setSuppliers(prev => [...prev, supplier]);
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!isDemoMode) {
      try {
        await updateDoc(doc(db, 'suppliers', id), { ...updates, updatedAt: new Date() });
        console.log('Supplier updated in Firestore:', id);
      } catch (error) {
        console.error('Error updating supplier in Firestore:', error);
        throw error;
      }
    }
    setSuppliers(prev => prev.map(supp => supp.id === id ? { ...supp, ...updates, updatedAt: new Date() } : supp));
  };

  const deleteSupplier = async (id: string) => {
    if (!isDemoMode) {
      try {
        await deleteDoc(doc(db, 'suppliers', id));
        console.log('Supplier deleted from Firestore:', id);
      } catch (error) {
        console.error('Error deleting supplier from Firestore:', error);
        throw error;
      }
    }
    setSuppliers(prev => prev.filter(supp => supp.id !== id));
  };

  const addDepartment = async (department: Department) => {
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, 'departments', department.id), department);
        console.log('Department saved to Firestore:', department.id);
      } catch (error) {
        console.error('Error saving department to Firestore:', error);
        throw error;
      }
    }
    setDepartments(prev => [...prev, department]);
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    if (!isDemoMode) {
      try {
        await updateDoc(doc(db, 'departments', id), { ...updates, updatedAt: new Date() });
        console.log('Department updated in Firestore:', id);
      } catch (error) {
        console.error('Error updating department in Firestore:', error);
        throw error;
      }
    }
    setDepartments(prev => prev.map(dept => dept.id === id ? { ...dept, ...updates, updatedAt: new Date() } : dept));
  };

  const deleteDepartment = async (id: string) => {
    if (!isDemoMode) {
      try {
        await deleteDoc(doc(db, 'departments', id));
        console.log('Department deleted from Firestore:', id);
      } catch (error) {
        console.error('Error deleting department from Firestore:', error);
        throw error;
      }
    }
    setDepartments(prev => prev.filter(dept => dept.id !== id));
  };

  const addStaff = async (staffMember: Staff) => {
    if (!isDemoMode) {
      try {
        await setDoc(doc(db, 'staff', staffMember.id), staffMember);
        console.log('Staff saved to Firestore:', staffMember.id);
      } catch (error) {
        console.error('Error saving staff to Firestore:', error);
        throw error;
      }
    }
    setStaff(prev => [...prev, staffMember]);
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    if (!isDemoMode) {
      try {
        await updateDoc(doc(db, 'staff', id), { ...updates, updatedAt: new Date() });
        console.log('Staff updated in Firestore:', id);
      } catch (error) {
        console.error('Error updating staff in Firestore:', error);
        throw error;
      }
    }
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s));
  };

  const deleteStaff = async (id: string) => {
    if (!isDemoMode) {
      try {
        await deleteDoc(doc(db, 'staff', id));
        console.log('Staff deleted from Firestore:', id);
      } catch (error) {
        console.error('Error deleting staff from Firestore:', error);
        throw error;
      }
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
