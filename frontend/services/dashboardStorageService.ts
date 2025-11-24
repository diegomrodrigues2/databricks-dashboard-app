import { Dashboard, AppConfig } from '../types';
import { fruitSalesDashboardConfig } from './dashboards/fruitSales';

const DB_NAME = 'dashboards_db';
const DB_VERSION = 1;
const STORE_NAME = 'dashboards';

export interface StoredDashboard {
  id: string;
  meta: Dashboard;
  config: AppConfig;
  createdAt: number;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
};

const seedExampleDashboard = async (store: IDBObjectStore): Promise<void> => {
    const countRequest = store.count();
    return new Promise((resolve, reject) => {
        countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
                // Seed with example dashboard
                const exampleDashboard: StoredDashboard = {
                    id: 'example',
                    meta: { id: 'example', title: 'Example Dashboard', type: 'dashboard' },
                    config: fruitSalesDashboardConfig,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                const addRequest = store.add(exampleDashboard);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error);
            } else {
                resolve();
            }
        };
        countRequest.onerror = () => reject(countRequest.error);
    });
};


export const saveDashboard = async (dashboard: StoredDashboard): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(dashboard);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getDashboard = async (id: string): Promise<StoredDashboard | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllDashboards = async (): Promise<StoredDashboard[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite'); // readwrite to allow seeding
    const store = transaction.objectStore(STORE_NAME);
    
    // Check if we need to seed
    seedExampleDashboard(store).then(() => {
        const index = store.index('updatedAt');
        const request = index.openCursor(null, 'prev'); // Newest first
        const dashboards: StoredDashboard[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            dashboards.push(cursor.value);
            cursor.continue();
          } else {
            resolve(dashboards);
          }
        };
        request.onerror = () => reject(request.error);
    }).catch(reject);
  });
};

export const deleteDashboard = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

