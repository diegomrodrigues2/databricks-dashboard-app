import React, { useReducer, useMemo, useCallback, useEffect, useState, useRef } from 'react';
import SpreadsheetGrid from './SpreadsheetGrid';
import SpreadsheetSummary from './SpreadsheetSummary';
import { XIcon } from '../icons/XIcon';
import ContextMenu from './ContextMenu';

interface SpreadsheetProps {
    title: string;
    data: any[];
    onClose: () => void;
    isEditable?: boolean;
}

const copyToClipboard = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Clipboard API failed, falling back.', err);
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
};

const fallbackCopy = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (!successful) {
        console.error('Fallback copy command failed.');
    }
  } catch (err) {
    console.error('Fallback copy failed with error:', err);
  }
  document.body.removeChild(textArea);
};

type SortDirection = 'asc' | 'desc';

interface State {
    originalData: any[];
    columns: string[];
    filters: { [key: string]: string };
    sort: {
        key: string;
        direction: SortDirection;
    } | null;
    selection: Set<string>;
    lastSelectedCell: { row: number; col: number } | null;
    isDragging: boolean;
}

type Action =
    | { type: 'SET_DATA'; payload: any[] }
    | { type: 'UPDATE_CELL'; payload: { rowIndex: number; colIndex: number; value: any } }
    | { type: 'SET_FILTER'; payload: { column: string; value: string } }
    | { type: 'CLEAR_FILTERS' }
    | { type: 'SET_SORT'; payload: string }
    | { type: 'SELECT_CELL'; payload: { row: number; col: number; ctrlKey: boolean; shiftKey: boolean } }
    | { type: 'SELECT_ROW'; payload: { row: number } }
    | { type: 'SELECT_ALL'; payload: { rowCount: number; colCount: number } }
    | { type: 'START_DRAG_SELECTION'; payload: { row: number; col: number } }
    | { type: 'UPDATE_DRAG_SELECTION'; payload: { row: number; col: number } }
    | { type: 'END_DRAG_SELECTION' };

function spreadsheetReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_DATA': {
             const columns = action.payload.length > 0 ? Object.keys(action.payload[0]) : [];
             return {
                ...state,
                originalData: action.payload,
                columns,
                filters: {},
                sort: null,
                selection: new Set(),
                lastSelectedCell: null,
                isDragging: false,
            };
        }
        case 'UPDATE_CELL': {
            const { rowIndex, colIndex, value } = action.payload;
            const newData = [...state.originalData];
            const columnKey = state.columns[colIndex];
            
            if (newData[rowIndex]) {
                const originalValue = newData[rowIndex][columnKey];
                let newValue = value;

                if (typeof originalValue === 'number' && !isNaN(originalValue)) {
                    const parsed = parseFloat(value);
                    newValue = isNaN(parsed) ? originalValue : parsed;
                } else if (typeof originalValue === 'boolean') {
                    if (String(value).toLowerCase() === 'true') newValue = true;
                    else if (String(value).toLowerCase() === 'false') newValue = false;
                    else newValue = originalValue;
                }
                
                newData[rowIndex] = { ...newData[rowIndex], [columnKey]: newValue };
            }

            return { ...state, originalData: newData };
        }
        case 'SET_FILTER': {
            const { column, value } = action.payload;
            const newFilters = { ...state.filters };
            if (value && value.trim() !== '') {
                newFilters[column] = value;
            } else {
                delete newFilters[column];
            }
            return { ...state, filters: newFilters, selection: new Set() };
        }
        case 'CLEAR_FILTERS':
            return { ...state, filters: {}, selection: new Set() };
        case 'SET_SORT': {
            const newSortKey = action.payload;
            let newDirection: SortDirection = 'asc';
            if (state.sort && state.sort.key === newSortKey && state.sort.direction === 'asc') {
                newDirection = 'desc';
            }
            return { ...state, sort: { key: newSortKey, direction: newDirection }, selection: new Set() };
        }
        case 'SELECT_CELL': {
            const { row, col, ctrlKey, shiftKey } = action.payload;
            const newSelection = new Set(ctrlKey ? state.selection : []);
            const cellId = `R${row}C${col}`;

            if (shiftKey && state.lastSelectedCell) {
                const { row: lastRow, col: lastCol } = state.lastSelectedCell;
                const minRow = Math.min(row, lastRow);
                const maxRow = Math.max(row, lastRow);
                const minCol = Math.min(col, lastCol);
                const maxCol = Math.max(col, lastCol);
                for (let r = minRow; r <= maxRow; r++) {
                    for (let c = minCol; c <= maxCol; c++) {
                        newSelection.add(`R${r}C${c}`);
                    }
                }
            } else {
                if (state.selection.has(cellId) && ctrlKey) {
                    newSelection.delete(cellId);
                } else {
                    newSelection.add(cellId);
                }
            }
            return { ...state, selection: newSelection, lastSelectedCell: { row, col } };
        }
        case 'SELECT_ROW': {
            const { row } = action.payload;
            const newSelection = new Set<string>();
            for (let c = 0; c < state.columns.length; c++) {
                newSelection.add(`R${row}C${c}`);
            }
            return { ...state, selection: newSelection };
        }
        case 'SELECT_ALL': {
            const { rowCount, colCount } = action.payload;
            const newSelection = new Set<string>();
            for (let r = 0; r < rowCount; r++) {
                for (let c = 0; c < colCount; c++) {
                    newSelection.add(`R${r}C${c}`);
                }
            }
            return { ...state, selection: newSelection };
        }
        case 'START_DRAG_SELECTION': {
            const { row, col } = action.payload;
            const cellId = `R${row}C${col}`;
            return {
                ...state,
                isDragging: true,
                selection: new Set([cellId]),
                lastSelectedCell: { row, col },
            };
        }
        case 'UPDATE_DRAG_SELECTION': {
            if (!state.isDragging || !state.lastSelectedCell) return state;
            const { row, col } = action.payload;
            const newSelection = new Set<string>();
            const { row: startRow, col: startCol } = state.lastSelectedCell;
            const minRow = Math.min(row, startRow);
            const maxRow = Math.max(row, startRow);
            const minCol = Math.min(col, startCol);
            const maxCol = Math.max(col, startCol);

            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    newSelection.add(`R${r}C${c}`);
                }
            }
            return { ...state, selection: newSelection };
        }
        case 'END_DRAG_SELECTION':
            return { ...state, isDragging: false };
        default:
            return state;
    }
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({ title, data, onClose, isEditable = false }) => {
    const initialState: State = {
        originalData: [],
        columns: [],
        filters: {},
        sort: null,
        selection: new Set(),
        lastSelectedCell: null,
        isDragging: false,
    };

    const [state, dispatch] = useReducer(spreadsheetReducer, initialState);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const gridContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dispatch({ type: 'SET_DATA', payload: data });
    }, [data]);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const filteredAndSortedData = useMemo(() => {
        let processedData = [...state.originalData];
        const activeFilters = Object.entries(state.filters).filter(([, value]) => value);
        if (activeFilters.length > 0) {
            processedData = processedData.filter(row =>
                activeFilters.every(([key, value]) => String(row[key]).toLowerCase().includes(String(value).toLowerCase()))
            );
        }
        if (state.sort) {
            const { key, direction } = state.sort;
            processedData.sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return processedData;
    }, [state.originalData, state.filters, state.sort]);

    const performCopy = useCallback(() => {
        if (state.selection.size === 0) return;

        const rows = new Set<number>();
        const cols = new Set<number>();
        state.selection.forEach(cellId => {
            const match = cellId.match(/R(\d+)C(\d+)/);
            if (match) {
                rows.add(parseInt(match[1], 10));
                cols.add(parseInt(match[2], 10));
            }
        });

        const minRow = Math.min(...rows);
        const maxRow = Math.max(...rows);
        const minCol = Math.min(...cols);
        const maxCol = Math.max(...cols);

        let tsvString = '';
        for (let r = minRow; r <= maxRow; r++) {
            const rowValues = [];
            for (let c = minCol; c <= maxCol; c++) {
                if (state.selection.has(`R${r}C${c}`)) {
                    const value = filteredAndSortedData[r]?.[state.columns[c]];
                    rowValues.push(value === null || value === undefined ? '' : String(value));
                } else {
                    rowValues.push('');
                }
            }
            tsvString += rowValues.join('\t') + '\n';
        }
        copyToClipboard(tsvString);
    }, [state.selection, state.columns, filteredAndSortedData]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const isEditing = target.tagName === 'INPUT';
            if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !isEditing) {
                if (state.selection.size > 0) {
                    event.preventDefault();
                    performCopy();
                }
            }
        };
        
        const containerEl = gridContainerRef.current;
        if (containerEl) {
            containerEl.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            if (containerEl) {
                containerEl.removeEventListener('keydown', handleKeyDown);
            }
        }
    }, [performCopy, state.selection.size]);

    const handleCommitEdit = useCallback(() => {
        if (!editingCell) return;

        const rowObject = filteredAndSortedData[editingCell.row];
        if (!rowObject) return;

        const originalRowIndex = state.originalData.findIndex(item => item === rowObject);
        if (originalRowIndex === -1) return;

        dispatch({ type: 'UPDATE_CELL', payload: { rowIndex: originalRowIndex, colIndex: editingCell.col, value: editValue } });
        setEditingCell(null);
    }, [editingCell, editValue, filteredAndSortedData, state.originalData]);

    const handleCellDoubleClick = useCallback((row: number, col: number) => {
        if (!isEditable) return;
        const value = filteredAndSortedData[row]?.[state.columns[col]];
        setEditingCell({ row, col });
        setEditValue(value === null || value === undefined ? '' : String(value));
    }, [isEditable, filteredAndSortedData, state.columns]);

    const handleEditKeyDown = useCallback((event: React.KeyboardEvent, row: number, col: number) => {
        if (event.key === 'Enter') {
            handleCommitEdit();
        } else if (event.key === 'Escape') {
            setEditingCell(null);
        } else if (event.key === 'Tab') {
            event.preventDefault();
            handleCommitEdit();
            
            setTimeout(() => {
                const nextCol = event.shiftKey ? col - 1 : col + 1;
                if (nextCol >= 0 && nextCol < state.columns.length) {
                    handleCellDoubleClick(row, nextCol);
                } else {
                     setEditingCell(null);
                }
            }, 0);
        }
    }, [handleCommitEdit, state.columns.length, handleCellDoubleClick]);


    const handleContextMenu = useCallback((event: React.MouseEvent, row: number, col: number) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
        const cellId = `R${row}C${col}`;
        if (!state.selection.has(cellId)) {
            dispatch({ type: 'SELECT_CELL', payload: { row, col, ctrlKey: false, shiftKey: false } });
        }
    }, [state.selection]);

    const handleContextMenuCopy = useCallback(() => {
        performCopy();
        setContextMenu(null);
    }, [performCopy]);

    const handleCellMouseDown = useCallback((row: number, col: number, e: React.MouseEvent) => {
        if (editingCell?.row === row && editingCell?.col === col) return;
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            dispatch({ type: 'SELECT_CELL', payload: { row, col, ctrlKey: e.ctrlKey || e.metaKey, shiftKey: e.shiftKey } });
        } else {
            dispatch({ type: 'START_DRAG_SELECTION', payload: { row, col } });
        }
    }, [editingCell]);

    const handleCellMouseEnter = useCallback((row: number, col: number) => {
        if (state.isDragging) {
            dispatch({ type: 'UPDATE_DRAG_SELECTION', payload: { row, col } });
        }
    }, [state.isDragging]);

    return (
        <div 
            ref={gridContainerRef}
            tabIndex={-1}
            className="h-full flex flex-col p-4 bg-gray-900 spreadsheet-container outline-none"
            onMouseUp={() => dispatch({ type: 'END_DRAG_SELECTION' })}
            onMouseLeave={() => state.isDragging && dispatch({ type: 'END_DRAG_SELECTION' })}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-100">{title}</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
                    <XIcon className="w-6 h-6 text-gray-400" />
                </button>
            </div>
            <div className="flex-grow min-h-0">
                <SpreadsheetGrid
                    columns={state.columns}
                    data={filteredAndSortedData}
                    selection={state.selection}
                    sort={state.sort}
                    filters={state.filters}
                    onCellMouseDown={handleCellMouseDown}
                    onCellMouseEnter={handleCellMouseEnter}
                    onSort={(key) => dispatch({ type: 'SET_SORT', payload: key })}
                    onFilterChange={(column, value) => dispatch({ type: 'SET_FILTER', payload: { column, value } })}
                    onRowHeaderClick={(row) => dispatch({ type: 'SELECT_ROW', payload: { row } })}
                    onSelectAll={() => dispatch({ type: 'SELECT_ALL', payload: { rowCount: filteredAndSortedData.length, colCount: state.columns.length }})}
                    onContextMenu={handleContextMenu}
                    isEditable={isEditable}
                    editingCell={editingCell}
                    editValue={editValue}
                    onEditValueChange={setEditValue}
                    onCellDoubleClick={handleCellDoubleClick}
                    onCommitEdit={handleCommitEdit}
                    onEditKeyDown={handleEditKeyDown}
                />
            </div>
            <div className="mt-4">
                <SpreadsheetSummary columns={state.columns} data={filteredAndSortedData} selection={state.selection} />
            </div>
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onCopy={handleContextMenuCopy} />}
        </div>
    );
};

export default Spreadsheet;