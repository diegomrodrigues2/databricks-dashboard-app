import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { RangePlotWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface RangePlotChartComponentProps {
  config: RangePlotWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

const RangePlotChartComponent: React.FC<RangePlotChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; category: string; start: number; end: number; } | null>(null);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const formatValue = (value: number): string => {
        const { xAxisFormat, currencySymbol = '$', decimalPlaces = 0 } = config;
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        
        if (xAxisFormat === 'currency') {
            options.style = 'currency';
            options.currency = 'USD';
        }

        return new Intl.NumberFormat('en-US', options).format(value);
    }
    
    const handleExportCsv = () => {
        exportToCsv(data, config.id || 'range-plot-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'range-plot-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 4}`;
    
    const margin = { 
        top: 20,
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
            .padding(0.6);
    }, [categories, innerHeight]);

    const { dataMin, dataMax } = useMemo(() => {
        const allStartValues = data.map(d => d[config.rangeStartColumn] as number);
        const allEndValues = data.map(d => d[config.rangeEndColumn] as number);
        return { 
            dataMin: d3.min(allStartValues) ?? 0, 
            dataMax: d3.max(allEndValues) ?? 0 
        };
    }, [data, config.rangeStartColumn, config.rangeEndColumn]);

    const xScale = useMemo(() => {
        const padding = (dataMax - dataMin) * 0.1;
        return d3Scale.scaleLinear()
            .domain([0, dataMax + padding])
            .range([0, innerWidth])
            .nice(5);
    }, [dataMin, dataMax, innerWidth]);

    const handleMouseMove = (event: React.MouseEvent, d: any) => {
        const category = d[config.categoryColumn];
        const start = d[config.rangeStartColumn];
        const end = d[config.rangeEndColumn];
        setHoveredCategory(category);
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, category, start, end });
    };
    
    const handleMouseLeave = () => {
        setHoveredCategory(null);
        setTooltip(null);
    };

    const barColor = config.barColor || '#E5E7EB';
    const capColor = config.capColor || '#3B82F6';

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div className="pl-4">
                <h4 className="text-xl font-serif font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md font-serif text-gray-400 mb-6">{config.description}</p>
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
                                const startValue = d[config.rangeStartColumn];
                                const endValue = d[config.rangeEndColumn];
                                const x1 = xScale(startValue);
                                const x2 = xScale(endValue);
                                const yPos = yScale(category) ?? 0;
                                const barHeight = yScale.bandwidth();
                                const capHeight = barHeight * 1.5;
                                
                                return (
                                    <g 
                                        key={category} 
                                        transform={`translate(0, ${yPos})`}
                                        style={{ transition: 'opacity 0.2s ease-in-out', cursor: onCategoryClick ? 'pointer' : 'default' }}
                                        opacity={hoveredCategory && hoveredCategory !== category ? 0.3 : 1}
                                        onMouseMove={(e) => handleMouseMove(e, d)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => onCategoryClick?.(config.categoryColumn, category)}
                                    >
                                        <text x={-10} y={barHeight / 2} dy="0.35em" textAnchor="end" fill="#9CA3AF" fontSize="14">
                                            {category}
                                        </text>
                                        
                                        <rect 
                                            x={x1} 
                                            y={0} 
                                            width={x2 - x1}
                                            height={barHeight} 
                                            fill={barColor} 
                                        />

                                        {/* Start Cap */}
                                        <line 
                                            x1={x1} x2={x1}
                                            y1={-(capHeight - barHeight) / 2} 
                                            y2={barHeight + (capHeight - barHeight) / 2}
                                            stroke={capColor}
                                            strokeWidth={2.5}
                                        />

                                        {/* End Cap */}
                                        <line 
                                            x1={x2} x2={x2}
                                            y1={-(capHeight - barHeight) / 2} 
                                            y2={barHeight + (capHeight - barHeight) / 2}
                                            stroke={capColor}
                                            strokeWidth={2.5}
                                        />
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
                    <div>Price Range: {formatValue(tooltip.start)} - {formatValue(tooltip.end)}</div>
                </div>
            )}
        </div>
    );
};

export default RangePlotChartComponent;