
import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User } from '../types';
import { ShieldCheck, Activity, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await userService.getAll();
      setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

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
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Select Role to Demo</h2>
        
        {loading ? (
           <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
        ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all group"
            >
              <div className="flex items-center">
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="h-10 w-10 rounded-full bg-gray-200 object-cover"
                />
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-teal-900">{user.name}</p>
                  <p className="text-xs text-gray-500 group-hover:text-teal-700 capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-gray-300 group-hover:text-teal-500" />
            </button>
          ))}
        </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>This is a frontend demo.</p>
          <p>No real authentication is performed.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
