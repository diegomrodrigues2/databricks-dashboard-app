import React, { useState, useEffect, useMemo } from 'react';
import { getDashboards, createDashboard, renameDashboard, deleteDashboard } from '../services/dashboardService';
import { getAllSessions } from '../services/sessionService';
import { useChat } from '../hooks/useChat';
import type { Dashboard, Page, Session } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ChevronDoubleLeftIcon } from './icons/ChevronDoubleLeftIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SidebarProps {
  currentPage: Page;
  currentDashboardId: string;
  onNavigate: (page: Page, dashboardId?: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, currentDashboardId, onNavigate, isCollapsed, onToggle }) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isChatHistoryExpanded, setChatHistoryExpanded] = useState(true);
  const { renameSession, deleteSession, clearAllHistory } = useChat();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<'session' | 'dashboard' | null>(null);

  const loadSessions = () => {
    getAllSessions().then(setSessions);
  };

  const loadDashboards = () => {
    getDashboards().then(setDashboards);
  };

  useEffect(() => {
    loadDashboards();
    loadSessions();
    
    // Set up an interval to refresh sessions and dashboards occasionally
    const interval = setInterval(() => {
        loadSessions();
        loadDashboards();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { dashboardsBySection, topLevelDashboards, allSections } = useMemo(() => {
    const dashboardsBySection = new Map<string, Dashboard[]>();
    const topLevelDashboards: Dashboard[] = [];
    const sections = new Set<string>();

    if (dashboards) {
        dashboards.forEach(dashboard => {
            if (dashboard.section) {
                if (!dashboardsBySection.has(dashboard.section)) {
                    dashboardsBySection.set(dashboard.section, []);
                }
                dashboardsBySection.get(dashboard.section)!.push(dashboard);
                sections.add(dashboard.section);
            } else {
                topLevelDashboards.push(dashboard);
            }
        });
    }

    return { dashboardsBySection, topLevelDashboards, allSections: Array.from(sections).sort() };
  }, [dashboards]);

  useEffect(() => {
      // Expand all sections by default when dashboards load.
      const sections = new Set(dashboards.map(d => d.section).filter(Boolean) as string[]);
      setExpandedSections(sections);
  }, [dashboards]);

  useEffect(() => {
      // When current dashboard changes, ensure its section is expanded
      const currentDashboard = dashboards.find(d => d.id === currentDashboardId);
      if (currentDashboard?.section && !expandedSections.has(currentDashboard.section)) {
           setExpandedSections(prev => new Set(prev).add(currentDashboard.section!));
      }
  }, [currentDashboardId, dashboards, expandedSections]);

  const toggleSection = (section: string) => {
      setExpandedSections(prev => {
          const newSet = new Set(prev);
          if (newSet.has(section)) {
              newSet.delete(section);
          } else {
              newSet.add(section);
          }
          return newSet;
      });
  };

  const handleRenameStart = (id: string, title: string, type: 'session' | 'dashboard', e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingItemId(id);
      setEditTitle(title);
      setEditType(type);
  };

  const handleRenameSave = async () => {
      if (editingItemId && editTitle.trim() && editType) {
          if (editType === 'session') {
              await renameSession(editingItemId, editTitle.trim());
              loadSessions();
          } else {
              await renameDashboard(editingItemId, editTitle.trim());
              loadDashboards();
          }
          setEditingItemId(null);
          setEditType(null);
      } else {
          setEditingItemId(null);
          setEditType(null);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleRenameSave();
      } else if (e.key === 'Escape') {
          setEditingItemId(null);
          setEditType(null);
      }
  };

  const handleDelete = async (id: string, title: string, type: 'session' | 'dashboard', e: React.MouseEvent) => {
      e.stopPropagation();
      const confirmMessage = type === 'session' 
          ? `Delete chat "${title}"?` 
          : `Delete dashboard "${title}"?`;
          
      if (window.confirm(confirmMessage)) {
          if (type === 'session') {
              await deleteSession(id);
              loadSessions();
          } else {
              await deleteDashboard(id);
              loadDashboards();
              // If we deleted the current dashboard, navigate away
              if (currentDashboardId === id && currentPage === 'dashboard') {
                  onNavigate('dashboard', dashboards[0]?.id || 'example'); // Simple fallback
              }
          }
      }
  };

  const handleCreateDashboard = async () => {
      const newDashboard = await createDashboard("New Dashboard");
      loadDashboards();
      onNavigate('dashboard', newDashboard.id);
  };

  const handleClearAll = async () => {
      if (window.confirm('Are you sure you want to delete ALL chat history? This action cannot be undone.')) {
          await clearAllHistory();
          loadSessions();
      }
  };

  const navItemClasses = (dashboardId: string, dashboardType?: 'dashboard' | 'chat') =>
    `flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 w-full ${
      dashboardType === 'chat'
        ? currentPage === 'chat' && currentDashboardId === dashboardId // Assuming dashboardId matches session ID for chat
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        : currentPage === 'dashboard' && currentDashboardId === dashboardId 
          ? 'bg-gray-700 text-white' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    } ${isCollapsed ? 'justify-center' : ''}`;

  const renderDashboardItem = (dashboard: Dashboard) => {
    const handleClick = () => {
      if (!editingItemId) {
        if (dashboard.type === 'chat') {
            onNavigate('chat', 'new');
        } else {
            onNavigate('dashboard', dashboard.id);
        }
      }
    };

    const IconComponent = dashboard.type === 'chat' ? DocumentTextIcon : DashboardIcon;
    const isEditing = editingItemId === dashboard.id && editType === 'dashboard';

    return (
      <li key={dashboard.id} onClick={handleClick} title={isCollapsed ? dashboard.title : undefined} className="group relative">
        <div className={navItemClasses(dashboard.id, dashboard.type)}>
          <IconComponent className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
              <div className="ml-3 flex-1 overflow-hidden flex items-center justify-between">
                  {isEditing ? (
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRenameSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full bg-gray-900 text-white text-sm px-1 py-0.5 rounded border border-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                  ) : (
                      <>
                        <span className="text-sm font-medium truncate pr-2">{dashboard.title}</span>
                        {dashboard.type !== 'chat' && (
                             <div className="hidden group-hover:flex items-center space-x-1">
                                <button 
                                    onClick={(e) => handleRenameStart(dashboard.id, dashboard.title, 'dashboard', e)}
                                    className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
                                    title="Rename"
                                >
                                    <PencilIcon className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={(e) => handleDelete(dashboard.id, dashboard.title, 'dashboard', e)}
                                    className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-red-400"
                                    title="Delete"
                                >
                                    <TrashIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                      </>
                  )}
              </div>
          )}
        </div>
      </li>
    );
  };

  const renderSessionItem = (session: Session) => {
    const isSelected = currentPage === 'chat' && currentDashboardId === session.id;
    const isEditing = editingItemId === session.id && editType === 'session';
    
    const handleClick = () => {
        if (!isEditing) {
             onNavigate('chat', session.id);
        }
    };

    return (
      <li key={session.id} onClick={handleClick} title={isCollapsed ? session.title : undefined} className="group relative">
        <div className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 w-full ${
            isSelected 
              ? 'bg-gray-700 text-white' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        } ${isCollapsed ? 'justify-center' : ''}`}>
          <DocumentTextIcon className="w-5 h-5 shrink-0" />
          
          {!isCollapsed && (
              <div className="ml-3 flex-1 overflow-hidden flex items-center justify-between">
                  {isEditing ? (
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRenameSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full bg-gray-900 text-white text-sm px-1 py-0.5 rounded border border-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                  ) : (
                      <>
                        <span className="text-sm font-medium truncate pr-2">{session.title}</span>
                        <div className="hidden group-hover:flex items-center space-x-1">
                            <button 
                                onClick={(e) => handleRenameStart(session.id, session.title, 'session', e)}
                                className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
                                title="Rename"
                            >
                                <PencilIcon className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(session.id, session.title, 'session', e)}
                                className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-red-400"
                                title="Delete"
                            >
                                <TrashIcon className="w-3 h-3" />
                            </button>
                        </div>
                      </>
                  )}
              </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <aside className={`bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex-1 p-4 overflow-y-auto">
        <nav>
           {/* New Chat Button */}
           <button
              onClick={() => onNavigate('chat', 'new')}
              className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200 w-full bg-blue-600 hover:bg-blue-700 text-white ${isCollapsed ? 'justify-center' : ''}`}
              title="New Chat"
            >
              <PlusCircleIcon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium ml-3">New Chat</span>}
            </button>

            {/* Create Dashboard Button */}
            <button
              onClick={handleCreateDashboard}
              className={`flex items-center p-3 mb-4 rounded-lg cursor-pointer transition-colors duration-200 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600 ${isCollapsed ? 'justify-center' : ''}`}
              title="Create Dashboard"
            >
              <DashboardIcon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium ml-3">New Dashboard</span>}
            </button>

          {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dashboards</h3>}
          <ul>
            {isCollapsed ? (
                dashboards.map(renderDashboardItem)
            ) : (
                <>
                  {topLevelDashboards.map(renderDashboardItem)}
                  {allSections.map(section => {
                    const isExpanded = expandedSections.has(section);
                    const sectionDashboards = dashboardsBySection.get(section) || [];
                    const isSectionActive = sectionDashboards.some(d => d.id === currentDashboardId);

                    return (
                      <li key={section} className="mt-2">
                        <button
                          onClick={() => toggleSection(section)}
                          className={`w-full flex items-center p-3 my-1 rounded-lg text-left transition-colors duration-200 ${isSectionActive ? 'text-white bg-gray-800' : 'text-gray-400'} hover:bg-gray-800 hover:text-white`}
                          aria-expanded={isExpanded}
                        >
                          <ChevronDownIcon className={`w-4 h-4 mr-3 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                          <span className="text-sm font-semibold truncate">{section}</span>
                        </button>
                        {isExpanded && (
                          <ul className="pl-6">
                            {sectionDashboards.map(renderDashboardItem)}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </>
            )}
          </ul>

          {/* Chat History Section */}
          {sessions.length > 0 && (
             <div className="mt-6">
                {!isCollapsed && (
                    <button
                        onClick={() => setChatHistoryExpanded(!isChatHistoryExpanded)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-300"
                    >
                        <span>Chat History</span>
                        <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isChatHistoryExpanded ? 'rotate-0' : '-rotate-90'}`} />
                    </button>
                )}
                {(isChatHistoryExpanded || isCollapsed) && (
                    <ul>
                        {sessions.map(renderSessionItem)}
                    </ul>
                )}
                {!isCollapsed && isChatHistoryExpanded && (
                    <div className="mt-2 px-3">
                        <button 
                            onClick={handleClearAll}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center"
                        >
                            <TrashIcon className="w-3 h-3 mr-1" />
                            Clear All History
                        </button>
                    </div>
                )}
             </div>
          )}

        </nav>
      </div>
      <div className="p-2 border-t border-gray-700">
         <button 
            onClick={onToggle} 
            className="w-full flex items-center justify-center p-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors duration-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
         >
            <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
