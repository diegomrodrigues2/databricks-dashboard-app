import React, { createContext, useContext, useState, useMemo } from 'react';

interface SpreadsheetView {
  title: string;
  data: any[];
  isEditable: boolean;
}

interface SpreadsheetContextType {
  spreadsheetView: SpreadsheetView | null;
  openSpreadsheet: (title: string, data: any[], isEditable?: boolean) => void;
  closeSpreadsheet: () => void;
}

const SpreadsheetContext = createContext<SpreadsheetContextType | undefined>(undefined);

export const SpreadsheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spreadsheetView, setSpreadsheetView] = useState<SpreadsheetView | null>(null);

  const openSpreadsheet = (title: string, data: any[], isEditable: boolean = false) => {
    setSpreadsheetView({ title, data, isEditable });
  };

  const closeSpreadsheet = () => {
    setSpreadsheetView(null);
  };

  const value = useMemo(() => ({
    spreadsheetView,
    openSpreadsheet,
    closeSpreadsheet,
  }), [spreadsheetView]);

  return <SpreadsheetContext.Provider value={value}>{children}</SpreadsheetContext.Provider>;
};

export const useSpreadsheet = (): SpreadsheetContextType => {
  const context = useContext(SpreadsheetContext);
  if (context === undefined) {
    throw new Error('useSpreadsheet must be used within a SpreadsheetProvider');
  }
  return context;
};

