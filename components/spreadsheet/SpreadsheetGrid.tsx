import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
// FIX: Using namespace import for react-window to resolve module issues.
import * as ReactWindow from 'react-window';
import HeaderCell from './HeaderCell';
import Cell from './Cell';

const Grid = ReactWindow.VariableSizeGrid;
const List = ReactWindow.VariableSizeList;

const ROW_HEIGHT = 40;
const HEADER_ROW_HEIGHT_WITH_FILTER = 68;
const MIN_COLUMN_WIDTH = 70;
const ROW_HEADER_WIDTH = 60;


interface SpreadsheetGridProps {
    columns: string[];
    data: any[];
    selection: Set<string>;
    sort: { key: string; direction: 'asc' | 'desc' } | null;
    filters: { [key: string]: string };
    onCellMouseDown: (row: number, col: number, event: React.MouseEvent) => void;
    onCellMouseEnter: (row: number, col: number) => void;
    onSort: (key: string) => void;
    onFilterChange: (column: string, value: string) => void;
    onRowHeaderClick: (row: number) => void;
    onContextMenu: (event: React.MouseEvent, row: number, col: number) => void;
    onSelectAll: () => void;
    isEditable?: boolean;
    editingCell: { row: number; col: number; } | null;
    editValue: string;
    onEditValueChange: (value: string) => void;
    onCellDoubleClick: (row: number, col: number) => void;
    onCommitEdit: () => void;
    onEditKeyDown: (event: React.KeyboardEvent, row: number, col: number) => void;
}

// Helper function to measure text width using a shared canvas for performance.
const measureText = (() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    return (text: string, font: string): number => {
        if (!context) {
            return text.length * 8; // Fallback
        }
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    };
})();

const GridCellRenderer = React.memo(({ columnIndex, rowIndex, style, data: itemData }: ReactWindow.GridChildComponentProps) => {
    const { 
        columns, data, selection, sort, onCellMouseDown, onCellMouseEnter, onSort, filters, onFilterChange, 
        activeFilterPopover, onToggleFilterPopover, onContextMenu, onResizeStart, onResizeDoubleClick,
        isEditable, editingCell, editValue, onEditValueChange, onCellDoubleClick, onCommitEdit, onEditKeyDown
    } = itemData;

    if (rowIndex === 0) {
        const columnKey = columns[columnIndex];
        return (
            <HeaderCell
                label={columnKey}
                style={style}
                onSort={() => onSort(columnKey)}
                sortDirection={sort?.key === columnKey ? sort.direction : undefined}
                filterValue={filters[columnKey] || ''}
                onFilterChange={(value) => onFilterChange(columnKey, value)}
                isFilterPopoverActive={activeFilterPopover === columnKey}
                onToggleFilterPopover={() => onToggleFilterPopover(columnKey)}
                onResizeStart={(e) => onResizeStart(columnIndex, e)}
                onResizeDoubleClick={() => onResizeDoubleClick(columnIndex)}
            />
        );
    }

    const dataRowIndex = rowIndex - 1;
    const row = data[dataRowIndex];
    const cellData = row ? row[columns[columnIndex]] : null;
    const cellId = `R${dataRowIndex}C${columnIndex}`;
    const isSelected = selection.has(cellId);
    
    // Check editing against the original data index, not the paginated/filtered one
    const isEditing = isEditable && editingCell?.row === dataRowIndex && editingCell?.col === columnIndex;
    
    return (
        <Cell
            value={cellData}
            style={style}
            isSelected={isSelected}
            isEditing={isEditing}
            editValue={editValue}
            onMouseDown={(e) => onCellMouseDown(dataRowIndex, columnIndex, e)}
            onMouseEnter={() => onCellMouseEnter(dataRowIndex, columnIndex)}
            onContextMenu={(e) => onContextMenu(e, dataRowIndex, columnIndex)}
            onDoubleClick={() => onCellDoubleClick(dataRowIndex, columnIndex)}
            onEditValueChange={onEditValueChange}
            onCommitEdit={onCommitEdit}
            onEditKeyDown={(e) => onEditKeyDown(e, dataRowIndex, columnIndex)}
        />
    );
});


