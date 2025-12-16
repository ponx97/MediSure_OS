
import React, { useState, useEffect } from 'react';
import { claimService } from '../services/claimService';
import { memberService } from '../services/memberService';
import { Claim, Member } from '../types';
import { analyzeClaim } from '../services/geminiService';
import { Search, AlertTriangle, CheckCircle, XCircle, Bot, Loader2 } from 'lucide-react';

const Claims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    const data = await claimService.getAll();
    setClaims(data);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!selectedClaim) return;
    setAiLoading(true);
    setAiResult(null);
    
    let context = "No member history available.";
    
    // Find member to pass context - fetches live data now
    if (selectedClaim.memberId) {
        // In a real app we'd have a getById method, for now we filter the getAll list which is cached or we mock it if empty
        const members = await memberService.getAll();
        const member = members.find(m => m.id === selectedClaim.memberId);
        if (member) {
            context = `Member Status: ${member.status}. Age: ${new Date().getFullYear() - new Date(member.dob).getFullYear()} (Est).`;
        }
    }

    const result = await analyzeClaim(selectedClaim, context);
    setAiResult(result);
    setAiLoading(false);
  };

  const updateClaimStatus = async (status: 'Approved' | 'Rejected') => {
      if (!selectedClaim) return;
      await claimService.updateStatus(selectedClaim.id, status, { approvedBy: 'Admin' }); // Hardcoded user for now
      
      // Update local state
      setClaims(claims.map(c => c.id === selectedClaim.id ? { ...c, status, approvedBy: 'Admin' } : c));
      setSelectedClaim({ ...selectedClaim, status, approvedBy: 'Admin' });
  };

  const getStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600"/></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* List Section */}
      <div className={`${selectedClaim ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Claims Queue</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search claims..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {claims.map((claim) => (
            <div 
              key={claim.id}
              onClick={() => { setSelectedClaim(claim); setAiResult(null); }}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedClaim?.id === claim.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white hover:border-teal-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-900">{claim.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(claim.status)}`}>
                  {claim.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-1">{claim.memberName}</div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>{claim.serviceDate}</span>
                <span className="font-bold text-gray-700">${claim.amountBilled.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Section */}
      {selectedClaim ? (
        <div className="flex-[2] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Claim Details</h2>
              <p className="text-sm text-gray-500">Processing claim for {selectedClaim.memberName}</p>
            </div>
            <button 
              onClick={() => setSelectedClaim(null)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Provider</label>
                  <div className="text-sm font-medium text-gray-900">{selectedClaim.providerName}</div>
                  <div className="text-xs text-gray-500">{selectedClaim.providerId}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Service Date</label>
                  <div className="text-sm font-medium text-gray-900">{selectedClaim.serviceDate}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Description</label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                    {selectedClaim.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase">Diagnosis (ICD-10)</label>
                    <div className="text-sm font-medium text-gray-900 font-mono bg-blue-50 px-2 py-1 inline-block rounded">{selectedClaim.diagnosisCode}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase">Procedure</label>
                    <div className="text-sm font-medium text-gray-900 font-mono bg-purple-50 px-2 py-1 inline-block rounded">{selectedClaim.procedureCode}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-teal-800">Billed Amount</span>
                    <span className="text-lg font-bold text-teal-900">${selectedClaim.amountBilled.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-teal-800">Approved Amount</span>
                    <span className="text-lg font-bold text-teal-900">${(selectedClaim.amountApproved || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">AI Adjudicator Insights</h3>
                </div>
                {!aiResult && (
                  <button 
                    onClick={handleAnalyze}
                    disabled={aiLoading}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {aiLoading ? 'Analyzing...' : 'Generate Analysis'}
                  </button>
                )}
              </div>

              {aiResult && (
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                   <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-medium">
                     {aiResult}
                   </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => updateClaimStatus('Approved')}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex justify-center items-center shadow-sm"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Approve Claim
              </button>
              <button 
                onClick={() => updateClaimStatus('Rejected')}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex justify-center items-center shadow-sm"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Reject Claim
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex justify-center items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Flag for Review
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-[2] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 items-center justify-center text-gray-400">
          Select a claim to view details
        </div>
      )}
    </div>
  );
};

export default Claims;
