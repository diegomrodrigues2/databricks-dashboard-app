const BASE_URL = '/api/files';
const LIST_URL = '/api/listdir';

export interface FileItem {
    name: string;
    type: 'file' | 'directory';
    path: string;
}

export const listFiles = async (path?: string): Promise<FileItem[]> => {
    const url = path ? `${LIST_URL}?path=${encodeURIComponent(path)}` : LIST_URL;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to list files');
    }
    const data = await response.json();
    return data.files || [];
};

export const getFileContent = async (path: string): Promise<string> => {
    const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch file content');
    }
    const data = await response.json();
    return data.content || '';
};

export const saveFileContent = async (path: string, content: string): Promise<void> => {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, content }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'Failed to save file');
    }
};

export const validateFilePath = (path: string): { valid: boolean; error?: string } => {
    if (!path || path.trim() === '') {
        return { valid: false, error: 'File path cannot be empty' };
    }
    
    // Ensure path starts with dbfs:/
    if (!path.startsWith('dbfs:/')) {
        return { valid: false, error: 'Path must start with dbfs:/' };
    }
    
    // Check for invalid characters in the path after dbfs:/
    // Allow : only as part of dbfs:/ prefix
    const pathAfterPrefix = path.substring(6); // Everything after "dbfs:/"
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(pathAfterPrefix)) {
        return { valid: false, error: 'Path contains invalid characters' };
    }
    
    // Ensure path doesn't end with /
    if (path.endsWith('/')) {
        return { valid: false, error: 'File path cannot end with /' };
    }
    
    return { valid: true };
};

export const createFile = async (path: string, content: string = ''): Promise<void> => {
    const validation = validateFilePath(path);
    if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file path');
    }
    
    // Reuse saveFileContent which will create the file if it doesn't exist
    await saveFileContent(path, content);
};

