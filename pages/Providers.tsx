
import React, { useState, useEffect } from 'react';
import { MOCK_CONTRACTS } from '../services/mockData';
import { providerService } from '../services/providerService';
import { claimService } from '../services/claimService';
import { settingsService } from '../services/settingsService';
import { Provider, ProviderContract, Remittance, Claim, User, AuditLog, ProviderDiscipline } from '../types';
import { 
  Search, 
  Plus, 
  FileText, 
  DollarSign, 
  BriefcaseMedical, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download, 
  CreditCard, 
  Building, 
  Phone, 
  Mail, 
  Edit, 
  Upload, 
  User as UserIcon, 
  X, 
  ArrowLeft, 
  LayoutList, 
  CheckSquare, 
  Loader2, 
  History, 
  ShieldCheck 
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';

interface ProvidersProps {
    user: User;
}

const Providers: React.FC<ProvidersProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'remittances' | 'dashboard'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // View State
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'claims' | 'unpaid' | 'payments' | 'audit'>('info');

  // Data States (Now fetched from Supabase)
  const [providers, setProviders] = useState<Provider[]>([]);
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [contracts] = useState<ProviderContract[]>(MOCK_CONTRACTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [disciplines, setDisciplines] = useState<ProviderDiscipline[]>([]);

  // Modal States
  const [showProviderModal, setShowProviderModal] = useState(false);
  
  // Unpaid Claims Selection
  const [selectedUnpaidClaims, setSelectedUnpaidClaims] = useState<string[]>([]);

  // Form State
  const emptyProvider: Provider = {
    id: '',
    name: '',
    discipline: '',
    type: 'Clinic',
    status: 'Pending',
    afhozNumber: '',
    licenseNumber: '',
    taxClearanceExpiry: '',
    taxClearanceUrl: '',
    address: '',
    primaryContactPhone: '',
    primaryContactPerson: '',
    email: '',
    bankingDetails: { bankName: '', branchCode: '', accountNumber: '', accountHolder: '' },
    location: ''
  };

  const [providerForm, setProviderForm] = useState<Provider>(emptyProvider);

  // Initial Data Fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Audit Logs when tab changes to 'audit'
  useEffect(() => {
      if (selectedProvider && detailTab === 'audit') {
          const fetchLogs = async () => {
              const logs = await providerService.getAuditLogs(selectedProvider.id);
              setAuditLogs(logs);
          };
          fetchLogs();
      }
  }, [selectedProvider, detailTab]);

  const fetchData = async () => {
    setLoading(true);
    const [provData, remData, discData] = await Promise.all([
      providerService.getAll(),
      providerService.getRemittances(),
      settingsService.getDisciplines()
    ]);
    setProviders(provData);
    setRemittances(remData);
    setDisciplines(discData);
    setLoading(false);
  };

  const handleManageProvider = async (provider: Provider) => {
      setLoading(true);
      // Fetch specific claims for this provider when selected
      const provClaims = await claimService.getByProvider(provider.id);
      setClaims(provClaims);
      
      setSelectedProvider(provider);
      setDetailTab('info');
      setLoading(false);
  };

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.discipline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-teal-100 text-teal-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenCreateModal = () => {
    setProviderForm(emptyProvider);
    setShowProviderModal(true);
  };

  const handleEditProvider = () => {
      if (selectedProvider) {
          setProviderForm(selectedProvider);
          setShowProviderModal(true);
      }
  };

  const handleCloseModal = () => {
    setShowProviderModal(false);
  };

  const handleSaveProvider = async () => {
      if (!providerForm.name || !providerForm.discipline) {
          alert("Please fill in required fields");
          return;
      }
      setLoading(true);
      
      const saved = await providerService.save(providerForm, user.name);
      
      if (saved) {
          // Update local list
          const exists = providers.find(p => p.id === saved.id);
          if (exists) {
              setProviders(prev => prev.map(p => p.id === saved.id ? saved : p));
              // Also update selected if currently viewing it
              if (selectedProvider && selectedProvider.id === saved.id) {
                  setSelectedProvider(saved);
              }
          } else {
              setProviders(prev => [saved, ...prev]);
          }
          setShowProviderModal(false);
      } else {
          alert("Failed to save provider");
      }
      setLoading(false);
  };

  const handleTaxExpiryChange = (date: string) => {
      const today = new Date();
      const expiryDate = new Date(date);
      const isExpired = expiryDate < today;
      
      setProviderForm(prev => ({
          ...prev, 
          taxClearanceExpiry: date,
          status: isExpired ? 'Inactive' : 'Active'
      }));
  };

  const handlePayBatch = async () => {
      if (!selectedProvider || selectedUnpaidClaims.length === 0) return;

      const totalAmount = claims
        .filter(c => selectedUnpaidClaims.includes(c.id))
        .reduce((sum, c) => sum + c.amountApproved, 0);

      const newRemittance: Remittance = {
          id: `REM-${Date.now()}`,
          providerId: selectedProvider.id,
          providerName: selectedProvider.name,
          generatedDate: new Date().toISOString().split('T')[0],
          paymentDate: new Date().toISOString().split('T')[0],
          totalAmount: totalAmount,
          claimCount: selectedUnpaidClaims.length,
          status: 'Paid',
          reference: `EFT-${Math.floor(Math.random() * 100000)}`,
          claimsIncluded: selectedUnpaidClaims
      };

      setLoading(true);
      
      // 1. Create Remittance Record
      await providerService.createRemittance(newRemittance);

      // 2. Update Claims Status
      for (const claimId of selectedUnpaidClaims) {
          await claimService.updateStatus(claimId, 'Paid');
      }

      // 3. Update Local State
      setClaims(prev => prev.map(c => 
          selectedUnpaidClaims.includes(c.id) ? { ...c, status: 'Paid' } : c
      ));
      setRemittances(prev => [newRemittance, ...prev]);
      
      setSelectedUnpaidClaims([]);
      setDetailTab('payments');
      setLoading(false);
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Providers" value={providers.length} trend="up" change={5} icon={BriefcaseMedical} />
            <StatCard title="Active Contracts" value={contracts.filter(c => c.status === 'Active').length} trend="neutral" change={0} icon={FileText} />
            <StatCard title="Pending Payments" value={`$${remittances.filter(r => r.status === 'Processing').reduce((acc, r) => acc + r.totalAmount, 0).toLocaleString()}`} trend="down" change={12} icon={Clock} />
            <StatCard title="YTD Payouts" value="$1.2M" trend="up" change={8} icon={DollarSign} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Provider Distribution</h3>
                <div className="space-y-4">
                    {disciplines.slice(0, 5).map(disc => {
                        const count = providers.filter(p => p.discipline === disc.name).length;
                        const percentage = providers.length > 0 ? (count / providers.length) * 100 : 0;
                        return (
                            <div key={disc.id}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{disc.name}</span>
                                    <span className="font-medium text-gray-900">{count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Recent Remittances</h3>
                <div className="space-y-4">
                    {remittances.slice(0, 3).map(rem => (
                        <div key={rem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">{rem.providerName}</div>
                                <div className="text-xs text-gray-500">{rem.generatedDate} • {rem.claimCount} Claims</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">${rem.totalAmount.toLocaleString()}</div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(rem.status)}`}>{rem.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

  const renderDirectory = () => (
    <div className="space-y-4 animate-in fade-in">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search providers by name or type..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={handleOpenCreateModal}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm transition-colors"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600"/></div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map(provider => (
                <div key={provider.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Building className="h-6 w-6 text-blue-600" />
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(provider.status)}`}>
                                {provider.status}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{provider.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{provider.discipline} {provider.location ? `• ${provider.location}` : ''}</p>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="truncate">AHFOZ: {provider.afhozNumber || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{provider.primaryContactPhone || 'N/A'}</span>
                            </div>
                             <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="truncate">{provider.email || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-mono">Lic: {provider.licenseNumber}</span>
                        <button 
                            onClick={() => handleManageProvider(provider)}
                            className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center"
                        >
                            Manage <Edit className="h-3 w-3 ml-1" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
        )}
    </div>
  );

  const renderRemittances = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Remittance Advice History</h3>
            <button className="flex items-center px-3 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800">
                <CreditCard className="h-4 w-4 mr-2" />
                Process Batch Payment
            </button>
        </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Remittance ID</th>
                        <th className="px-6 py-4">Provider</th>
                        <th className="px-6 py-4">Generated Date</th>
                        <th className="px-6 py-4">Claims Count</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Advice</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {remittances.map(rem => (
                        <tr key={rem.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono text-gray-900">{rem.id}</td>
                            <td className="px-6 py-4">{rem.providerName}</td>
                            <td className="px-6 py-4 text-gray-500">{rem.generatedDate}</td>
                            <td className="px-6 py-4">{rem.claimCount}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">${rem.totalAmount.toLocaleString()}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rem.status)}`}>
                                    {rem.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 hover:text-blue-800 flex items-center justify-end w-full">
                                    <Download className="h-4 w-4 mr-1" /> PDF
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  // --- Provider Detail View ---
  const renderProviderDetail = () => {
      if (!selectedProvider) return null;

      const paidOrApprovedClaims = claims.filter(c => c.status === 'Paid' || c.status === 'Approved');
      const unpaidClaims = claims.filter(c => c.status === 'Approved');
      const providerRemittances = remittances.filter(r => r.providerId === selectedProvider.id);

      return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
              {/* Detail Header */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center">
                      <button onClick={() => setSelectedProvider(null)} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <ArrowLeft className="h-6 w-6 text-gray-600" />
                      </button>
                      <div>
                          <h2 className="text-2xl font-bold text-gray-900">{selectedProvider.name}</h2>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Building className="h-4 w-4 mr-1" /> {selectedProvider.discipline}
                              <span className="mx-2">•</span>
                              <FileText className="h-4 w-4 mr-1" /> {selectedProvider.licenseNumber}
                              <span className="mx-2">•</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedProvider.status)}`}>
                                  {selectedProvider.status}
                              </span>
                          </div>
                      </div>
                  </div>
                  <button 
                    onClick={handleEditProvider}
                    className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Provider
                  </button>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 bg-white px-6 rounded-t-xl shadow-sm">
                  <nav className="-mb-px flex space-x-8 overflow-x-auto">
                      <button onClick={() => setDetailTab('info')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${detailTab === 'info' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                          <UserIcon className="h-4 w-4 mr-2" /> Service Provider Information
                      </button>
                      <button onClick={() => setDetailTab('claims')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${detailTab === 'claims' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                          <LayoutList className="h-4 w-4 mr-2" /> Claims History
                      </button>
                      <button onClick={() => setDetailTab('unpaid')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${detailTab === 'unpaid' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                          <AlertCircle className="h-4 w-4 mr-2" /> Unpaid Claims ({unpaidClaims.length})
                      </button>
                      <button onClick={() => setDetailTab('payments')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${detailTab === 'payments' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                          <CreditCard className="h-4 w-4 mr-2" /> Payments
                      </button>
                      <button onClick={() => setDetailTab('audit')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${detailTab === 'audit' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                          <History className="h-4 w-4 mr-2" /> Audit Log
                      </button>
                  </nav>
              </div>

              <div className="min-h-[400px]">
                  {/* Tab 1: Info */}
                  {detailTab === 'info' && (
                      <div className="bg-white p-8 rounded-b-xl shadow-sm border border-t-0 border-gray-100 space-y-8 animate-in fade-in">
                          {/* Basic Info */}
                          <div>
                              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center uppercase tracking-wider"><Building className="h-4 w-4 mr-2"/> Basic Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                      <span className="text-xs text-gray-500 block">AHFOZ Number</span>
                                      <span className="font-medium text-gray-900">{selectedProvider.afhozNumber || 'N/A'}</span>
                                  </div>
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                      <span className="text-xs text-gray-500 block">License Number</span>
                                      <span className="font-medium text-gray-900">{selectedProvider.licenseNumber || 'N/A'}</span>
                                  </div>
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                      <span className="text-xs text-gray-500 block">Discipline</span>
                                      <span className="font-medium text-gray-900">{selectedProvider.discipline}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Contact Info */}
                          <div>
                              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center uppercase tracking-wider"><UserIcon className="h-4 w-4 mr-2"/> Contact Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                      <span className="text-xs text-gray-500 block">Primary Contact</span>
                                      <span className="font-medium text-gray-900">{selectedProvider.primaryContactPerson}</span>
                                      <div className="flex items-center mt-2 text-sm text-gray-600">
                                          <Phone className="h-3 w-3 mr-2" /> {selectedProvider.primaryContactPhone}
                                      </div>
                                      <div className="flex items-center mt-1 text-sm text-gray-600">
                                          <Mail className="h-3 w-3 mr-2" /> {selectedProvider.email}
                                      </div>
                                  </div>
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                      <span className="text-xs text-gray-500 block">Physical Address</span>
                                      <span className="font-medium text-gray-900">{selectedProvider.address}</span>
                                      <span className="text-sm text-gray-500 block mt-1">{selectedProvider.location}</span>
                                  </div>
                              </div>
                          </div>

                          {/* Compliance */}
                          <div>
                              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center uppercase tracking-wider"><FileText className="h-4 w-4 mr-2"/> Compliance</h4>
                              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                                  <div className="flex-1">
                                      <span className="text-xs text-gray-500 block">Tax Clearance Status</span>
                                      <div className="flex items-center mt-1">
                                          <span className={`font-medium ${selectedProvider.status === 'Active' ? 'text-green-700' : 'text-red-700'}`}>
                                              {selectedProvider.status === 'Active' ? 'Valid & Compliant' : 'Expired / Non-Compliant'}
                                          </span>
                                      </div>
                                      <span className="text-xs text-gray-400 mt-1">Expiry Date: {selectedProvider.taxClearanceExpiry}</span>
                                  </div>
                                  {selectedProvider.taxClearanceUrl ? (
                                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                                          <Download className="h-4 w-4 mr-1" /> Download Cert
                                      </button>
                                  ) : (
                                      <span className="text-xs text-gray-400 italic">No document uploaded</span>
                                  )}
                              </div>
                          </div>

                          {/* Banking */}
                          <div>
                              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center uppercase tracking-wider"><CreditCard className="h-4 w-4 mr-2"/> Banking Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-3 border border-gray-200 rounded-lg">
                                      <span className="text-xs text-gray-500">Bank Name</span>
                                      <p className="font-medium text-gray-900">{selectedProvider.bankingDetails?.bankName}</p>
                                  </div>
                                  <div className="p-3 border border-gray-200 rounded-lg">
                                      <span className="text-xs text-gray-500">Account Number</span>
                                      <p className="font-medium text-gray-900">{selectedProvider.bankingDetails?.accountNumber}</p>
                                  </div>
                                  <div className="p-3 border border-gray-200 rounded-lg">
                                      <span className="text-xs text-gray-500">Branch Code</span>
                                      <p className="font-medium text-gray-900">{selectedProvider.bankingDetails?.branchCode}</p>
                                  </div>
                                  <div className="p-3 border border-gray-200 rounded-lg">
                                      <span className="text-xs text-gray-500">Account Holder</span>
                                      <p className="font-medium text-gray-900">{selectedProvider.bankingDetails?.accountHolder}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* Tab 2: Claims */}
                  {detailTab === 'claims' && (
                      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 overflow-hidden animate-in fade-in">
                          <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                      <tr>
                                          <th className="px-6 py-4">Claim ID</th>
                                          <th className="px-6 py-4">Patient</th>
                                          <th className="px-6 py-4">Service Date</th>
                                          <th className="px-6 py-4">Captured By</th>
                                          <th className="px-6 py-4">Approved By</th>
                                          <th className="px-6 py-4">Amount</th>
                                          <th className="px-6 py-4">Status</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                      {paidOrApprovedClaims.length > 0 ? paidOrApprovedClaims.map(claim => (
                                          <tr key={claim.id} className="hover:bg-gray-50">
                                              <td className="px-6 py-4 font-mono text-gray-900">{claim.id}</td>
                                              <td className="px-6 py-4">{claim.patientName}</td>
                                              <td className="px-6 py-4 text-gray-500">{claim.serviceDate}</td>
                                              <td className="px-6 py-4 text-gray-600">{claim.capturedBy || 'System'}</td>
                                              <td className="px-6 py-4 text-gray-600">{claim.approvedBy || 'Pending'}</td>
                                              <td className="px-6 py-4 font-medium">${claim.amountApproved.toFixed(2)}</td>
                                              <td className="px-6 py-4">
                                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                                                      {claim.status}
                                                  </span>
                                              </td>
                                          </tr>
                                      )) : (
                                          <tr>
                                              <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                  No approved or paid claims found.
                                              </td>
                                          </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {/* Tab 3: Unpaid */}
                  {detailTab === 'unpaid' && (
                      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 overflow-hidden animate-in fade-in">
                          <div className="p-4 border-b border-gray-100 bg-orange-50 flex justify-between items-center">
                              <div className="flex items-center text-orange-800">
                                  <AlertCircle className="h-5 w-5 mr-2" />
                                  <span className="font-medium">Outstanding Claims for Payment</span>
                              </div>
                              <button 
                                  onClick={handlePayBatch}
                                  disabled={selectedUnpaidClaims.length === 0}
                                  className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                              >
                                  <CheckSquare className="h-4 w-4 mr-2" />
                                  Pay Selected ({selectedUnpaidClaims.length})
                              </button>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                      <tr>
                                          <th className="px-6 py-4 w-10">
                                              <input 
                                                  type="checkbox" 
                                                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                                  onChange={(e) => {
                                                      if (e.target.checked) {
                                                          setSelectedUnpaidClaims(unpaidClaims.map(c => c.id));
                                                      } else {
                                                          setSelectedUnpaidClaims([]);
                                                      }
                                                  }}
                                                  checked={unpaidClaims.length > 0 && selectedUnpaidClaims.length === unpaidClaims.length}
                                              />
                                          </th>
                                          <th className="px-6 py-4">Claim ID</th>
                                          <th className="px-6 py-4">Patient</th>
                                          <th className="px-6 py-4">Service Date</th>
                                          <th className="px-6 py-4">Diagnosis</th>
                                          <th className="px-6 py-4">Amount Approved</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                      {unpaidClaims.length > 0 ? unpaidClaims.map(claim => (
                                          <tr key={claim.id} className={`hover:bg-gray-50 ${selectedUnpaidClaims.includes(claim.id) ? 'bg-orange-50/50' : ''}`}>
                                              <td className="px-6 py-4">
                                                  <input 
                                                      type="checkbox" 
                                                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                                      checked={selectedUnpaidClaims.includes(claim.id)}
                                                      onChange={(e) => {
                                                          if (e.target.checked) {
                                                              setSelectedUnpaidClaims([...selectedUnpaidClaims, claim.id]);
                                                          } else {
                                                              setSelectedUnpaidClaims(selectedUnpaidClaims.filter(id => id !== claim.id));
                                                          }
                                                      }}
                                                  />
                                              </td>
                                              <td className="px-6 py-4 font-mono text-gray-900">{claim.id}</td>
                                              <td className="px-6 py-4">{claim.patientName}</td>
                                              <td className="px-6 py-4 text-gray-500">{claim.serviceDate}</td>
                                              <td className="px-6 py-4 text-gray-600">{claim.diagnosisCode}</td>
                                              <td className="px-6 py-4 font-bold text-gray-900">${claim.amountApproved.toFixed(2)}</td>
                                          </tr>
                                      )) : (
                                          <tr>
                                              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                  <CheckCircle className="h-12 w-12 text-green-100 mx-auto mb-2" />
                                                  All approved claims have been paid.
                                              </td>
                                          </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {/* Tab 4: Payments */}
                  {detailTab === 'payments' && (
                      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 overflow-hidden animate-in fade-in">
                          <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                      <tr>
                                          <th className="px-6 py-4">Remittance ID</th>
                                          <th className="px-6 py-4">Payment Date</th>
                                          <th className="px-6 py-4">Reference</th>
                                          <th className="px-6 py-4">Claims Count</th>
                                          <th className="px-6 py-4">Total Amount</th>
                                          <th className="px-6 py-4">Status</th>
                                          <th className="px-6 py-4 text-right">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                      {providerRemittances.length > 0 ? providerRemittances.map(rem => (
                                          <tr key={rem.id} className="hover:bg-gray-50">
                                              <td className="px-6 py-4 font-mono text-gray-900">{rem.id}</td>
                                              <td className="px-6 py-4 text-gray-500">{rem.paymentDate}</td>
                                              <td className="px-6 py-4 font-mono text-gray-600">{rem.reference}</td>
                                              <td className="px-6 py-4">{rem.claimCount}</td>
                                              <td className="px-6 py-4 font-bold text-gray-900">${rem.totalAmount.toLocaleString()}</td>
                                              <td className="px-6 py-4">
                                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rem.status)}`}>
                                                      {rem.status}
                                                  </span>
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                  <button className="text-blue-600 hover:text-blue-800 flex items-center justify-end w-full">
                                                      <Download className="h-4 w-4 mr-1" /> Advice
                                                  </button>
                                              </td>
                                          </tr>
                                      )) : (
                                          <tr>
                                              <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                  No payment history found.
                                              </td>
                                          </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {/* Tab 5: Audit Log */}
                  {detailTab === 'audit' && (
                      <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 overflow-hidden animate-in fade-in">
                          <div className="p-6">
                              <h4 className="text-sm font-bold text-gray-800 mb-6 flex items-center uppercase tracking-wider"><ShieldCheck className="h-4 w-4 mr-2"/> Change History</h4>
                              
                              <div className="relative border-l border-gray-200 ml-4 space-y-8">
                                  {auditLogs.length === 0 ? (
                                      <div className="pl-6 text-gray-500 text-sm">No history available for this provider.</div>
                                  ) : auditLogs.map((log, idx) => (
                                      <div key={idx} className="relative pl-6">
                                          <span className={`absolute -left-2.5 top-0 h-5 w-5 rounded-full border-2 border-white ${log.action === 'Create' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                                              <span className="text-sm font-bold text-gray-900">{log.action === 'Create' ? 'Provider Created' : 'Provider Updated'}</span>
                                              <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                                          </div>
                                          <p className="text-xs text-gray-500 mb-2">Performed by: <span className="font-medium text-gray-700">{log.performedBy}</span></p>
                                          
                                          {log.changes && Object.keys(log.changes).length > 0 && (
                                              <div className="bg-gray-50 rounded-lg p-3 text-xs border border-gray-100 mt-2">
                                                  {Object.entries(log.changes).map(([field, diff]: [string, any]) => (
                                                      <div key={field} className="mb-1 last:mb-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                          <span className="font-medium text-gray-600 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                          <span className="text-red-500 line-through truncate" title={String(diff.old)}>{String(diff.old || '(empty)')}</span>
                                                          <span className="text-green-600 font-medium truncate" title={String(diff.new)}>{String(diff.new)}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  if (selectedProvider) {
      return (
        <>
            {renderProviderDetail()}
            {/* Re-using the same modal for editing */}
            {showProviderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {providerForm.id ? 'Edit Provider' : 'Register New Provider'}
                                </h3>
                                <p className="text-sm text-gray-500">Complete all credentialing fields below.</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5"/></button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            {/* Section 1: Basic Information */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center"><Building className="h-4 w-4 mr-2"/> Basic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                                            placeholder="e.g. City General Hospital"
                                            value={providerForm.name}
                                            onChange={(e) => setProviderForm({...providerForm, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                                        <select 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            value={providerForm.discipline}
                                            onChange={(e) => setProviderForm({...providerForm, discipline: e.target.value})}
                                        >
                                            <option value="">Select Discipline...</option>
                                            {disciplines.map(d => (
                                                <option key={d.id} value={d.name}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">AHFOZ Number</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                            placeholder="e.g. AF-123456"
                                            value={providerForm.afhozNumber}
                                            onChange={(e) => setProviderForm({...providerForm, afhozNumber: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Licence Number</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                            placeholder="e.g. LIC-998877"
                                            value={providerForm.licenseNumber}
                                            onChange={(e) => setProviderForm({...providerForm, licenseNumber: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 2: Compliance */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center"><FileText className="h-4 w-4 mr-2"/> Compliance & Tax</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Clearance Expiry</label>
                                        <div className="relative">
                                            <input 
                                                type="date" 
                                                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 ${providerForm.status === 'Active' ? 'border-gray-300' : 'border-red-300 bg-red-50'}`}
                                                value={providerForm.taxClearanceExpiry}
                                                onChange={(e) => handleTaxExpiryChange(e.target.value)}
                                            />
                                            {providerForm.taxClearanceExpiry && new Date(providerForm.taxClearanceExpiry) < new Date() && (
                                                <p className="text-xs text-red-600 mt-1">Expired - Provider Inactive</p>
                                            )}
                                        </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Clearance Upload</label>
                                            <div className="flex items-center">
                                                <label className="flex-1 cursor-pointer flex items-center justify-center px-4 py-2.5 border border-gray-300 border-dashed rounded-lg hover:bg-gray-50">
                                                    <Upload className="h-4 w-4 mr-2 text-gray-500" />
                                                    <span className="text-sm text-gray-600">Choose File...</span>
                                                    <input type="file" className="hidden" />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">PDF or Image (Max 5MB)</p>
                                        </div>
                                        <div className="col-span-2">
                                            <div className={`p-3 rounded-lg flex items-center ${providerForm.status === 'Active' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                                {providerForm.status === 'Active' ? <CheckCircle className="h-5 w-5 text-green-600 mr-2"/> : <AlertCircle className="h-5 w-5 text-red-600 mr-2"/>}
                                                <div>
                                                    <p className={`text-sm font-bold ${providerForm.status === 'Active' ? 'text-green-800' : 'text-red-800'}`}>
                                                        System Status: {providerForm.status}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Determined by tax clearance validity.</p>
                                                </div>
                                            </div>
                                        </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 3: Contact Details */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center"><UserIcon className="h-4 w-4 mr-2"/> Contact Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                            placeholder="Street Address, City, Area"
                                            value={providerForm.address}
                                            onChange={(e) => setProviderForm({...providerForm, address: e.target.value})}
                                        />
                                        </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Person</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                            placeholder="Full Name"
                                            value={providerForm.primaryContactPerson}
                                            onChange={(e) => setProviderForm({...providerForm, primaryContactPerson: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Phone</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                            placeholder="+263..."
                                            value={providerForm.primaryContactPhone}
                                            onChange={(e) => setProviderForm({...providerForm, primaryContactPhone: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                            value={providerForm.email}
                                            onChange={(e) => setProviderForm({...providerForm, email: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 4: Banking */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center"><CreditCard className="h-4 w-4 mr-2"/> Banking Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5"
                                            value={providerForm.bankingDetails?.bankName}
                                            onChange={(e) => setProviderForm({...providerForm, bankingDetails: {...providerForm.bankingDetails, bankName: e.target.value}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5"
                                            value={providerForm.bankingDetails?.branchCode}
                                            onChange={(e) => setProviderForm({...providerForm, bankingDetails: {...providerForm.bankingDetails, branchCode: e.target.value}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5"
                                            value={providerForm.bankingDetails?.accountNumber}
                                            onChange={(e) => setProviderForm({...providerForm, bankingDetails: {...providerForm.bankingDetails, accountNumber: e.target.value}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg p-2.5"
                                            value={providerForm.bankingDetails?.accountHolder}
                                            onChange={(e) => setProviderForm({...providerForm, bankingDetails: {...providerForm.bankingDetails, accountHolder: e.target.value}})}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0 z-10">
                            <button onClick={handleCloseModal} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium">Cancel</button>
                            <button onClick={handleSaveProvider} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm">
                                {loading ? 'Saving...' : 'Save Provider'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Service Provider Management</h2>
           <p className="text-gray-500">Manage network partners, contracts, and financial settlements.</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('directory')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'directory' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                Provider Directory
            </button>
            <button onClick={() => setActiveTab('remittances')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'remittances' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                Remittances & Billing
            </button>
             <button onClick={() => setActiveTab('dashboard')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                Financial Dashboard
            </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
          {activeTab === 'directory' && renderDirectory()}
          {activeTab === 'remittances' && renderRemittances()}
          {activeTab === 'dashboard' && renderDashboard()}
      </div>

      {/* Create Provider Modal */}
      {showProviderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                      <div>
                          <h3 className="text-lg font-bold text-gray-900">
                              Register New Provider
                          </h3>
                          <p className="text-sm text-gray-500">Complete all credentialing fields below.</p>
                      </div>
                      <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5"/></button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                      {/* Section 1: Basic Information */}
                      <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center"><Building className="h-4 w-4 mr-2"/> Basic Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500" 
                                    placeholder="e.g. City General Hospital"
                                    value={providerForm.name}
                                    onChange={(e) => setProviderForm({...providerForm, name: e.target.value})}
                                  />
                              </div>
                              <div className="col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                                  <select 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    value={providerForm.discipline}
                                    onChange={(e) => setProviderForm({...providerForm, discipline: e.target.value})}
                                  >
                                      <option value="">Select Discipline...</option>
                                      {disciplines.map(d => (
                                          <option key={d.id} value={d.name}>{d.name}</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">AHFOZ Number</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g. AF-123456"
                                    value={providerForm.afhozNumber}
                                    onChange={(e) => setProviderForm({...providerForm, afhozNumber: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Licence Number</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g. LIC-998877"
                                    value={providerForm.licenseNumber}
                                    onChange={(e) => setProviderForm({...providerForm, licenseNumber: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      <hr className="border-gray-100" />

                      {/* Section 2: Compliance */}
                      <div>
                           <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center"><FileText className="h-4 w-4 mr-2"/> Compliance & Tax</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Clearance Expiry</label>
                                  <div className="relative">
                                    <input 
                                        type="date" 
                                        className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 ${providerForm.status === 'Active' ? 'border-gray-300' : 'border-red-300 bg-red-50'}`}
                                        value={providerForm.taxClearanceExpiry}
                                        onChange={(e) => handleTaxExpiryChange(e.target.value)}
                                    />
                                    {providerForm.taxClearanceExpiry && new Date(providerForm.taxClearanceExpiry) < new Date() && (
                                        <p className="text-xs text-red-600 mt-1">Expired - Provider Inactive</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Clearance Upload</label>
                                    <div className="flex items-center">
                                        <label className="flex-1 cursor-pointer flex items-center justify-center px-4 py-2.5 border border-gray-300 border-dashed rounded-lg hover:bg-gray-50">
                                            <Upload className="h-4 w-4 mr-2 text-gray-500" />
                                            <span className="text-sm text-gray-600">Choose File...</span>
                                            <input type="file" className="hidden" />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">PDF or Image (Max 5MB)</p>
                                </div>
                                <div className="col-span-2">
                                     <div className={`p-3 rounded-lg flex items-center ${providerForm.status === 'Active' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                         {providerForm.status === 'Active' ? <CheckCircle className="h-5 w-5 text-green-600 mr-2"/> : <AlertCircle className="h-5 w-5 text-red-600 mr-2"/>}
                                         <div>
                                             <p className={`text-sm font-bold ${providerForm.status === 'Active' ? 'text-green-800' : 'text-red-800'}`}>
                                                System Status: {providerForm.status}
                                             </p>
                                             <p className="text-xs text-gray-500">Determined by tax clearance validity.</p>
                                         </div>
                                     </div>
                                </div>
                           </div>
                      </div>

                       <hr className="border-gray-100" />

                      {/* Section 3: Contact Details */}
                      <div>
                           <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center"><UserIcon className="h-4 w-4 mr-2"/> Contact Information</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                    placeholder="Street Address, City, Area"
                                    value={providerForm.address}
                                    onChange={(e) => setProviderForm({...providerForm, address: e.target.value})}
                                  />
                                </div>
                               <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Person</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                    placeholder="Full Name"
                                    value={providerForm.primaryContactPerson}
                                    onChange={(e) => setProviderForm({...providerForm, primaryContactPerson: e.target.value})}
                                  />
                               </div>
                               <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Phone</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                    placeholder="+263..."
                                    value={providerForm.primaryContactPhone}
                                    onChange={(e) => setProviderForm({...providerForm, primaryContactPhone: e.target.value})}
                                  />
                               </div>
                               <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                  <input 
                                    type="email" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500"
                                    value={providerForm.email}
                                    onChange={(e) => setProviderForm({...providerForm, email: e.target.value})}
                                  />
                               </div>
                           </div>
                      </div>

                       <hr className="border-gray-100" />

                      {/* Section 4: Banking */}
                      <div>
                           <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center"><CreditCard className="h-4 w-4 mr-2"/> Banking Details</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    value={providerForm.bankingDetails?.bankName}
                                    onChange={(e) => setProviderForm({...providerForm, bankingDetails: {...providerForm.bankingDetails, bankName: e.target.value}})}
                                  />
                               </div>
                               <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    value={providerForm.bankingDetails?.branchCode}
                                    onChange={(e) => setProviderForm({...providerForm, bankingDetails: {...providerForm.bankingDetails, branchCode: e.target.value}})}
                                  />
                               </div>
                               <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    value={providerForm.bankingDetails?.accountNumber}
                                    onChange={(e) => setProviderForm({...providerForm, bankingDetails: {...providerForm.bankingDetails, accountNumber: e.target.value}})}
                                  />
                               </div>
                               <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                    value={providerForm.bankingDetails?.accountHolder}
                                    onChange={(e) => setProviderForm({...providerForm, bankingDetails: {...providerForm.bankingDetails, accountHolder: e.target.value}})}
                                  />
                               </div>
                           </div>
                      </div>

                  </div>
                  <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0 z-10">
                      <button onClick={handleCloseModal} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium">Cancel</button>
                      <button onClick={handleSaveProvider} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-sm">
                          {loading ? 'Saving...' : 'Save Provider'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Providers;
