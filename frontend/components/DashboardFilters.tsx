

import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3-array';
import type { DashboardFilterConfig } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { XIcon } from './icons/XIcon';
import { CheckIcon } from './icons/CheckIcon';

interface DashboardFiltersProps {
    config: DashboardFilterConfig[];
    data: { [key: string]: any[] };
    activeFilters: { [key: string]: any };
    onFilterChange: (filters: { [key: string]: any }) => void;
    onClearAllFilters: () => void;
}

const MultiSelectFilter: React.FC<{
    options: string[];
    label: string;
    selected: string[];
    onChange: (selected: string[]) => void;
    onClear: () => void;
}> = ({ options, label, selected, onChange, onClear }) => {
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

    const handleToggle = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    const getButtonText = () => {
        if (selected.length === 0) return label;
        if (selected.length === 1) return selected[0];
        return `${selected.length} Selected`;
    };

    return (
        <div className="relative w-full md:w-56" ref={dropdownRef}>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white"
                >
                    <span className="truncate">{getButtonText()}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {selected.length > 0 && (
                    <button onClick={onClear} className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white">
                        <XIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-full bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700 max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <a
                            key={option}
                            onClick={() => handleToggle(option)}
                            className="flex items-center justify-between px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                        >
                            <span>{option}</span>
                            {selected.includes(option) && <CheckIcon className="w-4 h-4 text-white" />}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const DateRangeFilter: React.FC<{
    value: { start?: string; end?: string };
    onChange: (value: { start?: string; end?: string }) => void;
    onClear: () => void;
    min?: string;
    max?: string;
}> = ({ value, onChange, onClear, min, max }) => {
    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, start: e.target.value });
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...value, end: e.target.value });
    };

    const hasValue = value.start || value.end;

    return (
        <div className="flex items-center gap-2">
            <input
                type="date"
                value={value.start || ''}
                onChange={handleStartChange}
                min={min}
                max={max}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Start date"
            />
            <span className="text-gray-400">-</span>
            <input
                type="date"
                value={value.end || ''}
                onChange={handleEndChange}
                min={value.start || min}
                max={max}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="End date"
            />
            {hasValue && (
                <button onClick={onClear} className="p-2 text-gray-400 hover:text-white" aria-label="Clear date range">
                    <XIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};


const DashboardFilters: React.FC<DashboardFiltersProps> = ({ config, data, activeFilters, onFilterChange, onClearAllFilters }) => {
    
    const filterOptions = useMemo(() => {
        const options: { [key: string]: string[] } = {};
        config.forEach(filter => {
            if (filter.type === 'select' || filter.type === 'multiselect') {
                const sourceData = data[filter.dataSource] || [];
                const uniqueValues = [...new Set(sourceData.map(item => item[filter.column]))].filter(Boolean).sort();
                options[filter.column] = uniqueValues as string[];
            }
        });
        return options;
    }, [config, data]);

    const dateRanges = useMemo(() => {
        const ranges: { [key: string]: { min?: string; max?: string } } = {};
        const dateRangeConfigs = config.filter(f => f.type === 'daterange');
        
        dateRangeConfigs.forEach(filter => {
            const sourceData = data[filter.dataSource] || [];
            if (sourceData.length > 0) {
                const dates = sourceData.map(item => new Date(item[filter.column])).filter(d => !isNaN(d.getTime()));
                if (dates.length > 0) {
                    const minDate = d3.min(dates);
                    const maxDate = d3.max(dates);
                    ranges[filter.column] = {
                        min: minDate?.toISOString().split('T')[0],
                        max: maxDate?.toISOString().split('T')[0],
                    };
                }
            }
        });
        return ranges;
    }, [config, data]);


    const handleFilterValueChange = (column: string, value: any) => {
        onFilterChange({ ...activeFilters, [column]: value });
    };

    const clearFilter = (column: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[column];
        onFilterChange(newFilters);
    };

    const hasActiveFilters = useMemo(() => {
        return Object.entries(activeFilters).some(([key, value]) => {
            const configForFilter = config.find(c => c.column === key);
            if (configForFilter?.type === 'daterange') {
                // FIX: Cast the 'value' for daterange to its expected object shape to resolve 'unknown' type error.
                const dateValue = value as { start?: string; end?: string };
                return dateValue?.start || dateValue?.end;
            }
            if (Array.isArray(value)) return value.length > 0;
            return value !== '' && value !== null && value !== undefined;
        });
    }, [activeFilters, config]);

    return (
        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex flex-wrap items-end gap-4">
                {config.map(filter => (
                    <div key={filter.column} className="flex flex-col items-start gap-1">
                        <label className="text-gray-400 text-sm font-bold">{filter.label}</label>
                        {filter.type === 'text' && (
                            <div className="relative w-full md:w-56">
                                <input
                                    type="text"
                                    value={activeFilters[filter.column] || ''}
                                    onChange={(e) => handleFilterValueChange(filter.column, e.target.value)}
                                    className="w-full pl-3 pr-8 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white"
                                    placeholder={`Search by ${filter.label}...`}
                                />
                                {activeFilters[filter.column] && (
                                    <button onClick={() => clearFilter(filter.column)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                        {filter.type === 'select' && (
                           <div className="relative w-full md:w-56">
                                <select
                                    value={activeFilters[filter.column] || ''}
                                    onChange={(e) => handleFilterValueChange(filter.column, e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white appearance-none"
                                >
                                    <option value="">All</option>
                                    {filterOptions[filter.column]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                           </div>
                        )}
                         {filter.type === 'multiselect' && (
                           <MultiSelectFilter
                                options={filterOptions[filter.column] || []}
                                label={filter.label}
                                selected={activeFilters[filter.column] || []}
                                onChange={(value) => handleFilterValueChange(filter.column, value)}
                                onClear={() => clearFilter(filter.column)}
                           />
                        )}
                        {filter.type === 'daterange' && (
                            <DateRangeFilter
                                value={activeFilters[filter.column] || {}}
                                onChange={(value) => handleFilterValueChange(filter.column, value)}
                                onClear={() => clearFilter(filter.column)}
                                min={dateRanges[filter.column]?.min}
                                max={dateRanges[filter.column]?.max}
                            />
                        )}
                    </div>
                ))}
                {hasActiveFilters && (
                    <button
                        onClick={onClearAllFilters}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors text-sm flex items-center gap-2"
                        aria-label="Clear all filters"
                    >
                        <XIcon className="w-4 h-4" />
                        <span>Clear Filters</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default DashboardFilters;
