import { AppConfig, SessionConfig, AgentDefinition } from '../../../types';
import { getAllToolDefinitions } from '../../toolRegistry';

export function getDataSourcesContext(appConfig: AppConfig): string {
    if (!appConfig.datasources || appConfig.datasources.length === 0) {
        return "No data sources available.";
    }
    
    return appConfig.datasources.map(ds => {
        return `- Name: "${ds.name}"\n  Description: ${ds.description}`;
    }).join('\n');
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

