import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import * as d3Chromatic from 'd3-scale-chromatic';
import type { DataTableWidgetConfig, MiniBarChartDrilldownConfig, KeyValueDrilldownConfig, DrilldownConfig, DataTableColumnConfig, ValueFormattingRule, HeatmapFormattingRule, DataBarFormattingRule } from '../../types';
import { exportToCsv, exportToPng, exportToXlsx } from '../../utils/export';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { SearchIcon } from '../icons/SearchIcon';
import { ArrowUpIcon } from '../icons/ArrowUpIcon';
import { ArrowDownIcon } from '../icons/ArrowDownIcon';
import { ChevronUpDownIcon } from '../icons/ChevronUpDownIcon';
import { XIcon } from '../icons/XIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { MinusCircleIcon } from '../icons/MinusCircleIcon';
import ContextMenu from '../spreadsheet/ContextMenu';

interface DataTableComponentProps {
    config: DataTableWidgetConfig;
    data: any[];
    onSeeData: () => void;
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

type DisplayRow =
    | { type: 'group'; level: number; key: string; path: string; count: number; aggregates: { [key: string]: number | string }; isSelected: 'all' | 'some' | 'none' }
    | { type: 'row'; level: number; data: any; id: string | number };

const DataTableSummaryFooter: React.FC<{
    columns: DataTableWidgetConfig['columns'];
    summaryData: { [key: string]: number | string };
    colSpan: number;
}> = ({ columns, summaryData, colSpan }) => {
    return (
        <tfoot className="sticky bottom-0 bg-gray-800">
            <tr className="border-t-2 border-gray-700">
                <td colSpan={colSpan} className="p-3 text-sm font-semibold text-gray-400">
                    Summary
                </td>
                {columns.map((col) => {
                    const summaryValue = summaryData[col.key];
                    if (summaryValue === undefined) return <td key={col.key} className="p-3"></td>;
                    return (
                        <td
                            key={col.key}
                            className="p-3 text-sm font-semibold text-gray-300"
                            style={{ textAlign: col.textAlign || 'left' }}
                        >
                            {summaryValue}
                        </td>
                    );
                })}
            </tr>
        </tfoot>
    );
};

const MiniBarChartDrilldown: React.FC<{
    row: any;
    config: MiniBarChartDrilldownConfig;
}> = React.memo(({ row, config }) => {
    const { title, bars } = config;

    const chartData = useMemo(() => {
        return bars.map(bar => ({
            label: bar.label,
            value: row[bar.key] || 0,
            color: bar.color,
        }));
    }, [row, bars]);

    const margin = { top: 10, right: 10, bottom: 20, left: 80 };
    const width = 300;
    const height = chartData.length * 30 + margin.top + margin.bottom;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxValue = d3.max(chartData, d => d.value) || 0;

    const xScale = d3Scale.scaleLinear()
        .domain([0, maxValue === 0 ? 10 : maxValue * 1.1])
        .range([0, innerWidth]);

    const yScale = d3Scale.scaleBand()
        .domain(chartData.map(d => d.label))
        .range([0, innerHeight])
        .padding(0.2);

    return (
        <div className="p-4 bg-gray-800/50">
            <h5 className="text-sm font-semibold text-gray-300 mb-2">{title}</h5>
            <svg width={width} height={height} aria-label={title}>
                <g transform={`translate(${margin.left},${margin.top})`}>
                    {chartData.map(d => (
                        <g key={d.label} transform={`translate(0, ${yScale(d.label) ?? 0})`}>
                            <text x={-5} y={yScale.bandwidth() / 2} dy=".35em" textAnchor="end" fill="#D1D5DB" fontSize="12">
                                {d.label}
                            </text>
                            <rect
                                x={0}
                                y={0}
                                width={xScale(d.value)}
                                height={yScale.bandwidth()}
                                fill={d.color}
                            />
                            <text
                                x={xScale(d.value) + 5}
                                y={yScale.bandwidth() / 2}
                                dy=".35em"
                                fill="#F9FAFB"
                                fontSize="12"
                                fontWeight="bold"
                            >
                                {d.value.toLocaleString()}
                            </text>
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    );
});

const KeyValueDrilldown: React.FC<{
    row: any;
    config: KeyValueDrilldownConfig;
}> = React.memo(({ row, config }) => {
    return (
        <div className="p-4 bg-gray-800/50">
            <h5 className="text-sm font-semibold text-gray-300 mb-2">{config.title}</h5>
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                {config.items.map(item => {
                    const value = row[item.key];
                    return (
                        <div key={item.key} className="flex flex-col">
                            <dt className="text-gray-400 font-medium">{item.label}</dt>
                            <dd className="text-gray-200 truncate" title={String(value ?? '')}>
                                {value === null || value === undefined ? <span className="text-gray-500">N/A</span> : String(value)}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
});


const DrilldownRenderer: React.FC<{
    row: any;
    config: DrilldownConfig;
}> = ({ row, config }) => {
    switch (config.type) {
        case 'mini-bar-chart':
            return <MiniBarChartDrilldown row={row} config={config} />;
        case 'key-value':
            return <KeyValueDrilldown row={row} config={config} />;
        default:
            return null;
    }
};

const DataTableComponent: React.FC<DataTableComponentProps> = ({ config, data, onSeeData }) => {
    const { columns, pageSize = 10, enableGlobalSearch = false, enableSummarization = false, enableDrilldown = false, enableRowSelection = false, enableInlineEditing = false, enableRowCreation = false, rowKeyColumn, groupBy } = config;
    const chartContainerRef = useRef<HTMLDivElement>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});
    const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
    const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
    const [lastSelectedRowIndex, setLastSelectedRowIndex] = useState<number | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [tableData, setTableData] = useState(data);
    const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
    const [editValue, setEditValue] = useState<any>('');
    const [rowToEditOnLoad, setRowToEditOnLoad] = useState<string | number | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowIndex: number; columnKey: string; } | null>(null);
    
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartCell, setDragStartCell] = useState<{ pageRowIndex: number; colIndex: number } | null>(null);

    useEffect(() => {
        setTableData(data);
    }, [data]);

    useEffect(() => {
        setExpandedGroups(new Set());
        setCurrentPage(1);
    }, [data, groupBy]);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleToggleRow = useCallback((rowId: string | number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowId)) {
                newSet.delete(rowId);
            } else {
                newSet.add(rowId);
            }
            return newSet;
        });
    }, []);

    const filteredData = useMemo(() => {
        let filtered = [...tableData];
        if (enableGlobalSearch && globalSearch) {
            const lowercasedSearch = globalSearch.toLowerCase();
            filtered = filtered.filter(row =>
                columns.some(col => String(row[col.key]).toLowerCase().includes(lowercasedSearch))
            );
        }
        const activeColumnFilters = Object.entries(columnFilters).filter(([, value]) => value);
        if (activeColumnFilters.length > 0) {
            filtered = filtered.filter(row =>
                activeColumnFilters.every(([key, value]) => String(row[key]).toLowerCase().includes(String(value).toLowerCase()))
            );
        }
        return filtered;
    }, [tableData, globalSearch, columnFilters, columns, enableGlobalSearch]);

    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

     const columnStatsAndScales = useMemo(() => {
        const stats: { [key: string]: { min: number; max: number; heatmapScale?: (v: number) => string } } = {};
        columns.forEach(col => {
            const hasHeatmap = col.conditionalFormatting?.some(r => r.type === 'heatmap');
            const hasDataBar = col.conditionalFormatting?.some(r => r.type === 'data-bar');

            if (hasHeatmap || hasDataBar) {
                const values = sortedData.map(d => d[col.key]).filter((v): v is number => typeof v === 'number');
                if (values.length > 0) {
                    const [min, max] = d3.extent(values) as [number, number];
                    stats[col.key] = { min, max };
                    if (hasHeatmap) {
                        const rule = col.conditionalFormatting?.find(r => r.type === 'heatmap') as HeatmapFormattingRule;
                        const interpolatorName = rule.colorScheme || 'interpolateBlues';
                        const interpolator = (d3Chromatic as any)[interpolatorName];
                        if (interpolator) {
                            stats[col.key].heatmapScale = d3Scale.scaleSequential<string>(interpolator).domain([min, max]);
                        }
                    }
                }
            }
        });
        return stats;
    }, [columns, sortedData]);

    const getCellStyling = useCallback((value: any, col: DataTableColumnConfig) => {
        const props: { cellClassName: string; cellStyle: React.CSSProperties; textClassName: string; dataBar?: { percentage: number; color: string } } = {
            cellClassName: '', cellStyle: {}, textClassName: '', dataBar: undefined
        };

        if (!col.conditionalFormatting || value === null || value === undefined) {
            return props;
        }

        for (const rule of col.conditionalFormatting) {
            if (rule.type === 'value') {
                const { condition } = rule as ValueFormattingRule;
                let match = false;
                switch (condition.operator) {
                    case '===': match = value === condition.value; break;
                    case '!==': match = value !== condition.value; break;
                    case '>': match = value > condition.value; break;
                    case '<': match = value < condition.value; break;
                    case '>=': match = value >= condition.value; break;
                    case '<=': match = value <= condition.value; break;
                    case 'contains': match = String(value).toLowerCase().includes(String(condition.value).toLowerCase()); break;
                    case 'not-contains': match = !String(value).toLowerCase().includes(String(condition.value).toLowerCase()); break;
                }
                if (match) {
                    props.cellClassName += ` ${rule.className || ''}`;
                    props.textClassName += ` ${rule.textClassName || ''}`;
                }
            } else if (rule.type === 'heatmap') {
                const stats = columnStatsAndScales[col.key];
                if (stats?.heatmapScale && typeof value === 'number') {
                    props.cellStyle.backgroundColor = stats.heatmapScale(value);
                    props.textClassName += ` ${(rule as HeatmapFormattingRule).textClassName || 'text-white'}`;
                }
            } else if (rule.type === 'data-bar') {
                const stats = columnStatsAndScales[col.key];
                if (stats && typeof value === 'number' && stats.max > stats.min) {
                    const percentage = ((value - stats.min) / (stats.max - stats.min)) * 100;
                    props.dataBar = { percentage: Math.max(0, Math.min(100, percentage)), color: (rule as DataBarFormattingRule).color };
                } else if (stats && typeof value === 'number' && stats.max === stats.min && value > 0) {
                     props.dataBar = { percentage: 100, color: (rule as DataBarFormattingRule).color };
                }
            }
        }
        return props;
    }, [columnStatsAndScales]);


    const { displayRows, allGroupChildren } = useMemo(() => {
        if (!groupBy || groupBy.length === 0) {
            const rows: DisplayRow[] = sortedData.map(row => ({
                type: 'row',
                level: 0,
                data: row,
                id: row[rowKeyColumn],
            }));
            return { displayRows: rows, allGroupChildren: new Map() };
        }

        const grouped = new Map(d3.group(sortedData, ...groupBy.map(key => (d: any) => d[key])) as any);
        const flatRows: DisplayRow[] = [];
        const groupChildrenMap = new Map<string, (string | number)[]>();

        const getDescendantRows = (node: any): any[] => {
            if (Array.isArray(node)) return node;
            let rows: any[] = [];
            for (const childNode of node.values()) { rows = rows.concat(getDescendantRows(childNode)); }
            return rows;
        };

        const flatten = (map: Map<any, any>, level: number, path: string) => {
            const sortedKeys = Array.from(map.keys()).sort((a, b) => String(a).localeCompare(String(b)));

            for (const key of sortedKeys) {
                const value = map.get(key)!;
                const currentPath = path ? `${path}:::${key}` : String(key);

                const descendantRows = getDescendantRows(value);
                const descendantIds = descendantRows.map(r => r[rowKeyColumn]);
                groupChildrenMap.set(currentPath, descendantIds);

                const aggregates: { [key: string]: number | string } = {};
                if (enableSummarization) {
                    columns.forEach(col => {
                        if (col.aggregation) {
                            const values = descendantRows.map(d => d[col.key]).filter((v): v is number => typeof v === 'number');
                            let result: number | undefined;
                            switch (col.aggregation) {
                                case 'sum': result = d3.sum(values); break;
                                case 'avg': result = d3.mean(values); break;
                                case 'min': result = d3.min(values); break;
                                case 'max': result = d3.max(values); break;
                                case 'count': result = values.length; break;
                            }
                            if (result !== undefined) {
                                aggregates[col.key] = ['avg', 'duration'].some(k => col.key.includes(k)) ? result.toFixed(2) : result.toLocaleString('en-US');
                            }
                        }
                    });
                }
                
                const selectedChildrenCount = descendantIds.filter(id => selectedRows.has(id)).length;
                const isSelectedState = descendantIds.length > 0 && selectedChildrenCount === descendantIds.length
                    ? 'all'
                    : selectedChildrenCount > 0 ? 'some' : 'none';

                flatRows.push({ type: 'group', level, key: String(key), path: currentPath, count: descendantRows.length, aggregates, isSelected: isSelectedState });

                if (expandedGroups.has(currentPath)) {
                    if (value instanceof Map) {
                        flatten(value, level + 1, currentPath);
                    } else if (Array.isArray(value)) {
                        value.forEach((row: any) => {
                            flatRows.push({ type: 'row', level: level + 1, data: row, id: row[rowKeyColumn] });
                        });
                    }
                }
            }
        };

        flatten(grouped, 0, '');
        return { displayRows: flatRows, allGroupChildren: groupChildrenMap };
    }, [sortedData, groupBy, expandedGroups, enableSummarization, columns, rowKeyColumn, selectedRows]);

    const totalPages = Math.ceil(displayRows.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return displayRows.slice(start, start + pageSize);
    }, [displayRows, currentPage, pageSize]);

