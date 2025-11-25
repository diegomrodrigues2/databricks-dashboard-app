import React, { useState, useEffect } from 'react';
import { saveConfig, getConfig } from '../services/api';

const ConfigPage: React.FC = () => {
  const [host, setHost] = useState('');
  const [token, setToken] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [servingEndpoint, setServingEndpoint] = useState('');
  const [modelName, setModelName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const config = await getConfig();
        setHost(config.host || '');
        setWarehouseId(config.warehouse_id || '');
        setServingEndpoint(config.serving_endpoint || '');
        setModelName(config.model_name || '');
        if (config.has_token) {
            setToken('********');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      await saveConfig(host, token, warehouseId, servingEndpoint, modelName);
      setStatus('Saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('Error saving config');
      console.error(e);
    }
  };

  if (loading) return <div className="p-6 text-gray-300">Loading configuration...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-100 mb-4">Configuration</h1>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="border-b border-gray-700 pb-4 mb-4">
            <h2 className="text-lg font-medium text-white mb-3">Connection</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-gray-300 mb-1">Databricks Host URL</label>
                    <input 
                    type="text" 
                    value={host} 
                    onChange={e => setHost(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                    placeholder="https://adb-....azuredatabricks.net"
                    />
                </div>
                <div>
                    <label className="block text-gray-300 mb-1">Access Token</label>
                    <input 
                    type="password" 
                    value={token} 
                    onChange={e => setToken(e.target.value)}
                    onFocus={() => { if(token === '********') setToken(''); }}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                    placeholder="dapi..."
                    />
                    <p className="text-xs text-gray-400 mt-1">Stored securely in backend config file. (Re-enter to update)</p>
                </div>
                <div>
                    <label className="block text-gray-300 mb-1">SQL Warehouse ID</label>
                    <input 
                    type="text" 
                    value={warehouseId} 
                    onChange={e => setWarehouseId(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                    placeholder="e.g. 1234567890abcdef"
                    />
                </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-white mb-3">Model Serving</h2>
            <div className="space-y-4">
                 <div>
                    <label className="block text-gray-300 mb-1">Serving Endpoint Name</label>
                    <input 
                    type="text" 
                    value={servingEndpoint} 
                    onChange={e => setServingEndpoint(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                    placeholder="e.g. databricks-meta-llama-3-1-8b-instruct"
                    />
                     <p className="text-xs text-gray-400 mt-1">The name of the serving endpoint in Databricks.</p>
                </div>
                <div>
                    <label className="block text-gray-300 mb-1">Model Display Name (Optional)</label>
                    <input 
                    type="text" 
                    value={modelName} 
                    onChange={e => setModelName(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
                    placeholder="e.g. Llama 3.1"
                    />
                </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              Save Configuration
            </button>
            {status && <span className="ml-4 text-yellow-400">{status}</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigPage;
