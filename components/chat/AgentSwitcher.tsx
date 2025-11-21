import React, { useState } from 'react';
import { UserIcon } from '../icons/UserIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { useChat } from '../../hooks/useChat';
import { DEFAULT_AGENTS } from '../../services/agentRegistry';

const AgentSwitcher: React.FC = () => {
  const { activeAgentId, switchAgent } = useChat();
  const [isOpen, setIsOpen] = useState(false);

  const activeAgent = DEFAULT_AGENTS.find(a => a.id === activeAgentId) || DEFAULT_AGENTS[0];

  const handleSwitch = (agentId: string) => {
    switchAgent(agentId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors border border-gray-600"
      >
        <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-500 flex items-center justify-center">
          {activeAgent.avatarUrl ? (
            <img src={activeAgent.avatarUrl} alt={activeAgent.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-3 h-3 text-white" />
          )}
        </div>
        <div className="flex flex-col items-start">
            <span className="text-xs font-medium text-gray-200 leading-none">{activeAgent.name}</span>
            <span className="text-[10px] text-gray-400 leading-none mt-0.5">{activeAgent.role}</span>
        </div>
        <ChevronDownIcon className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Switch Agent</div>
          <div className="max-h-64 overflow-y-auto">
            {DEFAULT_AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleSwitch(agent.id)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors text-left ${
                  activeAgentId === agent.id ? 'bg-blue-900/20' : ''
                }`}
              >
                 <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center">
                    {agent.avatarUrl ? (
                        <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full rounded-full" />
                    ) : (
                        <UserIcon className="w-4 h-4 text-gray-300" />
                    )}
                 </div>
                 <div>
                    <div className={`text-sm font-medium ${activeAgentId === agent.id ? 'text-blue-400' : 'text-gray-200'}`}>
                        {agent.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate w-40">{agent.role}</div>
                 </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSwitcher;

