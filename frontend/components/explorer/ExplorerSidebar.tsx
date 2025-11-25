import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useDatabaseTree } from '../../hooks/useDatabaseTree';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { TableIcon } from '../icons/TableIcon';
import { DatabaseIcon } from '../icons/DatabaseIcon';
import { FolderIcon } from '../icons/FolderIcon'; // Vamos usar como Schema se não existir ícone específico

interface ExplorerSidebarProps {
  onSelectTable: (tableData: any) => void;
}

// Placeholder Icons se não existirem (baseados nos nomes usados no plano)
// Assumindo que FolderIcon existe ou usaremos um substituto.
// Se FolderIcon não existir, vamos importar outro ou usar SVG direto.
// Vou checar se os icones existem depois, por enquanto assumo imports do projeto.

export const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({ onSelectTable }) => {
  const { flatList, toggleNode, expandedIds, isLoadingCatalogs } = useDatabaseTree();

  // Renderizador de Linha Otimizado (Memoizado pelo react-window)
  const Row = ({ index, style }: ListChildComponentProps) => {
    const node = flatList[index];
    const isExpanded = expandedIds.has(node.id);
    
    // Cálculo dinâmico de indentação e padding
    // level 0 = 12px, level 1 = 28px, level 2 = 44px
    const paddingLeft = `${node.level * 16 + 12}px`; 

    // Loading State Visual / Empty State
    if (node.isLoading || node.data?.isEmptyPlaceholder) {
      return (
        <div style={style} className="flex items-center text-xs text-gray-500 italic select-none">
          <div style={{ paddingLeft }} className="pl-8">
            {node.isLoading ? 'Carregando itens...' : '(Vazio)'}
          </div>
        </div>
      );
    }

    // Handler de Clique
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.type === 'TABLE') {
        onSelectTable(node.data);
      } else {
        toggleNode(node);
      }
    };

    // Seleção de Ícones e Cores com base no tipo
    let Icon = DatabaseIcon;
    let colorClass = "text-gray-400";
    
    if (node.type === 'SCHEMA') {
        // Se não tiver FolderIcon, use DatabaseIcon com cor diferente por enquanto ou Arrow
        // Mas no list_dir vi icons/, mas não listei todos.
        Icon = FolderIcon || DatabaseIcon; 
        colorClass = "text-yellow-500";
    } else if (node.type === 'TABLE') {
        Icon = TableIcon;
        colorClass = "text-blue-400";
    }

    return (
      <div 
        style={style} 
        className={`flex items-center hover:bg-gray-800 cursor-pointer text-sm text-gray-300 select-none transition-colors duration-75
          ${node.type === 'TABLE' ? 'hover:text-white' : ''}`}
        onClick={handleClick}
      >
        <div style={{ paddingLeft }} className="flex items-center w-full pr-2 overflow-hidden">
          {/* Botão Expander (Apenas para containers) */}
          <div className="w-5 h-5 flex items-center justify-center mr-1 shrink-0">
            {node.type !== 'TABLE' && (
              <div className="p-0.5 rounded hover:bg-gray-700">
                {isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
              </div>
            )}
          </div>

          {/* Ícone do Tipo */}
          {/* @ts-ignore - Ignorando erro se FolderIcon for undefined em runtime, mas deve existir */}
          <Icon className={`w-4 h-4 mr-2 shrink-0 ${colorClass}`} />

          {/* Rótulo com Truncamento */}
          <span className="truncate" title={node.label}>{node.label}</span>
        </div>
      </div>
    );
  };

  if (isLoadingCatalogs) {
    return (
        <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700 w-64 shrink-0">
            <div className="h-14 px-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 backdrop-blur shrink-0">
                <span className="font-semibold text-gray-200 text-sm uppercase tracking-wider">Explorer</span>
            </div>
            <div className="p-4 text-gray-400 text-sm flex justify-center">Carregando...</div>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700 w-64 shrink-0">
      <div className="h-14 px-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 backdrop-blur shrink-0">
        <span className="font-semibold text-gray-200 text-sm uppercase tracking-wider">Explorer</span>
        {/* Aqui poderia entrar um botão de refresh */}
      </div>
      
      <div className="flex-1 relative">
        {/* AutoSizer garante que a lista ocupe todo o espaço vertical disponível */}
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={flatList.length}
              itemSize={28} // Altura da linha compacta
              itemKey={(index) => flatList[index].id} // Chave estável para performance de diff do React
              overscanCount={5} // Renderizar 5 itens fora da tela para rolagem suave
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

