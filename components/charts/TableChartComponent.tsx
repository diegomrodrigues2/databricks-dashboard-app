import React, { useMemo, useRef, useState } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { TableChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface TableChartComponentProps {
  config: TableChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value:string) => void;
  onSeeData: () => void;
}

const TableChartComponent: React.FC<TableChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredRowCategory, setHoveredRowCategory] = useState<string | null>(null);

    const colorScales = useMemo(() => {
        const scales: { [key: string]: d3Scale.ScaleLinear<string, string> } = {};
        if (!config.conditionalFormatting || !data || data.length === 0) {
            return scales;
        }

        config.conditionalFormatting.forEach(rule => {
            if (rule.type === 'color-scale') {
                const values = data.map(d => d[rule.column]).filter(v => typeof v === 'number');
                const domain = d3.extent(values) as [number, number];
                if (domain[0] !== undefined && domain[1] !== undefined) {
                    scales[rule.column] = d3Scale.scaleLinear<string>()
                        .domain(domain)
                        .range(rule.colorScheme);
                }
            }
        });
        return scales;
    }, [data, config.conditionalFormatting]);

    const formatValue = (value: any, columnConfig: typeof config.columns[0]): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value !== 'number') return String(value);

        const { format, currencySymbol = '$', decimalPlaces = 0 } = columnConfig;
        
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };

        if (format === 'currency') {
            return `${currencySymbol}${new Intl.NumberFormat('en-US', options).format(value)}`;
        }
        
        return new Intl.NumberFormat('en-US', options).format(value);
    };

    const handleExportCsv = () => {
        exportToCsv(data, config.id || 'table-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'table-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 4}`;

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-xl font-serif font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md font-serif text-gray-400">{config.description}</p>
            </div>
            <div className="flex-grow min-h-0 mt-4 overflow-auto">
                {data.length > 0 ? (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-700">
                                <th scope="col" className="p-3 text-left text-sm font-semibold text-gray-300 w-1/6">
                                    {/* Empty corner or category header */}
                                </th>
                                {config.columns.map(col => (
                                    <th key={col.key} scope="col" className="p-3 text-center text-sm font-semibold text-gray-300">
                                        <div>{col.header}</div>
                                        {col.subHeader && <div className="text-xs font-normal text-gray-500">{col.subHeader}</div>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody onMouseLeave={() => setHoveredRowCategory(null)}>
                            {data.map((row, rowIndex) => {
                                const rowCategory = row[config.rowCategoryColumn];
                                const isHovered = hoveredRowCategory === rowCategory;
                                
                                return (
                                    <tr 
                                        key={rowIndex} 
                                        className="border-b border-gray-800 last:border-b-0"
                                        style={{
                                            transition: 'opacity 0.2s ease-in-out, background-color 0.2s ease-in-out',
                                            opacity: hoveredRowCategory && !isHovered ? 0.6 : 1,
                                            backgroundColor: isHovered ? '#1F2937' : 'transparent', // gray-800
                                        }}
                                        onMouseEnter={() => setHoveredRowCategory(rowCategory)}
                                    >
                                        <th 
                                            scope="row"
                                            className="p-3 text-left font-medium text-gray-300 cursor-pointer transition-colors duration-200"
                                            onClick={() => onCategoryClick?.(config.rowCategoryColumn, rowCategory)}
                                            style={{ color: isHovered ? 'white' : undefined }}
                                        >
                                            {rowCategory}
                                        </th>
                                        {config.columns.map(col => {
                                            const value = row[col.key];
                                            const colorScale = colorScales[col.key];
                                            const cellStyle: React.CSSProperties = {};
                                            let cellClasses = 'p-1';
                                            let textClasses = 'text-center text-gray-300';

                                            if (colorScale && typeof value === 'number') {
                                                cellStyle.backgroundColor = colorScale(value);
                                                cellClasses += ' rounded-md';
                                                textClasses = 'text-center text-white font-medium';
                                            }

                                            return (
                                                <td key={col.key} className="p-2 align-middle">
                                                    <div className={cellClasses} style={cellStyle}>
                                                        <span className={textClasses}>{formatValue(value, col)}</span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No data available for this chart.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableChartComponent;