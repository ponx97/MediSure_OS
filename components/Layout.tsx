import React, { useState } from 'react';
import {
  Users,
  FileText,
  Shield,
  Activity,
  LayoutDashboard,
  LogOut,
  Menu,
  BriefcaseMedical,
  Settings,
  Bell,
  UserCog,
  Gift,
  Wallet,
  Briefcase,
  BookOpen,
  Receipt
} from 'lucide-react';
import { User, Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPath, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex flex-col">{children}</div>;
  }

  const getNavItems = (role: Role) => {
    const common = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    const roleNorm = String(role || '').toLowerCase();

    if (roleNorm === 'admin') {
      return [
        ...common,
        { id: 'members', label: 'Membership', icon: Users },
        { id: 'payers', label: 'Premium Payers', icon: Wallet },
        { id: 'billing-ops', label: 'Billing Operations', icon: Receipt },
        { id: 'agents', label: 'Agents & Commissions', icon: Briefcase },
        { id: 'claims', label: 'Claims', icon: FileText },
        { id: 'policies', label: 'Policies', icon: Shield },
        { id: 'benefits', label: 'Benefits', icon: Gift },
        { id: 'providers', label: 'Providers', icon: BriefcaseMedical },
        { id: 'accounting', label: 'Accounting', icon: BookOpen },
        { id: 'users', label: 'User Management', icon: UserCog },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    } else if (roleNorm === 'member') {
      return [
        ...common,
        { id: 'my-claims', label: 'My Claims', icon: FileText },
        { id: 'my-policy', label: 'My Benefits', icon: Shield },
      ];
    } else if (roleNorm === 'provider') {
      return [
        ...common,
        { id: 'submit-claim', label: 'Submit Claim', icon: FileText },
        { id: 'patients', label: 'Patients', icon: Users },
      ];
    }
    return common;
  };

  const navItems = getNavItems(user.role);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ✅ Make sidebar a column layout */}
        <div className="flex h-full flex-col">
          {/* Header/Brand */}
          <div className="flex items-center justify-center h-16 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-teal-400" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                MediSure OS
              </span>
            </div>
          </div>

          {/* ✅ Scrollable nav */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 pb-32">
            {navItems.map((item) => {
              const isActive = currentPath === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* ✅ Footer pinned at bottom (no absolute) */}
          <div className="border-t border-slate-800 p-4 flex-shrink-0 bg-slate-900">
            <div className="flex items-center mb-4">
              <img
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`}
                alt="User"
                className="h-10 w-10 rounded-full bg-slate-700"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">
                  {String(user.role || '').toLowerCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-center lg:justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 lg:px-8 text-center lg:text-left">
            <h1 className="text-xl font-semibold text-gray-800 capitalize">
              {currentPath.replace('-', ' ')}
            </h1>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;
