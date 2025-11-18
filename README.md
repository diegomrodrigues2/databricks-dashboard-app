# Guia de Componentes de Dashboard

Este documento serve como um guia de referência completo para todos os componentes de visualização (widgets) disponíveis na plataforma de dashboard. Cada seção detalha um tipo de widget, suas opções de configuração em JSON e um exemplo prático.

## Configuração Base de Widget

Todos os widgets compartilham um conjunto de propriedades de configuração básicas.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | Um identificador único para o widget no dashboard. |
| `type` | `string` | Sim | O tipo do widget a ser renderizado (ex: `'kpi'`, `'bar'`, `'datatable'`). |
| `dataSource` | `string` | Sim | O nome da fonte de dados a ser usada pelo widget. |
| `title` | `string` | Sim | O título exibido no cabeçalho do widget. |
| `description` | `string` | Sim | Uma breve descrição exibida abaixo do título. |
| `gridWidth` | `number` (1-12) | Não | A largura do widget no layout de grid de 12 colunas. |
| `gridHeight` | `number` (1-12) | Não | A altura do widget no layout de grid. |
| `filters` | `Array<{ column: string, operator: string, value: any }>` | Não | Uma lista de filtros para pré-filtrar os dados *apenas* para este widget. |

---

## Componentes de Widget

