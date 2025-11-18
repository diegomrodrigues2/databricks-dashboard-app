

import type { AppConfig } from '../../types';

const mockFruitSalesData = [
    { fruit: 'Grape', organic: 1.856, not_organic: 4.192 },
    { fruit: 'Banana', organic: 1.818, not_organic: 4.157 },
    { fruit: 'Blueberry', organic: 1.636, not_organic: 3.679 },
    { fruit: 'Orange', organic: 1.676, not_organic: 3.382 },
    { fruit: 'Apple', organic: 1.598, not_organic: 3.345 },
    { fruit: 'Pineapple', organic: 1.048, not_organic: 3.840 },
    { fruit: 'Mango', organic: 1.410, not_organic: 3.459 },
    { fruit: 'Strawberry', organic: 1.636, not_organic: 2.965 },
];

export const getFruitSalesData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitSalesData);
        }, 300);
    });
};

const mockLollipopFruitSalesData = [
    { fruit: 'Watermelon', units_sold: 6200 },
    { fruit: 'Grape', units_sold: 6048 },
    { fruit: 'Banana', units_sold: 5975 },
    { fruit: 'Blueberry', units_sold: 5315 },
    { fruit: 'Orange', units_sold: 4988 },
    { fruit: 'Apple', units_sold: 4943 },
    { fruit: 'Pineapple', units_sold: 4888 },
    { fruit: 'Mango', units_sold: 4869 },
    { fruit: 'Strawberry', units_sold: 4601 },
    { fruit: 'Kiwi', units_sold: 4500 },
    { fruit: 'Pear', units_sold: 4450 },
    { fruit: 'Peach', units_sold: 4400 },
    { fruit: 'Cantaloupe', units_sold: 4350 },
    { fruit: 'Papaya', units_sold: 4300 },
];

export const getLollipopFruitSalesData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockLollipopFruitSalesData);
        }, 300);
    });
};

const mockFruitRevenueData = [
    { fruit: 'Pineapple', revenue: 324000 },
    { fruit: 'Banana', revenue: 319000 },
    { fruit: 'Grape', revenue: 299000 },
    { fruit: 'Apple', revenue: 216000 },
    { fruit: 'Mango', revenue: 187000 },
    { fruit: 'Orange', revenue: 157000 },
    { fruit: 'Strawberry', revenue: 154000 },
    { fruit: 'Blueberry', revenue: 113000 },
];

export const getFruitRevenueData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitRevenueData);
        }, 300);
    });
};

const mockFruitSeasonalSalesData = [
    { fruit: 'Strawberry', winter: 0.800, spring: 1.000, summer: 1.800, autumn: 1.500 },
    { fruit: 'Mango', winter: 0.750, spring: 0.980, summer: 1.550, autumn: 1.350 },
    { fruit: 'Pineapple', winter: 0.780, spring: 0.950, summer: 1.750, autumn: 1.400 },
    { fruit: 'Apple', winter: 0.850, spring: 1.150, summer: 2.090, autumn: 1.600 },
    { fruit: 'Orange', winter: 0.820, spring: 1.050, summer: 2.000, autumn: 1.550 },
    { fruit: 'Blueberry', winter: 0.880, spring: 0.980, summer: 1.700, autumn: 1.400 },
    { fruit: 'Banana', winter: 0.900, spring: 1.050, summer: 1.850, autumn: 1.450 },
    { fruit: 'Grape', winter: 0.920, spring: 1.000, summer: 1.350, autumn: 1.470 },
].reverse();

export const getFruitSeasonalSalesData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitSeasonalSalesData);
        }, 300);
    });
};

const mockFruitSalesGrowthData = [
    { fruit: 'Grape',      sales_2023: 1.850, sales_2024: 2.480 },
    { fruit: 'Strawberry', sales_2023: 1.840, sales_2024: 2.450 },
    { fruit: 'Banana',     sales_2023: 1.810, sales_2024: 2.350 },
    { fruit: 'Pineapple',  sales_2023: 1.980, sales_2024: 2.400 },
    { fruit: 'Mango',      sales_2023: 1.620, sales_2024: 2.010 },
    { fruit: 'Orange',     sales_2023: 2.220, sales_2024: 2.500 },
    { fruit: 'Blueberry',  sales_2023: 1.950, sales_2024: 2.050 },
    { fruit: 'Apple',      sales_2023: 2.650, sales_2024: 2.300 },
];

export const getFruitSalesGrowthData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitSalesGrowthData);
        }, 300);
    });
};

const mockFruitPriceRangeData = [
    { fruit: 'Pineapple', min_price: 1.00, max_price: 4.00 },
    { fruit: 'Grape', min_price: 0.50, max_price: 3.10 },
    { fruit: 'Blueberry', min_price: 1.50, max_price: 3.50 },
    { fruit: 'Mango', min_price: 1.00, max_price: 2.50 },
    { fruit: 'Apple', min_price: 0.75, max_price: 2.00 },
    { fruit: 'Strawberry', min_price: 0.50, max_price: 1.75 },
    { fruit: 'Orange', min_price: 0.50, max_price: 1.90 },
    { fruit: 'Banana', min_price: 0.25, max_price: 0.75 },
].reverse();

export const getFruitPriceRangeData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitPriceRangeData);
        }, 300);
    });
};

const mockMangoRevenueData = [
    { period: 'Q1 2023', change: 12000 },
    { period: 'Q2 2023', change: 3000 },
    { period: 'Q3 2023', change: -1050 },
    { period: 'Q4 2023', change: 2930 },
    { period: 'Q1 2024', change: 2026 },
    { period: 'Q2 2024', change: 2080 },
    { period: 'Q3 2024', change: -1049 },
    { period: 'Q4 2024', change: 1994 },
    { period: 'Q1 2025', change: 1974 },
];

export const getMangoRevenueData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockMangoRevenueData);
        }, 300);
    });
};

