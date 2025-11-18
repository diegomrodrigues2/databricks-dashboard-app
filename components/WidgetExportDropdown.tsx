import React, { useState, useRef, useEffect } from 'react';
import { DotsVerticalIcon } from './icons/DotsVerticalIcon';
import { TableIcon } from './icons/TableIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';


type ExportType = 'all' | 'filtered' | 'selected';

interface WidgetExportDropdownProps {
  onExportCsv: ((type: ExportType) => void) | (() => void);
  onExportPng: () => void;
  onSeeData: () => void;
  hideCsv?: boolean;
  onExportXlsx?: (type: ExportType) => void;
  dataCounts?: {
      all: number;
      filtered: number;
      selected: number;
  };
}

const WidgetExportDropdown: React.FC<WidgetExportDropdownProps> = ({ onExportCsv, onExportPng, onSeeData, hideCsv = false, onExportXlsx, dataCounts }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
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

    return (
        <div className="absolute top-4 right-4" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                aria-label="Export options"
            >
                <DotsVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
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
                                <div className="absolute left-full -top-1 w-56 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 hidden group-hover:block">
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
                                <div className="absolute left-full -top-9 w-56 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 hidden group-hover:block">
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
                </div>
            )}
        </div>
    );
};

export default WidgetExportDropdown;