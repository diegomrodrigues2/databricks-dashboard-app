import React, { useState, useEffect } from 'react';
import { WidgetConfig, TableChartWidgetConfig } from '../../types';
import { getDataForSource, getDashboardConfig, createDashboard, addWidgetToDashboard } from '../../services/dashboardService';
import { useSpreadsheet } from '../../hooks/useSpreadsheet';
import BarChartComponent from '../charts/BarChartComponent';
import LineChartComponent from '../charts/LineChartComponent';
import KPIComponent from '../charts/KPIComponent';
import ScatterPlotComponent from '../charts/ScatterPlotComponent';
import WaterfallChartComponent from '../charts/WaterfallChartComponent';
import TableChartComponent from '../charts/TableChartComponent';
import PieChartComponent from '../charts/PieChartComponent';
import DonutChartComponent from '../charts/DonutChartComponent';
import MarkdownComponent from '../charts/MarkdownComponent';
import GaugeChartComponent from '../charts/GaugeChartComponent';
import CodeExecutionWidget from '../widgets/CodeExecutionWidget';
import { CogIcon } from '../icons/CogIcon';

interface DynamicWidgetRendererProps {
    config: WidgetConfig;
    activeFilters?: { [key: string]: any };
    onCodeExecuted?: (code: string, result: any[]) => void;
}

export const DynamicWidgetRenderer: React.FC<DynamicWidgetRendererProps> = ({ config, activeFilters = {}, onCodeExecuted }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const { openSpreadsheet } = useSpreadsheet();

    useEffect(() => {
        // For code-executor, data fetching is handled internally or on execute
        if (!config.dataSource || config.type === 'code-executor') return;
        
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                let options = undefined;
                if (config.type === 'table') {
                    const tableConfig = config as TableChartWidgetConfig;
                    if (tableConfig.limit || tableConfig.sort) {
                        options = {
                            limit: tableConfig.limit,
                            sort: tableConfig.sort
                        };
                    }
                }
                const result = await getDataForSource(config.dataSource, options);
                setData(result);
            } catch (err) {
                setError("Failed to load data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [config.dataSource, config.type]);

    const handleSeeData = async () => {
        try {
            // Get the dashboard config to check if datasource is editable
            // NOTE: This hardcoded 'example' fallback might need adjustment based on context
            const dashboardConfig = await getDashboardConfig('example').catch(() => null);
            const dataSourceConfig = dashboardConfig?.datasources.find(ds => ds.name === config.dataSource);
            const isEditable = dataSourceConfig?.enableInlineEditing ?? false;
            
            openSpreadsheet(config.title || 'Data', data, isEditable);
        } catch (err) {
            console.error("Failed to open spreadsheet:", err);
            // Fallback: open without checking editability
            openSpreadsheet(config.title || 'Data', data, false);
        }
    };

    const handleExportToDashboard = async (dashboardId: string, newDashboardName?: string) => {
        try {
            let targetDashboardId = dashboardId;
            
            if (dashboardId === 'new' && newDashboardName) {
                const newDashboard = await createDashboard(newDashboardName);
                targetDashboardId = newDashboard.id;
            }
            
            await addWidgetToDashboard(targetDashboardId, config);
            alert('Widget added to dashboard successfully!');
        } catch (err) {
            console.error("Failed to export widget to dashboard:", err);
            alert('Failed to add widget to dashboard.');
        }
    };

    if (loading) {
        return (
            <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 animate-pulse my-2">
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-32 bg-gray-800 rounded"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border border-red-900 rounded-lg bg-red-900/10 my-2">
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }
    
    const renderChart = () => {
        const commonProps = {
             data,
             onSeeData: handleSeeData,
             onExportToDashboard: handleExportToDashboard,
             width: 400, // Fixed width for chat bubble constraint
             height: 250
        };

        switch (config.type) {
            case 'bar':
                return <BarChartComponent config={config} {...commonProps} />;
            case 'line':
                return <LineChartComponent config={config} activeFilters={activeFilters} {...commonProps} />;
            case 'scatter':
                return <ScatterPlotComponent config={config} activeFilters={activeFilters} {...commonProps} />;
            case 'waterfall':
                return <WaterfallChartComponent config={config} {...commonProps} />;
            case 'table':
                return <TableChartComponent config={config} {...commonProps} />;
            case 'pie':
                return <PieChartComponent config={config} {...commonProps} />;
            case 'donut':
                return <DonutChartComponent config={config} {...commonProps} />;
            case 'kpi':
                return <KPIComponent config={config} data={data} onSeeData={commonProps.onSeeData} />;
            case 'gauge':
                return <GaugeChartComponent config={config} {...commonProps} />;
            case 'markdown':
                return <MarkdownComponent config={config} onSeeData={commonProps.onSeeData} />;
            case 'code-executor':
                return <CodeExecutionWidget config={config} onExecute={onCodeExecuted} />;
            default:
                return (
                     <div className="p-4 border border-gray-700 rounded-lg bg-gray-900 my-2">
                        <p className="text-gray-400 text-sm">Unsupported widget type: {config.type}</p>
                        <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">Config</summary>
                            <pre className="text-[10px] text-green-400 overflow-x-auto mt-1">
                                {JSON.stringify(config, null, 2)}
                            </pre>
                        </details>
                    </div>
                );
        }
    };

    return (
        <div className="my-2 w-full max-w-full overflow-x-auto relative group">
            {/* Config Toggle Button */}
            <button
                onClick={() => setShowConfig(!showConfig)}
                className="absolute top-4 right-14 z-10 p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="See Configuration"
            >
                <CogIcon className="w-5 h-5" />
            </button>

             {renderChart()}

             {showConfig && (
                 <div className="mt-2 p-4 bg-gray-950 rounded border border-gray-800 overflow-x-auto text-xs font-mono text-green-400">
                     <pre>{JSON.stringify(config, null, 2)}</pre>
                 </div>
             )}
        </div>
    );
};

export default DynamicWidgetRenderer;