### 1. KPI (`type: 'kpi'`)
Exibe uma única métrica chave, geralmente comparada a um alvo. É ideal para destacar os números mais importantes.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataColumn` | `string` | Sim | A coluna da fonte de dados a ser agregada para o valor principal. |
| `aggregation` | `string` | Sim | O tipo de agregação (ex: `'avg'`, `'sum'`, `'count'`). |
| `target` | `number` | Sim | O valor alvo para a métrica, exibido para comparação. |
| `prefix` | `string` | Não | Um texto ou símbolo a ser exibido antes do valor (ex: `'R$'`). |
| `suffix` | `string` | Não | Um texto ou símbolo a ser exibido depois do valor (ex: `'%'`). |
| `decimalPlaces` | `number` | Não | O número de casas decimais para formatar o valor. Padrão: `0`. |
| `color` | `string` | Não | A cor do valor principal (ex: `'#FF6B6B'`). |

**Exemplo:**
```json
{
  "id": "critical-bugs",
  "type": "kpi",
  "dataSource": "project_issues",
  "title": "Bugs Críticos",
  "description": "Atualmente abertos em produção",
  "dataColumn": "id",
  "aggregation": "count",
  "target": 5,
  "color": "#FF6B6B",
  "gridWidth": 3,
  "gridHeight": 1
}
```

---

### 2. Gráfico de Barras (`type: 'bar'`)
Compara valores entre diferentes categorias. Pode ser usado como um gráfico de barras padrão ou um gráfico de barras empilhadas se `colorCategoryColumn` for fornecido.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias no eixo X. |
| `valueColumn` | `string` | Sim | Coluna para os valores no eixo Y. |
| `aggregation` | `string` | Sim | Como agregar `valueColumn` para cada categoria. |
| `colorCategoryColumn` | `string` | Não | Se fornecido, cria um gráfico de barras empilhadas, com cores baseadas nesta coluna. |
| `color` | `string` | Não | Cor para as barras (se não for empilhado). |
| `xAxisLabel` | `string` | Não | Rótulo para o eixo X. |
| `yAxisLabel` | `string` | Não | Rótulo para o eixo Y. |
| `yAxisFormat` | `string` | Não | Formato para os valores do eixo Y (`'number'`, `'currency'`, `'percent'`). |

**Exemplo:**
```json
{
  "id": "issues-by-project-severity",
  "type": "bar",
  "dataSource": "project_issues",
  "title": "Issues por Projeto & Severidade",
  "description": "Contagem de issues para cada projeto, dividida por severidade.",
  "categoryColumn": "project",
  "colorCategoryColumn": "severity",
  "valueColumn": "id",
  "aggregation": "count",
  "gridWidth": 6,
  "gridHeight": 2,
  "yAxisLabel": "Número de Issues"
}
```

---

### 3. Gráfico de Barras Agrupadas (`type: 'grouped-bar'`)
Compara múltiplos conjuntos de dados lado a lado para cada categoria. Orientado horizontalmente.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias (eixo Y). |
| `barColumns` | `Array<{ key: string, name: string, color: string }>` | Sim | Define as barras para cada grupo. `key` é a coluna de dados, `name` é o rótulo da legenda. |
| `legendFilterColumn` | `string` | Não | Coluna a ser filtrada ao clicar em um item da legenda. |
| `xAxisLabel` | `string` | Não | Rótulo para o eixo X (eixo de valor). |
| `xAxisFormat` | `string` | Não | Formato para os valores do eixo X (`'number'`, `'currency'`, `'percent'`). |

**Exemplo:**
```json
{
  "id": "fruit-sales-grouped-bar-chart",
  "type": "grouped-bar",
  "dataSource": "fruit_sales",
  "title": "Vendas de Frutas Convencionais vs. Orgânicas",
  "description": "Frutas convencionais vendem mais que o dobro das orgânicas.",
  "categoryColumn": "fruit",
  "barColumns": [
    { "key": "organic", "name": "Orgânico", "color": "#4ECDC4" },
    { "key": "not_organic", "name": "Convencional", "color": "#6B7280" }
  ],
  "gridWidth": 12,
  "gridHeight": 3,
  "xAxisLabel": "Vendas (em milhões)"
}
```

---

### 4. Gráfico de Pirulito (`type: 'lollipop'`)
Uma alternativa ao gráfico de barras, útil para enfatizar valores e comparar dados de forma limpa.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias. |
| `valueColumn` | `string` | Sim | Coluna para os valores. |
| `aggregation` | `string` | Sim | Como agregar `valueColumn` para cada categoria. |
| `highlightCategory` | `string` | Não | Categoria a ser destacada com `highlightColor`. |
| `targetValue` | `number` | Não | Desenha uma linha de alvo vertical no gráfico. |

**Exemplo:**
```json
{
  "id": "fruit-sales-lollipop-chart",
  "type": "lollipop",
  "dataSource": "total_fruit_sales",
  "title": "Mirtilos ultrapassam a marca de 5000 unidades",
  "description": "Total de unidades vendidas por variedade de fruta",
  "categoryColumn": "fruit",
  "valueColumn": "units_sold",
  "aggregation": "sum",
  "gridWidth": 12,
  "gridHeight": 5,
  "highlightCategory": "Blueberry",
  "targetValue": 5000
}
```

---

### 5. Gráfico de Bala (`type: 'bullet'`)
Compara um valor principal a um alvo e a faixas qualitativas de desempenho.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias. |
| `valueColumn` | `string` | Sim | Coluna para o valor principal. |
| `aggregation` | `string` | Sim | Como agregar `valueColumn`. |
| `targetValue` | `number` | Sim | O valor alvo, mostrado como uma linha vertical. |
| `ranges` | `Array<{ value: number, label: string }>` | Sim | Define as faixas de desempenho no fundo. |
| `valueNotation` | `string` | Não | Formata o valor de forma compacta (ex: `'compact'` para '150k'). |

**Exemplo:**
```json
{
  "id": "fruit-revenue-bullet-chart",
  "type": "bullet",
  "dataSource": "fruit_revenue",
  "title": "Abacaxi e Banana lideram o desempenho de receita",
  "categoryColumn": "fruit",
  "valueColumn": "revenue",
  "aggregation": "sum",
  "targetValue": 220000,
  "ranges": [
    { "value": 150000, "label": "Abaixo do esperado" },
    { "value": 250000, "label": "No caminho certo" },
    { "value": 350000, "label": "Excedendo expectativas" }
  ],
  "gridWidth": 12,
  "gridHeight": 4,
  "valueNotation": "compact"
}
```

---

### 6. Gráfico de Pontos (`type: 'dot-plot'`)
Exibe a relação entre duas ou mais variáveis para um conjunto de categorias, mostrando a dispersão e a diferença.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias no eixo Y. |
| `dotColumns` | `Array<{ key: string, name: string, color: string }>` | Sim | Define os pontos a serem plotados para cada categoria. |

**Exemplo:**
```json
{
  "id": "fruit-seasonal-sales-dot-plot",
  "type": "dot-plot",
  "dataSource": "fruit_seasonal_sales",
  "title": "O verão é a alta temporada para vendas de frutas",
  "categoryColumn": "fruit",
  "dotColumns": [
    { "key": "winter", "name": "Inverno", "color": "#CBD5E1" },
    { "key": "spring", "name": "Primavera", "color": "#3B82F6" },
    { "key": "summer", "name": "Verão", "color": "#F97316" },
    { "key": "autumn", "name": "Outono", "color": "#854D0E" }
  ],
  "gridWidth": 12,
  "gridHeight": 5
}
```

---

### 7. Gráfico de Halteres (`type: 'dumbbell'`)
Mostra a mudança ou o intervalo entre dois pontos de dados para cada categoria.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias no eixo Y. |
| `points` | `Array<[DumbbellPoint, DumbbellPoint]>` | Sim | Uma tupla de dois objetos `DumbbellPoint` ({ key, name, color }) para os pontos inicial e final. |

**Exemplo:**
```json
{
  "id": "fruit-sales-growth-dumbbell",
  "type": "dumbbell",
  "dataSource": "fruit_sales_growth",
  "title": "Uva e morango lideram o crescimento de vendas em 2024",
  "categoryColumn": "fruit",
  "points": [
    { "key": "sales_2024", "name": "2024", "color": "#3B82F6" },
    { "key": "sales_2023", "name": "2023", "color": "#9CA3AF" }
  ],
  "gridWidth": 12,
  "gridHeight": 5
}
```

---

### 8. Gráfico de Intervalo (`type: 'range-plot'`)
Exibe um intervalo entre um valor mínimo e máximo para cada categoria.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias. |
| `rangeStartColumn` | `string` | Sim | Coluna de dados para o início do intervalo. |
| `rangeEndColumn` | `string` | Sim | Coluna de dados para o fim do intervalo. |

**Exemplo:**
```json
{
  "id": "fruit-price-volatility-range-plot",
  "type": "range-plot",
  "dataSource": "fruit_price_range",
  "title": "Bananas mais estáveis; Abacaxis mais voláteis",
  "categoryColumn": "fruit",
  "rangeStartColumn": "min_price",
  "rangeEndColumn": "max_price",
  "gridWidth": 12,
  "gridHeight": 5
}
```

---

### 9. Gráfico de Barras Radiais (`type: 'radial-bar'`)
Uma variação do gráfico de barras, onde as barras são exibidas em um sistema de coordenadas polares.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias. |
| `valueColumn` | `string` | Sim | Coluna para os valores. |
| `aggregation` | `string` | Sim | Como agregar `valueColumn`. |
| `highlightCategory` | `string` | Não | Categoria a ser destacada. |

**Exemplo:**
```json
{
  "id": "fruit-sales-radial-bar-chart",
  "type": "radial-bar",
  "dataSource": "total_fruit_sales",
  "title": "Mirtilos ultrapassam a marca de 5000 unidades",
  "categoryColumn": "fruit",
  "valueColumn": "units_sold",
  "aggregation": "sum",
  "gridWidth": 12,
  "gridHeight": 5,
  "highlightCategory": "Blueberry"
}
```

---

### 10. Gráfico de Cascata (`type: 'waterfall'`)
Mostra como um valor inicial é aumentado ou diminuído por uma série de valores intermediários.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as etapas da cascata. |
| `valueColumn` | `string` | Sim | Coluna para os valores de mudança (positivos ou negativos). |
| `totalCategories` | `Array<string>` | Sim | Uma lista de categorias que devem ser tratadas como totais (barras completas) em vez de mudanças. |

**Exemplo:**
```json
{
  "id": "mango-revenue-waterfall",
  "type": "waterfall",
  "dataSource": "mango_revenue",
  "title": "Receita de manga cresce, com desacelerações no verão",
  "categoryColumn": "period",
  "valueColumn": "change",
  "totalCategories": ["Q1 2023", "Q2 2025"],
  "gridWidth": 12,
  "gridHeight": 3
}
```

---

### 11. Gráfico de Matriz (`type: 'matrix'`)
Exibe a relação entre duas variáveis categóricas, mostrando a presença ou ausência de uma conexão.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `rowCategoryColumn` | `string` | Sim | Coluna para as categorias de linha. |
| `columnCategoryColumn` | `string` | Sim | Coluna para as categorias de coluna. |
| `valueColumn` | `string` | Sim | Coluna que deve resolver para um booleano (`true`/`false`) para indicar uma conexão. |

**Exemplo:**
```json
{
  "id": "fruit-culinary-matrix",
  "type": "matrix",
  "dataSource": "fruit_matrix_data",
  "title": "Matriz de atributos e usos culinários de frutas",
  "rowCategoryColumn": "culinary_use",
  "columnCategoryColumn": "fruit",
  "valueColumn": "applicable",
  "gridWidth": 12,
  "gridHeight": 4
}
```

---

### 12. Gráfico de Tabela (`type: 'table'`)
Uma tabela simples com formatação condicional (escala de cores) para visualização rápida de padrões.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `rowCategoryColumn` | `string` | Sim | Coluna a ser usada como cabeçalho de cada linha. |
| `columns` | `Array<TableChartColumnConfig>` | Sim | Configuração para cada coluna da tabela. |
| `conditionalFormatting` | `Array<ConditionalFormattingRule>` | Não | Regras para aplicar formatação condicional, como escalas de cores. |

**Exemplo:**
```json
{
  "id": "fruit-taste-table",
  "type": "table",
  "dataSource": "fruit_taste_data",
  "title": "Manga lidera em sabor, mas fica para trás nas vendas",
  "gridWidth": 12,
  "gridHeight": 5,
  "rowCategoryColumn": "fruit",
  "columns": [
    { "key": "avg_sales", "header": "Vendas Médias", "format": "number" },
    { "key": "sweetness", "header": "Doçura", "format": "number", "decimalPlaces": 1 }
  ],
  "conditionalFormatting": [
    { "column": "avg_sales", "type": "color-scale", "colorScheme": ["#A5B4FC", "#3B82F6"] }
  ]
}
```

---

### 13. Tabela de Dados (`type: 'datatable'`)
Uma tabela interativa e rica em recursos com pesquisa global, filtragem por coluna, ordenação, paginação, agrupamento, drill-down e edição inline.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `columns` | `Array<DataTableColumnConfig>` | Sim | Configuração para cada coluna, incluindo ordenação, formatação, etc. |
| `pageSize` | `number` | Não | Número de linhas por página. Padrão: `10`. |
| `enableGlobalSearch` | `boolean` | Não | Habilita uma caixa de pesquisa global para a tabela. |
| `enableSummarization` | `boolean` | Não | Exibe uma linha de resumo no rodapé. Requer `aggregation` na configuração da coluna. |
| `enableDrilldown` | `boolean` | Não | Permite expandir uma linha para ver detalhes adicionais. |
| `enableRowSelection` | `boolean` | Não | Adiciona checkboxes para selecionar linhas. |
| `enableInlineEditing` | `boolean` | Não | Permite edição de células com duplo clique. `enableEditing` deve estar `true` na coluna. |
| `rowKeyColumn` | `string` | Sim | Coluna com valores únicos para identificar cada linha. |
| `drilldown` | `DrilldownConfig` | Não | Configuração para a visualização de drill-down. |
| `groupBy` | `Array<string>` | Não | Uma lista de chaves de coluna para agrupar as linhas. |

**Exemplo:**
```json
{
  "id": "sinacor-audit-log-table",
  "type": "datatable",
  "dataSource": "sinacor_audit",
  "title": "Logs de Execução do Pipeline",
  "gridWidth": 12,
  "gridHeight": 8,
  "rowKeyColumn": "pipeline_run_id",
  "pageSize": 15,
  "enableGlobalSearch": true,
  "columns": [
    { "key": "pipeline_run_timestamp", "header": "Timestamp", "enableSorting": true },
    { "key": "layer", "header": "Layer", "enableSorting": true, "enableFiltering": true },
    { "key": "exec_status", "header": "Status", "textAlign": "center" },
    { 
      "key": "num_affected_rows", 
      "header": "Linhas Afetadas", 
      "textAlign": "right",
      "conditionalFormatting": [
        { "type": "heatmap", "colorScheme": "interpolateCool" }
      ]
    }
  ]
}
```

---

### 14. Gráfico de Pizza (`type: 'pie'`)
Mostra a proporção de cada categoria em relação a um todo.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as fatias da pizza. |
| `valueColumn` | `string` | Sim | Coluna para o valor de cada fatia. |
| `showLabels` | `string` | Não | Como exibir rótulos nas fatias (`'percent'`, `'value'`, `'none'`). |
| `showLegend` | `boolean` | Não | Exibe ou oculta a legenda. Padrão: `true`. |

---

### 15. Gráfico de Rosca (`type: 'donut'`)
Semelhante a um gráfico de pizza, mas com um centro oco que pode exibir texto ou um valor total.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| ... | ... | ... | *Todas as propriedades do Gráfico de Pizza, mais:* |
| `innerRadiusRatio` | `number` | Não | Proporção do raio para o buraco interno (ex: `0.6`). |
| `centerText` | `string` | Não | Texto a ser exibido no centro (ex: `'Total'`). |

**Exemplo:**
```json
{
  "id": "sales-by-region-donut",
  "type": "donut",
  "dataSource": "fruit_sales_by_region",
  "title": "Ásia lidera as vendas globais",
  "categoryColumn": "region",
  "valueColumn": "sales",
  "gridWidth": 6,
  "gridHeight": 3,
  "showLabels": "percent",
  "showLegend": true,
  "centerText": "Vendas Totais"
}
```

---

### 16. Gráfico de Rosca Semicircular (`type: 'semicircle-donut'`)
Uma variação do gráfico de rosca que ocupa metade do espaço.

*Configuração idêntica ao Gráfico de Rosca.*

---

### 17. Gráfico de Medidor (`type: 'gauge'`)
Mede um valor em relação a um intervalo e faixas de desempenho, semelhante a um velocímetro.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dataColumn` | `string` | Sim | Coluna para agregar o valor. |
| `aggregation` | `string` | Sim | Como agregar `dataColumn`. |
| `minValue` | `number` | Sim | O valor mínimo no medidor. |
| `maxValue` | `number` | Sim | O valor máximo no medidor. |
| `ranges` | `Array<{ from: number, to: number, color: string, label: string }>` | Sim | Define as faixas coloridas e seus rótulos. |

