import React, { useMemo, useRef } from 'react';
import type { KPIWidgetConfig, WidgetConfig } from '../../types';
import { aggregateData } from '../../utils/d3helpers';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToCsv, exportToPng } from '../../utils/export';

interface KPIComponentProps {
  config: KPIWidgetConfig;
  data: any[];
  onWidgetClick?: (config: WidgetConfig) => void;
  onSeeData: () => void;
  onExportToDashboard?: (dashboardId: string, newDashboardName?: string) => void;
}

const KPIComponent: React.FC<KPIComponentProps> = ({ config, data, onWidgetClick, onSeeData, onExportToDashboard }) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  const mainValue = useMemo(() => {
    return aggregateData(data, config.dataColumn, config.aggregation);
  }, [data, config.dataColumn, config.aggregation]);

  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: config.decimalPlaces ?? 0,
    maximumFractionDigits: config.decimalPlaces ?? 0,
  }).format(mainValue);

  const fullValueString = `${config.prefix || ''}${formattedValue}${config.suffix || ''}`;

  const valueFontSizeClass = useMemo(() => {
      const len = fullValueString.length;
      if (len <= 8) return 'text-5xl';
      if (len <= 12) return 'text-4xl';
      if (len <= 16) return 'text-3xl';
      return 'text-2xl';
  }, [fullValueString]);

  const handleExportCsv = () => {
    exportToCsv(data, config.id || 'kpi-export');
  };

  const handleExportPng = () => {
    if (widgetRef.current) {
      exportToPng(widgetRef.current, config.id || 'kpi-export');
    }
  };

  const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 3} row-span-${config.gridHeight || 1}`;
  
  const isClickable = onWidgetClick && config.filters && config.filters.length > 0;

  return (
    <div
      ref={widgetRef}
      className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col justify-between relative transition-colors ${isClickable ? 'cursor-pointer hover:bg-gray-800' : ''}`}
      onClick={() => isClickable && onWidgetClick?.(config)}
      aria-label={isClickable ? `Filter by ${config.title}` : config.title}
    >
      <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={onSeeData} onExportToDashboard={onExportToDashboard} />
      <div>
        <h4 className="text-lg font-semibold text-white pr-8">{config.title}</h4>
        <p className="text-sm text-gray-400">{config.description}</p>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center">
        <span
          className={`${valueFontSizeClass} font-bold text-center`}
          style={{ color: config.color || 'white' }}
        >
          {config.prefix || ''}
          {formattedValue}
          {config.suffix || ''}
        </span>
        <p className="text-sm text-gray-500 mt-2">
          Target: {config.target.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default KPIComponent;