import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { LollipopChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface LollipopChartComponentProps {
  config: LollipopChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

interface AggregatedLollipopData {
    category: string;
    value: number;
}

const LollipopChartComponent: React.FC<LollipopChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; category: string; value: number } | null>(null);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const aggregatedData: AggregatedLollipopData[] = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const categoryAccessor = (d: any) => d[config.categoryColumn];
        const valueAccessor = (d: any) => d[config.valueColumn];
        
        let aggFunc: (v: any[]) => number;
        switch (config.aggregation) {
            case 'sum': aggFunc = (v: any[]) => d3.sum(v, valueAccessor); break;
            case 'avg': aggFunc = (v: any[]) => d3.mean(v, valueAccessor) ?? 0; break;
            case 'max': aggFunc = (v: any[]) => d3.max(v, valueAccessor) ?? 0; break;
            case 'min': aggFunc = (v: any[]) => d3.min(v, valueAccessor) ?? 0; break;
            case 'count': default: aggFunc = (v: any[]) => v.length; break;
        }
        
        const rollup = d3.rollup(data, aggFunc, categoryAccessor);
        
        const finalData: AggregatedLollipopData[] = Array.from(rollup, ([category, value]) => ({ category: String(category), value: value || 0 }));
        
        // Sort data by value in descending order
        finalData.sort((a, b) => b.value - a.value);

        return finalData;

    }, [data, config.categoryColumn, config.valueColumn, config.aggregation]);

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
        exportToCsv(aggregatedData, config.id || 'lollipopchart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'lollipopchart-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 4}`;
    
    const margin = { 
        top: 20,
        right: 80, // Space for value labels
        bottom: 30, // Space for footnote
        left: 100, // Space for category labels
    };
    const width = 800; 
    const height = aggregatedData.length * 35 + margin.top + margin.bottom;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const categories = useMemo(() => aggregatedData.map(d => d.category), [aggregatedData]);
    
    const yScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(categories)
            .range([0, innerHeight])
            .padding(1); // Gives space between lollipops
    }, [categories, innerHeight]);

    const xScale = useMemo(() => {
        const maxValue = d3.max(aggregatedData, d => d.value) || 0;
        const targetValue = config.targetValue || 0;
        const domainMax = Math.max(maxValue, targetValue);
        return d3Scale.scaleLinear()
            .domain([0, domainMax * 1.05]) // A little padding at the end
            .range([0, innerWidth]);
    }, [aggregatedData, innerWidth, config.targetValue]);

    const handleMouseMove = (event: React.MouseEvent, category: string, value: number) => {
        setHoveredCategory(category);
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, category, value });
    };
    
    const handleMouseLeave = () => {
        setHoveredCategory(null);
        setTooltip(null);
    };

    const defaultColor = config.color || '#6B7280';
    const highlightColor = config.highlightColor || '#3B82F6';
    const { targetValue, targetColor = '#FBBF24' } = config;

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-xl font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md text-gray-400 mb-6">{config.description}</p>
            </div>
            <div className="flex-grow min-h-0">
                {aggregatedData.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <title>{config.title}</title>
                        <desc>{config.description}</desc>
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {/* Target Line and Label (rendered first to be in the background) */}
                            {typeof targetValue === 'number' && (
                                <g transform={`translate(${xScale(targetValue)}, 0)`} className="pointer-events-none">
                                    <line
                                        y1={0}
                                        y2={innerHeight}
                                        stroke={targetColor}
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                        strokeOpacity={0.8}
                                    />
                                    <text
                                        y={0}
                                        dy="-0.5em"
                                        textAnchor="middle"
                                        fill={targetColor}
                                        fontSize="12"
                                        fontWeight="600"
                                    >
                                        {formatValue(targetValue)}
                                    </text>
                                </g>
                            )}

                            {/* Lollipops */}
                            {aggregatedData.map(d => {
                                const isPreHighlighted = d.category === config.highlightCategory;
                                const isHovered = d.category === hoveredCategory;
                                const isHighlighted = isPreHighlighted || isHovered;
                                const color = isHighlighted ? highlightColor : defaultColor;

                                return (
                                    <g 
                                        key={d.category} 
                                        transform={`translate(0, ${yScale(d.category) ?? 0})`}
                                        onMouseMove={(e) => handleMouseMove(e, d.category, d.value)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => onCategoryClick?.(config.categoryColumn, d.category)}
                                        style={{ 
                                            cursor: onCategoryClick ? 'pointer' : 'default',
                                            transition: 'opacity 0.2s ease-in-out'
                                        }}
                                        opacity={hoveredCategory && !isHovered ? 0.5 : 1}
                                    >
                                        {/* Category Label */}
                                        <text
                                            x={-10}
                                            dy="0.35em"
                                            textAnchor="end"
                                            fill={isHighlighted ? "#FFFFFF" : "#9CA3AF"}
                                            fontSize="14"
                                            fontWeight={isHighlighted ? "600" : "400"}
                                            style={{ transition: 'all 0.2s ease-in-out' }}
                                        >
                                            {d.category}
                                        </text>
                                        
                                        {/* Line */}
                                        <line 
                                            x1={xScale(0)} 
                                            x2={xScale(d.value)} 
                                            y1={0} 
                                            y2={0} 
                                            stroke={color} 
                                            strokeWidth={isHighlighted ? 2.5 : 1.5} 
                                            style={{ transition: 'all 0.2s ease-in-out' }}
                                        />
                                        
                                        {/* Circle */}
                                        <circle 
                                            cx={xScale(d.value)} 
                                            cy={0} 
                                            r={isHighlighted ? 6 : 4}
                                            fill={color} 
                                            style={{ transition: 'all 0.2s ease-in-out' }}
                                        />

                                        {/* Value Label */}
                                        <text
                                            x={xScale(d.value) + 12}
                                            dy="0.35em"
                                            textAnchor="start"
                                            fill={isHighlighted ? "#FFFFFF" : "#9CA3AF"}
                                            fontSize="16"
                                            fontWeight={isHighlighted ? "600" : "400"}
                                            style={{ transition: 'all 0.2s ease-in-out' }}
                                        >
                                            {formatValue(d.value)}
                                        </text>
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
                    <div>Units Sold: {formatValue(tooltip.value)}</div>
                </div>
            )}
        </div>
    );
};

export default LollipopChartComponent;