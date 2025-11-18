
import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { BarChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface BarChartComponentProps {
  config: BarChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

const COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#55C6A9', '#F7B801', '#A37774', '#F45B69'];

const BarChartComponent: React.FC<BarChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredBar, setHoveredBar] = useState<{ category: string; colorCategory?: string } | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; category: string; value: number; colorCategory?: string } | null>(null);
    const { colorCategoryColumn } = config;

    const { aggregatedData, colorCategories } = useMemo(() => {
        if (!data || data.length === 0) return { aggregatedData: [], colorCategories: [] };
        
        const categoryAccessor = (d: any) => d[config.categoryColumn];
        const valueAccessor = (d: any) => d[config.valueColumn];
        let rollup;

        const sortFn = (a: any, b: any) => {
            if (typeof a === 'number' && typeof b === 'number') {
                return a - b;
            }
            const numA = Number(a);
            const numB = Number(b);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return String(a).localeCompare(String(b));
        };

        let aggFunc;
        switch (config.aggregation) {
            case 'sum': aggFunc = (v: any[]) => d3.sum(v, valueAccessor); break;
            case 'avg': aggFunc = (v: any[]) => d3.mean(v, valueAccessor) ?? 0; break;
            case 'max': aggFunc = (v: any[]) => d3.max(v, valueAccessor) ?? 0; break;
            case 'min': aggFunc = (v: any[]) => d3.min(v, valueAccessor) ?? 0; break;
            case 'count': default: aggFunc = (v: any[]) => v.length; break;
        }

        if (colorCategoryColumn) {
            const colorCategoryAccessor = (d: any) => d[colorCategoryColumn];
            const allMainCategories = Array.from(new Set(data.map(categoryAccessor))).sort(sortFn);
            const allColorCategories = Array.from(new Set(data.map(colorCategoryAccessor))).sort((a,b) => ['critical', 'high', 'medium', 'low'].indexOf(a as string) - ['critical', 'high', 'medium', 'low'].indexOf(b as string));

            rollup = d3.rollup(data, aggFunc, categoryAccessor, colorCategoryAccessor);

            const finalData = allMainCategories.map(mainCat => {
                const subData = rollup.get(mainCat) || new Map();
                return {
                    category: mainCat,
                    values: allColorCategories.map(colorCat => ({
                        colorCategory: colorCat,
                        value: subData.get(colorCat) || 0,
                    })),
                };
            });
            return { aggregatedData: finalData, colorCategories: allColorCategories };
        } else {
             rollup = d3.rollup(data, aggFunc, categoryAccessor);
             const finalData = Array.from(rollup, ([category, value]) => ({ category, value: value || 0 }));
             finalData.sort((a, b) => sortFn(a.category, b.category));
             return { aggregatedData: finalData, colorCategories: [] };
        }
    }, [data, config.categoryColumn, config.valueColumn, config.aggregation, colorCategoryColumn]);


    const formatValue = (value: number): string => {
        const { yAxisFormat, currencySymbol = '$', decimalPlaces = 0 } = config;

        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        
        const formattedValue = new Intl.NumberFormat('en-US', options).format(value);

        switch (yAxisFormat) {
            case 'currency':
                return `${currencySymbol}${formattedValue}`;
            case 'percent':
                return `${formattedValue}%`;
            case 'number':
            default:
                return formattedValue;
        }
    }
    
    const handleExportCsv = () => {
        const exportData = colorCategoryColumn
            ? aggregatedData.flatMap((d: any) => d.values.map((v: any) => ({ category: d.category, ...v })))
            : aggregatedData;
        exportToCsv(exportData, config.id || 'barchart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'barchart-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 6} row-span-${config.gridHeight || 2}`;
    
    const legendWidth = colorCategoryColumn ? (d3.max(colorCategories, c => String(c).length) || 0) * 8 + 40 : 0;
    
    const margin = { 
        top: colorCategoryColumn ? 40 : 20, 
        right: 20 + legendWidth, 
        bottom: 100, // Increased for rotated labels
        left: config.yAxisLabel ? 70 : 50 
    };
    const width = 600; 
    const height = 350;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const mainCategories = useMemo(() => aggregatedData.map((d: any) => d.category), [aggregatedData]);
    
    const xScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(mainCategories.map(String))
            .range([0, innerWidth])
            .padding(0.2);
    }, [mainCategories, innerWidth]);

    const x1Scale = useMemo(() => {
        if (!colorCategoryColumn) return null;
        return d3Scale.scaleBand<string>()
            .domain(colorCategories as string[])
            .range([0, xScale.bandwidth()])
            .padding(0.05);
    }, [colorCategoryColumn, colorCategories, xScale]);
    
    const colorScale = useMemo(() => {
        if (!colorCategoryColumn) return null;
        return d3Scale.scaleOrdinal<string>()
            .domain(colorCategories as string[])
            .range(COLORS);
    }, [colorCategoryColumn, colorCategories]);

    const yScale = useMemo(() => {
        const maxValue = colorCategoryColumn 
            ? d3.max(aggregatedData, (d: any) => d3.max(d.values, (v: any) => v.value)) || 0
            : d3.max(aggregatedData, (d: any) => d.value) || 0;

        return d3Scale.scaleLinear()
            .domain([0, maxValue === 0 ? 10 : maxValue * 1.1])
            .range([innerHeight, 0])
            .nice();
    }, [aggregatedData, innerHeight, colorCategoryColumn]);

    const { labelSkip, fontSize } = useMemo(() => {
        if (!mainCategories || mainCategories.length === 0) {
            return { labelSkip: 1, fontSize: 14 };
        }
        const maxLen = d3.max(mainCategories, c => String(c).length) || 0;
        const fs = maxLen > 10 ? 12 : 14;
        const step = xScale.step();
        
        // Heuristic for -60deg rotated text width
        const requiredWidth = Math.max(20, maxLen * fs * 0.5); 
        
        let skip = 1;
        if (step < requiredWidth && step > 0) {
            skip = Math.ceil(requiredWidth / step);
        }
        return { labelSkip: skip, fontSize: fs };
    }, [mainCategories, xScale]);

    const handleBarHover = (event: React.MouseEvent, category: string, value: number, colorCategory?: string) => {
        setHoveredBar({ category, colorCategory });
        if (!chartContainerRef.current) return;
    
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        setTooltip({ x, y, category, value, colorCategory });
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
                {aggregatedData.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <title>{config.title}</title>
                        <desc>{config.description}</desc>
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {/* Y-Axis Ticks and Grid Lines */}
                            {yScale.ticks(5).map(tickValue => (
                                <g key={tickValue} transform={`translate(0, ${yScale(tickValue)})`} className="text-gray-500">
                                    <line x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" />
                                    <text x="-9" dy="0.32em" textAnchor="end" fill="currentColor" fontSize="14">
                                        {formatValue(tickValue)}
                                    </text>
                                </g>
                            ))}
                             <line x1="0" x2="0" y1="0" y2={innerHeight} stroke="currentColor" strokeOpacity="0.2" className="text-gray-500"/>

                            {/* Bars */}
                            {colorCategoryColumn && x1Scale && colorScale ? (
                                aggregatedData.map(({ category, values }: any) => (
                                    <g key={category} transform={`translate(${xScale(String(category)) ?? 0}, 0)`}>
                                        {values.map(({ colorCategory, value }: any) => (
                                            <rect
                                                key={colorCategory}
                                                x={x1Scale(colorCategory)}
                                                y={yScale(value)}
                                                width={x1Scale.bandwidth()}
                                                height={innerHeight - yScale(value)}
                                                fill={colorScale(colorCategory)}
                                                aria-label={`${category} - ${colorCategory}: ${value}`}
                                                onClick={() => onCategoryClick?.(config.categoryColumn, category)}
                                                style={{
                                                    opacity: hoveredBar && (hoveredBar.category !== category || hoveredBar.colorCategory !== colorCategory) ? 0.5 : 1,
                                                    transition: 'opacity 0.2s ease-in-out',
                                                    cursor: onCategoryClick ? 'pointer' : 'default',
                                                }}
                                                onMouseOver={(e) => handleBarHover(e, category, value, colorCategory)}
                                                onMouseMove={(e) => handleBarHover(e, category, value, colorCategory)}
                                                onMouseLeave={handleMouseLeave}
                                            />
                                        ))}
                                    </g>
                                ))
                            ) : (
                                aggregatedData.map(({ category, value }: any) => (
                                    <rect
                                        key={category}
                                        x={xScale(String(category))}
                                        y={yScale(value)}
                                        width={xScale.bandwidth()}
                                        height={innerHeight - yScale(value)}
                                        fill={config.color || '#4ECDC4'}
                                        aria-label={`${category}: ${value}`}
                                        onClick={() => onCategoryClick?.(config.categoryColumn, category)}
                                        style={{
                                            opacity: hoveredBar && hoveredBar.category !== category ? 0.5 : 1,
                                            transition: 'opacity 0.2s ease-in-out',
                                            cursor: onCategoryClick ? 'pointer' : 'default',
                                        }}
                                        onMouseOver={(e) => handleBarHover(e, category, value)}
                                        onMouseMove={(e) => handleBarHover(e, category, value)}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                ))
                            )}

                            {/* X-Axis Labels */}
                            {mainCategories.map((category, i) => (
                                (i % labelSkip === 0) && (
                                   <text
                                        key={`label-${category}`}
                                        x={(xScale(String(category)) ?? 0) + xScale.bandwidth() / 2}
                                        y={innerHeight + 10}
                                        transform={`rotate(-60, ${(xScale(String(category)) ?? 0) + xScale.bandwidth() / 2}, ${innerHeight + 10})`}
                                        textAnchor="end"
                                        fill="currentColor"
                                        fontSize={fontSize}
                                        className="text-gray-400"
                                    >
                                        {category}
                                    </text>
                                )
                            ))}
                             <line y1={innerHeight} y2={innerHeight} x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" className="text-gray-500"/>
                             
                             {config.xAxisLabel && (
                                <text x={innerWidth / 2} y={innerHeight + margin.bottom - 20} textAnchor="middle" fill="currentColor" fontSize="18" className="text-gray-300 font-medium" >
                                    {config.xAxisLabel}
                                </text>
                            )}

                            {config.yAxisLabel && (
                                <text transform={`translate(${-margin.left + 25}, ${innerHeight / 2}) rotate(-90)`} textAnchor="middle" fill="currentColor" fontSize="18" className="text-gray-300 font-medium" >
                                    {config.yAxisLabel}
                                </text>
                            )}
                        </g>

                        {/* Legend */}
                        {colorCategoryColumn && colorScale && (
                            <g className="legend" transform={`translate(${width - margin.right + 20}, ${margin.top})`}>
                                {colorCategories.map((category, i) => (
                                    <g 
                                        key={category as string} 
                                        transform={`translate(0, ${i * 20})`}
                                        onClick={() => onCategoryClick && colorCategoryColumn && onCategoryClick(colorCategoryColumn, category as string)}
                                        style={{ cursor: onCategoryClick && colorCategoryColumn ? 'pointer' : 'default' }}
                                    >
                                        <rect width="15" height="15" fill={colorScale(category as string)} rx="3" />
                                        <text x="22" y="12" fill="currentColor" fontSize="14" className="text-gray-300 capitalize" textAnchor="start">{category as string}</text>
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
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white shadow-lg pointer-events-none z-10"
                    style={{ top: tooltip.y + 15, left: tooltip.x, transform: 'translateX(-50%)' }} >
                    <div className="font-bold">{tooltip.category}</div>
                    {tooltip.colorCategory && <div className="capitalize font-semibold">{tooltip.colorCategory}</div>}
                    <div>Value: {formatValue(tooltip.value)}</div>
                </div>
            )}
        </div>
    );
};

export default BarChartComponent;
