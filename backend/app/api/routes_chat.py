from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
from app.core.config import load_config

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    # Allows override by frontend, but uses config as fallback
    endpoint_name: Optional[str] = None 
    temperature: Optional[float] = 0.7

async def databricks_stream_generator(payload: dict, config):
    """
    Generator that maintains connection with Databricks and forwards bytes.
    """
    # Dynamic URL construction based on config
    endpoint = payload.get("endpoint_name") or config.serving_endpoint
    
    if not endpoint:
        yield f"data: {json.dumps({'error': 'No serving endpoint configured.'})}\n\n"
        return

    # Clean host URL
    host = config.host.rstrip('/')
    # If the endpoint is a full URL, use it. Otherwise construct it.
    if endpoint.startswith("http"):
        url = endpoint
    else:
        url = f"{host}/serving-endpoints/{endpoint}/invocations"
    
    headers = {
        "Authorization": f"Bearer {config.token}",
        "Content-Type": "application/json"
    }
    
    # Payload compatible with OpenAI/Databricks Foundation Models
    db_payload = {
        "messages": payload["messages"],
        "temperature": payload.get("temperature", 0.7),
        "max_tokens": 2000, # Safe configuration
        "stream": True # Enable SSE
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            async with client.stream("POST", url, headers=headers, json=db_payload) as response:
                if response.status_code != 200:
                    error_msg = await response.aread()
                    yield f"data: {json.dumps({'error': f'Error {response.status_code}: {error_msg.decode()}'})}\n\n"
                    return

                async for chunk in response.aiter_bytes():
                    # Direct pass-through of bytes preserves SSE formatting
                    yield chunk
        except httpx.ReadTimeout:
            yield f"data: {json.dumps({'error': 'Timeout connecting to model.'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

@router.post("/chat/completions")
async def chat_completions(request: ChatRequest):
    config = load_config().databricks
    if not config or not config.token:
        raise HTTPException(status_code=500, detail="Invalid Databricks configuration.")
    
    return StreamingResponse(
        databricks_stream_generator(request.model_dump(), config),
        media_type="text/event-stream"
    )

