import { AppConfig } from '../../types';
import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from '../../utils/chatProtocol';
import { getAllToolDefinitions } from '../toolRegistry';

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

9. Code Executor (type: "code-executor")
   - language: "sql" | "python" | "scala"
   - code: string (The code to run)
   - isEditable: boolean (default true)
   - autoExecute: boolean (default false)

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

const XML_PROTOCOL_INSTRUCTIONS = `
You are an agent capable of reasoning and executing tools.

Protocol for Interaction:
1. **Reasoning**: Always start by reasoning about the user's request. Wrap your thought process in <thought> tags.
2. **Tool Execution**: If you need data to answer the question, use the <command> tag with the tool name in the "tool" attribute.
3. **User Decisions**: If you need the user to confirm an action (like DROP TABLE) or select an option, use <command tool="ask_user"> with a "StructuredInquiry" JSON payload.
4. **Code Execution**: To run raw SQL or Python, use the "code-executor" widget. This allows the user to see and run the code.
5. **Response**: After gathering information, provide a final response to the user. You can mix natural language and widgets.

Example Flow (Standard):
User: "Show me the sales for mangoes."

Assistant:
<thought>
The user wants to see mango sales. I should first search for sales data specifically for mangoes to see what's available.
</thought>
<command tool="searchData">
{ "dataSource": "fruit_sales", "query": "mango sales" }
</command>

(System returns data...)

<thought>
I have the data. Now I will visualize it using a bar chart.
</thought>
Here is the sales data for mangoes:
${WIDGET_START_TOKEN}
{ ... widget config ... }
${WIDGET_END_TOKEN}

Example Flow (Confirmation):
User: "Delete the sales table."
<thought>This is destructive. I must ask for confirmation.</thought>
<command tool="ask_user">
{ "type": "confirmation", "question": "Are you sure?", "options": [...] }
</command>

Example Flow (Code Execution):
User: "Run a custom query."
<thought>I will provide a SQL editor.</thought>
${WIDGET_START_TOKEN}
{ "type": "code-executor", "language": "sql", "code": "SELECT * FROM table" }
${WIDGET_END_TOKEN}
`;

export function generateSystemPrompt(appConfig: AppConfig): string {
  // 1. Extract Data Sources metadata
  const dataSourcesInfo = appConfig.datasources.map(ds => {
    return `- Name: "${ds.name}"\n  Description: ${ds.description}`;
  }).join('\n');

  // 2. Tool Definitions
  const tools = getAllToolDefinitions();
  const toolsInfo = tools.map(t => {
    return `- Tool: "${t.name}"
  Description: ${t.description}
  Parameters: ${JSON.stringify(t.parameters)}
`;
  }).join('\n');

  // 3. Construct the full prompt
  return `You are an intelligent data assistant embedded in a dashboard application.
  
You have access to the following data sources:
${dataSourcesInfo}

You have access to the following tools:
${toolsInfo}

${XML_PROTOCOL_INSTRUCTIONS}

${WIDGET_SCHEMA_DEFINITION}

When answering user queries:
1. Use <thought> tags to plan your actions.
2. Use <command tool="tool_name">JSON_PARAMS</command> to execute tools.
3. If the user asks for a visualization, look for a relevant data source and generate a widget configuration.
4. Always specify the "dataSource" property matching one of the available source names.
5. If no visualization is needed, just reply in plain text (Markdown is supported).
6. Do NOT fabricate data columns that don't logically exist in the described data sources.
`;
}
