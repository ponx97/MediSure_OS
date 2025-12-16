
import React, { useState, useEffect } from 'react';
import { policyService } from '../services/policyService';
import { Shield, Check, MessageSquare, Plus, X, Save, FileText, Layers, List, Loader2 } from 'lucide-react';
import { chatWithPolicyAdvisor } from '../services/geminiService';
import { Benefit, Policy, PolicyBenefitLink } from '../types';

const Policies: React.FC = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // 0: Scheme, 1: Premium, 2: Benefits
    const [formData, setFormData] = useState<Partial<Policy>>({
        name: '',
        currency: 'USD',
        premium: { adult: 0, child: 0, senior: 0 },
        coverageLimit: 0,
        type: 'Silver',
        benefits: [],
        features: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setPageLoading(true);
        const [pol, ben] = await Promise.all([
            policyService.getPolicies(),
            policyService.getBenefits()
        ]);
        setPolicies(pol);
        setBenefits(ben);
        setPageLoading(false);
    };

    const handleAsk = async () => {
        if (!query) return;
        setLoading(true);
        // Concatenate all policies for context
        const context = policies.map(p => `${p.name} (${p.currency}): Limit ${p.coverageLimit}, Premium(Adult) ${p.premium.adult}, Features: ${p.features.join(', ')}`).join('\n');
        
        const response = await chatWithPolicyAdvisor(query, context);
        setAnswer(response);
        setLoading(false);
    }

    const getBenefitDetails = (benefitId: string): Benefit | undefined => {
      return benefits.find(b => b.id === benefitId);
    };

    const formatLimit = (limit: number, type?: string) => {
      if (type === 'Amount') return `$${limit.toLocaleString()}`;
      if (type === 'Percentage') return `${limit}%`;
      return `${limit} Visits/Qty`;
    };

    const handleSavePolicy = async () => {
       if (!formData.name) return alert("Policy Name is required");
       
       const newPolicy: Policy = {
           id: `POL-${Date.now()}`,
           name: formData.name,
           currency: formData.currency || 'USD',
           type: formData.type || 'Silver',
           coverageLimit: formData.coverageLimit || 0,
           copay: 0, // Default
           premium: formData.premium || { adult: 0, child: 0, senior: 0 },
           features: formData.features || [],
           benefits: formData.benefits || []
       };

       setLoading(true);
       await policyService.savePolicy(newPolicy);
       await loadData();
       setLoading(false);
       
       setIsModalOpen(false);
       setFormData({ name: '', currency: 'USD', premium: { adult: 0, child: 0, senior: 0 }, coverageLimit: 0, type: 'Silver', benefits: [], features: [] });
       setActiveTab(0);
    };

    const toggleBenefit = (benefitId: string) => {
        const currentBenefits = formData.benefits || [];
        const exists = currentBenefits.find(b => b.benefitId === benefitId);
        
        if (exists) {
            setFormData({ ...formData, benefits: currentBenefits.filter(b => b.benefitId !== benefitId) });
        } else {
            setFormData({ ...formData, benefits: [...currentBenefits, { benefitId, limit: 0 }] });
        }
    };

    const updateBenefitLimit = (benefitId: string, limit: number) => {
        const currentBenefits = formData.benefits || [];
        setFormData({
            ...formData,
            benefits: currentBenefits.map(b => b.benefitId === benefitId ? { ...b, limit } : b)
        });
    };

    const renderSchemeTab = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheme Name</label>
                <input 
                    type="text" 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Platinum Health Plus"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value as any})}
                >
                    <option value="USD">USD</option>
                    <option value="ZWG">ZWG</option>
                    <option value="ZAR">ZAR</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Coverage Limit</label>
                <input 
                    type="number" 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="0.00"
                    value={formData.coverageLimit}
                    onChange={(e) => setFormData({...formData, coverageLimit: Number(e.target.value)})}
                />
            </div>
        </div>
    );

    const renderPremiumTab = () => (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">Set the monthly premium amounts per member category.</p>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adult Premium ({formData.currency})</label>
                <input 
                    type="number" 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.premium?.adult}
                    onChange={(e) => setFormData({...formData, premium: { ...formData.premium!, adult: Number(e.target.value) }})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Child Premium ({formData.currency})</label>
                <input 
                    type="number" 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.premium?.child}
                    onChange={(e) => setFormData({...formData, premium: { ...formData.premium!, child: Number(e.target.value) }})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senior Premium ({formData.currency})</label>
                <input 
                    type="number" 
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.premium?.senior}
                    onChange={(e) => setFormData({...formData, premium: { ...formData.premium!, senior: Number(e.target.value) }})}
                />
            </div>
        </div>
    );

    const renderBenefitsTab = () => (
        <div className="flex flex-col h-[400px]">
            <div className="overflow-y-auto flex-1 border border-gray-200 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-center w-16">Include</th>
                            <th className="px-4 py-3">Benefit Name</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 w-40">Limit / Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {benefits.map(benefit => {
                            const isSelected = formData.benefits?.some(b => b.benefitId === benefit.id);
                            const currentLimit = formData.benefits?.find(b => b.benefitId === benefit.id)?.limit || 0;
                            
                            return (
                                <tr key={benefit.id} className={isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'}>
                                    <td className="px-4 py-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                                            checked={isSelected || false}
                                            onChange={() => toggleBenefit(benefit.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{benefit.name}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            Medical
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="relative rounded-md shadow-sm">
                                            <input 
                                                type="number" 
                                                className={`block w-full rounded-md border-gray-300 sm:text-sm p-1.5 focus:ring-teal-500 focus:border-teal-500 ${!isSelected && 'bg-gray-100 text-gray-400'}`}
                                                disabled={!isSelected}
                                                value={currentLimit}
                                                onChange={(e) => updateBenefitLimit(benefit.id, Number(e.target.value))}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-xs">
                                                    {benefit.limitType === 'Percentage' ? '%' : benefit.limitType === 'Amount' ? '' : 'Qty'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

  if (pageLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600"/></div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Insurance Plans</h2>
           <p className="text-gray-500">Manage and view available coverage options.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setChatOpen(!chatOpen)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
                <MessageSquare className="h-4 w-4 mr-2" />
                Policy Assistant
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
            </button>
        </div>
      </div>

      {chatOpen && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-semibold text-gray-800 mb-2">Ask AI about policies</h3>
              <div className="flex gap-2 mb-4">
                  <input 
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Which plan covers dental?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  />
                  <button 
                    disabled={loading}
                    onClick={handleAsk}
                    className="bg-slate-900 text-white px-6 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
                  >
                      {loading ? 'Thinking...' : 'Ask'}
                  </button>
              </div>
              {answer && (
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm">
                      {answer}
                  </div>
              )}
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <div className={`h-2 w-full ${
              policy.type === 'Gold' ? 'bg-yellow-400' : 
              policy.type === 'Silver' ? 'bg-gray-300' : 'bg-orange-400'
            }`} />
            
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-xl font-bold text-gray-900">{policy.name}</h3>
                   <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{policy.type} Tier</span>
                </div>
                <Shield className={`h-8 w-8 ${
                    policy.type === 'Gold' ? 'text-yellow-400' : 
                    policy.type === 'Silver' ? 'text-gray-400' : 'text-orange-400'
                }`} />
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{policy.currency} {policy.premium.adult}</span>
                <span className="text-gray-500 ml-2">/mo (Adult)</span>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                 <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                     <span className="text-gray-600">Annual Limit</span>
                     <span className="font-semibold text-gray-900">{policy.currency} {policy.coverageLimit.toLocaleString()}</span>
                 </div>
                 
                 {/* Benefits Section */}
                 {policy.benefits && policy.benefits.length > 0 && (
                   <div className="pt-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Policy Benefits</p>
                      <ul className="space-y-2">
                          {policy.benefits.slice(0, 5).map((pb, idx) => {
                             const benefitDef = getBenefitDetails(pb.benefitId);
                             return (
                               <li key={idx} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center text-gray-700">
                                      <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                      <span className="truncate max-w-[140px]" title={benefitDef?.name}>{benefitDef?.name || 'Unknown'}</span>
                                  </div>
                                  <span className="font-medium text-gray-900 text-xs">
                                    {formatLimit(pb.limit, benefitDef?.limitType)}
                                  </span>
                               </li>
                             );
                          })}
                          {policy.benefits.length > 5 && (
                             <li className="text-xs text-blue-600 mt-2 text-center cursor-pointer">
                                + {policy.benefits.length - 5} more benefits
                             </li>
                          )}
                      </ul>
                   </div>
                 )}
              </div>

              <button className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors">
                  Edit Plan Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Policy Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900">Add New Policy Scheme</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="h-6 w-6" />
                      </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-100">
                      <button 
                        onClick={() => setActiveTab(0)}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 ${activeTab === 0 ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                         <div className="flex items-center justify-center">
                             <FileText className="h-4 w-4 mr-2" />
                             Scheme Details
                         </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab(1)}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 ${activeTab === 1 ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                         <div className="flex items-center justify-center">
                             <Layers className="h-4 w-4 mr-2" />
                             Premium Tier
                         </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab(2)}
                        className={`flex-1 py-4 text-sm font-medium border-b-2 ${activeTab === 2 ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                      >
                         <div className="flex items-center justify-center">
                             <List className="h-4 w-4 mr-2" />
                             Benefits & Eligibility
                         </div>
                      </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto flex-1">
                      {activeTab === 0 && renderSchemeTab()}
                      {activeTab === 1 && renderPremiumTab()}
                      {activeTab === 2 && renderBenefitsTab()}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                      <button 
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleSavePolicy}
                          className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                      >
                          <Save className="h-4 w-4 mr-2" />
                          Save Policy
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Policies;
