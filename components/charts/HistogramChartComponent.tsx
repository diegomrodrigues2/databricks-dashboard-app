import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3-array';
import * as d3Scale from 'd3-scale';
import type { HistogramWidgetConfig, DistributionConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface HistogramChartComponentProps {
  config: HistogramWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  onSeeData: () => void;
}

interface ProcessedBinData {
    key: string;
    name: string;
    color: string;
    bins: d3.Bin<number, number>[];
}

interface TooltipData {
    x: number;
    y: number;
    data: {
        range: [number, number];
        series: { name: string; count: number; color: string }[];
    }
}

const HistogramChartComponent: React.FC<HistogramChartComponentProps> = ({ config, data, onCategoryClick, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const [activeDistributions, setActiveDistributions] = useState<string[]>(() => config.distributions.map(d => d.key));

    const { allProcessedBins, overallDomain, totalMaxFreq } = useMemo(() => {
        if (!data || data.length === 0 || !config.distributions || config.distributions.length === 0) {
            return { allProcessedBins: [], overallDomain: [0, 1] as [number, number], totalMaxFreq: 10 };
        }

        const allValues = config.distributions.flatMap(dist =>
            data.map(d => d[dist.key]).filter((v): v is number => typeof v === 'number')
        );

        if (allValues.length === 0) {
            return { allProcessedBins: [], overallDomain: [0, 1] as [number, number], totalMaxFreq: 10 };
        }

        const overallDomain = d3.extent(allValues) as [number, number];
        const binGenerator = d3.bin();
        
        if (config.binCount) {
            const thresholds = d3.ticks(overallDomain[0], overallDomain[1], config.binCount);
            binGenerator.thresholds(thresholds);
        }
        
        const allProcessedBins: ProcessedBinData[] = config.distributions.map(dist => {
            const distValues = data.map(d => d[dist.key]).filter((v): v is number => typeof v === 'number');
            return {
                key: dist.key,
                name: dist.name,
                color: dist.color,
                bins: binGenerator(distValues),
            };
        });

        const totalMaxFreq = d3.max(allProcessedBins, dist => d3.max(dist.bins, b => b.length)) || 0;

        return { allProcessedBins, overallDomain, totalMaxFreq };
    }, [data, config.distributions, config.binCount]);

    const displayedBins = useMemo(() => {
        return allProcessedBins.filter(d => activeDistributions.includes(d.key));
    }, [allProcessedBins, activeDistributions]);


    const handleLegendClick = (dist: DistributionConfig) => {
        setActiveDistributions(prev => {
            const isCurrentlyActive = prev.includes(dist.key);
            if (isCurrentlyActive) {
                const newActive = prev.filter(k => k !== dist.key);
                // If last one is deselected, show all again
                return newActive.length > 0 ? newActive : config.distributions.map(d => d.key);
            } else {
                return [...prev, dist.key];
            }
        });

        if (onCategoryClick && config.legendFilterColumn) {
            onCategoryClick(config.legendFilterColumn, dist.name);
        }
    };

    const formatXValue = (value: number): string => {
        const { xAxisFormat, currencySymbol = '$', decimalPlaces = 0 } = config;
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        };
        const formattedValue = new Intl.NumberFormat('en-US', options).format(value);
        switch (xAxisFormat) {
            case 'currency': return `${currencySymbol}${formattedValue}`;
            case 'percent': return `${formattedValue}%`;
            case 'number': default: return formattedValue;
        }
    }
    
    const handleExportCsv = () => {
        if (allProcessedBins.length === 0) return;

        const numBins = allProcessedBins[0].bins.length;
        const exportData = [];
        for (let i = 0; i < numBins; i++) {
            const row: { [key: string]: any } = {};
            const firstBin = allProcessedBins[0].bins[i];
            row['range_start'] = firstBin.x0;
            row['range_end'] = firstBin.x1;
            allProcessedBins.forEach(dist => {
                row[`frequency_${dist.name.toLowerCase().replace(' ', '_')}`] = dist.bins[i]?.length || 0;
            });
            exportData.push(row);
        }
        exportToCsv(exportData, config.id || 'histogram-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'histogram-export');
        }
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 6} row-span-${config.gridHeight || 3}`;
    
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = 600; 
    const height = 350;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = useMemo(() => {
        return d3Scale.scaleLinear()
            .domain(overallDomain)
            .range([0, innerWidth]);
    }, [overallDomain, innerWidth]);

    const yScale = useMemo(() => {
        return d3Scale.scaleLinear()
            .domain([0, totalMaxFreq === 0 ? 10 : totalMaxFreq * 1.1])
            .range([innerHeight, 0])
            .nice();
    }, [totalMaxFreq, innerHeight]);
    
    const referenceBins = useMemo(() => allProcessedBins[0]?.bins || [], [allProcessedBins]);

    const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
        if (!chartContainerRef.current || referenceBins.length === 0) return;
    
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return;
    
        const svgRect = svg.getBoundingClientRect();
        const svgX = event.clientX - svgRect.left - margin.left;
        const xValue = xScale.invert(svgX);
    
        const hoveredBinIndex = d3.bisect(referenceBins.map(b => b.x1!), xValue);
        const hoveredBin = referenceBins[hoveredBinIndex];
        
        if (!hoveredBin) {
            setTooltip(null);
            return;
        }
    
        const tooltipData = {
            range: [hoveredBin.x0!, hoveredBin.x1!] as [number, number],
            series: allProcessedBins
                .filter(dist => activeDistributions.includes(dist.key))
                .map(dist => ({
                    name: dist.name,
                    count: dist.bins[hoveredBinIndex]?.length || 0,
                    color: dist.color,
                })),
        };
    
        setTooltip({
            x: event.clientX - svgRect.left,
            y: event.clientY - svgRect.top,
            data: tooltipData
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div>
                <h4 className="text-lg font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-sm text-gray-400">{config.description}</p>
            </div>
             <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 my-2">
                {config.distributions.map(dist => {
                    const isActive = activeDistributions.includes(dist.key);
                    return (
                        <div 
                            key={dist.key} 
                            className="flex items-center gap-2 p-1 rounded-md cursor-pointer transition-all"
                            style={{ opacity: isActive ? 1 : 0.5 }}
                            onClick={() => handleLegendClick(dist)}
                            aria-label={`Toggle visibility of ${dist.name}`}
                            aria-pressed={isActive}
                        >
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dist.color }}></span>
                            <span className="text-sm text-gray-300">{dist.name}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex-grow min-h-0">
                {allProcessedBins.length > 0 ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} aria-label={config.title} preserveAspectRatio="xMidYMid meet">
                        <g transform={`translate(${margin.left},${margin.top})`}>
                            {yScale.ticks(5).map(tickValue => (
                                <g key={tickValue} transform={`translate(0, ${yScale(tickValue)})`} className="text-gray-500">
                                    <line x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" />
                                    <text x="-9" dy="0.32em" textAnchor="end" fill="currentColor" fontSize="14">{tickValue}</text>
                                </g>
                            ))}
                             <line x1="0" x2="0" y1="0" y2={innerHeight} stroke="currentColor" strokeOpacity="0.2" className="text-gray-500"/>
                            {xScale.ticks().map((tickValue) => (
                               <text key={`label-${tickValue}`} x={xScale(tickValue)} y={innerHeight + 20} textAnchor="middle" fill="currentColor" fontSize="14" className="text-gray-400">{formatXValue(tickValue)}</text>
                            ))}
                            <line y1={innerHeight} y2={innerHeight} x2={innerWidth} stroke="currentColor" strokeOpacity="0.2" className="text-gray-500"/>
                             
                            {config.xAxisLabel && (<text x={innerWidth / 2} y={innerHeight + margin.bottom - 15} textAnchor="middle" fill="currentColor" fontSize="16" className="text-gray-300 font-medium" >{config.xAxisLabel}</text>)}
                            {config.yAxisLabel && (<text transform={`translate(${-margin.left + 25}, ${innerHeight / 2}) rotate(-90)`} textAnchor="middle" fill="currentColor" fontSize="16" className="text-gray-300 font-medium" >{config.yAxisLabel}</text>)}

                             {displayedBins.map(dist => (
                                <g key={dist.key}>
                                    {dist.bins.map((bin, i) => (
                                        <rect
                                            key={i}
                                            x={xScale(bin.x0!)}
                                            y={yScale(bin.length)}
                                            width={Math.max(0, xScale(bin.x1!) - xScale(bin.x0!) - 1)}
                                            height={innerHeight - yScale(bin.length)}
                                            fill={dist.color}
                                            fillOpacity={0.6}
                                            aria-label={`${dist.name} - Range ${bin.x0}-${bin.x1}: ${bin.length} items`}
                                            className="pointer-events-none"
                                        />
                                    ))}
                                </g>
                            ))}

                            <rect x={0} y={0} width={innerWidth} height={innerHeight} fill="transparent" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="cursor-crosshair" />
                        </g>
                    </svg>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No data available for this chart.</p>
                    </div>
                )}
            </div>
            {tooltip && tooltip.data.series.length > 0 && (
                <div
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white shadow-lg pointer-events-none z-10"
                    style={{ top: tooltip.y + 15, left: tooltip.x, transform: 'translateX(-50%)' }} >
                    <div className="font-bold">Range: {formatXValue(tooltip.data.range[0])} - {formatXValue(tooltip.data.range[1])}</div>
                    <table className="mt-1">
                        <tbody>
                            {tooltip.data.series.map(s => (
                                <tr key={s.name}>
                                    <td className="flex items-center pr-2">
                                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: s.color }}></span>
                                        <span>{s.name}</span>
                                    </td>
                                    <td className="text-right font-semibold">{s.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistogramChartComponent;