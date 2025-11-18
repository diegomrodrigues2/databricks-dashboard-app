import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { GroupedBarChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface GroupedBarChartComponentProps {
  config: GroupedBarChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

const GroupedBarChartComponent: React.FC<GroupedBarChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; category: string; value: number; seriesName: string } | null>(null);
    const [hoveredBar, setHoveredBar] = useState<{ category: string; seriesKey: string } | null>(null);

    const formatValue = (value: number): string => {
        const { xAxisFormat, currencySymbol = '$', decimalPlaces = 0 } = config;

        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        
        const formattedValue = new Intl.NumberFormat('en-US', options).format(value);

        switch (xAxisFormat) {
            case 'currency': return `${currencySymbol}${formattedValue}`;
            case 'percent': return `${formattedValue}%`;
            case 'number': default: return formattedValue;
        }
    }
    
    const handleExportCsv = () => {
        exportToCsv(data, config.id || 'grouped-barchart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'grouped-barchart-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 3}`;
    
    const legendWidth = (d3.max(config.barColumns, c => c.name.length) || 0) * 8 + 40;
    
    const margin = { 
        top: 40,
        right: 20, 
        bottom: config.xAxisLabel ? 60 : 40, 
        left: (d3.max(data, d => d[config.categoryColumn]?.length) || 0) * 8 + 10,
    };
    const width = 800; 
    const height = data.length * 60 + margin.top + margin.bottom;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const categories = useMemo(() => data.map((d: any) => d[config.categoryColumn]), [data, config.categoryColumn]);
    
    const yScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(categories)
            .range([0, innerHeight])
            .padding(0.2);
    }, [categories, innerHeight]);

    const y1Scale = useMemo(() => {
        return d3Scale.scaleBand<string>()
            .domain(config.barColumns.map(c => c.key))
            .range([0, yScale.bandwidth()])
            .padding(0.05);
    }, [config.barColumns, yScale]);

    const xScale = useMemo(() => {
        const maxValue = d3.max(data, (d: any) => d3.max(config.barColumns, c => d[c.key])) || 0;
        return d3Scale.scaleLinear()
            .domain([0, maxValue === 0 ? 10 : maxValue * 1.1])
            .range([0, innerWidth])
            .nice();
    }, [data, innerWidth, config.barColumns]);

    const handleMouseMove = (event: React.MouseEvent, category: string, value: number, seriesName: string, seriesKey: string) => {
        setHoveredBar({ category, seriesKey });
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, category, value, seriesName });
    };
    
    const handleMouseLeave = () => {
        setHoveredBar(null);
        setTooltip(null);
    };

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-lg font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-sm text-gray-400 mb-4">{config.description}</p>
            </div>
            <div className="flex-grow min-h-0">
                {data.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <title>{config.title}</title>
                        <desc>{config.description}</desc>
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {/* Legend */}
                            <g className="legend" transform={`translate(0, -30)`}>
                                {config.barColumns.map((col, i) => {
                                    const isClickable = onCategoryClick && config.legendFilterColumn;
                                    return (
                                        <g 
                                            key={col.key} 
                                            transform={`translate(${i * legendWidth}, 0)`}
                                            onClick={() => isClickable && onCategoryClick(config.legendFilterColumn!, col.name)}
                                            style={{ cursor: isClickable ? 'pointer' : 'default' }}
                                        >
                                            <rect width="15" height="15" fill={col.color} rx="3" />
                                            <text x="22" y="12" fill="currentColor" fontSize="14" className="text-gray-300 capitalize" textAnchor="start">{col.name}</text>
                                        </g>
                                    );
                                })}
                            </g>

                            {/* X-Axis Ticks and Grid Lines */}
                            {xScale.ticks(5).map(tickValue => (
                                <g key={tickValue} transform={`translate(${xScale(tickValue)}, 0)`} className="text-gray-500">
                                    <line y2={innerHeight} stroke="currentColor" strokeOpacity="0.2" />
                                    <text y={innerHeight + 20} textAnchor="middle" fill="currentColor" fontSize="14">
                                        {formatValue(tickValue)}
                                    </text>
                                </g>
                            ))}
                             <line y1={innerHeight} y2={innerHeight} x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" className="text-gray-500"/>

                            {/* Y-Axis Labels */}
                            {categories.map((category) => (
                               <text
                                    key={`label-${category}`}
                                    x={-10}
                                    y={(yScale(category) ?? 0) + yScale.bandwidth() / 2}
                                    dominantBaseline="middle"
                                    textAnchor="end"
                                    fill="currentColor"
                                    fontSize="16"
                                    className="text-gray-400"
                                >
                                    {category}
                                </text>
                            ))}
                            
                            {/* Bars and Value Labels */}
                            {data.map((d: any) => (
                                <g key={d[config.categoryColumn]} transform={`translate(0, ${yScale(d[config.categoryColumn]) ?? 0})`}>
                                    {config.barColumns.map(col => (
                                        <g key={col.key}>
                                            <rect
                                                y={y1Scale(col.key)}
                                                x={0}
                                                height={y1Scale.bandwidth()}
                                                width={xScale(d[col.key])}
                                                fill={col.color}
                                                aria-label={`${d[config.categoryColumn]} - ${col.name}: ${d[col.key]}`}
                                                style={{
                                                    transition: 'opacity 0.2s ease-in-out, width 0.2s ease-in-out',
                                                    cursor: 'pointer',
                                                    opacity: hoveredBar && (hoveredBar.category !== d[config.categoryColumn] || hoveredBar.seriesKey !== col.key) ? 0.5 : 1,
                                                }}
                                                onMouseMove={(e) => handleMouseMove(e, d[config.categoryColumn], d[col.key], col.name, col.key)}
                                                onMouseLeave={handleMouseLeave}
                                            />
                                            <text
                                                x={xScale(d[col.key]) + 5}
                                                y={(y1Scale(col.key) ?? 0) + y1Scale.bandwidth() / 2}
                                                dominantBaseline="middle"
                                                fill="currentColor"
                                                fontSize="14"
                                                className="text-gray-400"
                                            >
                                                {formatValue(d[col.key])}
                                            </text>
                                        </g>
                                    ))}
                                </g>
                            ))}
                             
                             {config.xAxisLabel && (
                                <text x={innerWidth / 2} y={innerHeight + margin.bottom - 10} textAnchor="middle" fill="currentColor" fontSize="18" className="text-gray-300 font-medium" >
                                    {config.xAxisLabel}
                                </text>
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
                    <div className="font-bold">{tooltip.category}</div>
                    <div className="capitalize font-semibold" style={{ color: config.barColumns.find(c => c.name === tooltip.seriesName)?.color }}>{tooltip.seriesName}</div>
                    <div>Value: {formatValue(tooltip.value)}</div>
                </div>
            )}
        </div>
    );
};

export default GroupedBarChartComponent;