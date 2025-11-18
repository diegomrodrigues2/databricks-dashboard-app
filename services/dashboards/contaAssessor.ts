import type { AppConfig } from '../../types';

const mockContaAssessorDataRaw = [
    { assessor_sinacor_original: '19 - KC835', assessor_sinacor: 'KC835', assessor: 'GRAINS I' },
    { assessor_sinacor_original: '21 - BZ135', assessor_sinacor: 'BZ135', assessor: 'GRAINS I' },
    { assessor_sinacor_original: '23 - BZ136', assessor_sinacor: 'BZ136', assessor: 'GRAINS I' },
    { assessor_sinacor_original: '25 - BZ181', assessor_sinacor: 'BZ181', assessor: 'GRAINS I' },
    { assessor_sinacor_original: '43 - BZ131', assessor_sinacor: 'BZ131', assessor: 'GRAINS I' },
    { assessor_sinacor_original: '44 - BZ132', assessor_sinacor: 'BZ132', assessor: 'GRAINS I' },
    { assessor_sinacor_original: '18 - KC828', assessor_sinacor: 'KC828', assessor: 'GRAINS II' },
    { assessor_sinacor_original: '20 - KC856', assessor_sinacor: 'KC856', assessor: 'GRAINS II' },
    { assessor_sinacor_original: '22 - BZ123', assessor_sinacor: 'BZ123', assessor: 'GRAINS II' },
    { assessor_sinacor_original: '24 - BZ158', assessor_sinacor: 'BZ158', assessor: 'GRAINS II' },
    { assessor_sinacor_original: '26 - BZ163', assessor_sinacor: 'BZ163', assessor: 'GRAINS II' },
    { assessor_sinacor_original: '46 - BZ149', assessor_sinacor: 'BZ149', assessor: 'GRAINS II' },
    { assessor_sinacor_original: '47 - BZ192', assessor_sinacor: 'BZ192', assessor: 'PGR' },
    { assessor_sinacor_original: '39 - BZ100', assessor_sinacor: 'BZ100', assessor: 'SUGAR II' },
    { assessor_sinacor_original: '40 - BZ134', assessor_sinacor: 'BZ134', assessor: 'SUGAR II' },
    { assessor_sinacor_original: '38 - BZ183', assessor_sinacor: 'BZ183', assessor: 'SUGAR II' },
    { assessor_sinacor_original: '37 - KC830', assessor_sinacor: 'KC830', assessor: 'SUGAR I' },
    { assessor_sinacor_original: '36 - BZ114', assessor_sinacor: 'BZ114', assessor: 'SUGAR I' },
    { assessor_sinacor_original: '52 - BZ127', assessor_sinacor: 'BZ127', assessor: 'SUGAR I' },
    { assessor_sinacor_original: '41 - BZ105', assessor_sinacor: 'BZ105', assessor: 'COFFEE' },
    { assessor_sinacor_original: '42 - BZ164', assessor_sinacor: 'BZ164', assessor: 'COFFEE' },
    { assessor_sinacor_original: '50 - BZ154', assessor_sinacor: 'BZ154', assessor: 'COFFEE' },
    { assessor_sinacor_original: '35 - BZ130', assessor_sinacor: 'BZ130', assessor: 'CATTLE' },
    { assessor_sinacor_original: '33 - BZ104', assessor_sinacor: 'BZ104', assessor: 'PGR' },
    { assessor_sinacor_original: '32 - BZ101', assessor_sinacor: 'BZ101', assessor: 'WHEAT' },
    { assessor_sinacor_original: '30 - SP100', assessor_sinacor: 'SP100', assessor: 'MESA SP' },
    { assessor_sinacor_original: '27 - BZ153', assessor_sinacor: 'BZ153', assessor: 'FERTILIZERS' },
    { assessor_sinacor_original: '28 - BZ102', assessor_sinacor: 'BZ102', assessor: 'COTTON' },
    { assessor_sinacor_original: '29 - BZ178', assessor_sinacor: 'BZ178', assessor: 'COTTON' },
    { assessor_sinacor_original: '31 - BZ155', assessor_sinacor: 'BZ155', assessor: 'Sr_Management' },
    { assessor_sinacor_original: '34 - BZ170', assessor_sinacor: 'BZ170', assessor: 'Metal' },
    { assessor_sinacor_original: '45 - BZ137', assessor_sinacor: 'BZ137', assessor: 'COTTON' },
    { assessor_sinacor_original: '48 - BZ109', assessor_sinacor: 'BZ109', assessor: 'PGR' },
    { assessor_sinacor_original: '51 - DCM', assessor_sinacor: 'DCM', assessor: 'DCM' },
    { assessor_sinacor_original: '53 - BZ206', assessor_sinacor: 'BZ206', assessor: 'CITRINO' },
    { assessor_sinacor_original: '54 - BZ229', assessor_sinacor: 'BZ229', assessor: 'GLOBAL PAYMENTS' },
    { assessor_sinacor_original: '55 - BZ219', assessor_sinacor: 'BZ219', assessor: 'GRAINS I' },
    { assessor_sinacor_original: '1 - MESA-SP', assessor_sinacor: 'MESA-SP', assessor: 'MESA SP' },
    { assessor_sinacor_original: '11 - PNP - 1', assessor_sinacor: 'PNP - 1', assessor: 'PNP-1 SP DESK' },
    { assessor_sinacor_original: '10 - LTA DANIEL', assessor_sinacor: 'LTA DANIEL', assessor: 'LTA DANIEL' },
    { assessor_sinacor_original: '14 - PROFTRADER', assessor_sinacor: 'PROFTRADER', assessor: 'PROFTRADER' },
];

