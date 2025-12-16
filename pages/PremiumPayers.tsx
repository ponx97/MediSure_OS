
import React, { useState, useEffect } from 'react';
import { payerService } from '../services/payerService';
import { policyService } from '../services/policyService';
import { PremiumPayer, Member, Payment, Invoice, PayerDocument, Policy } from '../types';
import { 
    Search, Plus, Edit2, Trash2, Loader2, Building, User as UserIcon, Wallet, 
    Mail, Phone, MapPin, X, ArrowLeft, CreditCard, FileText, AlertCircle, 
    CheckCircle, Clock, Download, PieChart, Users, DollarSign, BarChart3, TrendingUp,
    FileBarChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '../components/ui/StatCard';

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444'];

const PremiumPayers: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'payments' | 'arrears' | 'documents'>('details');
  const [mainTab, setMainTab] = useState<'directory' | 'analytics'>('directory');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [payers, setPayers] = useState<PremiumPayer[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]); // For analytics
  const [selectedPayer, setSelectedPayer] = useState<PremiumPayer | null>(null);
  
  // Detail Data
  const [members, setMembers] = useState<Member[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<PayerDocument[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  // Modals
  const [showPayerModal, setShowPayerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Forms
  const [formData, setFormData] = useState<Partial<PremiumPayer> & { amountOwing?: number }>({});
  const [paymentForm, setPaymentForm] = useState<Partial<Payment>>({
      amount: 0,
      method: 'Bank Transfer',
      reference: '',
      date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [payersData, invoicesData, policiesData] = await Promise.all([
        payerService.getAll(),
        payerService.getAllInvoices(),
        policyService.getPolicies()
    ]);
    setPayers(payersData);
    setAllInvoices(invoicesData);
    setPolicies(policiesData);
    setLoading(false);
  };

  const handleSelectPayer = async (payer: PremiumPayer) => {
      setLoading(true);
      setSelectedPayer(payer);
      
      // Fetch related data in parallel
      const [mems, invs, pays, docs] = await Promise.all([
          payerService.getMembers(payer.id),
          payerService.getInvoices(payer.id),
          payerService.getPayments(payer.id),
          payerService.getDocuments(payer.id)
      ]);

      setMembers(mems);
      setInvoices(invs);
      setPayments(pays);
      setDocuments(docs);
      
      setView('detail');
      setActiveTab('details');
      setLoading(false);
  };

  const handleBackToList = () => {
      setView('list');
      setSelectedPayer(null);
  };

  const handleSavePayer = async () => {
        if (!formData.name) return;
        
        // 1. Save Payer
        const payerToSave = { 
            ...formData, 
            status: formData.status || 'Active', 
            paymentTerms: formData.paymentTerms || '30 Days',
            type: formData.type || 'Group'
        } as PremiumPayer;

        const savedPayer = await payerService.save(payerToSave);
        
        if (savedPayer) {
            // 2. Handle Opening Balance (Amount Owing)
            if (formData.amountOwing && formData.amountOwing > 0) {
                const openingInvoice: Invoice = {
                    id: `INV-OPEN-${Date.now()}`,
                    payerId: savedPayer.id,
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date().toISOString().split('T')[0], // Due Immediately if opening balance
                    period: 'Opening Balance',
                    totalAmount: Number(formData.amountOwing),
                    paidAmount: 0,
                    status: 'Unpaid'
                };
                await payerService.createInvoice(openingInvoice);
            }

            await loadData();
            setShowPayerModal(false);
            setFormData({});
        }
  };

  // --- Logic ---
  
  const calculateMemberPremium = (member: Member): number => {
      const policy = policies.find(p => p.id === member.policyId);
      if (!policy) return 0;

      let total = 0;
      // Principal
      const age = new Date().getFullYear() - new Date(member.dob).getFullYear();
      if (age >= 65) total += policy.premium.senior;
      else total += policy.premium.adult;

      // Dependants
      member.dependants.forEach(dep => {
          const depAge = new Date().getFullYear() - new Date(dep.dob).getFullYear();
          if (depAge < 18 || dep.relationship === 'Child') total += policy.premium.child;
          else if (depAge >= 65) total += policy.premium.senior;
          else total += policy.premium.adult;
      });

      return total;
  };

  const handleRecordPayment = async () => {
      if (!selectedPayer || !paymentForm.amount) return;
      
      const newPayment: Payment = {
          id: '', // DB Gen
          payerId: selectedPayer.id,
          amount: Number(paymentForm.amount),
          method: paymentForm.method as any,
          date: paymentForm.date || new Date().toISOString().split('T')[0],
          reference: paymentForm.reference || '',
          status: 'Unallocated'
      };

      const saved = await payerService.recordPayment(newPayment);
      if (saved) {
          // Auto Allocate Logic
          await payerService.autoAllocatePayment(selectedPayer.id, saved.id, saved.amount);
          
          // Refresh
          const [invs, pays] = await Promise.all([
              payerService.getInvoices(selectedPayer.id),
              payerService.getPayments(selectedPayer.id)
          ]);
          setInvoices(invs);
          setPayments(pays);
          setShowPaymentModal(false);
          setPaymentForm({ amount: 0, method: 'Bank Transfer', reference: '', date: new Date().toISOString().split('T')[0] });
      }
  };

  // --- Analytics Logic ---
  const getAnalyticsData = () => {
      const totalInvoiced = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = allInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
      const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
      
      // Employer vs Individual
      const groupPayers = payers.filter(p => p.type === 'Group').map(p => p.id);
      const individualPayers = payers.filter(p => p.type === 'Individual').map(p => p.id);
      
      const groupRevenue = allInvoices
        .filter(i => groupPayers.includes(i.payerId))
        .reduce((sum, i) => sum + i.totalAmount, 0);

      const individualRevenue = allInvoices
        .filter(i => individualPayers.includes(i.payerId))
        .reduce((sum, i) => sum + i.totalAmount, 0);

      // Arrears Summary
      const today = new Date();
      let arrears30 = 0;
      let arrears60 = 0;
      let arrears90 = 0;
      let arrearsOver90 = 0;

      allInvoices.forEach(inv => {
          if (inv.status === 'Paid') return;
          const due = new Date(inv.dueDate);
          const diffDays = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
          const outstanding = inv.totalAmount - (inv.paidAmount || 0);

          if (diffDays <= 0) return; // Not overdue
          if (diffDays <= 30) arrears30 += outstanding;
          else if (diffDays <= 60) arrears60 += outstanding;
          else if (diffDays <= 90) arrears90 += outstanding;
          else arrearsOver90 += outstanding;
      });

      // Payer Performance (Top 5 by Collection %)
      const payerPerformance = payers.map(p => {
          const pInvoices = allInvoices.filter(i => i.payerId === p.id);
          const pTotal = pInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
          const pPaid = pInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
          const pRate = pTotal > 0 ? (pPaid / pTotal) * 100 : 0;
          return {
              name: p.name,
              total: pTotal,
              paid: pPaid,
              rate: pRate
          };
      }).sort((a, b) => b.rate - a.rate).slice(0, 5); // Top 5

      // Contribution Analysis (Top 5 by Revenue)
      const contributionData = payers.map(p => {
           const pRevenue = allInvoices.filter(i => i.payerId === p.id).reduce((sum, i) => sum + i.totalAmount, 0);
           return { name: p.name, value: pRevenue };
      }).sort((a, b) => b.value - a.value).slice(0, 5);

      return {
          collectionRate,
          totalInvoiced,
          totalPaid,
          revenueSplit: [
              { name: 'Corporate/Group', value: groupRevenue },
              { name: 'Individual', value: individualRevenue }
          ],
          arrearsData: [
              { name: '30 Days', amount: arrears30 },
              { name: '60 Days', amount: arrears60 },
              { name: '90 Days', amount: arrears90 },
              { name: '90+ Days', amount: arrearsOver90 },
          ],
          payerPerformance,
          contributionData
      };
  };

  // --- Renderers ---

  const renderAnalytics = () => {
      const stats = getAnalyticsData();
      
      return (
          <div className="space-y-6 animate-in fade-in">
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard 
                    title="Collection Rate" 
                    value={`${stats.collectionRate.toFixed(1)}%`} 
                    icon={PieChart} 
                    trend={stats.collectionRate > 80 ? 'up' : 'down'}
                    change={2.5}
                    subtext="Of total invoiced amount"
                  />
                  <StatCard 
                    title="Total Invoiced" 
                    value={`$${(stats.totalInvoiced / 1000).toFixed(1)}k`} 
                    icon={FileText} 
                    trend="up"
                    change={12}
                  />
                  <StatCard 
                    title="Total Collected" 
                    value={`$${(stats.totalPaid / 1000).toFixed(1)}k`} 
                    icon={CheckCircle} 
                    trend="up"
                    change={8}
                  />
                   <StatCard 
                    title="Outstanding Arrears" 
                    value={`$${((stats.totalInvoiced - stats.totalPaid) / 1000).toFixed(1)}k`} 
                    icon={AlertCircle} 
                    trend="down"
                    change={-5}
                    subtext="Total overdue balance"
                  />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Employer vs Individual Revenue */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Mix: Corporate vs Individual</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <RePieChart>
                                  <Pie
                                      data={stats.revenueSplit}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      {stats.revenueSplit.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                  <Legend verticalAlign="bottom" height={36}/>
                              </RePieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Arrears Summary */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Arrears Aging Summary</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={stats.arrearsData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                  <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                  />
                                  <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} name="Outstanding Amount" />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Contribution Analysis */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Contributors (Revenue)</h3>
                      <div className="space-y-4">
                          {stats.contributionData.map((d, idx) => (
                              <div key={idx}>
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium text-gray-700">{d.name}</span>
                                      <span className="font-bold text-gray-900">${d.value.toLocaleString()}</span>
                                  </div>
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 rounded-full" 
                                        style={{ width: `${(d.value / stats.totalInvoiced) * 100}%` }}
                                      ></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Key Reports & Performance */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Key Reports & Performance</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                           <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center">
                               <FileBarChart className="h-6 w-6 text-teal-600 mb-2" />
                               <span className="text-xs font-semibold text-gray-700">Detailed Aging Report</span>
                           </button>
                           <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center">
                               <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
                               <span className="text-xs font-semibold text-gray-700">Payment Trends</span>
                           </button>
                           <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center">
                               <PieChart className="h-6 w-6 text-orange-600 mb-2" />
                               <span className="text-xs font-semibold text-gray-700">Risk Analysis</span>
                           </button>
                           <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex flex-col items-center justify-center text-center">
                               <Download className="h-6 w-6 text-gray-600 mb-2" />
                               <span className="text-xs font-semibold text-gray-700">Export All Data</span>
                           </button>
                      </div>

                      <h4 className="text-sm font-bold text-gray-800 mb-3">Best Performing Payers (Collection %)</h4>
                      <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                              <thead>
                                  <tr className="border-b border-gray-100 text-gray-500">
                                      <th className="py-2">Payer</th>
                                      <th className="py-2 text-right">Invoiced</th>
                                      <th className="py-2 text-right">Paid</th>
                                      <th className="py-2 text-right">%</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {stats.payerPerformance.map((p, idx) => (
                                      <tr key={idx} className="border-b border-gray-50 last:border-0">
                                          <td className="py-2 font-medium text-gray-900 truncate max-w-[120px]" title={p.name}>{p.name}</td>
                                          <td className="py-2 text-right">${p.total.toLocaleString()}</td>
                                          <td className="py-2 text-right text-green-600">${p.paid.toLocaleString()}</td>
                                          <td className="py-2 text-right font-bold">{p.rate.toFixed(1)}%</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderDetailsTab = () => (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in">
          <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold text-gray-900">Payer Information</h3>
              <button 
                onClick={() => { setFormData(selectedPayer!); setShowPayerModal(true); }}
                className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center"
              >
                  <Edit2 className="h-4 w-4 mr-1" /> Edit
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                  <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Type</label>
                      <div className="text-gray-900 font-medium">{selectedPayer?.type}</div>
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Payment Terms</label>
                      <div className="text-gray-900 font-medium">{selectedPayer?.paymentTerms}</div>
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Tax ID</label>
                      <div className="text-gray-900 font-medium">{selectedPayer?.taxId || 'N/A'}</div>
                  </div>
                   <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Status</label>
                       <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${selectedPayer?.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedPayer?.status}
                      </span>
                  </div>
              </div>
              <div className="space-y-4">
                   <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Contact Person</label>
                      <div className="text-gray-900 font-medium flex items-center">
                          <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedPayer?.contactPerson}
                      </div>
                  </div>
                   <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
                      <div className="text-gray-900 font-medium flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedPayer?.email}
                      </div>
                  </div>
                   <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Phone</label>
                      <div className="text-gray-900 font-medium flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedPayer?.phone}
                      </div>
                  </div>
                   <div>
                      <label className="text-xs text-gray-500 uppercase font-semibold">Address</label>
                      <div className="text-gray-900 font-medium flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedPayer?.address}
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderMembersTab = () => (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-gray-900">Associated Members</h3>
                 <p className="text-xs text-gray-500">{members.length} Principal Members</p>
              </div>
              <div className="bg-white px-3 py-1 rounded border border-gray-200 shadow-sm">
                  <span className="text-xs text-gray-500">Total Monthly Premium: </span>
                  <span className="font-bold text-teal-600">
                      ${members.reduce((acc, m) => acc + calculateMemberPremium(m), 0).toLocaleString()}
                  </span>
              </div>
          </div>
          <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                      <th className="px-6 py-3">Member Name</th>
                      <th className="px-6 py-3">Scheme</th>
                      <th className="px-6 py-3 text-center">Dependants</th>
                      <th className="px-6 py-3 text-right">Monthly Premium</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {members.map(m => {
                      const policy = policies.find(p => p.id === m.policyId);
                      const premium = calculateMemberPremium(m);
                      return (
                          <tr key={m.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3">
                                  <div className="font-medium text-gray-900">{m.firstName} {m.lastName}</div>
                                  <div className="text-xs text-gray-500">{m.id}</div>
                              </td>
                              <td className="px-6 py-3">
                                  {policy?.name || m.policyId}
                              </td>
                              <td className="px-6 py-3 text-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                                      <Users className="h-3 w-3 mr-1"/>
                                      {m.dependants.length}
                                  </span>
                              </td>
                              <td className="px-6 py-3 text-right font-medium text-gray-900">
                                  {policy?.currency} {premium.toLocaleString()}
                              </td>
                          </tr>
                      );
                  })}
                  {members.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No members linked to this payer.</td></tr>
                  )}
              </tbody>
          </table>
      </div>
  );

  const renderPaymentsTab = () => (
      <div className="space-y-6 animate-in fade-in">
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div>
                  <h3 className="font-bold text-gray-900">Payment History</h3>
                  <p className="text-xs text-gray-500">View and record payments.</p>
              </div>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm"
              >
                  <CreditCard className="h-4 w-4 mr-2" /> Record Payment
              </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Reference</th>
                          <th className="px-6 py-3">Method</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Allocation</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {payments.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-gray-900">{p.date}</td>
                              <td className="px-6 py-3 font-mono text-gray-600">{p.reference || '-'}</td>
                              <td className="px-6 py-3">{p.method}</td>
                              <td className="px-6 py-3 font-bold text-gray-900">${p.amount.toLocaleString()}</td>
                              <td className="px-6 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      p.status === 'Allocated' ? 'bg-green-100 text-green-800' : 
                                      p.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                      {p.status}
                                  </span>
                              </td>
                              <td className="px-6 py-3 text-xs text-gray-500">
                                  {p.status === 'Unallocated' ? (
                                      <button className="text-blue-600 hover:underline">Auto-Allocate</button>
                                  ) : 'Done'}
                              </td>
                          </tr>
                      ))}
                      {payments.length === 0 && (
                          <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No payments recorded.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderArrearsTab = () => {
      const today = new Date();
      // Bucket logic
      let bucket30 = 0;
      let bucket60 = 0;
      let bucket90 = 0;

      invoices.forEach(inv => {
          if (inv.status === 'Paid') return;
          const due = new Date(inv.dueDate);
          const diffTime = Math.abs(today.getTime() - due.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          const amount = inv.totalAmount - (inv.paidAmount || 0);

          if (diffDays <= 30) bucket30 += amount;
          else if (diffDays <= 60) bucket60 += amount;
          else bucket90 += amount;
      });

      return (
        <div className="space-y-6 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-yellow-400">
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">30 Days</p>
                     <p className="text-2xl font-bold text-gray-900">${bucket30.toLocaleString()}</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-orange-500">
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">60 Days</p>
                     <p className="text-2xl font-bold text-gray-900">${bucket60.toLocaleString()}</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-red-600">
                     <p className="text-xs text-gray-500 uppercase font-bold mb-1">90+ Days</p>
                     <p className="text-2xl font-bold text-gray-900">${bucket90.toLocaleString()}</p>
                 </div>
             </div>

             <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
                    <h3 className="font-bold text-red-900 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" /> Outstanding Invoices
                    </h3>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                          <th className="px-6 py-3">Invoice Period</th>
                          <th className="px-6 py-3">Due Date</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Paid</th>
                          <th className="px-6 py-3">Balance</th>
                          <th className="px-6 py-3 text-right">Age</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {invoices.filter(i => i.status !== 'Paid').map(inv => {
                           const due = new Date(inv.dueDate);
                           const diffDays = Math.ceil(Math.abs(today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
                           return (
                               <tr key={inv.id} className="hover:bg-gray-50">
                                   <td className="px-6 py-3 font-medium text-gray-900">{inv.period}</td>
                                   <td className="px-6 py-3">{inv.dueDate}</td>
                                   <td className="px-6 py-3">${inv.totalAmount.toLocaleString()}</td>
                                   <td className="px-6 py-3 text-green-600">${inv.paidAmount?.toLocaleString() || '0'}</td>
                                   <td className="px-6 py-3 font-bold text-red-600">${(inv.totalAmount - (inv.paidAmount || 0)).toLocaleString()}</td>
                                   <td className="px-6 py-3 text-right text-gray-500">{diffDays} Days</td>
                               </tr>
                           );
                      })}
                      {invoices.filter(i => i.status !== 'Paid').length === 0 && (
                          <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No outstanding invoices. Good standing!</td></tr>
                      )}
                  </tbody>
              </table>
             </div>
        </div>
      );
  };

  const renderDocumentsTab = () => (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in">
          <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                      <th className="px-6 py-3">Document Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Size</th>
                      <th className="px-6 py-3 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 flex items-center font-medium text-gray-900">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              {doc.name}
                          </td>
                          <td className="px-6 py-3">{doc.type}</td>
                          <td className="px-6 py-3 text-gray-500">{doc.date}</td>
                          <td className="px-6 py-3 text-gray-500">{doc.size}</td>
                          <td className="px-6 py-3 text-right">
                              <button className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end w-full">
                                  <Download className="h-4 w-4 mr-1"/> Download
                              </button>
                          </td>
                      </tr>
                  ))}
                  {documents.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No documents generated yet.</td></tr>
                  )}
              </tbody>
          </table>
      </div>
  );

  if (view === 'detail' && selectedPayer) {
      return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div className="flex items-center gap-4">
                       <button onClick={handleBackToList} className="p-2 hover:bg-white rounded-full transition-colors">
                           <ArrowLeft className="h-6 w-6 text-gray-600" />
                       </button>
                       <div>
                           <h2 className="text-2xl font-bold text-gray-900">{selectedPayer.name}</h2>
                           <div className="flex items-center text-sm text-gray-500">
                               <Building className="h-3 w-3 mr-1" /> {selectedPayer.type} Payer
                               <span className="mx-2">•</span>
                               <span className={`text-${selectedPayer.status === 'Active' ? 'green' : 'gray'}-600`}>{selectedPayer.status}</span>
                           </div>
                       </div>
                   </div>
                   <div className="flex gap-2">
                       <button className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm">
                           <Mail className="h-4 w-4 mr-2" /> Send Statement
                       </button>
                       <button onClick={() => { setActiveTab('payments'); setShowPaymentModal(true); }} className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm">
                           <CreditCard className="h-4 w-4 mr-2" /> Record Payment
                       </button>
                   </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {['details', 'members', 'payments', 'arrears', 'documents'].map((tab) => (
                         <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)} 
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                         >
                            {tab}
                        </button>
                    ))}
                </nav>
              </div>

              {/* Content */}
              <div className="min-h-[400px]">
                  {activeTab === 'details' && renderDetailsTab()}
                  {activeTab === 'members' && renderMembersTab()}
                  {activeTab === 'payments' && renderPaymentsTab()}
                  {activeTab === 'arrears' && renderArrearsTab()}
                  {activeTab === 'documents' && renderDocumentsTab()}
              </div>

              {/* Payment Modal */}
              {showPaymentModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                              <h3 className="font-bold text-gray-900">Record Payment</h3>
                              <button onClick={() => setShowPaymentModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
                          </div>
                          <div className="p-6 space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                  <div className="relative">
                                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <input 
                                        type="number" 
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                                  <select 
                                    className="w-full p-2 border rounded-lg"
                                    value={paymentForm.method}
                                    onChange={e => setPaymentForm({...paymentForm, method: e.target.value as any})}
                                  >
                                      <option>Bank Transfer</option>
                                      <option>Online</option>
                                      <option>Mobile Money</option>
                                      <option>Cash</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Receipt #</label>
                                  <input 
                                    type="text" 
                                    className="w-full p-2 border rounded-lg"
                                    value={paymentForm.reference}
                                    onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                  <input 
                                    type="date" 
                                    className="w-full p-2 border rounded-lg"
                                    value={paymentForm.date}
                                    onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                                  />
                              </div>
                              <div className="pt-4 flex gap-3">
                                  <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                                  <button onClick={handleRecordPayment} className="flex-1 py-2 bg-teal-600 text-white rounded-lg">Save Payment</button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- List View / Analytics View Switcher ---
  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Premium Payers</h2>
                <p className="text-gray-500">Manage corporate groups and individual payers.</p>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => { setFormData({}); setShowPayerModal(true); }}
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payer
                </button>
            </div>
        </div>

        {/* Top Navigation */}
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button 
                    onClick={() => setMainTab('directory')}
                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${mainTab === 'directory' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    All Payers
                </button>
                <button 
                    onClick={() => setMainTab('analytics')}
                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${mainTab === 'analytics' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    Reporting & Analytics
                </button>
            </nav>
        </div>

        {/* Content Area */}
        {mainTab === 'analytics' ? renderAnalytics() : (
            <>
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search payers..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            // Add standard search logic here if needed
                        />
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
                    ) : payers.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">No payers found.</div>
                    ) : (
                        payers.map(payer => (
                            <div key={payer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="p-6 cursor-pointer" onClick={() => handleSelectPayer(payer)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-lg ${payer.type === 'Group' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                                            {payer.type === 'Group' ? <Building className="h-6 w-6"/> : <UserIcon className="h-6 w-6"/>}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">{payer.name}</h3>
                                    <div className="flex items-center text-xs text-gray-500 mb-4">
                                        <Wallet className="h-3 w-3 mr-1" /> Terms: {payer.paymentTerms}
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600 border-t border-gray-50 pt-3">
                                        <div className="flex items-start">
                                            <UserIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                                            <span>{payer.contactPerson}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>{payer.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </>
        )}
        
        {/* Create Payer Modal */}
        {showPayerModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Add Premium Payer</h3>
                        <button onClick={() => setShowPayerModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payer Name</label>
                                <input 
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                                    placeholder="e.g. Acme Corp"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select 
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.type || 'Group'} 
                                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                                >
                                    <option value="Group">Corporate/Group</option>
                                    <option value="Individual">Individual</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / ID</label>
                                <input 
                                    className="w-full border p-2 rounded-lg" 
                                    placeholder="Optional"
                                    value={formData.taxId || ''}
                                    onChange={e => setFormData({...formData, taxId: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                <input 
                                    className="w-full border p-2 rounded-lg" 
                                    placeholder="Full Name"
                                    value={formData.contactPerson || ''}
                                    onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input 
                                    className="w-full border p-2 rounded-lg" 
                                    placeholder="+263..."
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input 
                                    className="w-full border p-2 rounded-lg" 
                                    placeholder="email@example.com"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input 
                                    className="w-full border p-2 rounded-lg" 
                                    placeholder="Physical Address"
                                    value={formData.address || ''}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h4 className="text-sm font-bold text-gray-900 mb-3">Financial Terms</h4>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                <select 
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.paymentTerms || '30 Days'}
                                    onChange={e => setFormData({...formData, paymentTerms: e.target.value as any})}
                                >
                                    <option>Current</option>
                                    <option>30 Days</option>
                                    <option>60 Days</option>
                                    <option>90 Days</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Owing</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                                    <input 
                                        type="number"
                                        className="w-full border p-2 pl-7 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                                        placeholder="0.00"
                                        value={formData.amountOwing || ''}
                                        onChange={e => setFormData({...formData, amountOwing: Number(e.target.value)})}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Creates opening invoice.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setShowPayerModal(false)} className="flex-1 border py-2.5 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                            <button onClick={handleSavePayer} className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 font-medium shadow-sm">Save Payer</button>
                        </div>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default PremiumPayers;
