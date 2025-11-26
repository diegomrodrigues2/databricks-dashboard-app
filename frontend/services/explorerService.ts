
export interface Catalog {
  name: string;
  type: string;
  comment?: string;
}

export interface Schema {
  name: string;
  catalog_name: string;
  comment?: string;
}

export interface Table {
  name: string;
  schema_name: string;
  catalog_name: string;
  table_type: string; // MANAGED, EXTERNAL, VIEW
  full_name: string;
}

export interface Column {
  name: string;
  type_text: string;
  comment?: string;
}

export interface TableDetails extends Table {
  comment?: string;
  columns: Column[];
}

const BASE_URL = 'http://localhost:8000/api';

// Helper function to handle API calls
const fetchApi = async <T>(endpoint: string): Promise<T> => {
    try {
        // In a real app, you might want to use the configured API_BASE_URL from config
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`Error fetching ${endpoint}: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.warn(`API call failed for ${endpoint}, returning mock data.`);
        
        if (endpoint.includes('/explorer/catalogs')) {
            return [
                { name: "main", type: "CATALOG", comment: "Main catalog (Mock)" },
                { name: "samples", type: "CATALOG", comment: "Sample datasets (Mock)" }
            ] as unknown as T;
        }
        
        if (endpoint.includes('/explorer/schemas')) {
            if (endpoint.includes('main')) {
                 return [
                    { name: "default", catalog_name: "main", comment: "Default schema (Mock)" },
                    { name: "analytics", catalog_name: "main", comment: "Analytics data (Mock)" }
                ] as unknown as T;
            } else {
                 return [
                    { name: "nyctaxi", catalog_name: "samples", comment: "NYC Taxi data (Mock)" },
                    { name: "tpch", catalog_name: "samples", comment: "TPC-H benchmark data (Mock)" }
                ] as unknown as T;
            }
        }
        
        if (endpoint.includes('/explorer/tables')) {
            if (endpoint.includes('nyctaxi')) {
                 return [
                    { name: "trips", catalog_name: "samples", schema_name: "nyctaxi", table_type: "MANAGED", full_name: "samples.nyctaxi.trips" }
                 ] as unknown as T;
            } else if (endpoint.includes('default')) {
                 return [
                     { name: "users", catalog_name: "main", schema_name: "default", table_type: "MANAGED", full_name: "main.default.users" },
                     { name: "transactions", catalog_name: "main", schema_name: "default", table_type: "EXTERNAL", full_name: "main.default.transactions" }
                 ] as unknown as T;
            }
            return [] as unknown as T;
        }

        if (endpoint.includes('/explorer/table/')) {
             // Mock table details
             return {
                 name: "trips",
                 catalog_name: "samples",
                 schema_name: "nyctaxi",
                 table_type: "MANAGED",
                 full_name: "samples.nyctaxi.trips",
                 comment: "Mock Table Details",
                 columns: [
                     { name: "tpep_pickup_datetime", type_text: "TIMESTAMP", comment: "Pickup time" },
                     { name: "trip_distance", type_text: "DOUBLE", comment: "Distance" }
                 ]
             } as unknown as T;
        }
        
        throw error;
    }
};

export const fetchCatalogs = async (): Promise<Catalog[]> => {
  return fetchApi<Catalog[]>('/explorer/catalogs');
};

export const fetchSchemas = async (catalog: string): Promise<Schema[]> => {
  return fetchApi<Schema[]>(`/explorer/schemas?catalog_name=${encodeURIComponent(catalog)}`);
};

export const fetchTables = async (catalog: string, schema: string): Promise<Table[]> => {
  return fetchApi<Table[]>(`/explorer/tables?catalog_name=${encodeURIComponent(catalog)}&schema_name=${encodeURIComponent(schema)}`);
};

export const fetchTableDetails = async (fullTableName: string): Promise<TableDetails> => {
  return fetchApi<TableDetails>(`/explorer/table/${encodeURIComponent(fullTableName)}`);
};

