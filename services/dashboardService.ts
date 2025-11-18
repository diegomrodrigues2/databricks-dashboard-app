import type { Dashboard, AppConfig } from '../types';
import { projectHealthDashboardConfig } from './dashboards/projectHealth';
import { fruitSalesDashboardConfig } from './dashboards/fruitSales';
import { formsDashboardConfig } from './dashboards/formsDashboard';
import { sinacorAuditDashboardConfig } from './dashboards/sinacorAudit';
import { contaGestoraDashboardConfig } from './dashboards/contaGestora';
import { contaAssessorDashboardConfig } from './dashboards/contaAssessor';
import { cbioBtcDashboardConfig } from './dashboards/cbioBtc';
import { splitExcecaoProdutoDashboardConfig } from './dashboards/splitExcecaoProduto';

import { getKpiData } from './dashboards/projectHealth';
import {
    getFruitSalesData,
    getLollipopFruitSalesData,
    getFruitRevenueData,
    getFruitSeasonalSalesData,
    getFruitSalesGrowthData,
    getFruitPriceRangeData,
    getMangoRevenueData,
    getFruitMatrixData,
    getFruitTasteData,
    getFruitUsageData,
    getFruitSalesByRegionData,
    getAppleSalesGoalData,
    getFruitRipenessData,
    getMangoSupplyChainData,
    getFruitPriceData,
    getChocolateSalesData,
    getRegionalFruitPricesData,
    getFruitFiberSugarData,
    getFruitWeightData,
    getFruitDimensionsData,
    getFruitShelfLifeData,
    getFruitBasketCorpStockData,
} from './dashboards/fruitSales';
import { getSinacorAuditData } from './dashboards/sinacorAudit';
import { getContaGestoraData } from './dashboards/contaGestora';
import { getContaAssessorData } from './dashboards/contaAssessor';
import { getCBIOBTCData } from './dashboards/cbioBtc';
import { getSplitExcecaoProdutoData } from './dashboards/splitExcecaoProduto';


const mockDashboards: Dashboard[] = [
  { id: '1', title: 'Project Health' },
  { id: '3', title: 'Forms Demo' },
  { id: '2', title: 'Fruit Sales Dashboard with a very long name to test the text wrapping feature', section: 'Análise de Dados' },
  { id: '4', title: 'Sinacor Audit', section: 'Operações Sinacor' },
  { id: '5', title: 'Sinacor Micro Batches', section: 'Operações Sinacor' },
  { id: '6', title: 'Sinacor Incremental', section: 'Operações Sinacor' },
  { id: '7', title: '1. Conta Gestora (PNP)', section: 'Business Rules' },
  { id: '8', title: '2. Conta Assessor (Commodity)', section: 'Business Rules' },
  { id: '9', title: '3. CBIO BTC', section: 'Business Rules' },
  { id: '10', title: '4. SPLIT Exceção Produto', section: 'Business Rules' },
];

export const getDashboards = (): Promise<Dashboard[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDashboards);
    }, 500);
  });
};

export const getDashboardConfig = (id: string): Promise<AppConfig> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (id === '1') {
                resolve(projectHealthDashboardConfig);
            } else if (id === '2') {
                resolve(fruitSalesDashboardConfig);
            } else if (id === '3') {
                resolve(formsDashboardConfig);
            } else if (id === '4' || id === '5' || id === '6') {
                resolve(sinacorAuditDashboardConfig);
            } else if (id === '7') {
                resolve(contaGestoraDashboardConfig);
            } else if (id === '8') {
                resolve(contaAssessorDashboardConfig);
            } else if (id === '9') {
                resolve(cbioBtcDashboardConfig);
            } else if (id === '10') {
                resolve(splitExcecaoProdutoDashboardConfig);
            } else {
                reject(new Error("Dashboard not found"));
            }
        }, 200);
    });
};

export const getDataForSource = (sourceName: string): Promise<any[]> => {
    switch (sourceName) {
        case 'project_issues':
            return getKpiData();
        case 'fruit_sales':
            return getFruitSalesData();
        case 'total_fruit_sales':
            return getLollipopFruitSalesData();
        case 'fruit_revenue':
            return getFruitRevenueData();
        case 'fruit_seasonal_sales':
            return getFruitSeasonalSalesData();
        case 'fruit_sales_growth':
            return getFruitSalesGrowthData();
        case 'fruit_price_range':
            return getFruitPriceRangeData();
        case 'mango_revenue':
            return getMangoRevenueData();
        case 'fruit_matrix_data':
            return getFruitMatrixData();
        case 'fruit_taste_data':
            return getFruitTasteData();
        case 'fruit_usage_data':
            return getFruitUsageData();
        case 'fruit_sales_by_region':
            return getFruitSalesByRegionData();
        case 'apple_sales_goal':
            return getAppleSalesGoalData();
        case 'fruit_ripeness_data':
            return getFruitRipenessData();
        case 'mango_supply_chain':
            return getMangoSupplyChainData();
        case 'fruit_prices':
            return getFruitPriceData();
        case 'chocolate_sales':
            return getChocolateSalesData();
        case 'regional_fruit_prices':
            return getRegionalFruitPricesData();
        case 'fruit_fiber_sugar':
            return getFruitFiberSugarData();
        case 'fruit_weights':
            return getFruitWeightData();
        case 'fruit_dimensions':
            return getFruitDimensionsData();
        case 'fruit_shelf_life':
            return getFruitShelfLifeData();
        case 'fruit_basket_stock':
            return getFruitBasketCorpStockData();
        case 'sinacor_audit':
            return getSinacorAuditData();
        case 'conta_gestora':
            return getContaGestoraData();
        case 'conta_assessor':
            return getContaAssessorData();
        case 'cbio_btc':
            return getCBIOBTCData();
        case 'split_excecao_produto':
            return getSplitExcecaoProdutoData();
        default:
            return Promise.resolve([]);
    }
};