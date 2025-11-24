import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import type { RadialBarChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface RadialBarChartComponentProps {
  config: RadialBarChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

interface AggregatedRadialData {
    category: string;
    value: number;
}

const RadialBarChartComponent: React.FC<RadialBarChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    const aggregatedData: AggregatedRadialData[] = useMemo(() => {
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
        
        const finalData: AggregatedRadialData[] = Array.from(rollup, ([category, value]) => ({ category: String(category), value: value || 0 }));
        finalData.sort((a, b) => b.value - a.value);

        return finalData;
    }, [data, config.categoryColumn, config.valueColumn, config.aggregation]);

    const chartData = useMemo(() => aggregatedData.slice(0, 8), [aggregatedData]);
    
    const formatValue = (value: number): string => {
        const { decimalPlaces = 0 } = config;
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
            useGrouping: true,
        };
        // Use 'de-DE' locale to get dot as a thousands separator, matching the image
        return new Intl.NumberFormat('de-DE', options).format(value);
    }
    
    const handleExportCsv = () => {
        // Export the full dataset, not just the displayed slice
        exportToCsv(aggregatedData, config.id || 'radial-barchart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'radial-barchart-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 5}`;

    // --- Dimensions ---
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const labelSectionWidth = 220;
    const chartSectionWidth = innerWidth - labelSectionWidth;

    const chartCenter = { x: labelSectionWidth + chartSectionWidth / 2, y: innerHeight / 2 };
    const maxRadius = Math.min(chartSectionWidth, innerHeight) / 2 - 20;
    const barThickness = 14;

    // --- Scales ---
    const maxValue = useMemo(() => d3.max(chartData, d => d.value) || 1, [chartData]);

    const angleScale = useMemo(() => {
        return d3Scale.scaleLinear()
            .domain([0, maxValue])
            .range([0, 1.5 * Math.PI]); // ~270 degrees
    }, [maxValue]);

    const radiusScale = useMemo(() => {
        const categories = chartData.map(d => d.category);
        return d3Scale.scalePoint<string>()
            .domain(categories)
            .range([maxRadius, maxRadius * 0.4]); // Outer radius for highest value
    }, [chartData, maxRadius]);

    const labelYScale = useMemo(() => {
        return d3Scale.scalePoint<string>()
            .domain(chartData.map(d => d.category))
            .range([0, innerHeight - 120]) // Distribute labels vertically
            .padding(0.8);
    }, [chartData, innerHeight]);

    // --- Colors ---
    const defaultColor = config.color || '#9CA3AF'; // A medium grey for hover
    const highlightColor = config.highlightColor || '#3B82F6'; // blue
    const otherColor = '#E5E7EB'; // light grey for non-highlighted bars

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative font-serif`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-xl font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md text-gray-400 mb-6">{config.description}</p>
            </div>
            <div className="flex-grow min-h-0">
                {chartData.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                        {/* Labels Group */}
                        <g transform={`translate(${margin.left + 20}, ${margin.top + 60})`}>
                            {chartData.map(d => {
                                const isHighlighted = d.category === config.highlightCategory || d.category === hoveredCategory;
                                return (
                                    <g
                                        key={`label-${d.category}`}
                                        transform={`translate(0, ${labelYScale(d.category)})`}
                                        onMouseEnter={() => setHoveredCategory(d.category)}
                                        onMouseLeave={() => setHoveredCategory(null)}
                                        onClick={() => onCategoryClick?.(config.categoryColumn, d.category)}
                                        style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                                    >
                                        <text
                                            x="0"
                                            dy="0.35em" textAnchor="start" fontSize="16"
                                            className={`font-medium transition-colors duration-200 ${isHighlighted ? 'fill-white' : 'fill-gray-400'}`}
                                        >
                                            {d.category}
                                        </text>
                                        <text
                                            x={labelSectionWidth - 60}
                                            dy="0.35em" textAnchor="end" fontSize="16"
                                            className={`font-mono transition-colors duration-200 ${isHighlighted ? 'fill-white font-semibold' : 'fill-gray-500'}`}
                                        >
                                            {formatValue(d.value)}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                        
                        {/* Chart Arcs Group */}
                        <g transform={`translate(${chartCenter.x}, ${chartCenter.y})`}>
                            {chartData.map(d => {
                                const isPreHighlighted = d.category === config.highlightCategory;
                                const isHovered = d.category === hoveredCategory;
                                
                                const color = isPreHighlighted ? highlightColor : (isHovered ? defaultColor : otherColor);
                                const opacity = (hoveredCategory && !isHovered) ? 0.3 : 1;
                                
                                const radius = radiusScale(d.category) as number;
                                const endAngle = angleScale(d.value) as number;

                                // Rotate the whole chart to match the image's orientation
                                const startAngle = -0.65 * Math.PI;

                                const arcGenerator = d3Shape.arc()
                                    .cornerRadius(barThickness / 2);

                                const arcData = {
                                    innerRadius: radius - barThickness / 2,
                                    outerRadius: radius + barThickness / 2,
                                    startAngle: startAngle,
                                    endAngle: startAngle + endAngle,
                                };
                                
                                return (
                                    <g
                                        key={d.category}
                                        onMouseEnter={() => setHoveredCategory(d.category)}
                                        onMouseLeave={() => setHoveredCategory(null)}
                                        onClick={() => onCategoryClick?.(config.categoryColumn, d.category)}
                                        style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                                        aria-label={`${d.category}: ${formatValue(d.value)}`}
                                    >
                                        <path
                                            d={arcGenerator(arcData) as string}
                                            fill={color}
                                            style={{ transition: 'fill 0.2s, opacity 0.2s', opacity: opacity }}
                                        />
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <p className="text-gray-500">No data available for this chart.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RadialBarChartComponent;