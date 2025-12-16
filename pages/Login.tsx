import React, { useState } from 'react';
import { api } from '../services/api';
import { User, Role } from '../types';
import { ShieldCheck, Activity, Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

interface BackendUser {
  id: string;
  email: string;
  role: string;
}

interface LoginResponse {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError('Please enter both email and password.');
        return;
    }

    setLoading(true);
    setError('');

    try {
      // Cast response to expected structure from backend auth.controller.ts
      const response = await api.post('/auth/login', { email, password }) as LoginResponse;
      
      const { user, accessToken, refreshToken } = response;
      
      // Backend roles: ADMIN, STAFF, PROVIDER, MEMBER
      // Frontend roles: ADMIN, MEMBER, PROVIDER, AGENT
      // Map STAFF -> AGENT to ensure UI consistency
      let mappedRole = user.role as Role;
      if (user.role === 'STAFF') {
          mappedRole = 'AGENT';
      }

      // Enhance user object with defaults since backend only returns id, email, role
      const fullUser: User = {
          id: user.id,
          email: user.email,
          role: mappedRole,
          name: user.email.split('@')[0], // Fallback name generation
          avatarUrl: `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=0d9488&color=fff`,
      };

      // Store session
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(fullUser));

      onLogin(fullUser);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-md mb-4">
          <Activity className="h-10 w-10 text-teal-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">MediSure OS</h1>
        <p className="text-gray-500 mt-2">Secure Health Insurance Management System</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-800">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1">Access your dashboard</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
            </button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400">
            <ShieldCheck className="h-3 w-3" />
            <span>Secured by MediSure Auth</span>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400">
          <p>Default Admin: <strong>admin@medisure.co.zw</strong> / <strong>admin123</strong></p>
      </div>
    </div>
  );
};

export default Login;
