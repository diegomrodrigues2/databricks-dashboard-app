import type { Dashboard, AppConfig, WidgetConfig } from '../types';
import { fruitSalesDashboardConfig } from './dashboards/fruitSales';
import {
    getAllDashboards,
    getDashboard,
    saveDashboard,
    deleteDashboard as deleteDashboardFromStorage,
    StoredDashboard
} from './dashboardStorageService';
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

export const getDashboards = async (): Promise<Dashboard[]> => {
    const storedDashboards = await getAllDashboards();
    return storedDashboards.map(d => d.meta);
};

export const getDashboardConfig = async (id: string): Promise<AppConfig> => {
    const stored = await getDashboard(id);
    if (stored) {
        return stored.config;
    }
    throw new Error("Dashboard not found");
};

export const createDashboard = async (title: string): Promise<Dashboard> => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newDashboard: StoredDashboard = {
        id,
        meta: { id, title, type: 'dashboard' },
        config: {
            name: title,
            version: '1.0.0',
            datasources: [], // You might want to default some datasources or allow adding them later
            dashboard: {
                title,
                widgets: []
            }
        },
        createdAt: now,
        updatedAt: now
    };
    await saveDashboard(newDashboard);
    return newDashboard.meta;
};

export const renameDashboard = async (id: string, newTitle: string): Promise<void> => {
    const stored = await getDashboard(id);
    if (!stored) throw new Error("Dashboard not found");

    stored.meta.title = newTitle;
    stored.config.dashboard.title = newTitle;
    stored.updatedAt = Date.now();

    await saveDashboard(stored);
};

export const deleteDashboard = async (id: string): Promise<void> => {
    await deleteDashboardFromStorage(id);
};

export const addWidgetToDashboard = async (dashboardId: string, widgetConfig: WidgetConfig): Promise<void> => {
    const stored = await getDashboard(dashboardId);
    if (!stored) throw new Error("Dashboard not found");

    // Create a deep copy of the widget config to avoid reference issues
    const newWidget = JSON.parse(JSON.stringify(widgetConfig));
    
    // Ensure unique ID for the widget
    newWidget.id = crypto.randomUUID();

    // Add to dashboard widgets
    stored.config.dashboard.widgets.push(newWidget);
    stored.updatedAt = Date.now();

    await saveDashboard(stored);
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

export const executeRawQuery = async (query: string, language: string): Promise<any[]> => {
    // Mock delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (language === 'python') {
        return Promise.resolve([{ output: "Python execution is mocked. Result: [1, 2, 3, 4, 5]" }]);
    }

    // Simple keyword matching for SQL mocks
    const lowerQuery = query.toLowerCase();
    let data: any[] = [];
    
    if (lowerQuery.includes('fruit_sales') && !lowerQuery.includes('growth')) {
        data = await getFruitSalesData();
    } else if (lowerQuery.includes('growth')) {
        data = await getFruitSalesGrowthData();
    } else if (lowerQuery.includes('revenue')) {
        data = await getFruitRevenueData();
    } else if (lowerQuery.includes('price')) {
        data = await getFruitPriceData();
    } else if (lowerQuery.includes('chocolate')) {
        data = await getChocolateSalesData();
    } else if (lowerQuery.includes('stock') || lowerQuery.includes('basket')) {
        data = await getFruitBasketCorpStockData();
    } else {
        // Default fallback
         data = [
            { id: 1, message: "Query executed successfully", rows_affected: 0 },
            { id: 2, message: "No specific mock data matched", result: "Empty set" }
        ];
    }

    // Simple LIMIT emulation for the mock
    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    if (limitMatch && data.length > 0) {
        const limit = parseInt(limitMatch[1], 10);
        return data.slice(0, limit);
    }

    return data;
};
