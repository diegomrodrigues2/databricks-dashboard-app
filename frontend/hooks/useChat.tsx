import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Message, ToolCall, Session, StructuredInquiry, TreeMessage, AgentDefinition } from '../types';
import { streamChatResponse } from '../services/chatService';
import { parseStreamedContent } from '../utils/streamParser';
import { getDataForSource, executeRawQuery } from '../services/dashboardService';
import { fetchCatalogs, fetchSchemas, fetchTables, fetchTableDetails } from '../services/explorerService';
import { saveSession, getSession, createSession, deleteSession as deleteSessionService, updateSessionTitle, clearAllSessions as clearAllSessionsService } from '../services/sessionService';
import { agentRegistry, DEFAULT_AGENTS } from '../services/agentRegistry';

interface ChatState {
  messageMap: Record<string, TreeMessage>;
  currentLeafId: string | null;
  isChatOpen: boolean;
  status: 'idle' | 'thinking' | 'executing_tool' | 'streaming_response' | 'awaiting_input';
  activeToolCallId: string | null;
  currentSessionId: string | null;
  activeAgentId: string;
}

type ChatAction =
  | { type: 'TOGGLE_CHAT' }
  | { type: 'SEND_MESSAGE'; payload: TreeMessage }
  | { type: 'ADD_ASSISTANT_MESSAGE'; payload: TreeMessage }
  | { type: 'ADD_SYSTEM_MESSAGE'; payload: TreeMessage }
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
  | { type: 'SET_SESSION'; payload: Session }
  | { type: 'SET_INQUIRY'; payload: { messageId: string; inquiry: StructuredInquiry } }
  | { type: 'SUBMIT_DECISION'; payload: { inquiryId: string; value: any; userId: string } }
  | { type: 'NAVIGATE_BRANCH'; payload: { leafId: string } }
  | { type: 'SWITCH_AGENT'; payload: { agentId: string } };

const initialState: ChatState = {
  messageMap: {},
  currentLeafId: null,
  isChatOpen: false,
  status: 'idle',
  activeToolCallId: null,
  currentSessionId: null,
  activeAgentId: DEFAULT_AGENTS[0].id,
};

