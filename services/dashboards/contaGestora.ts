import type { AppConfig } from '../../types';

const mockContaGestoraDataRaw = [
    { id: 5267, name1: 'Loop Capital', name2: '', obs: 'INR - 4373' },
    { id: 5267, name1: 'Loop Capital', name2: 'Lazard', obs: 'INR - 4373' },
    { id: 6326, name1: 'Gap Gestora de Recursos', name2: '', obs: '' },
    { id: 6326, name1: 'Sharp Capital Gestora', name2: '', obs: '' },
    { id: 7271, name1: 'Safra', name2: 'Safra Asset', obs: '' },
    { id: 7271, name1: 'Safra', name2: 'Safra Asset', obs: '' },
    { id: 7351, name1: 'Leblon Equities Gestao De Recursos Ltda', name2: '', obs: '' },
    { id: 7776, name1: 'Ultra-Mar Capital Multiestrategia Gestora De Recursos Ltda', name2: '', obs: '' },
    { id: 7776, name1: 'ULTRA-MAR CAPITAL MULTIESTRATEGIA GESTORA DE RECURSOS LTDA', name2: '', obs: '' },
    { id: 8103, name1: 'Nest International Adm De Carteira De Valores Mob Ltda', name2: '', obs: '' },
    { id: 8103, name1: 'Nest International Adm De Carteira De Valores Mob Ltda', name2: '', obs: '' },
    { id: 8416, name1: 'Banco Santander Brasil S.A', name2: '', obs: '' },
    { id: 8416, name1: 'Santander Brasil Gestao De Recursos Ltda', name2: '', obs: '' },
    { id: 8456, name1: 'Banco Btg Pactual', name2: '', obs: '' },
    { id: 8457, name1: 'Banco Btg Pactual', name2: '', obs: '' },
    { id: 8456, name1: 'Btg Pactual Asset Management S/A Dtvm', name2: '', obs: '' },
    { id: 8457, name1: 'Btg Pactual Asset Management S/A Dtvm', name2: '', obs: '' },
    { id: 7351, name1: 'Alaska Investimentos Ltda', name2: '', obs: '' },
];

const mockContaGestoraData = mockContaGestoraDataRaw.map(item => ({ ...item, uuid: crypto.randomUUID() }));

export const getContaGestoraData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockContaGestoraData);
        }, 300);
    });
};

export const contaGestoraDashboardConfig: AppConfig = {
    name: "conta_gestora_dashboard",
    version: "1.0.0",
    datasources: [
        {
            name: "conta_gestora",
            description: "Dados da Conta Gestora (PNP)",
            enableInlineEditing: true,
        }
    ],
    dashboard: {
        title: "1. Conta Gestora (PNP)",
        widgets: [
            {
                id: 'conta-gestora-description',
                type: 'markdown',
                dataSource: '',
                title: 'Descrição',
                description: '',
                gridWidth: 12,
                gridHeight: 2,
                transparentBackground: true,
                content: `
# Regras de Negócio - Conta Gestora (PNP)

Esta tabela exibe as regras para a Conta Gestora (PNP). Os dados podem ser modificados diretamente na tabela abaixo.

- **Para adicionar uma linha**: Passe o mouse sobre a linha e clique no ícone (+) que aparece à esquerda.
- **Para editar uma célula**: Dê um duplo clique na célula desejada.
- **Para salvar**: Pressione Enter ou clique fora da célula.
- **Para cancelar**: Pressione Escape.
- A tabela suporta ordenação e filtragem por coluna para facilitar a análise.
                `
            },
            {
                id: 'conta-gestora-table',
                type: 'datatable',
                dataSource: 'conta_gestora',
                title: 'Dados da Conta Gestora',
                description: 'Clique duas vezes para editar. Use a pesquisa global e os filtros de coluna para encontrar dados.',
                gridWidth: 12,
                gridHeight: 8,
                rowKeyColumn: 'uuid',
                pageSize: 15,
                enableGlobalSearch: true,
                enableInlineEditing: true,
                enableRowCreation: true,
                columns: [
                    { key: 'id', header: 'ID', enableSorting: true, enableFiltering: true, width: '100px', enableEditing: true },
                    { key: 'name1', header: 'Nome 1', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'name2', header: 'Nome 2', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'obs', header: 'Observação', enableSorting: true, enableFiltering: true, enableEditing: true },
                ]
            }
        ]
    }
};