**Exemplo:**
```json
{
  "id": "overall-quality-score",
  "type": "gauge",
  "dataSource": "sinacor_audit",
  "title": "Pontuação Geral de Qualidade",
  "gridWidth": 12,
  "gridHeight": 3,
  "dataColumn": "quality_score",
  "aggregation": "avg",
  "minValue": 0,
  "maxValue": 100,
  "valueSuffix": "%",
  "ranges": [
    { "from": 0, "to": 90, "color": "#f87171", "label": "Crítico" },
    { "from": 90, "to": 98, "color": "#facc15", "label": "Aviso" },
    { "from": 98, "to": 100, "color": "#4ade80", "label": "Saudável" }
  ]
}
```

---

### 18. Gráfico de Pirâmide (`type: 'pyramid'`)
Visualiza estágios de um processo, como um funil de vendas.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `stageColumn` | `string` | Sim | Coluna contendo os nomes das etapas/estágios. |
| `valueColumn` | `string` | Sim | Coluna contendo os valores para cada etapa. |
| `colors` | `Array<string>` | Não | Uma lista de cores para os segmentos da pirâmide, de cima para baixo. |

**Exemplo:**
```json
{
  "id": "mango-supply-chain-funnel",
  "type": "pyramid",
  "dataSource": "mango_supply_chain",
  "title": "Perda de um terço das mangas da fazenda à mesa",
  "gridWidth": 12,
  "gridHeight": 4,
  "stageColumn": "stage",
  "valueColumn": "units"
}
```

