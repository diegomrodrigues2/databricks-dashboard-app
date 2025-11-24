from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.config import AppConfig, DatabricksConfig, save_config, load_config
from app.services.databricks import databricks_service

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    language: str = "sql"

class ConfigResponse(BaseModel):
    host: str
    warehouse_id: str
    has_token: bool

@router.post("/config")
async def update_config(config: DatabricksConfig):
    app_config = load_config()
    app_config.databricks = config
    save_config(app_config)
    return {"message": "Configuration saved successfully"}

@router.get("/config", response_model=ConfigResponse)
async def get_config():
    app_config = load_config()
    if not app_config.databricks:
        return ConfigResponse(host="", warehouse_id="", has_token=False)
    
    return ConfigResponse(
        host=app_config.databricks.host,
        warehouse_id=app_config.databricks.warehouse_id,
        has_token=bool(app_config.databricks.token)
    )

@router.post("/query")
async def execute_query(request: QueryRequest):
    if request.language != "sql":
         # For now only SQL is supported via Databricks SQL API
         # Python execution would require a different approach (e.g. Jobs API)
         return {"error": "Only SQL is supported in this backend implementation currently."}
    
    try:
        result = databricks_service.execute_sql(request.query)
        
        # Transform Databricks SQL API response to a simpler format if needed
        # The frontend expects { result: ... } or similar. 
        # The standard response has 'result' key with 'data_array' and 'schema'.
        
        if 'result' in result:
             columns = [col['name'] for col in result['result']['schema']['columns']]
             data = []
             for row in result['result']['data_array']:
                 row_dict = {}
                 for i, val in enumerate(row):
                     row_dict[columns[i]] = val
                 data.append(row_dict)
             return {"data": data}
        
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

