import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { DotPlotWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface DotPlotChartComponentProps {
  config: DotPlotWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

const DotPlotChartComponent: React.FC<DotPlotChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; category: string; series: string; value: number; color: string; } | null>(null);
    const [hoveredDot, setHoveredDot] = useState<{ category: string; key: string; } | null>(null);

    const formatValue = (value: number): string => {
        const { xAxisFormat, currencySymbol = '$', decimalPlaces = 0 } = config;
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        const formattedValue = new Intl.NumberFormat('de-DE', options).format(value);

        switch (xAxisFormat) {
            case 'currency': return `${currencySymbol}${formattedValue}`;
            case 'percent': return `${formattedValue}%`;
            case 'number': default: return formattedValue;
        }
    }
    
    const handleExportCsv = () => {
        exportToCsv(data, config.id || 'dotplot-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'dotplot-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 4}`;
    
    const margin = { 
        top: 80,
        right: 20, 
        bottom: 50,
        left: 100,
    };
    const width = 800; 
    const height = data.length * 40 + margin.top + margin.bottom;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const categories = useMemo(() => data.map(d => d[config.categoryColumn]), [data, config.categoryColumn]);
    
    const yScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(categories)
            .range([0, innerHeight])
            .padding(1);
    }, [categories, innerHeight]);

    const { dataMin, dataMax } = useMemo(() => {
        const allValues = data.flatMap(d => config.dotColumns.map(c => d[c.key] as number));
        return { dataMin: d3.min(allValues) ?? 0, dataMax: d3.max(allValues) ?? 0 };
    }, [data, config.dotColumns]);

    const xScale = useMemo(() => {
        const padding = (dataMax - dataMin) * 0.1;
        return d3Scale.scaleLinear()
            .domain([dataMin - padding, dataMax + padding])
            .range([0, innerWidth])
            .nice(5);
    }, [dataMin, dataMax, innerWidth]);

    const handleMouseMove = (event: React.MouseEvent, category: string, series: string, value: number, key: string, color: string) => {
        setHoveredDot({ category, key });
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, category, series, value, color });
    };
    
    const handleMouseLeave = () => {
        setHoveredDot(null);
        setTooltip(null);
    };

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div className="pl-4">
                <h4 className="text-xl font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md text-gray-400 mb-2">{config.description}</p>
                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                    {config.dotColumns.map(col => {
                        const isClickable = onCategoryClick && config.legendFilterColumn;
                        return (
                            <div 
                                key={col.key} 
                                className={`flex items-center gap-2 rounded-md p-1 ${isClickable ? 'cursor-pointer hover:bg-gray-800 transition-colors' : ''}`}
                                onClick={() => isClickable && onCategoryClick(config.legendFilterColumn!, col.name)}
                                aria-label={isClickable ? `Filter by ${col.name}`: undefined}
                            >
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }}></span>
                                <span className="text-sm text-gray-300">{col.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flex-grow min-h-0">
                {data.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <title>{config.title}</title>
                        <desc>{config.description}</desc>
                        <g transform={`translate(${margin.left},${margin.top})`}>

                             {xScale.ticks(5).map(tickValue => (
                                <g key={tickValue} transform={`translate(${xScale(tickValue)}, 0)`} className="text-gray-500">
                                    <line y2={innerHeight} stroke="currentColor" strokeOpacity="0.2" />
                                    <text y={innerHeight + 20} textAnchor="middle" fill="currentColor" fontSize="14">
                                        {formatValue(tickValue)}
                                    </text>
                                </g>
                            ))}
                             <line y1={innerHeight} y2={innerHeight} x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" className="text-gray-500"/>
                             
                            {data.map(d => {
                                const category = d[config.categoryColumn];
                                const rowValues = config.dotColumns.map(c => d[c.key]);
                                const rowMin = d3.min(rowValues) ?? 0;
                                const rowMax = d3.max(rowValues) ?? 0;
                                
                                return (
                                    <g 
                                        key={category} 
                                        transform={`translate(0, ${yScale(category) ?? 0})`}
                                        style={{ transition: 'opacity 0.2s ease-in-out', cursor: onCategoryClick ? 'pointer' : 'default' }}
                                        opacity={hoveredDot && hoveredDot.category !== category ? 0.3 : 1}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => onCategoryClick?.(config.categoryColumn, category)}
                                    >
                                        <text
                                            x={-10}
                                            dy="0.35em"
                                            textAnchor="end"
                                            fill="#9CA3AF"
                                            fontSize="14"
                                        >
                                            {category}
                                        </text>
                                        
                                        <line 
                                            x1={xScale(rowMin)} 
                                            x2={xScale(rowMax)} 
                                            y1={0} 
                                            y2={0} 
                                            stroke="#4B5563"
                                            strokeWidth={2.5} 
                                        />
                                        
                                        {config.dotColumns.map(col => {
                                            const value = d[col.key];
                                            const isHovered = hoveredDot?.category === category && hoveredDot?.key === col.key;
                                            return(
                                                <circle 
                                                    key={col.key}
                                                    cx={xScale(value)} 
                                                    cy={0} 
                                                    r={isHovered ? 8 : 6}
                                                    fill={col.color}
                                                    stroke={isHovered ? 'white' : 'none'}
                                                    strokeWidth={2}
                                                    style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                                                    onMouseMove={(e) => handleMouseMove(e, category, col.name, value, col.key, col.color)}
                                                    aria-label={`${category} - ${col.name}: ${formatValue(value)}`}
                                                />
                                            )
                                        })}
                                    </g>
                                );
                            })}
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
                    <div className="font-semibold" style={{ color: tooltip.color }}>{tooltip.series}</div>
                    <div>Value: {formatValue(tooltip.value)}</div>
                </div>
            )}
        </div>
    );
};

export default DotPlotChartComponent;