const matrixSourceData = {
    'Good for juicing': { 'Grape': true, 'Banana': true, 'Blueberry': true, 'Orange': true, 'Apple': true, 'Pineapple': true, 'Mango': true, 'Strawberry': true },
    'Good for smoothies': { 'Grape': true, 'Banana': true, 'Blueberry': true, 'Orange': false, 'Apple': true, 'Pineapple': true, 'Mango': true, 'Strawberry': true },
    'Good for baking': { 'Grape': true, 'Banana': false, 'Blueberry': true, 'Orange': true, 'Apple': true, 'Pineapple': true, 'Mango': false, 'Strawberry': true },
    'Good for jam': { 'Grape': true, 'Banana': false, 'Blueberry': true, 'Orange': false, 'Apple': true, 'Pineapple': false, 'Mango': false, 'Strawberry': true },
    'Good for salads': { 'Grape': true, 'Banana': false, 'Blueberry': true, 'Orange': true, 'Apple': true, 'Pineapple': false, 'Mango': false, 'Strawberry': true },
};

const mockFruitMatrixData = Object.entries(matrixSourceData).flatMap(([use, fruits]) => 
    Object.entries(fruits).map(([fruit, value]) => ({
        fruit: fruit,
        culinary_use: use,
        applicable: value
    }))
);

export const getFruitMatrixData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitMatrixData);
        }, 300);
    });
};

const mockFruitTasteData = [
  { fruit: 'Apple',      avg_sales: 200, avg_price: 1.2, sweetness: 6.8, juiciness: 7,   acidity: 4.5 },
  { fruit: 'Banana',     avg_sales: 180, avg_price: 0.5, sweetness: 7,   juiciness: 8.5, acidity: 3 },
  { fruit: 'Orange',     avg_sales: 150, avg_price: 1,   sweetness: 5.5, juiciness: 9,   acidity: 6 },
  { fruit: 'Grape',      avg_sales: 140, avg_price: 2.5, sweetness: 6.5, juiciness: 6,   acidity: 4 },
  { fruit: 'Pineapple',  avg_sales: 130, avg_price: 1.8, sweetness: 6,   juiciness: 7.5, acidity: 5 },
  { fruit: 'Blueberry',  avg_sales: 120, avg_price: 3,   sweetness: 5,   juiciness: 6.5, acidity: 4 },
  { fruit: 'Mango',      avg_sales: 110, avg_price: 1.5, sweetness: 8.5, juiciness: 8,   acidity: 2.5 },
  { fruit: 'Strawberry', avg_sales: 100, avg_price: 2,   sweetness: 8,   juiciness: 5,   acidity: 3.5 },
];

export const getFruitTasteData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitTasteData);
        }, 300);
    });
};

const mockFruitUsageData = [
    { fruit: 'Apple', usage: 'Fresh', value: 50 },
    { fruit: 'Apple', usage: 'Juice', value: 15 },
    { fruit: 'Apple', usage: 'Other', value: 35 },
    { fruit: 'Banana', usage: 'Fresh', value: 60 },
    { fruit: 'Banana', usage: 'Juice', value: 30 },
    { fruit: 'Banana', usage: 'Other', value: 10 },
    { fruit: 'Orange', usage: 'Fresh', value: 20 },
    { fruit: 'Orange', usage: 'Juice', value: 60 },
    { fruit: 'Orange', usage: 'Other', value: 20 },
    { fruit: 'Grape', usage: 'Fresh', value: 30 },
    { fruit: 'Grape', usage: 'Juice', value: 25 },
    { fruit: 'Grape', usage: 'Other', value: 45 },
    { fruit: 'Strawberry', usage: 'Fresh', value: 80 },
    { fruit: 'Strawberry', usage: 'Juice', value: 15 },
    { fruit: 'Strawberry', usage: 'Other', value: 5 },
    { fruit: 'Blueberry', usage: 'Fresh', value: 90 },
    { fruit: 'Blueberry', usage: 'Juice', value: 5 },
    { fruit: 'Blueberry', usage: 'Other', value: 5 },
    { fruit: 'Pineapple', usage: 'Fresh', value: 65 },
    { fruit: 'Pineapple', usage: 'Juice', value: 25 },
    { fruit: 'Pineapple', usage: 'Other', value: 10 },
    { fruit: 'Mango', usage: 'Fresh', value: 70 },
    { fruit: 'Mango', usage: 'Juice', value: 20 },
    { fruit: 'Mango', usage: 'Other', value: 10 },
    { fruit: 'Cherry', usage: 'Fresh', value: 85 },
    { fruit: 'Cherry', usage: 'Juice', value: 10 },
    { fruit: 'Cherry', usage: 'Other', value: 5 },
];

export const getFruitUsageData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitUsageData);
        }, 300);
    });
};

const mockFruitSalesByRegionData = [
    { region: 'North America', sales: 5450000 },
    { region: 'Europe', sales: 4120000 },
    { region: 'Asia', sales: 6890000 },
    { region: 'South America', sales: 1980000 },
    { region: 'Africa', sales: 1230000 },
    { region: 'Oceania', sales: 980000 },
];

export const getFruitSalesByRegionData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitSalesByRegionData);
        }, 300);
    });
};

const mockAppleSalesGoalData = [
    { current_sales: 5300 }
];

export const getAppleSalesGoalData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockAppleSalesGoalData);
        }, 300);
    });
};

const mockFruitRipenessData = [
    { fruit: 'Banana', ripeness: 85 },
    { fruit: 'Strawberry', ripeness: 92 },
    { fruit: 'Apple', ripeness: 70 },
    { fruit: 'Mango', ripeness: 65 },
    { fruit: 'Grape', ripeness: 45 },
    { fruit: 'Orange', ripeness: 35 },
];

export const getFruitRipenessData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitRipenessData);
        }, 300);
    });
};

const mockMangoSupplyChainData = [
    { stage: 'Harvested', units: 12000 },
    { stage: 'Packed', units: 11000 },
    { stage: 'Shipped', units: 9500 },
    { stage: 'Sold (retail)', units: 8200 },
    { stage: 'Consumed', units: 7800 },
];

