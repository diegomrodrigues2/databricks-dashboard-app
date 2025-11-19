import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Message } from '../types';
import { streamChatResponse } from '../services/chatService';

interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const sendMessage = async (content: string) => {
    // Optimistic UI: Add user message immediately
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Placeholder for assistant response
    const assistantMessageId = `${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '', // Starts empty
      timestamp: new Date(),
    };
    
    // Update state with both messages
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    
    try {
      // Prepare history for the API (excluding the empty assistant message we just added)
      const conversationHistory = [...messages, userMessage];

      await streamChatResponse(conversationHistory, (chunk) => {
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.id === assistantMessageId) {
              return {
                ...msg,
                content: msg.content + chunk
              };
            }
            return msg;
          });
        });
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optionally update the assistant message to show an error
      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMessageId) {
          return { ...msg, content: msg.content + "\n\n*Error: Failed to generate response.*" };
        }
        return msg;
      }));
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const value = useMemo(() => ({
    isChatOpen,
    toggleChat,
    messages,
    sendMessage,
    clearMessages,
  }), [isChatOpen, messages]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

