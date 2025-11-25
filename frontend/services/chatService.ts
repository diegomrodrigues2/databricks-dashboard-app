import { Message, AgentDefinition, SessionConfig } from '../types';
import { generateSystemPrompt } from './chat/promptFactory';
import { fruitSalesDashboardConfig } from './dashboards/fruitSales';
import { getConfig } from './api';
import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from '../utils/chatProtocol';

export async function streamChatResponse(
  messages: Message[],
  agent: AgentDefinition | undefined,
  sessionConfig: SessionConfig | undefined,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  
  let config;
  try {
      config = await getConfig();
  } catch (e) {
      console.warn("Failed to load system config, falling back to mock.");
  }

  const shouldUseRealBackend = !!config?.serving_endpoint && !!config?.has_token;

  if (!shouldUseRealBackend) {
    console.log("Using Mock Response (No Serving Endpoint configured)");
    await streamMockResponse(messages, onChunk, signal);
    return;
  }

  try {
    // Generate the system prompt based on the current dashboard configuration, agent, and session
    const systemPrompt = generateSystemPrompt(fruitSalesDashboardConfig, agent, sessionConfig);

    // Transform internal Message type to API format
    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
            role: m.role,
            content: m.content
        }))
    ];

    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: apiMessages,
        endpoint_name: config?.serving_endpoint, // Optional override
        temperature: sessionConfig?.modelTemperature || 0.7
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Backend API Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // Parse Databricks/OpenAI SSE format "data: {...}"
      // We process complete lines
      const lines = buffer.split('\n');
      
      // Keep the last line in buffer if it's incomplete (doesn't end with \n)
      // actually split removes the separator, so we check if the last char of chunk was \n
      // A safer way for SSE is to split by \n\n or \n and handle the buffer carefully.
      // Here we'll assume standard SSE double newline or single newline.
      
      buffer = lines.pop() || ""; // The last element is either empty (if ends with \n) or the partial line

      for (const line of lines) {
        if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
        
        if (line.startsWith('data: ')) {
            try {
                const jsonStr = line.substring(6);
                // Handle potential error messages from backend
                const json = JSON.parse(jsonStr);
                
                if (json.error) {
                     console.error("Backend Stream Error:", json.error);
                     onChunk(`\n\n*System Error: ${json.error}*`);
                     return;
                }

                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                    onChunk(content);
                }
            } catch (e) {
                console.warn("Error parsing SSE chunk", e, line);
            }
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
        return;
    }
    console.error("Error streaming chat response:", error);
    onChunk(`\n\n*Error: Failed to connect to the data assistant. Details: ${error.message}*`);
  }
}

// --- Mock Implementation ---

const MOCK_DELAY_MS = 15; 

interface MockScenario {
    steps: (string | ((lastMsg: Message) => string))[]; 
}

