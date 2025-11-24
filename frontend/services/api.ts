export const saveConfig = async (host: string, token: string, warehouseId: string) => {
  const response = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host, token, warehouse_id: warehouseId }),
  });
  if (!response.ok) {
    throw new Error('Failed to save configuration');
  }
  return response.json();
};

export const getConfig = async () => {
  const response = await fetch('/api/config');
  if (!response.ok) {
    throw new Error('Failed to load configuration');
  }
  return response.json();
};

export const executeQuery = async (query: string, language: string = 'sql') => {
  const response = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language }),
  });
  if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Failed to execute query');
  }
  return response.json();
};

