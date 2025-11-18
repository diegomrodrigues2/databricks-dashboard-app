

import type { AppConfig, DataTableConditionalFormattingRule } from '../../types';

// Helper to generate mock data
const generateMockData = () => {
    const layers = ['bronze', 'silver_level1', 'udp'];
    const segments = ['posicoes_equities', 'garantias_margins', 'garantias_collateral', 'posicoes_futuro', 'log_proc_cc', 'positions', 'trades_new', 'balances'];
    const data = [];
    const baseDate = new Date('2025-08-22T12:00:00.000-03:00');

    for (let i = 0; i < 150; i++) {
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const randomSecond = Math.floor(Math.random() * 60);
        const timestamp = new Date(baseDate);
        timestamp.setHours(randomHour, randomMinute, randomSecond);

        const exec_status = Math.random() > 0.1; // 90% success rate
        const num_affected_rows = Math.floor(Math.random() * 1000);
        const num_inserted_rows = exec_status ? Math.floor(Math.random() * (num_affected_rows * 0.2)) : 0;
        const num_updated_rows = exec_status ? num_affected_rows - num_inserted_rows : 0;

        const year = timestamp.getFullYear();
        const month = String(timestamp.getMonth() + 1).padStart(2, '0');
        const day = String(timestamp.getDate()).padStart(2, '0');

        data.push({
            env: 'prod',
            layer: layers[Math.floor(Math.random() * layers.length)],
            segment: segments[Math.floor(Math.random() * segments.length)],
            mode: Math.random() > 0.5 ? 'upsert' : 'versioned_upsert',
            exec_status: exec_status,
            exception: exec_status ? null : 'Error: Connection timed out',
            notes: exec_status ? 'Run completed as expected.' : 'Investigate failure.',
            num_affected_rows: num_affected_rows,
            num_inserted_rows: num_inserted_rows,
            num_updated_rows: num_updated_rows,
            num_deleted_rows: 0,
            creation_date: `${year}/${month}/${day}`,
            pipeline_run_id: crypto.randomUUID(),
            pipeline_run_timestamp: timestamp.toISOString(),
            pipeline_run_duration_seconds: Math.random() * 120,
            // Calculated fields for dashboarding
            quality_score: exec_status ? 100 : 0,
            hour: randomHour,
        });
    }
    return data;
};

const mockSinacorAuditData = generateMockData();

export const getSinacorAuditData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockSinacorAuditData);
        }, 300);
    });
};

