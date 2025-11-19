import type { Dashboard, AppConfig } from '../types';
import { fruitSalesDashboardConfig } from './dashboards/fruitSales';
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

const mockDashboards: Dashboard[] = [
  { id: 'example', title: 'Example Dashboard', type: 'dashboard' },
  { id: 'chat', title: 'Example Chat', type: 'chat' },
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
            if (id === 'example') {
                resolve(fruitSalesDashboardConfig);
            } else {
                reject(new Error("Dashboard not found"));
            }
        }, 200);
    });
};

export const getDataForSource = (sourceName: string): Promise<any[]> => {
    switch (sourceName) {
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
        default:
            return Promise.resolve([]);
    }
};