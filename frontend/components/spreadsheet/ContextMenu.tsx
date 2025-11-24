import React from 'react';
import { ClipboardIcon } from '../icons/ClipboardIcon';

interface ContextMenuProps {
    x: number;
    y: number;
    onCopy: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onCopy }) => {
    return (
        <div
            style={{ top: y, left: x }}
            className="absolute z-[100] bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 w-48"
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={onCopy}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
                <ClipboardIcon className="w-4 h-4 mr-3" />
                Copy
            </button>
        </div>
    );
};

export default ContextMenu;