const MOCK_SCENARIOS: MockScenario[] = [
    {
        steps: [
            `<thought>
The user wants to analyze mango revenue trends. 
I should first check the 'mango_revenue' table to get the quarterly data.
Then, I'll calculate the quarter-over-quarter growth to highlight significant changes.
A waterfall chart is the best visualization for showing positive and negative contributions to the total.
</thought>
<command tool="searchData">
{ "dataSource": "mango_revenue", "query": "quarterly revenue changes" }
</command>`,
            
            `Based on the revenue data, here is the quarterly breakdown. You can see how specific quarters contributed to the total growth.

${WIDGET_START_TOKEN}
{
    "type": "waterfall",
    "dataSource": "mango_revenue",
    "title": "Mango Revenue Analysis",
    "description": "Quarterly revenue changes showing net growth.",
    "categoryColumn": "period",
    "valueColumn": "change",
    "totalCategories": ["Q1 2023", "Q1 2025"],
    "positiveColor": "#3B82F6",
    "negativeColor": "#EF4444",
    "totalColor": "#6B7280",
    "gridWidth": 12
}
${WIDGET_END_TOKEN}

Notice the dip in Q3 2023. This correlates with the seasonal supply shortage we discussed earlier.`
        ]
    },
    {
        steps: [
            `<thought>
The user is asking for a correlation analysis between sweetness and juiciness.
I need to query the 'fruit_taste_data' table which contains these metrics for all fruits.
A scatter plot is the standard tool for visualizing the relationship between two continuous variables.
I will also highlight the 'sweet and juicy' quadrant (high sweetness, high juiciness).
</thought>
<command tool="searchData">
{ "dataSource": "fruit_taste_data", "query": "sweetness and juiciness by fruit" }
</command>`,

            `I've plotted the sweetness against juiciness for all our fruits. This should help identify which fruits fit the 'sweet and juicy' profile.

${WIDGET_START_TOKEN}
{
    "type": "scatter",
    "dataSource": "fruit_taste_data",
    "title": "Taste Profile: Sweetness vs Juiciness",
    "description": "Correlation between sweetness and juiciness scores (0-10).",
    "xColumn": "sweetness",
    "yColumn": "juiciness",
    "labelColumn": "fruit",
    "pointRadius": 6,
    "xAxisLabel": "Sweetness",
    "yAxisLabel": "Juiciness",
    "gridWidth": 12
}
${WIDGET_END_TOKEN}

Mangoes and Strawberries are clearly in the top-right quadrant, indicating they are both very sweet and juicy.`
        ]
    },
    {
        steps: [
            `<thought>
The user wants a detailed breakdown of fruit metrics (sales, price, taste).
A tabular view is most appropriate here to show multiple dimensions at once.
I will fetch data from 'fruit_taste_data' and format the columns appropriately (currency for price, number for sales).
I'll add a data bar to the sales column to make it easier to scan for high performers.
</thought>
<command tool="searchData">
{ "dataSource": "fruit_taste_data", "query": "all metrics" }
</command>`,

            `Here is the detailed data table you requested, showing average sales, price, and taste metrics for each fruit.

${WIDGET_START_TOKEN}
{
    "type": "table",
    "dataSource": "fruit_taste_data",
    "title": "Detailed Fruit Metrics",
    "description": "Comprehensive view of sales and taste attributes.",
    "rowCategoryColumn": "fruit",
    "gridWidth": 12,
    "columns": [
        { "key": "avg_sales", "header": "Avg Sales", "format": "number" },
        { "key": "avg_price", "header": "Avg Price", "format": "currency", "currencySymbol": "$" },
        { "key": "sweetness", "header": "Sweetness" },
        { "key": "juiciness", "header": "Juiciness" }
    ],
    "conditionalFormatting": [
            { "column": "avg_sales", "type": "data-bar", "color": "#3B82F6" }
    ]
}
${WIDGET_END_TOKEN}

You can export this table to CSV if you need to perform further analysis in Excel.`
        ]
    },
    {
        steps: [
            `<thought>
The user wants to delete the 'fruit_sales' table. This is a destructive operation.
I must ask for explicit confirmation before proceeding.
</thought>
<command tool="ask_user">
{
  "id": "confirm-drop-table",
  "type": "confirmation",
  "question": "Are you sure you want to drop the table 'fruit_sales'?",
  "description": "This action cannot be undone. All data will be lost.",
  "options": [
    { "label": "Yes, delete it", "value": "yes", "style": "danger" },
    { "label": "Cancel", "value": "no", "style": "neutral" }
  ]
}
</command>`,
            
            `<thought>
User confirmed the deletion. Proceeding with the drop operation.
</thought>
I have successfully deleted the 'fruit_sales' table as requested.

<widget>
{
    "type": "markdown",
    "content": "### Operation Complete\\nTable **fruit_sales** has been dropped."
}
</widget>`
        ]
    },
    {
        steps: [
            `<thought>
The user wants to see the top performing fruits. I can display this data by Total Sales (Revenue) or by Quantity Sold.
I should ask the user which metric they prefer to ensure I show the most relevant data.
</thought>
<command tool="ask_user">
{
  "id": "select-metric",
  "type": "selection",
  "question": "How would you like to rank the top performers?",
  "options": [
    { "label": "By Revenue ($)", "value": "revenue", "icon": "CurrencyDollarIcon" },
    { "label": "By Quantity (Units)", "value": "quantity", "icon": "HashtagIcon" }
  ]
}
</command>`,

            (lastMsg: Message) => {
                let decisionValue = 'revenue'; 
                try {
                    const decision = JSON.parse(lastMsg.content);
                    if (decision && decision.value) {
                        decisionValue = decision.value;
                    }
                } catch (e) { console.error(e); }

                const isRevenue = decisionValue === 'revenue';
                const title = isRevenue ? "Top Fruits by Revenue" : "Top Fruits by Quantity";
                const valueColumn = isRevenue ? "total_sales" : "total_quantity";
                const format = isRevenue ? "currency" : "number";
                const currencySymbol = isRevenue ? "$" : undefined;
                const color = isRevenue ? "#10B981" : "#8B5CF6"; 

                return `<thought>
User selected to rank by ${decisionValue}. Querying data sorted by ${valueColumn}.
</thought>
Here are the top performing fruits based on **${decisionValue}**.

${WIDGET_START_TOKEN}
{
    "type": "bar",
    "dataSource": "fruit_sales",
    "title": "${title}",
    "description": "Ranking based on user selection.",
    "categoryColumn": "fruit",
    "valueColumn": "${valueColumn}",
    "aggregation": "sum",
    "color": "${color}",
    "yAxisFormat": "${format}",
    "currencySymbol": "${currencySymbol || ''}",
    "gridWidth": 12
}
${WIDGET_END_TOKEN}`;
            }
        ]
    },
    {
        steps: [
            `<thought>
The user wants to set a sales target for the dashboard gauge.
I need to know the specific target amount to configure the visualization correctly.
</thought>
<command tool="ask_user">
{
  "id": "set-target",
  "type": "text_input",
  "question": "What is your monthly sales target ($)?",
  "description": "Enter a numeric value (e.g. 50000).",
  "defaultValue": "50000"
}
</command>`,

            (lastMsg: Message) => {
                let targetValue = 50000;
                try {
                    const decision = JSON.parse(lastMsg.content);
                    if (decision && decision.value) {
                        targetValue = parseInt(decision.value, 10) || 50000;
                    }
                } catch (e) { console.error(e); }

                const maxVal = Math.max(targetValue * 1.2, 60000);

                return `<thought>
User set the target to $${targetValue.toLocaleString()}.
Configuring gauge chart with min=0, max=${maxVal}, and target=${targetValue}.
</thought>
I've updated the Sales Goal gauge with your target of **$${targetValue.toLocaleString()}**.

${WIDGET_START_TOKEN}
{
    "type": "gauge",
    "dataSource": "fruit_sales",
    "title": "Monthly Sales Goal",
    "description": "Current progress against your custom target.",
    "dataColumn": "sales",
    "aggregation": "sum",
    "minValue": 0,
    "maxValue": ${maxVal},
    "ranges": [
        { "from": 0, "to": ${targetValue * 0.6}, "color": "#EF4444", "label": "Low" },
        { "from": ${targetValue * 0.6}, "to": ${targetValue * 0.9}, "color": "#F59E0B", "label": "Warning" },
        { "from": ${targetValue * 0.9}, "to": ${maxVal}, "color": "#10B981", "label": "On Track" }
    ],
    "valueSuffix": " USD",
    "gridWidth": 12
}
${WIDGET_END_TOKEN}`;
            }
        ]
    },
    {
        steps: [
            `<thought>
The user wants to inspect the raw data for 'fruit_sales'.
I will provide a SQL query to select the top records.
I'll use the code-executor widget to allow the user to run and modify the query.
</thought>
Here is the SQL query to fetch the raw fruit sales data. You can execute it directly here.

${WIDGET_START_TOKEN}
{
    "type": "code-executor",
    "dataSource": "fruit_sales",
    "title": "Raw Fruit Sales Data",
    "description": "Execute SQL to view raw data.",
    "language": "sql",
    "code": "SELECT * FROM fruit_sales LIMIT 20",
    "isEditable": true,
    "autoExecute": false
}
${WIDGET_END_TOKEN}`,

            (lastMsg: Message) => {
                let rowCount = "some";
                try {
                    const result = JSON.parse(lastMsg.content);
                    if (result.result_preview && Array.isArray(result.result_preview)) {
                         rowCount = result.result_preview.length.toString();
                    }
                } catch (e) { }

                return `<thought>
The code execution was successful and returned ${rowCount} rows.
I should confirm this to the user.
</thought>
I see the query executed successfully and returned **${rowCount}** rows.
You can now analyze this data in the table above or modify the query to refine your results.`;
            }
        ]
    }
];

