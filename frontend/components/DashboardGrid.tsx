import React from 'react';

interface DashboardGridProps {
    children: React.ReactNode;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-12 gap-6 w-full h-full content-start">
      {children}
    </div>
  );
};

export default DashboardGrid;