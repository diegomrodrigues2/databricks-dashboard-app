import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { SessionConfig, ChatMode } from '../../types';
import { DEFAULT_AGENTS } from '../../services/agentRegistry';
import { getAllToolDefinitions } from '../../services/toolRegistry';
import { CogIcon } from '../icons/CogIcon';
import { UserIcon } from '../icons/UserIcon';
import { WrenchIcon } from '../icons/WrenchIcon';

const MODES: { mode: ChatMode; label: string; description: string }[] = [
  { mode: 'fast-response', label: 'Fast Response', description: 'Quick answers, minimal reasoning.' },
  { mode: 'deep-analysis', label: 'Deep Analysis', description: 'Thorough data exploration and visualization.' },
  { mode: 'code-generation', label: 'Code Engineer', description: 'Generates and executes SQL/Python code.' },
  { mode: 'creative', label: 'Creative Studio', description: 'Brainstorming and lateral thinking.' },
];

interface SessionSetupProps {
    onStart: () => void;
}

const SessionSetup: React.FC<SessionSetupProps> = ({ onStart }) => {
  const { switchAgent, addSystemMessage } = useChat(); // In a real app, we'd have a setSessionConfig action
  
  // Local state for configuration before confirming
  const [selectedMode, setSelectedMode] = useState<ChatMode>('deep-analysis');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_AGENTS[0].id);
  const [enabledTools, setEnabledTools] = useState<string[]>(getAllToolDefinitions().map(t => t.name));
  
  const allTools = getAllToolDefinitions();

  const handleStartSession = () => {
    // 1. Configure the session
    switchAgent(selectedAgentId);
    
    const modeLabel = MODES.find(m => m.mode === selectedMode)?.label || selectedMode;
    const agentName = DEFAULT_AGENTS.find(a => a.id === selectedAgentId)?.name || selectedAgentId;
    
    addSystemMessage(`Session started.\nMode: **${modeLabel}**\nAgent: **${agentName}**\nTools: ${enabledTools.length} enabled`);

    // 2. Notify parent
    onStart();
  };

  const confirmSetup = async () => {
      handleStartSession();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-6 overflow-y-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Configure Session</h2>
        <p className="text-gray-400">Customize your AI assistant for this task.</p>
      </div>

      <div className="space-y-8 max-w-2xl mx-auto w-full">
        {/* Mode Selection */}
        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CogIcon className="w-6 h-6 text-blue-400" />
            Operating Mode
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODES.map((mode) => (
              <button
                key={mode.mode}
                onClick={() => setSelectedMode(mode.mode)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedMode === mode.mode
                    ? 'border-blue-500 bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                }`}
              >
                <div className="font-medium text-white">{mode.label}</div>
                <div className="text-sm text-gray-400 mt-1">{mode.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Agent Selection */}
        <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-green-400" />
                Select Agent
            </h3>
            <div className="grid grid-cols-1 gap-4">
                {DEFAULT_AGENTS.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`p-4 rounded-lg border flex items-start gap-4 transition-all ${
                            selectedAgentId === agent.id
                                ? 'border-green-500 bg-green-900/20 ring-1 ring-green-500'
                                : 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                        }`}
                    >
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
                            {/* Placeholder Avatar */}
                            {agent.avatarUrl ? <img src={agent.avatarUrl} className="rounded-full" /> : "🤖"}
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-white">{agent.name}</div>
                            <div className="text-sm text-gray-300">{agent.role}</div>
                            <div className="text-xs text-gray-500 mt-1">{agent.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </section>

        {/* Tool Toggles */}
        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <WrenchIcon className="w-6 h-6 text-orange-400" />
            Enabled Tools
          </h3>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
            {allTools.map(tool => (
                <label key={tool.name} className="flex items-center justify-between p-2 hover:bg-gray-750 rounded cursor-pointer">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-200">{tool.name}</span>
                        <span className="text-xs text-gray-500">{tool.description.slice(0, 60)}...</span>
                    </div>
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                        checked={enabledTools.includes(tool.name)}
                        onChange={(e) => {
                            if (e.target.checked) {
                                setEnabledTools([...enabledTools, tool.name]);
                            } else {
                                setEnabledTools(enabledTools.filter(t => t !== tool.name));
                            }
                        }}
                    />
                </label>
            ))}
          </div>
        </section>

        <button
          onClick={confirmSetup}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-[1.01]"
        >
          Start Session
        </button>
      </div>
    </div>
  );
};

export default SessionSetup;

