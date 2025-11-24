import React, { useMemo, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { WidgetConfig } from '../../types';
import { WidgetWrapper } from './WidgetWrapper';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardBuilderProps {
  widgets: WidgetConfig[];
  isEditMode: boolean;
  editingWidgetId?: string | null;
  onLayoutChange: (newLayout: Layout[]) => void;
  renderWidget: (widget: WidgetConfig) => React.ReactNode;
  onWidgetRemove: (id: string) => void;
  onWidgetEdit: (id: string) => void;
  onWidgetConfigSave?: (id: string, config: WidgetConfig) => void;
  onWidgetConfigCancel?: () => void;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  widgets,
  isEditMode,
  editingWidgetId,
  onLayoutChange,
  renderWidget,
  onWidgetRemove,
  onWidgetEdit,
  onWidgetConfigSave,
  onWidgetConfigCancel
}) => {
  // Prepare the layout array for RGL
  const layout = useMemo(() => {
    return widgets.map((widget, index) => {
        // If widget has saved layout, use it
        if (widget.layout) {
            return {
                i: widget.id,
                x: widget.layout.x,
                y: widget.layout.y,
                w: widget.layout.w,
                h: widget.layout.h,
            };
        }
        
        // Fallback for widgets without layout (Backward Compatibility / First run)
        // We attempt to place them sequentially. 
        // Note: RGL has an auto-layout engine, so if we provide x=0, y=Infinity, it might stack them.
        // But to respect gridWidth, we should try to set w/h correctly.
        return {
            i: widget.id,
            x: (index * 6) % 12, // Simple staggered placement if no layout
            y: Infinity, // Put at bottom
            w: widget.gridWidth || 6, // Default to 6 if undefined
            h: widget.gridHeight || 4
        };
    });
  }, [widgets]);

  const handleLayoutChange = useCallback((currentLayout: Layout[]) => {
      // Pass the new layout up to parent
      onLayoutChange(currentLayout);
  }, [onLayoutChange]);

  return (
    <div className="dashboard-builder w-full relative min-h-[500px]">
      {/* Grid Background for visual alignment guidance in Edit Mode */}
      {isEditMode && (
        <div className="absolute inset-0 grid grid-cols-12 gap-6 pointer-events-none z-0 opacity-10 h-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-gray-500 h-full w-full border-r border-gray-600 last:border-r-0" />
          ))}
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100} // Sticky grid row height
        width={1200} // Initial width, WidthProvider will override
        margin={[24, 24]} // Tailwind gap-6 approx 24px
        containerPadding={[0, 0]}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".drag-handle"
        onLayoutChange={(layout) => handleLayoutChange(layout)}
        compactType="vertical"
      >
        {widgets.map((widget) => {
          const isEditingConfig = editingWidgetId === widget.id;
          return (
            <div key={widget.id} data-grid={widget.layout ? undefined : { 
                w: widget.gridWidth || 6, 
                h: widget.gridHeight || 4, 
                x: 0, 
                y: Infinity 
            }}>
              <WidgetWrapper
                id={widget.id}
                title={widget.title}
                isEditMode={isEditMode}
                isEditingConfig={isEditingConfig}
                widgetConfig={isEditingConfig ? widget : undefined}
                onRemove={() => onWidgetRemove(widget.id)}
                onEdit={() => onWidgetEdit(widget.id)}
                onConfigSave={onWidgetConfigSave ? (config) => onWidgetConfigSave(widget.id, config) : undefined}
                onConfigCancel={onWidgetConfigCancel}
                className="h-full" // Ensure wrapper takes full height of RGL item
              >
                {renderWidget(widget)}
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

