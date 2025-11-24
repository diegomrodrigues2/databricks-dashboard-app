
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { ChatProvider } from './hooks/useChat';
import { SpreadsheetProvider } from './hooks/useSpreadsheet';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ChatProvider>
        <SpreadsheetProvider>
          <App />
        </SpreadsheetProvider>
      </ChatProvider>
    </AuthProvider>
  </React.StrictMode>
);
