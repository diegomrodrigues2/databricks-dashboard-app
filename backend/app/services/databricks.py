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

databricks_service = DatabricksService()
