from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from ..db.models import ChatPrompt
from ..db.agent import model_manager, invoke_agent, invoke_agent_streaming
from ..crud import prompt_crud as crud

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=dict[str,str])
def create_chat(prompt: ChatPrompt):
    return crud.create_chat(prompt)

@router.post("/stream")
def stream_chat(prompt: ChatPrompt):
    """Stream the chat response chunk by chunk"""
    if prompt.model:
        model_manager.set_model(prompt.model)
    
    def generate():
        for chunk in invoke_agent_streaming(prompt.prompt, prompt.history):
            # Send each chunk as a separate line in the stream
            yield f"data: {chunk}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("", response_model=list[str])
def get_available_models():
    model_manager.refresh()
    return model_manager.get_model_names()