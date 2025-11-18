import React, { useRef, useState } from 'react';
import { PaperClipIcon } from '../icons/PaperClipIcon';

interface FileInputProps {
    name: string;
    onChange: (name: string, value: File | null) => void;
    accept?: string;
    error?: string;
}

const FileInput: React.FC<FileInputProps> = ({ name, onChange, accept, error }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFileName(file ? file.name : '');
        onChange(name, file);
    };

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div>
            <input
                id={name}
                name={name}
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                accept={accept}
                className="hidden"
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleButtonClick}
                    className={`flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-white'}`}
                >
                    <PaperClipIcon className="w-4 h-4" />
                    Choose file
                </button>
                <span className="text-gray-400 truncate">{fileName || 'No file selected'}</span>
            </div>
        </div>
    );
};

export default FileInput;
