import { executeRawQuery } from './dashboardService';

export interface ExecutionResult {
    success: boolean;
    data?: any[];
    error?: string;
    executionTimeMs?: number;
    rowCount?: number;
}

const DESTRUCTIVE_KEYWORDS = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'UPDATE', 'INSERT', 'GRANT', 'REVOKE'];

export function analyzeRisk(code: string): 'low' | 'high' {
    const upperCode = code.toUpperCase();
    // Check for destructive keywords
    const hasDestructive = DESTRUCTIVE_KEYWORDS.some(keyword => {
        // Check for whole word matches to avoid false positives (e.g., "UPDATE_DATE" column)
        const regex = new RegExp(`\\b${keyword}\\b`);
        return regex.test(upperCode);
    });
    
    return hasDestructive ? 'high' : 'low';
}

export async function executeCodeSafe(code: string, language: 'sql' | 'python' | 'scala'): Promise<ExecutionResult> {
    const start = Date.now();
    try {
        // In a real app, this would call a BFF endpoint like /api/execute
        // which would handle authentication, rate limiting, and sandbox execution.
        // Here we simulate that by calling the client-side service (which mocks Databricks for now).
        
        // Pre-flight checks
        const risk = analyzeRisk(code);
        if (risk === 'high') {
            console.warn(`[Security Audit] High risk code executed: ${code.slice(0, 50)}...`);
        }

        const data = await executeRawQuery(code, language);
        
        return {
            success: true,
            data,
            rowCount: Array.isArray(data) ? data.length : 0,
            executionTimeMs: Date.now() - start
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            executionTimeMs: Date.now() - start
        };
    }
}

