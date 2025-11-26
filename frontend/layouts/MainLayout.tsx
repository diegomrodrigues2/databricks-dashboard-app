import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import type { Page } from '../types';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  currentDashboardId: string;
  onNavigate: (page: Page, dashboardId?: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPage, currentDashboardId, onNavigate }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-black">
      <Sidebar
        currentPage={currentPage}
        currentDashboardId={currentDashboardId}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onNavigate={(page) => onNavigate(page)}/>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-black bg-[radial-gradient(theme(colors.gray.800)_1px,transparent_1px)] [background-size:1rem_1rem]">
          {['dashboard', 'config', 'profile'].includes(currentPage) ? (
            <div className="container mx-auto px-6 pt-8 pb-12 h-full">
              {children}
            </div>
          ) : (
            <div className="h-full w-full">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
