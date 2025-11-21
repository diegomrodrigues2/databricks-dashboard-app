import React, { useMemo, useState } from 'react';
import { UserIcon } from '../icons/UserIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { CogIcon } from '../icons/CogIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { TableIcon } from '../icons/TableIcon';
import type { Message } from '../../types';
import MarkdownRenderer from './MarkdownRenderer';
import { parseStreamedContent } from '../../utils/streamParser';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';
import { useSpreadsheet } from '../../hooks/useSpreadsheet';
import { useChat } from '../../hooks/useChat';
import InquiryRenderer from './InquiryRenderer';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const formattedTime = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const [isSystemDetailsOpen, setIsSystemDetailsOpen] = useState(false);
  const { openSpreadsheet } = useSpreadsheet();
  const { submitDecision, submitCodeExecutionResult } = useChat();

  const parsedResult = useMemo(() => {
    if (isUser || isSystem) return null; 
    return parseStreamedContent(message.content);
  }, [message.content, isUser, isSystem]);

  // Special handling for System/Tool messages
  if (isSystem) {
      let hasData = false;
      let toolData: any[] = [];
      
      try {
          const parsedContent = JSON.parse(message.content);
          if (parsedContent && Array.isArray(parsedContent.data)) {
              hasData = true;
              toolData = parsedContent.data;
          }
      } catch (e) {
          // Ignore parse errors
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
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-600' : 'bg-gray-700'
      }`}>
        {isUser ? (
          <UserIcon className="w-5 h-5 text-white" />
        ) : (
          <div className="w-5 h-5 text-white text-xs font-bold flex items-center justify-center">AI</div>
        )}
      </div>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className={`px-3 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 border border-gray-700 text-gray-100'
        } w-full`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
        <span className="text-xs text-gray-500 mt-1 px-1">{formattedTime}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
