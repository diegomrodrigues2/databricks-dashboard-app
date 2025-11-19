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

const MOCK_DELAY_MS = 30; // Delay between chunks to simulate typing

async function streamMockResponse(onChunk: (chunk: string) => void) {
  const mockWidgetConfig = {
    type: 'bar',
    dataSource: 'total_fruit_sales',
    title: 'Fruit Sales Analysis',
    description: 'Sales breakdown by fruit type',
    categoryColumn: 'fruit',
    valueColumn: 'units_sold',
    aggregation: 'sum',
    color: '#4f46e5',
    gridWidth: 12
  };

  // The text is split into chunks to simulate streaming
  const tokens = [
    "Based ", "on ", "your ", "request, ", "I ", "have ", "analyzed ", "the ", "fruit ", "sales ", "data.\n\n",
    "Here ", "is ", "the ", "visualization ", "you ", "asked ", "for:\n\n",
    WIDGET_START_TOKEN,
    JSON.stringify(mockWidgetConfig, null, 2),
    WIDGET_END_TOKEN,
    "\n\n", "As ", "you ", "can ", "see, ", "Apples ", "and ", "Bananas ", "are ", "the ", "top ", "performers ", 
    "this ", "quarter. ", "Would ", "you ", "like ", "to ", "drill ", "down ", "into ", "regional ", "performance?"
  ];

  for (const token of tokens) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    onChunk(token);
  }
}

