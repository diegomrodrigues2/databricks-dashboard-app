import React, { useMemo } from 'react';
import { UserIcon } from '../icons/UserIcon';
import type { Message } from '../../types';
import MarkdownRenderer from './MarkdownRenderer';
import { parseStreamedContent } from '../../utils/streamParser';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const formattedTime = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const parsedContent = useMemo(() => {
    if (isUser) return null; // No need to parse user messages
    return parseStreamedContent(message.content);
  }, [message.content, isUser]);

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
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="flex flex-col gap-2">
                {parsedContent?.map((part, index) => {
                    if (part.type === 'text') {
                        return <MarkdownRenderer key={index} content={part.content} />;
                    } else {
                        return <DynamicWidgetRenderer key={index} config={part.config} />;
                    }
                })}
                
                {/* If parsing returns empty (e.g. start token only), show spinner or nothing? 
                    The parser logic handles partial streams by holding back the widget part.
                    But if we want to show a "Thinking..." or "Generating Chart..." state 
                    when the content ends with WIDGET_START_TOKEN, we could detect it here.
                */}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-500 mt-1 px-1">{formattedTime}</span>
      </div>
    </div>
  );
};

export default MessageBubble;

