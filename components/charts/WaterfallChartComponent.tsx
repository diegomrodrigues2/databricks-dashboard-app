import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { WaterfallChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface WaterfallChartComponentProps {
  config: WaterfallChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

interface ProcessedWaterfallData {
    category: string;
    start: number;
    end: number;
    value: number; // The original change value
    type: 'positive' | 'negative' | 'total';
    percentage?: number;
}

const WaterfallChartComponent: React.FC<WaterfallChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: ProcessedWaterfallData } | null>(null);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const processedData: ProcessedWaterfallData[] = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        let runningTotal = 0;
        const chartItems: ProcessedWaterfallData[] = [];
        
        data.forEach(item => {
            const category = item[config.categoryColumn];
            const value = item[config.valueColumn];
            const isTotal = config.totalCategories.includes(category);
            
            let start: number, end: number, type: ProcessedWaterfallData['type'], percentage: number | undefined;
            
            if (isTotal) {
                start = 0;
                end = value;
                type = 'total';
                runningTotal = value;
            } else {
                start = runningTotal;
                end = runningTotal + value;
                type = value >= 0 ? 'positive' : 'negative';
                if (start !== 0) {
                    percentage = (value / start) * 100;
                }
                runningTotal = end;
            }
            chartItems.push({ category, start, end, value, type, percentage });
        });
        
        const finalTotalCategory = config.totalCategories[config.totalCategories.length - 1];
        if (!data.some(d => d[config.categoryColumn] === finalTotalCategory)) {
            chartItems.push({
                category: finalTotalCategory,
                start: 0,
                end: runningTotal,
                value: runningTotal,
                type: 'total'
            });
        }
        
        return chartItems;
    }, [data, config.categoryColumn, config.valueColumn, config.totalCategories]);


    const formatYAxisValue = (value: number): string => {
        if (value === 0) return '$0k';
        return `${config.currencySymbol || '$'}${value / 1000}k`;
    };

    const handleExportCsv = () => {
        exportToCsv(processedData, config.id || 'waterfall-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'waterfall-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 3}`;
    
    const margin = { top: 40, right: 20, bottom: 40, left: 50 };
    const width = 800;
    const height = 300;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const categories = useMemo(() => processedData.map(d => d.category), [processedData]);
    
    const xScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(categories)
            .range([0, innerWidth])
            .padding(0.3);
    }, [categories, innerWidth]);

    const yScale = useMemo(() => {
        const allValues = processedData.flatMap(d => [d.start, d.end]);
        const dataMin = d3.min(allValues) ?? 0;
        const dataMax = d3.max(allValues) ?? 0;
        
        return d3Scale.scaleLinear()
            .domain([0, dataMax * 1.1])
            .range([innerHeight, 0])
            .nice();
    }, [processedData, innerHeight]);

    const handleMouseMove = (event: React.MouseEvent, d: ProcessedWaterfallData) => {
        setHoveredCategory(d.category);
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            data: d,
        });
    };
    
    const handleMouseLeave = () => {
        setHoveredCategory(null);
        setTooltip(null);
    };
    
    const positiveColor = config.positiveColor || '#3B82F6';
    const negativeColor = config.negativeColor || '#F97316';
    const totalColor = config.totalColor || '#6B7280';

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-lg font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-sm text-gray-400 mb-4">{config.description}</p>
            </div>
            <div className="flex-grow min-h-0">
                {processedData.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {/* Y-Axis and Grid lines */}
                            {yScale.ticks(5).map(tickValue => (
                                <g key={tickValue} transform={`translate(0, ${yScale(tickValue)})`} className="text-gray-600">
                                    <line x2={innerWidth} stroke="currentColor" strokeWidth="0.5" />
                                    <text x="-10" dy="0.32em" textAnchor="end" fill="currentColor" fontSize="12">
                                        {formatYAxisValue(tickValue)}
                                    </text>
                                </g>
                            ))}
                            <line y1={innerHeight} y2={innerHeight} x2={innerWidth} stroke="currentColor" strokeOpacity="0.5" className="text-gray-600"/>

                            {/* X-Axis Labels */}
                            {processedData.map(d => (
                                <g key={d.category} transform={`translate(${(xScale(d.category) ?? 0) + xScale.bandwidth() / 2}, ${innerHeight})`}>
                                    <text y={20} textAnchor="middle" fill="currentColor" fontSize="12" className="text-gray-400">
                                        {d.category}
                                    </text>
                                </g>
                            ))}
                            
                            {/* Bars and Connector Lines */}
                            {processedData.map((d, i) => {
                                const isHovered = hoveredCategory === d.category;
                                const barWidth = xScale.bandwidth();
                                const x = xScale(d.category) ?? 0;
                                
                                let y: number, height: number, color: string;
                                if (d.type === 'positive') {
                                    y = yScale(d.end);
                                    height = yScale(d.start) - yScale(d.end);
                                    color = positiveColor;
                                } else if (d.type === 'negative') {
                                    y = yScale(d.start);
                                    height = yScale(d.end) - yScale(d.start);
                                    color = negativeColor;
                                } else { // total
                                    y = yScale(d.end);
                                    height = yScale(0) - yScale(d.end);
                                    color = totalColor;
                                }

                                const connector = processedData[i + 1] && d.type !== 'total' && processedData[i + 1].type !== 'total';
                                
                                return (
                                    <g 
                                        key={d.category}
                                        onMouseMove={(e) => handleMouseMove(e, d)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => onCategoryClick?.(config.categoryColumn, d.category)}
                                        style={{ cursor: onCategoryClick ? 'pointer' : 'default', opacity: hoveredCategory && !isHovered ? 0.6 : 1 }}
                                        className="transition-opacity"
                                    >
                                        <rect
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={height}
                                            fill={color}
                                        />
                                        {connector && (
                                            <line
                                                x1={x + barWidth}
                                                y1={yScale(d.end)}
                                                x2={xScale(processedData[i+1].category)}
                                                y2={yScale(d.end)}
                                                stroke="#6B7280"
                                                strokeWidth="1"
                                                strokeDasharray="2,2"
                                            />
                                        )}
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
                    <div className="font-bold">{tooltip.data.category}</div>
                    <div>Change: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tooltip.data.value)}</div>
                    {tooltip.data.percentage !== undefined && 
                        <div>({tooltip.data.percentage.toFixed(1)}%)</div>
                    }
                </div>
            )}
        </div>
    );
};

export default WaterfallChartComponent;