export const getMangoSupplyChainData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockMangoSupplyChainData);
        }, 300);
    });
};

const mockFruitPriceData = [
    {"date":"2022-01-01","Apple":2.2,"Orange":2.05,"Banana":1.08},
    {"date":"2022-02-01","Apple":2.4,"Orange":2.01,"Banana":1.1},
    {"date":"2022-03-01","Apple":2.5,"Orange":1.8,"Banana":1.05},
    {"date":"2022-04-01","Apple":2.3,"Orange":1.6,"Banana":1.12},
    {"date":"2022-05-01","Apple":2.4,"Orange":1.7,"Banana":1.15},
    {"date":"2022-06-01","Apple":2.55,"Orange":1.8,"Banana":1.08},
    {"date":"2022-07-01","Apple":2.35,"Orange":1.85,"Banana":1.1},
    {"date":"2022-08-01","Apple":2.5,"Orange":1.95,"Banana":1.2},
    {"date":"2022-09-01","Apple":2.7,"Orange":2.1,"Banana":1.05},
    {"date":"2022-10-01","Apple":2.8,"Orange":2.05,"Banana":1.1},
    {"date":"2022-11-01","Apple":2.75,"Orange":1.9,"Banana":1.12},
    {"date":"2022-12-01","Apple":2.9,"Orange":2.0,"Banana":1.08},
    {"date":"2023-01-01","Apple":2.8,"Orange":1.7,"Banana":1.1},
    {"date":"2023-02-01","Apple":2.7,"Orange":1.6,"Banana":1.15},
    {"date":"2023-03-01","Apple":2.85,"Orange":1.8,"Banana":1.05},
    {"date":"2023-04-01","Apple":2.6,"Orange":1.9,"Banana":1.1},
    {"date":"2023-05-01","Apple":2.8,"Orange":1.6,"Banana":1.08},
    {"date":"2023-06-01","Apple":3.3,"Orange":1.8,"Banana":1.12},
    {"date":"2023-07-01","Apple":3.1,"Orange":1.9,"Banana":1.1},
    {"date":"2023-08-01","Apple":3.0,"Orange":2.05,"Banana":1.15},
    {"date":"2023-09-01","Apple":2.9,"Orange":1.8,"Banana":1.0},
    {"date":"2023-10-01","Apple":3.2,"Orange":1.6,"Banana":1.1},
    {"date":"2023-11-01","Apple":3.05,"Orange":1.55,"Banana":1.08},
    {"date":"2023-12-01","Apple":3.1,"Orange":1.8,"Banana":1.12},
    {"date":"2024-01-01","Apple":3.3,"Orange":2.0,"Banana":1.1},
    {"date":"2024-02-01","Apple":3.0,"Orange":2.1,"Banana":1.05},
    {"date":"2024-03-01","Apple":3.1,"Orange":1.9,"Banana":1.1},
    {"date":"2024-04-01","Apple":3.15,"Orange":1.6,"Banana":1.12},
    {"date":"2024-05-01","Apple":3.0,"Orange":1.8,"Banana":1.15},
    {"date":"2024-06-01","Apple":3.2,"Orange":2.1,"Banana":1.08}
];

export const getFruitPriceData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitPriceData);
        }, 300);
    });
};

const mockChocolateSalesData = [
    { month: 1, chocolate_sold: 6, revenue: 48 },
    { month: 2, chocolate_sold: 5, revenue: 38 },
    { month: 3, chocolate_sold: 5.5, revenue: 32 },
    { month: 4, chocolate_sold: 4.5, revenue: 40 },
    { month: 5, chocolate_sold: 3, revenue: 50 },
    { month: 6, chocolate_sold: 9, revenue: 58 },
    { month: 7, chocolate_sold: 5.5, revenue: 48 },
    { month: 8, chocolate_sold: 6, revenue: 42 },
    { month: 9, chocolate_sold: 4, revenue: 46 },
    { month: 10, chocolate_sold: 6, revenue: 30 },
    { month: 11, chocolate_sold: 4.5, revenue: 68 },
    { month: 12, chocolate_sold: 5, revenue: 72 },
];

export const getChocolateSalesData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockChocolateSalesData);
        }, 300);
    });
};

const mockRegionalFruitPricesData = [
    {"region": "North America", "date":"2024-01-01","Apple":3.3,"Orange":2.0,"Banana":1.1},
    {"region": "North America", "date":"2024-02-01","Apple":3.0,"Orange":2.1,"Banana":1.05},
    {"region": "North America", "date":"2024-03-01","Apple":3.1,"Orange":1.9,"Banana":1.1},
    {"region": "North America", "date":"2024-04-01","Apple":3.15,"Orange":1.6,"Banana":1.12},
    {"region": "North America", "date":"2024-05-01","Apple":3.0,"Orange":1.8,"Banana":1.15},
    {"region": "North America", "date":"2024-06-01","Apple":3.2,"Orange":2.1,"Banana":1.08},
    {"region": "Europe", "date":"2024-01-01","Apple":2.8,"Orange":1.7,"Banana":1.0},
    {"region": "Europe", "date":"2024-02-01","Apple":2.7,"Orange":1.6,"Banana":1.05},
    {"region": "Europe", "date":"2024-03-01","Apple":2.85,"Orange":1.8,"Banana":1.0},
    {"region": "Europe", "date":"2024-04-01","Apple":2.6,"Orange":1.9,"Banana":1.1},
    {"region": "Europe", "date":"2024-05-01","Apple":2.8,"Orange":1.6,"Banana":1.08},
    {"region": "Europe", "date":"2024-06-01","Apple":3.3,"Orange":1.8,"Banana":1.12},
    {"region": "Asia", "date":"2024-01-01","Apple":2.5,"Orange":1.5,"Banana":0.9},
    {"region": "Asia", "date":"2024-02-01","Apple":2.6,"Orange":1.55,"Banana":0.92},
    {"region": "Asia", "date":"2024-03-01","Apple":2.55,"Orange":1.6,"Banana":0.95},
    {"region": "Asia", "date":"2024-04-01","Apple":2.7,"Orange":1.65,"Banana":0.93},
    {"region": "Asia", "date":"2024-05-01","Apple":2.75,"Orange":1.7,"Banana":0.96},
    {"region": "Asia", "date":"2024-06-01","Apple":2.8,"Orange":1.75,"Banana":0.98},
];