    const performCopy = useCallback(() => {
        let textToCopy = '';
        if (selectedCells.size > 0) {
            const rows = new Set<number>();
            const cols = new Set<number>();
            selectedCells.forEach(cellId => {
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
                    if (selectedCells.has(`R${r}C${c}`)) {
                        const rowData = paginatedData[r];
                        if (rowData?.type === 'row') {
                            const value = rowData.data[columns[c].key];
                            rowValues.push(value === null || value === undefined ? '' : String(value));
                        } else {
                            rowValues.push('');
                        }
                    } else {
                        rowValues.push('');
                    }
                }
                tsvString += rowValues.join('\t') + '\n';
            }
            textToCopy = tsvString;
        } else if (enableRowSelection && selectedRows.size > 0) {
            const selectedData = sortedData.filter(row => selectedRows.has(row[rowKeyColumn]));
            const header = columns.map(c => c.header).join('\t');
            const rows = selectedData.map(row => 
                columns.map(c => {
                    const value = row[c.key];
                    const stringValue = value === null || value === undefined ? '' : String(value);
                    return stringValue.replace(/\t/g, ' ').replace(/\n/g, ' ');
                }).join('\t')
            ).join('\n');
            textToCopy = `${header}\n${rows}`;

        } else if (contextMenu) {
            const rowItem = paginatedData[contextMenu.rowIndex];
            if (rowItem && rowItem.type === 'row') {
                 const value = rowItem.data[contextMenu.columnKey];
                 textToCopy = value === null || value === undefined ? '' : String(value);
            }
        }

        if (textToCopy) {
            copyToClipboard(textToCopy);
        }
    }, [enableRowSelection, selectedRows, sortedData, columns, rowKeyColumn, contextMenu, paginatedData, selectedCells]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !isEditing) {
                if (selectedRows.size > 0 || selectedCells.size > 0) {
                    event.preventDefault();
                    performCopy();
                }
            }
        };
        const tableEl = chartContainerRef.current;
        if (tableEl) {
            tableEl.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            if (tableEl) {
                tableEl.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [performCopy, selectedRows.size, selectedCells.size]);

    const handleAddRow = useCallback((belowIndexInPage: number) => {
        if (!enableRowCreation) return;

        const displayIndex = (currentPage - 1) * pageSize + belowIndexInPage;
        const anchorRowItem = displayRows[displayIndex];

        const newRow: { [key: string]: any } = {};
        columns.forEach(col => {
            newRow[col.key] = '';
        });
        newRow[rowKeyColumn] = crypto.randomUUID();

        let originalIndex = -1;
        if (anchorRowItem && anchorRowItem.type === 'row') {
            originalIndex = tableData.findIndex(d => d[rowKeyColumn] === anchorRowItem.id);
        } else if (tableData.length > 0) {
            originalIndex = tableData.length - 1;
        }

        const newData = [...tableData];
        newData.splice(originalIndex + 1, 0, newRow);
        setTableData(newData);
        setRowToEditOnLoad(newRow[rowKeyColumn]);
    }, [tableData, displayRows, currentPage, pageSize, columns, rowKeyColumn, enableRowCreation]);

    const handleDeleteRow = useCallback((rowIdToDelete: string | number) => {
        setTableData(currentData => currentData.filter(row => row[rowKeyColumn] !== rowIdToDelete));
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            newSet.delete(rowIdToDelete);
            return newSet;
        });
    }, [rowKeyColumn]);

    useEffect(() => {
        if (rowToEditOnLoad) {
            const newRowIndex = displayRows.findIndex(r => r.type === 'row' && r.id === rowToEditOnLoad);
            if (newRowIndex > -1) {
                const firstEditableColumn = columns.find(c => c.enableEditing)?.key;
                if (firstEditableColumn) {
                    setEditingCell({ rowIndex: newRowIndex, columnKey: firstEditableColumn });
                    setEditValue('');
                }
            }
            setRowToEditOnLoad(null);
        }
    }, [rowToEditOnLoad, displayRows, columns]);
    
    const handleCommitEdit = useCallback(() => {
        if (!editingCell) return;

        const { rowIndex, columnKey } = editingCell;
        const rowToUpdate = displayRows[rowIndex];

        if (rowToUpdate.type !== 'row') return;

        const rowId = rowToUpdate.id;
        const originalValue = rowToUpdate.data[columnKey];

        let newValue: any = editValue;
        if (typeof originalValue === 'number' && !isNaN(originalValue)) {
            const parsed = parseFloat(editValue);
            newValue = isNaN(parsed) ? originalValue : parsed;
        } else if (typeof originalValue === 'boolean') {
            if (editValue.toLowerCase() === 'true') newValue = true;
            else if (editValue.toLowerCase() === 'false') newValue = false;
            else newValue = originalValue;
        }
        
        if (originalValue !== newValue) {
            setTableData(currentData =>
                currentData.map(row =>
                    row[rowKeyColumn] === rowId ? { ...row, [columnKey]: newValue } : row
                )
            );
        }

        setEditingCell(null);
    }, [editingCell, editValue, displayRows, rowKeyColumn]);
    
    const handleEditKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, columnKey: string) => {
        if (event.key === 'Enter') {
            handleCommitEdit();
        } else if (event.key === 'Escape') {
            setEditingCell(null);
        } else if (event.key === 'Tab') {
            event.preventDefault();
            handleCommitEdit();
            setTimeout(() => {
                const editableColumns = columns.filter(c => c.enableEditing);
                const currentColumnIndexInEditable = editableColumns.findIndex(c => c.key === columnKey);
                
                const nextIndex = event.shiftKey ? currentColumnIndexInEditable - 1 : currentColumnIndexInEditable + 1;
                
                if (nextIndex >= 0 && nextIndex < editableColumns.length) {
                    const nextColumn = editableColumns[nextIndex];
                    const rowData = displayRows[rowIndex];
                    if (rowData.type === 'row') {
                        const nextValue = rowData.data[nextColumn.key];
                        setEditingCell({ rowIndex, columnKey: nextColumn.key });
                        setEditValue(nextValue === null || nextValue === undefined ? '' : String(nextValue));
                    }
                } else {
                    setEditingCell(null);
                }
            }, 0);
        }
    }, [handleCommitEdit, columns, displayRows]);
    
    const handleCellDoubleClick = useCallback((rowIndex: number, column: DataTableColumnConfig, rowData: any) => {
        if (!enableInlineEditing || !column.enableEditing || (groupBy && groupBy.length > 0)) {
            return;
        }
        const initialValue = rowData[column.key];
        setEditingCell({ rowIndex, columnKey: column.key });
        setEditValue(initialValue === null || initialValue === undefined ? '' : String(initialValue));
    }, [enableInlineEditing, groupBy]);

    const handleToggleGroup = useCallback((groupPath: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupPath)) newSet.delete(groupPath);
            else newSet.add(groupPath);
            return newSet;
        });
    }, []);

    useEffect(() => {
        if (enableRowSelection) {
            setSelectedRows(new Set());
            setLastSelectedRowIndex(null);
        }
        setSelectedCells(new Set());
    }, [sortedData, enableRowSelection]);

    const summaryData = useMemo(() => {
        if (!enableSummarization) return {};
        const summary: { [key: string]: number | string } = {};
        columns.forEach(col => {
            if (col.aggregation) {
                const values = filteredData.map(d => d[col.key]).filter((v): v is number => typeof v === 'number');
                let result: number | undefined;
                switch(col.aggregation) {
                    case 'sum': result = d3.sum(values); break;
                    case 'avg': result = d3.mean(values); break;
                    case 'min': result = d3.min(values); break;
                    case 'max': result = d3.max(values); break;
                    case 'count': result = filteredData.length; break;
                }
                if (result !== undefined) {
                    summary[col.key] = ['avg', 'duration'].some(k => col.key.includes(k)) ? result.toFixed(2) : result.toLocaleString('en-US');
                }
            }
        });
        return summary;
    }, [filteredData, columns, enableSummarization]);

    const allRowIdsInView = useMemo(() => new Set(sortedData.map(row => row[rowKeyColumn])), [sortedData, rowKeyColumn]);
    const allSelectableRowsCount = groupBy ? sortedData.length : displayRows.length;

    const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (!enableRowSelection) return;
        if (event.target.checked) {
            setSelectedRows(allRowIdsInView);
        } else {
            setSelectedRows(new Set());
        }
        setLastSelectedRowIndex(null);
        setSelectedCells(new Set());
    }, [allRowIdsInView, enableRowSelection]);

    const handleRowSelectionChange = useCallback((rowId: string | number) => {
        if (!enableRowSelection) return;
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowId)) {
                newSet.delete(rowId);
            } else {
                newSet.add(rowId);
            }
            return newSet;
        });
        setSelectedCells(new Set());
    }, [enableRowSelection]);

    const handleGroupSelectionChange = useCallback((groupPath: string) => {
        const childrenIds = allGroupChildren.get(groupPath) || [];
        if (childrenIds.length === 0) return;

        const allSelected = childrenIds.every(id => selectedRows.has(id));

        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                childrenIds.forEach(id => newSet.delete(id));
            } else {
                childrenIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
        setSelectedCells(new Set());
    }, [allGroupChildren, selectedRows]);

    const handleRowCheckboxChange = (rowId: string | number, rowIndexInView: number) => {
        if (!enableRowSelection) return;
        const fullIndex = displayRows.findIndex(r => r.type === 'row' && r.id === rowId);
        handleRowSelectionChange(rowId);
        setLastSelectedRowIndex(fullIndex);
    };
    
    const handleRowClick = useCallback((event: React.MouseEvent, row: any, rowIndexInPage: number) => {
        if (!enableRowSelection || row.type === 'group') return;
        if ((event.target as HTMLElement).closest('input, button')) return;
        
        const fullIndex = (currentPage - 1) * pageSize + paginatedData.findIndex(r => r.type === 'row' && r.id === row.id);
        setSelectedCells(new Set());

        if (event.shiftKey && lastSelectedRowIndex !== null) {
            const start = Math.min(lastSelectedRowIndex, fullIndex);
            const end = Math.max(lastSelectedRowIndex, fullIndex);
            const rangeIds = displayRows.slice(start, end + 1)
                .filter(r => r.type === 'row')
                .map((r: any) => r.id);
            
            const newSet = new Set(selectedRows);
            rangeIds.forEach(id => newSet.add(id));
            setSelectedRows(newSet);
        } else if (event.ctrlKey || event.metaKey) {
            handleRowSelectionChange(row.id);
            setLastSelectedRowIndex(fullIndex);
        } else {
            setSelectedRows(new Set([row.id]));
            setLastSelectedRowIndex(fullIndex);
        }
    }, [lastSelectedRowIndex, displayRows, selectedRows, handleRowSelectionChange, currentPage, pageSize, paginatedData, enableRowSelection]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    
    const handleFilterChange = (key: string, value: string) => {
        setColumnFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleGlobalSearchChange = (value: string) => {
        setGlobalSearch(value);
        setCurrentPage(1);
    };

    const handleExport = useCallback((format: 'csv' | 'xlsx', type: 'all' | 'filtered' | 'selected') => {
        let dataToExport: any[];
        let fileNameSuffix = '';

        const selectedData = sortedData.filter(row => selectedRows.has(row[rowKeyColumn]));

        switch(type) {
            case 'all':
                dataToExport = data;
                fileNameSuffix = 'all';
                break;
            case 'selected':
                dataToExport = selectedData;
                fileNameSuffix = 'selected';
                break;
            case 'filtered':
            default:
                dataToExport = sortedData;
                fileNameSuffix = 'filtered';
                break;
        }

        const fileName = `${config.id || 'datatable'}-${fileNameSuffix}`;
        
        if (format === 'csv') {
            exportToCsv(dataToExport, fileName);
        } else {
            exportToXlsx(dataToExport, fileName);
        }

    }, [data, sortedData, selectedRows, config.id, rowKeyColumn]);

    const handleExportCsv = (type: 'all' | 'filtered' | 'selected') => handleExport('csv', type);
    const handleExportXlsx = (type: 'all' | 'filtered' | 'selected') => handleExport('xlsx', type);
    
    const handleExportPng = useCallback(() => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'datatable-export');
        }
    }, [config.id]);
    
    const handleContextMenu = useCallback((event: React.MouseEvent, rowIndex: number, columnKey: string) => {
        event.preventDefault();
        const rowItem = paginatedData[rowIndex];
        if(rowItem?.type !== 'row') return;
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            rowIndex,
            columnKey,
        });
    }, [paginatedData]);

    const handleContextMenuCopy = useCallback(() => {
        performCopy();
        setContextMenu(null);
    }, [performCopy]);


    const dataCounts = {
        all: data.length,
        filtered: sortedData.length,
        selected: selectedRows.size,
    };
    
    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 6}`;

    const renderCellContent = (value: any, columnKey: string): React.ReactNode => {
        if (value === null || value === undefined) return <span className="text-gray-500">N/A</span>;
        if (typeof value === 'boolean') {
            return value 
                ? <span className="px-2 py-0.5 text-xs font-medium text-green-100 bg-green-800 rounded-full">Success</span>
                : <span className="px-2 py-0.5 text-xs font-medium text-red-100 bg-red-800 rounded-full">Failure</span>;
        }
        if (columnKey.toLowerCase().includes('duration') && typeof value === 'number') return value.toFixed(2);
        if (typeof value === 'number') return value.toLocaleString('en-US');
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return new Date(value).toLocaleString();
        return String(value);
    };

    const numSelected = selectedRows.size;
    const isPartiallySelected = numSelected > 0 && numSelected < allSelectableRowsCount;
    const areAllSelected = allSelectableRowsCount > 0 && numSelected === allSelectableRowsCount;

    const mainColSpan = (groupBy ? 0 : columns.length) + (enableDrilldown ? 1 : 0) + (enableRowSelection ? 1 : 0);
    const colSpanForDrilldown = columns.length + (enableDrilldown ? 1 : 0) + (enableRowSelection ? 1 : 0);
    const colSpanForSummary = (enableDrilldown ? 1 : 0) + (enableRowSelection ? 1 : 0) + (groupBy ? 1 : 0);

    return (
        <div ref={chartContainerRef} tabIndex={-1} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative outline-none`}>
            <WidgetExportDropdown
                onExportCsv={handleExportCsv}
                onExportXlsx={handleExportXlsx}
                onExportPng={handleExportPng}
                onSeeData={onSeeData}
                dataCounts={dataCounts}
            />
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h4 className="text-lg font-semibold text-white pr-8">{config.title}</h4>
                    <p className="text-sm text-gray-400">{config.description}</p>
                </div>
                {enableGlobalSearch && (
                    <div className="relative mr-12"><input type="text" placeholder="Search table..." value={globalSearch} onChange={e => handleGlobalSearchChange(e.target.value)} className="w-64 pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white" /><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /></div>
                )}
            </div>
            <div className="flex-grow min-h-0 overflow-auto">
                <table
                    className="w-full min-w-[800px] border-collapse select-none"
                    style={{ tableLayout: 'fixed' }}
                    aria-multiselectable={enableRowSelection}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                >
                    <thead className="sticky top-0 bg-gray-800 z-10">
                        <tr>
                            {enableRowSelection && (
                                <th className="p-3 w-12 border-b-2 border-gray-700">
                                    <input
                                        type="checkbox"
                                        ref={input => { if (input) input.indeterminate = isPartiallySelected; }}
                                        checked={areAllSelected}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"
                                        aria-label="Select all rows"
                                    />
                                </th>
                            )}
                            {enableDrilldown && !groupBy && <th className="p-3 w-12 border-b-2 border-gray-700"></th>}
                            {groupBy && groupBy.length > 0 && <th className="p-3 border-b-2 border-gray-700" style={{width: `${groupBy.length * 24 + 100}px`}}> {groupBy.join(' / ')} </th>}
                            {columns.map(col => (
                                <th key={col.key} className="p-3 text-left text-sm font-semibold text-gray-300 border-b-2 border-gray-700" style={{ width: col.width || 'auto' }}><div className="flex flex-col"><div className={`flex items-center ${col.enableSorting ? 'cursor-pointer' : ''}`} onClick={() => col.enableSorting && handleSort(col.key)}>{col.header}{col.enableSorting && (<span className="w-4 h-4 ml-1 text-gray-400 shrink-0">{sortConfig?.key === col.key ? (sortConfig.direction === 'asc' ? <ArrowUpIcon/> : <ArrowDownIcon/>) : <ChevronUpDownIcon />}</span>)}</div>{col.enableFiltering && (<div className="relative mt-1"><input type="text" placeholder="Filter..." value={columnFilters[col.key] || ''} onChange={e => handleFilterChange(col.key, e.target.value)} onClick={e => e.stopPropagation()} className="w-full text-xs px-2 py-1 bg-gray-900 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-white select-text" /></div>)}</div></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((item, rowIndex) => {
                           if (item.type === 'group') {
                                const isExpanded = expandedGroups.has(item.path);
                                return (
                                    <tr key={item.path} className="border-b border-gray-800 bg-gray-800/70 hover:bg-gray-800 hover:border-b-blue-500/50 transition-colors">
                                        {enableRowSelection && (
                                            <td className="p-3 text-center">
                                                <input type="checkbox" ref={input => { if(input) input.indeterminate = item.isSelected === 'some'; }} checked={item.isSelected === 'all'} onChange={() => handleGroupSelectionChange(item.path)} className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white" />
                                            </td>
                                        )}
                                        <td colSpan={mainColSpan} className="p-3 text-sm text-gray-200 font-semibold">
                                            <div className="flex items-center gap-2" style={{ paddingLeft: `${item.level * 1.5}rem`}}>
                                                <button onClick={() => handleToggleGroup(item.path)} className="p-1 rounded-full hover:bg-gray-700" aria-expanded={isExpanded}>
                                                    <ChevronRightIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </button>
                                                <span>{item.key} ({item.count})</span>
                                            </div>
                                        </td>
                                        {enableSummarization && columns.map(col => (
                                            <td key={col.key} className="p-3 text-sm text-gray-300 font-semibold" style={{ textAlign: col.textAlign || 'left' }}>
                                                {item.aggregates[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                );
                           }
                           
                           const fullRowIndex = displayRows.findIndex(r => r.type === 'row' && r.id === item.id);
                           const row = item.data;
                           const rowId = item.id;
                           const isExpanded = expandedRows.has(rowId);
                           const isSelected = selectedRows.has(rowId);
                           return (
                               <React.Fragment key={rowId || rowIndex}>
                                   <tr className={`border-b border-gray-800 hover:border-b-blue-500/50 transition-colors duration-150 group relative ${isSelected && enableRowSelection ? 'bg-blue-900/50' : 'hover:bg-gray-800/50'}`} onClick={(e) => handleRowClick(e, item, rowIndex)} aria-selected={isSelected && enableRowSelection}>
                                       {enableRowSelection && (<td className="p-3 text-center"><input type="checkbox" checked={isSelected} onChange={() => handleRowCheckboxChange(rowId, rowIndex)} className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white" aria-label={`Select row`} /></td>)}
                                       {groupBy && <td className="p-0"></td>}
                                       {enableDrilldown && !groupBy && (
                                           <td className="p-3 text-center">
                                               <button onClick={() => handleToggleRow(rowId)} className="p-1 rounded-full hover:bg-gray-700" aria-expanded={isExpanded} aria-label={isExpanded ? 'Collapse row' : 'Expand row'}>
                                                   <ChevronRightIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                               </button>
                                           </td>
                                       )}

                                       {columns.map((col, colIndex) => {
                                            const cellId = `R${rowIndex}C${colIndex}`;
                                            const isCellSelected = selectedCells.has(cellId);
                                            const { cellClassName, cellStyle, textClassName, dataBar } = getCellStyling(row[col.key], col);
                                            const isEditing = enableInlineEditing && !groupBy && editingCell?.rowIndex === fullRowIndex && editingCell?.columnKey === col.key;
                                            const isFirstDataCell = colIndex === 0 && !enableDrilldown && !groupBy && !enableRowSelection;
                                            return (
                                                <td key={col.key}
                                                    className={`text-sm text-gray-300 ${cellClassName} ${isEditing ? 'p-0' : ''} ${isFirstDataCell ? 'relative' : ''} ${isCellSelected ? 'bg-blue-900/50' : ''}`}
                                                    style={{...cellStyle}}
                                                    onDoubleClick={() => handleCellDoubleClick(fullRowIndex, col, row)}
                                                    onContextMenu={(e) => handleContextMenu(e, rowIndex, col.key)}
                                                    onMouseDown={(e) => {
                                                        if (e.shiftKey || e.ctrlKey || e.metaKey || isEditing) return;
                                                        e.preventDefault();
                                                        setIsDragging(true);
                                                        setDragStartCell({ pageRowIndex: rowIndex, colIndex });
                                                        setSelectedCells(new Set([cellId]));
                                                        setSelectedRows(new Set());
                                                    }}
                                                    onMouseEnter={() => {
                                                        if (isDragging && dragStartCell) {
                                                            const { pageRowIndex: startRow, colIndex: startCol } = dragStartCell;
                                                            const minRow = Math.min(startRow, rowIndex);
                                                            const maxRow = Math.max(startRow, rowIndex);
                                                            const minCol = Math.min(startCol, colIndex);
                                                            const maxCol = Math.max(startCol, colIndex);
                                                            const newSelection = new Set<string>();
                                                            for (let r = minRow; r <= maxRow; r++) {
                                                                for (let c = minCol; c <= maxCol; c++) {
                                                                    newSelection.add(`R${r}C${c}`);
                                                                }
                                                            }
                                                            setSelectedCells(newSelection);
                                                        }
                                                    }}
                                                >
                                                     {isFirstDataCell && enableRowCreation && !groupBy && (
                                                        <div className="absolute top-full left-0 right-0 h-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" style={{ transform: 'translateY(-50%)' }}>
                                                            <div className="w-full flex items-center">
                                                                <button onClick={(e) => { e.stopPropagation(); handleAddRow(rowIndex); }} className="pointer-events-auto bg-gray-900 rounded-full" style={{ marginLeft: '1.5rem', transform: 'translateX(-50%)' }} title="Add row below"><PlusCircleIcon className="w-5 h-5 text-blue-400 hover:text-blue-300" /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteRow(rowId); }} className="pointer-events-auto bg-gray-900 rounded-full -ml-2" title="Delete row"><MinusCircleIcon className="w-5 h-5 text-red-500 hover:text-red-400" /></button>
                                                                <div className="flex-grow h-px bg-blue-500/50 -ml-2"></div>
                                                            </div>
                                                        </div>
                                                     )}
                                                     {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            onBlur={handleCommitEdit}
                                                            onKeyDown={e => handleEditKeyDown(e, fullRowIndex, col.key)}
                                                            autoFocus
                                                            className="w-full h-full bg-gray-700 text-white outline-none border-2 border-blue-500 box-border px-3 py-2 select-text"
                                                        />
                                                    ) : (
                                                        <div className="relative p-3">
                                                            {dataBar && (
                                                                <div 
                                                                    className="absolute top-0 left-0 h-full bg-opacity-40 -z-10" 
                                                                    style={{ width: `${dataBar.percentage}%`, backgroundColor: dataBar.color }}
                                                                />
                                                            )}
                                                            <span className={`block truncate ${textClassName}`} style={{ textAlign: col.textAlign || 'left', paddingLeft: groupBy && columns.indexOf(col) === 0 ? `${item.level * 1.5}rem` : undefined }}>
                                                                {enableDrilldown && groupBy && columns.indexOf(col) === 0 && (
                                                                    <button onClick={() => handleToggleRow(rowId)} className="p-1 rounded-full hover:bg-gray-700 mr-2 inline-block align-middle" aria-expanded={isExpanded} aria-label={isExpanded ? 'Collapse row' : 'Expand row'}>
                                                                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                    </button>
                                                                )}
                                                                {renderCellContent(row[col.key], col.key)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                       })}
                                   </tr>
                                   {isExpanded && config.drilldown && (
                                       <tr className="bg-gray-800/20">
                                           <td colSpan={colSpanForDrilldown} className="p-0">
                                               <div className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out" style={{ maxHeight: isExpanded ? '500px' : '0px', opacity: isExpanded ? 1 : 0, paddingLeft: `${(item.level || 0) * 1.5}rem` }}>
                                                   <DrilldownRenderer row={row} config={config.drilldown} />
                                               </div>
                                           </td>
                                       </tr>
                                   )}
                               </React.Fragment>
                           );
                        })}
                    </tbody>
                    {enableSummarization && !groupBy && <DataTableSummaryFooter columns={columns} summaryData={summaryData} colSpan={colSpanForSummary} />}
                </table>
                 {paginatedData.length === 0 && (<div className="flex items-center justify-center h-48 text-gray-500">No results found.</div>)}
            </div>
            <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-400">Showing {paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, displayRows.length)} of {displayRows.length} items</span>
                <div className="flex items-center gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5" /></button><span className="text-sm text-gray-300">Page {currentPage} of {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5" /></button></div>
            </div>
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onCopy={handleContextMenuCopy} />}
        </div>
    );
};

export default DataTableComponent;