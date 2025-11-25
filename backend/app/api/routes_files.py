from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.services.databricks import databricks_service

router = APIRouter()

class FileContent(BaseModel):
    path: str
    content: str

@router.get("/listdir")
async def list_directory(path: str = Query(..., description="Path to directory in DBFS")):
    try:
        result = databricks_service.list_directory(path)
        # Format response to match frontend expectations if necessary
        # The Databricks API returns { "files": [ { "path": "...", "is_dir": bool, "file_size": int } ] }
        # We might want to normalize this.
        files = []
        if "files" in result:
            for f in result["files"]:
                files.append({
                    "name": f["path"].split("/")[-1],
                    "path": f["path"],
                    "type": "directory" if f["is_dir"] else "file",
                    "size": f["file_size"]
                })
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/files")
async def get_file(path: str = Query(..., description="Path to file in DBFS")):
    try:
        return databricks_service.read_file(path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/files")
async def save_file(file_data: FileContent):
    try:
        return databricks_service.write_file(file_data.path, file_data.content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

