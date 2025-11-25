import { AppConfig, AgentDefinition, SessionConfig } from '../../types';
import { WIDGET_SCHEMA_DEFINITION, XML_PROTOCOL_INSTRUCTIONS } from './prompts/schemas';
import { getAgentPersona } from './prompts/personas';
import { getDataSourcesContext, getToolsContext } from './prompts/context';

export function generateSystemPrompt(
  appConfig: AppConfig, 
  agent?: AgentDefinition, 
  sessionConfig?: SessionConfig
): string {
  
  const dataSourcesInfo = getDataSourcesContext(appConfig);
  const toolsInfo = getToolsContext(sessionConfig, agent);
  const agentPersona = getAgentPersona(agent);

  // Construct the full prompt
  return `${agentPersona}

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
