import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { getFileContent, saveFileContent, createFile, validateFilePath, FileItem } from '../services/fileService';
import { FileBrowser } from '../components/editor/FileBrowser';
import { useChat } from '../hooks/useChat';
import type { Page } from '../types';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { SaveIcon } from '../components/icons/SaveIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { CheckIcon } from '../components/icons/CheckIcon';

interface EditorPageProps {
    onNavigate?: (page: Page, dashboardId?: string) => void;
}

const EditorPage: React.FC<EditorPageProps> = ({ onNavigate }) => {
    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showNewFileModal, setShowNewFileModal] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFileParentDir, setNewFileParentDir] = useState('dbfs:/FileStore');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const { sendMessage } = useChat();

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

    const handleNewFileClick = () => {
        setNewFileName('');
        setNewFileParentDir('dbfs:/FileStore');
        setCreateError(null);
        setShowNewFileModal(true);
    };

    const handleCreateFile = async () => {
        if (!newFileName.trim()) {
            setCreateError('File name cannot be empty');
            return;
        }

        // Construct full path
        const parentPath = newFileParentDir.endsWith('/') 
            ? newFileParentDir.slice(0, -1) 
            : newFileParentDir;
        const fullPath = `${parentPath}/${newFileName.trim()}`;

        // Validate path
        const validation = validateFilePath(fullPath);
        if (!validation.valid) {
            setCreateError(validation.error || 'Invalid file path');
            return;
        }

        setIsCreating(true);
        setCreateError(null);
        try {
            await createFile(fullPath, '');
            
            // Create a FileItem to pass to handleFileSelect
            const newFile: FileItem = {
                name: newFileName.trim(),
                path: fullPath,
                type: 'file'
            };
            
            // Trigger file browser refresh
            setRefreshTrigger(prev => prev + 1);
            
            // Open the new file in the editor
            await handleFileSelect(newFile);
            
            // Close modal
            setShowNewFileModal(false);
            setNewFileName('');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create file';
            setCreateError(errorMessage);
            console.error('Failed to create file', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleModalKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isCreating) {
            handleCreateFile();
        } else if (e.key === 'Escape') {
            setShowNewFileModal(false);
            setCreateError(null);
        }
    };

    const getLanguage = (path: string) => {
        if (path.endsWith('.sql')) return 'sql';
        if (path.endsWith('.md')) return 'markdown';
        return 'plaintext';
    };

    const handleChatWithFile = async () => {
        if (!currentFilePath || !fileContent || !onNavigate) return;
        
        const message = `Context: ${currentFilePath}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nI want to discuss this file.`;
        sendMessage(message);
        onNavigate('chat');
    };

    const handleTranslateFile = async () => {
        if (!currentFilePath || !fileContent || !onNavigate) return;

        const message = `Context: ${currentFilePath}\n\n\`\`\`\n${fileContent}\n\`\`\`\n\nPlease translate this SQL Server code to Databricks SQL.`;
        sendMessage(message);
        onNavigate('chat');
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
                        <button
                            onClick={handleNewFileClick}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600"
                            title="Create New File"
                        >
                            <PlusCircleIcon className="w-4 h-4" />
                            <span>New File</span>
                        </button>
                        
                        <div className="h-6 w-px bg-gray-700 mx-1" />

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

            {/* New File Modal */}
            {showNewFileModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => {
                        if (!isCreating) {
                            setShowNewFileModal(false);
                            setCreateError(null);
                        }
                    }}
                >
                    <div 
                        className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-96 max-w-[90vw]"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={handleModalKeyDown}
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">Create New File</h2>
                        
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">Parent Directory</label>
                            <input
                                type="text"
                                value={newFileParentDir}
                                onChange={(e) => setNewFileParentDir(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                                placeholder="dbfs:/FileStore"
                                disabled={isCreating}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">File Name</label>
                            <input
                                type="text"
                                value={newFileName}
                                onChange={(e) => {
                                    setNewFileName(e.target.value);
                                    setCreateError(null);
                                }}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                                placeholder="example.sql"
                                autoFocus
                                disabled={isCreating}
                                onKeyDown={handleModalKeyDown}
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter filename with extension (e.g., query.sql, script.py)</p>
                        </div>

                        {createError && (
                            <div className="mb-4 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
                                {createError}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowNewFileModal(false);
                                    setCreateError(null);
                                }}
                                disabled={isCreating}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFile}
                                disabled={isCreating || !newFileName.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditorPage;
