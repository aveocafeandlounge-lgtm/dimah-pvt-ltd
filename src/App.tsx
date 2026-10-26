import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Departments from './pages/Departments';
import Staff from './pages/Staff';
import ReceiveStock from './pages/ReceiveStock';
import RequestItems from './pages/RequestItems';
import Requests from './pages/Requests';
import Approvals from './pages/Approvals';
import IssueStock from './pages/IssueStock';
import StockLedger from './pages/StockLedger';
import Adjustments from './pages/Adjustments';
import Reports from './pages/Reports';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/stock/receive" element={<ReceiveStock />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/new" element={<RequestItems />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/stock/issue" element={<IssueStock />} />
          <Route path="/stock/ledger" element={<StockLedger />} />
          <Route path="/stock/adjustments" element={<Adjustments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