const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = (props) => {
    const { columns, data, onRowHeaderClick, onSelectAll } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<ReactWindow.VariableSizeGrid>(null);
    const rowHeaderRef = useRef<ReactWindow.VariableSizeList>(null);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [columnWidths, setColumnWidths] = useState<number[]>([]);
    const [activeFilterPopover, setActiveFilterPopover] = useState<string | null>(null);

    const calculateColumnWidth = useCallback((colKey: string, dataRows: any[]) => {
        const headerFont = 'bold 16px ui-sans-serif, system-ui, sans-serif';
        const cellFont = '16px ui-sans-serif, system-ui, sans-serif';
        const headerPadding = 72;
        const cellPadding = 24;

        const headerText = colKey || '';
        let maxWidth = measureText(headerText, headerFont) + headerPadding;

        // Always scan all rows for accuracy on initial load and double-click.
        const sampleSize = dataRows.length;

        for (let i = 0; i < sampleSize; i++) {
            const cellValue = dataRows[i]?.[colKey];
            if (cellValue != null) {
                const cellText = String(cellValue);
                const cellWidth = measureText(cellText, cellFont) + cellPadding;
                if (cellWidth > maxWidth) {
                    maxWidth = cellWidth;
                }
            }
        }
        
        return Math.max(MIN_COLUMN_WIDTH, Math.min(maxWidth, 500));
    }, []);

    const calculateInitialWidths = useCallback((cols: string[], dataRows: any[]) => {
        if (cols.length === 0 || dataRows.length === 0) {
            return cols.map(() => MIN_COLUMN_WIDTH);
        }
        return cols.map(colKey => calculateColumnWidth(colKey, dataRows));
    }, [calculateColumnWidth]);

    useEffect(() => {
        if (columns.length > 0 && data.length > 0) {
            setColumnWidths(calculateInitialWidths(columns, data));
        }
    }, [columns, data, calculateInitialWidths]);

    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.resetAfterColumnIndex(0);
        }
    }, [columnWidths]);
    
    useEffect(() => {
        if (containerRef.current) {
            const resizeObserver = new ResizeObserver(entries => {
                if (entries[0]) {
                    const { width, height } = entries[0].contentRect;
                    setDimensions({ width, height });
                }
            });
            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }
    }, []);

    const resizeColumnIndex = useRef<number | null>(null);
    const resizeStartX = useRef<number | null>(null);
    const resizeStartWidth = useRef<number | null>(null);

    const onResizeStart = useCallback((colIndex: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizeColumnIndex.current = colIndex;
        resizeStartX.current = e.clientX;
        resizeStartWidth.current = columnWidths[colIndex];

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (resizeColumnIndex.current === null || resizeStartX.current === null || resizeStartWidth.current === null) return;
            const diff = moveEvent.clientX - resizeStartX.current;
            const newWidth = resizeStartWidth.current + diff;

            if (newWidth > MIN_COLUMN_WIDTH) {
                setColumnWidths(prev => {
                    const newWidths = [...prev];
                    newWidths[resizeColumnIndex.current!] = newWidth;
                    return newWidths;
                });
                gridRef.current?.resetAfterColumnIndex(resizeColumnIndex.current);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [columnWidths]);

    const onResizeDoubleClick = useCallback((colIndex: number) => {
        const colKey = columns[colIndex];
        if (!colKey) return;
        
        const newWidth = calculateColumnWidth(colKey, data);
    
        setColumnWidths(prev => {
            const newWidths = [...prev];
            newWidths[colIndex] = newWidth;
            return newWidths;
        });
        gridRef.current?.resetAfterColumnIndex(colIndex);
    }, [calculateColumnWidth, columns, data]);

    const handleToggleFilterPopover = useCallback((columnKey: string) => {
        setActiveFilterPopover(prev => (prev === columnKey ? null : columnKey));
    }, []);

    const itemData = useMemo(() => ({
        ...props,
        onToggleFilterPopover: handleToggleFilterPopover,
        activeFilterPopover,
        onResizeStart,
        onResizeDoubleClick,
    }), [props, activeFilterPopover, onResizeStart, onResizeDoubleClick]);

    const handleGridScroll = ({ scrollTop }: { scrollTop: number }) => {
        if (rowHeaderRef.current) {
            rowHeaderRef.current.scrollTo(scrollTop);
        }
    };
    
    const rowHeaderItemData = useMemo(() => ({ onRowHeaderClick }), [onRowHeaderClick]);
    
    return (
        <div ref={containerRef} className="w-full h-full flex select-none" onClick={() => setActiveFilterPopover(null)}>
            <div className="flex-shrink-0 z-20" style={{ width: ROW_HEADER_WIDTH }}>
                <div className="h-full flex flex-col">
                    <div style={{ height: HEADER_ROW_HEIGHT_WITH_FILTER }} className="flex items-center justify-center bg-gray-800 border-b-2 border-r border-gray-700">
                         <button onClick={onSelectAll} className="w-full h-full text-gray-400 hover:bg-gray-700" title="Select All"></button>
                    </div>
                    <div className="flex-grow">
                        <List
                            ref={rowHeaderRef}
                            height={dimensions.height - HEADER_ROW_HEIGHT_WITH_FILTER}
                            itemCount={data.length}
                            itemSize={() => ROW_HEIGHT}
                            width={ROW_HEADER_WIDTH}
                            itemData={rowHeaderItemData}
                            className="row-header-list"
                        >
                            {({ index, style, data: listData }) => (
                                <div
                                    style={style}
                                    className="flex items-center justify-center bg-gray-800 border-b border-r border-gray-700 text-gray-400 cursor-pointer hover:bg-gray-700"
                                    onClick={() => listData.onRowHeaderClick(index)}
                                >
                                    {index + 1}
                                </div>
                            )}
                        </List>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden">
                 <Grid
                    ref={gridRef}
                    className="spreadsheet-grid-body"
                    columnCount={columns.length}
                    rowCount={data.length + 1}
                    columnWidth={index => columnWidths[index] || MIN_COLUMN_WIDTH}
                    rowHeight={index => index === 0 ? HEADER_ROW_HEIGHT_WITH_FILTER : ROW_HEIGHT}
                    width={dimensions.width - ROW_HEADER_WIDTH}
                    height={dimensions.height}
                    itemData={itemData}
                    onScroll={handleGridScroll}
                    overscanRowCount={10}
                >
                    {GridCellRenderer}
                </Grid>
            </div>
        </div>
    );
};

export default SpreadsheetGrid;