---

### 19. Gráfico de Linha (`type: 'line'`)
Exibe dados ao longo de um eixo contínuo, geralmente tempo ou números.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `xColumn` | `string` | Sim | Coluna para o eixo X (deve conter datas ou números). |
| `series` | `Array<{ key: string, name: string, color: string }>` | Sim | Define as linhas a serem plotadas. `key` é a coluna de dados, `name` é o rótulo da legenda. |
| `xAxisType` | `string` | Não | Tipo de dados no eixo X (`'date'` ou `'number'`). Padrão: `'date'`. |
| `facetSeries` | `boolean` | Não | Se `true`, cria um pequeno gráfico separado (facet) para cada série, em vez de plotá-las juntas. |

**Exemplo:**
```json
{
  "id": "fruit-price-trends",
  "type": "line",
  "dataSource": "fruit_prices",
  "title": "Preço da maçã sobe e banana permanece a mais barata",
  "gridWidth": 12,
  "gridHeight": 4,
  "xColumn": "date",
  "xAxisType": "date",
  "series": [
    { "key": "Apple", "name": "Maçã", "color": "#3B82F6" },
    { "key": "Banana", "name": "Banana", "color": "#A855F7" }
  ],
  "yAxisFormat": "currency"
}
```

---

### 20. Gráfico de Dispersão (`type: 'scatter'`)
Exibe a relação entre duas variáveis numéricas.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `xColumn` | `string` | Sim | Coluna para o eixo X. |
| `yColumn` | `string` | Sim | Coluna para o eixo Y. |
| `labelColumn` | `string` | Sim | Coluna usada como rótulo para cada ponto. |
| `colorColumn` | `string` | Não | Coluna usada para colorir os pontos (pode ser categórica ou numérica). |
| `colorScheme` | `object | Array<string>` | Não | Se `colorColumn` for categórica, um mapa de valor-cor. Se numérica, uma tupla `[minColor, maxColor]`. |
| `highlightPoints`| `Array<{ label: string, color: string, radius?: number }>` | Não | Destaca pontos específicos com uma cor e/ou raio diferente. |

