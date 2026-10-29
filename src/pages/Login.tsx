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
    console.log('Login attempt - Email:', email, 'Demo Mode:', isDemoMode);

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (isDemoMode) {
      console.log('Using demo mode login');
      // Demo mode - use local authentication
      if (login(email)) {
        console.log('Demo login successful');
        navigate('/dashboard');
      } else {
        console.error('Demo login failed');
        setError('Invalid email or user not active');
      }
    } else {
      console.log('Using Firebase authentication');
      // Firebase mode - use Firebase authentication
      if (!password) {
        setError('Please enter your password');
        return;
      }

      try {
        console.log('Attempting Firebase sign in with email:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Firebase sign in successful:', userCredential.user.email, userCredential.user.uid);
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Firebase sign in failed:', err);
        setError(err.message || 'Authentication failed');
      }
    }
  };

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
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          © 2026 Dimah PVT LTD. All rights reserved.
        </p>
      </div>
    </div>
  );
}
