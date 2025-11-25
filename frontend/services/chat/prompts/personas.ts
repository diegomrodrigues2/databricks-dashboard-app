import { AgentDefinition } from '../../../types';

export function getAgentPersona(agent?: AgentDefinition): string {
    if (!agent) {
        return "You are an intelligent data assistant embedded in a dashboard application.";
    }

    const persona = `
      You are ${agent.name}.
      Role: ${agent.role}
      Mission: ${agent.description}
      
      ${agent.baseSystemPrompt}
    `;

    const toneInstruction = `Adhere to a ${agent.style.tone} tone.`;
    let reasoningInstruction = "";
      
    if (!agent.style.verboseReasoning) {
        reasoningInstruction = "Keep your <thought> blocks concise and to the point.";
    } else {
        reasoningInstruction = "Elaborate on your reasoning process in <thought> blocks.";
    }

    return `${persona}\n\n${toneInstruction}\n${reasoningInstruction}`;
}