**Exemplo:**
```json
{
  "id": "fruit-sugar-fiber-scatter",
  "type": "scatter",
  "dataSource": "fruit_fiber_sugar",
  "title": "Abacate e framboesa: líderes em fibras e baixos em açúcar",
  "gridWidth": 12,
  "gridHeight": 5,
  "xColumn": "sugar",
  "yColumn": "fiber",
  "labelColumn": "fruit",
  "xAxisLabel": "Açúcar (g/100 g)",
  "yAxisLabel": "Fibra (g/100 g)",
  "colorColumn": "type"
}
```

---

### 21. Histograma (`type: 'histogram'`)
Visualiza a distribuição de uma ou mais variáveis numéricas.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `distributions` | `Array<{ key: string, name: string, color: string }>` | Sim | Define as distribuições a serem plotadas. `key` é a coluna de dados. |
| `binCount` | `number` | Não | O número de caixas (bins) a serem usadas para agrupar os dados. |

**Exemplo:**
```json
{
  "id": "fruit-dimensions-histogram",
  "type": "histogram",
  "dataSource": "fruit_dimensions",
  "title": "Distribuição das Dimensões das Frutas",
  "gridWidth": 6,
  "gridHeight": 3,
  "distributions": [
    { "key": "length", "name": "Comprimento", "color": "#4e79a7" },
    { "key": "width", "name": "Largura", "color": "#f28e2c" }
  ],
  "binCount": 20,
  "xAxisLabel": "Dimensão (mm)"
}
```

