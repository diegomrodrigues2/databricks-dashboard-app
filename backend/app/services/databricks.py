import requests
import base64
import re
import time
from app.core.config import get_databricks_config
from app.services.databricks_mock import databricks_mock_service

class DatabricksService:
    
    def _get_headers(self, config):
        return {
            "Authorization": f"Bearer {config.token}",
            "Content-Type": "application/json"
        }

    def execute_sql(self, query: str, catalog: str = None, schema: str = None,
                    format: str = "JSON_ARRAY", disposition: str = "INLINE", wait_timeout: str = "30s"):
        """
        Execute SQL query via Databricks SQL Statement Execution API.
        Handles polling for long-running queries and result chunk retrieval.
        """
        # Enforce LIMIT 100 for SELECT queries if not present to avoid large payloads
        stripped = query.strip()
        if stripped.upper().startswith("SELECT"):
            # Check if LIMIT is already present at the end of the query
            if not re.search(r'LIMIT\s+\d+(\s+OFFSET\s+\d+)?\s*;?$', stripped, re.IGNORECASE):
                if stripped.endswith(';'):
                    query = stripped[:-1] + " LIMIT 100;"
                else:
                    query = stripped + " LIMIT 100"

        config = get_databricks_config()
        if not config:
            return databricks_mock_service.execute_sql(query)

        url = f"{config.host.rstrip('/')}/api/2.0/sql/statements"
        headers = self._get_headers(config)
        
        payload = {
            "statement": query,
            "warehouse_id": config.warehouse_id,
            "format": format,
            "disposition": disposition,
            "wait_timeout": wait_timeout
        }
        if catalog:
            payload["catalog"] = catalog
        if schema:
            payload["schema"] = schema

        # Submit the query
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        meta = response.json()

        statement_id = meta.get("statement_id")
        status = meta.get("status", {})
        state = status.get("state")

        # If result is already present (small/fast query with INLINE disposition), return it
        if meta.get("result") is not None and meta.get("manifest") is not None:
            return meta

        # Otherwise, poll until the statement completes
        poll_url = f"{url}/{statement_id}"
        max_poll_attempts = 60  # Max ~60 seconds of polling
        poll_count = 0
        
        while state not in ("SUCCEEDED", "FAILED", "CANCELED", "CLOSED"):
            if poll_count >= max_poll_attempts:
                raise RuntimeError(f"Query timeout: statement {statement_id} did not complete in time")
            
            time.sleep(1)
            poll_count += 1
            
            resp = requests.get(poll_url, headers=headers)
            resp.raise_for_status()
            meta = resp.json()
            status = meta.get("status", {})
            state = status.get("state")

        if state != "SUCCEEDED":
            error_msg = status.get("error", {}).get("message", "Unknown error")
            raise RuntimeError(f"Statement {statement_id} finished with state {state}: {error_msg}")

        # If we have inline results, return them
        if meta.get("result") is not None:
            return meta

        # For EXTERNAL_LINKS disposition or when we need to fetch chunks
        result_url = f"{poll_url}/result/chunks/0"
        resp = requests.get(result_url, headers=headers)
        resp.raise_for_status()
        chunk = resp.json()

        # Handle external links if present
        if chunk.get("external_links"):
            link = chunk["external_links"][0]["external_link"]
            ext_resp = requests.get(link)
            ext_resp.raise_for_status()
            # Merge the external data back into the response structure
            meta["result"] = {"data_array": ext_resp.json()}
            return meta

        # Merge chunk data into meta
        meta["result"] = chunk
        return meta

    def list_directory(self, path: str):
        config = get_databricks_config()
        if not config:
            return databricks_mock_service.list_directory(path)

        url = f"{config.host.rstrip('/')}/api/2.0/dbfs/list"
        headers = self._get_headers(config)
        params = {"path": path}

        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 404:
             # Handle case where directory might not exist or is empty in a way that raises error
             raise ValueError(f"Directory not found: {path}")
        response.raise_for_status()
        return response.json()

    def read_file(self, path: str):
        config = get_databricks_config()
        if not config:
            return databricks_mock_service.read_file(path)

        url = f"{config.host.rstrip('/')}/api/2.0/dbfs/read"
        headers = self._get_headers(config)
        params = {"path": path}

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        content_base64 = data.get("data", "")
        # Decode base64 content
        try:
            content_bytes = base64.b64decode(content_base64)
            content = content_bytes.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Failed to decode file content: {e}")
            
        return {"path": path, "content": content}

    def write_file(self, path: str, content: str, overwrite: bool = True):
        config = get_databricks_config()
        if not config:
            return databricks_mock_service.write_file(path, content, overwrite)

        url = f"{config.host.rstrip('/')}/api/2.0/dbfs/put"
        headers = self._get_headers(config)
        
        # Encode content to base64
        content_bytes = content.encode('utf-8')
        content_base64 = base64.b64encode(content_bytes).decode('utf-8')

        payload = {
            "path": path,
            "contents": content_base64,
            "overwrite": overwrite
        }

        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return {"message": "File saved successfully", "path": path}

    def list_catalogs(self):
        """
        Recupera a lista de catálogos do metastore atual.
        Utiliza o endpoint GET /api/2.1/unity-catalog/catalogs.
        """
        config = get_databricks_config()
        if not config:
            return databricks_mock_service.list_catalogs()

        url = f"{config.host.rstrip('/')}/api/2.1/unity-catalog/catalogs"
        headers = self._get_headers(config)
        
        catalogs = []
        page_token = None
        
        while True:
            params = {}
            if page_token:
                params['page_token'] = page_token
                
            try:
                response = requests.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                if 'catalogs' in data:
                    catalogs.extend(data['catalogs'])
                
                page_token = data.get('next_page_token')
                if not page_token:
                    break
                    
            except requests.exceptions.RequestException as e:
                # Log error appropriate to production environment
                raise ValueError(f"Falha ao listar catálogos: {str(e)}")

        return catalogs

    def list_schemas(self, catalog_name: str):
        """
        Lista esquemas dentro de um catálogo específico.
        Endpoint: GET /api/2.1/unity-catalog/schemas
        """
        config = get_databricks_config()
        if not config:
            return databricks_mock_service.list_schemas(catalog_name)

        url = f"{config.host.rstrip('/')}/api/2.1/unity-catalog/schemas"
        headers = self._get_headers(config)
        
        schemas = []
        page_token = None

        while True:
            params = {'catalog_name': catalog_name}
            if page_token:
                params['page_token'] = page_token

            try:
                response = requests.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()

                if 'schemas' in data:
                    schemas.extend(data['schemas'])

                page_token = data.get('next_page_token')
                if not page_token:
                    break
            except requests.exceptions.RequestException as e:
                 raise ValueError(f"Falha ao listar esquemas: {str(e)}")
        
        return schemas

    def list_tables(self, catalog_name: str, schema_name: str):
        """
        Lista tabelas e views dentro de um esquema.
        Endpoint: GET /api/2.1/unity-catalog/tables
        """
        config = get_databricks_config()
        if not config:
            return databricks_mock_service.list_tables(catalog_name, schema_name)
        
        url = f"{config.host.rstrip('/')}/api/2.1/unity-catalog/tables"
        headers = self._get_headers(config)
        
        tables = []
        page_token = None

        while True:
            params = {
                'catalog_name': catalog_name, 
                'schema_name': schema_name,
                'omit_columns': 'true' # Performance optimization
            }
            if page_token:
                params['page_token'] = page_token
            
            try:
                response = requests.get(url, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                
                if 'tables' in data:
                    tables.extend(data['tables'])
                
                page_token = data.get('next_page_token')
                if not page_token:
                    break
            except requests.exceptions.RequestException as e:
                raise ValueError(f"Falha ao listar tabelas: {str(e)}")
        
        return tables

    def get_table(self, full_table_name: str):
        """
        Recupera metadados de uma tabela específica, incluindo colunas.
        Endpoint: GET /api/2.1/unity-catalog/tables/{full_name}
        """
        config = get_databricks_config()
        if not config:
            return databricks_mock_service.get_table(full_table_name)

        url = f"{config.host.rstrip('/')}/api/2.1/unity-catalog/tables/{full_table_name}"
        headers = self._get_headers(config)
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Falha ao recuperar detalhes da tabela: {str(e)}")

databricks_service = DatabricksService()
