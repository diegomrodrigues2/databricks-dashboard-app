
import * as d3 from 'd3-array';
import type { AggregationType } from '../types';

export const aggregateData = (data: any[], column: string, aggregation: AggregationType): number => {
  if (!data || data.length === 0) return 0;

  const accessor = (d: any) => d[column];

  switch (aggregation) {
    case 'sum':
      return d3.sum(data, accessor);
    case 'avg':
      return d3.mean(data, accessor) ?? 0;
    case 'max':
      return d3.max(data, accessor) ?? 0;
    case 'min':
      return d3.min(data, accessor) ?? 0;
    case 'count':
      return data.length;
    case 'count_distinct':
      return new Set(data.map(accessor)).size;
    default:
      console.warn(`Unknown aggregation type: ${aggregation}`);
      return 0;
  }
};
