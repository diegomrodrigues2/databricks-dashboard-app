import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { fetchCatalogs, fetchSchemas, fetchTables } from '../services/explorerService';

export type NodeType = 'CATALOG' | 'SCHEMA' | 'TABLE';

// Estrutura unificada para o nó da árvore visual
export interface TreeNode {
  id: string;           // Identificador único (ex: "main", "main.default", "main.default.trips")
  label: string;        // Texto de exibição
  type: NodeType;
  level: number;        // Profundidade para indentação (0, 1, 2)
  parentId: string | null;
  isLoaded?: boolean;   // Se os filhos já foram carregados
  isLoading?: boolean;  // Estado transiente de carregamento
  data?: any;           // Objeto original (Catalog/Schema/Table)
}

export const useDatabaseTree = () => {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Cache local para armazenar filhos carregados: Chave = ID do pai, Valor = Lista de nós filhos
  const loadedChildrenRef = useRef<Record<string, TreeNode[]>>({});
  // Forçamos re-render quando o cache atualiza
  const [, setForceUpdate] = useState({}); 

  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // 1. Carregar Catálogos (Raiz) na montagem
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setIsLoadingCatalogs(true);
        const data = await fetchCatalogs();
        setCatalogs(data);
      } catch (err) {
        console.error("Failed to load catalogs", err);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };
    loadCatalogs();
  }, []);

  // Função para alternar expansão/colapso
  const toggleNode = useCallback(async (node: TreeNode) => {
    const newExpanded = new Set(expandedIds);

    if (expandedIds.has(node.id)) {
      // Colapsar
      newExpanded.delete(node.id);
      setExpandedIds(newExpanded);
    } else {
      // Expandir
      newExpanded.add(node.id);
      setExpandedIds(newExpanded);

      // Verificar cache antes de buscar
      if (!loadedChildrenRef.current[node.id]) {
        setLoadingNodes(prev => new Set(prev).add(node.id));
        try {
          let children: TreeNode[] = [];
          
          if (node.type === 'CATALOG') {
            const schemas = await fetchSchemas(node.label);
            children = schemas.map(s => ({
              id: `${node.label}.${s.name}`,
              label: s.name,
              type: 'SCHEMA',
              level: 1,
              parentId: node.id,
              data: s
            }));
          } else if (node.type === 'SCHEMA') {
            // node.id assume formato "catalog.schema"
            const [catalog, schema] = node.id.split('.');
            const tables = await fetchTables(catalog, schema);
            children = tables.map(t => ({
              id: `${catalog}.${schema}.${t.name}`,
              label: t.name,
              type: 'TABLE',
              level: 2,
              parentId: node.id,
              data: t
            }));
          }

          loadedChildrenRef.current[node.id] = children;
          setForceUpdate({}); // Trigger re-render
        } catch (err) {
          console.error("Erro ao expandir nó:", err);
          // Em caso de erro, colapsar novamente para permitir retentativa
          newExpanded.delete(node.id);
          setExpandedIds(new Set(newExpanded));
        } finally {
          setLoadingNodes(prev => {
            const next = new Set(prev);
            next.delete(node.id);
            return next;
          });
        }
      }
    }
  }, [expandedIds]);

  // 3. Achatamento (Flattening) da Árvore para Virtualização
  // Recalcula a lista linear sempre que a expansão ou dados mudam.
  const flatList = useMemo(() => {
    if (!catalogs) return [];

    const result: TreeNode[] = [];
    
    const processNode = (node: TreeNode) => {
      result.push(node);
      
      // Se expandido, processar filhos
      if (expandedIds.has(node.id)) {
        if (loadingNodes.has(node.id)) {
          // Adicionar nó temporário de loading
          result.push({
            id: `${node.id}-loading`,
            label: 'Carregando...',
            type: 'TABLE', // Tipo dummy para renderização segura
            level: node.level + 1,
            parentId: node.id,
            isLoading: true
          });
        } else {
          const children = loadedChildrenRef.current[node.id];
          if (children && children.length > 0) {
            children.forEach(processNode);
          } else if (children && children.length === 0) {
            // Caso especial: expandido mas sem filhos (vazio)
            result.push({
                id: `${node.id}-empty`,
                label: '(Vazio)',
                type: 'TABLE', 
                level: node.level + 1,
                parentId: node.id,
                isLoading: false,
                data: { isEmptyPlaceholder: true }
            });
          }
        }
      }
    };

    // Converter catálogos raiz em TreeNodes
    const rootNodes: TreeNode[] = catalogs.map(c => ({
      id: c.name,
      label: c.name,
      type: 'CATALOG',
      level: 0,
      parentId: null,
      data: c
    }));

    rootNodes.forEach(processNode);
    return result;
  }, [catalogs, expandedIds, loadingNodes, loadedChildrenRef.current]); // Dependência em loadedChildrenRef.current indireta via setForceUpdate

  return { flatList, toggleNode, expandedIds, isLoadingCatalogs };
};

