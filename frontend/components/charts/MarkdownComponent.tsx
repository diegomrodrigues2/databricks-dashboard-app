import React, { useMemo, useRef } from 'react';
import { marked } from 'marked';
import type { MarkdownWidgetConfig } from '../../types';
import WidgetExportDropdown from '../WidgetExportDropdown';
import { exportToPng } from '../../utils/export';

interface MarkdownComponentProps {
  config: MarkdownWidgetConfig;
  onSeeData: (title: string, data: any[]) => void;
}

const MarkdownComponent: React.FC<MarkdownComponentProps> = ({ config, onSeeData }) => {
    const widgetRef = useRef<HTMLDivElement>(null);

    const parsedMarkdown = useMemo(() => {
        if (!config.content) return '';
        return marked.parse(config.content) as string;
    }, [config.content]);

    const handleExportPng = () => {
        if (widgetRef.current) {
            exportToPng(widgetRef.current, config.id || 'markdown-export');
        }
    };
    
    const handleExportCsv = () => {
      // Intentionally empty. CSV export is not applicable for markdown.
    };

    const handleSeeData = () => {
        onSeeData(config.title, [{ markdown_content: config.content }]);
    };

    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 6} row-span-${config.gridHeight || 2}`;
    
    const containerClasses = config.transparentBackground
        ? `${gridClasses} flex flex-col relative`
        : `${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`;

    return (
        <div ref={widgetRef} className={containerClasses}>
            {!config.transparentBackground && (
                <WidgetExportDropdown onExportCsv={handleExportCsv} onExportPng={handleExportPng} onSeeData={handleSeeData} hideCsv={true} />
            )}
            <div
                className="markdown-content flex-grow overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: parsedMarkdown }}
            />
        </div>
    );
};

export default MarkdownComponent;
