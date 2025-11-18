import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import type { DonutChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface DonutChartComponentProps {
  config: DonutChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  isPanelItem?: boolean;
  onSeeData?: () => void;
}

const DEFAULT_COLORS = ['#E45646', '#FBDE5C', '#FADDC9', '#4ECDC4', '#55C6A9', '#F7B801', '#A37774'];

const DonutChartComponent: React.FC<DonutChartComponentProps> = ({ config, data, onCategoryClick, isPanelItem = false, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; category: string; value: number; percent: number; } | null>(null);

    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(d => ({
            category: d[config.categoryColumn],
            value: d[config.valueColumn],
        })).sort((a,b) => b.value - a.value);
    }, [data, config.categoryColumn, config.valueColumn]);

    const totalValue = useMemo(() => d3.sum(processedData, d => d.value), [processedData]);

    const formatLabel = (value: number) => {
        const { showLabels, decimalPlaces = 0 } = config;
        if (showLabels === 'none' || totalValue === 0) return '';

        if (showLabels === 'value') {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces,
            }).format(value);
        }

        const percent = (value / totalValue) * 100;
        return `${percent.toFixed(decimalPlaces)}%`;
    };
    
    const formatCenterValue = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value);
    };

    const formatLegendPercent = (value: number) => {
        if (totalValue === 0) return '0%';
        const percent = (value / totalValue) * 100;
        return `${percent.toFixed(config.decimalPlaces ?? 0)}%`;
    };
    
    const handleExportCsv = () => {
        exportToCsv(processedData, config.id || 'donutchart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'donutchart-export');
        }
    };
    
    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 6} row-span-${config.gridHeight || 3}`;
    const hasLegend = (config.showLegend ?? true) && processedData.length > 0 && !isPanelItem;
    
    const width = 400;
    const height = 300;
    const radius = Math.min(width, height) / 2 * 0.8;
    const innerRadius = radius * (config.innerRadiusRatio || 0.6);

    const pie = useMemo(() => d3Shape.pie<any>()
        .value(d => d.value)
        .sort(null)
    , []);

    const arcLabel = useMemo(() => d3Shape.arc<d3Shape.PieArcDatum<any>>()
        .innerRadius(radius * 0.85)
        .outerRadius(radius * 0.85)
    , [radius]);
    
    const colorScale = useMemo(() => {
        const categories = processedData.map(d => d.category);
        return d3Scale.scaleOrdinal<string>()
            .domain(categories)
            .range(DEFAULT_COLORS);
    }, [processedData]);

    const getColor = (category: string) => {
        if (config.categoryColors && config.categoryColors[category]) {
            return config.categoryColors[category];
        }
        return colorScale(category);
    };

    const pieData = pie(processedData);

    const handleMouseMove = (event: React.MouseEvent, d: d3Shape.PieArcDatum<any>) => {
        setHoveredSlice(d.data.category);
        if (!chartContainerRef.current) return;

        const rect = chartContainerRef.current.getBoundingClientRect();
        setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            category: d.data.category,
            value: d.data.value,
            percent: (d.data.value / totalValue) * 100,
        });
    };
    
    const handleMouseLeave = () => {
        setHoveredSlice(null);
        setTooltip(null);
    };
    
    const mainContainerClasses = isPanelItem 
        ? 'flex flex-col h-full' 
        : `${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`;

    return (
        <div ref={chartContainerRef} className={mainContainerClasses}>
            {!isPanelItem && onSeeData && <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />}
            <div className={isPanelItem ? 'text-center' : ''}>
                <h4 className={`font-semibold text-white pr-8 ${isPanelItem ? 'text-xl mb-2' : 'text-lg'}`}>{config.title}</h4>
                {!isPanelItem && <p className="text-sm text-gray-400 mb-4">{config.description}</p>}
            </div>
            <div className="flex-grow min-h-0 flex items-center justify-center gap-6">
                {processedData.length > 0 ? (
                    <>
                        <div className="flex-1 h-full relative">
                            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                                <g transform={`translate(${width / 2}, ${height / 2})`}>
                                    {pieData.map(d => {
                                        const isHovered = hoveredSlice === d.data.category;
                                        const currentArc = d3Shape.arc<d3Shape.PieArcDatum<any>>()
                                            .innerRadius(isHovered ? innerRadius * 0.98 : innerRadius)
                                            .outerRadius(isHovered ? radius * 1.05 : radius)
                                            .cornerRadius(3);
                                        
                                        const [labelX, labelY] = arcLabel.centroid(d);
                                        const midAngleRad = (d.startAngle + d.endAngle) / 2;
                                        const rotation = (midAngleRad * 180 / Math.PI) - 90;

                                        return (
                                            <g
                                                key={d.data.category}
                                                onMouseMove={(e) => handleMouseMove(e, d)}
                                                onMouseLeave={handleMouseLeave}
                                                onClick={() => onCategoryClick?.(config.categoryColumn, d.data.category)}
                                                style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                                            >
                                                <path
                                                    d={currentArc(d) as string}
                                                    fill={getColor(d.data.category)}
                                                    stroke="#111827" // bg-gray-900
                                                    strokeWidth="2"
                                                    style={{ transition: 'all 0.2s ease-in-out' }}
                                                    aria-label={`${d.data.category}: ${d.data.value}`}
                                                />
                                                {config.showLabels !== 'none' && d.data.value > 0 &&
                                                    <text
                                                        transform={`translate(${labelX}, ${labelY}) rotate(${rotation})`}
                                                        dy="0.35em"
                                                        textAnchor="middle"
                                                        className="text-md font-bold fill-gray-900 pointer-events-none"
                                                    >
                                                        {formatLabel(d.data.value)}
                                                    </text>
                                                }
                                            </g>
                                        );
                                    })}
                                </g>
                                {/* Center Text */}
                                {!isPanelItem && (
                                    <g transform={`translate(${width / 2}, ${height / 2})`} className="pointer-events-none">
                                        <text textAnchor="middle" dy="-0.5em" className="fill-gray-300 text-3xl font-bold">
                                            {formatCenterValue(totalValue)}
                                        </text>
                                        <text textAnchor="middle" dy="1.0em" className="fill-gray-400 text-sm">
                                            {config.centerText || 'Total'}
                                        </text>
                                    </g>
                                )}
                            </svg>
                        </div>
                        {hasLegend && (
                            <div className="w-48 shrink-0 self-center max-h-[200px] overflow-y-auto pr-2">
                                <ul className="space-y-2">
                                    {processedData.map(item => {
                                        const isHovered = hoveredSlice === item.category;
                                        return (
                                            <li 
                                                key={item.category}
                                                className={`flex items-center text-sm rounded-md p-1 transition-colors ${isHovered ? 'bg-gray-800' : ''}`}
                                                onMouseEnter={() => setHoveredSlice(item.category)}
                                                onMouseLeave={() => setHoveredSlice(null)}
                                                onClick={() => onCategoryClick?.(config.categoryColumn, item.category)}
                                                style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                                            >
                                                <span 
                                                    className="w-3 h-3 rounded-full mr-3 shrink-0"
                                                    style={{ backgroundColor: getColor(item.category) }}
                                                ></span>
                                                <span className={`truncate flex-1 ${isHovered ? 'text-white' : 'text-gray-300'}`}>{item.category}</span>
                                                <span className={`ml-2 font-mono ${isHovered ? 'text-white' : 'text-gray-400'}`}>
                                                    {formatLegendPercent(item.value)}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-gray-500">No data available.</p>
                )}
            </div>
            {tooltip && (
                <div
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white shadow-lg pointer-events-none z-10"
                    style={{ top: tooltip.y + 15, left: tooltip.x, transform: 'translateX(-50%)' }}
                >
                    <div className="font-bold flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: getColor(tooltip.category)}}></span>
                        {tooltip.category}
                    </div>
                    <div>Value: {tooltip.value.toLocaleString()} ({tooltip.percent.toFixed(config.decimalPlaces ?? 0)}%)</div>
                </div>
            )}
        </div>
    );
};

export default DonutChartComponent;