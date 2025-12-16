
import React, { useState, useEffect } from 'react';
import { Agent, Commission, CommissionRule } from '../types';
import { agentService } from '../services/agentService';
import { 
    Briefcase, 
    Search, 
    Plus, 
    Filter, 
    MoreHorizontal, 
    Edit, 
    DollarSign, 
    Loader2,
    CheckCircle,
    User,
    Wallet,
    FileText,
    Settings,
    ArrowUpRight,
    Clock,
    X,
    Trash2,
    RefreshCw
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';

const Agents: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'directory' | 'commissions' | 'rules' | 'payouts'>('directory');
    const [loading, setLoading] = useState(true);
    
    // Data
    const [agents, setAgents] = useState<Agent[]>([]);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [rules, setRules] = useState<CommissionRule[]>([]);
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [agentForm, setAgentForm] = useState<Partial<Agent>>({});
    
    // Commission Payout State
    const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [agentsData, commsData, rulesData] = await Promise.all([
            agentService.getAll(),
            agentService.getCommissions(),
            agentService.getRules()
        ]);
        setAgents(agentsData);
        setCommissions(commsData);
        setRules(rulesData);
        setLoading(false);
    };

    const handleSaveAgent = async () => {
        if (!agentForm.name || !agentForm.email) return;
        setLoading(true);
        
        const newAgent = {
            ...agentForm,
            status: agentForm.status || 'Active',
            type: agentForm.type || 'Individual',
            dateOnboarded: agentForm.dateOnboarded || new Date().toISOString().split('T')[0],
            bankDetails: agentForm.bankDetails || { bankName: '', branchCode: '', accountNumber: '' },
            commissionBalance: agentForm.commissionBalance || 0
        } as Agent;

        await agentService.save(newAgent);
        
        // Refresh
        const updatedAgents = await agentService.getAll();
        setAgents(updatedAgents);
        
        setShowAgentModal(false);
        setAgentForm({});
        setLoading(false);
    };

    const handleProcessPayout = async () => {
        if (selectedCommissions.length === 0) return;
        if (!window.confirm(`Process payment for ${selectedCommissions.length} transactions?`)) return;

        setIsProcessingPayout(true);
        await agentService.updateCommissionStatus(selectedCommissions, 'Paid');
        
        // Refresh
        const updatedComms = await agentService.getCommissions();
        setCommissions(updatedComms);
        setSelectedCommissions([]);
        setIsProcessingPayout(false);
        alert("Commissions processed successfully!");
    };

    const handleRunCalculation = async () => {
        setLoading(true);
        const newComms = await agentService.calculatePendingCommissions();
        
        // Refresh list
        const updatedComms = await agentService.getCommissions();
        setCommissions(updatedComms);
        setLoading(false);
        
        if (newComms.length > 0) {
            alert(`Success! Generated ${newComms.length} new commission entries.`);
        } else {
            alert("No new eligible commissions found for this period.");
        }
    };

    const handleSeedRules = async () => {
        setLoading(true);
        await agentService.seedDefaultRules();
        const rulesData = await agentService.getRules();
        setRules(rulesData);
        setLoading(false);
    };

    // --- Renderers ---

    const renderDirectory = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search agents..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => { setAgentForm({}); setShowAgentModal(true); }}
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Onboard Agent
                </button>
            </div>

            {agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                    <Briefcase className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="font-medium">No agents found.</p>
                    <p className="text-sm">Add a new agent to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(agent => (
                        <div key={agent.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold mr-3">
                                            {agent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{agent.name}</h3>
                                            <p className="text-xs text-gray-500">{agent.type}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${agent.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {agent.status}
                                    </span>
                                </div>
                                
                                <div className="space-y-2 text-sm text-gray-600 mt-4">
                                    <div className="flex justify-between">
                                        <span>Commissions</span>
                                        <span className="font-bold text-gray-900">${agent.commissionBalance.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Phone</span>
                                        <span>{agent.phone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>ID / Reg</span>
                                        <span>{agent.nrcId}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button onClick={() => { setAgentForm(agent); setShowAgentModal(true); }} className="text-teal-600 hover:text-teal-700 text-sm font-medium">Edit Profile</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCommissions = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Commissions" 
                    value={`$${commissions.reduce((acc, c) => acc + c.amount, 0).toLocaleString()}`} 
                    icon={DollarSign} 
                    trend="up" 
                    change={12} 
                />
                <StatCard 
                    title="Pending Approval" 
                    value={`$${commissions.filter(c => c.status === 'Pending').reduce((acc, c) => acc + c.amount, 0).toLocaleString()}`} 
                    icon={Clock} 
                    trend="neutral" 
                    change={0} 
                />
                <StatCard 
                    title="Paid YTD" 
                    value={`$${commissions.filter(c => c.status === 'Paid').reduce((acc, c) => acc + c.amount, 0).toLocaleString()}`} 
                    icon={CheckCircle} 
                    trend="up" 
                    change={8} 
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Transaction History</h3>
                    <button 
                        onClick={handleRunCalculation}
                        className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 font-medium flex items-center"
                    >
                        <Settings className="h-4 w-4 mr-1" /> Run Calculation Engine
                    </button>
                </div>
                {commissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No commissions found. Click "Run Calculation Engine" to generate if applicable.
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Agent</th>
                                <th className="px-6 py-3">Source / Reference</th>
                                <th className="px-6 py-3">Rule</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {commissions.map(comm => (
                                <tr key={comm.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-500">{comm.calculationDate}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{comm.agentName}</td>
                                    <td className="px-6 py-3">
                                        <div className="text-gray-900">{comm.sourceEntity}</div>
                                        <div className="text-xs text-gray-500">{comm.referenceId}</div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">{comm.ruleApplied}</td>
                                    <td className="px-6 py-3 font-bold text-gray-900">${comm.amount.toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            comm.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                            comm.status === 'Payable' ? 'bg-blue-100 text-blue-800' :
                                            comm.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {comm.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const renderPayouts = () => {
        const payable = commissions.filter(c => c.status === 'Payable' || c.status === 'Pending'); // Showing pending too for demo flow
        
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Commission Payouts</h3>
                        <p className="text-sm text-gray-500">Select payable commissions to generate batch payment.</p>
                    </div>
                    <button 
                        onClick={handleProcessPayout}
                        disabled={selectedCommissions.length === 0 || isProcessingPayout}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50"
                    >
                        {isProcessingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Wallet className="h-4 w-4 mr-2" />}
                        Process Payment ({selectedCommissions.length})
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-teal-600 focus:ring-teal-500"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedCommissions(payable.map(c => c.id));
                                            else setSelectedCommissions([]);
                                        }}
                                        checked={payable.length > 0 && selectedCommissions.length === payable.length}
                                    />
                                </th>
                                <th className="px-6 py-3">Agent</th>
                                <th className="px-6 py-3">Bank Details</th>
                                <th className="px-6 py-3">Reference</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payable.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No payable commissions found.</td></tr>
                            ) : payable.map(comm => {
                                const agent = agents.find(a => a.id === comm.agentId);
                                return (
                                    <tr key={comm.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3">
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-teal-600 focus:ring-teal-500"
                                                checked={selectedCommissions.includes(comm.id)}
                                                onChange={() => {
                                                    if (selectedCommissions.includes(comm.id)) setSelectedCommissions(selectedCommissions.filter(id => id !== comm.id));
                                                    else setSelectedCommissions([...selectedCommissions, comm.id]);
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{comm.agentName}</td>
                                        <td className="px-6 py-3 text-xs text-gray-500">
                                            {agent?.bankDetails?.bankName} - {agent?.bankDetails?.accountNumber}
                                        </td>
                                        <td className="px-6 py-3 text-gray-500">{comm.referenceId}</td>
                                        <td className="px-6 py-3 font-bold text-gray-900">${comm.amount.toFixed(2)}</td>
                                        <td className="px-6 py-3">
                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">{comm.status}</span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderRules = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Commission Rules</h3>
                <div className="flex gap-2">
                    <button onClick={handleSeedRules} className="text-sm border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                        <RefreshCw className="h-4 w-4 mr-1"/> Sync Default Rules
                    </button>
                    <button className="text-sm bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800">Add Rule</button>
                </div>
            </div>
            {rules.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                    No rules defined. Click "Sync Default Rules" to load the standard configuration.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rules.map(rule => (
                        <div key={rule.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900">{rule.name}</h4>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {rule.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{rule.description}</p>
                            <div className="flex justify-between text-sm border-t border-gray-100 pt-4">
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Type</span>
                                    <span className="font-medium">{rule.type}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Value</span>
                                    <span className="font-medium">{rule.type === 'Percentage' ? `${rule.value}%` : `$${rule.value}`}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs uppercase">Target</span>
                                    <span className="font-medium">{rule.agentType}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Agents & Commissions</h2>
                    <p className="text-gray-500">Manage broker relationships and automate commission payouts.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('directory')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'directory' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Agent Directory
                    </button>
                    <button onClick={() => setActiveTab('commissions')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'commissions' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Commissions
                    </button>
                    <button onClick={() => setActiveTab('payouts')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'payouts' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Payouts
                    </button>
                    <button onClick={() => setActiveTab('rules')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rules' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Configuration
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
                ) : (
                    <>
                        {activeTab === 'directory' && renderDirectory()}
                        {activeTab === 'commissions' && renderCommissions()}
                        {activeTab === 'payouts' && renderPayouts()}
                        {activeTab === 'rules' && renderRules()}
                    </>
                )}
            </div>

            {/* Agent Modal */}
            {showAgentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">{agentForm.id ? 'Edit Agent' : 'Onboard New Agent'}</h3>
                            <button onClick={() => setShowAgentModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name</label>
                                    <input className="w-full border rounded p-2" value={agentForm.name || ''} onChange={e => setAgentForm({...agentForm, name: e.target.value})} placeholder="Name or Company"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select className="w-full border rounded p-2" value={agentForm.type || 'Individual'} onChange={e => setAgentForm({...agentForm, type: e.target.value as any})}>
                                        <option value="Individual">Individual</option>
                                        <option value="Broker">Broker Firm</option>
                                        <option value="Internal">Internal Staff</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID / Reg Number</label>
                                    <input className="w-full border rounded p-2" value={agentForm.nrcId || ''} onChange={e => setAgentForm({...agentForm, nrcId: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input className="w-full border rounded p-2" value={agentForm.email || ''} onChange={e => setAgentForm({...agentForm, email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input className="w-full border rounded p-2" value={agentForm.phone || ''} onChange={e => setAgentForm({...agentForm, phone: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input className="w-full border rounded p-2" value={agentForm.address || ''} onChange={e => setAgentForm({...agentForm, address: e.target.value})} />
                                </div>
                            </div>
                            
                            <hr className="border-gray-100" />
                            
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Bank Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="w-full border rounded p-2" placeholder="Bank Name" value={agentForm.bankDetails?.bankName || ''} onChange={e => setAgentForm({...agentForm, bankDetails: {...agentForm.bankDetails!, bankName: e.target.value}})} />
                                    <input className="w-full border rounded p-2" placeholder="Account Number" value={agentForm.bankDetails?.accountNumber || ''} onChange={e => setAgentForm({...agentForm, bankDetails: {...agentForm.bankDetails!, accountNumber: e.target.value}})} />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <button onClick={() => setShowAgentModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSaveAgent} className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700">Save Agent</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agents;
