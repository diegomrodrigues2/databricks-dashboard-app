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
  list_catalogs: {
    name: 'list_catalogs',
    description: 'List all available catalogs in the Unity Catalog metastore.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  list_schemas: {
    name: 'list_schemas',
    description: 'List schemas within a specific catalog.',
    parameters: {
      type: 'object',
      properties: {
        catalog_name: {
          type: 'string',
          description: 'Name of the catalog to list schemas from',
          required: true,
        },
      },
      required: ['catalog_name'],
    },
  },
  list_tables: {
    name: 'list_tables',
    description: 'List tables within a specific schema.',
    parameters: {
      type: 'object',
      properties: {
        catalog_name: {
          type: 'string',
          description: 'Name of the catalog',
          required: true,
        },
        schema_name: {
          type: 'string',
          description: 'Name of the schema',
          required: true,
        },
      },
      required: ['catalog_name', 'schema_name'],
    },
  },
  get_table_schema: {
    name: 'get_table_schema',
    description: 'Get detailed schema information (columns, types, comments) for a specific table.',
    parameters: {
      type: 'object',
      properties: {
        full_table_name: {
          type: 'string',
          description: 'Full name of the table (catalog.schema.table)',
          required: true,
        },
      },
      required: ['full_table_name'],
    },
  },
  inspect_table: {
    name: 'inspect_table',
    description: 'Get schema and a sample of data (first 5 rows) for a table. Use this to understand data content.',
    parameters: {
      type: 'object',
      properties: {
        full_table_name: {
          type: 'string',
          description: 'Full name of the table (catalog.schema.table)',
          required: true,
        },
      },
      required: ['full_table_name'],
    },
  },
  ask_user: {
    name: 'ask_user',
    description: 'Ask the user for confirmation, selection, or input. REQUIRED for destructive actions (DROP, DELETE).',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of inquiry: "confirmation", "selection", "text_input"',
          enum: ['confirmation', 'selection', 'text_input'],
          required: true,
        },
        question: {
          type: 'string',
          description: 'The question to ask the user',
          required: true,
        },
        options: {
          type: 'array',
          description: 'Options for selection type',
          required: false,
        },
      },
      required: ['type', 'question'],
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

