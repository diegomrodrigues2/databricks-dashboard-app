import { AppConfig } from '../../types';
import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from '../../utils/chatProtocol';

const WIDGET_SCHEMA_DEFINITION = `
You can render visualizations using the following JSON schema. When you want to display a chart, do not describe it in text. Instead, output a JSON block wrapped in ${WIDGET_START_TOKEN} and ${WIDGET_END_TOKEN}.

Common Properties for all widgets:
- title: string
- description: string
- gridWidth: number (1-12, default 12)
- gridHeight: number (1-12, default 5)

Supported Widget Types and their specific properties:

1. KPI Widget (type: "kpi")
   - dataColumn: string (column name)
   - aggregation: "sum" | "avg" | "max" | "min" | "count"
   - target: number (optional target value)
   - format options: prefix, suffix, decimalPlaces

2. Bar Chart (type: "bar")
   - categoryColumn: string (x-axis)
   - valueColumn: string (y-axis)
   - aggregation: "sum" | "avg" | "max" | "min" | "count"
   - color: string (hex code)

3. Line Chart (type: "line")
   - xColumn: string (time/date or numeric)
   - series: Array of { key: string, name: string, color: string }
   - xAxisType: "date" | "number"

4. Scatter Plot (type: "scatter")
   - xColumn: string
   - yColumn: string
   - labelColumn: string
   - pointRadius: number

5. Pie/Donut Chart (type: "pie" or "donut")
   - categoryColumn: string
   - valueColumn: string
   - showLabels: "percent" | "value" | "none"

6. Table (type: "table")
   - rowCategoryColumn: string
   - columns: Array of { key: string, header: string, format: "number"|"currency"|"percent" }

7. Markdown (type: "markdown")
   - content: string (markdown text)

8. Waterfall Chart (type: "waterfall")
   - categoryColumn: string
   - valueColumn: string
   - totalCategories: string[] (Array of category names that represent totals)

Example Output:
${WIDGET_START_TOKEN}
{
  "type": "bar",
  "dataSource": "fruit_sales",
  "title": "Sales by Fruit",
  "description": "Total sales revenue for each fruit type",
  "categoryColumn": "fruit",
  "valueColumn": "revenue",
  "aggregation": "sum",
  "color": "#4f46e5"
}
${WIDGET_END_TOKEN}
`;

export function generateSystemPrompt(appConfig: AppConfig): string {
  // 1. Extract Data Sources metadata
  const dataSourcesInfo = appConfig.datasources.map(ds => {
    return `- Name: "${ds.name}"\n  Description: ${ds.description}`;
  }).join('\n');

  // 2. Construct the full prompt
  return `You are an intelligent data assistant embedded in a dashboard application.
  
You have access to the following data sources:
${dataSourcesInfo}

${WIDGET_SCHEMA_DEFINITION}

When answering user queries:
1. If the user asks for a visualization, look for a relevant data source and generate a widget configuration.
2. Always specify the "dataSource" property matching one of the available source names.
3. If no visualization is needed, just reply in plain text (Markdown is supported).
4. You can provide a text explanation before or after the widget.
5. Do NOT fabricate data columns that don't logically exist in the described data sources.
`;
}

