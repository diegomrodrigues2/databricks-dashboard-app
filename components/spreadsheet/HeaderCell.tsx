import React from 'react';
import { ArrowUpIcon } from '../icons/ArrowUpIcon';
import { ArrowDownIcon } from '../icons/ArrowDownIcon';
import { FilterIcon } from '../icons/FilterIcon';

interface HeaderCellProps {
    label: string;
    style: React.CSSProperties;
    onSort: () => void;
    sortDirection?: 'asc' | 'desc';
    filterValue: string;
    onFilterChange: (value: string) => void;
    isFilterPopoverActive: boolean;
    onToggleFilterPopover: () => void;
    onResizeStart: (e: React.MouseEvent) => void;
    onResizeDoubleClick: () => void;
}

const HeaderCell: React.FC<HeaderCellProps> = ({ label, style, onSort, sortDirection, filterValue, onFilterChange, isFilterPopoverActive, onToggleFilterPopover, onResizeStart, onResizeDoubleClick }) => {
    const hasFilter = filterValue && filterValue.trim() !== '';

    return (
        <div style={style}>
            <div
                className="relative flex flex-col justify-center px-3 py-2 h-full font-bold bg-gray-800 border-b-2 border-r border-gray-700 text-white select-none"
            >
                <div className="flex items-center justify-between w-full">
                    <span
                        onClick={onSort}
                        className="flex items-center flex-grow h-full cursor-pointer hover:text-gray-300 truncate"
                        title={`Sort by ${label}`}
                    >
                        {label}
                        <span className="w-4 h-4 ml-1 text-gray-400 shrink-0">
                            {sortDirection === 'asc' && <ArrowUpIcon />}
                            {sortDirection === 'desc' && <ArrowDownIcon />}
                        </span>
                    </span>
                    <button
                        onClick={onToggleFilterPopover}
                        className={`p-1 rounded-md hover:bg-gray-600 ml-2 ${isFilterPopoverActive ? 'bg-gray-600' : ''}`}
                        aria-label={`Filter by ${label}`}
                    >
                        <FilterIcon className={`w-4 h-4 ${hasFilter ? 'text-blue-400' : 'text-gray-400'}`} />
                    </button>
                </div>
                {isFilterPopoverActive && (
                    <div
                        className="mt-2"
                        onMouseDown={(e) => e.stopPropagation()} // Prevent outside click from closing immediately
                    >
                        <input
                            type="text"
                            placeholder={`Filter...`}
                            value={filterValue}
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white"
                            style={{ userSelect: 'auto' }}
                            autoFocus
                        />
                    </div>
                )}
                <div
                    className="absolute top-0 right-0 h-full w-4 cursor-col-resize group z-10"
                    style={{ transform: 'translateX(50%)' }}
                    onMouseDown={onResizeStart}
                    onDoubleClick={(e) => { e.stopPropagation(); onResizeDoubleClick(); }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-px h-full bg-transparent group-hover:bg-blue-400 mx-auto transition-colors duration-200"></div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(HeaderCell);