import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { getFileContent, saveFileContent, createFile, FileItem } from '../services/fileService';
import { FileBrowser } from '../components/editor/FileBrowser';
import { useChat } from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow';
import MarkdownRenderer from '../components/chat/MarkdownRenderer';
import type { Page } from '../types';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { SaveIcon } from '../components/icons/SaveIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { CheckIcon } from '../components/icons/CheckIcon';

interface EditorPageProps {
    onNavigate?: (page: Page, dashboardId?: string) => void;
}

const EditorPage: React.FC<EditorPageProps> = ({ onNavigate }) => {
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [viewMode, setViewMode] = useState<'EDITOR' | 'CHAT' | 'PREVIEW'>('EDITOR');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const { sendMessage, startNewSessionWithContext } = useChat();

    const handleFileSelect = async (file: FileItem) => {
        if (isDirty) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to switch files?")) {
                return;
            }
        }
        
        if (file.type === 'directory') {
             return;
        }

        setIsLoading(true);
        try {
            const content = await getFileContent(file.path);
            setFileContent(content);
            setCurrentFilePath(file.path);
            if (file.path.endsWith('.md')) {
                setViewMode('PREVIEW');
            } else {
                setViewMode('EDITOR');
            }
            setIsDirty(false);
        } catch (error) {
            console.error("Failed to load file content", error);
            alert("Failed to load file content");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setFileContent(value);
            setIsDirty(true);
        }
    };

    const handleSave = async () => {
        if (!currentFilePath) return;
        setIsSaving(true);
        try {
            await saveFileContent(currentFilePath, fileContent);
            setIsDirty(false);
            // Trigger file browser refresh
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Failed to save file", error);
            alert("Failed to save file");
        } finally {
            setIsSaving(false);
        }
    };

    const getLanguage = (path: string) => {
        if (path.endsWith('.sql')) return 'sql';
        if (path.endsWith('.md')) return 'markdown';
        return 'plaintext';
    };

    const handleChatWithFile = async () => {
        if (!currentFilePath || !fileContent) return;
        
        const message = `Context: ${currentFilePath}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nI want to discuss this file.`;
        startNewSessionWithContext(message);
        setViewMode('CHAT');
    };

    const handleTranslateFile = async () => {
        if (!currentFilePath || !fileContent) return;

        const message = `Context: ${currentFilePath}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease translate this SQL Server code to Databricks SQL.`;
        sendMessage(message);
        setViewMode('CHAT');
    };

    const handleExplainFile = async () => {
        if (!currentFilePath || !fileContent) return;

        const fileName = currentFilePath.split('/').pop() || 'file';
        const nameWithoutExt = fileName.includes('.') ? fileName.split('.').slice(0, -1).join('.') : fileName;
        const newName = `${nameWithoutExt}_explanation.md`;
        
        // Determine parent directory
        const parentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
        const newPath = `${parentDir}/${newName}`;

        setIsCreating(true);
        try {
            const explanationContent = `# Explanation for ${fileName}\n\nThis is a placeholder for the explanation of ${fileName}.\n\nOriginal content length: ${fileContent.length} characters.`;
            await createFile(newPath, explanationContent);
            
            // Refresh and select
            setRefreshTrigger(prev => prev + 1);
            
            const newFile: FileItem = {
                name: newName,
                path: newPath,
                type: 'file'
            };
            
            await handleFileSelect(newFile);
            setShowActionMenu(false);
        } catch (error) {
            console.error("Failed to create explanation file", error);
            alert("Failed to create explanation file");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex h-full bg-gray-900 text-white">
            {/* Sidebar - File List */}
            <div className="w-64 border-r border-gray-700 flex flex-col">
                <FileBrowser 
                    onSelectFile={handleFileSelect} 
                    currentFilePath={currentFilePath}
                    refreshTrigger={refreshTrigger}
                />
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4 bg-gray-900 shadow-sm z-10">
                    <div className="flex items-center gap-3 overflow-hidden">
                         <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                           <DocumentTextIcon className="w-5 h-5" />
                         </div>
                         <div className="flex flex-col overflow-hidden">
                           <div className="text-sm font-medium text-white truncate max-w-xl" title={currentFilePath || "No file selected"}>
                             {currentFilePath || "No file selected"}
                           </div>
                           {currentFilePath && (
                              <div className="text-xs flex items-center gap-2 mt-0.5">
                                 {isDirty ? (
                                    <span className="flex items-center text-amber-400 gap-1.5 bg-amber-900/20 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                                       <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                       Unsaved Changes
                                    </span>
                                 ) : (
                                    <span className="flex items-center text-gray-500 gap-1">
                                       <CheckIcon className="w-3 h-3" />
                                       Saved
                                    </span>
                                 )}
                              </div>
                           )}
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {currentFilePath && currentFilePath.endsWith('.md') && (
                            <button
                                onClick={() => setViewMode(viewMode === 'PREVIEW' ? 'EDITOR' : 'PREVIEW')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                                {viewMode === 'PREVIEW' ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h4.59l-2.1 2.1a.75.75 0 101.06 1.06l3.38-3.38a.75.75 0 000-1.06l-3.38-3.38a.75.75 0 10-1.06 1.06l2.1 2.1H6.75z" clipRule="evenodd" />
                                        </svg>
                                        <span>Show Code</span>
                                    </>
                                ) : (
                                    <>
                                        <DocumentTextIcon className="w-4 h-4" />
                                        <span>Show Preview</span>
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!currentFilePath || isSaving}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                !currentFilePath 
                                    ? 'bg-gray-800 text-gray-600 border-gray-800 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 hover:border-blue-400 shadow-lg shadow-blue-900/20'
                            }`}
                        >
                            <SaveIcon className="w-4 h-4" />
                            <span>{isSaving ? "Saving..." : "Save"}</span>
                        </button>

                        <div className="relative ml-1">
                            {showActionMenu && (
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowActionMenu(false)}
                                />
                            )}
                            <button
                                onClick={() => setShowActionMenu(!showActionMenu)}
                                disabled={!currentFilePath}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border z-50 relative ${
                                    !currentFilePath 
                                        ? 'bg-gray-800 text-gray-600 border-gray-800 cursor-not-allowed' 
                                        : showActionMenu 
                                            ? 'bg-gray-700 text-white border-gray-600'
                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                <span>Actions</span>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showActionMenu ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showActionMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-700 mb-1">
                                        AI Assistance
                                    </div>
                                    <button
                                        onClick={() => { setShowActionMenu(false); handleChatWithFile(); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                    >
                                        Chat with file
                                    </button>
                                    <button
                                        onClick={() => { setShowActionMenu(false); setViewMode('EDITOR'); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                    >
                                        Show Code
                                    </button>
                                    <button
                                        onClick={() => { setShowActionMenu(false); handleExplainFile(); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                    >
                                        Explain file
                                    </button>
                                    <button
                                        onClick={() => { setShowActionMenu(false); handleTranslateFile(); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                    >
                                        Translate SQL
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10 opacity-80">
                            <span>Loading...</span>
                        </div>
                    ) : viewMode === 'CHAT' ? (
                        <ChatWindow hideHeader={true} />
                    ) : viewMode === 'PREVIEW' ? (
                        <div className="h-full overflow-y-auto p-8 bg-[#1e1e1e]">
                            <div className="max-w-3xl mx-auto">
                                <MarkdownRenderer content={fileContent} />
                            </div>
                        </div>
                    ) : currentFilePath ? (
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            path={currentFilePath}
                            defaultLanguage={getLanguage(currentFilePath)}
                            language={getLanguage(currentFilePath)}
                            value={fileContent}
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: 'on',
                                automaticLayout: true,
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a file from the sidebar to start editing
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
