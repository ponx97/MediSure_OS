
import React, { useState, useEffect } from 'react';
import { billingService } from '../services/billingService';
import { BillingRun } from '../types';
import { Play, Calendar, Users, User, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import StatCard from '../components/ui/StatCard';

const BillingOperations: React.FC = () => {
    const [runs, setRuns] = useState<BillingRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await billingService.getBillingRuns();
        setRuns(data);
        setLoading(false);
    };

    const handleRunGroup = async () => {
        const period = prompt("Enter Billing Period (e.g., 2024-06):", new Date().toISOString().slice(0, 7));
        if (!period) return;

        // Check date logic hint
        const today = new Date();
        const target = billingService.getTargetGroupBillingDate(today.getFullYear(), today.getMonth());
        const isTargetDate = today.getDate() === target.getDate();

        if (!isTargetDate && !confirm(`Today is not the scheduled Group Billing Date (${target.toDateString()}). Run anyway?`)) {
            return;
        }

        setProcessing(true);
        try {
            await billingService.executeGroupBilling(period);
            await loadData();
            alert("Group billing executed successfully.");
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleRunIndividual = async () => {
        if (!confirm("Run daily billing for Individuals based on anniversary date?")) return;
        setProcessing(true);
        try {
            await billingService.executeIndividualBilling();
            await loadData();
            alert("Individual billing executed successfully.");
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-gray-900">Billing Operations</h2>
            
            {/* Control Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <Users className="h-6 w-6 text-indigo-600" />
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Strategy: Monthly 10th</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Corporate / Group Billing</h3>
                    <p className="text-sm text-gray-500 mb-6">Generates consolidated invoices for all active group payers.</p>
                    <button 
                        onClick={handleRunGroup}
                        disabled={processing}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex justify-center items-center disabled:opacity-50"
                    >
                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Play className="h-4 w-4 mr-2" />}
                        Execute Group Run
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-50 rounded-lg">
                            <User className="h-6 w-6 text-teal-600" />
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Strategy: Anniversary</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Individual Billing</h3>
                    <p className="text-sm text-gray-500 mb-6">Generates invoices for individuals whose join date matches today.</p>
                    <button 
                        onClick={handleRunIndividual}
                        disabled={processing}
                        className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex justify-center items-center disabled:opacity-50"
                    >
                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Play className="h-4 w-4 mr-2" />}
                        Execute Daily Run
                    </button>
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center">
                        <FileText className="h-4 w-4 mr-2" /> Execution History
                    </h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">Run Date</th>
                            <th className="px-6 py-3">Strategy</th>
                            <th className="px-6 py-3">Period</th>
                            <th className="px-6 py-3">Invoices</th>
                            <th className="px-6 py-3">Total Amount</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Logs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {runs.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No billing runs recorded.</td></tr>
                        ) : runs.map(run => (
                            <tr key={run.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-gray-900">{run.runDate}</td>
                                <td className="px-6 py-3">{run.payerType} <span className="text-xs text-gray-400">({run.strategy})</span></td>
                                <td className="px-6 py-3 font-mono">{run.billingPeriod}</td>
                                <td className="px-6 py-3 font-medium">{run.invoicesGenerated}</td>
                                <td className="px-6 py-3 font-bold text-gray-900">${run.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        run.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                        run.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {run.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={run.logs.join('\n')}>
                                    {run.logs[0]} {run.logs.length > 1 && `+${run.logs.length - 1} more`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillingOperations;
