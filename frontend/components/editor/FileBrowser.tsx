import React, { useState, useEffect } from 'react';
import { listFiles, FileItem, createFile, validateFilePath } from '../../services/fileService';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

interface FileBrowserProps {
    onSelectFile: (file: FileItem) => void;
    currentFilePath: string | null;
    initialPath?: string;
    refreshTrigger?: number; // When this changes, refresh the file list
}

// Simple Folder Icon component since we don't have one yet
const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
    </svg>
);

const FileTreeItem: React.FC<{
    item: FileItem;
    level: number;
    onSelect: (file: FileItem) => void;
    currentFilePath: string | null;
}> = ({ item, level, onSelect, currentFilePath }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [children, setChildren] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.type === 'directory') {
            if (!isExpanded && !hasLoaded) {
                setIsLoading(true);
                try {
                    const files = await listFiles(item.path);
                    // Sort: directories first, then files
                    files.sort((a, b) => {
                        if (a.type === b.type) return a.name.localeCompare(b.name);
                        return a.type === 'directory' ? -1 : 1;
                    });
                    setChildren(files);
                    setHasLoaded(true);
                } catch (error) {
                    console.error("Failed to load directory", error);
                } finally {
                    setIsLoading(false);
                }
            }
            setIsExpanded(!isExpanded);
        } else {
            onSelect(item);
        }
    };

    const isSelected = currentFilePath === item.path;

    return (
        <div>
            <div 
                className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-800 ${isSelected ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
                style={{ paddingLeft: `${level * 12 + 4}px` }}
                onClick={handleToggle}
            >
                {item.type === 'directory' && (
                    <span className="mr-1 text-gray-500">
                        {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                        )}
                    </span>
                )}
                {item.type === 'directory' ? (
                    <FolderIcon className="w-4 h-4 mr-2 text-yellow-600" />
                ) : (
                    <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-400" />
                )}
                <span className="truncate text-sm select-none">{item.name}</span>
                {isLoading && <span className="ml-2 text-xs text-gray-600">...</span>}
            </div>
            
            {isExpanded && item.type === 'directory' && (
                <div>
                    {children.map((child) => (
                        <FileTreeItem
                            key={child.path}
                            item={child}
                            level={level + 1}
                            onSelect={onSelect}
                            currentFilePath={currentFilePath}
                        />
                    ))}
                    {children.length === 0 && hasLoaded && (
                        <div 
                            className="text-gray-600 text-xs py-1"
                            style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
                        >
                            (Empty)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const FileBrowser: React.FC<FileBrowserProps> = ({ onSelectFile, currentFilePath, initialPath = "dbfs:/FileStore", refreshTrigger }) => {
    const [rootFiles, setRootFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showNewFileModal, setShowNewFileModal] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [newFileParentDir, setNewFileParentDir] = useState(initialPath);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        loadRoot();
    }, [initialPath, refreshTrigger]);

    const loadRoot = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use initialPath which defaults to dbfs:/FileStore
            const pathToList = initialPath;
            const files = await listFiles(pathToList);
             // Sort: directories first, then files
            files.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            });
            setRootFiles(files);
        } catch (err) {
            setError("Failed to load files.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewFileClick = () => {
        setNewFileName('');
        setNewFileParentDir(initialPath);
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
            
            // Refresh the file list
            await loadRoot();
            
            // Create a FileItem to pass to onSelectFile
            const newFile: FileItem = {
                name: newFileName.trim(),
                path: fullPath,
                type: 'file'
            };
            
            // Open the new file in the editor
            onSelectFile(newFile);
            
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

    if (loading) {
        return <div className="p-4 text-gray-400 text-sm">Loading files...</div>;
    }

    if (error) {
        return (
            <div className="p-4 text-red-400 text-sm">
                {error}
                <button onClick={loadRoot} className="block mt-2 text-blue-400 hover:underline">Retry</button>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700 select-none">
                <div className="h-14 px-3 border-b border-gray-700 font-semibold text-sm text-gray-300 flex justify-between items-center shrink-0">
                    <span>Explorer</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleNewFileClick} 
                            className="text-gray-500 hover:text-gray-300" 
                            title="New File"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                        </button>
                        <button onClick={loadRoot} className="text-gray-500 hover:text-gray-300" title="Refresh">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.433l-.31-.311a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.312h-2.433a.75.75 0 000 1.5h4.242z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {rootFiles.map(file => (
                        <FileTreeItem
                            key={file.path}
                            item={file}
                            level={0}
                            onSelect={onSelectFile}
                            currentFilePath={currentFilePath}
                        />
                    ))}
                    {rootFiles.length === 0 && (
                        <div className="p-4 text-gray-500 text-sm text-center">No files found</div>
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
        </>
    );
};

