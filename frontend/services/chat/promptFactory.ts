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

  let personaConstraints = "";
  if (agent?.id === 'data_engineer') {
      personaConstraints = "\nCONSTRAINT: You are a Data Engineer. Prefer showing raw tables, schemas, and SQL code. Avoid decorative charts unless explicitly requested.";
  } else if (agent?.id === 'data_analyst') {
      personaConstraints = "\nCONSTRAINT: You are a Data Analyst. Always try to visualize data with charts (bar, line, scatter) when possible. Focus on insights.";
  } else if (agent?.id === 'executive_assistant') {
      personaConstraints = "\nCONSTRAINT: You are an Executive Assistant. Provide high-level summaries and KPIs. Avoid technical jargon and raw code.";
  }

  // Construct the full prompt
  return `${agentPersona}
${personaConstraints}

You have access to the following data sources:
${dataSourcesInfo}

You have access to the following tools:
${toolsInfo}

${XML_PROTOCOL_INSTRUCTIONS}

${WIDGET_SCHEMA_DEFINITION}
`;
}
