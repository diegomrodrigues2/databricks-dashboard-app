import React from 'react';
import { useChat } from '../../hooks/useChat';
import ChatWindow from './ChatWindow';

const ChatOverlay: React.FC = () => {
  const { isChatOpen, toggleChat } = useChat();

  if (!isChatOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={toggleChat}
        aria-hidden="true"
      />
      
      {/* Chat drawer */}
      <div 
        className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 z-40 shadow-2xl"
      >
        <ChatWindow />
      </div>
    </>
  );
};

export default ChatOverlay;

