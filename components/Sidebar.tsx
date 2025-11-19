

import React, { useState, useEffect, useMemo } from 'react';
import { getDashboards } from '../services/dashboardService';
import type { Dashboard, Page } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ChevronDoubleLeftIcon } from './icons/ChevronDoubleLeftIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface SidebarProps {
  currentPage: Page;
  currentDashboardId: string;
  onNavigate: (page: Page, dashboardId?: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, currentDashboardId, onNavigate, isCollapsed, onToggle }) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    getDashboards().then(setDashboards);
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

  const navItemClasses = (dashboardId: string, dashboardType?: 'dashboard' | 'chat') =>
    `flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 w-full ${
      dashboardType === 'chat'
        ? currentPage === 'chat'
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        : currentPage === 'dashboard' && currentDashboardId === dashboardId 
          ? 'bg-gray-700 text-white' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    } ${isCollapsed ? 'justify-center' : ''}`;

  const renderDashboardItem = (dashboard: Dashboard) => {
    const handleClick = () => {
      if (dashboard.type === 'chat') {
        onNavigate('chat');
      } else {
        onNavigate('dashboard', dashboard.id);
      }
    };

    const IconComponent = dashboard.type === 'chat' ? DocumentTextIcon : DashboardIcon;

    return (
      <li key={dashboard.id} onClick={handleClick} title={isCollapsed ? dashboard.title : undefined}>
        <a className={navItemClasses(dashboard.id, dashboard.type)}>
          <IconComponent className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium ml-3">{dashboard.title}</span>}
        </a>
      </li>
    );
  };

  return (
    <aside className={`bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex-1 p-4 overflow-y-auto">
        <nav>
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