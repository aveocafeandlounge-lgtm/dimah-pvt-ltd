import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Building2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isDemoMode } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (isDemoMode) {
      // Demo mode - use local authentication
      if (login(email)) {
        navigate('/dashboard');
      } else {
        setError('Invalid email or user not active');
      }
    } else {
      // Firebase mode - use Firebase authentication
      if (!password) {
        setError('Please enter your password');
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      }
    }
  };

  const demoUsers = [
    { email: 'admin@dimah.mv', role: 'Super Admin', name: 'Ahmed Mohamed' },
    { email: 'inventory@dimah.mv', role: 'Inventory Manager', name: 'Fatima Ali' },
    { email: 'head.finance@dimah.mv', role: 'Approver (Finance)', name: 'Ibrahim Hassan' },
    { email: 'head.it@dimah.mv', role: 'Approver (IT)', name: 'Aisha Ahmed' },
    { email: 'staff1@dimah.mv', role: 'Staff (Finance)', name: 'Mohamed Niyaz' },
    { email: 'staff2@dimah.mv', role: 'Staff (IT)', name: 'Sarah Ali' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dimah PVT LTD</h1>
            <p className="text-gray-600 mt-2">Office Inventory Management System</p>
            <span className="inline-block mt-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              Demo Mode
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your email"
              />
            </div>

            {!isDemoMode && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your password"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">Demo Users (any password):</p>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => {
                    setEmail(user.email);
                    if (login(user.email)) {
                      navigate('/dashboard');
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-gray-600">{user.email}</div>
                  <div className="text-blue-600 text-xs">{user.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          © 2026 Dimah PVT LTD. All rights reserved.
        </p>
      </div>
    </div>
  );
}
