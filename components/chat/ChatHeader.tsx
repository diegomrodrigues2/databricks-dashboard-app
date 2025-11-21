import React from 'react';
import AgentSwitcher from './AgentSwitcher';

const ChatHeader: React.FC = () => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-white hidden sm:block">Data Assistant</h2>
      <div className="flex-1 sm:flex-none flex justify-end">
         <AgentSwitcher />
      </div>
    </div>
  );
};

export default ChatHeader;


