
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Claims from './pages/Claims';
import Policies from './pages/Policies';
import SystemUsers from './pages/SystemUsers';
import Benefits from './pages/Benefits';
import Settings from './pages/Settings';
import Providers from './pages/Providers';
import PremiumPayers from './pages/PremiumPayers';
import Agents from './pages/Agents';
import Accounting from './pages/Accounting';
import BillingOperations from './pages/BillingOperations';
import Login from './pages/Login';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState('dashboard');

  const handleLogin = (selectedUser: User) => {
    setUser(selectedUser);
    setCurrentPath('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPath('dashboard');
  };

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <Members user={user!} />;
      case 'payers':
        return <PremiumPayers />;
      case 'billing-ops':
        return <BillingOperations />;
      case 'agents':
        return <Agents />;
      case 'claims':
        return <Claims />;
      case 'policies':
        return <Policies />;
      case 'benefits':
        return <Benefits />;
      case 'users':
        return <SystemUsers />;
      case 'settings':
        return <Settings />;
      case 'providers':
        return <Providers user={user!} />;
      case 'accounting':
        return <Accounting />;
      case 'my-claims':
        return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <p className="text-xl font-medium mb-2">Module Under Construction</p>
            <p className="text-sm">The {currentPath.replace('-', ' ')} module is part of the full roadmap.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPath={currentPath}
      onNavigate={setCurrentPath}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