export const sinacorAuditDashboardConfig: AppConfig = {
    name: "sinacor_audit_dashboard",
    version: "1.0.0",
    datasources: [
        {
            name: "sinacor_audit",
            description: "Pipeline execution audit logs from sinacor pipelines",
            enableInlineEditing: true,
        }
    ],
    dashboard: {
        title: "Sinacor Pipeline Audit",
        filters: [
            {
                column: 'pipeline_run_timestamp',
                label: 'Execution Date',
                type: 'daterange',
                dataSource: 'sinacor_audit'
            },
            {
                column: 'layer',
                label: 'Layer',
                type: 'multiselect',
                dataSource: 'sinacor_audit'
            },
            {
                column: 'segment',
                label: 'Segment',
                type: 'multiselect',
                dataSource: 'sinacor_audit'
            },
            {
                column: 'exec_status',
                label: 'Execution Status',
                type: 'select',
                dataSource: 'sinacor_audit'
            }
        ],
        widgets: [
            {
                id: 'welcome-markdown-sinacor',
                type: 'markdown',
                dataSource: 'sinacor_audit',
                title: 'Sinacor Pipeline Health',
                description: '',
                gridWidth: 12,
                gridHeight: 2,
                transparentBackground: true,
                content: `
# Sinacor Pipeline Health Dashboard

This dashboard monitors the real-time execution status and data quality of the Sinacor data pipelines.

- **Quality Scores**: Gauges indicate the percentage of successful pipeline runs. Red indicates a score below 90%, yellow is 90-98%, and green is above 98%.
- **Performance**: The bar chart shows the volume of pipeline runs per hour, helping identify peak processing times.
- **Interactivity**: Use the filters above to drill down into specific layers, segments, or execution statuses.
                `
            },
            {
                id: 'overall-quality-score',
                type: 'gauge',
                dataSource: 'sinacor_audit',
                title: 'Overall Quality Score',
                description: 'Percentage of successful pipeline runs across all layers and segments.',
                gridWidth: 12,
                gridHeight: 3,
                dataColumn: 'quality_score',
                aggregation: 'avg',
                minValue: 0,
                maxValue: 100,
                valueSuffix: '%',
                decimalPlaces: 2,
                ranges: [
                    { from: 0, to: 90, color: '#f87171', label: 'Critical' },
                    { from: 90, to: 98, color: '#facc15', label: 'Warning' },
                    { from: 98, to: 100, color: '#4ade80', label: 'Healthy' }
                ]
            },
            {
                id: 'quality-by-layer-panel',
                type: 'chart-panel',
                dataSource: 'sinacor_audit',
                title: 'Quality Score by Layer',
                description: 'Success rate for each data layer.',
                gridWidth: 12,
                gridHeight: 3,
                panelCategoryColumn: 'layer',
                chartsPerRow: 3,
                chartConfig: {
                    type: 'gauge',
                    dataColumn: 'quality_score',
                    aggregation: 'avg',
                    minValue: 0,
                    maxValue: 100,
                    valueSuffix: '%',
                    decimalPlaces: 1,
                    ranges: [
                        { from: 0, to: 90, color: '#f87171', label: 'Critical' },
                        { from: 90, to: 98, color: '#facc15', label: 'Warning' },
                        { from: 98, to: 100, color: '#4ade80', label: 'Healthy' }
                    ]
                }
            },
            {
                id: 'quality-by-segment-panel',
                type: 'chart-panel',
                dataSource: 'sinacor_audit',
                title: 'Quality Score by Segment',
                description: 'Success rate for each data segment.',
                gridWidth: 12,
                gridHeight: 6,
                panelCategoryColumn: 'segment',
                chartsPerRow: 4,
                chartConfig: {
                    type: 'gauge',
                    dataColumn: 'quality_score',
                    aggregation: 'avg',
                    minValue: 0,
                    maxValue: 100,
                    valueSuffix: '%',
                    decimalPlaces: 1,
                    ranges: [
                        { from: 0, to: 90, color: '#f87171', label: 'Critical' },
                        { from: 90, to: 98, color: '#facc15', label: 'Warning' },
                        { from: 98, to: 100, color: '#4ade80', label: 'Healthy' }
                    ]
                }
            },
            {
                id: 'runs-by-hour-bar',
                type: 'bar',
                dataSource: 'sinacor_audit',
                title: 'Pipeline Runs by Hour',
                description: 'Total number of pipeline executions grouped by the hour of the day.',
                gridWidth: 12,
                gridHeight: 3,
                categoryColumn: 'hour',
                valueColumn: 'pipeline_run_id',
                aggregation: 'count',
                color: '#4ECDC4',
                xAxisLabel: 'Hour of Day (UTC)',
                yAxisLabel: 'Number of Pipeline Runs',
                yAxisFormat: 'number',
                decimalPlaces: 0,
            },
             {
                id: 'sinacor-audit-log-table',
                type: 'datatable',
                dataSource: 'sinacor_audit',
                title: 'Pipeline Execution Logs',
                description: 'Detailed log of all pipeline runs. Use filters and sorting to investigate specific events.',
                gridWidth: 12,
                gridHeight: 8,
                rowKeyColumn: 'pipeline_run_id',
                pageSize: 15,
                enableGlobalSearch: true,
                columns: [
                    { key: 'pipeline_run_timestamp', header: 'Timestamp', enableSorting: true, enableFiltering: true, width: '220px' },
                    { key: 'layer', header: 'Layer', enableSorting: true, enableFiltering: true, width: '120px' },
                    { key: 'segment', header: 'Segment', enableSorting: true, enableFiltering: true, width: '180px' },
                    { 
                        key: 'exec_status', 
                        header: 'Status', 
                        enableSorting: true, 
                        enableFiltering: false, 
                        width: '100px', 
                        textAlign: 'center',
                        conditionalFormatting: [
                            { type: 'value', condition: { operator: '===', value: false }, className: 'bg-red-900/30' }
                        ]
                    },
                    { 
                        key: 'pipeline_run_duration_seconds', 
                        header: 'Duration (s)', 
                        enableSorting: true, 
                        enableFiltering: false, 
                        textAlign: 'right', 
                        width: '120px',
                        conditionalFormatting: [
                            { type: 'data-bar', color: '#60a5fa' } // blue-400
                        ]
                    },
                    { 
                        key: 'num_affected_rows', 
                        header: 'Affected Rows', 
                        enableSorting: true, 
                        enableFiltering: false, 
                        textAlign: 'right', 
                        width: '130px',
                        conditionalFormatting: [
                            { type: 'heatmap', colorScheme: 'interpolateCool', textClassName: 'text-gray-900 font-medium' }
                        ]
                    },
                    { key: 'exception', header: 'Exception', enableSorting: false, enableFiltering: true },
                ]
            },
            {
                id: 'sinacor-audit-grouped-table',
                type: 'datatable',
                dataSource: 'sinacor_audit',
                title: 'Grouped Execution Logs',
                description: 'Logs grouped by Layer and then by Segment. Summaries are calculated for each group.',
                gridWidth: 12,
                gridHeight: 8,
                rowKeyColumn: 'pipeline_run_id',
                pageSize: 50,
                enableGlobalSearch: true,
                enableSummarization: true,
                enableRowSelection: true,
                groupBy: ['layer', 'segment'],
                columns: [
                    { key: 'pipeline_run_timestamp', header: 'Timestamp', enableSorting: true, width: '220px' },
                    { key: 'exec_status', header: 'Status', enableSorting: true, textAlign: 'center' },
                    { key: 'pipeline_run_duration_seconds', header: 'Duration (s)', enableSorting: true, textAlign: 'right', aggregation: 'avg' },
                    { key: 'num_affected_rows', header: 'Affected Rows', enableSorting: true, textAlign: 'right', aggregation: 'sum' },
                    { key: 'exception', header: 'Exception', enableSorting: false, enableFiltering: true },
                ]
            },
             {
                id: 'sinacor-audit-drilldown-table',
                type: 'datatable',
                dataSource: 'sinacor_audit',
                title: 'Execution Logs with Drill-down (Chart)',
                description: 'Click the arrow on any row to see a breakdown of inserted vs. updated rows.',
                gridWidth: 12,
                gridHeight: 8,
                pageSize: 10,
                enableGlobalSearch: true,
                enableDrilldown: true,
                rowKeyColumn: 'pipeline_run_id',
                drilldown: {
                    type: 'mini-bar-chart',
                    title: 'Row Breakdown',
                    bars: [
                        { key: 'num_inserted_rows', label: 'Inserted', color: '#4ade80' },
                        { key: 'num_updated_rows', label: 'Updated', color: '#60a5fa' },
                    ]
                },
                columns: [
                    { key: 'pipeline_run_timestamp', header: 'Timestamp', enableSorting: true, width: '220px' },
                    { key: 'layer', header: 'Layer', enableSorting: true, width: '120px' },
                    { key: 'segment', header: 'Segment', enableSorting: true, width: '180px' },
                    { key: 'exec_status', header: 'Status', enableSorting: true, textAlign: 'center' },
                    { key: 'pipeline_run_duration_seconds', header: 'Duration (s)', enableSorting: true, textAlign: 'right' },
                    { key: 'num_affected_rows', header: 'Total Affected', enableSorting: true, textAlign: 'right' },
                ]
            },
            {
                id: 'sinacor-audit-editable-table',
                type: 'datatable',
                dataSource: 'sinacor_audit',
                title: 'Editable Execution Logs',
                description: 'Double-click a cell in the "Notes" column to edit its content. Press Enter to save or Escape to cancel.',
                gridWidth: 12,
                gridHeight: 8,
                rowKeyColumn: 'pipeline_run_id',
                pageSize: 15,
                enableGlobalSearch: true,
                enableInlineEditing: true,
                enableRowCreation: true,
                columns: [
                    { key: 'pipeline_run_timestamp', header: 'Timestamp', enableSorting: true, width: '220px' },
                    { key: 'layer', header: 'Layer', enableSorting: true, width: '120px' },
                    { key: 'segment', header: 'Segment', enableSorting: true, width: '180px' },
                    { 
                        key: 'exec_status', 
                        header: 'Status', 
                        enableSorting: true, 
                        textAlign: 'center',
                        conditionalFormatting: [
                            { type: 'value', condition: { operator: '===', value: false }, className: 'bg-red-900/30' }
                        ]
                    },
                    { 
                        key: 'num_affected_rows', 
                        header: 'Affected', 
                        enableSorting: true, 
                        textAlign: 'right', 
                        width: '100px',
                    },
                    { 
                        key: 'notes', 
                        header: 'Notes', 
                        enableSorting: true,
                        enableEditing: true,
                    },
                ]
            }
        ]
    }
};