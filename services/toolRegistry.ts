/**
 * Tool Registry for Agent Tools
 * 
 * This module defines the structure for tool definitions that the agent can use.
 * Tool implementations will be added in later phases.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
      enum?: any[];
    }>;
    required?: string[];
  };
  requiredPermissions?: string[]; // Added granular permissions support
}

/**
 * Registry of available tools for the agent
 * 
 * This registry will be used to:
 * 1. Generate function calling schemas for the LLM
 * 2. Validate tool calls from the agent
 * 3. Route tool calls to their implementations
 */
export const toolRegistry: Record<string, ToolDefinition> = {
  searchData: {
    name: 'searchData',
    description: 'Search and retrieve data from a specified data source using a query. Returns filtered data based on the query parameters.',
    parameters: {
      type: 'object',
      properties: {
        dataSource: {
          type: 'string',
          description: 'The name of the data source to query (e.g., "fruit_sales", "fruit_taste_data")',
          required: true,
        },
        query: {
          type: 'string',
          description: 'A natural language or SQL-like query describing what data to retrieve',
          required: true,
        },
        filters: {
          type: 'object',
          description: 'Optional filters to apply to the data',
          required: false,
        },
      },
      required: ['dataSource', 'query'],
    },
  },
  listTables: {
    name: 'listTables',
    description: 'List all available data sources (tables) that can be queried. Returns metadata about each data source including name and description.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

/**
 * Get all tool definitions as an array
 * Useful for generating function calling schemas for LLMs
 */
export function getAllToolDefinitions(): ToolDefinition[] {
  return Object.values(toolRegistry);
}

/**
 * Get a specific tool definition by name
 */
export function getToolDefinition(name: string): ToolDefinition | undefined {
  return toolRegistry[name];
}

/**
 * Check if a tool name exists in the registry
 */
export function hasTool(name: string): boolean {
  return name in toolRegistry;
}

