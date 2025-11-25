import json
import os
from typing import Optional
from pydantic import BaseModel

CONFIG_FILE = "config/app_settings.json"

class DatabricksConfig(BaseModel):
    host: str
    token: str
    warehouse_id: str
    serving_endpoint: Optional[str] = None
    model_name: Optional[str] = None

class AppConfig(BaseModel):
    databricks: Optional[DatabricksConfig] = None

def load_config() -> AppConfig:
    if not os.path.exists(CONFIG_FILE):
        return AppConfig()
    try:
        with open(CONFIG_FILE, "r") as f:
            data = json.load(f)
            return AppConfig(**data)
    except Exception:
        return AppConfig()

def save_config(config: AppConfig):
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        f.write(config.model_dump_json(indent=2))

def get_databricks_config() -> Optional[DatabricksConfig]:
    config = load_config()
    # Prioritize env vars if set (optional, but good practice)
    host = os.getenv("DATABRICKS_HOST")
    token = os.getenv("DATABRICKS_TOKEN")
    warehouse_id = os.getenv("DATABRICKS_WAREHOUSE_ID")
    serving_endpoint = os.getenv("DATABRICKS_SERVING_ENDPOINT")
    model_name = os.getenv("DATABRICKS_MODEL_NAME")
    
    if host and token and warehouse_id:
        return DatabricksConfig(
            host=host, 
            token=token, 
            warehouse_id=warehouse_id,
            serving_endpoint=serving_endpoint,
            model_name=model_name
        )
        
    return config.databricks