---

### 22. Box Plot (`type: 'box-plot'`)
Exibe a distribuição de dados numéricos através de seus quartis.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `categoryColumn` | `string` | Sim | Coluna para as categorias no eixo X. |
| `valueColumn` | `string` | Sim | Coluna numérica para o eixo Y. |
| `colorColumn` | `string` | Não | Coluna categórica para colorir os box plots. |

**Exemplo:**
```json
{
  "id": "fruit-shelf-life-boxplot",
  "type": "box-plot",
  "dataSource": "fruit_shelf_life",
  "title": "Maçãs duram mais, frutas vermelhas estragam mais rápido",
  "gridWidth": 12,
  "gridHeight": 5,
  "categoryColumn": "fruit",
  "valueColumn": "shelf_life_days",
  "colorColumn": "type"
}
```

---

### 23. Gráfico de Candlestick (`type: 'candlestick'`)
Um gráfico financeiro usado para descrever os movimentos de preços de um ativo.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `dateColumn` | `string` | Sim | Coluna para as datas/categorias no eixo X. |
| `openColumn` | `string` | Sim | Coluna para o preço de abertura. |
| `highColumn` | `string` | Sim | Coluna para o preço mais alto. |
| `lowColumn` | `string` | Sim | Coluna para o preço mais baixo. |
| `closeColumn` | `string` | Sim | Coluna para o preço de fechamento. |

**Exemplo:**
```json
{
  "id": "fruitbasket-stock-candlestick",
  "type": "candlestick",
  "dataSource": "fruit_basket_stock",
  "title": "Ações da FruitBasketCorp. sobem no início de junho",
  "gridWidth": 12,
  "gridHeight": 5,
  "dateColumn": "date",
  "openColumn": "open",
  "highColumn": "high",
  "lowColumn": "low",
  "closeColumn": "close"
}
```

