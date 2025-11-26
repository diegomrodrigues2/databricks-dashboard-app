import base64

class DatabricksMockService:
    # Mock data storage
    _mock_files = {
        "dbfs:/FileStore/demo_query.sql": "SELECT * FROM samples.nyctaxi.trips LIMIT 10;",
        "dbfs:/FileStore/readme.md": "# Demo Project\n\nThis is a mock file system.",
        "dbfs:/FileStore/projects/analysis.sql": "-- Analysis query\nSELECT count(*) FROM sales;"
    }

    def execute_sql(self, query: str):
        """
        Returns mock data in the same structure as Databricks SQL Statement Execution API.
        Structure: { manifest: { schema: { columns: [...] } }, result: { data_array: [...] } }
        """
        if "samples.nyctaxi.trips" in query:
            return {
                "statement_id": "mock-statement-001",
                "status": {"state": "SUCCEEDED"},
                "manifest": {
                    "format": "JSON_ARRAY",
                    "schema": {
                        "column_count": 6,
                        "columns": [
                            {"name": "tpep_pickup_datetime", "type_text": "STRING", "type_name": "STRING", "position": 0},
                            {"name": "tpep_dropoff_datetime", "type_text": "STRING", "type_name": "STRING", "position": 1},
                            {"name": "trip_distance", "type_text": "DOUBLE", "type_name": "DOUBLE", "position": 2},
                            {"name": "fare_amount", "type_text": "DOUBLE", "type_name": "DOUBLE", "position": 3},
                            {"name": "pickup_zip", "type_text": "INT", "type_name": "INT", "position": 4},
                            {"name": "dropoff_zip", "type_text": "INT", "type_name": "INT", "position": 5}
                        ]
                    },
                    "total_row_count": 3,
                    "truncated": False
                },
                "result": {
                    "chunk_index": 0,
                    "row_offset": 0,
                    "row_count": 3,
                    "data_array": [
                        ["2023-01-01 00:00:00", "2023-01-01 00:15:00", 2.5, 15.0, 10001, 10002],
                        ["2023-01-01 00:10:00", "2023-01-01 00:35:00", 5.1, 25.5, 10003, 10004],
                        ["2023-01-01 00:20:00", "2023-01-01 00:25:00", 0.8, 7.0, 10001, 10001]
                    ]
                }
            }
        elif "main.default.users" in query:
            return {
                "statement_id": "mock-statement-002",
                "status": {"state": "SUCCEEDED"},
                "manifest": {
                    "format": "JSON_ARRAY",
                    "schema": {
                        "column_count": 4,
                        "columns": [
                            {"name": "id", "type_text": "INT", "type_name": "INT", "position": 0},
                            {"name": "name", "type_text": "STRING", "type_name": "STRING", "position": 1},
                            {"name": "email", "type_text": "STRING", "type_name": "STRING", "position": 2},
                            {"name": "created_at", "type_text": "STRING", "type_name": "STRING", "position": 3}
                        ]
                    },
                    "total_row_count": 3,
                    "truncated": False
                },
                "result": {
                    "chunk_index": 0,
                    "row_offset": 0,
                    "row_count": 3,
                    "data_array": [
                        [1, "John Doe", "john@example.com", "2023-01-01"],
                        [2, "Jane Smith", "jane@example.com", "2023-01-02"],
                        [3, "Bob Johnson", "bob@example.com", "2023-01-03"]
                    ]
                }
            }
        elif "main.default.transactions" in query:
            return {
                "statement_id": "mock-statement-003",
                "status": {"state": "SUCCEEDED"},
                "manifest": {
                    "format": "JSON_ARRAY",
                    "schema": {
                        "column_count": 3,
                        "columns": [
                            {"name": "transaction_id", "type_text": "STRING", "type_name": "STRING", "position": 0},
                            {"name": "amount", "type_text": "DOUBLE", "type_name": "DOUBLE", "position": 1},
                            {"name": "currency", "type_text": "STRING", "type_name": "STRING", "position": 2}
                        ]
                    },
                    "total_row_count": 3,
                    "truncated": False
                },
                "result": {
                    "chunk_index": 0,
                    "row_offset": 0,
                    "row_count": 3,
                    "data_array": [
                        ["tx_001", 100.50, "USD"],
                        ["tx_002", 50.25, "EUR"],
                        ["tx_003", 200.00, "USD"]
                    ]
                }
            }

        # Generic fallback for unknown queries
        return {
            "statement_id": "mock-statement-fallback",
            "status": {"state": "SUCCEEDED"},
            "manifest": {
                "format": "JSON_ARRAY",
                "schema": {
                    "column_count": 1,
                    "columns": [
                        {"name": "result", "type_text": "STRING", "type_name": "STRING", "position": 0}
                    ]
                },
                "total_row_count": 1,
                "truncated": False
            },
            "result": {
                "chunk_index": 0,
                "row_offset": 0,
                "row_count": 1,
                "data_array": [["Mock query executed successfully"]]
            }
        }

    def list_directory(self, path: str):
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

    def read_file(self, path: str):
        if path in self._mock_files:
            return {"path": path, "content": self._mock_files[path]}
        raise ValueError(f"File not found in mock: {path}")

    def write_file(self, path: str, content: str, overwrite: bool = True):
        if not overwrite and path in self._mock_files:
            raise ValueError("File already exists")
        self._mock_files[path] = content
        return {"message": "File saved successfully (Mock)", "path": path}

    def list_catalogs(self):
        return [
            {"name": "main", "comment": "Main catalog"},
            {"name": "samples", "comment": "Sample datasets"}
        ]

    def list_schemas(self, catalog_name: str):
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

    def list_tables(self, catalog_name: str, schema_name: str):
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

    def get_table(self, full_table_name: str):
        if full_table_name == "samples.nyctaxi.trips":
            return {
                "name": "trips",
                "catalog_name": "samples",
                "schema_name": "nyctaxi",
                "table_type": "MANAGED",
                "comment": "NYC Taxi Trip Data",
                "columns": [
                     {"name": "tpep_pickup_datetime", "type_text": "TIMESTAMP", "type_name": "TIMESTAMP", "comment": "Pickup time"},
                     {"name": "trip_distance", "type_text": "DOUBLE", "type_name": "DOUBLE", "comment": "Distance in miles"},
                     {"name": "fare_amount", "type_text": "DOUBLE", "type_name": "DOUBLE", "comment": "Fare cost"}
                ]
            }
        elif full_table_name == "main.default.users":
             return {
                "name": "users",
                "catalog_name": "main",
                "schema_name": "default",
                "table_type": "MANAGED",
                "comment": "User registry",
                "columns": [
                     {"name": "id", "type_text": "INT", "type_name": "INT", "comment": "User ID"},
                     {"name": "name", "type_text": "STRING", "type_name": "STRING", "comment": "Full name"},
                     {"name": "email", "type_text": "STRING", "type_name": "STRING", "comment": "Email address"}
                ]
            }
        raise ValueError(f"Tabela não encontrada (Mock): {full_table_name}")

databricks_mock_service = DatabricksMockService()

