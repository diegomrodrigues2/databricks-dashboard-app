import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
// Load JSON syntax highlighting - Prism.js includes JSON support
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { WidgetConfig } from '../../types';
import { CheckIcon } from '../icons/CheckIcon';
import { XIcon } from '../icons/XIcon';

interface WidgetConfigEditorProps {
    config: WidgetConfig;
    onSave: (updatedConfig: WidgetConfig) => void;
    onCancel: () => void;
}

export const WidgetConfigEditor: React.FC<WidgetConfigEditorProps> = ({ 
    config, 
    onSave, 
    onCancel 
}) => {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(true);

    // Initialize JSON text from config
    useEffect(() => {
        try {
            const formatted = JSON.stringify(config, null, 2);
            setJsonText(formatted);
            setError(null);
            setIsValid(true);
        } catch (err) {
            setError('Failed to serialize widget config');
            setIsValid(false);
        }
    }, [config]);

    // Validate JSON on change
    useEffect(() => {
        if (!jsonText.trim()) {
            setIsValid(false);
            setError(null);
            return;
        }

        try {
            const parsed = JSON.parse(jsonText);
            // Basic validation: ensure it has required fields
            if (!parsed.id || !parsed.type || !parsed.title) {
                setError('Missing required fields: id, type, or title');
                setIsValid(false);
            } else {
                setError(null);
                setIsValid(true);
            }
        } catch (err: any) {
            setError(err.message || 'Invalid JSON');
            setIsValid(false);
        }
    }, [jsonText]);

    const handleSave = () => {
        if (!isValid || error) return;

        try {
            const parsed = JSON.parse(jsonText) as WidgetConfig;
            onSave(parsed);
        } catch (err: any) {
            setError(err.message || 'Failed to parse JSON');
        }
    };

    const highlight = (code: string) => {
        try {
            // Try JSON first, fallback to javascript if JSON not available
            const grammar = Prism.languages.json || Prism.languages.javascript || Prism.languages.plaintext;
            return Prism.highlight(code, grammar, 'json');
        } catch {
            return code;
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col shadow-lg h-full">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-800 border-gray-700">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 uppercase bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">JSON</span>
                    <h3 className="text-sm font-medium text-gray-200">Edit Widget Configuration</h3>
                    {error && (
                        <span className="text-xs text-red-400 font-mono">{error}</span>
                    )}
                    {isValid && !error && (
                        <span className="text-xs text-green-400 font-mono">Valid JSON</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!isValid || !!error}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                            isValid && !error
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <CheckIcon className="w-3 h-3" />
                        Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                    >
                        <XIcon className="w-3 h-3" />
                        Cancel
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="relative flex-1 min-h-[200px] max-h-[500px] overflow-auto bg-[#2d2d2d]">
                <div className="font-mono text-sm">
                    <Editor
                        value={jsonText}
                        onValueChange={setJsonText}
                        highlight={highlight}
                        padding={16}
                        style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 14,
                            minHeight: '200px',
                            backgroundColor: '#2d2d2d',
                            color: '#ccc'
                        }}
                        textareaClassName="focus:outline-none"
                    />
                </div>
            </div>

            {/* Footer Status */}
            <div className={`px-4 py-1 text-xs border-t ${
                error 
                    ? 'bg-red-900/20 border-red-900 text-red-400' 
                    : isValid 
                        ? 'bg-green-900/20 border-green-900 text-green-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}>
                {error ? `Error: ${error}` : isValid ? 'JSON is valid. Click Save to apply changes.' : 'Please fix JSON errors before saving.'}
            </div>
        </div>
    );
};

export default WidgetConfigEditor;

