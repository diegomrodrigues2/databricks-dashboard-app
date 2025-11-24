import requests
from app.core.config import get_databricks_config

class DatabricksService:
    def execute_sql(self, query: str):
        config = get_databricks_config()
        if not config:
            raise ValueError("Databricks configuration not found")

        url = f"{config.host.rstrip('/')}/api/2.0/sql/statements"
        headers = {
            "Authorization": f"Bearer {config.token}",
            "Content-Type": "application/json"
        }
        payload = {
            "statement": query,
            "warehouse_id": config.warehouse_id,
            "wait_timeout": "30s" 
        }

        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

databricks_service = DatabricksService()

