import React, { useState, useRef, useEffect } from 'react';
import type { DataSource } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { TableIcon } from './icons/TableIcon';

interface DataSourceSelectorProps {
    dataSources: DataSource[];
    onSelect: (sourceName: string) => void;
}

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({ dataSources, onSelect }) => {
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
    
    const handleSelect = (sourceName: string) => {
        onSelect(sourceName);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white w-56"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <span className="truncate">View Data Source</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700 max-h-60 overflow-y-auto">
                    {dataSources.map(source => (
                        <a
                            key={source.name}
                            onClick={() => handleSelect(source.name)}
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                            title={source.description}
                        >
                            <TableIcon className="w-4 h-4 mr-3" />
                            <span className="truncate">{source.name}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DataSourceSelector;
