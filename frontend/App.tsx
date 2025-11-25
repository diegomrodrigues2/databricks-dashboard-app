import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useSpreadsheet } from './hooks/useSpreadsheet';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ConfigPage from './pages/ConfigPage';
import EditorPage from './pages/EditorPage';
import ChatWindow from './components/chat/ChatWindow';
import MainLayout from './layouts/MainLayout';
import Spreadsheet from './components/spreadsheet/Spreadsheet';
import type { Page } from './types';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { spreadsheetView, closeSpreadsheet } = useSpreadsheet();
  const { loadSession, createNewSession } = useChat();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [currentDashboardId, setCurrentDashboardId] = useState<string>('example'); // Default to Example dashboard

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (page: Page, dashboardId?: string) => {
    setCurrentPage(page);
    
    if (page === 'chat') {
        if (dashboardId === 'new') {
            createNewSession();
            setCurrentDashboardId('new');
        } else if (dashboardId) {
            loadSession(dashboardId);
            setCurrentDashboardId(dashboardId);
        }
    } else {
        if (dashboardId) {
          setCurrentDashboardId(dashboardId);
        }
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
      case 'chat':
        return <ChatWindow />;
      case 'editor':
        return <EditorPage onNavigate={handleNavigate} />;
      default:
        return <DashboardPage dashboardId={currentDashboardId} />;
    }
  };

  return (
    <>
      <MainLayout 
        currentPage={currentPage} 
        currentDashboardId={currentDashboardId}
        onNavigate={handleNavigate}
      >
        {renderPage()}
      </MainLayout>
      {spreadsheetView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="w-full h-full max-w-[95vw] max-h-[95vh] bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
            <Spreadsheet
              title={spreadsheetView.title}
              data={spreadsheetView.data}
              onClose={closeSpreadsheet}
              isEditable={spreadsheetView.isEditable}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default App;
