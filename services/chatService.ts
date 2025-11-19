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
    await streamMockResponse(onChunk);
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

interface MockResponse {
    prefix: string;
    config: any; // WidgetConfig
    suffix: string;
}

const MOCK_SCENARIOS: MockResponse[] = [
    {
        prefix: "Based on the revenue data, here is the quarterly breakdown. You can see how specific quarters contributed to the total growth.\n\n",
        config: {
            type: 'waterfall',
            dataSource: 'mango_revenue',
            title: 'Mango Revenue Analysis',
            description: 'Quarterly revenue changes showing net growth.',
            categoryColumn: 'period',
            valueColumn: 'change',
            totalCategories: ['Q1 2023', 'Q1 2025'],
            positiveColor: '#3B82F6',
            negativeColor: '#EF4444',
            totalColor: '#6B7280',
            gridWidth: 12
        },
        suffix: "\n\nNotice the dip in Q3 2023. This correlates with the seasonal supply shortage we discussed earlier."
    },
    {
        prefix: "I've plotted the sweetness against juiciness for all our fruits. This should help identify which fruits fit the 'sweet and juicy' profile.\n\n",
        config: {
            type: 'scatter',
            dataSource: 'fruit_taste_data',
            title: 'Taste Profile: Sweetness vs Juiciness',
            description: 'Correlation between sweetness and juiciness scores (0-10).',
            xColumn: 'sweetness',
            yColumn: 'juiciness',
            labelColumn: 'fruit',
            pointRadius: 6,
            xAxisLabel: 'Sweetness',
            yAxisLabel: 'Juiciness',
            gridWidth: 12
        },
        suffix: "\n\nMangoes and Strawberries are clearly in the top-right quadrant, indicating they are both very sweet and juicy."
    },
    {
        prefix: "Here is the sales distribution across different regions. Asia is currently our largest market.\n\n",
        config: {
            type: 'donut',
            dataSource: 'fruit_sales_by_region',
            title: 'Global Sales Distribution',
            description: 'Breakdown of sales revenue by region.',
            categoryColumn: 'region',
            valueColumn: 'sales',
            showLabels: 'percent',
            showLegend: true,
            centerText: 'Total',
            gridWidth: 8
        },
        suffix: "\n\nWould you like to see a breakdown of the 'Asia' region specifically?"
    },
    {
        prefix: "Here is the detailed data table you requested, showing average sales, price, and taste metrics for each fruit.\n\n",
        config: {
            type: 'table',
            dataSource: 'fruit_taste_data',
            title: 'Detailed Fruit Metrics',
            description: 'Comprehensive view of sales and taste attributes.',
            rowCategoryColumn: 'fruit',
            gridWidth: 12,
            columns: [
                { key: 'avg_sales', header: 'Avg Sales', format: 'number' },
                { key: 'avg_price', header: 'Avg Price', format: 'currency', currencySymbol: '$' },
                { key: 'sweetness', header: 'Sweetness' },
                { key: 'juiciness', header: 'Juiciness' }
            ],
            conditionalFormatting: [
                 { column: 'avg_sales', type: 'data-bar', color: '#3B82F6' }
            ]
        },
        suffix: "\n\nYou can export this table to CSV if you need to perform further analysis in Excel."
    }
];

let lastScenarioIndex = -1;

async function streamMockResponse(onChunk: (chunk: string) => void) {
  // Cyclic selection to ensure we see all types
  let nextIndex = (lastScenarioIndex + 1) % MOCK_SCENARIOS.length;
  lastScenarioIndex = nextIndex;
  
  const scenario = MOCK_SCENARIOS[nextIndex];

  // 1. Stream Prefix
  const prefixTokens = splitIntoTokens(scenario.prefix);
  for (const token of prefixTokens) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    onChunk(token);
  }

  // 2. Stream Widget
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
  onChunk(WIDGET_START_TOKEN);
  
  // Stream JSON slightly faster or in larger chunks
  const jsonString = JSON.stringify(scenario.config, null, 2);
  onChunk(jsonString); // Sending whole JSON at once for simplicity in mock, or split it if needed
  
  onChunk(WIDGET_END_TOKEN);

  // 3. Stream Suffix
  const suffixTokens = splitIntoTokens(scenario.suffix);
  for (const token of suffixTokens) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    onChunk(token);
  }
}

function splitIntoTokens(text: string): string[] {
    // crude tokenization for effect
    return text.split(/(\s+)/);
}
