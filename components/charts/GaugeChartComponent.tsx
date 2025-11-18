import React, { useMemo, useState, useRef } from 'react';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import type { GaugeChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';
import { aggregateData } from '../../utils/d3helpers';

interface GaugeChartComponentProps {
  config: GaugeChartWidgetConfig;
  data: any[];
  isPanelItem?: boolean;
  onSeeData?: () => void;
}

const GaugeChartComponent: React.FC<GaugeChartComponentProps> = ({ config, data, isPanelItem = false, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const currentValue = useMemo(() => {
        return aggregateData(data, config.dataColumn, config.aggregation);
    }, [data, config.dataColumn, config.aggregation]);

    const currentRange = useMemo(() => {
        if (!config.ranges) return null;
        return config.ranges.find((r, index) => {
            if (index === config.ranges.length - 1) {
                // Last range is inclusive on both ends
                return currentValue >= r.from && currentValue <= r.to;
            }
            return currentValue >= r.from && currentValue < r.to;
        });
    }, [currentValue, config.ranges]);

    const formattedValue = useMemo(() => {
        const { maxValue, valueSuffix, decimalPlaces = 0 } = config;
        const valueToDisplay = valueSuffix === '%'
            ? (maxValue === 0 ? 0 : (currentValue / maxValue) * 100)
            : currentValue;
        
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(valueToDisplay) + (valueSuffix || '');
    }, [currentValue, config]);
    
    const handleExportCsv = () => {
        exportToCsv([{ value: currentValue, formattedValue }], config.id || 'gauge-chart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'gauge-chart-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 3}`;
    const mainContainerClasses = isPanelItem 
        ? 'flex flex-col h-full' 
        : `${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`;

    // --- D3 and SVG constants ---
    const width = 600;
    const height = 350;
    const margin = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const radius = Math.min(chartWidth / 2, chartHeight * 1.2);
    const innerRadius = radius * 0.7;

    const angleScale = useMemo(() => {
        return d3Scale.scaleLinear()
            .domain([config.minValue, config.maxValue])
            .range([-Math.PI / 2, Math.PI / 2]);
    }, [config.minValue, config.maxValue]);

    const arcGenerator = useMemo(() => {
        return d3Shape.arc()
            .innerRadius(innerRadius)
            .outerRadius(radius)
            .cornerRadius(3);
    }, [innerRadius, radius]);

    const valueAngle = angleScale(Math.max(config.minValue, Math.min(config.maxValue, currentValue)));

    const tickCount = 5;
    const tickValues = useMemo(() => {
        return Array.from({ length: tickCount }, (_, i) => config.minValue + i * (config.maxValue - config.minValue) / (tickCount - 1));
    }, [config.minValue, config.maxValue]);

    return (
        <div ref={chartContainerRef} className={mainContainerClasses}>
            {!isPanelItem && onSeeData && <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />}
            <div className="text-center">
                <h4 className={`font-semibold text-white ${isPanelItem ? 'text-lg' : 'text-lg pr-8'}`}>{config.title}</h4>
                {!isPanelItem && config.description && <p className="text-sm text-gray-400">{config.description}</p>}
            </div>
            <div 
                className="flex-grow min-h-0"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {data.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <g transform={`translate(${width / 2}, ${height - margin.bottom})`}>
                            {/* Ranges */}
                            {config.ranges.map(range => {
                                const arcData = {
                                    startAngle: angleScale(range.from),
                                    endAngle: angleScale(range.to),
                                };
                                return <path key={range.label} d={arcGenerator(arcData as any) as string} fill={range.color} />;
                            })}
                            
                             {/* Ticks and Labels */}
                             {tickValues.map((value, i) => {
                                const angle = angleScale(value);
                                const tickLength = 5;
                                const textOffset = 20;

                                const startPoint = { x: radius * Math.sin(angle), y: -radius * Math.cos(angle) };
                                const endPoint = { x: (radius + tickLength) * Math.sin(angle), y: -(radius + tickLength) * Math.cos(angle) };
                                const textPoint = { x: (radius + textOffset) * Math.sin(angle), y: -(radius + textOffset) * Math.cos(angle) };
                                
                                const percentage = Math.round(i * 100 / (tickCount - 1));
                                return (
                                    <g key={value} className="text-gray-400">
                                        <line x1={startPoint.x} y1={startPoint.y} x2={endPoint.x} y2={endPoint.y} stroke="currentColor" strokeWidth="2" />
                                        <text x={textPoint.x} y={textPoint.y} textAnchor="middle" dy="0.35em" fontSize="14" fill="currentColor">
                                            {percentage}%
                                        </text>
                                    </g>
                                );
                            })}
                            
                            {/* Needle */}
                            <g 
                                className="transition-transform duration-500 ease-out"
                                style={{ transform: `rotate(${valueAngle * (180 / Math.PI)}deg)`}}
                            >
                               <path d={`M -5 0 L 5 0 L 0 ${-radius * 0.9} Z`} fill="black" />
                            </g>

                             {/* Pivot */}
                            <circle cx="0" cy="0" r="10" fill="black" />
                            
                            {/* Value Text */}
                            <text
                                y={-radius * 0.25}
                                textAnchor="middle"
                                className={`font-sans font-bold fill-white transition-transform duration-300 ${isPanelItem ? 'text-3xl' : 'text-4xl'}`}
                                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                            >
                                {formattedValue}
                            </text>
                            
                            {/* Hover Label */}
                            {isHovered && currentRange?.label && (
                                <text
                                    y={-radius * 0.25 + (isPanelItem ? 30 : 40)}
                                    textAnchor="middle"
                                    className={`font-sans font-semibold fill-gray-300 transition-opacity duration-300 ${isPanelItem ? 'text-base' : 'text-lg'}`}
                                    style={{ opacity: isHovered ? 1 : 0 }}
                                >
                                    {currentRange.label}
                                </text>
                            )}
                        </g>
                    </svg>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No data available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GaugeChartComponent;