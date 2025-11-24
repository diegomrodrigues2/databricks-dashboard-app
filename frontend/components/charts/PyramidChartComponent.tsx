import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { PyramidChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface PyramidChartComponentProps {
  config: PyramidChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

interface ProcessedPyramidData {
    stage: string;
    value: number;
}

const DEFAULT_COLORS = ['#FADDC9', '#F8C6AF', '#F4A28D', '#F17D6C', '#EF594C'];

const PyramidChartComponent: React.FC<PyramidChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; stage: string; value: number; color: string; } | null>(null);
    const [hoveredStage, setHoveredStage] = useState<string | null>(null);

    const processedData: ProcessedPyramidData[] = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const stageData = data.map(d => ({
            stage: d[config.stageColumn],
            value: d[config.valueColumn],
        }));
        
        stageData.sort((a, b) => b.value - a.value);
        return stageData;
    }, [data, config.stageColumn, config.valueColumn]);

    const formatValue = (value: number): string => {
        return new Intl.NumberFormat('en-US').format(value);
    };
    
    const handleExportCsv = () => {
        exportToCsv(processedData, config.id || 'pyramid-chart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'pyramid-chart-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 4}`;
    
    const margin = { top: 20, right: 180, bottom: 20, left: 180 };
    const width = 800; 
    const height = 400;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const stages = useMemo(() => processedData.map(d => d.stage), [processedData]);
    
    const yScale = useMemo(() => {
        return d3Scale.scaleBand()
            .domain(stages)
            .range([0, innerHeight])
            .paddingInner(0.1);
    }, [stages, innerHeight]);

    const maxValue = useMemo(() => d3.max(processedData, d => d.value) || 0, [processedData]);

    const xScale = useMemo(() => {
        return d3Scale.scaleLinear()
            .domain([0, maxValue])
            .range([0, innerWidth]);
    }, [maxValue, innerWidth]);

    const colorScale = useMemo(() => {
        return d3Scale.scaleOrdinal<string>()
            .domain(stages)
            .range(config.colors || DEFAULT_COLORS);
    }, [stages, config.colors]);

    const handleMouseMove = (event: React.MouseEvent, stage: string, value: number, color: string) => {
        setHoveredStage(stage);
        if (!chartContainerRef.current) return;
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTooltip({ x, y, stage, value, color });
    };
    
    const handleMouseLeave = () => {
        setHoveredStage(null);
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
                {processedData.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {processedData.map((d, i) => {
                                const topWidth = xScale(d.value);
                                const bottomValue = processedData[i + 1]?.value ?? (d.value * 0.95);
                                const bottomWidth = xScale(bottomValue);
                                
                                const y = yScale(d.stage) ?? 0;
                                const segmentHeight = yScale.bandwidth();
                                const isHovered = hoveredStage === d.stage;
                                const color = colorScale(d.stage);

                                const pathData = [
                                    `M ${(innerWidth - topWidth) / 2},${y}`,
                                    `L ${(innerWidth + topWidth) / 2},${y}`,
                                    `C ${(innerWidth + topWidth) / 2 - (topWidth - bottomWidth) * 0.15},${y + segmentHeight * 0.8}`,
                                    `  ${(innerWidth + bottomWidth) / 2 + (topWidth - bottomWidth) * 0.15},${y + segmentHeight * 0.2}`,
                                    `  ${(innerWidth + bottomWidth) / 2},${y + segmentHeight}`,
                                    `L ${(innerWidth - bottomWidth) / 2},${y + segmentHeight}`,
                                    `C ${(innerWidth - bottomWidth) / 2 + (topWidth - bottomWidth) * 0.15},${y + segmentHeight * 0.2}`,
                                    `  ${(innerWidth - topWidth) / 2 - (topWidth - bottomWidth) * 0.15},${y + segmentHeight * 0.8}`,
                                    `  ${(innerWidth - topWidth) / 2},${y}`,
                                    'Z'
                                ].join(' ');
                                
                                const segmentCenterY = y + segmentHeight / 2;
                                const textPadding = 20;

                                return (
                                    <g
                                        key={d.stage}
                                        onMouseMove={(e) => handleMouseMove(e, d.stage, d.value, color)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => onCategoryClick?.(config.stageColumn, d.stage)}
                                        style={{
                                            cursor: onCategoryClick ? 'pointer' : 'default',
                                            transition: 'opacity 0.2s ease-in-out',
                                            opacity: hoveredStage && !isHovered ? 0.6 : 1,
                                        }}
                                        aria-label={`${d.stage}: ${formatValue(d.value)}`}
                                    >
                                        <path d={pathData} fill={color} />
                                        <g className="pointer-events-none">
                                            <text
                                                x={(innerWidth - topWidth) / 2 - textPadding}
                                                y={segmentCenterY}
                                                textAnchor="end"
                                                dominantBaseline="middle"
                                                fontSize="14"
                                                fontWeight={isHovered ? "bold" : "normal"}
                                                className="fill-white transition-all"
                                            >
                                                {d.stage}
                                            </text>
                                            <text
                                                x={(innerWidth + topWidth) / 2 + textPadding}
                                                y={segmentCenterY}
                                                textAnchor="start"
                                                dominantBaseline="middle"
                                                fontSize="14"
                                                fontWeight={isHovered ? "bold" : "normal"}
                                                className="fill-white transition-all"
                                            >
                                                {formatValue(d.value)}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No data available.</p>
                    </div>
                )}
            </div>
            {tooltip && (
                <div
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white shadow-lg pointer-events-none z-10"
                    style={{ top: tooltip.y + 15, left: tooltip.x, transform: 'translateX(-50%)' }} >
                    <div className="font-bold flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: tooltip.color}}></span>
                        {tooltip.stage}
                    </div>
                    <div>Value: {formatValue(tooltip.value)}</div>
                </div>
            )}
        </div>
    );
};

export default PyramidChartComponent;