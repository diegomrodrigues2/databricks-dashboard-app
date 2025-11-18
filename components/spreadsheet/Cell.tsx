import React from 'react';

interface CellProps {
    value: any;
    style: React.CSSProperties;
    isSelected: boolean;
    isEditing: boolean;
    editValue: string;
    onMouseDown: (event: React.MouseEvent) => void;
    onMouseEnter: (event: React.MouseEvent) => void;
    onContextMenu: (event: React.MouseEvent) => void;
    onDoubleClick: () => void;
    onEditValueChange: (value: string) => void;
    onCommitEdit: () => void;
    onEditKeyDown: (event: React.KeyboardEvent) => void;
}

const Cell: React.FC<CellProps> = ({ 
    value, style, isSelected, isEditing, editValue, onMouseDown, onMouseEnter,
    onContextMenu, onDoubleClick, onEditValueChange, onCommitEdit, onEditKeyDown 
}) => {
    const displayValue = value === null || value === undefined ? '' : String(value);
    
    const selectionClasses = isSelected 
        ? 'bg-blue-900 bg-opacity-50 border-blue-400' 
        : 'border-gray-700';

    if (isEditing) {
        return (
            <div style={style} className="p-0 border-b border-r border-blue-400">
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onBlur={onCommitEdit}
                    onKeyDown={onEditKeyDown}
                    autoFocus
                    className="w-full h-full bg-gray-700 text-white outline-none border-2 border-blue-500 box-border px-2 select-text"
                />
            </div>
        );
    }

    return (
        <div
            style={style}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
            className={`flex items-center justify-start p-2 border-b border-r text-gray-300 truncate bg-gray-900 cursor-cell ${selectionClasses}`}
        >
            {displayValue}
        </div>
    );
};

export default React.memo(Cell);