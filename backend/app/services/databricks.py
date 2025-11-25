import requests
import base64
from app.core.config import get_databricks_config

class DatabricksService:
    # Mock data storage
    _mock_files = {
        "dbfs:/FileStore/demo_query.sql": "SELECT * FROM samples.nyctaxi.trips LIMIT 10;",
        "dbfs:/FileStore/readme.md": "# Demo Project\n\nThis is a mock file system.",
        "dbfs:/FileStore/projects/analysis.sql": "-- Analysis query\nSELECT count(*) FROM sales;"
    }

    def _get_headers(self, config):
        return {
            "Authorization": f"Bearer {config.token}",
            "Content-Type": "application/json"
        }

    def execute_sql(self, query: str):
        config = get_databricks_config()
        if not config:
            # Mock SQL execution
            if "samples.nyctaxi.trips" in query:
                return {
                    "result": {
                        "schema": {
                            "columns": [
                                {"name": "tpep_pickup_datetime", "type": "string"},
                                {"name": "tpep_dropoff_datetime", "type": "string"},
                                {"name": "trip_distance", "type": "double"},
                                {"name": "fare_amount", "type": "double"},
                                {"name": "pickup_zip", "type": "int"},
                                {"name": "dropoff_zip", "type": "int"}
                            ]
                        },
                        "data_array": [
                            ["2023-01-01 00:00:00", "2023-01-01 00:15:00", 2.5, 15.0, 10001, 10002],
                            ["2023-01-01 00:10:00", "2023-01-01 00:35:00", 5.1, 25.5, 10003, 10004],
                            ["2023-01-01 00:20:00", "2023-01-01 00:25:00", 0.8, 7.0, 10001, 10001]
                        ]
                    }
                }
            elif "main.default.users" in query:
                return {
                    "result": {
                        "schema": {
                            "columns": [
                                {"name": "id", "type": "int"},
                                {"name": "name", "type": "string"},
                                {"name": "email", "type": "string"},
                                {"name": "created_at", "type": "string"}
                            ]
                        },
                        "data_array": [
                            [1, "John Doe", "john@example.com", "2023-01-01"],
                            [2, "Jane Smith", "jane@example.com", "2023-01-02"],
                            [3, "Bob Johnson", "bob@example.com", "2023-01-03"]
                        ]
                    }
                }
            elif "main.default.transactions" in query:
                return {
                    "result": {
                        "schema": {
                            "columns": [
                                {"name": "transaction_id", "type": "string"},
                                {"name": "amount", "type": "double"},
                                {"name": "currency", "type": "string"}
                            ]
                        },
                        "data_array": [
                            ["tx_001", 100.50, "USD"],
                            ["tx_002", 50.25, "EUR"],
                            ["tx_003", 200.00, "USD"]
                        ]
                    }
                }

            return {
                "result": {
                    "schema": {"columns": [{"name": "result", "type": "string"}]},
                    "data_array": [["Mock query executed successfully"]]
                }
            }

        url = f"{config.host.rstrip('/')}/api/2.0/sql/statements"
        headers = self._get_headers(config)
        payload = {
            "statement": query,
            "warehouse_id": config.warehouse_id,
            "wait_timeout": "30s" 
        }

        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

    def list_directory(self, path: str):
        config = get_databricks_config()
        if not config:
            # Mock directory listing
            files = []
            # Ensure path has trailing slash for matching
            search_path = path.rstrip('/') + '/'
            seen_dirs = set()

            for file_path, content in self._mock_files.items():
                if file_path.startswith(search_path):
                    rel_path = file_path[len(search_path):]
                    parts = rel_path.split('/')
                    
                    name = parts[0]
                    full_path = search_path + name
                    
                    if len(parts) > 1:
                        # It's a directory
                        if name not in seen_dirs:
                            files.append({
                                "path": full_path,
                                "is_dir": True,
                                "file_size": 0
                            })
                            seen_dirs.add(name)
                    else:
                        # It's a file
                        files.append({
                            "path": full_path,
                            "is_dir": False,
                            "file_size": len(content)
                        })
            
            return {"files": files}

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
            # Mock read file
            if path in self._mock_files:
                return {"path": path, "content": self._mock_files[path]}
            raise ValueError(f"File not found in mock: {path}")

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
            # Mock write file
            if not overwrite and path in self._mock_files:
                raise ValueError("File already exists")
            self._mock_files[path] = content
            return {"message": "File saved successfully (Mock)", "path": path}

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
            # Mock catalogs
            return [
                {"name": "main", "comment": "Main catalog"},
                {"name": "samples", "comment": "Sample datasets"}
            ]

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
            # Mock schemas
            if catalog_name == "main":
                return [
                    {"name": "default", "catalog_name": "main", "comment": "Default schema"},
                    {"name": "analytics", "catalog_name": "main", "comment": "Analytics data"}
                ]
            elif catalog_name == "samples":
                return [
                    {"name": "nyctaxi", "catalog_name": "samples", "comment": "NYC Taxi data"},
                    {"name": "tpch", "catalog_name": "samples", "comment": "TPC-H benchmark data"}
                ]
            return []

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
            # Mock tables
            if catalog_name == "samples" and schema_name == "nyctaxi":
                 return [
                    {"name": "trips", "catalog_name": "samples", "schema_name": "nyctaxi", "table_type": "MANAGED", "full_name": "samples.nyctaxi.trips"}
                 ]
            elif catalog_name == "main" and schema_name == "default":
                 return [
                     {"name": "users", "catalog_name": "main", "schema_name": "default", "table_type": "MANAGED", "full_name": "main.default.users"},
                     {"name": "transactions", "catalog_name": "main", "schema_name": "default", "table_type": "EXTERNAL", "full_name": "main.default.transactions"}
                 ]
            return []
        
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

databricks_service = DatabricksService()
