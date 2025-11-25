import React, { useCallback } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SessionSetup from './SessionSetup';
import { useChat } from '../../hooks/useChat';
import { Message, TreeMessage } from '../../types';

interface ChatWindowProps {
  hideHeader?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ hideHeader = false }) => {
  const { messages, sendMessage, activeAgentId } = useChat();
  
  // Simple heuristic: If there are no messages, show setup.
  // In a real app, we might want a dedicated 'isConfigured' flag in the session state.
  const showSetup = messages.length === 0;

  // We need to pass a way for SessionSetup to "start" the chat.
  // Since we don't have a direct "setConfig" action exposed yet that persists,
  // we can just start the chat with a welcome message from the agent.
  // However, SessionSetup defines the agent.
  
  // Refactoring Strategy:
  // SessionSetup should handle the "Start" by calling a function that:
  // 1. Sets the agent (already does via switchAgent)
  // 2. Adds an initial system/assistant message to "boot" the chat.
  
  // But SessionSetup component is inside ChatWindow.
  // Let's pass a callback or let SessionSetup use the hook.
  // SessionSetup already uses useChat.
  
  // To make the transition smooth, we need SessionSetup to trigger something that makes messages.length > 0.
  
  const handleSessionStart = useCallback(async (welcomeMessage: string) => {
       // This is a bit of a hack to bypass the fact that we don't have a 'startSession' action.
       // We simulate the agent saying hello.
       // We can't directly inject an assistant message from here easily without exposing dispatch.
       // But we can use sendMessage if we want the USER to start.
       // OR we can rely on the fact that once the user types in ChatInput (which is hidden), it starts.
       
       // Better UX: Show setup. When "Start" is clicked, we hide setup and show empty chat?
       // No, empty chat looks dead.
       // Let's make SessionSetup *inject* the first message.
       
       // Since we don't have `addAssistantMessage` exposed in Context (it is internal to useChat),
       // We will just render SessionSetup conditionally.
       // Wait, if we render SessionSetup, we don't render MessageList.
       // So when we click "Start", we need to update some LOCAL state in ChatWindow to hide Setup?
       // No, that state should be in the Session (persisted).
       
       // Let's use a local state override for now, assuming the user just configured it for this view session.
       // But if they refresh, it would come back?
       // Ideally, `messages.length > 0` is the source of truth.
       // So SessionSetup should call `sendMessage` (as user) or we expose `addSystemMessage`.
       
       // Let's try a simpler approach:
       // The Setup screen is just a "modal" over the empty list.
       // Once confirmed, we start an empty session.
       // But `messages.length` is 0 for empty session.
       // So we need a flag `sessionConfigured`.
       // Since we didn't add that to the global store yet (Phase 1 only added Types, Phase 3 didn't add `isConfigured` to state),
       // let's rely on a local state here for the UI transition.
  }, []);

  const [isConfigured, setIsConfigured] = React.useState(false);

  // If we have messages, we are definitely configured.
  // If we don't, we rely on local state.
  const showLobby = messages.length === 0 && !isConfigured;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {!hideHeader && <ChatHeader />}
      
      {showLobby ? (
          <div className="flex-grow overflow-hidden">
             {/* We wrap SessionSetup to capture the "Start" event */}
             <SessionSetupWrapper onStart={() => setIsConfigured(true)} />
          </div>
      ) : (
          <>
            <MessageList />
            <ChatInput />
          </>
      )}
    </div>
  );
};

// Small wrapper to handle the "Start" click from inside SessionSetup
// Since SessionSetup handles the logic, we just need to know when it's done.
// But SessionSetup doesn't accept props in my previous `write` call. 
// I need to modify SessionSetup to accept onStart or modify how I call it.
// Actually, I wrote SessionSetup to take NO props.
// Let's rewrite SessionSetup slightly or just wrap it.
// Wait, I can't modify SessionSetup props without rewriting the file I just wrote.
// I will rewrite SessionSetup in the next step if needed, OR I can just edit ChatWindow to pass the prop if I update SessionSetup signature.
// Let's check SessionSetup again. It has `confirmSetup` but it doesn't take props.

// Strategy: I will update SessionSetup to accept an `onStart` prop.
const SessionSetupWrapper: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    // This is a bit tricky because I can't pass onStart to SessionSetup if it doesn't define it.
    // I will implicitly assume I can update SessionSetup to take props.
    // For now, I will modify SessionSetup in the same turn.
    return <SessionSetup onStart={onStart} />;
};

export default ChatWindow;
