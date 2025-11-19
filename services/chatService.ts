import { Message } from '../types';
import { generateSystemPrompt } from './chat/promptFactory';
import { fruitSalesDashboardConfig } from './dashboards/fruitSales';
import { WIDGET_START_TOKEN, WIDGET_END_TOKEN } from '../utils/chatProtocol';

// Environment variables (mocked for now if not present)
const DATABRICKS_ENDPOINT_URL = process.env.DATABRICKS_ENDPOINT_URL || 'https://example.cloud.databricks.com/serving-endpoints/chat-bot/invocations';
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN || 'mock-token';

export async function streamChatResponse(
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<void> {
  // Toggle this to switch between mock and real backend
  const USE_MOCK = true;

  if (USE_MOCK) {
    await streamMockResponse(messages, onChunk);
    return;
  }

  try {
    // Generate the system prompt based on the current dashboard configuration
    const systemPrompt = generateSystemPrompt(fruitSalesDashboardConfig);

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
        temperature: 0.7
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
    steps: string[]; // Step 0: Thought+Command, Step 1: Response+Widget
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
  const content = scenario.steps[stepIndex] || "Error: Missing mock step.";
  
  const tokens = splitIntoTokens(content);

  for (const token of tokens) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    onChunk(token);
  }
}

function splitIntoTokens(text: string): string[] {
    // improved tokenization to keep tags intact or split appropriately
    // splitting by spaces is crude but sufficient for mock visuals
    return text.split(/(\s+|<[^>]+>)/).filter(Boolean);
}
