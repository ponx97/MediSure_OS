
import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User, Role } from '../types';
import { Search, UserPlus, Shield, Mail, Trash2, Edit2, Loader2 } from 'lucide-react';

const SystemUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'AGENT' as Role
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await userService.getAll();
    setUsers(data);
    setLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await userService.delete(id);
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const userToSave: User = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      avatarUrl: editingUser?.avatarUrl || `https://ui-avatars.com/api/?name=${formData.name}`
    };

    const saved = await userService.save(userToSave);
    
    if (saved) {
      if (editingUser) {
        setUsers(users.map(u => u.id === saved.id ? saved : u));
      } else {
        setUsers([saved, ...users]);
      }
    }
    
    setLoading(false);
    closeModal();
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'AGENT' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">System Users</h2>
          <p className="text-sm text-gray-500">Manage internal users, roles and permissions.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && users.length === 0 ? (
             <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600"/></div>
          ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img 
                        src={user.avatarUrl} 
                        alt="" 
                        className="h-10 w-10 rounded-full bg-gray-200 object-cover"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Shield className={`h-4 w-4 mr-2 ${
                        user.role === 'ADMIN' ? 'text-purple-500' :
                        user.role === 'PROVIDER' ? 'text-blue-500' :
                        user.role === 'AGENT' ? 'text-teal-500' : 'text-gray-400'
                      }`} />
                      <span className="capitalize">{user.role.toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => openModal(user)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as Role})}
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="AGENT">Agent / Broker</option>
                  <option value="PROVIDER">Healthcare Provider</option>
                  <option value="MEMBER">Member (Read Only)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex justify-center items-center"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemUsers;
