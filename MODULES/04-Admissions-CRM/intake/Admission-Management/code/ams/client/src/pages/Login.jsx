import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DEMO_LOGINS = [
  { role: 'Admin', email: 'admin@wiswits.test' },
  { role: 'Admission Officer', email: 'officer@wiswits.test' },
  { role: 'Counselor', email: 'counselor@wiswits.test' },
  { role: 'Panelist', email: 'panelist1@wiswits.test' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@wiswits.test');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1c3f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center mb-3">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">WisWits AMS</h1>
          <p className="text-sm text-gray-500">Admission Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Demo logins (password: Password@123)</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_LOGINS.map((d) => (
              <button
                key={d.email}
                onClick={() => {
                  setEmail(d.email);
                  setPassword('Password@123');
                }}
                className="text-left text-xs px-2.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <p className="font-medium text-gray-700">{d.role}</p>
                <p className="text-gray-400 truncate">{d.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
