import { AppConfig, SessionConfig, AgentDefinition } from '../../../types';
import { getAllToolDefinitions } from '../../toolRegistry';

export function getDataSourcesContext(appConfig: AppConfig): string {
    return `
You do not have innate knowledge of all tables in the database. You must use your exploration tools to discover data.
Discovery Protocol:
1. List catalogs (list_catalogs) to see high-level organization.
2. List schemas (list_schemas) within a relevant catalog.
3. List tables (list_tables) to find specific datasets.
4. Inspect a table (inspect_table) to understand its columns and content BEFORE writing queries.
`;
}

export function getToolsContext(
    sessionConfig?: SessionConfig, 
    agent?: AgentDefinition
): string {
    const allTools = getAllToolDefinitions();
    let enabledTools = allTools;

    if (sessionConfig && sessionConfig.allowedTools) {
       enabledTools = allTools.filter(t => sessionConfig.allowedTools!.includes(t.name));
    }

    // Also respect agent's default tools if session config is absent (fallback)
    if (!sessionConfig && agent) {
        enabledTools = allTools.filter(t => agent.defaultTools.includes(t.name));
    }

    return enabledTools.map(t => {
        return `- Tool: "${t.name}"
  Description: ${t.description}
  Parameters: ${JSON.stringify(t.parameters)}
`;
    }).join('\n');
}

export const REASONING_PROTOCOL = `
REASONING PROTOCOL (ReAct Loop):
You must output a thought block <thought>...</thought> before every action.
1. Analyze the user request.
2. Decide if you need more information (schema, data, etc.).
3. Execute a tool using <command tool="...">...</command>.
4. Emit the token <<<WAIT>>> immediately after the command to stop and wait for the result.
5. When the system returns the result, analyze it in a new <thought> block and proceed.

Example:
<thought>I need to see what tables are available.</thought>
<command tool="list_catalogs">{}</command>
<<<WAIT>>>
`;
