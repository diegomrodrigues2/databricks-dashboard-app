import React, { useState, useEffect } from 'react';
import { WidgetConfig } from '../../types';
import { getDataForSource, getDashboardConfig } from '../../services/dashboardService';
import { useSpreadsheet } from '../../hooks/useSpreadsheet';
import BarChartComponent from '../charts/BarChartComponent';
import LineChartComponent from '../charts/LineChartComponent';
import KPIComponent from '../charts/KPIComponent';

interface DynamicWidgetRendererProps {
    config: WidgetConfig;
    activeFilters?: { [key: string]: any };
}

export const DynamicWidgetRenderer: React.FC<DynamicWidgetRendererProps> = ({ config, activeFilters = {} }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { openSpreadsheet } = useSpreadsheet();

    useEffect(() => {
        const fetchData = async () => {
            if (!config.dataSource) return;
            
            setLoading(true);
            setError(null);
            try {
                const result = await getDataForSource(config.dataSource);
                setData(result);
            } catch (err) {
                setError("Failed to load data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [config.dataSource]);

    const handleSeeData = async () => {
        try {
            // Get the dashboard config to check if datasource is editable
            const dashboardConfig = await getDashboardConfig('example');
            const dataSourceConfig = dashboardConfig.datasources.find(ds => ds.name === config.dataSource);
            const isEditable = dataSourceConfig?.enableInlineEditing ?? false;
            
            openSpreadsheet(config.title || 'Data', data, isEditable);
        } catch (err) {
            console.error("Failed to open spreadsheet:", err);
            // Fallback: open without checking editability
            openSpreadsheet(config.title || 'Data', data, false);
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
             width: 400, // Fixed width for chat bubble constraint
             height: 250
        };

        switch (config.type) {
            case 'bar':
                return <BarChartComponent config={config} {...commonProps} />;
            case 'line':
                return <LineChartComponent config={config} activeFilters={activeFilters} {...commonProps} />;
            case 'kpi':
                return <KPIComponent config={config} data={data} onSeeData={commonProps.onSeeData} />; 
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
        <div className="my-2 w-full max-w-full overflow-x-auto">
             {renderChart()}
        </div>
    );
};

export default DynamicWidgetRenderer;
