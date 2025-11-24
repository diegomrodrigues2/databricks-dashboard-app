import React, { useState } from 'react';
import { StructuredInquiry, InquiryOption } from '../../types';
import { CheckIcon } from '../icons/CheckIcon';
import { XIcon } from '../icons/XIcon';
import { ExclamationTriangleIcon } from '../icons/ExclamationTriangleIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { PencilIcon } from '../icons/PencilIcon';

interface InquiryRendererProps {
    inquiry: StructuredInquiry;
    decision?: {
        value: any;
        timestamp: Date;
    };
    onDecision: (value: any) => void;
}

const InquiryRenderer: React.FC<InquiryRendererProps> = ({ inquiry, decision, onDecision }) => {
    const isDecided = !!decision;
    const [isMetaOpen, setIsMetaOpen] = useState(false);
    const [textInput, setTextInput] = useState(inquiry.defaultValue || '');

    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'trash': return <TrashIcon className="w-4 h-4" />;
            case 'check': return <CheckIcon className="w-4 h-4" />;
            case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />;
            case 'pencil': return <PencilIcon className="w-4 h-4" />;
            default: return null;
        }
    };

    const renderMeta = () => {
        if (!inquiry.meta) return null;
        
        const keys = Object.keys(inquiry.meta);
        if (keys.length === 0) return null;

        return (
            <div className="mt-3 border rounded border-gray-700 bg-gray-900/50 overflow-hidden">
                <button 
                    onClick={() => setIsMetaOpen(!isMetaOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 transition-colors"
                >
                    <span className="font-mono uppercase tracking-wider">Context / Details</span>
                    {isMetaOpen ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                </button>
                
                {isMetaOpen && (
                    <div className="p-3 border-t border-gray-700 text-xs font-mono text-gray-300 overflow-x-auto">
                        {keys.map(key => (
                            <div key={key} className="mb-2 last:mb-0">
                                <div className="text-gray-500 mb-1 capitalize">{key}:</div>
                                <pre className="whitespace-pre-wrap break-all bg-gray-950 p-2 rounded border border-gray-800">
                                    {typeof inquiry.meta![key] === 'object' 
                                        ? JSON.stringify(inquiry.meta![key], null, 2) 
                                        : String(inquiry.meta![key])}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderConfirmation = () => {
        const confirmOption = inquiry.options?.find(o => o.value === true) || { label: 'Confirm', value: true, style: 'primary' };
        const cancelOption = inquiry.options?.find(o => o.value === false) || { label: 'Cancel', value: false, style: 'neutral' };

        // If decided, show simplified view
        if (isDecided) {
            const decidedValue = decision.value;
            const isConfirm = decidedValue === true;
            
            return (
                <div className={`mt-2 p-3 rounded-lg border ${isConfirm ? 'border-green-900/50 bg-green-900/10' : 'border-gray-700 bg-gray-800/50'}`}>
                    <div className="flex items-center gap-2 text-sm">
                        {isConfirm ? <CheckIcon className="w-4 h-4 text-green-500" /> : <XIcon className="w-4 h-4 text-gray-400" />}
                        <span className={isConfirm ? 'text-green-400' : 'text-gray-400'}>
                            {isConfirm ? 'Confirmed' : 'Cancelled'}
                        </span>
                        <span className="text-xs text-gray-600 ml-auto">
                            {decision.timestamp instanceof Date ? decision.timestamp.toLocaleTimeString() : ''}
                        </span>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-2 p-4 rounded-lg border border-gray-700 bg-gray-800/80 shadow-lg">
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-full bg-yellow-900/20 text-yellow-500 border border-yellow-900/50">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200">{inquiry.question}</h4>
                        {inquiry.description && (
                            <p className="text-xs text-gray-400 mt-1">{inquiry.description}</p>
                        )}
                    </div>
                </div>

                {renderMeta()}

                <div className="flex items-center gap-3 mt-4 justify-end">
                    <button
                        onClick={() => onDecision(cancelOption.value)}
                        className="px-3 py-1.5 rounded text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-transparent hover:border-gray-600"
                    >
                        {cancelOption.label}
                    </button>
                    <button
                        onClick={() => onDecision(confirmOption.value)}
                        className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all
                            ${confirmOption.style === 'danger' 
                                ? 'bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 hover:border-red-800' 
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                            }`}
                    >
                        {confirmOption.icon && getIcon(confirmOption.icon)}
                        {confirmOption.label}
                    </button>
                </div>
            </div>
        );
    };

    const renderSelection = () => {
        if (isDecided) {
            const selectedOption = inquiry.options?.find(o => o.value === decision.value);
            return (
                <div className="mt-2 p-3 rounded-lg border border-blue-900/50 bg-blue-900/10">
                    <div className="flex items-center gap-2 text-sm">
                        <CheckIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300">Selected: <span className="font-semibold">{selectedOption?.label || String(decision.value)}</span></span>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-2 p-4 rounded-lg border border-gray-700 bg-gray-800/80 shadow-lg">
                 <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-200">{inquiry.question}</h4>
                    {inquiry.description && (
                        <p className="text-xs text-gray-400 mt-1">{inquiry.description}</p>
                    )}
                </div>

                {renderMeta()}

                <div className="flex flex-wrap gap-2 mt-4">
                    {inquiry.options?.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => onDecision(option.value)}
                            className="px-3 py-2 rounded-md text-xs font-medium bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600 hover:border-gray-500 transition-all flex items-center gap-2"
                        >
                            {option.icon && getIcon(option.icon)}
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderTextInput = (isCorrection = false) => {
        if (isDecided) {
             return (
                <div className="mt-2 p-3 rounded-lg border border-purple-900/50 bg-purple-900/10">
                    <div className="flex items-center gap-2 text-sm">
                        {isCorrection ? <PencilIcon className="w-4 h-4 text-purple-400" /> : <CheckIcon className="w-4 h-4 text-purple-400" />}
                        <span className="text-purple-300">
                            {isCorrection ? 'Correction provided: ' : 'Input provided: '}
                            <span className="font-semibold text-purple-200">{String(decision.value)}</span>
                        </span>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-2 p-4 rounded-lg border border-gray-700 bg-gray-800/80 shadow-lg">
                <div className="mb-3 flex items-start gap-3">
                     {isCorrection && (
                        <div className="p-2 rounded-full bg-purple-900/20 text-purple-400 border border-purple-900/50">
                            <PencilIcon className="w-4 h-4" />
                        </div>
                     )}
                     <div>
                        <h4 className="text-sm font-semibold text-gray-200">{inquiry.question}</h4>
                        {inquiry.description && (
                            <p className="text-xs text-gray-400 mt-1">{inquiry.description}</p>
                        )}
                     </div>
                </div>

                {renderMeta()}

                <div className="mt-4">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type your response..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && textInput.trim()) {
                                onDecision(textInput);
                            }
                        }}
                    />
                    <div className="flex justify-end mt-3 gap-2">
                         <button
                            onClick={() => onDecision(null)} // Or handle cancellation explicitly
                            className="px-3 py-1.5 rounded text-xs font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={() => onDecision(textInput)}
                            disabled={!textInput.trim()}
                            className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    switch (inquiry.type) {
        case 'confirmation':
            return renderConfirmation();
        case 'selection':
            return renderSelection();
        case 'text_input':
            return renderTextInput(false);
        case 'correction':
            return renderTextInput(true);
        default:
            return (
                <div className="mt-2 p-3 rounded border border-red-900/50 bg-red-900/20 text-red-400 text-xs">
                    Unsupported inquiry type: {inquiry.type}
                </div>
            );
    }
};

export default InquiryRenderer;
