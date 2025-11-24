
import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { BoxPlotWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface BoxPlotChartComponentProps {
  config: BoxPlotWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

interface BoxPlotStats {
    category: string;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    colorCategory?: string;
}

const DEFAULT_COLORS = ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1'];

const BoxPlotChartComponent: React.FC<BoxPlotChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; stats: BoxPlotStats } | null>(null);

    const processedData: BoxPlotStats[] = useMemo(() => {
        if (!data || data.length === 0) return [];

        const { categoryColumn, valueColumn, colorColumn } = config;
        const groupedData = d3.group(data, d => d[categoryColumn]);
        
        const stats: BoxPlotStats[] = [];
        groupedData.forEach((values, category) => {
            const valueAccessor = (d: any) => d[valueColumn];
            const sortedValues = values.map(valueAccessor).sort(d3.ascending);
            const colorCategory = colorColumn ? values[0][colorColumn] : undefined;
            
            stats.push({
                category: String(category),
                min: sortedValues[0],
                q1: d3.quantile(sortedValues, 0.25)!,
                median: d3.quantile(sortedValues, 0.5)!,
                q3: d3.quantile(sortedValues, 0.75)!,
                max: sortedValues[sortedValues.length - 1],
                colorCategory,
            });
        });
        
        stats.sort((a,b) => b.median - a.median);

        return stats;
    }, [data, config.categoryColumn, config.valueColumn, config.colorColumn]);

    const colorScale = useMemo(() => {
        if (!config.colorColumn) return null;

        const colorDomain = Array.from(new Set(processedData.flatMap(d => d.colorCategory ? [d.colorCategory] : [])));
        
        const colorRange = config.categoryColors 
            ? colorDomain.map(cat => config.categoryColors![cat] || '#cccccc')
            : DEFAULT_COLORS;

        return d3Scale.scaleOrdinal<string>()
            .domain(colorDomain)
            .range(colorRange);
    }, [processedData, config.colorColumn, config.categoryColors]);

    const legendItems = useMemo(() => {
        if (!colorScale) return [];
        return (colorScale.domain() as string[]).map(domainValue => ({
            label: domainValue,
            color: colorScale(domainValue)
        }));
    }, [colorScale]);

    const formatValue = (value: number): string => {
        const { yAxisFormat, decimalPlaces = 0 } = config;

        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        
        const formattedValue = new Intl.NumberFormat('en-US', options).format(value);

        switch (yAxisFormat) {
            case 'currency':
                return `$${formattedValue}`;
            case 'percent':
                return `${formattedValue}%`;
            case 'number':
            default:
                return formattedValue;
        }
    }

    const handleExportCsv = () => {
        exportToCsv(processedData, config.id || 'boxplot-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'boxplot-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 5}`;
    
    const legendWidth = legendItems.length > 0 ? (d3.max(legendItems, item => item.label.length) ?? 0) * 8 + 40 : 0;
    const margin = { top: 20, right: 30 + legendWidth, bottom: 50, left: 60 };
    const width = 800; 
    const height = 450;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const categories = processedData.map(d => d.category);
    
    const xScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(categories)
            .range([0, innerWidth])
            .padding(0.6); // Generous padding for thinner boxes
    }, [categories, innerWidth]);

    const yScale = useMemo(() => {
        const allValues = processedData.flatMap(d => [d.min, d.max]);
        const dataMax = d3.max(allValues) ?? 0;
        return d3Scale.scaleLinear()
            .domain([0, dataMax * 1.1])
            .range([innerHeight, 0])
            .nice();
    }, [processedData, innerHeight]);

    const handleMouseMove = (event: React.MouseEvent, stats: BoxPlotStats) => {
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, stats });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-xl font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md text-gray-400 mb-4">{config.description}</p>
            </div>
            <div className="flex-grow min-h-0">
                {processedData.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {/* Y-Axis and Grid Lines */}
                            {yScale.ticks(5).map(tickValue => (
                                <g key={tickValue} transform={`translate(0, ${yScale(tickValue)})`} className="text-gray-600">
                                    <line x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" />
                                    <text x="-9" dy="0.32em" textAnchor="end" fill="currentColor" fontSize="14">
                                        {formatValue(tickValue)}
                                    </text>
                                </g>
                            ))}
                            <line y1={innerHeight} y2={innerHeight} x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" className="text-gray-600"/>

                             {/* X-Axis Labels */}
                            {categories.map((category) => (
                               <text
                                    key={`label-${category}`}
                                    x={(xScale(category) ?? 0) + xScale.bandwidth() / 2}
                                    y={innerHeight + 25}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    fontSize="16"
                                    className="text-gray-400"
                                >
                                    {category}
                                </text>
                            ))}

                            {config.yAxisLabel && (
                                <text transform={`translate(${-margin.left + 20}, ${innerHeight / 2}) rotate(-90)`} textAnchor="middle" fill="currentColor" fontSize="16" className="text-gray-300 font-medium" >
                                    {config.yAxisLabel}
                                </text>
                            )}

                            {/* Box Plots */}
                            {processedData.map(stats => {
                                const x = xScale(stats.category) ?? 0;
                                const boxWidth = xScale.bandwidth();
                                const color = colorScale && stats.colorCategory ? colorScale(stats.colorCategory) : config.color || '#F97316';

                                return (
                                    <g key={stats.category} transform={`translate(${x}, 0)`}>
                                        {/* Main vertical line */}
                                        <line
                                            x1={boxWidth / 2}
                                            x2={boxWidth / 2}
                                            y1={yScale(stats.min)}
                                            y2={yScale(stats.max)}
                                            stroke={color}
                                            strokeWidth={2}
                                        />
                                        {/* Box */}
                                        <rect
                                            x={0}
                                            y={yScale(stats.q3)}
                                            width={boxWidth}
                                            height={yScale(stats.q1) - yScale(stats.q3)}
                                            fill={color}
                                            stroke="#111827"
                                            strokeWidth={1}
                                            aria-label={`${stats.category}: Min ${stats.min}, Q1 ${stats.q1}, Median ${stats.median}, Q3 ${stats.q3}, Max ${stats.max}`}
                                        />
                                        {/* Median line */}
                                        <line
                                            x1={0}
                                            x2={boxWidth}
                                            y1={yScale(stats.median)}
                                            y2={yScale(stats.median)}
                                            stroke="#FFFFFF"
                                            strokeWidth={3}
                                        />
                                        {/* Min Cap */}
                                        <line
                                            x1={boxWidth * 0.2}
                                            x2={boxWidth * 0.8}
                                            y1={yScale(stats.min)}
                                            y2={yScale(stats.min)}
                                            stroke={color}
                                            strokeWidth={2}
                                        />
                                        {/* Max Cap */}
                                        <line
                                            x1={boxWidth * 0.2}
                                            x2={boxWidth * 0.8}
                                            y1={yScale(stats.max)}
                                            y2={yScale(stats.max)}
                                            stroke={color}
                                            strokeWidth={2}
                                        />
                                        {/* Interaction Area */}
                                        <rect
                                            x={0}
                                            y={0}
                                            width={boxWidth}
                                            height={innerHeight}
                                            fill="transparent"
                                            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                                            onMouseMove={(e) => handleMouseMove(e, stats)}
                                            onMouseLeave={handleMouseLeave}
                                            onClick={() => onCategoryClick?.(config.categoryColumn, stats.category)}
                                        />
                                    </g>
                                );
                            })}
                        </g>
                        {/* Legend */}
                        {legendItems.length > 0 && (
                            <g className="legend" transform={`translate(${width - margin.right + 30}, ${margin.top})`}>
                                {legendItems.map((item, i) => (
                                    <g 
                                        key={item.label} 
                                        transform={`translate(0, ${i * 20})`}
                                    >
                                        <rect width="15" height="15" fill={item.color} rx="3" />
                                        <text x="22" y="12" fill="currentColor" fontSize="14" className="text-gray-300 capitalize" textAnchor="start">{item.label}</text>
                                    </g>
                                ))}
                            </g>
                        )}
                    </svg>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No data available for this chart.</p>
                    </div>
                )}
            </div>
            {tooltip && (
                <div
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-white shadow-lg pointer-events-none z-10 font-mono"
                    style={{ top: tooltip.y + 15, left: tooltip.x, transform: 'translateX(-50%)' }}
                >
                    <div className="font-sans font-bold mb-2 text-base">{tooltip.stats.category}</div>
                    {tooltip.stats.colorCategory && 
                        <div className="font-sans font-semibold capitalize mb-2" style={{color: colorScale ? colorScale(tooltip.stats.colorCategory) : undefined}}>
                            {tooltip.stats.colorCategory}
                        </div>
                    }
                    <table className="w-full text-left">
                        <tbody>
                            <tr><td className="pr-4">Max</td><td className="text-right">{formatValue(tooltip.stats.max)}</td></tr>
                            <tr><td className="pr-4">Q3</td><td className="text-right">{formatValue(tooltip.stats.q3)}</td></tr>
                            <tr className="font-bold text-white">
                                <td className="pr-4">Median</td><td className="text-right">{formatValue(tooltip.stats.median)}</td>
                            </tr>
                            <tr><td className="pr-4">Q1</td><td className="text-right">{formatValue(tooltip.stats.q1)}</td></tr>
                            <tr><td className="pr-4">Min</td><td className="text-right">{formatValue(tooltip.stats.min)}</td></tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BoxPlotChartComponent;