export const getRegionalFruitPricesData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockRegionalFruitPricesData);
        }, 300);
    });
};

const mockFruitFiberSugarData = [
    { fruit: 'Avocado', sugar: 1, fiber: 6.7, type: 'Other' },
    { fruit: 'Raspberry', sugar: 4.4, fiber: 6.5, type: 'Berry' },
    { fruit: 'Strawberry', sugar: 5.9, fiber: 2.0, type: 'Berry' },
    { fruit: 'Watermelon', sugar: 6.2, fiber: 0.4, type: 'Melon' },
    { fruit: 'Kiwi', sugar: 9.0, fiber: 3.0, type: 'Tropical' },
    { fruit: 'Orange', sugar: 9.4, fiber: 2.4, type: 'Citrus' },
    { fruit: 'Blueberry', sugar: 10, fiber: 2.4, type: 'Berry' },
    { fruit: 'Apple', sugar: 10.4, fiber: 2.2, type: 'Pome' },
    { fruit: 'Peach', sugar: 8.4, fiber: 1.5, type: 'Stone Fruit' },
    { fruit: 'Pineapple', sugar: 9.9, fiber: 1.4, type: 'Tropical' },
    { fruit: 'Pear', sugar: 9.8, fiber: 3.1, type: 'Pome' },
    { fruit: 'Banana', sugar: 12.2, fiber: 2.6, type: 'Tropical' },
    { fruit: 'Cherry', sugar: 12.8, fiber: 2.1, type: 'Stone Fruit' },
    { fruit: 'Mango', sugar: 13.7, fiber: 1.6, type: 'Tropical' },
    { fruit: 'Grape', sugar: 16.3, fiber: 0.9, type: 'Berry' },
];

export const getFruitFiberSugarData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitFiberSugarData);
        }, 300);
    });
};

const generateFruitWeightData = () => {
    // Generate a normally distributed dataset
    const randomNormal = () => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    const data = [];
    for (let i = 0; i < 500; i++) {
        const weight = 150 + randomNormal() * 20;
        data.push({ weight: Math.round(weight * 10) / 10 });
    }
    return data;
};

const mockFruitWeightData = generateFruitWeightData();

export const getFruitWeightData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitWeightData);
        }, 300);
    });
};

const generateFruitDimensionsData = () => {
    const randomNormal = (mean: number, std: number) => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num * std + mean;
        return Math.round(num * 10) / 10;
    }
    const data = [];
    for (let i = 0; i < 500; i++) {
        data.push({
            length: randomNormal(80, 15), // mean 80mm, std 15mm
            width: randomNormal(60, 10),  // mean 60mm, std 10mm
        });
    }
    return data;
};

const mockFruitDimensionsData = generateFruitDimensionsData();

export const getFruitDimensionsData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitDimensionsData);
        }, 300);
    });
};

const mockFruitShelfLifeData = [
    // Apple: Pome
    { fruit: 'Apple', shelf_life_days: 50, type: 'Pome' }, { fruit: 'Apple', shelf_life_days: 55, type: 'Pome' }, { fruit: 'Apple', shelf_life_days: 56, type: 'Pome' }, { fruit: 'Apple', shelf_life_days: 60, type: 'Pome' }, { fruit: 'Apple', shelf_life_days: 64, type: 'Pome' }, { fruit: 'Apple', shelf_life_days: 65, type: 'Pome' }, { fruit: 'Apple', shelf_life_days: 70, type: 'Pome' },
    // Orange: Citrus
    { fruit: 'Orange', shelf_life_days: 35, type: 'Citrus' }, { fruit: 'Orange', shelf_life_days: 40, type: 'Citrus' }, { fruit: 'Orange', shelf_life_days: 42, type: 'Citrus' }, { fruit: 'Orange', shelf_life_days: 45, type: 'Citrus' }, { fruit: 'Orange', shelf_life_days: 48, type: 'Citrus' }, { fruit: 'Orange', shelf_life_days: 50, type: 'Citrus' }, { fruit: 'Orange', shelf_life_days: 55, type: 'Citrus' },
    // Mango: Tropical
    { fruit: 'Mango', shelf_life_days: 25, type: 'Tropical' }, { fruit: 'Mango', shelf_life_days: 29, type: 'Tropical' }, { fruit: 'Mango', shelf_life_days: 30, type: 'Tropical' }, { fruit: 'Mango', shelf_life_days: 32, type: 'Tropical' }, { fruit: 'Mango', shelf_life_days: 33, type: 'Tropical' }, { fruit: 'Mango', shelf_life_days: 34, type: 'Tropical' }, { fruit: 'Mango', shelf_life_days: 37, type: 'Tropical' },
    // Banana: Tropical
    { fruit: 'Banana', shelf_life_days: 10, type: 'Tropical' }, { fruit: 'Banana', shelf_life_days: 15, type: 'Tropical' }, { fruit: 'Banana', shelf_life_days: 16, type: 'Tropical' }, { fruit: 'Banana', shelf_life_days: 17, type: 'Tropical' }, { fruit: 'Banana', shelf_life_days: 18, type: 'Tropical' }, { fruit: 'Banana', shelf_life_days: 18, type: 'Tropical' }, { fruit: 'Banana', shelf_life_days: 20, type: 'Tropical' },
    // Strawberry: Berry
    { fruit: 'Strawberry', shelf_life_days: 3, type: 'Berry' }, { fruit: 'Strawberry', shelf_life_days: 4, type: 'Berry' }, { fruit: 'Strawberry', shelf_life_days: 5, type: 'Berry' }, { fruit: 'Strawberry', shelf_life_days: 6, type: 'Berry' }, { fruit: 'Strawberry', shelf_life_days: 7, type: 'Berry' }, { fruit: 'Strawberry', shelf_life_days: 7, type: 'Berry' }, { fruit: 'Strawberry', shelf_life_days: 8, type: 'Berry' },
    // Blueberry: Berry
    { fruit: 'Blueberry', shelf_life_days: 2, type: 'Berry' }, { fruit: 'Blueberry', shelf_life_days: 3, type: 'Berry' }, { fruit: 'Blueberry', shelf_life_days: 3, type: 'Berry' }, { fruit: 'Blueberry', shelf_life_days: 4, type: 'Berry' }, { fruit: 'Blueberry', shelf_life_days: 5, type: 'Berry' }, { fruit: 'Blueberry', shelf_life_days: 5, type: 'Berry' }, { fruit: 'Blueberry', shelf_life_days: 7, type: 'Berry' },
];

