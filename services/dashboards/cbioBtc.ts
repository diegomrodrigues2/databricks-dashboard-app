import type { AppConfig } from '../../types';

const mockCBIOBTCDataRaw = [
    { historico: 178, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Cbios', 'Commodity (produto)': 'Estorno Corretagem', mercado: 'Renda Fixa' },
    { historico: 173, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Cbios', 'Commodity (produto)': 'Corretagem', mercado: 'Renda Fixa' },
    { historico: 209, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Cbios', 'Commodity (produto)': 'Escrituração', mercado: 'Renda Fixa' },
    { historico: 65, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Cbios', 'Commodity (produto)': 'Taxa de custódia', mercado: 'Renda Fixa' },
    { historico: 66, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Cbios', 'Commodity (produto)': 'Estorno taxa de custódia', mercado: 'Renda Fixa' },
    { historico: 214, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Cbios', 'Commodity (produto)': 'Estorno taxa de registro', mercado: 'Renda Fixa' },
    { historico: 845, broker: 'Securities Lending', 'Conta Tipo B': 'Y', segmento: 'Stock Lending', 'Commodity (produto)': 'Corretagem', mercado: 'Equities' },
    { historico: 852, broker: 'Securities Lending', 'Conta Tipo B': 'Y', segmento: 'Stock Lending', 'Commodity (produto)': 'Estorno Corretagem', mercado: 'Equities' },
    { historico: 215, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Renda Fixa', 'Commodity (produto)': 'Corretagem', mercado: 'Renda Fixa' },
    { historico: 216, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Renda Fixa', 'Commodity (produto)': 'Estorno Corretagem', mercado: 'Renda Fixa' },
    { historico: 442, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Ajuste', 'Commodity (produto)': 'Ajuste ( debito) ', mercado: 'NA' },
    { historico: 443, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Ajuste', 'Commodity (produto)': 'Ajuste ( crédito)', mercado: 'NA' },
    { historico: 462, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Ajuste', 'Commodity (produto)': 'Ajuste ( debito) ', mercado: 'NA' },
    { historico: 463, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'Ajuste', 'Commodity (produto)': 'Ajuste ( crédito)', mercado: 'NA' },
    { historico: 1231, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'OTC Local', 'Commodity (produto)': 'Corretagem', mercado: 'Derivativos Balcão' },
    { historico: 1232, broker: 'NA', 'Conta Tipo B': 'N', segmento: 'OTC Local', 'Commodity (produto)': 'Estorno Corretagem', mercado: 'Derivativos Balcão' },
];

// Sanitize keys to be valid JavaScript identifiers
const mockCBIOBTCData = mockCBIOBTCDataRaw.map(item => ({
    historico: item.historico,
    broker: item.broker,
    conta_tipo_b: item['Conta Tipo B'],
    segmento: item.segmento,
    commodity_produto: item['Commodity (produto)'],
    mercado: item.mercado,
    uuid: crypto.randomUUID()
}));

export const getCBIOBTCData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockCBIOBTCData);
        }, 300);
    });
};

export const cbioBtcDashboardConfig: AppConfig = {
    name: "cbio_btc_dashboard",
    version: "1.0.0",
    datasources: [
        {
            name: "cbio_btc",
            description: "Dados da CBIO BTC",
            enableInlineEditing: true,
        }
    ],
    dashboard: {
        title: "3. CBIO BTC",
        widgets: [
            {
                id: 'cbio-btc-description',
                type: 'markdown',
                dataSource: '',
                title: 'Descrição',
                description: '',
                gridWidth: 12,
                gridHeight: 2,
                transparentBackground: true,
                content: `
# Regras de Negócio - CBIO BTC

Esta tabela exibe as regras para a CBIO BTC. Os dados podem ser modificados diretamente na tabela abaixo.

- **Para adicionar uma linha**: Passe o mouse sobre a linha e clique no ícone (+) que aparece à esquerda.
- **Para editar uma célula**: Dê um duplo clique na célula desejada.
- **Para salvar**: Pressione Enter ou clique fora da célula.
- **Para cancelar**: Pressione Escape.
- A tabela suporta ordenação e filtragem por coluna para facilitar a análise.
                `
            },
            {
                id: 'cbio-btc-table',
                type: 'datatable',
                dataSource: 'cbio_btc',
                title: 'Dados da CBIO BTC',
                description: 'Clique duas vezes para editar. Use a pesquisa global e os filtros de coluna para encontrar dados.',
                gridWidth: 12,
                gridHeight: 8,
                rowKeyColumn: 'uuid',
                pageSize: 15,
                enableGlobalSearch: true,
                enableInlineEditing: true,
                enableRowCreation: true,
                columns: [
                    { key: 'historico', header: 'Historico', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'broker', header: 'Broker', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'conta_tipo_b', header: 'Conta Tipo B', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'segmento', header: 'Segmento', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'commodity_produto', header: 'Commodity (produto)', enableSorting: true, enableFiltering: true, enableEditing: true },
                    { key: 'mercado', header: 'Mercado', enableSorting: true, enableFiltering: true, enableEditing: true },
                ]
            }
        ]
    }
};
