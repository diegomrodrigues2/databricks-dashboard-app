import React, { useMemo, useState, useRef } from 'react';
import * as d3Scale from 'd3-scale';
import type { MatrixChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface MatrixChartComponentProps {
  config: MatrixChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

interface ProcessedMatrixData {
    rows: string[];
    columns: string[];
    matrix: Map<string, Map<string, boolean>>;
}

const MatrixChartComponent: React.FC<MatrixChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; row: string; col: string; value: boolean; } | null>(null);

    const processedData: ProcessedMatrixData = useMemo(() => {
        if (!data || data.length === 0) return { rows: [], columns: [], matrix: new Map() };
        
        const rowSet = new Set<string>();
        const colSet = new Set<string>();
        const matrix = new Map<string, Map<string, boolean>>();

        data.forEach(item => {
            const row = item[config.rowCategoryColumn];
            const col = item[config.columnCategoryColumn];
            const value = !!item[config.valueColumn];
            
            rowSet.add(row);
            colSet.add(col);

            if (!matrix.has(row)) {
                matrix.set(row, new Map<string, boolean>());
            }
            matrix.get(row)!.set(col, value);
        });

        // Maintain original order for rows, sort columns alphabetically
        const rows = Array.from(new Set(data.map(d => d[config.rowCategoryColumn])));
        const columns = Array.from(colSet).sort();
        
        return { rows, columns, matrix };
    }, [data, config.rowCategoryColumn, config.columnCategoryColumn, config.valueColumn]);

    const handleExportCsv = () => {
        exportToCsv(data, config.id || 'matrix-chart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'matrix-chart-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 4}`;
    
    const margin = { top: 60, right: 20, bottom: 20, left: 120 };
    const width = 800; 
    const height = 350;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const { rows, columns, matrix } = processedData;

    const xScale = useMemo(() => {
        return d3Scale.scalePoint()
            .domain(columns)
            .range([0, innerWidth])
            .padding(0.5);
    }, [columns, innerWidth]);

    const yScale = useMemo(() => {
        return d3Scale.scalePoint()
            .domain(rows)
            .range([0, innerHeight])
            .padding(0.5);
    }, [rows, innerHeight]);

    const handleMouseMove = (event: React.MouseEvent, row: string, col: string) => {
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const value = matrix.get(row)?.get(col) ?? false;
        setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            row,
            col,
            value,
        });
    };
    
    const handleMouseLeave = () => {
        setTooltip(null);
    };
    
    const yesColor = config.yesColor || '#3B82F6';
    const noColor = config.noColor || '#9CA3AF';

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-lg font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-sm text-gray-400">{config.description}</p>
                 <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                         <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                            <circle cx="7" cy="7" r="6" fill={yesColor} />
                         </svg>
                         <span className="text-sm text-gray-300">Yes</span>
                    </div>
                     <div className="flex items-center gap-2">
                         <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                            <circle cx="7" cy="7" r="6" fill="none" stroke={noColor} strokeWidth="1.5" />
                         </svg>
                         <span className="text-sm text-gray-300">No</span>
                    </div>
                </div>
            </div>
            <div className="flex-grow min-h-0">
                {rows.length > 0 && columns.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <title>{config.title}</title>
                        <desc>{config.description}</desc>
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {/* Grid Lines */}
                            <g className="grid-lines" stroke="#374151">
                                {rows.map(row => <line key={`h-${row}`} x1={0} x2={innerWidth} y1={yScale(row)} y2={yScale(row)} />)}
                                {columns.map(col => <line key={`v-${col}`} y1={0} y2={innerHeight} x1={xScale(col)} x2={xScale(col)} />)}
                            </g>

                            {/* Column Labels */}
                            {columns.map(col => (
                                <text
                                    key={`col-label-${col}`}
                                    x={xScale(col)}
                                    y={-10}
                                    textAnchor="middle"
                                    fontSize="12"
                                    className="text-gray-400 fill-current"
                                >
                                    {col}
                                </text>
                            ))}

                             {/* Row Labels */}
                            {rows.map(row => (
                                <text
                                    key={`row-label-${row}`}
                                    x={-10}
                                    y={yScale(row)}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    fontSize="12"
                                    className="text-gray-400 fill-current"
                                >
                                    {row}
                                </text>
                            ))}
                            
                            {/* Data Points (Circles) */}
                            {rows.flatMap(row =>
                                columns.map(col => {
                                    const value = matrix.get(row)?.get(col) ?? false;
                                    const isClickable = !!onCategoryClick;
                                    return (
                                        <circle
                                            key={`${row}-${col}`}
                                            cx={xScale(col)}
                                            cy={yScale(row)}
                                            r={8}
                                            fill={value ? yesColor : 'none'}
                                            stroke={value ? 'none' : noColor}
                                            strokeWidth={1.5}
                                            onMouseMove={(e) => handleMouseMove(e, row, col)}
                                            onMouseLeave={handleMouseLeave}
                                            onClick={() => isClickable && onCategoryClick(config.columnCategoryColumn, col)}
                                            style={{ cursor: isClickable ? 'pointer' : 'default' }}
                                            aria-label={`${row}, ${col}: ${value ? 'Yes' : 'No'}`}
                                        />
                                    );
                                })
                            )}
                        </g>
                    </svg>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No data available for this chart.</p>
                    </div>
                )}
            </div>
             {tooltip && (
                <div
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white shadow-lg pointer-events-none z-10"
                    style={{ top: tooltip.y + 15, left: tooltip.x, transform: 'translateX(-50%)' }} >
                    <div className="font-bold">{tooltip.col}</div>
                    <div>{tooltip.row}: <span className="font-semibold">{tooltip.value ? 'Yes' : 'No'}</span></div>
                </div>
            )}
        </div>
    );
};

export default MatrixChartComponent;