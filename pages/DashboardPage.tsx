import React, { useState, useEffect } from 'react';
import DashboardGrid from '../components/DashboardGrid';
import KPIComponent from '../components/charts/KPIComponent';
import BarChartComponent from '../components/charts/BarChartComponent';
import GroupedBarChartComponent from '../components/charts/GroupedBarChartComponent';
import LollipopChartComponent from '../components/charts/LollipopChartComponent';
import BulletChartComponent from '../components/charts/BulletChartComponent';
import DotPlotChartComponent from '../components/charts/DotPlotChartComponent';
import DumbbellChartComponent from '../components/charts/DumbbellChartComponent';
import RangePlotChartComponent from '../components/charts/RangePlotChartComponent';
import RadialBarChartComponent from '../components/charts/RadialBarChartComponent';
import WaterfallChartComponent from '../components/charts/WaterfallChartComponent';
import MatrixChartComponent from '../components/charts/MatrixChartComponent';
import TableChartComponent from '../components/charts/TableChartComponent';
import DataTableComponent from '../components/charts/DataTableComponent';
import PieChartComponent from '../components/charts/PieChartComponent';
import DonutChartComponent from '../components/charts/DonutChartComponent';
import SemicircleDonutChartComponent from '../components/charts/SemicircleDonutChartComponent';
import GaugeChartComponent from '../components/charts/GaugeChartComponent';
import ChartPanelComponent from '../components/charts/ChartPanelComponent';
import PyramidChartComponent from '../components/charts/PyramidChartComponent';
import LineChartComponent from '../components/charts/LineChartComponent';
import ScatterPlotComponent from '../components/charts/ScatterPlotComponent';
import HistogramChartComponent from '../components/charts/HistogramChartComponent';
import MarkdownComponent from '../components/charts/MarkdownComponent';
import BoxPlotChartComponent from '../components/charts/BoxPlotChartComponent';
import CandlestickChartComponent from '../components/charts/CandlestickChartComponent';
import FormComponent from '../components/charts/FormComponent';
import DashboardFilters from '../components/DashboardFilters';
import { getDashboardConfig, getDataForSource } from '../services/dashboardService';
import type { AppConfig, WidgetConfig, DashboardFilterConfig } from '../types';
import DataSourceSelector from '../components/DataSourceSelector';
import { ExclamationTriangleIcon } from '../components/icons/ExclamationTriangleIcon';
import { useSpreadsheet } from '../hooks/useSpreadsheet';

const applyWidgetFilters = (data: any[], filters: WidgetConfig['filters']) => {
    if (!filters || filters.length === 0) {
        return data;
    }
    return data.filter(row => {
        return filters.every(filter => {
            const { column, operator, value } = filter;
            const rowValue = row[column];
            switch (operator) {
                case '===': return rowValue === value;
                case '!==': return rowValue !== value;
                case '>': return rowValue > value;
                case '<': return rowValue < value;
                case '>=': return rowValue >= value;
                case '<=': return rowValue <= value;
                default: return true;
            }
        });
    });
};

const applyDashboardFilters = (data: any[], activeFilters: { [key: string]: any }, filterConfigs: DashboardFilterConfig[] = []) => {
    let filteredData = [...data];
    if (!data || data.length === 0) return [];

    for (const column in activeFilters) {
        if (Object.prototype.hasOwnProperty.call(activeFilters, column)) {
            const filterValue = activeFilters[column];
            const config = filterConfigs.find(f => f.column === column);
            if (!config) continue;

            let isFilterEmpty = false;
            if (config.type === 'daterange') {
                const { start, end } = filterValue || {};
                isFilterEmpty = !start && !end;
            } else {
                isFilterEmpty = filterValue === null || filterValue === undefined || filterValue === '' || (Array.isArray(filterValue) && filterValue.length === 0);
            }
            if (isFilterEmpty) continue;

            if (data[0] && !Object.prototype.hasOwnProperty.call(data[0], column)) {
                continue;
            }
            
            filteredData = filteredData.filter(row => {
                const rowValue = row[column];
                if (rowValue === null || rowValue === undefined) return false;

                switch (config.type) {
                    case 'multiselect':
                        return Array.isArray(filterValue) && filterValue.includes(rowValue);
                    case 'text':
                        return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());
                    case 'select':
                        return rowValue === filterValue;
                    case 'daterange': {
                        const { start, end } = filterValue as { start?: string; end?: string };
                        const rowDate = new Date(rowValue);

                        if (start) {
                            const startDate = new Date(start);
                            if (rowDate < startDate) return false;
                        }

                        if (end) {
                            const endDate = new Date(end);
                            endDate.setDate(endDate.getDate() + 1);
                            if (rowDate >= endDate) return false;
                        }
                        
                        return true;
                    }
                    default:
                        return true;
                }
            });
        }
    }
    return filteredData;
};


