import React, { useRef, useEffect, useState } from 'react';
import { marked } from 'marked';
import { BoldIcon } from '../icons/BoldIcon';
import { ItalicIcon } from '../icons/ItalicIcon';
import { ListBulletIcon } from '../icons/ListBulletIcon';
import { ListOrderedIcon } from '../icons/ListOrderedIcon';
import { LinkIcon } from '../icons/LinkIcon';

interface RichTextInputProps {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    rows?: number;
    error?: string;
}

const RichTextInput: React.FC<RichTextInputProps> = ({ name, value, onChange, rows = 8, error }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (editorRef.current && value && !isInitialized) {
            try {
                const htmlValue = marked.parse(value);
                editorRef.current.innerHTML = htmlValue;
                setIsInitialized(true);
            } catch (e) {
                console.error("Error parsing markdown:", e);
                editorRef.current.innerHTML = `<p>${value.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
            }
        }
    }, [value, isInitialized]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(name, e.currentTarget.innerHTML);
    };

    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        if (editorRef.current) {
            onChange(name, editorRef.current.innerHTML);
        }
    };

    const handleLink = () => {
        const selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
            alert('Please select text to create a link.');
            return;
        }
        const url = prompt('Enter the URL:');
        if (url) {
            execCmd('createLink', url);
        }
    };
    
    const rowHeight = 24;
    const minHeight = (rows || 8) * rowHeight;

    return (
        <div className={`bg-gray-800 border rounded-md focus-within:ring-2 ${error ? 'border-red-500 focus-within:ring-red-500' : 'border-gray-600 focus-within:ring-white'}`}>
            <div className="flex flex-wrap items-center p-2 border-b border-gray-700">
                <button type="button" onClick={() => execCmd('bold')} className="p-2 rounded hover:bg-gray-700 text-gray-300" title="Bold (Ctrl+B)">
                    <BoldIcon className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => execCmd('italic')} className="p-2 rounded hover:bg-gray-700 text-gray-300" title="Italic (Ctrl+I)">
                    <ItalicIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-gray-700 mx-2"></div>
                <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded hover:bg-gray-700 text-gray-300" title="Bulleted List">
                    <ListBulletIcon className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => execCmd('insertOrderedList')} className="p-2 rounded hover:bg-gray-700 text-gray-300" title="Numbered List">
                    <ListOrderedIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-gray-700 mx-2"></div>
                <button type="button" onClick={handleLink} className="p-2 rounded hover:bg-gray-700 text-gray-300" title="Create Link">
                    <LinkIcon className="w-4 h-4" />
                </button>
            </div>
            <div
                id={name}
                ref={editorRef}
                onInput={handleInput}
                contentEditable={true}
                className="w-full px-3 py-2 focus:outline-none overflow-y-auto markdown-content"
                style={{ minHeight: `${minHeight}px` }}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
        </div>
    );
};

export default RichTextInput;