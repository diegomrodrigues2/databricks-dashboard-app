import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from '../../../utils/chatProtocol';

export const WIDGET_SCHEMA_DEFINITION = `
// Strict Type Definitions for Data Visualization
// The AI must strictly adhere to these interfaces when generating JSON.
// Wrap the JSON in ${WIDGET_START_TOKEN} and ${WIDGET_END_TOKEN}.

type AggregationType = 'sum' | 'avg' | 'max' | 'min' | 'count';

interface BaseWidgetConfig {
  id: string; // Must be a generated UUID
  title: string; // Concise title for the chart
  description: string; // Explanation of insights
  dataSource: string; // MUST match a valid table name found via list_tables
  gridWidth?: number; // 1 to 12 (default 12)
  gridHeight?: number; // 1 to 12 (default 6)
}

interface BarChartConfig extends BaseWidgetConfig {
  type: 'bar';
  categoryColumn: string; // Column for X-axis (categorical)
  valueColumn: string;    // Column for Y-axis (numerical)
  aggregation: AggregationType;
  color?: string;         // Hex code (e.g., "#4ECDC4")
  yAxisFormat?: 'number' | 'currency' | 'percent';
}

interface LineChartConfig extends BaseWidgetConfig {
  type: 'line';
  xColumn: string; // Time/date or numeric
  series: Array<{ key: string; name: string; color: string }>;
  xAxisType?: 'date' | 'number';
}

interface KPIConfig extends BaseWidgetConfig {
  type: 'kpi';
  dataColumn: string;
  aggregation: AggregationType;
  target?: number;
  format?: 'number' | 'currency' | 'percent';
}

interface ScatterPlotConfig extends BaseWidgetConfig {
  type: 'scatter';
  xColumn: string;
  yColumn: string;
  labelColumn: string;
  pointRadius?: number;
}

interface PieChartConfig extends BaseWidgetConfig {
  type: 'pie' | 'donut';
  categoryColumn: string;
  valueColumn: string;
  showLabels?: 'percent' | 'value' | 'none';
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface TableConfig extends BaseWidgetConfig {
  type: 'table';
  rowCategoryColumn: string;
  columns: Array<{ key: string; header: string; format?: 'number'|'currency'|'percent' }>;
  limit?: number; // Optional: limit number of rows (e.g. top 5)
  sort?: Array<SortConfig>; // Optional: sort configuration
}

interface CodeExecutorConfig extends BaseWidgetConfig {
  type: 'code-executor';
  language: 'sql' | 'python';
  code: string;
  isEditable: boolean; // default true
  autoExecute: boolean; // default false
}

type WidgetConfiguration = 
  | BarChartConfig 
  | LineChartConfig 
  | KPIConfig 
  | ScatterPlotConfig 
  | PieChartConfig 
  | TableConfig 
  | CodeExecutorConfig;
`;

export const XML_PROTOCOL_INSTRUCTIONS = `
You are an autonomous data analyst agent.

CORE PROTOCOL:
1. **THOUGHT**: Analyze the user's request in <thought> tags. Determine if you have enough info.
2. **DISCOVERY**: If you don't know the table names or schema, use discovery tools (list_catalogs -> list_schemas -> list_tables -> inspect_table).
3. **ACTION**: Execute a tool using <command tool="tool_name">JSON_PARAMS</command>.
4. **WAIT**: Immediately output <<<WAIT>>> after a command to pause and wait for the system.
5. **VISUALIZE**: Once you have data, generate a visualization using the Widget Schema (wrapped in ${WIDGET_START_TOKEN}).
6. **CONFIRM**: If the user asks to modify data (DROP, DELETE), use 'ask_user' tool to get confirmation.

Example Flow:
User: "Show me sales."
<thought>I need to find sales data. I'll list tables in the main catalog.</thought>
<command tool="list_tables">{ "catalog_name": "main", "schema_name": "default" }</command>
<<<WAIT>>>
(System returns tables)
<thought>Found 'fruit_sales'. I'll inspect it.</thought>
<command tool="inspect_table">{ "full_table_name": "main.default.fruit_sales" }</command>
<<<WAIT>>>
(System returns schema)
<thought>I have revenue and fruit columns. I will show a bar chart.</thought>
${WIDGET_START_TOKEN}
{ "type": "bar", ... }
${WIDGET_END_TOKEN}
`;