function getThreadFromLeaf(leafId: string | null, messageMap: Record<string, TreeMessage>): Message[] {
    if (!leafId) return [];
    const thread: Message[] = [];
    let currentId: string | null = leafId;
    
    while (currentId && messageMap[currentId]) {
        const msg = messageMap[currentId];
        thread.unshift(msg); // Add to beginning
        currentId = msg.parentId;
    }
    return thread;
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'TOGGLE_CHAT':
      return {
        ...state,
        isChatOpen: !state.isChatOpen,
      };

    case 'SEND_MESSAGE': {
        const newMessage = action.payload;
        const parentId = newMessage.parentId;
        
        const newState = {
            ...state,
            messageMap: {
                ...state.messageMap,
                [newMessage.id]: newMessage
            },
            currentLeafId: newMessage.id,
            status: 'thinking' as const
        };

        // Update parent's childrenIds if parent exists
        if (parentId && state.messageMap[parentId]) {
            const parent = state.messageMap[parentId];
            newState.messageMap[parentId] = {
                ...parent,
                childrenIds: [...(parent.childrenIds || []), newMessage.id]
            };
        }
        return newState;
    }

    case 'ADD_ASSISTANT_MESSAGE':
    case 'ADD_SYSTEM_MESSAGE': {
        const newMessage = action.payload;
        const parentId = newMessage.parentId;
        
        const newState = {
            ...state,
            messageMap: {
                ...state.messageMap,
                [newMessage.id]: newMessage
            },
            currentLeafId: newMessage.id,
            status: action.type === 'ADD_ASSISTANT_MESSAGE' ? 'streaming_response' as const : state.status
        };

         if (parentId && state.messageMap[parentId]) {
            const parent = state.messageMap[parentId];
            newState.messageMap[parentId] = {
                ...parent,
                childrenIds: [...(parent.childrenIds || []), newMessage.id]
            };
        }

        return newState;
    }

    case 'RECEIVE_TOKEN': {
      const msg = state.messageMap[action.payload.messageId];
      if (!msg) return state;

      return {
        ...state,
        messageMap: {
            ...state.messageMap,
            [action.payload.messageId]: {
                ...msg,
                content: msg.content + action.payload.chunk
            }
        }
      };
    }

    case 'START_THOUGHT': {
      const msg = state.messageMap[action.payload.messageId];
      if (!msg) return state;
      return {
        ...state,
        status: 'thinking',
        messageMap: {
            ...state.messageMap,
            [action.payload.messageId]: { ...msg, reasoning: '' }
        }
      };
    }

    case 'UPDATE_REASONING': {
       const msg = state.messageMap[action.payload.messageId];
       if (!msg) return state;
       return {
        ...state,
        messageMap: {
             ...state.messageMap,
             [action.payload.messageId]: { ...msg, reasoning: action.payload.reasoning }
        }
       };
    }

    case 'END_THOUGHT':
      return {
        ...state,
        status: 'streaming_response',
      };

    case 'START_TOOL_CALL': {
       const msg = state.messageMap[action.payload.messageId];
       if (!msg) return state;
      return {
        ...state,
        status: 'executing_tool',
        activeToolCallId: action.payload.toolCall.id,
        messageMap: {
            ...state.messageMap,
            [action.payload.messageId]: {
                 ...msg,
                 toolCalls: [...(msg.toolCalls || []), action.payload.toolCall]
            }
        }
      };
    }

    case 'COMPLETE_TOOL_CALL': {
       const msg = state.messageMap[action.payload.messageId];
       if (!msg) return state;
      return {
        ...state,
        activeToolCallId: null,
        status: 'streaming_response',
        messageMap: {
            ...state.messageMap,
            [action.payload.messageId]: {
                 ...msg,
                 toolCalls: msg.toolCalls?.map(tc =>
                  tc.id === action.payload.toolCallId
                    ? { ...tc, status: 'completed' as const }
                    : tc
                ),
            }
        }
      };
    }

    case 'UPDATE_STREAM': {
       const msg = state.messageMap[action.payload.messageId];
       if (!msg) return state;
       return {
        ...state,
        messageMap: {
            ...state.messageMap,
            [action.payload.messageId]: { ...msg, content: action.payload.content }
        }
       };
    }

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messageMap: {},
        currentLeafId: null,
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
            messageMap: action.payload.messageMap || {}, // Handle legacy sessions
            currentLeafId: action.payload.currentLeafId || null,
            status: 'idle',
            activeToolCallId: null
        };

    case 'SET_INQUIRY': {
        const msg = state.messageMap[action.payload.messageId];
        if (!msg) return state;
        return {
            ...state,
            status: 'awaiting_input',
            messageMap: {
                ...state.messageMap,
                [action.payload.messageId]: { ...msg, structuredInquiry: action.payload.inquiry }
            }
        };
    }

    case 'SUBMIT_DECISION':
        const activeThread = getThreadFromLeaf(state.currentLeafId, state.messageMap);
        const targetMsgRef = activeThread.find(m => m.structuredInquiry?.id === action.payload.inquiryId);
        
        if (!targetMsgRef) return state;

        const targetMsg = state.messageMap[targetMsgRef.id];

        return {
            ...state,
            status: 'thinking',
            messageMap: {
                ...state.messageMap,
                [targetMsg.id]: {
                    ...targetMsg,
                    decision: {
                        inquiryId: action.payload.inquiryId,
                        value: action.payload.value,
                        timestamp: new Date(),
                        userId: action.payload.userId
                    }
                }
            }
        };

    case 'NAVIGATE_BRANCH':
        return {
            ...state,
            currentLeafId: action.payload.leafId
        };
        
    case 'SWITCH_AGENT':
        return {
            ...state,
            activeAgentId: action.payload.agentId
        };

    default:
      return state;
  }
}

interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
  messages: Message[]; // Computed property (linear view)
  status: ChatState['status'];
  activeToolCallId: string | null;
  currentSessionId: string | null;
  activeAgentId: string;
  sendMessage: (content: string) => Promise<void>;
  startNewSessionWithContext: (content: string) => Promise<void>;
  submitDecision: (inquiryId: string, value: any) => Promise<void>;
  submitCodeExecutionResult: (code: string, result: any) => Promise<void>;
  clearMessages: () => void;
  loadSession: (id: string) => Promise<void>;
  createNewSession: () => void;
  renameSession: (id: string, newTitle: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  navigateBranch: (leafId: string) => void;
  switchAgent: (agentId: string) => void;
  editUserMessage: (originalMessageId: string, newContent: string) => Promise<void>;
  addSystemMessage: (content: string) => void;
  stopGeneration: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Derive linear messages from the tree state for UI consumption
  const messages = useMemo(() => 
      getThreadFromLeaf(state.currentLeafId, state.messageMap), 
      [state.currentLeafId, state.messageMap]
  );

  // Persist session whenever status returns to idle and we have a session ID
  useEffect(() => {
      if (state.status === 'idle' && state.currentSessionId && messages.length > 0) {
          const session: Session = {
              id: state.currentSessionId,
              title: messages[0]?.content.slice(0, 50) || 'New Chat',
              messageMap: state.messageMap,
              currentLeafId: state.currentLeafId,
              createdAt: Date.now(), // Note: In a real app we'd want to preserve original creation time
              updatedAt: Date.now()
          };
          // @ts-ignore - Ignoring type mismatch with legacy Service for now, will need to update SessionService later
          saveSession(session).catch(console.error);
      }
  }, [state.status, state.currentSessionId, state.messageMap, state.currentLeafId, messages]);

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

  const navigateBranch = useCallback((leafId: string) => {
      dispatch({ type: 'NAVIGATE_BRANCH', payload: { leafId } });
  }, []);

  const editUserMessage = useCallback(async (originalMessageId: string, newContent: string) => {
    const originalMessage = state.messageMap[originalMessageId];
    if (!originalMessage) {
        console.error("Cannot edit message: Message not found");
        return;
    }

    const newMessage: TreeMessage = {
        id: `${Date.now()}-user`,
        role: 'user',
        content: newContent,
        timestamp: new Date(),
        parentId: originalMessage.parentId, // Branching off from the same parent
        childrenIds: []
    };

    dispatch({ type: 'SEND_MESSAGE', payload: newMessage });

    // Reconstruct history including the new message
    const parentThread = getThreadFromLeaf(originalMessage.parentId, state.messageMap);
    const currentHistory = [...parentThread, newMessage];

    await processResponseLoop(currentHistory);
  }, [state.messageMap, state.activeAgentId]); // Depends on state for messageMap and processResponseLoop's closure

  const switchAgent = useCallback((agentId: string) => {
      dispatch({ type: 'SWITCH_AGENT', payload: { agentId } });
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: TreeMessage = {
        id: `${Date.now()}-system`,
        role: 'system',
        content,
        timestamp: new Date(),
        parentId: state.currentLeafId,
        childrenIds: []
    };
    dispatch({ type: 'ADD_SYSTEM_MESSAGE', payload: systemMessage });
  }, [state.currentLeafId]);

  const stopGeneration = useCallback(() => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          dispatch({ type: 'SET_STATUS', payload: 'idle' });
      }
  }, []);


  const executeToolCall = async (command: { tool: string, params: string }) => {
      try {
          const params = JSON.parse(command.params);
          
          if (command.tool === 'searchData') {
              let data = await getDataForSource(params.dataSource);

              // If no data found in static sources, and we have a query, try executing it
              if ((!data || data.length === 0) && params.query) {
                  try {
                      console.log(`[searchData] Executing query for ${params.dataSource}: ${params.query}`);
                      data = await executeRawQuery(params.query, 'sql');

                      // Check if the result indicates an error
                      if (data.length === 1 && data[0].error) {
                           return {
                              status: 'error',
                              error: data[0].error
                           };
                      }
                  } catch (err) {
                      console.error("Failed to execute query in searchData", err);
                      return {
                          status: 'error',
                          error: err instanceof Error ? err.message : String(err)
                      };
                  }
              }

              return {
                  status: 'success',
                  data: data || [],
                  summary: `Successfully fetched ${(data || []).length} rows from ${params.dataSource}`
              };
          } else if (command.tool === 'list_catalogs') {
               const catalogs = await fetchCatalogs();
               return {
                   status: 'success',
                   data: catalogs,
                   summary: `Found ${catalogs.length} catalogs.`
               };
          } else if (command.tool === 'list_schemas') {
               const schemas = await fetchSchemas(params.catalog_name);
               return {
                   status: 'success',
                   data: schemas,
                   summary: `Found ${schemas.length} schemas in ${params.catalog_name}.`
               };
          } else if (command.tool === 'list_tables') {
               const tables = await fetchTables(params.catalog_name, params.schema_name);
               return {
                   status: 'success',
                   data: tables,
                   summary: `Found ${tables.length} tables in ${params.catalog_name}.${params.schema_name}.`
               };
          } else if (command.tool === 'get_table_schema' || command.tool === 'inspect_table') {
               const tableDetails = await fetchTableDetails(params.full_table_name);
               return {
                   status: 'success',
                   data: tableDetails,
                   summary: `Retrieved schema for ${params.full_table_name} with ${tableDetails.columns.length} columns.`
               };
          } else if (command.tool === 'ask_user') {
              // This shouldn't strictly be executed as a tool in the background, 
              // but if it were, it would return "Waiting for user input"
              return {
                  status: 'pending',
                  summary: 'Waiting for user input'
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

  const processResponseLoop = async (initialHistory: Message[]) => {
      // Main controller for User Stop actions
      const userAbortController = new AbortController();
      // We store this in the ref so stopGeneration can call .abort() on it
      abortControllerRef.current = userAbortController;
      
      let currentHistory = [...initialHistory];
      // Last message in history is the leaf
      let currentParentId = currentHistory[currentHistory.length - 1].id;

      let continueLoop = true;
      let loopCount = 0;
      const MAX_LOOPS = 5;
      
      // Get active agent definition
      const currentAgent = agentRegistry.getAgent(state.activeAgentId);

      try {
        while (continueLoop && loopCount < MAX_LOOPS) {
            if (userAbortController.signal.aborted) break;
            loopCount++;
            
            let currentAssistantMessageId = `${Date.now()}-assistant-${loopCount}`;
            const assistantMessage: TreeMessage = {
                id: currentAssistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                parentId: currentParentId,
                childrenIds: []
            };
            
            dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: assistantMessage });
            // Update parent pointer for next iteration
            currentParentId = currentAssistantMessageId;
            
            let accumulatedResponse = '';
            
            // Controller for this specific stream request (so we can pause on <<<WAIT>>>)
            const streamAbortController = new AbortController();
            
            // Link user abort to stream abort
            const onUserAbort = () => streamAbortController.abort();
            userAbortController.signal.addEventListener('abort', onUserAbort);

            try {
                // Pass Agent Definition to Service
                await streamChatResponse(
                    currentHistory, 
                    currentAgent, 
                    undefined, // SessionConfig to be added later
                    (chunk) => {
                        if (userAbortController.signal.aborted) return; 
                        accumulatedResponse += chunk;
                        dispatch({
                            type: 'RECEIVE_TOKEN',
                            payload: { messageId: currentAssistantMessageId, chunk },
                        });
                        
                        // Check for STOP token (<<<WAIT>>>)
                        const { shouldWait } = parseStreamedContent(accumulatedResponse);
                        if (shouldWait) {
                             streamAbortController.abort();
                        }
                    },
                    streamAbortController.signal
                );
            } catch (error: any) {
                if (error.name === 'AbortError' || streamAbortController.signal.aborted) {
                     console.log("Stream stopped (User or Token)");
                     // Fallthrough to check for command
                } else {
                    console.error("Failed to stream response:", error);
                    dispatch({
                        type: 'UPDATE_STREAM',
                        payload: {
                        messageId: currentAssistantMessageId,
                        content: "\n\n*Error: Failed to generate response.*",
                        },
                    });
                    break; 
                }
            } finally {
                userAbortController.signal.removeEventListener('abort', onUserAbort);
            }

            if (userAbortController.signal.aborted) break;

            const { command } = parseStreamedContent(accumulatedResponse);
            
            // Update history with the full assistant message
            // Remove <<<WAIT>>> from the stored history to avoid confusing the model on the next turn
            const cleanContent = accumulatedResponse.replace(/<<<WAIT>>>/g, '').trim();
            const assistantMsgFinished: TreeMessage = {
                id: currentAssistantMessageId,
                role: 'assistant',
                content: cleanContent,
                timestamp: new Date(),
                parentId: assistantMessage.parentId,
                childrenIds: []
            };
            // We don't need to dispatch update again because UPDATE_STREAM handled the content view,
            // but we need the clean object for the history state.
            
            // Fix: we should update the local history array with the clean content version
            currentHistory = [...currentHistory, assistantMsgFinished];

            if (command) {
                if (command.tool === 'ask_user') {
                    try {
                        const inquiry = JSON.parse(command.params) as StructuredInquiry;
                        dispatch({ 
                            type: 'SET_INQUIRY', 
                            payload: { messageId: currentAssistantMessageId, inquiry } 
                        });
                        // Break the loop and wait for user
                        return; 
                    } catch (e) {
                        console.error("Failed to parse inquiry", e);
                    }
                }
                
                dispatch({ type: 'SET_STATUS', payload: 'executing_tool' });
                const result = await executeToolCall(command);

                const systemMessage: TreeMessage = {
                    id: `${Date.now()}-system`,
                    role: 'system',
                    content: JSON.stringify(result),
                    timestamp: new Date(),
                    parentId: currentParentId,
                    childrenIds: []
                };

                dispatch({ type: 'ADD_SYSTEM_MESSAGE', payload: systemMessage });
                // Update parent pointer
                currentParentId = systemMessage.id;
                
                currentHistory = [...currentHistory, systemMessage];
                // Continue loop to get next response from assistant based on tool result
            } else {
                continueLoop = false;
            }
        }
      } finally {
         abortControllerRef.current = null;
         // Only reset to idle if we didn't end up in 'awaiting_input' (ask_user)
         if (state.status !== 'awaiting_input') {
            dispatch({ type: 'SET_STATUS', payload: 'idle' });
         }
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

    const userMessage: TreeMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
      parentId: state.currentLeafId, // Append to current leaf
      childrenIds: []
    };

    dispatch({ type: 'SEND_MESSAGE', payload: userMessage });

    // Reconstruct history including the new message
    const currentHistory = [...messages, userMessage];
    
    await processResponseLoop(currentHistory);
  }, [state.messageMap, state.currentLeafId, state.currentSessionId, messages, state.activeAgentId]); 

  const submitDecision = useCallback(async (inquiryId: string, value: any) => {
      // 1. Dispatch local state update
      dispatch({ 
          type: 'SUBMIT_DECISION', 
          payload: { 
              inquiryId, 
              value, 
              userId: 'user-1' // Mock user ID
          } 
      });

      // 2. Add System Message logging the decision
      const decisionMsg: TreeMessage = {
          id: `${Date.now()}-system-decision`,
          role: 'system',
          content: `System: User decided: ${JSON.stringify(value)} for inquiry ${inquiryId}`,
          timestamp: new Date(),
          parentId: state.currentLeafId,
          childrenIds: []
      };
      dispatch({ type: 'ADD_SYSTEM_MESSAGE', payload: decisionMsg });

      // 3. Resume the chat loop
      
      // Temporary workaround: Manually construct the 'next' history state locally for the loop
      const updatedMessages = messages.map(msg => {
         if (msg.structuredInquiry?.id === inquiryId) {
             return {
                 ...msg,
                 decision: {
                     inquiryId,
                     value,
                     timestamp: new Date(),
                     userId: 'user-1'
                 }
             };
         }
         return msg;
      });

      const newHistory = [...updatedMessages, decisionMsg];
      await processResponseLoop(newHistory);

  }, [messages, state.currentLeafId]); 

  const submitCodeExecutionResult = useCallback(async (code: string, result: any) => {
      // Add System Message logging the execution result
      const executionMsg: TreeMessage = {
          id: `${Date.now()}-system-execution`,
          role: 'system',
          content: JSON.stringify({ 
              type: 'execution_result', 
              code,
              result_summary: Array.isArray(result) ? `Returned ${result.length} rows.` : 'Execution completed.',
              result_preview: Array.isArray(result) ? result.slice(0, 5) : result
          }),
          timestamp: new Date(),
          parentId: state.currentLeafId,
          childrenIds: []
      };
      dispatch({ type: 'ADD_SYSTEM_MESSAGE', payload: executionMsg });

      // Resume the chat loop with updated history
      const newHistory = [...messages, executionMsg];
      await processResponseLoop(newHistory);
  }, [messages, state.currentLeafId]);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const startNewSessionWithContext = useCallback(async (content: string) => {
      const newSession = createSession();
      dispatch({ type: 'SET_SESSION', payload: newSession });

      const userMessage: TreeMessage = {
          id: `${Date.now()}-user`,
          role: 'user',
          content,
          timestamp: new Date(),
          parentId: null,
          childrenIds: []
      };

      dispatch({ type: 'SEND_MESSAGE', payload: userMessage });
      
      await processResponseLoop([userMessage]);
  }, [state.activeAgentId]);

  const value = useMemo(
    () => ({
      isChatOpen: state.isChatOpen,
      toggleChat,
      messages, // Expose linear thread
      status: state.status,
      activeToolCallId: state.activeToolCallId,
      currentSessionId: state.currentSessionId,
      activeAgentId: state.activeAgentId,
      sendMessage,
      startNewSessionWithContext,
      submitDecision,
      submitCodeExecutionResult,
      clearMessages,
      loadSession,
      createNewSession,
      renameSession,
      deleteSession,
      clearAllHistory,
      navigateBranch,
      editUserMessage,
      switchAgent,
      addSystemMessage,
      stopGeneration
    }),
    [state.isChatOpen, messages, state.status, state.activeToolCallId, state.currentSessionId, state.activeAgentId, toggleChat, sendMessage, startNewSessionWithContext, submitDecision, clearMessages, loadSession, createNewSession, renameSession, deleteSession, clearAllHistory, navigateBranch, editUserMessage, switchAgent, addSystemMessage, stopGeneration]
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
