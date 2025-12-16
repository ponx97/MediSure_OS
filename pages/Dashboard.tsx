
import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import StatCard from '../components/ui/StatCard';
import { Users, FileText, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { memberService } from '../services/memberService';
import { claimService } from '../services/claimService';

const claimsData = [
  { name: 'Jan', processed: 400, pending: 240 },
  { name: 'Feb', processed: 300, pending: 139 },
  { name: 'Mar', processed: 200, pending: 980 },
  { name: 'Apr', processed: 278, pending: 390 },
  { name: 'May', processed: 189, pending: 480 },
  { name: 'Jun', processed: 239, pending: 380 },
];

const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 2000 },
  { name: 'Apr', revenue: 2780 },
  { name: 'May', revenue: 1890 },
  { name: 'Jun', revenue: 2390 },
];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingClaims: 0,
    claimsValue: 0,
    lossRatio: 72
  });

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [members, claims] = await Promise.all([
          memberService.getAll(),
          claimService.getAll()
        ]);

        const pending = claims.filter(c => c.status === 'Pending').length;
        const totalValue = claims
          .filter(c => c.status === 'Approved' || c.status === 'Paid')
          .reduce((acc, curr) => acc + (curr.amountApproved || 0), 0);

        setStats({
          totalMembers: members.length,
          pendingClaims: pending,
          claimsValue: totalValue,
          lossRatio: 68 // Hardcoded for demo logic unless we have premium data
        });
      } catch (e) {
        console.error("Dashboard data load failed");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-teal-600"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Members" 
          value={stats.totalMembers.toLocaleString()} 
          change={12.5} 
          trend="up" 
          icon={Users} 
          subtext="Active policies"
        />
        <StatCard 
          title="Pending Claims" 
          value={stats.pendingClaims} 
          change={-5.2} 
          trend="down" 
          icon={FileText}
          subtext="Requires attention"
        />
        <StatCard 
          title="Claims Value" 
          value={`$${(stats.claimsValue / 1000).toFixed(1)}k`} 
          change={8.1} 
          trend="up" 
          icon={CreditCard}
          subtext="YTD Approved"
        />
        <StatCard 
          title="Loss Ratio" 
          value={`${stats.lossRatio}%`} 
          change={2.4} 
          trend="neutral" 
          icon={AlertCircle}
          subtext="Target: <75%"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Claims Processing Volume</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={claimsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Bar dataKey="processed" name="Processed" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Financial Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Premium Revenue" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
