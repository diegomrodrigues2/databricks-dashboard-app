import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { DumbbellChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface DumbbellChartComponentProps {
  config: DumbbellChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

const DumbbellChartComponent: React.FC<DumbbellChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; category: string; value1: number; value2: number; name1: string; name2: string; color1: string; color2: string; } | null>(null);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

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
        exportToCsv(data, config.id || 'dumbbell-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'dumbbell-export');
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
        const allValues = data.flatMap(d => config.points.map(p => d[p.key] as number));
        return { dataMin: d3.min(allValues) ?? 0, dataMax: d3.max(allValues) ?? 0 };
    }, [data, config.points]);

    const xScale = useMemo(() => {
        const padding = (dataMax - dataMin) * 0.1;
        return d3Scale.scaleLinear()
            .domain([dataMin - padding, dataMax + padding])
            .range([0, innerWidth])
            .nice(5);
    }, [dataMin, dataMax, innerWidth]);

    const handleMouseMove = (event: React.MouseEvent, category: string, value1: number, value2: number) => {
        setHoveredCategory(category);
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({
            x, y, category, value1, value2,
            name1: config.points[0].name,
            name2: config.points[1].name,
            color1: config.points[0].color,
            color2: config.points[1].color,
        });
    };
    
    const handleMouseLeave = () => {
        setHoveredCategory(null);
        setTooltip(null);
    };

    const point1 = config.points[0];
    const point2 = config.points[1];

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div className="pl-4">
                <h4 className="text-xl font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md text-gray-400 mb-2">{config.description}</p>
                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                    {config.points.map(p => {
                        const isClickable = onCategoryClick && config.legendFilterColumn;
                        return (
                             <div 
                                key={p.key}
                                className={`flex items-center gap-2 rounded-md p-1 ${isClickable ? 'cursor-pointer hover:bg-gray-800 transition-colors' : ''}`}
                                onClick={() => isClickable && onCategoryClick(config.legendFilterColumn!, p.name)}
                                aria-label={isClickable ? `Filter by ${p.name}`: undefined}
                            >
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></span>
                                <span className="text-sm text-gray-300">{p.name}</span>
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
                                const value1 = d[point1.key];
                                const value2 = d[point2.key];
                                const x1 = xScale(value1);
                                const x2 = xScale(value2);
                                
                                return (
                                    <g 
                                        key={category} 
                                        transform={`translate(0, ${yScale(category) ?? 0})`}
                                        style={{ transition: 'opacity 0.2s ease-in-out', cursor: onCategoryClick ? 'pointer' : 'default' }}
                                        opacity={hoveredCategory && hoveredCategory !== category ? 0.3 : 1}
                                        onMouseMove={(e) => handleMouseMove(e, category, value1, value2)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => onCategoryClick?.(config.categoryColumn, category)}
                                    >
                                        <text x={-10} dy="0.35em" textAnchor="end" fill="#9CA3AF" fontSize="14">
                                            {category}
                                        </text>
                                        
                                        <line x1={x1} x2={x2} y1={0} y2={0} stroke="#4B5563" strokeWidth={2.5} />
                                        
                                        <circle cx={x1} cy={0} r={6} fill={point1.color} />
                                        <circle cx={x2} cy={0} r={6} fill={point2.color} />
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
                    <div className="font-bold mb-1">{tooltip.category}</div>
                    <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tooltip.color1 }}></span>
                         <span>{tooltip.name1}: {formatValue(tooltip.value1)}</span>
                    </div>
                     <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tooltip.color2 }}></span>
                         <span>{tooltip.name2}: {formatValue(tooltip.value2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DumbbellChartComponent;