interface DashboardPageProps {
    dashboardId: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ dashboardId }) => {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [data, setData] = useState<{ [key: string]: any[] }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ [key: string]: any }>({});
    const { openSpreadsheet } = useSpreadsheet();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setConfig(null);
            setData({});
            setActiveFilters({});
            try {
                const dashboardConfig = await getDashboardConfig(dashboardId);
                setConfig(dashboardConfig);

                const requiredSources = [...new Set(dashboardConfig.dashboard.widgets.map(w => w.dataSource))];
                if (dashboardConfig.dashboard.filters) {
                    dashboardConfig.dashboard.filters.forEach(f => {
                        if (!requiredSources.includes(f.dataSource)) {
                            requiredSources.push(f.dataSource);
                        }
                    });
                }
                
                const dataPromises = requiredSources.map(sourceName => 
                    getDataForSource(sourceName).then(data => ({ name: sourceName, data }))
                );
                const resolvedData = await Promise.all(dataPromises);

                const dataMap = resolvedData.reduce((acc, { name, data }) => {
                    acc[name] = data;
                    return acc;
                }, {} as { [key: string]: any[] });

                setData(dataMap);

            } catch (err) {
                console.error("Failed to load dashboard data", err);
                if (err instanceof Error) {
                    setError(`Failed to load dashboard: ${err.message}`);
                } else {
                    setError("An unknown error occurred while loading the dashboard.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dashboardId]);

    const handleChartCategoryClick = (column: string, value: string) => {
        if (!config?.dashboard.filters) return;

        const filterConfig = config.dashboard.filters.find(f => f.column === column);
        if (!filterConfig) return;

        setActiveFilters(prevFilters => {
            const newFilters = { ...prevFilters };
            const currentValue = newFilters[column];

            switch (filterConfig.type) {
                case 'select':
                case 'text':
                    if (currentValue === value) {
                        delete newFilters[column];
                    } else {
                        newFilters[column] = value;
                    }
                    break;
                case 'multiselect':
                    const currentArray = (Array.isArray(currentValue) ? currentValue : []) as any[];
                    if (currentArray.includes(value)) {
                        newFilters[column] = currentArray.filter(item => item !== value);
                    } else {
                        newFilters[column] = [...currentArray, value];
                    }
                    if (newFilters[column].length === 0) {
                        delete newFilters[column];
                    }
                    break;
            }
            return newFilters;
        });
    };
    
    const handleWidgetClick = (widgetConfig: WidgetConfig) => {
        if (widgetConfig.type === 'kpi' && widgetConfig.filters?.length) {
            widgetConfig.filters.forEach(filter => {
                handleChartCategoryClick(filter.column, filter.value);
            });
        }
    };

    const handleClearFilters = () => {
        setActiveFilters({});
    };

    const handleSeeData = (title: string, data: any[], dataSourceName: string) => {
        const dataSourceConfig = config?.datasources.find(ds => ds.name === dataSourceName);
        const isEditable = dataSourceConfig?.enableInlineEditing ?? false;
        openSpreadsheet(title, data, isEditable);
    };

    const handleDataSourceSelect = (sourceName: string) => {
        const sourceData = data[sourceName];
        const dataSourceInfo = config?.datasources.find(ds => ds.name === sourceName);
        if (sourceData) {
            openSpreadsheet(`Data Source: ${dataSourceInfo?.name || sourceName}`, sourceData, dataSourceInfo?.enableInlineEditing ?? false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col justify-center items-center">
                <p className="text-gray-400">Loading Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col justify-center items-center bg-red-900/20 border border-red-500/50 rounded-lg p-8 text-center">
                <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
                <p className="text-red-300 max-w-md">{error}</p>
            </div>
        );
    }
    
    if (!config) {
        return (
            <div className="h-full flex flex-col justify-center items-center">
                <p className="text-red-400">Failed to load dashboard configuration.</p>
            </div>
        );
    }

    const hasFilters = config.dashboard.filters && config.dashboard.filters.length > 0;
    const hasDataSources = config.datasources && config.datasources.length > 0;

    return (
        <div className="h-full flex flex-col">
            {(hasFilters || hasDataSources) && (
                <div className="mb-6 flex flex-wrap gap-4 justify-between items-start">
                    <div>
                        {hasFilters && (
                            <DashboardFilters
                                config={config.dashboard.filters!}
                                data={data}
                                activeFilters={activeFilters}
                                onFilterChange={setActiveFilters}
                                onClearAllFilters={handleClearFilters}
                            />
                        )}
                    </div>
                    <div>
                        {hasDataSources && (
                            <DataSourceSelector 
                                dataSources={config.datasources}
                                onSelect={handleDataSourceSelect}
                            />
                        )}
                    </div>
                </div>
            )}
            <h1 className="text-2xl font-semibold text-gray-100 mb-4">{config.dashboard.title}</h1>
            <div className="flex-grow min-h-0">
                <DashboardGrid>
                    {config.dashboard.widgets.map((widget) => {
                        const widgetData = data[widget.dataSource] || [];
                        const dashboardFilteredData = applyDashboardFilters(widgetData, activeFilters, config.dashboard.filters);
                        const filteredData = applyWidgetFilters(dashboardFilteredData, widget.filters);
                        const seeDataHandler = () => handleSeeData(widget.title, filteredData, widget.dataSource);
                        
                        if (widget.type === 'kpi') {
                            return <KPIComponent key={widget.id} config={widget} data={filteredData} onWidgetClick={handleWidgetClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'bar') {
                            return <BarChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'grouped-bar') {
                            return <GroupedBarChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'lollipop') {
                            return <LollipopChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'bullet') {
                            return <BulletChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                         if (widget.type === 'dot-plot') {
                            return <DotPlotChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'dumbbell') {
                            return <DumbbellChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'range-plot') {
                            return <RangePlotChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                         if (widget.type === 'radial-bar') {
                            return <RadialBarChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'waterfall') {
                            return <WaterfallChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'matrix') {
                            return <MatrixChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'table') {
                            return <TableChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                         if (widget.type === 'datatable') {
                            return <DataTableComponent key={widget.id} config={widget} data={filteredData} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'pie') {
                            return <PieChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'donut') {
                            return <DonutChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'semicircle-donut') {
                            return <SemicircleDonutChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'gauge') {
                            return <GaugeChartComponent key={widget.id} config={widget} data={filteredData} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'chart-panel') {
                            return <ChartPanelComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} activeFilters={activeFilters} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'pyramid') {
                            return <PyramidChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'line') {
                            return <LineChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} activeFilters={activeFilters} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'scatter') {
                            return <ScatterPlotComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} activeFilters={activeFilters} />;
                        }
                        if (widget.type === 'histogram') {
                            return <HistogramChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'markdown') {
                            return <MarkdownComponent key={widget.id} config={widget} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'box-plot') {
                            return <BoxPlotChartComponent key={widget.id} config={widget} data={filteredData} onCategoryClick={handleChartCategoryClick} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'candlestick') {
                            return <CandlestickChartComponent key={widget.id} config={widget} data={filteredData} onSeeData={seeDataHandler} />;
                        }
                        if (widget.type === 'form') {
                            return <FormComponent key={widget.id} config={widget} />;
                        }
                        return null;
                    })}
                </DashboardGrid>
            </div>
        </div>
    );
};

export default DashboardPage;