
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ConfigPage from './pages/ConfigPage';
import MainLayout from './layouts/MainLayout';
import type { Page } from './types';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [currentDashboardId, setCurrentDashboardId] = useState<string>('example'); // Default to Example dashboard

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (page: Page, dashboardId?: string) => {
    setCurrentPage(page);
    if (dashboardId) {
      setCurrentDashboardId(dashboardId);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage dashboardId={currentDashboardId} />;
      case 'profile':
        return <ProfilePage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <DashboardPage dashboardId={currentDashboardId} />;
    }
  };

  return (
    <MainLayout 
      currentPage={currentPage} 
      currentDashboardId={currentDashboardId}
      onNavigate={handleNavigate}
    >
      {renderPage()}
    </MainLayout>
  );
};

export default App;
