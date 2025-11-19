
import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Time from 'd3-time';
import type { LineChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface LineChartComponentProps {
  config: LineChartWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  activeFilters: { [key: string]: any };
  isPanelItem?: boolean;
  onSeeData?: () => void;
  width?: number;
  height?: number;
}

interface ProcessedLineData {
    xValue: Date | number;
    [key: string]: number | Date;
}

interface TooltipData {
    x: number;
    y: number;
    xValue: Date | number;
    series: { name: string; value: number; color: string }[];
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({ config, data, onCategoryClick, activeFilters, isPanelItem = false, onSeeData, width: propWidth, height: propHeight }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [hoveredSeriesKey, setHoveredSeriesKey] = useState<string | null>(null);

    const selectedSeries = useMemo(() => {
        const filterKey = config.seriesFilterColumn || '';
        if (!filterKey || !activeFilters[filterKey]) {
            return [];
        }
        const seriesFilterValue = activeFilters[filterKey];
        return Array.isArray(seriesFilterValue) ? seriesFilterValue : [String(seriesFilterValue)];
    }, [activeFilters, config.seriesFilterColumn]);

    const processedData: ProcessedLineData[] = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(d => {
            const xVal = d[config.xColumn];
            return {
                ...d,
                xValue: config.xAxisType === 'number' ? Number(xVal) : new Date(xVal),
            };
        }).sort((a, b) => (a.xValue as any) - (b.xValue as any));
    }, [data, config.xColumn, config.xAxisType]);
    
    const formatYValue = (value: number): string => {
        const { yAxisFormat, currencySymbol = '$', decimalPlaces = 1 } = config;
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        const formattedValue = new Intl.NumberFormat('en-US', options).format(value);
        switch (yAxisFormat) {
            case 'currency': return `${currencySymbol}${formattedValue.replace('.', ',')}`;
            case 'percent': return `${formattedValue}%`;
            case 'number': default: return formattedValue.replace('.', ',');
        }
    }

    const formatXValue = (value: Date | number) => {
        if (config.xAxisType === 'number') {
             return String(value);
        }
        return (value as Date).getFullYear();
    };
    
    const handleExportCsv = () => {
        exportToCsv(data, config.id || 'linechart-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'linechart-export');
        }
    };

    const handleSeriesClick = (seriesKey: string) => {
        if (config.seriesFilterColumn) {
            onCategoryClick?.(config.seriesFilterColumn, seriesKey);
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 4}`;
    
    if (config.facetSeries && !isPanelItem) {
        const seriesToRender = config.series;
        const numSeries = seriesToRender.length;
        const heightPerSeries = 150;
        const margin = { top: 10, right: 10, bottom: 40, left: 60 };
        const height = (heightPerSeries * numSeries) + margin.top + margin.bottom;
        const width = 800;
        const innerWidth = width - margin.left - margin.right;
        
        const xDomain = d3.extent(processedData, d => d.xValue) as [Date, Date] | [number, number];
        const xScale = (config.xAxisType === 'number'
            ? d3Scale.scaleLinear().domain(xDomain as [number, number])
            : d3Scale.scaleTime().domain(xDomain as [Date, Date])
        ).range([0, innerWidth]);
        
        const seriesMargin = { top: 25, bottom: 5 };
        const seriesInnerHeight = heightPerSeries - seriesMargin.top - seriesMargin.bottom;

        const yDomains = useMemo(() => {
            const domains = new Map<string, [number, number]>();
            seriesToRender.forEach(s => {
                const values = processedData.map(d => d[s.key] as number);
                const yExtent = d3.extent(values) as [number, number];
                domains.set(s.key, [0, (yExtent[1] || 0) * 1.1]);
            });
            return domains;
        }, [processedData, seriesToRender]);

        const yScales = useMemo(() => {
            const scales = new Map<string, d3Scale.ScaleLinear<number, number>>();
            seriesToRender.forEach(s => {
                const yDomain = yDomains.get(s.key) || [0, 1];
                scales.set(s.key, d3Scale.scaleLinear().domain(yDomain).range([seriesInnerHeight, 0]).nice(3));
            });
            return scales;
        }, [seriesToRender, yDomains, seriesInnerHeight]);

        const handleFacetMouseMove = (event: React.MouseEvent<SVGRectElement>, series: typeof config.series[0]) => {
            if (!chartContainerRef.current || processedData.length === 0) return;
            const svgRect = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
            const svgX = event.clientX - svgRect.left - margin.left;

            const hoveredX = (xScale as any).invert(svgX);
            const bisector = d3.bisector((d: ProcessedLineData) => d.xValue as any).left;
            const index = bisector(processedData, hoveredX, 1);

            const d0 = processedData[index - 1];
            const d1 = processedData[index];
            if (!d0) return;

            const d = (d1 && (hoveredX - (d0.xValue as any) > (d1.xValue as any) - hoveredX)) ? d1 : d0;
            if (!d) return;

            setHoveredSeriesKey(series.key);

            setTooltip({
                x: xScale(d.xValue as any),
                y: event.clientY - svgRect.top,
                xValue: d.xValue,
                series: [{
                    name: series.name,
                    value: d[series.key] as number,
                    color: series.color
                }]
            });
        };

        const handleFacetMouseLeave = () => {
            setTooltip(null);
            setHoveredSeriesKey(null);
        };

        return (
            <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
                {onSeeData && <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />}
                <div>
                    <h4 className="text-xl font-serif font-semibold text-white pr-8">{config.title}</h4>
                    <p className="text-md font-serif text-gray-400 mb-4">{config.description}</p>
                </div>
                <div className="flex-grow min-h-0 relative">
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                         <g transform={`translate(${margin.left},${margin.top})`}>
                            {seriesToRender.map((series, index) => {
                                const yScale = yScales.get(series.key)!;
                                const isLast = index === numSeries - 1;
                                const seriesY = index * heightPerSeries;
                                const isClickable = !!(config.seriesFilterColumn && onCategoryClick);

                                const lineGenerator = d3Shape.line<ProcessedLineData>()
                                    .x(d => xScale(d.xValue as any))
                                    .y(d => yScale(d[series.key] as number));

                                return (
                                    <g key={series.key} transform={`translate(0, ${seriesY})`}>
                                        {/* Y-Axis and Grid lines */}
                                        {yScale.ticks(3).map(tickValue => (
                                            <g key={tickValue} transform={`translate(0, ${yScale(tickValue) + seriesMargin.top})`} className="text-gray-600">
                                                <line x1={0} x2={innerWidth} stroke="currentColor" strokeWidth="0.5" />
                                                <text x="-10" dy="0.32em" textAnchor="end" fill="currentColor" fontSize="14" className="font-serif">
                                                     {formatYValue(tickValue)}
                                                </text>
                                            </g>
                                        ))}

                                        {/* Series Label */}
                                        <text x={0} y={0} dy="0.5em" fill={hoveredSeriesKey === series.key ? 'white' : series.color} fontSize="14" className="font-semibold font-serif transition-colors"
                                            onClick={() => isClickable && handleSeriesClick(series.key)}
                                            onMouseEnter={() => setHoveredSeriesKey(series.key)}
                                            onMouseLeave={() => setHoveredSeriesKey(null)}
                                            style={{ cursor: isClickable ? 'pointer' : 'default' }}>
                                            {series.name}
                                        </text>

                                        <g transform={`translate(0, ${seriesMargin.top})`}>
                                            {/* Line */}
                                            <path d={lineGenerator(processedData) || ''} fill="none" stroke={series.color} strokeWidth={hoveredSeriesKey === series.key ? (series.strokeWidth || 2) + 1 : (series.strokeWidth || 2)} className="transition-all" />
                                            
                                            {/* Bottom line of sub-chart */}
                                            <line x1={0} x2={innerWidth} y1={seriesInnerHeight} y2={seriesInnerHeight} stroke="currentColor" strokeOpacity="0.5" className="text-gray-600"/>
                                            
                                            {/* X-Axis for the last chart */}
                                            {isLast && (
                                                <g transform={`translate(0, ${seriesInnerHeight})`}>
                                                    {(xScale as any).ticks(config.xAxisType === 'number' ? 12 : undefined).map((tickValue: any) => (
                                                        <g key={String(tickValue)} transform={`translate(${xScale(tickValue as any)}, 0)`} className="text-gray-600">
                                                            <line y2="5" stroke="currentColor" strokeOpacity="0.5" />
                                                            <text y={25} textAnchor="middle" fill="currentColor" fontSize="14" className="font-serif">
                                                                {formatXValue(tickValue)}
                                                            </text>
                                                        </g>
                                                    ))}
                                                </g>
                                            )}
                                        </g>
                                        
                                        {/* Interaction layer */}
                                        <rect x={0} y={seriesMargin.top} width={innerWidth} height={seriesInnerHeight} fill="transparent"
                                            onMouseMove={(e) => handleFacetMouseMove(e, series)}
                                            onMouseLeave={handleFacetMouseLeave}
                                            onClick={() => isClickable && handleSeriesClick(series.key)}
                                            style={{ cursor: isClickable ? 'pointer' : 'default' }}
                                        />

                                        {/* Hover elements */}
                                        {tooltip && hoveredSeriesKey === series.key && (
                                            <g className="pointer-events-none" transform={`translate(0, ${seriesMargin.top})`}>
                                                <line x1={tooltip.x} x2={tooltip.x} y1={0} y2={seriesInnerHeight} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                                                <circle cx={tooltip.x} cy={yScale(tooltip.series[0].value)} r="5" fill={tooltip.series[0].color} stroke={'#111827'} strokeWidth="2"/>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                     {tooltip && (
                        <div className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-white shadow-lg pointer-events-none z-10 font-serif"
                            style={{ top: `${tooltip.y}px`, left: `${margin.left + tooltip.x + 15}px`, transform: `translateY(-50%) ${((margin.left + tooltip.x) > width / 1.5) ? 'translateX(calc(-100% - 30px))' : ''}`}}>
                            <div className="font-bold mb-2">{config.xAxisType === 'number' ? `Month: ${tooltip.xValue}` : (tooltip.xValue as Date).toLocaleString('en-US', { month: 'short', year: 'numeric' })}</div>
                             <table className="border-separate" style={{ borderSpacing: '8px 2px' }}>
                                <tbody>
                                    {tooltip.series.map(s => (
                                        <tr key={s.name}>
                                            <td className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span><span>{s.name}</span></td>
                                            <td className="text-right font-semibold pl-4">{formatYValue(s.value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // --- SINGLE CHART LOGIC ---
    const margin = isPanelItem
        ? { top: 10, right: 20, bottom: 30, left: 40 }
        : { top: 20, right: 100, bottom: 40, left: 60 };
    const width = propWidth || (isPanelItem ? 400 : 800);
    const height = propHeight || (isPanelItem ? 250 : 400);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const { yMax } = useMemo(() => {
        const allValues = processedData.flatMap(d => config.series.map(s => d[s.key] as number));
        return { yMax: d3.max(allValues) ?? 0 };
    }, [processedData, config.series]);

    const xScale = useMemo(() => {
        const xDomain = d3.extent(processedData, d => d.xValue) as [Date, Date] | [number, number];
        if (config.xAxisType === 'number') {
            return d3Scale.scaleLinear().domain(xDomain as [number, number]).range([0, innerWidth]);
        }
        return d3Scale.scaleTime().domain(xDomain as [Date, Date]).range([0, innerWidth]);
    }, [processedData, innerWidth, config.xAxisType]);

    const yScale = useMemo(() => {
        return d3Scale.scaleLinear().domain([0, yMax * 1.1]).range([innerHeight, 0]).nice();
    }, [yMax, innerHeight]);

    const lineGenerator = (seriesKey: string) => d3Shape.line<ProcessedLineData>()
        .x(d => xScale(d.xValue as any))
        .y(d => yScale(d[seriesKey] as number));

    const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
        if (!chartContainerRef.current || processedData.length === 0) return;
        const svgRect = event.currentTarget.getBoundingClientRect();
        const svgX = event.clientX - svgRect.left;
        
        const hoveredX = (xScale as any).invert(svgX);
        const bisector = d3.bisector((d: ProcessedLineData) => d.xValue as any).left;
        const index = bisector(processedData, hoveredX, 1);
        
        const d0 = processedData[index - 1];
        const d1 = processedData[index];
        if (!d0) return;
        
        const d = (d1 && (hoveredX - (d0.xValue as any) > (d1.xValue as any) - hoveredX)) ? d1 : d0;
        if (!d) return;

        setTooltip({
            x: xScale(d.xValue as any),
            y: event.clientY - svgRect.top,
            xValue: d.xValue,
            series: config.series.map(s => ({
                name: s.name, value: d[s.key] as number, color: s.color,
            })),
        });
    };

    const handleMouseLeave = () => setTooltip(null);

    const mainContainerClasses = isPanelItem
      ? 'flex flex-col h-full'
      : `${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`;
    
    return (
        <div ref={chartContainerRef} className={mainContainerClasses}>
            {!isPanelItem && onSeeData && <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />}
            <div className={isPanelItem ? 'text-center' : ''}>
              <h4 className={`font-serif font-semibold text-white pr-8 ${isPanelItem ? 'text-lg' : 'text-xl'}`}>{config.title}</h4>
              {!isPanelItem && <p className="text-md font-serif text-gray-400 mb-4">{config.description}</p>}
          </div>
            <div className="flex-grow min-h-0 relative">
                {processedData.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {yScale.ticks(isPanelItem ? 3: 5).map(tickValue => (
                                <g key={tickValue} transform={`translate(0, ${yScale(tickValue)})`} className="text-gray-600">
                                    <line x2={innerWidth} stroke="currentColor" strokeWidth="0.5" />
                                    <text x="-10" dy="0.32em" textAnchor="end" fill="currentColor" fontSize={isPanelItem ? 12 : 14} className="font-serif">
                                        {formatYValue(tickValue)}
                                    </text>
                                </g>
                            ))}
                            {(xScale as any).ticks(isPanelItem ? 4 : (config.xAxisType === 'number' ? undefined : d3Time.timeYear.every(1))).map((tickValue: any) => (
                                <g key={String(tickValue)} transform={`translate(${xScale(tickValue as any)}, ${innerHeight})`} className="text-gray-600">
                                    <line y2="5" stroke="currentColor" strokeOpacity="0.5" />
                                    <text y="25" textAnchor="middle" fill="currentColor" fontSize={isPanelItem ? 12 : 14} className="font-serif">
                                        {formatXValue(tickValue)}
                                    </text>
                                </g>
                            ))}
                            <line y1={innerHeight} y2={innerHeight} x2={innerWidth} stroke="currentColor" strokeOpacity="0.5" className="text-gray-600"/>

                            {config.series.map(s => {
                                const hasSelection = selectedSeries.length > 0;
                                const isSelected = selectedSeries.includes(s.key);
                                if (hasSelection && !isSelected) return null;
                                const isHovered = hoveredSeriesKey === s.key;
                                const isActive = isSelected || (!hasSelection && isHovered);
                                const isDimmed = !hasSelection && hoveredSeriesKey && !isHovered;
                                return (
                                    <path key={s.key} d={lineGenerator(s.key)(processedData) || ''} fill="none" stroke={s.color} strokeWidth={isActive ? 3 : (s.strokeWidth || 2)}
                                        style={{ opacity: isDimmed ? 0.3 : 1, transition: 'opacity 0.2s ease-in-out, stroke-width 0.2s ease-in-out' }}
                                    />
                                );
                            })}
                            {!isPanelItem && config.series.map(s => {
                                const lastPoint = processedData[processedData.length - 1];
                                if (!lastPoint) return null;
                                const hasSelection = selectedSeries.length > 0;
                                const isSelected = selectedSeries.includes(s.key);
                                if (hasSelection && !isSelected) return null;
                                const isHovered = hoveredSeriesKey === s.key;
                                const isActive = isSelected || isHovered;
                                return (
                                    <text key={`label-${s.key}`} x={xScale(lastPoint.xValue as any) + 8} y={yScale(lastPoint[s.key] as number)} dy="0.35em" fill={s.color} fontSize={isPanelItem ? 12 : 14}
                                        className="font-semibold font-serif" style={{ fontWeight: isActive ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                                        onMouseEnter={() => setHoveredSeriesKey(s.key)} onMouseLeave={() => setHoveredSeriesKey(null)} onClick={() => handleSeriesClick(s.key)}>
                                        {s.name}
                                    </text>
                                );
                            })}
                        </g>
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            <rect width={innerWidth} height={innerHeight} fill="transparent" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}/>
                            {config.series.map(s => (
                                <path key={`interaction-${s.key}`} d={lineGenerator(s.key)(processedData) || ''} fill="none" stroke="transparent" strokeWidth="12"
                                    style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredSeriesKey(s.key)} onMouseLeave={() => setHoveredSeriesKey(null)} onClick={() => handleSeriesClick(s.key)}
                                />
                            ))}
                        </g>
                        {tooltip && (
                            <g transform={`translate(${margin.left + tooltip.x}, ${margin.top})`} className="pointer-events-none">
                                <line y1={0} y2={innerHeight} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3,3"/>
                                {tooltip.series.map(s => {
                                    const seriesConfig = config.series.find(sc => sc.name === s.name);
                                    if (!seriesConfig) return null;
                                    const hasSelection = selectedSeries.length > 0;
                                    const isSelected = selectedSeries.includes(seriesConfig.key);
                                    if (hasSelection && !isSelected) return null;
                                    return <circle key={s.name} cx="0" cy={yScale(s.value)} r="5" fill={s.color} stroke={'#111827'} strokeWidth="2"/>
                                })}
                            </g>
                        )}
                    </svg>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No data available for this chart.</p>
                    </div>
                )}
                {tooltip && (
                    <div className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-white shadow-lg pointer-events-none z-10 font-serif"
                        style={{ top: `${tooltip.y}px`, left: `${margin.left + tooltip.x + 15}px`, transform: `translateY(-50%) ${((margin.left + tooltip.x) > width / 1.5) ? 'translateX(calc(-100% - 30px))' : ''}`}}>
                        <div className="font-bold mb-2">{config.xAxisType === 'number' ? `Month: ${tooltip.xValue}` : (tooltip.xValue as Date).toLocaleString('en-US', { month: 'short', year: 'numeric' })}</div>
                        <table className="border-separate" style={{ borderSpacing: '8px 2px' }}>
                            <tbody>
                                {tooltip.series.sort((a, b) => b.value - a.value).map(s => {
                                    const seriesConfig = config.series.find(sc => sc.name === s.name);
                                    if (!seriesConfig) return null;
                                    const hasSelection = selectedSeries.length > 0;
                                    const isSelected = selectedSeries.includes(seriesConfig.key);
                                    if (hasSelection && !isSelected) return null;
                                    return (
                                        <tr key={s.name}>
                                            <td className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span><span>{s.name}</span></td>
                                            <td className="text-right font-semibold pl-4">{formatYValue(s.value)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LineChartComponent;
