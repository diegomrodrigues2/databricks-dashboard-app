import React, { useMemo, useRef } from 'react';
import * as d3 from 'd3-array';
import type { ChartPanelWidgetConfig, BarChartWidgetConfig, PieChartWidgetConfig, DonutChartWidgetConfig, SemicircleDonutChartWidgetConfig, GaugeChartWidgetConfig, LineChartWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';
import PieChartComponent from './PieChartComponent';
import BarChartComponent from './BarChartComponent';
import DonutChartComponent from './DonutChartComponent';
import SemicircleDonutChartComponent from './SemicircleDonutChartComponent';
import GaugeChartComponent from './GaugeChartComponent';
import LineChartComponent from './LineChartComponent';

interface ChartPanelComponentProps {
  config: ChartPanelWidgetConfig;
  data: any[];
  onCategoryClick?: (column: string, value: string) => void;
  activeFilters: { [key: string]: any };
  onSeeData: () => void;
}

const ChartPanelComponent: React.FC<ChartPanelComponentProps> = ({ config, data, onCategoryClick, activeFilters, onSeeData }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const groupedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Array.from(d3.group(data, d => d[config.panelCategoryColumn]));
    }, [data, config.panelCategoryColumn]);
    
    const handleExportCsv = () => {
        exportToCsv(data, config.id || 'chart-panel-export');
    };

    const handleExportPng = () => {
        if (chartContainerRef.current) {
            exportToPng(chartContainerRef.current, config.id || 'chart-panel-export');
        }
    };

    const { chartsPerRow = 6 } = config;
    const columnClasses = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    };
    const gridLayoutClass = columnClasses[chartsPerRow as keyof typeof columnClasses] || columnClasses[6];


    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 8}`;

    return (
        <div ref={chartContainerRef} className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
            <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} />
            <div className="text-center mb-6">
                <h4 className="text-2xl font-serif font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-lg font-serif text-gray-400">{config.description}</p>
            </div>
            <div className="flex-grow min-h-0 overflow-y-auto">
                {groupedData.length > 0 ? (
                    <div className={`grid ${gridLayoutClass} gap-6`}>
                        {groupedData.map(([category, categoryData]) => {
                            const innerChartConfig = {
                                ...config.chartConfig,
                                // These are technically not part of the inner config type, but we add them for rendering
                                id: `${config.id}-${category}`,
                                title: category,
                                description: '',
                            };

                            return (
                                <div key={category} className="bg-gray-900 rounded-lg p-2 h-72">
                                    {config.chartConfig.type === 'pie' && (
                                        <PieChartComponent 
                                            config={innerChartConfig as PieChartWidgetConfig}
                                            data={categoryData}
                                            onCategoryClick={onCategoryClick}
                                            isPanelItem={true}
                                        />
                                    )}
                                    {config.chartConfig.type === 'donut' && (
                                        <DonutChartComponent 
                                            config={innerChartConfig as DonutChartWidgetConfig}
                                            data={categoryData}
                                            onCategoryClick={onCategoryClick}
                                            isPanelItem={true}
                                        />
                                    )}
                                     {config.chartConfig.type === 'semicircle-donut' && (
                                        <SemicircleDonutChartComponent 
                                            config={innerChartConfig as SemicircleDonutChartWidgetConfig}
                                            data={categoryData}
                                            onCategoryClick={onCategoryClick}
                                            isPanelItem={true}
                                        />
                                    )}
                                    {config.chartConfig.type === 'gauge' && (
                                        <GaugeChartComponent 
                                            config={innerChartConfig as GaugeChartWidgetConfig}
                                            data={categoryData}
                                            isPanelItem={true}
                                        />
                                    )}
                                     {config.chartConfig.type === 'line' && (
                                        <LineChartComponent 
                                            config={innerChartConfig as LineChartWidgetConfig}
                                            data={categoryData}
                                            onCategoryClick={onCategoryClick}
                                            activeFilters={activeFilters}
                                            isPanelItem={true}
                                        />
                                    )}
                                    {config.chartConfig.type === 'bar' && (
                                         <BarChartComponent 
                                            config={innerChartConfig as BarChartWidgetConfig}
                                            data={categoryData}
                                            onCategoryClick={onCategoryClick}
                                            onSeeData={()=>{}}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">No data available for this panel.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartPanelComponent;