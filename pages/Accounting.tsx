
import React, { useState, useEffect } from 'react';
import { accountingService } from '../services/accountingService';
import { Account, JournalEntry } from '../types';
import { 
    Book, 
    TrendingUp, 
    List, 
    FileText, 
    Search, 
    Plus, 
    DollarSign, 
    Loader2, 
    Lock,
    Unlock,
    RefreshCw
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';

const Accounting: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'journal' | 'coa' | 'reports'>('overview');
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [accData, entData] = await Promise.all([
            accountingService.getChartOfAccounts(),
            accountingService.getJournalEntries(50) // Last 50
        ]);
        setAccounts(accData);
        setEntries(entData);
        setLoading(false);
    };

    const handleSeedDefaults = async () => {
        if (!window.confirm("Initialize default Chart of Accounts?")) return;
        setLoading(true);
        await accountingService.seedDefaults();
        await loadData();
        setLoading(false);
    };

    // --- Renderers ---

    const renderOverview = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value="$45,200" icon={TrendingUp} trend="up" change={12} subtext="Current Period" />
                <StatCard title="Total Expenses" value="$18,450" icon={DollarSign} trend="down" change={5} subtext="Claims & Commissions" />
                <StatCard title="Net Income" value="$26,750" icon={Book} trend="up" change={22} />
                <StatCard title="Open Journals" value={entries.length} icon={List} trend="neutral" subtext="Posted this month" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Journal Entries</h3>
                    <div className="space-y-4">
                        {entries.slice(0, 5).map(e => (
                            <div key={e.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{e.description}</div>
                                    <div className="text-xs text-gray-500">{e.transactionDate} • {e.sourceModule}</div>
                                </div>
                                <span className="font-bold text-gray-900">${e.totalAmount.toLocaleString()}</span>
                            </div>
                        ))}
                        {entries.length === 0 && <div className="text-center text-gray-400 py-4">No recent activity</div>}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Account Balances (Top 5)</h3>
                    {/* Placeholder visual */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm"><span>1000 - Cash & Bank</span><span className="font-mono">$120,000</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: '80%'}}></div></div>
                        
                        <div className="flex justify-between text-sm"><span>1200 - Accounts Receivable</span><span className="font-mono">$45,000</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: '30%'}}></div></div>

                        <div className="flex justify-between text-sm"><span>2100 - Claims Payable</span><span className="font-mono">$12,500</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{width: '15%'}}></div></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderJournal = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">General Ledger</h3>
                <div className="flex gap-2">
                    <button className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50 flex items-center"><Search className="h-4 w-4 mr-1"/> Search</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Module</th>
                            <th className="px-6 py-3">Reference</th>
                            <th className="px-6 py-3 text-right">Debit</th>
                            <th className="px-6 py-3 text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {entries.map(entry => (
                            <React.Fragment key={entry.id}>
                                <tr className="bg-gray-50/50">
                                    <td className="px-6 py-2 font-medium" colSpan={6}>
                                        <div className="flex justify-between">
                                            <span>{entry.transactionDate} - {entry.description}</span>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 rounded-full">{entry.status}</span>
                                        </div>
                                    </td>
                                </tr>
                                {entry.lines.map(line => (
                                    <tr key={line.id} className="hover:bg-white">
                                        <td className="px-6 py-2"></td>
                                        <td className="px-6 py-2 text-gray-600 pl-10">
                                            <span className="font-mono text-xs text-gray-400 mr-2">{line.accountCode}</span>
                                            {line.accountName} 
                                            <span className="text-xs text-gray-400 ml-2">- {line.description}</span>
                                        </td>
                                        <td className="px-6 py-2 text-xs text-gray-400">{entry.sourceModule}</td>
                                        <td className="px-6 py-2 text-xs text-gray-400 font-mono">{entry.referenceId}</td>
                                        <td className="px-6 py-2 text-right font-mono">{line.debit > 0 ? line.debit.toFixed(2) : '-'}</td>
                                        <td className="px-6 py-2 text-right font-mono">{line.credit > 0 ? line.credit.toFixed(2) : '-'}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                        {entries.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No journal entries found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCOA = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Chart of Accounts</h3>
                <button onClick={handleSeedDefaults} className="flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium">
                    <RefreshCw className="h-4 w-4 mr-1"/> Reset Defaults
                </button>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Account Name</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3 text-right">System</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {accounts.map(acc => (
                        <tr key={acc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-mono font-medium text-gray-900">{acc.code}</td>
                            <td className="px-6 py-3">{acc.name}</td>
                            <td className="px-6 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    acc.type === 'Asset' ? 'bg-green-100 text-green-800' :
                                    acc.type === 'Liability' ? 'bg-red-100 text-red-800' :
                                    acc.type === 'Revenue' ? 'bg-blue-100 text-blue-800' : 
                                    acc.type === 'Equity' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                    {acc.type}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-gray-500">{acc.category}</td>
                            <td className="px-6 py-3 text-right text-gray-400">
                                {acc.isSystem && <Lock className="h-3 w-3 inline" />}
                            </td>
                        </tr>
                    ))}
                    {accounts.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No accounts configured. Click 'Reset Defaults' to start.</td></tr>}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Financial Accounting</h2>
                    <p className="text-gray-500">Double-entry ledger and financial reporting.</p>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'journal', 'coa', 'reports'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab === 'coa' ? 'Chart of Accounts' : tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="min-h-[500px]">
                {loading ? <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600"/></div> : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'journal' && renderJournal()}
                        {activeTab === 'coa' && renderCOA()}
                        {activeTab === 'reports' && <div className="p-12 text-center text-gray-500 border-2 border-dashed rounded-xl">Financial Reporting Module (P&L, Balance Sheet) coming soon.</div>}
                    </>
                )}
            </div>
        </div>
    );
};

export default Accounting;
