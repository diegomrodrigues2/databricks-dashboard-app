import type { AppConfig } from '../../types';

const mockKpiData = [
    { id: 'BUG-001', severity: 'critical', project: 'Portal', storyPoints: 8 },
    { id: 'BUG-002', severity: 'high', project: 'API', storyPoints: 5 },
    { id: 'BUG-003', severity: 'critical', project: 'Portal', storyPoints: 8 },
    { id: 'BUG-004', severity: 'critical', project: 'Auth', storyPoints: 13 },
    { id: 'BUG-005', severity: 'medium', project: 'API', storyPoints: 3 },
    { id: 'BUG-006', severity: 'critical', project: 'Portal', storyPoints: 5 },
    { id: 'BUG-007', severity: 'low', project: 'Docs', storyPoints: 1 },
];

export const getKpiData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockKpiData);
        }, 300);
    });
};

export const projectHealthDashboardConfig: AppConfig = {
    name: "project_health_dashboard",
    version: "1.0.0",
    datasources: [
        {
            name: "project_issues",
            description: "A dataset of issues, bugs, and tasks for current projects."
        }
    ],
    dashboard: {
        title: "Project Health",
        filters: [
            {
                column: 'id',
                label: 'Issue ID',
                type: 'text',
                dataSource: 'project_issues'
            },
            {
                column: 'project',
                label: 'Project',
                type: 'select',
                dataSource: 'project_issues'
            },
            {
                column: 'severity',
                label: 'Severity',
                type: 'multiselect',
                dataSource: 'project_issues'
            }
        ],
        widgets: [
            {
                id: 'welcome-markdown',
                type: 'markdown',
                dataSource: '',
                title: 'Welcome',
                description: 'A welcome message.',
                gridWidth: 12,
                gridHeight: 2,
                transparentBackground: true,
                content: `
# Welcome to the Project Health Dashboard!

This dashboard provides a real-time overview of our ongoing projects. Here are a few things you can do:

- **Analyze KPIs**: The top row gives you a quick glance at key metrics like **critical bugs** and **total story points**.
- **Drill Down**: Click on chart elements, like a project in the "Story Points by Project" bar chart, to filter the entire dashboard.
- **Interact**: Use the filters at the top to slice and dice the data by project or issue severity.
- **Export**: Use the three-dot menu on any widget to export its data to CSV or an image (PNG).

> **Note:** This is mock data for demonstration purposes. For any questions, please contact the dashboard administrator.
                `
            },
            {
                id: 'critical-bugs',
                type: 'kpi',
                dataSource: 'project_issues',
                title: 'Critical Bugs',
                description: 'Currently open in production',
                dataColumn: 'id',
                aggregation: 'count',
                target: 5,
                color: '#FF6B6B',
                gridWidth: 3,
                gridHeight: 1,
                filters: [
                    { column: 'severity', operator: '===', value: 'critical' }
                ]
            },
            {
                id: 'total-story-points',
                type: 'kpi',
                dataSource: 'project_issues',
                title: 'Total Story Points',
                description: 'Sum of effort for all open items',
                dataColumn: 'storyPoints',
                aggregation: 'sum',
                target: 50,
                color: '#4ECDC4',
                gridWidth: 3,
                gridHeight: 1,
            },
            {
                id: 'average-effort',
                type: 'kpi',
                dataSource: 'project_issues',
                title: 'Average Effort',
                description: 'Average story points per item',
                dataColumn: 'storyPoints',
                aggregation: 'avg',
                target: 5,
                color: '#FFE66D',
                gridWidth: 3,
                gridHeight: 1,
                decimalPlaces: 1,
            },
            {
                id: 'affected-projects',
                type: 'kpi',
                dataSource: 'project_issues',
                title: 'Affected Projects',
                description: 'Number of projects with open items',
                dataColumn: 'project',
                aggregation: 'count_distinct',
                target: 3,
                color: '#55C6A9',
                gridWidth: 3,
                gridHeight: 1,
            },
            {
                id: 'story-points-by-project',
                type: 'bar',
                dataSource: 'project_issues',
                title: 'Story Points by Project',
                description: 'Total effort allocated to each project',
                categoryColumn: 'project',
                valueColumn: 'storyPoints',
                aggregation: 'sum',
                color: '#4ECDC4',
                gridWidth: 6,
                gridHeight: 2,
                xAxisLabel: 'Project',
                yAxisLabel: 'Story Points',
                yAxisFormat: 'number',
                decimalPlaces: 0,
            },
            {
                id: 'issues-by-project-severity',
                type: 'bar',
                dataSource: 'project_issues',
                title: 'Issues by Project & Severity',
                description: 'Count of issues for each project, broken down by severity level.',
                categoryColumn: 'project',
                colorCategoryColumn: 'severity',
                valueColumn: 'id', // We're counting IDs
                aggregation: 'count',
                gridWidth: 6,
                gridHeight: 2,
                xAxisLabel: 'Project',
                yAxisLabel: 'Number of Issues',
                yAxisFormat: 'number',
                decimalPlaces: 0,
            }
        ]
    }
};