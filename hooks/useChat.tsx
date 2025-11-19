import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react';
import type { Message, ToolCall, Session } from '../types';
import { streamChatResponse } from '../services/chatService';
import { parseStreamedContent } from '../utils/streamParser';
import { getDataForSource } from '../services/dashboardService';
import { saveSession, getSession, createSession, deleteSession as deleteSessionService, updateSessionTitle, clearAllSessions as clearAllSessionsService } from '../services/sessionService';

interface ChatState {
  messages: Message[];
  isChatOpen: boolean;
  status: 'idle' | 'thinking' | 'executing_tool' | 'streaming_response';
  activeToolCallId: string | null;
  currentSessionId: string | null;
}

type ChatAction =
  | { type: 'TOGGLE_CHAT' }
  | { type: 'SEND_MESSAGE'; payload: Message }
  | { type: 'ADD_ASSISTANT_MESSAGE'; payload: Message }
  | { type: 'ADD_SYSTEM_MESSAGE'; payload: Message }
  | { type: 'RECEIVE_TOKEN'; payload: { messageId: string; chunk: string } }
  | { type: 'START_THOUGHT'; payload: { messageId: string } }
  | { type: 'UPDATE_REASONING'; payload: { messageId: string; reasoning: string } }
  | { type: 'END_THOUGHT'; payload: { messageId: string } }
  | { type: 'START_TOOL_CALL'; payload: { messageId: string; toolCall: ToolCall } }
  | { type: 'COMPLETE_TOOL_CALL'; payload: { messageId: string; toolCallId: string } }
  | { type: 'UPDATE_STREAM'; payload: { messageId: string; content: string } }
  | { type: 'SET_STATUS'; payload: ChatState['status'] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_ACTIVE_TOOL_CALL'; payload: string | null }
  | { type: 'SET_SESSION'; payload: Session };

const initialState: ChatState = {
  messages: [],
  isChatOpen: false,
  status: 'idle',
  activeToolCallId: null,
  currentSessionId: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'TOGGLE_CHAT':
      return {
        ...state,
        isChatOpen: !state.isChatOpen,
      };

    case 'SEND_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        status: 'thinking',
      };

    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        status: 'streaming_response',
      };

    case 'ADD_SYSTEM_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'RECEIVE_TOKEN':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, content: msg.content + action.payload.chunk }
            : msg
        ),
      };

    case 'START_THOUGHT':
      return {
        ...state,
        status: 'thinking',
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, reasoning: '' }
            : msg
        ),
      };

    case 'UPDATE_REASONING':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, reasoning: action.payload.reasoning }
            : msg
        ),
      };

    case 'END_THOUGHT':
      return {
        ...state,
        status: 'streaming_response',
      };

    case 'START_TOOL_CALL':
      return {
        ...state,
        status: 'executing_tool',
        activeToolCallId: action.payload.toolCall.id,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? {
                ...msg,
                toolCalls: [...(msg.toolCalls || []), action.payload.toolCall],
              }
            : msg
        ),
      };

    case 'COMPLETE_TOOL_CALL':
      return {
        ...state,
        activeToolCallId: null,
        status: 'streaming_response',
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? {
                ...msg,
                toolCalls: msg.toolCalls?.map(tc =>
                  tc.id === action.payload.toolCallId
                    ? { ...tc, status: 'completed' as const }
                    : tc
                ),
              }
            : msg
        ),
      };

    case 'UPDATE_STREAM':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, content: action.payload.content }
            : msg
        ),
      };

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        status: 'idle',
        activeToolCallId: null,
        currentSessionId: null,
      };

    case 'SET_ACTIVE_TOOL_CALL':
      return {
        ...state,
        activeToolCallId: action.payload,
      };

    case 'SET_SESSION':
        return {
            ...state,
            currentSessionId: action.payload.id,
            messages: action.payload.messages,
            status: 'idle',
            activeToolCallId: null
        };

    default:
      return state;
  }
}

interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
  messages: Message[];
  status: ChatState['status'];
  activeToolCallId: string | null;
  currentSessionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  loadSession: (id: string) => Promise<void>;
  createNewSession: () => void;
  renameSession: (id: string, newTitle: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Persist session whenever status returns to idle and we have a session ID
  useEffect(() => {
      if (state.status === 'idle' && state.currentSessionId) {
          const session: Session = {
              id: state.currentSessionId,
              title: state.messages[0]?.content.slice(0, 50) || 'New Chat',
              messages: state.messages,
              createdAt: Date.now(), // Note: In a real app we'd want to preserve original creation time
              updatedAt: Date.now()
          };
          saveSession(session).catch(console.error);
      }
  }, [state.status, state.currentSessionId, state.messages]);

  const toggleChat = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHAT' });
  }, []);

  const loadSession = useCallback(async (id: string) => {
      try {
          const session = await getSession(id);
          if (session) {
              dispatch({ type: 'SET_SESSION', payload: session });
          }
      } catch (error) {
          console.error("Failed to load session:", error);
      }
  }, []);

  const createNewSession = useCallback(() => {
      const newSession = createSession();
      dispatch({ type: 'SET_SESSION', payload: newSession });
  }, []);

  const renameSession = useCallback(async (id: string, newTitle: string) => {
      try {
          await updateSessionTitle(id, newTitle);
      } catch (error) {
          console.error("Failed to rename session:", error);
          throw error;
      }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
      try {
          await deleteSessionService(id);
          // If we deleted the active session, clear the current state
          if (state.currentSessionId === id) {
              createNewSession();
          }
      } catch (error) {
          console.error("Failed to delete session:", error);
          throw error;
      }
  }, [state.currentSessionId, createNewSession]);

  const clearAllHistory = useCallback(async () => {
      try {
          await clearAllSessionsService();
          createNewSession();
      } catch (error) {
           console.error("Failed to clear history:", error);
           throw error;
      }
  }, [createNewSession]);


  const executeToolCall = async (command: { tool: string, params: string }) => {
      try {
          const params = JSON.parse(command.params);
          
          if (command.tool === 'searchData') {
              const data = await getDataForSource(params.dataSource);
              return {
                  status: 'success',
                  data: data,
                  summary: `Successfully fetched ${data.length} rows from ${params.dataSource}`
              };
          } else if (command.tool === 'listTables') {
               return {
                   status: 'success',
                   data: ['fruit_sales', 'mango_revenue', 'fruit_taste_data'],
                   summary: 'Listed available tables'
               };
          }
          
          return {
              status: 'error',
              error: `Unknown tool: ${command.tool}`
          };
      } catch (error) {
          return {
              status: 'error',
              error: error instanceof Error ? error.message : String(error)
          };
      }
  };

  const sendMessage = useCallback(async (content: string) => {
    let activeSessionId = state.currentSessionId;

    // Ensure we have a session
    if (!activeSessionId) {
        const newSession = createSession();
        activeSessionId = newSession.id;
        dispatch({ type: 'SET_SESSION', payload: newSession });
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    dispatch({ type: 'SEND_MESSAGE', payload: userMessage });

    let currentAssistantMessageId = `${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: currentAssistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: assistantMessage });

    let currentHistory = [...state.messages, userMessage];
    
    try {
      let continueLoop = true;
      let loopCount = 0;
      const MAX_LOOPS = 5;

      while (continueLoop && loopCount < MAX_LOOPS) {
          loopCount++;
          let accumulatedResponse = '';
          
          await streamChatResponse(currentHistory, (chunk) => {
            accumulatedResponse += chunk;
            dispatch({
              type: 'RECEIVE_TOKEN',
              payload: { messageId: currentAssistantMessageId, chunk },
            });
          });

          const { command } = parseStreamedContent(accumulatedResponse);

          if (command) {
              dispatch({ type: 'SET_STATUS', payload: 'executing_tool' });

              const result = await executeToolCall(command);

              const systemMessage: Message = {
                  id: `${Date.now()}-system`,
                  role: 'system',
                  content: JSON.stringify(result),
                  timestamp: new Date(),
              };

              dispatch({ type: 'ADD_SYSTEM_MESSAGE', payload: systemMessage });

              const assistantMsgSoFar: Message = {
                  id: currentAssistantMessageId,
                  role: 'assistant',
                  content: accumulatedResponse,
                  timestamp: new Date()
              };
              
              currentHistory = [...currentHistory, assistantMsgSoFar, systemMessage];

              currentAssistantMessageId = `${Date.now()}-assistant-${loopCount}`;
              const nextAssistantMessage: Message = {
                  id: currentAssistantMessageId,
                  role: 'assistant',
                  content: '',
                  timestamp: new Date(),
              };
              
              dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: nextAssistantMessage });
              
          } else {
              continueLoop = false;
          }
      }

      dispatch({ type: 'SET_STATUS', payload: 'idle' });
    } catch (error) {
      console.error("Failed to send message:", error);
      dispatch({
        type: 'UPDATE_STREAM',
        payload: {
          messageId: currentAssistantMessageId,
          content: "\n\n*Error: Failed to generate response.*",
        },
      });
      dispatch({ type: 'SET_STATUS', payload: 'idle' });
    }
  }, [state.messages, state.currentSessionId]);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const value = useMemo(
    () => ({
      isChatOpen: state.isChatOpen,
      toggleChat,
      messages: state.messages,
      status: state.status,
      activeToolCallId: state.activeToolCallId,
      currentSessionId: state.currentSessionId,
      sendMessage,
      clearMessages,
      loadSession,
      createNewSession,
      renameSession,
      deleteSession,
      clearAllHistory
    }),
    [state.isChatOpen, state.messages, state.status, state.activeToolCallId, state.currentSessionId, toggleChat, sendMessage, clearMessages, loadSession, createNewSession, renameSession, deleteSession, clearAllHistory]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
