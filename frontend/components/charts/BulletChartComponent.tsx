import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { BulletChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface BulletChartComponentProps {
  config: BulletChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

interface AggregatedBulletData {
    category: string;
    value: number;
}

const BulletChartComponent: React.FC<BulletChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; category: string; value: number } | null>(null);

    const aggregatedData: AggregatedBulletData[] = useMemo(() => {
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
        const finalData: AggregatedBulletData[] = Array.from(rollup, ([category, value]) => ({ category: String(category), value: value || 0 }));
        finalData.sort((a, b) => b.value - a.value);
        return finalData;

    }, [data, config.categoryColumn, config.valueColumn, config.aggregation]);

    const formatValue = (value: number): string => {
        const { valueFormat, currencySymbol = '$', decimalPlaces = 0, valueNotation } = config;

        if (valueNotation === 'compact' && value >= 1000) {
             return `${currencySymbol}${Math.round(value / 1000)}k`;
        }
        
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };

        if (valueFormat === 'currency') {
            return `${currencySymbol}${new Intl.NumberFormat('en-US', options).format(value)}`;
        }
        
        return new Intl.NumberFormat('en-US', options).format(value);
    };
    
    const handleExportCsv = () => {
        exportToCsv(aggregatedData, config.id || 'bulletchart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'bulletchart-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 4}`;
    
    const margin = { 
        top: 40,
        right: 20,
        bottom: 60,
        left: 80,
    };
    const width = 800; 
    const height = aggregatedData.length * 40 + margin.top + margin.bottom;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const categories = useMemo(() => aggregatedData.map(d => d.category), [aggregatedData]);
    
    const yScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(categories)
            .range([0, innerHeight])
            .padding(0.4);
    }, [categories, innerHeight]);

    const maxRangeValue = useMemo(() => d3.max(config.ranges, d => d.value) || 0, [config.ranges]);

    const xScale = useMemo(() => {
        const domainMax = Math.max(d3.max(aggregatedData, d => d.value) || 0, config.targetValue, maxRangeValue);
        return d3Scale.scaleLinear()
            .domain([0, domainMax * 1.05])
            .range([0, innerWidth]);
    }, [aggregatedData, innerWidth, config.targetValue, maxRangeValue]);

    const handleMouseMove = (event: React.MouseEvent, category: string, value: number) => {
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, category, value });
    };
    
    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const defaultColor = config.color || '#3B82F6';
    const rangeColor = config.rangeColor || '#E5E7EB';
    const targetColor = config.targetColor || '#374151';

    const axisTicks = [0, ...config.ranges.map(r => r.value)];

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
                            {/* Target Line */}
                            <g transform={`translate(${xScale(config.targetValue)}, 0)`}>
                                <line y1={-10} y2={innerHeight} stroke={targetColor} strokeWidth="2" />
                                <text y={-15} textAnchor="middle" fill={targetColor} fontSize="12" fontWeight="600" className="text-gray-400">
                                    Target: {formatValue(config.targetValue)}
                                </text>
                            </g>

                            {/* Chart Rows */}
                            {aggregatedData.map(d => (
                                <g 
                                    key={d.category} 
                                    transform={`translate(0, ${yScale(d.category) ?? 0})`}
                                    onMouseMove={(e) => handleMouseMove(e, d.category, d.value)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => onCategoryClick?.(config.categoryColumn, d.category)}
                                    style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                                >
                                    <text x={-10} y={yScale.bandwidth() / 2} dy="0.35em" textAnchor="end" fill="currentColor" fontSize="14" className="text-gray-300">
                                        {d.category}
                                    </text>
                                    <rect
                                        x="0"
                                        y="0"
                                        width={xScale(maxRangeValue)}
                                        height={yScale.bandwidth()}
                                        fill={rangeColor}
                                        rx="3"
                                    />
                                    <rect
                                        x="0"
                                        y="0"
                                        width={xScale(d.value)}
                                        height={yScale.bandwidth()}
                                        fill={defaultColor}
                                        rx="3"
                                    />
                                    <text
                                        x={xScale(d.value) - 5}
                                        y={yScale.bandwidth() / 2}
                                        dy="0.35em"
                                        textAnchor="end"
                                        fill="white"
                                        fontSize="12"
                                        fontWeight="600"
                                        className="pointer-events-none"
                                    >
                                        {formatValue(d.value)}
                                    </text>
                                </g>
                            ))}

                            {/* Custom X-Axis */}
                            <g transform={`translate(0, ${innerHeight})`}>
                                {axisTicks.map((tick, i) => (
                                    <g key={tick} transform={`translate(${xScale(tick)}, 0)`}>
                                        <line y2="5" stroke="#4B5563" />
                                        <text y="20" textAnchor="middle" fill="currentColor" fontSize="12" className="text-gray-400">
                                            {formatValue(tick)}
                                        </text>
                                    </g>
                                ))}
                                {config.ranges.map((range, i) => {
                                    const prevTick = axisTicks[i];
                                    const x1 = xScale(prevTick);
                                    const x2 = xScale(range.value);
                                    return (
                                        <text key={range.label} x={(x1 + x2) / 2} y="40" textAnchor="middle" fill="currentColor" fontSize="12" className="text-gray-500">
                                            {range.label}
                                        </text>
                                    );
                                })}
                            </g>
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
                    <div>Revenue: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tooltip.value)}</div>
                </div>
            )}
        </div>
    );
};

export default BulletChartComponent;