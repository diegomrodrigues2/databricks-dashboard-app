import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { CandlestickChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface CandlestickChartComponentProps {
  config: CandlestickChartWidgetConfig;
  data: any[];
  onSeeData: () => void;
}

interface ProcessedCandleData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface TooltipData {
    x: number;
    y: number;
    data: ProcessedCandleData;
}

const CandlestickChartComponent: React.FC<CandlestickChartComponentProps> = ({ config, data, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);

    const processedData: ProcessedCandleData[] = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(d => ({
            date: d[config.dateColumn],
            open: +d[config.openColumn],
            high: +d[config.highColumn],
            low: +d[config.lowColumn],
            close: +d[config.closeColumn],
        }));
    }, [data, config]);
    
    const formatValue = (value: number): string => {
        const { yAxisFormat, currencySymbol = '$', decimalPlaces = 2 } = config;
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        const formattedValue = new Intl.NumberFormat('en-US', options).format(value);
        if (yAxisFormat === 'currency') {
            return `${currencySymbol}${formattedValue}`;
        }
        return formattedValue;
    }
    
    const handleExportCsv = () => {
        exportToCsv(processedData, config.id || 'candlestick-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'candlestick-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 5}`;
    
    const margin = { top: 20, right: 30, bottom: 50, left: config.yAxisLabel ? 70 : 60 };
    const width = 800; 
    const height = 450;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const dates = processedData.map(d => d.date);
    
    const xScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(dates)
            .range([0, innerWidth])
            .padding(0.3);
    }, [dates, innerWidth]);

    const { yMin, yMax } = useMemo(() => {
        if (processedData.length === 0) return { yMin: 0, yMax: 1 };
        const min = d3.min(processedData, d => d.low) ?? 0;
        const max = d3.max(processedData, d => d.high) ?? 0;
        const padding = (max - min) * 0.1;
        return { yMin: min - padding, yMax: max + padding };
    }, [processedData]);

    const yScale = useMemo(() => {
        return d3Scale.scaleLinear()
            .domain([yMin, yMax])
            .range([innerHeight, 0])
            .nice();
    }, [yMin, yMax, innerHeight]);

    const handleMouseMove = (event: React.MouseEvent, d: ProcessedCandleData) => {
        setHoveredDate(d.date);
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, data: d });
    };
    
    const handleMouseLeave = () => {
        setHoveredDate(null);
        setTooltip(null);
    };

    const upColor = config.upColor || '#A855F7'; // purple
    const downColor = config.downColor || '#F97316'; // orange

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-xl font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md text-gray-400 mt-1">{config.description}</p>
                <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div style={{width: 12, height: 12, backgroundColor: upColor}} />
                        <span className="text-sm text-gray-300">Price Up</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div style={{width: 12, height: 12, backgroundColor: downColor}} />
                        <span className="text-sm text-gray-300">Price Down</span>
                    </div>
                </div>
            </div>
            <div className="flex-grow min-h-0 mt-4">
                {processedData.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {/* Y-Axis Label */}
                            {config.yAxisLabel && (
                                <text transform={`translate(${-margin.left + 25}, ${innerHeight / 2}) rotate(-90)`} textAnchor="middle" fill="currentColor" fontSize="16" className="text-gray-300 font-medium" >
                                    {config.yAxisLabel}
                                </text>
                            )}
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
                            {dates.map((date) => (
                               <text
                                    key={`label-${date}`}
                                    x={(xScale(date) ?? 0) + xScale.bandwidth() / 2}
                                    y={innerHeight + 25}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    fontSize="14"
                                    className="text-gray-400"
                                >
                                    {date}
                                </text>
                            ))}

                            {/* Candles */}
                            {processedData.map(d => {
                                const isUp = d.close >= d.open;
                                const color = isUp ? upColor : downColor;
                                const isHovered = hoveredDate === d.date;

                                return (
                                    <g
                                        key={d.date}
                                        transform={`translate(${xScale(d.date) ?? 0}, 0)`}
                                        style={{ transition: 'opacity 0.2s', opacity: hoveredDate && !isHovered ? 0.3 : 1 }}
                                        onMouseMove={(e) => handleMouseMove(e, d)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <line
                                            x1={xScale.bandwidth() / 2} x2={xScale.bandwidth() / 2}
                                            y1={yScale(d.low)} y2={yScale(d.high)}
                                            stroke={color} strokeWidth={1.5}
                                        />
                                        <rect
                                            x={0}
                                            y={yScale(Math.max(d.open, d.close))}
                                            width={xScale.bandwidth()}
                                            height={Math.max(1, Math.abs(yScale(d.open) - yScale(d.close)))}
                                            fill={color}
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
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-white shadow-lg pointer-events-none z-10"
                    style={{ top: tooltip.y + 15, left: tooltip.x, transform: 'translateX(-50%)' }} >
                    <div className="font-bold text-base mb-2">{tooltip.data.date}</div>
                    <table className="w-full text-left">
                        <tbody>
                            <tr><td className="pr-4">Open:</td><td className="text-right">{formatValue(tooltip.data.open)}</td></tr>
                            <tr><td className="pr-4">High:</td><td className="text-right">{formatValue(tooltip.data.high)}</td></tr>
                            <tr><td className="pr-4">Low:</td><td className="text-right">{formatValue(tooltip.data.low)}</td></tr>
                            <tr><td className="pr-4">Close:</td><td className="text-right">{formatValue(tooltip.data.close)}</td></tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CandlestickChartComponent;