export const getFruitShelfLifeData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockFruitShelfLifeData), 300);
    });
};

const mockFruitBasketCorpStockData = [
    { date: 'Jun 3', open: 48.10, high: 48.20, low: 47.30, close: 48.15 },
    { date: 'Jun 4', open: 48.10, high: 48.60, low: 47.80, close: 47.90 },
    { date: 'Jun 5', open: 47.80, high: 48.60, low: 47.50, close: 48.60 },
    { date: 'Jun 6', open: 48.50, high: 49.40, low: 48.00, close: 49.00 },
    { date: 'Jun 7', open: 49.10, high: 49.20, low: 48.30, close: 48.30 },
    { date: 'Jun 8', open: 48.50, high: 48.70, low: 48.00, close: 48.60 },
    { date: 'Jun 9', open: 48.70, high: 48.90, low: 48.30, close: 48.75 },
    { date: 'Jun 10', open: 48.80, high: 49.80, low: 48.20, close: 48.30 },
    { date: 'Jun 11', open: 48.40, high: 49.20, low: 47.50, close: 48.20 },
    { date: 'Jun 12', open: 48.00, high: 48.50, low: 47.80, close: 47.90 },
];

export const getFruitBasketCorpStockData = (): Promise<any[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockFruitBasketCorpStockData);
        }, 300);
    });
};


