import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css'; // Use a dark theme

import { CodeExecutorWidgetConfig } from '../../types';
import TableChartComponent from '../charts/TableChartComponent'; // Using TableChartComponent as a simple grid
import { ExclamationTriangleIcon } from '../icons/ExclamationTriangleIcon';
import { executeCodeSafe, analyzeRisk } from '../../services/executionService';

interface CodeExecutionWidgetProps {
    config: CodeExecutorWidgetConfig;
    onExecute?: (code: string, result: any[]) => void;
}

export const CodeExecutionWidget: React.FC<CodeExecutionWidgetProps> = ({ config, onExecute }) => {
    // Enforce safety defaults immediately on init
    const riskLevel = analyzeRisk(config.code || '');
    const safeAutoExecute = config.autoExecute && riskLevel === 'low';

    const [code, setCode] = useState(config.code || '');
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'editor' | 'result'>('editor');
    const [currentRisk, setCurrentRisk] = useState<'low' | 'high'>(riskLevel);

    useEffect(() => {
        if (safeAutoExecute) {
            handleExecute();
        }
    }, []);

    // Re-analyze risk when code changes
    useEffect(() => {
        setCurrentRisk(analyzeRisk(code));
    }, [code]);

    const handleExecute = async () => {
        if (currentRisk === 'high') {
            const confirmed = window.confirm("Security Warning: This code contains destructive operations (DROP, DELETE, etc.). Are you sure you want to execute it?");
            if (!confirmed) return;
        }

        setIsExecuting(true);
        setError(null);
        try {
            const executionResult = await executeCodeSafe(code, config.language);
            
            if (executionResult.success) {
                setResult(executionResult.data || []);
                setViewMode('result');
                if (onExecute && executionResult.data) {
                    onExecute(code, executionResult.data);
                }
            } else {
                throw new Error(executionResult.error);
            }
        } catch (err: any) {
            console.error("Execution failed:", err);
            setError(err.message || "Execution failed");
        } finally {
            setIsExecuting(false);
        }
    };

    const highlight = (code: string) => {
        const grammar = config.language === 'sql' ? Prism.languages.sql : Prism.languages.python;
        return Prism.highlight(code, grammar || Prism.languages.plaintext, config.language);
    };

    // Helper to infer columns for TableChartComponent from the first result item
    const getTableConfig = () => {
        if (!result || result.length === 0) return null;
        const firstItem = result[0];
        const columns = Object.keys(firstItem).map(key => ({
            key,
            header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            textAlign: typeof firstItem[key] === 'number' ? 'right' : 'left' as 'right' | 'left' | 'center'
        }));
        
        // We create a temporary config to pass to TableChartComponent
        return {
            ...config,
            type: 'table' as const,
            rowCategoryColumn: columns[0]?.key || 'id', // Fallback
            columns: columns
        };
    };

    return (
        <div className={`bg-gray-900 border rounded-lg overflow-hidden flex flex-col shadow-lg ${currentRisk === 'high' ? 'border-orange-500/50' : 'border-gray-700'}`}>
            {/* Header / Toolbar */}
            <div className={`flex items-center justify-between px-4 py-2 border-b ${currentRisk === 'high' ? 'bg-orange-900/10 border-orange-500/30' : 'bg-gray-800 border-gray-700'}`}>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 uppercase bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">{config.language}</span>
                    <h3 className="text-sm font-medium text-gray-200">{config.title}</h3>
                    
                    {currentRisk === 'high' && (
                        <div className="flex items-center gap-1 text-orange-400 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-900/20 border border-orange-500/30 animate-pulse">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            <span>High Risk Operation</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                   {result && (
                        <button
                            onClick={() => setViewMode(viewMode === 'editor' ? 'result' : 'editor')}
                            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        >
                            {viewMode === 'editor' ? 'Show Result' : 'Show Code'}
                        </button>
                    )}
                    <button
                        onClick={handleExecute}
                        disabled={isExecuting || (!config.isEditable && !safeAutoExecute)}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                            isExecuting
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : currentRisk === 'high' 
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                         {isExecuting ? (
                            <>
                                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running...
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Run
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative min-h-[150px] max-h-[500px] overflow-auto bg-[#2d2d2d]">
                {viewMode === 'editor' ? (
                     <div className="font-mono text-sm">
                        <Editor
                            value={code}
                            onValueChange={code => config.isEditable && setCode(code)}
                            highlight={code => highlight(code)}
                            padding={16}
                            disabled={!config.isEditable}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 14,
                                minHeight: '150px',
                                backgroundColor: '#2d2d2d', // Match prism-tomorrow bg
                                color: '#ccc'
                            }}
                            textareaClassName="focus:outline-none"
                        />
                    </div>
                ) : (
                    <div className="bg-gray-900 h-full overflow-auto">
                        {result && result.length > 0 ? (
                            <div className="p-2">
                                <TableChartComponent 
                                    config={getTableConfig() as any} 
                                    data={result} 
                                    width={600} // Estimate, will be responsive in container
                                    height={300}
                                />
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No data returned or empty result set.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Status */}
            {(result || error) && viewMode === 'editor' && (
                <div className={`px-4 py-1 text-xs border-t ${error ? 'bg-red-900/20 border-red-900 text-red-400' : 'bg-green-900/20 border-green-900 text-green-400'}`}>
                    {error ? `Error: ${error}` : `Execution successful. ${result?.length} rows returned.`}
                </div>
            )}
        </div>
    );
};

export default CodeExecutionWidget;
