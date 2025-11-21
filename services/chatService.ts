import { Message, AgentDefinition, SessionConfig } from '../types';
import { generateSystemPrompt } from './chat/promptFactory';
import { fruitSalesDashboardConfig } from './dashboards/fruitSales';
import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from '../utils/chatProtocol';

// Environment variables (mocked for now if not present)
const DATABRICKS_ENDPOINT_URL = process.env.DATABRICKS_ENDPOINT_URL || 'https://example.cloud.databricks.com/serving-endpoints/chat-bot/invocations';
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN || 'mock-token';

export async function streamChatResponse(
  messages: Message[],
  agent: AgentDefinition | undefined,
  sessionConfig: SessionConfig | undefined,
  onChunk: (chunk: string) => void
): Promise<void> {
  // Toggle this to switch between mock and real backend
  const USE_MOCK = true;

  if (USE_MOCK) {
    await streamMockResponse(messages, onChunk);
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

    const response = await fetch(DATABRICKS_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DATABRICKS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: apiMessages,
        stream: true, // Critical for token-by-token updates
        max_tokens: 2000,
        temperature: sessionConfig?.modelTemperature || 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Databricks API Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      
      // Parse Databricks/OpenAI SSE format "data: {...}"
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.trim() === 'data: [DONE]') return;
        
        if (line.startsWith('data: ')) {
            try {
                const json = JSON.parse(line.substring(6));
                // Adjust this path based on the actual response structure from Databricks Serving
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                    onChunk(content);
                }
            } catch (e) {
                console.warn("Error parsing SSE chunk", e);
            }
        }
      }
    }
  } catch (error) {
    console.error("Error streaming chat response:", error);
    // In a real app, you might want to notify the user of the error via onChunk or a separate callback
    onChunk("\n\n*Error: Failed to connect to the data assistant.*");
  }
}

// --- Mock Implementation ---

const MOCK_DELAY_MS = 15; // Faster typing for better DX

interface MockScenario {
    steps: (string | ((lastMsg: Message) => string))[]; // Step 0: Thought+Command, Step 1: Response+Widget
}

const MOCK_SCENARIOS: MockScenario[] = [
    {
        steps: [
            // Step 1: Thought and Command
            `<thought>
The user wants to analyze mango revenue trends. 
I should first check the 'mango_revenue' table to get the quarterly data.
Then, I'll calculate the quarter-over-quarter growth to highlight significant changes.
A waterfall chart is the best visualization for showing positive and negative contributions to the total.
</thought>
<command tool="searchData">
{ "dataSource": "mango_revenue", "query": "quarterly revenue changes" }
</command>`,
            
            // Step 2: Final Response
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
            // Step 1
            `<thought>
The user is asking for a correlation analysis between sweetness and juiciness.
I need to query the 'fruit_taste_data' table which contains these metrics for all fruits.
A scatter plot is the standard tool for visualizing the relationship between two continuous variables.
I will also highlight the 'sweet and juicy' quadrant (high sweetness, high juiciness).
</thought>
<command tool="searchData">
{ "dataSource": "fruit_taste_data", "query": "sweetness and juiciness by fruit" }
</command>`,

            // Step 2
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
            // Step 1
            `<thought>
The user wants a detailed breakdown of fruit metrics (sales, price, taste).
A tabular view is most appropriate here to show multiple dimensions at once.
I will fetch data from 'fruit_taste_data' and format the columns appropriately (currency for price, number for sales).
I'll add a data bar to the sales column to make it easier to scan for high performers.
</thought>
<command tool="searchData">
{ "dataSource": "fruit_taste_data", "query": "all metrics" }
</command>`,

            // Step 2
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
            // Step 1: Ask User
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
            
            // Step 2: Handle Confirmation
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
    // New Scenario: Selection (Dynamic)
    {
        steps: [
             // Step 1
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

            // Step 2 (Dynamic)
            (lastMsg: Message) => {
                let decisionValue = 'revenue'; // default
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
                const color = isRevenue ? "#10B981" : "#8B5CF6"; // Green for money, Purple for units

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
    // New Scenario: Parameter Input (Dynamic)
    {
        steps: [
            // Step 1
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

            // Step 2 (Dynamic)
            (lastMsg: Message) => {
                let targetValue = 50000;
                try {
                    const decision = JSON.parse(lastMsg.content);
                    if (decision && decision.value) {
                        targetValue = parseInt(decision.value, 10) || 50000;
                    }
                } catch (e) { console.error(e); }

                // Cap at reasonable limits for the mock visualization
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
    // New Scenario: Code Execution (Dynamic)
    {
        steps: [
            // Step 1: Assistant proposes SQL
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

            // Step 2: Handle Execution Result
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

async function streamMockResponse(messages: Message[], onChunk: (chunk: string) => void) {
  const lastMsg = messages[messages.length - 1];
  
  // Check if the last message is a tool result (System message)
  // In our plan, we decided to use 'system' role for tool results
  const isToolResult = lastMsg.role === 'system'; // Simple heuristic for now

  let scenarioIndex;
  let stepIndex;

  if (!isToolResult) {
      // This is a new user request, pick the next scenario
      scenarioIndex = (lastScenarioIndex + 1) % MOCK_SCENARIOS.length;
      lastScenarioIndex = scenarioIndex;
      stepIndex = 0;
  } else {
      // This is a continuation (tool result), use the current scenario
      scenarioIndex = lastScenarioIndex;
      if (scenarioIndex === -1) scenarioIndex = 0; // Fallback
      stepIndex = 1;
  }

  const scenario = MOCK_SCENARIOS[scenarioIndex];
  // Ensure we don't go out of bounds if a scenario is missing a step (though all have 2)
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
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    onChunk(token);
  }
}

function splitIntoTokens(text: string): string[] {
    // improved tokenization to keep tags intact or split appropriately
    // splitting by spaces is crude but sufficient for mock visuals
    // Now that we have a smarter parser in streamParser.ts, we can be a bit looser here
    // but it helps to send tags as single tokens if possible to simulate fast generation
    return text.split(/(\s+|<[^>]+>)/).filter(Boolean);
}
