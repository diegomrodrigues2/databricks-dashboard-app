from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from app.services.databricks import databricks_service

router = APIRouter()

# Modelos de Resposta Otimizados para o Frontend
class CatalogNode(BaseModel):
    name: str
    type: str = "CATALOG"
    comment: Optional[str] = None

class SchemaNode(BaseModel):
    name: str
    catalog_name: str
    type: str = "SCHEMA"
    comment: Optional[str] = None

class TableNode(BaseModel):
    name: str
    catalog_name: str
    schema_name: str
    table_type: str  # MANAGED, EXTERNAL, VIEW, MATERIALIZED_VIEW
    full_name: str
    type: str = "TABLE"

@router.get("/explorer/catalogs", response_model=List[CatalogNode])
async def get_catalogs():
    """Retorna a lista de catálogos disponíveis."""
    try:
        raw_catalogs = databricks_service.list_catalogs()
        # Transformação de dados brutos da API Databricks para o modelo do frontend
        return [
            CatalogNode(
                name=c['name'], 
                comment=c.get('comment'),
                type="CATALOG"
            ) for c in raw_catalogs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explorer/schemas", response_model=List[SchemaNode])
async def get_schemas(catalog_name: str = Query(..., description="Nome do catálogo pai")):
    try:
        raw_schemas = databricks_service.list_schemas(catalog_name)
        return [
            SchemaNode(
                name=s['name'],
                catalog_name=s['catalog_name'],
                comment=s.get('comment')
            ) for s in raw_schemas
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/explorer/tables", response_model=List[TableNode])
async def get_tables(
    catalog_name: str = Query(..., description="Nome do catálogo pai"),
    schema_name: str = Query(..., description="Nome do esquema pai")
):
    try:
        raw_tables = databricks_service.list_tables(catalog_name, schema_name)
        return [
            TableNode(
                name=t['name'],
                catalog_name=t['catalog_name'],
                schema_name=t['schema_name'],
                table_type=t['table_type'],
                full_name=t.get('full_name', f"{t['catalog_name']}.{t['schema_name']}.{t['name']}")
            ) for t in raw_tables
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