export const fruitSalesDashboardConfig: AppConfig = {
    name: "fruit_sales_dashboard",
    version: "1.0.0",
    datasources: [
        {
            name: "fruit_sales",
            description: "Fictional fruit sales data."
        },
        {
            name: "total_fruit_sales",
            description: "Fictional total fruit sales data for lollipop chart."
        },
        {
            name: "fruit_revenue",
            description: "Fictional fruit revenue data for bullet chart."
        },
        {
            name: "fruit_seasonal_sales",
            description: "Fictional fruit sales data by season."
        },
        {
            name: "fruit_sales_growth",
            description: "Fictional fruit sales growth data from 2023 to 2024."
        },
        {
            name: "fruit_price_range",
            description: "Fictional fruit price range data."
        },
        {
            name: "mango_revenue",
            description: "Fictional mango revenue data with quarterly changes."
        },
        {
            name: "fruit_matrix_data",
            description: "Fictional data about fruit culinary uses."
        },
        {
            name: "fruit_taste_data",
            description: "Fictional data about fruit taste profiles and sales."
        },
        {
            name: "fruit_usage_data",
            description: "Fictional data about fruit usage breakdown."
        },
        {
            name: "fruit_sales_by_region",
            description: "Fictional data about fruit sales by region."
        },
        {
            name: "apple_sales_goal",
            description: "Fictional data for apple sales goal."
        },
        {
            name: "fruit_ripeness_data",
            description: "Fictional data for fruit ripeness scores."
        },
        {
            name: "mango_supply_chain",
            description: "Fictional data on mango loss from farm to table."
        },
        {
            name: "fruit_prices",
            description: "Fictional monthly prices for fruits."
        },
        {
            name: "chocolate_sales",
            description: "Fictional chocolate sales data."
        },
        {
            name: "regional_fruit_prices",
            description: "Fictional monthly prices for fruits by region."
        },
        {
            name: "fruit_fiber_sugar",
            description: "Fictional data comparing sugar and fiber content in fruits."
        },
        {
            name: "fruit_weights",
            description: "A distribution of individual fruit weights."
        },
        {
            name: "fruit_dimensions",
            description: "A distribution of fruit lengths and widths."
        },
        {
            name: "fruit_shelf_life",
            description: "Fictional shelf life data for various fruits."
        },
        {
            name: "fruit_basket_stock",
            description: "Fictional stock price data for FruitBasketCorp."
        }
    ],
    dashboard: {
        title: "Fruit Sales Analysis",
        filters: [
            {
                column: 'fruit',
                label: 'Fruit',
                type: 'multiselect',
                dataSource: 'total_fruit_sales' // Has more complete list of fruits
            },
            {
                column: 'type',
                label: 'Fruit Type',
                type: 'multiselect',
                dataSource: 'fruit_fiber_sugar'
            }
        ],
        widgets: [
             {
                id: 'fruitbasket-stock-candlestick',
                type: 'candlestick',
                dataSource: 'fruit_basket_stock',
                title: 'FruitBasketCorp. inches up in early June',
                description: 'Daily open-high-low-close prices, 3-12 June 2024 (USD)',
                gridWidth: 12,
                gridHeight: 5,
                dateColumn: 'date',
                openColumn: 'open',
                highColumn: 'high',
                lowColumn: 'low',
                closeColumn: 'close',
                yAxisLabel: 'Price (USD)',
                yAxisFormat: 'currency',
                currencySymbol: '$',
                decimalPlaces: 2,
                upColor: '#A855F7',
                downColor: '#F97316',
             },
             {
                id: 'fruit-shelf-life-boxplot',
                type: 'box-plot',
                dataSource: 'fruit_shelf_life',
                title: 'Apples keep longest, berries spoil fastest',
                description: 'Box plot of shelf-life in days, colored by fruit type',
                gridWidth: 12,
                gridHeight: 5,
                categoryColumn: 'fruit',
                valueColumn: 'shelf_life_days',
                yAxisLabel: 'Shelf-life in days',
                yAxisFormat: 'number',
                decimalPlaces: 0,
                colorColumn: 'type',
                categoryColors: {
                    'Pome': '#22C55E', // green-500
                    'Citrus': '#F97316', // orange-500
                    'Tropical': '#FBBF24', // amber-400
                    'Berry': '#EF4444', // red-500
                },
            },
            {
                id: 'fruit-sugar-fiber-scatter',
                type: 'scatter',
                dataSource: 'fruit_fiber_sugar',
                title: 'Avocado & raspberry: high fiber, low sugar leaders',
                description: 'Sugar vs fiber content (g/100 g) for 15 common fruits, colored by type',
                gridWidth: 12,
                gridHeight: 5,
                xColumn: 'sugar',
                yColumn: 'fiber',
                labelColumn: 'fruit',
                pointRadius: 6,
                xAxisLabel: 'Sugar (g/100 g)',
                yAxisLabel: 'Fiber (g/100 g)',
                xAxisFormat: 'number',
                yAxisFormat: 'number',
                decimalPlaces: 0,
                colorColumn: 'type',
                colorScheme: {
                    'Berry': '#EF4444', 
                    'Citrus': '#F97316',
                    'Pome': '#FBBF24',
                    'Stone Fruit': '#A855F7',
                    'Tropical': '#3B82F6',
                    'Melon': '#22C55E',
                    'Other': '#6B7280'
                },
                highlightPoints: [
                    { label: 'Avocado', color: '#84CC16', radius: 8 },
                    { label: 'Raspberry', color: '#EC4899', radius: 8 }
                ]
            },
            {
                id: 'fruit-taste-scatter',
                type: 'scatter',
                dataSource: 'fruit_taste_data',
                title: 'Sweetness vs. Juiciness',
                description: 'Taste profile of fruits, colored by acidity',
                gridWidth: 12,
                gridHeight: 5,
                xColumn: 'sweetness',
                yColumn: 'juiciness',
                labelColumn: 'fruit',
                pointRadius: 8,
                xAxisLabel: 'Sweetness (0-10)',
                yAxisLabel: 'Juiciness (0-10)',
                xAxisFormat: 'number',
                yAxisFormat: 'number',
                decimalPlaces: 1,
                colorColumn: 'acidity',
                colorScheme: ['#E0F2FE', '#0C4A6E'],
                highlightPoints: [
                    { label: 'Mango', color: '#FBBF24', radius: 10, showLabel: true },
                    { label: 'Orange', color: '#F97316', radius: 10, showLabel: true }
                ]
            },
             {
                id: 'chocolate-sales-trends',
                type: 'line',
                dataSource: 'chocolate_sales',
                title: 'Chocolate Sales & Revenue',
                description: 'Monthly sales volume (units) and revenue ($).',
                gridWidth: 12,
                gridHeight: 5,
                xColumn: 'month',
                xAxisType: 'number',
                facetSeries: true, // The new option
                series: [
                    { key: 'revenue', name: 'Revenue', color: '#EF4444' }, // red-500
                    { key: 'chocolate_sold', name: 'Chocolate sold', color: '#3B82F6', strokeWidth: 3 } // blue-500
                ],
                yAxisFormat: 'number',
                decimalPlaces: 1,
            },
             {
                id: 'fruit-price-trends',
                type: 'line',
                dataSource: 'fruit_prices',
                title: 'Apple price climbs up and banana stays cheapest',
                description: 'Average monthly retail price per kg, 2022–24 (USD)',
                gridWidth: 12,
                gridHeight: 4,
                xColumn: 'date',
                seriesFilterColumn: 'fruit',
                series: [
                    { key: 'Apple', name: 'Apple', color: '#3B82F6' },
                    { key: 'Orange', name: 'Orange', color: '#1E3A8A' },
                    { key: 'Banana', name: 'Banana', color: '#A855F7' }
                ],
                yAxisFormat: 'currency',
                currencySymbol: '$',
                decimalPlaces: 1,
             },
             {
                id: 'regional-price-trends-panel',
                type: 'chart-panel',
                dataSource: 'regional_fruit_prices',
                title: 'Regional Price Trends',
                description: 'Monthly price trends for key fruits across different regions.',
                gridWidth: 12,
                gridHeight: 4,
                panelCategoryColumn: 'region',
                chartsPerRow: 3,
                chartConfig: {
                    type: 'line',
                    xColumn: 'date',
                    series: [
                        { key: 'Apple', name: 'Apple', color: '#3B82F6' },
                        { key: 'Orange', name: 'Orange', color: '#F97316' },
                        { key: 'Banana', name: 'Banana', color: '#A855F7' }
                    ],
                    yAxisFormat: 'currency',
                    currencySymbol: '$',
                    decimalPlaces: 1,
                }
             },
             {
                id: 'mango-supply-chain-funnel',
                type: 'pyramid',
                dataSource: 'mango_supply_chain',
                title: 'Mangoes lose one-third en route from farm to table',
                description: 'Harvest > pack > ship > sell > consume (units)',
                gridWidth: 12,
                gridHeight: 4,
                stageColumn: 'stage',
                valueColumn: 'units',
                colors: ['#FADDC9', '#F8C6AF', '#F4A28D', '#F17D6C', '#EF594C'],
             },
             {
                id: 'apple-sales-gauge',
                type: 'gauge',
                dataSource: 'apple_sales_goal',
                title: 'Apple has hit just over half its annual sales goal',
                description: 'Percent of 10 000-unit target reached',
                gridWidth: 12,
                gridHeight: 3,
                dataColumn: 'current_sales',
                aggregation: 'sum',
                minValue: 0,
                maxValue: 10000,
                valueSuffix: '%',
                ranges: [
                    { from: 0, to: 2500, color: '#f87171', label: 'Far behind' }, // red-400
                    { from: 2500, to: 5000, color: '#fb923c', label: 'Getting there' }, // orange-400
                    { from: 5000, to: 7500, color: '#facc15', label: 'On track' }, // yellow-400
                    { from: 7500, to: 10000, color: '#4ade80', label: 'Ahead of plan' } // green-400
                ]
             },
             {
                id: 'fruit-ripeness-panel',
                type: 'chart-panel',
                dataSource: 'fruit_ripeness_data',
                title: 'Fruit Ripeness Scores',
                description: 'Ripeness score for key fruits (0-100)',
                gridWidth: 12,
                gridHeight: 3,
                panelCategoryColumn: 'fruit',
                chartsPerRow: 3,
                chartConfig: {
                    type: 'gauge',
                    dataColumn: 'ripeness',
                    aggregation: 'sum',
                    minValue: 0,
                    maxValue: 100,
                    decimalPlaces: 0,
                    ranges: [
                        { from: 0, to: 40, color: '#f87171', label: 'Under-ripe' },
                        { from: 40, to: 80, color: '#facc15', label: 'Perfect' },
                        { from: 80, to: 100, color: '#4ade80', label: 'Over-ripe' }
                    ]
                }
            },
             {
                id: 'sales-by-region-donut',
                type: 'donut',
                dataSource: 'fruit_sales_by_region',
                title: 'Donut: Asia leads global sales',
                description: 'Breakdown of total fruit sales revenue',
                gridWidth: 6,
                gridHeight: 3,
                categoryColumn: 'region',
                valueColumn: 'sales',
                showLabels: 'percent',
                showLegend: true,
                centerText: 'Total Sales',
                categoryColors: {
                    'Asia': '#E45646',
                    'North America': '#4ECDC4',
                    'Europe': '#55C6A9',
                    'South America': '#F7B801',
                    'Africa': '#FBDE5C',
                    'Oceania': '#A37774',
                }
            },
            {
                id: 'sales-by-region-semicircle',
                type: 'semicircle-donut',
                dataSource: 'fruit_sales_by_region',
                title: 'Semicircle: Sales by Region',
                description: 'Regional sales distribution',
                gridWidth: 6,
                gridHeight: 3,
                categoryColumn: 'region',
                valueColumn: 'sales',
                showLabels: 'percent',
                showLegend: true,
                centerText: 'Total Sales',
                categoryColors: {
                    'Asia': '#E45646',
                    'North America': '#4ECDC4',
                    'Europe': '#55C6A9',
                    'South America': '#F7B801',
                    'Africa': '#FBDE5C',
                    'Oceania': '#A37774',
                }
            },
             {
                id: 'fruit-usage-panel',
                type: 'chart-panel',
                dataSource: 'fruit_usage_data',
                title: 'Fruits mostly eaten fresh; oranges juiced',
                description: "Breakdown of each fruit's share of fresh, juice & other uses",
                gridWidth: 12,
                gridHeight: 10,
                panelCategoryColumn: 'fruit',
                chartsPerRow: 6,
                chartConfig: {
                    type: 'donut',
                    categoryColumn: 'usage',
                    valueColumn: 'value',
                    categoryColors: {
                        'Fresh': '#E45646',
                        'Juice': '#FBDE5C',
                        'Other': '#FADDC9',
                    },
                    showLabels: 'percent',
                    decimalPlaces: 0,
                    showLegend: false,
                    innerRadiusRatio: 0.6,
                }
             },
             {
                id: 'fruit-taste-table',
                type: 'table',
                dataSource: 'fruit_taste_data',
                title: 'Mango tops taste scores yet trails in sales',
                description: 'Overview of price, sales, sweetness, juiciness & acidity',
                gridWidth: 12,
                gridHeight: 5,
                rowCategoryColumn: 'fruit',
                columns: [
                    { key: 'avg_sales', header: 'Avg Sales', subHeader: '(units/mo)', format: 'number' },
                    { key: 'avg_price', header: 'Avg Price', subHeader: '($)', format: 'currency', decimalPlaces: 1 },
                    { key: 'sweetness', header: 'Sweetness', subHeader: '(0–10)', format: 'number', decimalPlaces: 1 },
                    { key: 'juiciness', header: 'Juiciness', subHeader: '(0–10)', format: 'number', decimalPlaces: 1 },
                    { key: 'acidity', header: 'Acidity', subHeader: '(0–10)', format: 'number', decimalPlaces: 1 },
                ],
                conditionalFormatting: [
                    { column: 'avg_sales', type: 'color-scale', colorScheme: ['#A5B4FC', '#3B82F6'] }, // light blue to dark blue
                    { column: 'avg_price', type: 'color-scale', colorScheme: ['#FED7AA', '#F97316'] }, // light orange to dark orange
                ],
             },
             {
                id: 'fruit-culinary-matrix',
                type: 'matrix',
                dataSource: 'fruit_matrix_data',
                title: 'Fruit attributes & culinary uses Matrix',
                description: 'Strawberry, Blueberry & Apple tick every culinary box',
                gridWidth: 12,
                gridHeight: 4,
                rowCategoryColumn: 'culinary_use',
                columnCategoryColumn: 'fruit',
                valueColumn: 'applicable',
                yesColor: '#3B82F6', // blue-500
                noColor: '#9CA3AF' // gray-400
             },
             {
                id: 'mango-revenue-waterfall',
                type: 'waterfall',
                dataSource: 'mango_revenue',
                title: 'Mango revenue grows, with summer slowdowns',
                description: 'Slight dips each Q3 amid an overall rise from $12K to $26K',
                categoryColumn: 'period',
                valueColumn: 'change',
                totalCategories: ['Q1 2023', 'Q2 2025'],
                gridWidth: 12,
                gridHeight: 3,
                yAxisFormat: 'currency',
                currencySymbol: '$',
                positiveColor: '#3B82F6', // blue-500
                negativeColor: '#F97316', // orange-500
                totalColor: '#6B7280', // gray-500
             },
             {
                id: 'fruit-sales-radial-bar-chart',
                type: 'radial-bar',
                dataSource: 'total_fruit_sales',
                title: 'Blueberries surpass the 5000-unit milestone',
                description: 'Total units sold by fruit variety | Jan 2024 — Jan 2025',
                categoryColumn: 'fruit',
                valueColumn: 'units_sold',
                aggregation: 'sum',
                gridWidth: 12,
                gridHeight: 5,
                color: '#6B7280',
                highlightColor: '#3B82F6',
                highlightCategory: 'Blueberry',
                decimalPlaces: 0,
            },
             {
                id: 'fruit-sales-growth-dumbbell',
                type: 'dumbbell',
                dataSource: 'fruit_sales_growth',
                title: 'Grape & strawberry lead sales growth in 2024',
                description: 'Each up by about 550 units vs 2023—the largest year-over-year gain',
                categoryColumn: 'fruit',
                points: [
                    { key: 'sales_2024', name: '2024', color: '#3B82F6' },
                    { key: 'sales_2023', name: '2023', color: '#9CA3AF' }
                ],
                gridWidth: 12,
                gridHeight: 5,
                xAxisFormat: 'number',
                decimalPlaces: 3,
            },
            {
                id: 'fruit-price-volatility-range-plot',
                type: 'range-plot',
                dataSource: 'fruit_price_range',
                title: 'Bananas the steadiest; Pineapples the most volatile',
                description: 'Prices range per piece $0.25–$0.75 (bananas) to $1–$4 (pineapples)',
                categoryColumn: 'fruit',
                rangeStartColumn: 'min_price',
                rangeEndColumn: 'max_price',
                gridWidth: 12,
                gridHeight: 5,
                xAxisFormat: 'currency',
                currencySymbol: '$',
                decimalPlaces: 2,
                barColor: '#E5E7EB',
                capColor: '#3B82F6',
            },
            {
                id: 'fruit-seasonal-sales-dot-plot',
                type: 'dot-plot',
                dataSource: 'fruit_seasonal_sales',
                title: 'Summer is the peak season for fruit sales',
                description: 'Apple leads the summer surge with 2.090 seasonally weighted units',
                categoryColumn: 'fruit',
                dotColumns: [
                    { key: 'winter', name: 'Winter', color: '#CBD5E1' },
                    { key: 'spring', name: 'Spring', color: '#3B82F6' },
                    { key: 'summer', name: 'Summer', color: '#F97316' },
                    { key: 'autumn', name: 'Autumn', color: '#854D0E' }
                ],
                gridWidth: 12,
                gridHeight: 5,
                xAxisFormat: 'number',
                decimalPlaces: 3,
            },
            {
                id: 'fruit-revenue-bullet-chart',
                type: 'bullet',
                dataSource: 'fruit_revenue',
                title: 'Pineapple and banana lead revenue performance',
                description: 'Both exceed expectations, while Blueberry remains below $150 k',
                categoryColumn: 'fruit',
                valueColumn: 'revenue',
                aggregation: 'sum',
                targetValue: 220000,
                ranges: [
                    { value: 150000, label: 'Below expectations' },
                    { value: 250000, label: 'On track' },
                    { value: 350000, label: 'Exceeding expectations' }
                ],
                gridWidth: 12,
                gridHeight: 4,
                valueFormat: 'currency',
                currencySymbol: '$',
                decimalPlaces: 0,
                valueNotation: 'compact',
                color: '#3B82F6',
                rangeColor: '#E5E7EB',
                targetColor: '#374151'
            },
            {
                id: 'fruit-sales-grouped-bar-chart',
                type: 'grouped-bar',
                dataSource: 'fruit_sales',
                title: 'Conventional fruits outsell organic by more than 2:1',
                description: 'Strawberries show the highest organic share at 36%',
                categoryColumn: 'fruit',
                barColumns: [
                    { key: 'organic', name: 'organic', color: '#4ECDC4' },
                    { key: 'not_organic', name: 'not organic', color: '#6B7280' }
                ],
                gridWidth: 12,
                gridHeight: 3,
                yAxisLabel: '', // No label for fruit axis
                xAxisLabel: 'Sales (in millions)',
                xAxisFormat: 'number',
                decimalPlaces: 3,
            },
            {
                id: 'fruit-sales-lollipop-chart',
                type: 'lollipop',
                dataSource: 'total_fruit_sales',
                title: 'Blueberries surpass the 5000-unit milestone',
                description: 'Total units sold by fruit variety | Jan 2024 — Jan 2025',
                categoryColumn: 'fruit',
                valueColumn: 'units_sold',
                aggregation: 'sum',
                gridWidth: 12,
                gridHeight: 5,
                xAxisFormat: 'number',
                decimalPlaces: 0,
                color: '#6B7280', 
                highlightColor: '#3B82F6',
                highlightCategory: 'Blueberry',
                targetValue: 5000,
                targetColor: '#A855F7',
            },
            {
                id: 'fruit-weight-distribution-histogram',
                type: 'histogram',
                dataSource: 'fruit_weights',
                title: 'Distribution of Fruit Weights',
                description: 'Frequency of fruit weights in a sample of 500 units.',
                gridWidth: 6,
                gridHeight: 3,
                distributions: [
                    { key: 'weight', name: 'Weight', color: '#76b7b2' }
                ],
                binCount: 20,
                xAxisLabel: 'Weight (grams)',
                yAxisLabel: 'Frequency (count)',
                xAxisFormat: 'number',
                decimalPlaces: 0,
            },
            {
                id: 'fruit-dimensions-histogram',
                type: 'histogram',
                dataSource: 'fruit_dimensions',
                title: 'Distribution of Fruit Dimensions',
                description: 'Comparing the length and width distributions of sample fruits.',
                gridWidth: 6,
                gridHeight: 3,
                distributions: [
                    { key: 'length', name: 'Length', color: '#4e79a7' },
                    { key: 'width', name: 'Width', color: '#f28e2c' }
                ],
                binCount: 20,
                xAxisLabel: 'Dimension (mm)',
                yAxisLabel: 'Frequency (count)',
                xAxisFormat: 'number',
                decimalPlaces: 0,
            }
        ]
    }
};