const mockContaAssessorData = mockContaAssessorDataRaw.map(item => ({ ...item, uuid: crypto.randomUUID() }));

export const getContaAssessorData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockContaAssessorData);
        }, 300);
    });
};

export const contaAssessorDashboardConfig: AppConfig = {
    name: "conta_assessor_dashboard",
    version: "1.0.0",
    datasources: [
        {
            name: "conta_assessor",
            description: "Dados da Conta Assessor (Commodity)",
            enableInlineEditing: true,
        }
    ],
    dashboard: {
        title: "2. Conta Assessor (Commodity)",
        widgets: [
            {
                id: 'conta-assessor-description',
                type: 'markdown',
                dataSource: '',
                title: 'Descrição',
                description: '',
                gridWidth: 12,
                gridHeight: 2,
                transparentBackground: true,
                content: `
# Regras de Negócio - Conta Assessor (Commodity)

Esta tabela exibe as regras para a Conta Assessor (Commodity). Os dados podem ser modificados diretamente na tabela abaixo.

- **Para adicionar uma linha**: Passe o mouse sobre a linha e clique no ícone (+) que aparece à esquerda.
- **Para editar uma célula**: Dê um duplo clique na célula desejada.
- **Para salvar**: Pressione Enter ou clique fora da célula.
- **Para cancelar**: Pressione Escape.
- A tabela suporta ordenação e filtragem por coluna para facilitar a análise.
                `
            },
            {
                id: 'conta-assessor-table',
                type: 'datatable',
                dataSource: 'conta_assessor',
                title: 'Dados da Conta Assessor',
                description: 'Clique duas vezes para editar. Use a pesquisa global e os filtros de coluna para encontrar dados.',
                gridWidth: 12,
                gridHeight: 8,
                rowKeyColumn: 'uuid',
                pageSize: 15,
                enableGlobalSearch: true,
                enableInlineEditing: true,
                enableRowCreation: true,
                columns: [
                    { key: 'assessor_sinacor_original', header: 'Assessor SINACOR_original', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'assessor_sinacor', header: 'Assessor SINACOR', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'assessor', header: 'Assessor', enableSorting: true, enableFiltering: true, enableEditing: true },
                ]
            }
        ]
    }
};
