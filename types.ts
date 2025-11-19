

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Dashboard {
  id: string;
  title: string;
  section?: string;
  type?: 'dashboard' | 'chat'; // 'dashboard' is default, 'chat' opens chat overlay
}

export type Page = 'dashboard' | 'profile' | 'config' | 'chat';

export type AggregationType = 'avg' | 'max' | 'min' | 'sum' | 'count' | 'count_distinct';

// Note: This is now a legacy type, prefer using the more specific WidgetConfig types
export interface KPIConfig {
  title: string;
  description: string;
  dataColumn: string;
  aggregation: AggregationType;
  target: number;
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
  color?: string;
  gridWidth?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  gridHeight?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export interface DataSource {
  name: string;
  description: string;
  enableInlineEditing?: boolean;
}

export interface WidgetFilter {
  column: string;
  operator: '===' | '!==' | '>' | '<' | '>=' | '<=';
  value: any;
}

interface BaseWidgetConfig {
    id: string;
    dataSource: string;
    filters?: WidgetFilter[];
    title: string;
    description: string;
    gridWidth?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    gridHeight?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export interface KPIWidgetConfig extends BaseWidgetConfig {
    type: 'kpi';
    dataColumn: string;
    aggregation: AggregationType;
    target: number;
    prefix?: string;
    suffix?: string;
    decimalPlaces?: number;
    color?: string;
}

export interface BarChartWidgetConfig extends BaseWidgetConfig {
    type: 'bar';
    categoryColumn: string;
    valueColumn: string;
    aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
    colorCategoryColumn?: string;
    color?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    yAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface GroupedBarChartColumn {
    key: string;
    name: string;
    color: string;
}

export interface GroupedBarChartWidgetConfig extends BaseWidgetConfig {
    type: 'grouped-bar';
    categoryColumn: string;
    barColumns: GroupedBarChartColumn[];
    legendFilterColumn?: string;
    xAxisLabel?: string; // This will be the value axis
    yAxisLabel?: string; // This will be the category axis
    xAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface LollipopChartWidgetConfig extends BaseWidgetConfig {
    type: 'lollipop';
    categoryColumn: string;
    valueColumn: string;
    aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
    color?: string;
    highlightColor?: string;
    highlightCategory?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    xAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
    targetValue?: number;
    targetColor?: string;
}

export interface BulletChartRange {
    value: number;
    label: string;
}

export interface BulletChartWidgetConfig extends BaseWidgetConfig {
    type: 'bullet';
    categoryColumn: string;
    valueColumn: string;
    aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
    targetValue: number;
    ranges: BulletChartRange[];
    color?: string; // for the main value bar
    rangeColor?: string; // for the background range bar
    targetColor?: string;
    valueFormat?: 'number' | 'currency';
    currencySymbol?: string;
    decimalPlaces?: number;
    valueNotation?: 'compact';
}

export interface DotPlotColumn {
    key: string;
    name: string;
    color: string;
}

export interface DotPlotWidgetConfig extends BaseWidgetConfig {
    type: 'dot-plot';
    categoryColumn: string;
    dotColumns: DotPlotColumn[];
    legendFilterColumn?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    xAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface DumbbellPoint {
    key: string;
    name: string;
    color: string;
}

export interface DumbbellChartWidgetConfig extends BaseWidgetConfig {
    type: 'dumbbell';
    categoryColumn: string;
    points: [DumbbellPoint, DumbbellPoint];
    legendFilterColumn?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    xAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface RangePlotWidgetConfig extends BaseWidgetConfig {
    type: 'range-plot';
    categoryColumn: string;
    rangeStartColumn: string;
    rangeEndColumn: string;
    barColor?: string;
    capColor?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    xAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface RadialBarChartWidgetConfig extends BaseWidgetConfig {
    type: 'radial-bar';
    categoryColumn: string;
    valueColumn: string;
    aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
    color?: string;
    highlightColor?: string;
    highlightCategory?: string;
    valueFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface WaterfallChartWidgetConfig extends BaseWidgetConfig {
    type: 'waterfall';
    categoryColumn: string;
    valueColumn: string;
    totalCategories: string[];
    positiveColor?: string;
    negativeColor?: string;
    totalColor?: string;
    yAxisLabel?: string;
    yAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface MatrixChartWidgetConfig extends BaseWidgetConfig {
    type: 'matrix';
    rowCategoryColumn: string;
    columnCategoryColumn: string;
    valueColumn: string; // Should resolve to a boolean
    yesColor?: string;
    noColor?: string;
}

export interface ConditionalFormattingRule {
    column: string;
    type: 'color-scale';
    colorScheme: [string, string]; // [minColor, maxColor]
}

export interface TableChartColumnConfig {
    key: string;
    header: string;
    subHeader?: string;
    format?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
    textAlign?: 'left' | 'center' | 'right';
}

export interface TableChartWidgetConfig extends BaseWidgetConfig {
    type: 'table';
    rowCategoryColumn: string;
    columns: TableChartColumnConfig[];
    conditionalFormatting?: ConditionalFormattingRule[];
}

// --- Data Table Conditional Formatting Types ---
export type HeatmapColorScheme = 'interpolateBlues' | 'interpolateGreens' | 'interpolateReds' | 'interpolateOranges' | 'interpolatePurples' | 'interpolateGreys' | 'interpolateViridis' | 'interpolateInferno' | 'interpolateMagma' | 'interpolatePlasma' | 'interpolateCool' | 'interpolateWarm';

interface ValueCondition {
    operator: '===' | '!==' | '>' | '<' | '>=' | '<=' | 'contains' | 'not-contains';
    value: any;
}

interface ConditionalFormattingRuleBase {
    className?: string; // Applied to the cell wrapper <td>
    textClassName?: string; // Applied to the text span inside
}

export interface ValueFormattingRule extends ConditionalFormattingRuleBase {
    type: 'value';
    condition: ValueCondition;
}

export interface HeatmapFormattingRule {
    type: 'heatmap';
    colorScheme: HeatmapColorScheme;
    textClassName?: string;
}

export interface DataBarFormattingRule {
    type: 'data-bar';
    color: string;
}

export type DataTableConditionalFormattingRule = ValueFormattingRule | HeatmapFormattingRule | DataBarFormattingRule;
// --- End Data Table Types ---


export interface DataTableColumnConfig {
    key: string;
    header: string;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    width?: string;
    aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    conditionalFormatting?: DataTableConditionalFormattingRule[];
    enableEditing?: boolean;
}

export interface MiniBarChartDrilldownConfig {
    type: 'mini-bar-chart';
    title: string;
    bars: {
        key: string;
        label: string;
        color: string;
    }[];
}

export interface KeyValueDrilldownConfig {
    type: 'key-value';
    title: string;
    items: {
        key: string;
        label: string;
    }[];
}

export type DrilldownConfig = MiniBarChartDrilldownConfig | KeyValueDrilldownConfig;

export interface DataTableWidgetConfig extends BaseWidgetConfig {
    type: 'datatable';
    columns: DataTableColumnConfig[];
    pageSize?: number;
    enableGlobalSearch?: boolean;
    enableSummarization?: boolean;
    enableDrilldown?: boolean;
    enableRowSelection?: boolean;
    enableInlineEditing?: boolean;
    enableRowCreation?: boolean;
    rowKeyColumn: string; // Required for drilldown to uniquely identify rows
    drilldown?: DrilldownConfig;
    groupBy?: string[];
}

export interface PieChartWidgetConfig extends BaseWidgetConfig {
    type: 'pie';
    categoryColumn: string;
    valueColumn: string;
    categoryColors?: { [key: string]: string };
    showLabels?: 'percent' | 'value' | 'none';
    decimalPlaces?: number;
    showLegend?: boolean;
}

export interface DonutChartWidgetConfig extends BaseWidgetConfig {
    type: 'donut';
    categoryColumn: string;
    valueColumn: string;
    categoryColors?: { [key: string]: string };
    showLabels?: 'percent' | 'value' | 'none';
    decimalPlaces?: number;
    showLegend?: boolean;
    innerRadiusRatio?: number; // e.g., 0.6 for a typical donut
    centerText?: string; // e.g., "Total"
}

export interface SemicircleDonutChartWidgetConfig extends BaseWidgetConfig {
    type: 'semicircle-donut';
    categoryColumn: string;
    valueColumn: string;
    categoryColors?: { [key: string]: string };
    showLabels?: 'percent' | 'value' | 'none';
    decimalPlaces?: number;
    showLegend?: boolean;
    innerRadiusRatio?: number;
    centerText?: string;
}

export interface GaugeChartRange {
    from: number;
    to: number;
    color: string;
    label: string;
}

export interface GaugeChartWidgetConfig extends BaseWidgetConfig {
    type: 'gauge';
    dataColumn: string;
    aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
    minValue: number;
    maxValue: number;
    ranges: GaugeChartRange[];
    valueSuffix?: string;
    decimalPlaces?: number;
}

export interface PyramidChartWidgetConfig extends BaseWidgetConfig {
    type: 'pyramid';
    stageColumn: string;
    valueColumn: string;
    colors?: string[]; // Array of colors for stages from top to bottom
}

export interface LineChartSeries {
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
}

export interface LineChartWidgetConfig extends BaseWidgetConfig {
    type: 'line';
    xColumn: string; // Should contain date strings or numbers
    series: LineChartSeries[];
    seriesFilterColumn?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    yAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
    facetSeries?: boolean;
    xAxisType?: 'date' | 'number';
}

export interface HighlightPointConfig {
    label: string;
    color: string;
    radius?: number;
    showLabel?: boolean;
}

export interface ScatterPlotWidgetConfig extends BaseWidgetConfig {
    type: 'scatter';
    xColumn: string;
    yColumn: string;
    labelColumn: string;
    pointColor?: string;
    pointRadius?: number;
    colorColumn?: string;
    colorScheme?: { [key: string]: string } | [string, string];
    highlightPoints?: HighlightPointConfig[];
    xAxisLabel?: string;
    yAxisLabel?: string;
    xAxisFormat?: 'number' | 'currency' | 'percent';
    yAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface DistributionConfig {
    key: string;
    name: string;
    color: string;
}

export interface HistogramWidgetConfig extends BaseWidgetConfig {
    type: 'histogram';
    distributions: DistributionConfig[];
    legendFilterColumn?: string;
    binCount?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    xAxisFormat?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    decimalPlaces?: number;
}

export interface MarkdownWidgetConfig extends BaseWidgetConfig {
    type: 'markdown';
    content: string;
    transparentBackground?: boolean;
}

export interface BoxPlotWidgetConfig extends BaseWidgetConfig {
    type: 'box-plot';
    categoryColumn: string;
    valueColumn: string;
    color?: string;
    colorColumn?: string;
    categoryColors?: { [key: string]: string };
    xAxisLabel?: string;
    yAxisLabel?: string;
    yAxisFormat?: 'number' | 'currency' | 'percent';
    decimalPlaces?: number;
}

export interface CandlestickChartWidgetConfig extends BaseWidgetConfig {
    type: 'candlestick';
    dateColumn: string;
    openColumn: string;
    highColumn: string;
    lowColumn: string;
    closeColumn: string;
    upColor?: string;
    downColor?: string;
    yAxisLabel?: string;
    yAxisFormat?: 'number' | 'currency';
    currencySymbol?: string;
    decimalPlaces?: number;
}

type InnerChartConfig = 
    | Omit<PieChartWidgetConfig, 'id' | 'dataSource' | 'filters' | 'title' | 'description' | 'gridWidth' | 'gridHeight'>
    | Omit<DonutChartWidgetConfig, 'id' | 'dataSource' | 'filters' | 'title' | 'description' | 'gridWidth' | 'gridHeight'>
    | Omit<SemicircleDonutChartWidgetConfig, 'id' | 'dataSource' | 'filters' | 'title' | 'description' | 'gridWidth' | 'gridHeight'>
    | Omit<BarChartWidgetConfig, 'id' | 'dataSource' | 'filters' | 'title' | 'description' | 'gridWidth' | 'gridHeight'>
    | Omit<GaugeChartWidgetConfig, 'id' | 'dataSource' | 'filters' | 'title' | 'description' | 'gridWidth' | 'gridHeight'>
    | Omit<LineChartWidgetConfig, 'id' | 'dataSource' | 'filters' | 'title' | 'description' | 'gridWidth' | 'gridHeight'>;

export interface ChartPanelWidgetConfig extends BaseWidgetConfig {
    type: 'chart-panel';
    panelCategoryColumn: string;
    chartConfig: InnerChartConfig;
    chartsPerRow?: 2 | 3 | 4 | 5 | 6;
}

// --- Form Widget Types ---

export interface FormFieldOption {
    value: string;
    label: string;
}

export type FormFieldType =
    | 'text'
    | 'textarea'
    | 'password'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'date'
    | 'slider'
    | 'file'
    | 'richtext'
    | 'address';

interface BaseFieldConfig {
    name: string;
    label: string;
    description?: string;
    type: FormFieldType;
    required?: boolean;
    defaultValue?: any;
    placeholder?: string;
}

export interface TextFieldConfig extends BaseFieldConfig {
    type: 'text' | 'password';
}

export interface TextareaFieldConfig extends BaseFieldConfig {
    type: 'textarea';
    rows?: number;
}

export interface OptionsFieldConfig extends BaseFieldConfig {
    type: 'radio' | 'checkbox' | 'select';
    options: FormFieldOption[];
}

export interface DateFieldConfig extends BaseFieldConfig {
    type: 'date';
}

export interface SliderFieldConfig extends BaseFieldConfig {
    type: 'slider';
    min: number;
    max: number;
    step: number;
}

export interface FileFieldConfig extends BaseFieldConfig {
    type: 'file';
    accept?: string; // e.g. 'image/*,.pdf'
}

export interface RichTextFieldConfig extends BaseFieldConfig {
    type: 'richtext';
    rows?: number;
}

export interface AddressFieldConfig extends BaseFieldConfig {
    type: 'address';
}

export type FormFieldConfig = 
    | TextFieldConfig
    | TextareaFieldConfig
    | OptionsFieldConfig
    | DateFieldConfig
    | SliderFieldConfig
    | FileFieldConfig
    | RichTextFieldConfig
    | AddressFieldConfig;

export interface FormWidgetConfig extends BaseWidgetConfig {
    type: 'form';
    fields: FormFieldConfig[];
    submitButtonText?: string;
}


export type WidgetConfig = KPIWidgetConfig | BarChartWidgetConfig | GroupedBarChartWidgetConfig | LollipopChartWidgetConfig | BulletChartWidgetConfig | DotPlotWidgetConfig | DumbbellChartWidgetConfig | RangePlotWidgetConfig | RadialBarChartWidgetConfig | WaterfallChartWidgetConfig | MatrixChartWidgetConfig | TableChartWidgetConfig | PieChartWidgetConfig | DonutChartWidgetConfig | SemicircleDonutChartWidgetConfig | ChartPanelWidgetConfig | GaugeChartWidgetConfig | PyramidChartWidgetConfig | LineChartWidgetConfig | ScatterPlotWidgetConfig | HistogramWidgetConfig | MarkdownWidgetConfig | BoxPlotWidgetConfig | CandlestickChartWidgetConfig | FormWidgetConfig | DataTableWidgetConfig;

export type FilterType = 'text' | 'select' | 'multiselect' | 'daterange';

export interface DashboardFilterConfig {
    column: string;
    label: string;
    type: FilterType;
    dataSource: string; // The data source to get unique values from for select options
}

export interface DashboardLayout {
  title: string;
  widgets: WidgetConfig[];
  filters?: DashboardFilterConfig[];
}

export interface AppConfig {
  name: string;
  version: string;
  datasources: DataSource[];
  dashboard: DashboardLayout;
}

// --- Chat Types ---

export interface TextPart {
  type: 'text';
  content: string;
}

export interface WidgetPart {
  type: 'widget';
  config: WidgetConfig;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  parsedParts?: (TextPart | WidgetPart)[];
}