---

### 24. Painel de Gráficos (`type: 'chart-panel'`)
Renderiza uma grade de múltiplos pequenos gráficos, um para cada categoria em uma coluna especificada.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `panelCategoryColumn` | `string` | Sim | Coluna usada para dividir os dados e criar um gráfico para cada valor único. |
| `chartConfig` | `InnerChartConfig` | Sim | A configuração para o tipo de gráfico interno a ser renderizado (ex: `'pie'`, `'gauge'`, `'line'`). |
| `chartsPerRow` | `number` (2-6) | Não | Quantos gráficos exibir por linha. Padrão: `6`. |

**Exemplo:**
```json
{
  "id": "quality-by-layer-panel",
  "type": "chart-panel",
  "dataSource": "sinacor_audit",
  "title": "Pontuação de Qualidade por Camada",
  "gridWidth": 12,
  "gridHeight": 3,
  "panelCategoryColumn": "layer",
  "chartsPerRow": 3,
  "chartConfig": {
    "type": "gauge",
    "dataColumn": "quality_score",
    "aggregation": "avg",
    "minValue": 0,
    "maxValue": 100,
    "valueSuffix": "%",
    "ranges": [
      { "from": 0, "to": 90, "color": "#f87171", "label": "Crítico" },
      { "from": 90, "to": 98, "color": "#facc15", "label": "Aviso" },
      { "from": 98, "to": 100, "color": "#4ade80", "label": "Saudável" }
    ]
  }
}
```

---

### 25. Markdown (`type: 'markdown'`)
Renderiza conteúdo estático usando a sintaxe Markdown. Útil para títulos, notas explicativas ou texto introdutório.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `content` | `string` | Sim | O conteúdo Markdown a ser renderizado. |
| `transparentBackground` | `boolean` | Não | Se `true`, remove o fundo padrão do widget, fazendo com que o texto flutue sobre o fundo do dashboard. |

**Exemplo:**
```json
{
  "id": "welcome-markdown",
  "type": "markdown",
  "dataSource": "",
  "title": "Bem-vindo",
  "description": "Uma mensagem de boas-vindas.",
  "gridWidth": 12,
  "gridHeight": 2,
  "transparentBackground": true,
  "content": "# Bem-vindo ao Dashboard de Saúde do Projeto!\n\nEste dashboard fornece uma visão geral em tempo real dos nossos projetos."
}
```

---

### 26. Formulário (`type: 'form'`)
Renderiza um formulário com vários tipos de campos de entrada. Os dados enviados são registrados no console por padrão.

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `fields` | `Array<FormFieldConfig>` | Sim | Uma lista de objetos de configuração para cada campo do formulário. |
| `submitButtonText` | `string` | Não | Texto para o botão de envio. Padrão: `'Submit'`. |

**Tipos de Campo de Formulário (`FormFieldConfig`):**
Cada objeto de campo pode ter `name`, `label`, `description`, `required`, `defaultValue`, `placeholder`. Propriedades adicionais dependem do `type`:
- `text`, `password`: Campos de texto padrão.
- `textarea`: Área de texto com várias linhas (`rows`).
- `radio`, `checkbox`, `select`: Requerem uma lista de `options: [{value: string, label: string}]`.
- `date`: Um seletor de data.
- `slider`: Um controle deslizante com `min`, `max`, `step`.
- `file`: Um campo de upload de arquivo com `accept` (ex: `'image/*'`).
- `richtext`: Um editor de texto rico básico.
- `address`: Um campo de texto simples (pretendido para integração futura com autocomplete).

**Exemplo:**
```json
{
  "id": "user-profile-form",
  "type": "form",
  "dataSource": "",
  "title": "Perfil de Usuário",
  "description": "Uma demonstração de vários campos de formulário.",
  "gridWidth": 12,
  "gridHeight": 12,
  "submitButtonText": "Salvar Perfil",
  "fields": [
    { "name": "fullName", "label": "Nome Completo", "type": "text", "required": true },
    { "name": "accountType", "label": "Tipo de Conta", "type": "radio", "options": [{ "value": "personal", "label": "Pessoal" }, { "value": "business", "label": "Empresarial" }] }
  ]
}
```
