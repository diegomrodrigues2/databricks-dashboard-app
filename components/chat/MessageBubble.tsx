import React, { useMemo, useState } from 'react';
import { UserIcon } from '../icons/UserIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { CogIcon } from '../icons/CogIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { TableIcon } from '../icons/TableIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { PencilIcon } from '../icons/PencilIcon';
import type { TreeMessage } from '../../types';
import MarkdownRenderer from './MarkdownRenderer';
import { parseStreamedContent } from '../../utils/streamParser';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';
import { useSpreadsheet } from '../../hooks/useSpreadsheet';
import { useChat } from '../../hooks/useChat';
import InquiryRenderer from './InquiryRenderer';
import { DEFAULT_AGENTS } from '../../services/agentRegistry'; // Import agents to lookup details

interface MessageBubbleProps {
  message: TreeMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const formattedTime = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const [isSystemDetailsOpen, setIsSystemDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { openSpreadsheet } = useSpreadsheet();
  const { submitDecision, submitCodeExecutionResult, navigateBranch, editUserMessage } = useChat(); // Added editUserMessage

  // Identify Agent if assistant
  // We assume message might have an 'authorId' or we default to System Default if unknown
  // Since TreeMessage doesn't strictly have authorId yet in types.ts (we proposed it but might not have added it to type definition in Phase 1 fully?)
  // Let's check types.ts content or cast safely.
  // Checking Phase 1: We added `authorId?: string` to Message.
  const authorId = (message as any).authorId;
  const agent = authorId ? DEFAULT_AGENTS.find(a => a.id === authorId) : null;

  // Branch Navigation Logic
  const hasMultipleChildren = message.childrenIds && message.childrenIds.length > 1;
  const currentChildIndex = message.childrenIds ? message.childrenIds.findIndex(id => id === message.id) : -1; 
  // Wait, childrenIds are on the PARENT. To navigate SIBLINGS, we need to know the parent's children.
  // But MessageBubble receives the message itself.
  // We need to know: "Does THIS message have siblings?"
  // To know that, we need to look up the parent.
  // However, the UI for navigating branches usually sits on the PARENT message (to choose which child to follow) OR on the CHILD message (showing "x of y").
  // Standard practice (like ChatGPT): The navigation controls appear on the message that HAS multiple versions.
  // So if *I* am a message, and I have siblings, I should show the controls.
  // BUT `message.childrenIds` refers to the messages that reply TO ME.
  // So `hasMultipleChildren` means "I have multiple responses". This is where we allow the user to switch between *responses*.
  
  // Implementation: 
  // If `message.childrenIds.length > 1`, we show navigation on the bottom of THIS bubble to switch what comes AFTER.
  // But wait, if I switch what comes after, *I* stay the same. The *next* message changes.
  // So the controls should be " < 2 / 5 > " indicating which child path is currently active.
  // We need to know which child is currently in the "active thread".
  
  // Problem: `getThreadFromLeaf` returns a linear list. We don't easily know which child is active just by looking at `message`.
  // We need to check the `currentLeafId` or pass down the "active child ID" from the parent?
  // Actually, the `MessageList` renders the *active* thread.
  // So if I am rendered, one of my children (if any) is also rendered immediately after me.
  // We can find which child is active by looking at `childrenIds` and checking which one is in the `messages` list passed to `MessageList`.
  // But `MessageBubble` is isolated.
  
  // Alternative: Pass `activeChildId` prop?
  // Or use context to find the next message?
  // Let's use `useChat().messages` to find the next message in the thread.
  const { messages: threadMessages } = useChat();
  const myIndex = threadMessages.findIndex(m => m.id === message.id);
  const nextMessage = threadMessages[myIndex + 1];
  const activeChildId = nextMessage?.id;
  
  // Index of the currently shown child among all children
  const currentVersionIndex = activeChildId && message.childrenIds 
    ? message.childrenIds.indexOf(activeChildId) 
    : (message.childrenIds?.length ? message.childrenIds.length - 1 : 0); // Default to last if not found (or 0)

  const totalVersions = message.childrenIds?.length || 0;

  const handlePrevBranch = () => {
      if (!message.childrenIds) return;
      const newIndex = Math.max(0, currentVersionIndex - 1);
      const targetChildId = message.childrenIds[newIndex];
      navigateBranch(targetChildId);
  };

  const handleNextBranch = () => {
       if (!message.childrenIds) return;
       const newIndex = Math.min(message.childrenIds.length - 1, currentVersionIndex + 1);
       const targetChildId = message.childrenIds[newIndex];
       navigateBranch(targetChildId);
  };
  
  // Helper to find leaf (mocked for UI structure)
  const showBranchNav = totalVersions > 1;


  const parsedResult = useMemo(() => {
    if (isUser || isSystem) return null; 
    return parseStreamedContent(message.content);
  }, [message.content, isUser, isSystem]);

  // Special handling for System/Tool messages
  if (isSystem) {
      let hasData = false;
      let toolData: any[] = [];
      let isToolResult = false;
      
      try {
          const parsedContent = JSON.parse(message.content);
          // Check if it looks like a tool result or structured system message
          if (typeof parsedContent === 'object' && parsedContent !== null) {
               isToolResult = true;
              if (Array.isArray(parsedContent.data)) {
                  hasData = true;
                  toolData = parsedContent.data;
              }
          }
      } catch (e) {
          // Ignore parse errors
          isToolResult = false;
      }

      if (!isToolResult) {
           return (
              <div className="flex justify-center w-full my-4">
                  <div className="text-xs text-gray-400 bg-gray-800/30 px-4 py-2 rounded-lg border border-gray-700/30 text-center max-w-lg">
                      <MarkdownRenderer content={message.content} />
                  </div>
              </div>
          );
      }

      const handleViewData = () => {
          if (hasData) {
              openSpreadsheet("Tool Result Data", toolData, false);
          }
      };

      return (
          <div className="flex flex-col items-center justify-center w-full my-3 px-4">
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsSystemDetailsOpen(!isSystemDetailsOpen)}
                    className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50 hover:bg-gray-800 hover:text-gray-400 transition-all cursor-pointer group"
                  >
                      {isSystemDetailsOpen ? (
                          <ChevronDownIcon className="w-3 h-3" />
                      ) : (
                          <CheckIcon className="w-3 h-3 text-green-500" />
                      )}
                      <span className="font-medium">Tool execution completed</span>
                  </button>

                  {hasData && (
                      <button
                          onClick={handleViewData}
                          className="flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-800/30 hover:bg-blue-900/40 hover:text-blue-300 transition-all cursor-pointer"
                          title="View data in spreadsheet"
                      >
                          <TableIcon className="w-3 h-3" />
                          <span className="font-medium">View Data</span>
                      </button>
                  )}
              </div>
              
              {isSystemDetailsOpen && (
                  <div className="mt-2 w-full max-w-xl bg-gray-900 rounded-lg border border-gray-800 p-3 text-xs font-mono overflow-x-auto animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="text-gray-500 mb-1">Tool Output:</div>
                      <pre className="text-gray-300 whitespace-pre-wrap break-all">
                          {message.content}
                      </pre>
                  </div>
              )}
          </div>
      );
  }

