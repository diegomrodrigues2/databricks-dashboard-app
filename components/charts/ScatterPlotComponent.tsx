import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { ScatterPlotWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface ScatterPlotComponentProps {
  config: ScatterPlotWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
  onExportToDashboard?: (dashboardId: string, newDashboardName?: string) => void;
  activeFilters?: { [key: string]: any };
}

const DEFAULT_COLORS = ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'];

const ScatterPlotComponent: React.FC<ScatterPlotComponentProps> = ({ config, data, onCategoryClick, onSeeData, onExportToDashboard, activeFilters = {} }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; item: any } | null>(null);
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

    const { xColumn, yColumn, labelColumn, colorColumn } = config;

    const selectedCategories = useMemo(() => {
        if (!colorColumn || !activeFilters[colorColumn]) {
            return [];
        }
        const filterValue = activeFilters[colorColumn];
        return Array.isArray(filterValue) ? filterValue : [String(filterValue)];
    }, [activeFilters, colorColumn]);

    // Color Scale
    const colorScale = useMemo(() => {
        if (!colorColumn || !data || data.length === 0) {
            return null;
        }
        
        const colorValues = data.map(d => d[colorColumn]);
        const uniqueColorValues = Array.from(new Set(colorValues));

        // Numerical scale
        if (typeof colorValues[0] === 'number' && Array.isArray(config.colorScheme) && config.colorScheme.length === 2) {
            const domain = d3.extent(colorValues as number[]) as [number, number];
            return d3Scale.scaleLinear<string>()
                .domain(domain)
                .range(config.colorScheme as [string, string]);
        }

        // Categorical scale
        if (typeof colorValues[0] === 'string') {
            const scheme = typeof config.colorScheme === 'object' && !Array.isArray(config.colorScheme)
                ? uniqueColorValues.map(val => (config.colorScheme as {[key: string]: string})[val as string] || '#ccc')
                : DEFAULT_COLORS;
            
            return d3Scale.scaleOrdinal<string>()
                .domain(uniqueColorValues as string[])
                .range(scheme);
        }

        return null;
    }, [data, colorColumn, config.colorScheme]);

    const legendItems = useMemo(() => {
        if (!colorScale || !data || data.length === 0 || typeof data[0]?.[colorColumn!] !== 'string') {
            return [];
        }
        const ordinalScale = colorScale as d3Scale.ScaleOrdinal<string, string>;
        return ordinalScale.domain().map(domainValue => ({
            label: domainValue,
            color: ordinalScale(domainValue)
        }));
    }, [colorScale, data, colorColumn]);

    // Highlighting
    const highlightMap = useMemo(() => {
        const map = new Map<string, NonNullable<ScatterPlotWidgetConfig['highlightPoints']>[0]>();
        if (config.highlightPoints) {
            config.highlightPoints.forEach(p => map.set(p.label, p));
        }
        return map;
    }, [config.highlightPoints]);


    const formatAxisValue = (value: number, format?: 'number' | 'currency' | 'percent', decimalPlaces = 0): string => {
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        const formattedValue = new Intl.NumberFormat('en-US', options).format(value);

        switch (format) {
            case 'currency': return `${config.currencySymbol || '$'}${formattedValue}`;
            case 'percent': return `${formattedValue}%`;
            case 'number': default: return formattedValue;
        }
    }
    
    const handleExportCsv = () => {
        exportToCsv(data, config.id || 'scatterplot-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'scatterplot-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 5}`;
    
    const legendWidth = legendItems.length > 0 ? 120 : 0;
    const margin = { top: 20, right: 30 + legendWidth, bottom: 60, left: 60 };
    const width = 800; 
    const height = 450;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const { xDomain, yDomain } = useMemo(() => {
        if (!data || data.length === 0) return { xDomain: [0, 1], yDomain: [0, 1] };
        const xExt = d3.extent(data, d => d[xColumn] as number) as [number, number];
        const yExt = d3.extent(data, d => d[yColumn] as number) as [number, number];
        
        const xPadding = (xExt[1] - xExt[0]) * 0.05;
        const yPadding = (yExt[1] - yExt[0]) * 0.05;

        return {
            xDomain: [0, xExt[1] + xPadding],
            yDomain: [0, yExt[1] + yPadding],
        };
    }, [data, xColumn, yColumn]);

    const xScale = useMemo(() => {
        return d3Scale.scaleLinear()
            .domain(xDomain)
            .range([0, innerWidth])
            .nice();
    }, [xDomain, innerWidth]);

    const yScale = useMemo(() => {
        return d3Scale.scaleLinear()
            .domain(yDomain)
            .range([innerHeight, 0])
            .nice();
    }, [yDomain, innerHeight]);

    const handleMouseMove = (event: React.MouseEvent, item: any) => {
        setHoveredLabel(item[labelColumn]);
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, item });
    };
    
    const handleMouseLeave = () => {
        setHoveredLabel(null);
        setTooltip(null);
    };

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} onExportToDashboard={onExportToDashboard} />
            <div>
                <h4 className="text-xl font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md text-gray-400 mb-4">{config.description}</p>
            </div>
            <div className="flex-grow min-h-0">
                {data.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <title>{config.title}</title>
                        <desc>{config.description}</desc>
                        <g transform={`translate(${margin.left},${margin.top})`}>
                             {/* Grid Lines */}
                            {yScale.ticks().map(tickValue => (
                                <g key={`y-tick-${tickValue}`} transform={`translate(0, ${yScale(tickValue)})`} className="text-gray-600">
                                    <line x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" />
                                </g>
                            ))}
                            {xScale.ticks().map(tickValue => (
                                <g key={`x-tick-${tickValue}`} transform={`translate(${xScale(tickValue)}, 0)`} className="text-gray-600">
                                    <line y2={innerHeight} stroke="currentColor" strokeOpacity="0.2" />
                                </g>
                            ))}

                             {/* Axes */}
                            {yScale.ticks().map(tickValue => (
                                <g key={`y-axis-${tickValue}`} transform={`translate(0, ${yScale(tickValue)})`} className="text-gray-400">
                                    <text x="-9" dy="0.32em" textAnchor="end" fill="currentColor" fontSize="14">
                                        {formatAxisValue(tickValue, config.yAxisFormat, config.decimalPlaces)}
                                    </text>
                                </g>
                            ))}
                            {xScale.ticks().map(tickValue => (
                                <g key={`x-axis-${tickValue}`} transform={`translate(${xScale(tickValue)}, 0)`} className="text-gray-400">
                                    <text y={innerHeight + 20} textAnchor="middle" fill="currentColor" fontSize="14">
                                        {formatAxisValue(tickValue, config.xAxisFormat, config.decimalPlaces)}
                                    </text>
                                </g>
                            ))}
                             
                             {/* Axis Labels */}
                             {config.xAxisLabel && (
                                <text x={innerWidth / 2} y={innerHeight + margin.bottom - 10} textAnchor="middle" fill="currentColor" fontSize="16" className="text-gray-300 font-medium" >
                                    {config.xAxisLabel}
                                </text>
                            )}
                            {config.yAxisLabel && (
                                <text transform={`translate(${-margin.left + 20}, ${innerHeight / 2}) rotate(-90)`} textAnchor="middle" fill="currentColor" fontSize="16" className="text-gray-300 font-medium" >
                                    {config.yAxisLabel}
                                </text>
                            )}
                            
                            {/* Data Points and Labels */}
                            {data.map((d, i) => {
                                const highlightConfig = highlightMap.get(d[labelColumn]);
                                const isHovered = hoveredLabel === d[labelColumn];
                                const showLabel = highlightConfig?.showLabel || isHovered;
                                
                                const pointColor = highlightConfig?.color || (colorScale ? colorScale(d[colorColumn]) : config.pointColor || '#4ECDC4');
                                const pointRadius = highlightConfig?.radius || config.pointRadius || 6;
                                
                                const isDimmed = hoveredLabel && !isHovered && !highlightConfig;

                                return (
                                    <g
                                        key={i}
                                        transform={`translate(${xScale(d[xColumn])}, ${yScale(d[yColumn])})`}
                                        style={{ transition: 'opacity 0.2s ease-in-out', cursor: onCategoryClick ? 'pointer' : 'default', opacity: isDimmed ? 0.3 : 1 }}
                                        onMouseMove={(e) => handleMouseMove(e, d)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => onCategoryClick?.(labelColumn, d[labelColumn])}
                                    >
                                        <circle
                                            r={pointRadius}
                                            fill={pointColor}
                                            aria-label={`${d[labelColumn]}: ${xColumn} ${d[xColumn]}, ${yColumn} ${d[yColumn]}`}
                                        />
                                        {showLabel && (
                                            <text
                                                x={pointRadius + 4}
                                                dy="0.35em"
                                                fill="currentColor"
                                                fontSize="14"
                                                className={isHovered || highlightConfig ? 'text-white' : 'text-gray-400'}
                                            >
                                                {d[labelColumn]}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                        {/* Legend */}
                        {legendItems.length > 0 && (
                             <g className="legend" transform={`translate(${width - margin.right + 20}, ${margin.top})`}>
                                {legendItems.map((item, i) => {
                                    const hasSelection = selectedCategories.length > 0;
                                    const isSelected = selectedCategories.includes(item.label);
                                    const isDimmed = hasSelection && !isSelected;

                                    return (
                                        <g 
                                            key={item.label} 
                                            transform={`translate(0, ${i * 20})`}
                                            onClick={() => onCategoryClick && colorColumn && onCategoryClick(colorColumn, item.label)}
                                            style={{ 
                                                cursor: onCategoryClick && colorColumn ? 'pointer' : 'default',
                                                opacity: isDimmed ? 0.4 : 1,
                                                transition: 'opacity 0.2s ease-in-out'
                                            }}
                                        >
                                            <rect width="15" height="15" fill={item.color} rx="3" />
                                            <text 
                                                x="22" 
                                                y="12" 
                                                fill="currentColor" 
                                                fontSize="14" 
                                                className="text-gray-300 capitalize" 
                                                textAnchor="start"
                                                style={{ fontWeight: hasSelection && isSelected ? 'bold' : 'normal' }}
                                            >
                                                {item.label}
                                            </text>
                                        </g>
                                    );
                                })}
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
                    <div className="font-bold">{tooltip.item[labelColumn]}</div>
                    <div>{config.xAxisLabel || xColumn}: {formatAxisValue(tooltip.item[xColumn], config.xAxisFormat)}</div>
                    <div>{config.yAxisLabel || yColumn}: {formatAxisValue(tooltip.item[yColumn], config.yAxisFormat)}</div>
                    {colorColumn && <div>{colorColumn}: {tooltip.item[colorColumn]}</div>}
                </div>
            )}
        </div>
    );
};

export default ScatterPlotComponent;