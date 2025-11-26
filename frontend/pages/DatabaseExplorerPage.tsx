import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { ExplorerSidebar } from '../components/explorer/ExplorerSidebar';
import Spreadsheet from '../components/spreadsheet/Spreadsheet'; // Reutilizando componente existente
import { executeRawQuery } from '../services/dashboardService'; // Serviço que chama /api/query
import { cacheService } from '../services/cacheService';
import { DatabaseIcon } from '../components/icons/DatabaseIcon';
import { XIcon } from '../components/icons/XIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { useChat } from '../hooks/useChat';
import ChatWindow from '../components/chat/ChatWindow';
import type { Page } from '../types';

interface DatabaseExplorerPageProps {
    onNavigate?: (page: Page, dashboardId?: string) => void;
}

type ViewMode = 'DATA' | 'DDL' | 'TRANSLATION' | 'CHAT';

const DatabaseExplorerPage: React.FC<DatabaseExplorerPageProps> = ({ onNavigate }) => {
  const [activeTable, setActiveTable] = useState<any | null>(null);
  const [tableData, setTableData] = useState<any>();
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('DATA');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const { sendMessage, startNewSessionWithContext } = useChat();

  const handleSelectTable = async (table: any) => {
    setActiveTable(table);
    setLoadingData(true);
    setError(null);
    setTableData(undefined);
    setViewMode('DATA');
    
    // Constrói a query segura. 
    // Nota: Em produção, usar parameters binding, mas para SELECT * LIMIT é aceitável concatenar
    // se o full_name vier confiável da API do Unity Catalog.
    const query = `SELECT * FROM ${table.full_name} LIMIT 1000`; 
    
    try {
      // Reutiliza o serviço existente que bate no endpoint SQL Statement Execution
      const result = await executeRawQuery(query, 'sql');
      setTableData(result);
      cacheService.cacheData(table.full_name, result);
    } catch (err) {
      console.error("Falha ao carregar dados da tabela", err);
      setError("Não foi possível carregar os dados. Verifique suas permissões ou se o SQL Warehouse está ativo.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleCloseSpreadsheet = () => {
    setActiveTable(null);
    setTableData(undefined);
    setViewMode('DATA');
  };

  const handleChatWithTable = () => {
      if (!activeTable) return;
      const message = `Context: Table ${activeTable.full_name}\n\nI want to explore this table.`;
      startNewSessionWithContext(message);
      setViewMode('CHAT');
  };

  const getDDL = () => {
      if (!activeTable) return '';
      // Mock DDL
      return `-- CREATE TABLE statement for ${activeTable.full_name}
CREATE TABLE ${activeTable.full_name} (
    id INT COMMENT 'Primary Key',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    -- ... other columns based on schema
)
USING DELTA
COMMENT 'Table data from ${activeTable.full_name}';`;
  };

  const getDatabricksTranslation = () => {
      if (!activeTable) return '';
      // Mock Translation
      return `-- Databricks SQL Translation for ${activeTable.full_name}
-- Optimized for Delta Lake

CREATE OR REPLACE TABLE ${activeTable.full_name}
USING DELTA
PARTITIONED BY (created_at)
AS SELECT * FROM source_table;

-- Optimize command
OPTIMIZE ${activeTable.full_name} ZORDER BY (id);`;
  };

  const renderContent = () => {
      if (loadingData) {
          return (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-10 bg-black/50 backdrop-blur-sm">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                 <span>Carregando dados de <strong>{activeTable.name}</strong>...</span>
              </div>
          );
      }

      if (error) {
          return (
               <div className="p-8 text-center">
                 <div className="text-red-500 text-lg mb-2">Erro</div>
                 <p className="text-gray-400">{error}</p>
               </div>
          );
      }

      switch (viewMode) {
          case 'DDL':
              return (
                <Editor
                    height="100%"
                    theme="vs-dark"
                    defaultLanguage="sql"
                    value={getDDL()}
                    options={{ minimap: { enabled: false }, readOnly: true, fontSize: 14 }}
                />
              );
          case 'TRANSLATION':
               return (
                <Editor
                    height="100%"
                    theme="vs-dark"
                    defaultLanguage="sql"
                    value={getDatabricksTranslation()}
                    options={{ minimap: { enabled: false }, readOnly: true, fontSize: 14 }}
                />
              );
          case 'CHAT':
              return <ChatWindow hideHeader={true} />;
          case 'DATA':
          default:
              return (
                  <Spreadsheet  
                      title={`Dados: ${activeTable.full_name}`}
                      data={tableData}
                      onClose={handleCloseSpreadsheet}
                      isEditable={false}
                      hideHeader={true}
                  />
              );
      }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-black">
      {/* Painel Esquerdo: Navegador */}
      <ExplorerSidebar onSelectTable={handleSelectTable} />

      {/* Painel Direito: Conteúdo */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {activeTable ? (
          <div className="h-full w-full flex flex-col bg-gray-900">
            {/* Header Toolbar */}
            <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4 bg-gray-900 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                     <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                       <DatabaseIcon className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col overflow-hidden">
                       <div className="text-sm font-medium text-white truncate max-w-xl" title={activeTable.full_name}>
                         {activeTable.full_name}
                       </div>
                       <div className="text-xs text-gray-500 flex items-center gap-2">
                           <span>{viewMode === 'DATA' ? 'Data Preview' : viewMode === 'DDL' ? 'Create Statement' : viewMode === 'CHAT' ? 'Chat' : 'Databricks Translation'}</span>
                       </div>
                     </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative ml-1">
                        {showActionMenu && (
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowActionMenu(false)}
                            />
                        )}
                        <button
                            onClick={() => setShowActionMenu(!showActionMenu)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border z-50 relative ${
                                showActionMenu 
                                    ? 'bg-gray-700 text-white border-gray-600'
                                    : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                            }`}
                        >
                            <span>Actions</span>
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showActionMenu ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showActionMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-700 mb-1">
                                    AI Assistance
                                </div>
                                <button
                                    onClick={() => { setShowActionMenu(false); handleChatWithTable(); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                >
                                    Chat with Table
                                </button>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-t border-gray-700 my-1">
                                    Tools
                                </div>
                                <button
                                    onClick={() => { setShowActionMenu(false); setViewMode('DATA'); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                >
                                    Show Data
                                </button>
                                <button
                                    onClick={() => { setShowActionMenu(false); setViewMode('DDL'); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                >
                                    Show Create Table
                                </button>
                                <button
                                    onClick={() => { setShowActionMenu(false); setViewMode('TRANSLATION'); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                >
                                    Translate to Databricks
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-gray-700 mx-1" />

                    <button onClick={handleCloseSpreadsheet} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {renderContent()}
            </div>
          </div>
        ) : (
          // Estado Vazio (Empty State)
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 select-none">
            <DatabaseIcon className="w-16 h-16 mb-4 opacity-20" />
            <p>Selecione uma tabela no explorador para visualizar os dados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseExplorerPage;
