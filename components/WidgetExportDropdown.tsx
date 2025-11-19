import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { TableIcon } from './icons/TableIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { DashboardIcon } from './icons/DashboardIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { getDashboards } from '../services/dashboardService';
import type { Dashboard } from '../types';

type ExportType = 'all' | 'filtered' | 'selected';

interface WidgetExportDropdownProps {
  onExportCsv: ((type: ExportType) => void) | (() => void);
  onExportPng: () => void;
  onSeeData: () => void;
  onExportToDashboard?: (dashboardId: string, newDashboardName?: string) => void;
  hideCsv?: boolean;
  onExportXlsx?: (type: ExportType) => void;
  dataCounts?: {
      all: number;
      filtered: number;
      selected: number;
  };
}

const WidgetExportDropdown: React.FC<WidgetExportDropdownProps> = ({ 
    onExportCsv, 
    onExportPng, 
    onSeeData, 
    onExportToDashboard,
    hideCsv = false, 
    onExportXlsx, 
    dataCounts 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [newDashboardName, setNewDashboardName] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
    
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const newDashboardInputRef = useRef<HTMLInputElement>(null);

    // Calculate position when opening
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            // Position the dropdown below the button, aligned to the right
            // 192 is roughly the width of the dropdown (w-48 = 12rem = 192px)
            setDropdownPosition({
                top: rect.bottom + scrollY + 5,
                left: rect.right - 192 
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is inside trigger button
            if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
                return;
            }
            
            // Check if click is inside dropdown
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }

            setIsOpen(false);
            setIsCreatingNew(false);
        };
        
        // Handle scroll to close dropdown
        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // Capture phase for all scrolling elements
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && onExportToDashboard) {
            getDashboards().then(setDashboards);
        }
    }, [isOpen, onExportToDashboard]);

    useEffect(() => {
        if (isCreatingNew && newDashboardInputRef.current) {
            newDashboardInputRef.current.focus();
        }
    }, [isCreatingNew]);
    
    const isAdvancedExport = !!(dataCounts && onExportXlsx);

    const handleAction = (action: Function) => {
        action();
        setIsOpen(false);
    };

    const handleAdvancedCsv = (type: ExportType) => {
        (onExportCsv as (type: ExportType) => void)(type);
        setIsOpen(false);
    }

    const handleAdvancedXlsx = (type: ExportType) => {
        onExportXlsx?.(type);
        setIsOpen(false);
    }

    const handleExportToDashboardClick = (dashboardId: string) => {
        if (onExportToDashboard) {
            onExportToDashboard(dashboardId);
            setIsOpen(false);
        }
    };

    const handleCreateNewDashboard = (e: React.FormEvent) => {
        e.preventDefault();
        if (onExportToDashboard && newDashboardName.trim()) {
            onExportToDashboard('new', newDashboardName.trim());
            setIsOpen(false);
            setNewDashboardName('');
            setIsCreatingNew(false);
        }
    };
    
    const ExportSubMenuItem: React.FC<{
        label: string;
        count: number;
        onClick: () => void;
    }> = ({ label, count, onClick }) => (
         <button
            onClick={() => handleAction(onClick)}
            disabled={count === 0}
            className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
            <span>{label}</span>
            <span className="text-gray-400">{count}</span>
        </button>
    );

    const dropdownContent = (
        <div 
            ref={dropdownRef}
            className="fixed w-48 bg-gray-800 rounded-md shadow-lg py-1 z-[9999] border border-gray-700"
            style={{ 
                top: dropdownPosition?.top, 
                left: dropdownPosition?.left 
            }}
        >
            <a onClick={() => handleAction(onSeeData)} className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                <TableIcon className="w-4 h-4 mr-3" /> See Data
            </a>
            <div className="border-t border-gray-700 my-1"></div>
            
            {isAdvancedExport ? (
                <>
                    <div className="relative group">
                        <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 group-hover:bg-gray-700 cursor-default">
                            <div className="flex items-center">
                                <DocumentTextIcon className="w-4 h-4 mr-3" /> Export CSV
                            </div>
                            <ChevronRightIcon className="w-4 h-4" />
                        </div>
                        <div className="absolute right-full -top-1 w-56 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 hidden group-hover:block mr-1">
                            <ExportSubMenuItem label="Filtered Data" count={dataCounts.filtered} onClick={() => handleAdvancedCsv('filtered')} />
                            <ExportSubMenuItem label="All Data" count={dataCounts.all} onClick={() => handleAdvancedCsv('all')} />
                            <ExportSubMenuItem label="Selected Rows" count={dataCounts.selected} onClick={() => handleAdvancedCsv('selected')} />
                        </div>
                    </div>
                        <div className="relative group">
                        <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 group-hover:bg-gray-700 cursor-default">
                            <div className="flex items-center">
                                <DocumentDuplicateIcon className="w-4 h-4 mr-3" /> Export XLSX
                            </div>
                            <ChevronRightIcon className="w-4 h-4" />
                        </div>
                        <div className="absolute right-full -top-9 w-56 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 hidden group-hover:block mr-1">
                            <ExportSubMenuItem label="Filtered Data" count={dataCounts.filtered} onClick={() => handleAdvancedXlsx('filtered')} />
                            <ExportSubMenuItem label="All Data" count={dataCounts.all} onClick={() => handleAdvancedXlsx('all')} />
                            <ExportSubMenuItem label="Selected Rows" count={dataCounts.selected} onClick={() => handleAdvancedXlsx('selected')} />
                        </div>
                    </div>
                </>
            ) : (
                !hideCsv && (
                    <a onClick={() => handleAction(onExportCsv as () => void)} className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                        <DocumentTextIcon className="w-4 h-4 mr-3" /> Export to CSV
                    </a>
                )
            )}

            <a onClick={() => handleAction(onExportPng)} className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                <PhotoIcon className="w-4 h-4 mr-3" /> Export to PNG
            </a>

            {onExportToDashboard && (
                <div className="relative group">
                    <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 group-hover:bg-gray-700 cursor-default border-t border-gray-700 mt-1 pt-1">
                        <div className="flex items-center">
                            <DashboardIcon className="w-4 h-4 mr-3" /> Add to Dashboard
                        </div>
                        <ChevronRightIcon className="w-4 h-4" />
                    </div>
                    
                    {/* Dashboard Submenu */}
                    <div className="absolute right-full bottom-0 w-64 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 hidden group-hover:block max-h-80 overflow-y-auto mr-1">
                        <div className="px-2 py-1 border-b border-gray-700">
                            {isCreatingNew ? (
                                <form onSubmit={handleCreateNewDashboard} className="flex items-center">
                                    <input 
                                        ref={newDashboardInputRef}
                                        type="text" 
                                        value={newDashboardName}
                                        onChange={(e) => setNewDashboardName(e.target.value)}
                                        placeholder="Dashboard Name"
                                        className="w-full bg-gray-900 text-xs text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 outline-none"
                                        onKeyDown={(e) => e.stopPropagation()}
                                    />
                                    <button type="submit" className="ml-1 text-blue-400 hover:text-blue-300">
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                </form>
                            ) : (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent menu closing
                                        setIsCreatingNew(true);
                                    }}
                                    className="flex items-center w-full text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-700/50"
                                >
                                    <PlusCircleIcon className="w-4 h-4 mr-2" />
                                    Create New Dashboard
                                </button>
                            )}
                        </div>
                        
                        {dashboards.length > 0 ? (
                            dashboards.filter(d => d.type === 'dashboard').map(dashboard => (
                                <button
                                    key={dashboard.id}
                                    onClick={() => handleExportToDashboardClick(dashboard.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 truncate"
                                    title={dashboard.title}
                                >
                                    {dashboard.title}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-xs text-gray-500 italic">
                                No existing dashboards
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="absolute top-4 right-4">
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                aria-label="Export options"
            >
                <DotsVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && dropdownPosition && ReactDOM.createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default WidgetExportDropdown;
