
import React, { useState, useEffect } from 'react';
import { policyService } from '../services/policyService';
import { Benefit, BenefitLimitType } from '../types';
import { Search, Plus, Edit2, Trash2, Gift, Hash, Percent, DollarSign, X, Loader2 } from 'lucide-react';

const Benefits: React.FC = () => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Omit<Benefit, 'id'>>({
    name: '',
    description: '',
    limitType: 'Amount',
  });

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    setLoading(true);
    const data = await policyService.getBenefits();
    setBenefits(data);
    setLoading(false);
  };

  const filteredBenefits = benefits.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this benefit?')) {
      await policyService.deleteBenefit(id);
      setBenefits(benefits.filter(b => b.id !== id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const benefitToSave: Benefit = {
      id: editingBenefit ? editingBenefit.id : `BEN-${Date.now()}`,
      ...formData
    };

    await policyService.saveBenefit(benefitToSave);
    
    if (editingBenefit) {
      setBenefits(benefits.map(b => b.id === benefitToSave.id ? benefitToSave : b));
    } else {
      setBenefits([...benefits, benefitToSave]);
    }
    
    setLoading(false);
    closeModal();
  };

  const openModal = (benefit?: Benefit) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setFormData({ 
        name: benefit.name, 
        description: benefit.description, 
        limitType: benefit.limitType, 
      });
    } else {
      setEditingBenefit(null);
      setFormData({ name: '', description: '', limitType: 'Amount' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBenefit(null);
  };

  const getLimitIcon = (type: BenefitLimitType) => {
    switch (type) {
      case 'Amount': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'Percentage': return <Percent className="h-4 w-4 text-blue-500" />;
      case 'Count': return <Hash className="h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Benefits Catalog</h2>
          <p className="text-sm text-gray-500">Define benefit types here. Values are assigned per Policy.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Benefit Type
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search benefits..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && benefits.length === 0 ? (
             <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600"/></div>
          ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Benefit Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Measurement Unit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBenefits.map((benefit) => (
                <tr key={benefit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-teal-50 rounded-lg mr-3">
                        <Gift className="h-4 w-4 text-teal-600" />
                      </div>
                      <span className="font-medium text-gray-900">{benefit.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={benefit.description}>
                    {benefit.description}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                       {getLimitIcon(benefit.limitType)}
                       <span>{benefit.limitType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => openModal(benefit)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(benefit.id)}
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
          {!loading && filteredBenefits.length === 0 && (
             <div className="p-8 text-center text-gray-500">
               No benefits found.
             </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingBenefit ? 'Edit Benefit Type' : 'Add New Benefit Type'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Benefit Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. General Checkup"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe what this benefit covers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Unit (Limit Type)</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  value={formData.limitType}
                  onChange={e => setFormData({...formData, limitType: e.target.value as BenefitLimitType})}
                >
                  <option value="Amount">Amount ($)</option>
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Count">Count (Visits/Qty)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Note: The actual numeric limit value is set when configuring a Policy.
                </p>
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
                  Save Benefit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Benefits;
