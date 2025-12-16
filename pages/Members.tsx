
import React, { useState, useEffect } from 'react';
import { memberService } from '../services/memberService';
import { policyService } from '../services/policyService';
import { Member, User, Policy } from '../types';
import MemberForm from '../components/members/MemberForm';
import { Search, Filter, MoreHorizontal, UserPlus, Edit, Eye, Loader2, CheckSquare, Square, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface MembersProps {
  user: User;
}

const Members: React.FC<MembersProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(undefined);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, policiesData] = await Promise.all([
          memberService.getAll(),
          policyService.getPolicies()
      ]);
      setMembers(membersData);
      setPolicies(policiesData);
    } catch (error) {
      console.error("Failed to load members or policies", error);
    } finally {
      setLoading(false);
    }
  };

  const getPolicyName = (id: string) => policies.find(p => p.id === id)?.name || id;

  const filteredMembers = members.filter(m => 
    (m.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (m.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setSelectedMember(undefined);
    setViewMode('form');
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setViewMode('form');
  };

  const handleSaveMember = async (memberData: Member) => {
    try {
      setLoading(true);
      await memberService.save(memberData);
      await loadData(); // Reload list
      setViewMode('list');
    } catch (error) {
      alert("Error saving member. Please check console.");
    } finally {
      setLoading(false);
    }
  };

  // --- Bulk Selection Handlers ---

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          // Select all visible members
          setSelectedIds(filteredMembers.map(m => m.id));
      } else {
          setSelectedIds([]);
      }
  };

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleBulkStatusUpdate = async (status: 'Active' | 'Suspended') => {
      if (selectedIds.length === 0) return;
      if (!window.confirm(`Are you sure you want to set ${selectedIds.length} members to ${status}?`)) return;

      setIsBulkActionLoading(true);
      try {
          await memberService.bulkUpdateStatus(selectedIds, status);
          
          // Optimistic local update to avoid full reload delay visibility
          setMembers(prev => prev.map(m => selectedIds.includes(m.id) ? { ...m, status } : m));
          
          setSelectedIds([]);
      } catch (error) {
          alert("Failed to update status.");
      } finally {
          setIsBulkActionLoading(false);
      }
  };

  if (viewMode === 'form') {
    return (
      <MemberForm 
        initialMember={selectedMember} 
        onSave={handleSaveMember} 
        onCancel={() => setViewMode('list')} 
        currentUser={user}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">Membership Directory</h2>
        <button 
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar & Bulk Actions */}
        {selectedIds.length > 0 ? (
             <div className="p-4 bg-slate-900 text-white flex justify-between items-center animate-in slide-in-from-top-2">
                 <div className="flex items-center">
                     <span className="font-bold mr-4">{selectedIds.length} Selected</span>
                     <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white text-sm flex items-center">
                         <X className="h-4 w-4 mr-1"/> Clear
                     </button>
                 </div>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => handleBulkStatusUpdate('Active')}
                        disabled={isBulkActionLoading}
                        className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                     >
                        {isBulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldCheck className="h-4 w-4 mr-2" />}
                        Activate
                     </button>
                     <button 
                        onClick={() => handleBulkStatusUpdate('Suspended')}
                        disabled={isBulkActionLoading}
                        className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
                     >
                        {isBulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <ShieldAlert className="h-4 w-4 mr-2" />}
                        Suspend
                     </button>
                 </div>
             </div>
        ) : (
            <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                type="text" 
                placeholder="Search members by name or ID..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="flex items-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium">
                <Filter className="h-4 w-4 mr-2" />
                Filter
            </button>
            </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
             <div className="flex items-center justify-center h-64 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mr-3 text-teal-600" />
                Loading members...
             </div>
          ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-10">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        onChange={handleSelectAll}
                        checked={filteredMembers.length > 0 && selectedIds.length === filteredMembers.length}
                    />
                </th>
                <th className="px-6 py-4">Member ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Policy Plan</th>
                <th className="px-6 py-4">Join Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                return (
                    <tr key={member.id} className={`transition-colors group ${isSelected ? 'bg-teal-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                         <input 
                            type="checkbox" 
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            checked={isSelected}
                            onChange={() => handleSelectOne(member.id)}
                        />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{member.id}</td>
                    <td className="px-6 py-4">
                        <div>
                        <div className="font-medium text-gray-900">{member.firstName} {member.lastName}</div>
                        <div className="text-xs text-gray-500">{member.email || 'No email'}</div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'Active' ? 'bg-green-100 text-green-800' :
                        member.status === 'Suspended' ? 'bg-yellow-100 text-yellow-800' :
                        member.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                        }`}>
                        {member.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{getPolicyName(member.policyId)}</td>
                    <td className="px-6 py-4 text-gray-500">{member.joinDate}</td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleEdit(member)}
                            className="p-1 text-gray-400 hover:text-teal-600" title="Edit"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-blue-600" title="View Details">
                            <Eye className="h-4 w-4" />
                        </button>
                        </div>
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
          )}
          {!loading && filteredMembers.length === 0 && (
             <div className="p-8 text-center text-gray-500">
               No members found matching "{searchTerm}"
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;