let lastScenarioIndex = -1;

async function streamMockResponse(messages: Message[], onChunk: (chunk: string) => void, signal?: AbortSignal) {
  const lastMsg = messages[messages.length - 1];
  
  const isToolResult = lastMsg.role === 'system';

  let scenarioIndex;
  let stepIndex;

  if (!isToolResult) {
      scenarioIndex = (lastScenarioIndex + 1) % MOCK_SCENARIOS.length;
      lastScenarioIndex = scenarioIndex;
      stepIndex = 0;
  } else {
      scenarioIndex = lastScenarioIndex;
      if (scenarioIndex === -1) scenarioIndex = 0; 
      stepIndex = 1;
  }

  const scenario = MOCK_SCENARIOS[scenarioIndex];
  let contentOrFn = scenario.steps[stepIndex];
  
  if (!contentOrFn) {
      contentOrFn = "Error: Missing mock step.";
  }

  let content = "";
  if (typeof contentOrFn === 'function') {
      content = contentOrFn(lastMsg);
  } else {
      content = contentOrFn;
  }
  
  const tokens = splitIntoTokens(content);

  for (const token of tokens) {
    if (signal?.aborted) return; // Stop if aborted
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    onChunk(token);
  }
}

function splitIntoTokens(text: string): string[] {
    return text.split(/(\s+|<[^>]+>)/).filter(Boolean);
}

