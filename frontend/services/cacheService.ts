
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

class DataCacheService {
    private static instance: DataCacheService;
    private cache: Map<string, CacheEntry<any>> = new Map();

    private constructor() {}

    public static getInstance(): DataCacheService {
        if (!DataCacheService.instance) {
            DataCacheService.instance = new DataCacheService();
        }
        return DataCacheService.instance;
    }

    public cacheData<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    public getCachedData<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }

        // Check if cache is expired
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.data;
    }

    public hasCachedData(key: string): boolean {
        return this.getCachedData(key) !== undefined;
    }

    public clearCache(): void {
        this.cache.clear();
    }

    public clearEntry(key: string): void {
        this.cache.delete(key);
    }
}

export const cacheService = DataCacheService.getInstance();

