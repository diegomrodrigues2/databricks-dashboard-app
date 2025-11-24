import React, { useMemo } from 'react';
import * as d3 from 'd3-array';

interface SpreadsheetSummaryProps {
    columns: string[];
    data: any[];
    selection: Set<string>;
}

const SpreadsheetSummary: React.FC<SpreadsheetSummaryProps> = ({ columns, data, selection }) => {
    
    const summary = useMemo(() => {
        if (selection.size === 0) {
            return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
        }

        const numericValues: number[] = [];

        selection.forEach(cellId => {
            const match = cellId.match(/R(\d+)C(\d+)/);
            if (match) {
                const rowIndex = parseInt(match[1], 10);
                const colIndex = parseInt(match[2], 10);
                
                const row = data[rowIndex];
                if (row) {
                    const value = row[columns[colIndex]];
                    if (typeof value === 'number') {
                        numericValues.push(value);
                    }
                }
            }
        });

        if (numericValues.length === 0) {
            return { count: selection.size, sum: 0, avg: 0, min: 0, max: 0, hasNumeric: false };
        }

        const sum = d3.sum(numericValues);
        const avg = d3.mean(numericValues) || 0;
        const min = d3.min(numericValues) ?? 0;
        const max = d3.max(numericValues) ?? 0;
        
        return { count: selection.size, sum, avg, min, max, hasNumeric: true };

    }, [selection, columns, data]);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    return (
        <div className="flex items-center justify-end h-8 px-4 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
            {selection.size > 0 && (
                <div className="flex items-center gap-6">
                    <span>Count: {summary.count}</span>
                    {summary.hasNumeric && (
                        <>
                            <span>Min: {formatNumber(summary.min)}</span>
                            <span>Max: {formatNumber(summary.max)}</span>
                            <span>Sum: {formatNumber(summary.sum)}</span>
                            <span>Average: {formatNumber(summary.avg)}</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SpreadsheetSummary;