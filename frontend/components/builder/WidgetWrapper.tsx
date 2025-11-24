import React from 'react';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { DotsVerticalIcon } from '../icons/DotsVerticalIcon';
import { WidgetConfig } from '../../types';
import { WidgetConfigEditor } from './WidgetConfigEditor';

interface WidgetWrapperProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isEditMode: boolean;
  isEditingConfig?: boolean;
  widgetConfig?: WidgetConfig;
  onRemove: () => void;
  onEdit: () => void;
  onConfigSave?: (updatedConfig: WidgetConfig) => void;
  onConfigCancel?: () => void;
  // These props are injected by react-grid-layout
  className?: string;
  style?: React.CSSProperties;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ 
  id, 
  title, 
  children, 
  isEditMode, 
  isEditingConfig = false,
  widgetConfig,
  onRemove, 
  onEdit, 
  onConfigSave,
  onConfigCancel,
  className, 
  style, 
  onMouseDown, 
  onMouseUp, 
  onTouchEnd
}) => {
  return (
    <div 
      className={`${className} flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg transition-shadow ${isEditMode ? 'hover:shadow-blue-500/20 hover:border-blue-500/50' : ''}`}
      style={style}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
    >
      
      {/* Edit Header - Only visible in Edit Mode */}
      {isEditMode && !isEditingConfig && (
        <div className="drag-handle h-8 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-2 cursor-move select-none">
          <div className="flex items-center gap-2 overflow-hidden">
            <DotsVerticalIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-mono text-gray-400 truncate">{title}</span>
          </div>
          <div className="flex gap-1 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}> 
            {/* stopPropagation required so clicking buttons doesn't start a drag */}
            <button onClick={onEdit} className="p-1 hover:bg-blue-900/50 rounded text-blue-400" title="Edit Widget">
              <PencilIcon className="w-3 h-3" />
            </button>
            <button onClick={onRemove} className="p-1 hover:bg-red-900/50 rounded text-red-400" title="Remove Widget">
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Show JSON editor when editing config */}
        {isEditingConfig && widgetConfig && onConfigSave && onConfigCancel ? (
          <div className="h-full w-full">
            <WidgetConfigEditor
              config={widgetConfig}
              onSave={onConfigSave}
              onCancel={onConfigCancel}
            />
          </div>
        ) : (
          <>
            {/* Overlay to capture clicks in edit mode, preventing accidental chart interaction while moving */}
            {isEditMode && !isEditingConfig && <div className="absolute inset-0 z-10 bg-transparent" />}
            <div className="h-full w-full widget-content-area">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

