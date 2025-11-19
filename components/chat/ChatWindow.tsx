import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatWindow: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-900">
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </div>
  );
};

export default ChatWindow;