  // Fallback if something goes wrong with parsing or it's just text
  const parts = parsedResult?.parts || (isUser ? [] : [{ type: 'text', content: message.content } as any]);
  const thought = parsedResult?.thought;
  const command = parsedResult?.command;

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
        isUser ? 'bg-blue-600' : 'bg-gray-700'
      }`}>
        {isUser ? (
          <UserIcon className="w-5 h-5 text-white" />
        ) : (
            // Agent Avatar Logic
           agent?.avatarUrl ? (
               <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
           ) : (
                <div className="w-5 h-5 text-white text-xs font-bold flex items-center justify-center">
                    {agent ? agent.name[0] : "AI"}
                </div>
           )
        )}
      </div>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {/* Author Name Label */}
        {!isUser && (
            <span className="text-xs text-gray-400 ml-1 mb-1">
                {agent ? agent.name : "Assistant"}
            </span>
        )}
        
        <div className={`px-3 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 border border-gray-700 text-gray-100'
        } w-full relative group`}>
          
          {/* Edit Button for Branching (Only visible on hover for User messages) */}
          {isUser && !isEditing && (
              <button 
                className="absolute -left-8 top-2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit to create new branch"
                onClick={() => {
                    setEditContent(message.content);
                    setIsEditing(true);
                }}
              >
                  <PencilIcon className="w-4 h-4" />
              </button>
          )}

          {isUser ? (
            isEditing ? (
                <div className="flex flex-col gap-2 w-full min-w-[300px]">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-blue-700 text-white text-sm p-2 rounded border border-blue-500 focus:outline-none focus:border-white resize-none"
                        rows={Math.max(3, editContent.split('\n').length)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                if (editContent.trim() !== message.content) {
                                    editUserMessage(message.id, editContent);
                                }
                                setIsEditing(false);
                            }}
                            className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded font-bold hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            Save & Branch
                        </button>
                        <button
                            onClick={() => {
                                setEditContent(message.content);
                                setIsEditing(false);
                            }}
                            className="text-xs text-blue-200 hover:text-white px-2 py-1.5"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )
          ) : (
            <div className="flex flex-col gap-2">
                {/* Reasoning / Chain of Thought Block */}
                {(thought || message.reasoning) && (
                    <div className="mb-2 border-b border-gray-700 pb-2">
                        <button 
                            onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors w-full text-left"
                        >
                            {isReasoningOpen ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                            <span className="font-medium">Reasoning Process</span>
                        </button>
                        {isReasoningOpen && (
                            <div className="mt-2 pl-4 border-l-2 border-gray-600 text-xs text-gray-400 italic whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-200">
                                {thought || message.reasoning}
                            </div>
                        )}
                    </div>
                )}

                {/* Tool Execution Indicator */}
                {command && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-900/50 mb-2">
                        <CogIcon className="w-3 h-3 animate-spin-slow" />
                        <span>Executing: <span className="font-mono font-semibold">{command.tool}</span></span>
                    </div>
                )}

                {/* Main Content (Text & Widgets) */}
                {parts.map((part, index) => {
                    if (part.type === 'text') {
                        return <MarkdownRenderer key={index} content={part.content} />;
                    } else {
                        return (
                          <DynamicWidgetRenderer 
                            key={index} 
                            config={part.config} 
                            onCodeExecuted={(code, result) => submitCodeExecutionResult(code, result)}
                          />
                        );
                    }
                })}

                {/* Structured Inquiry (Confirmation/Selection) */}
                {message.structuredInquiry && (
                    <InquiryRenderer 
                        inquiry={message.structuredInquiry}
                        decision={message.decision}
                        onDecision={(value) => submitDecision(message.structuredInquiry!.id, value)}
                    />
                )}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between w-full mt-1 px-1">
            <span className="text-xs text-gray-500">{formattedTime}</span>
            
            {/* Branch Navigation Controls */}
            {showBranchNav && (
                <div className="flex items-center gap-1 text-xs text-gray-400 select-none">
                    <button 
                        onClick={handlePrevBranch}
                        disabled={currentVersionIndex <= 0}
                        className="p-1 hover:text-white disabled:opacity-30"
                    >
                        <ChevronLeftIcon className="w-3 h-3" />
                    </button>
                    <span>
                        {currentVersionIndex + 1} / {totalVersions}
                    </span>
                    <button 
                        onClick={handleNextBranch}
                        disabled={currentVersionIndex >= totalVersions - 1}
                        className="p-1 hover:text-white disabled:opacity-30"
                    >
                        <ChevronRightIcon className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;

