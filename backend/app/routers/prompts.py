from fastapi import APIRouter
from ..db.models import ChatPrompt
from ..db.agent import model_manager
from ..crud import prompt_crud as crud

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=str)
def create_chat(prompt: ChatPrompt):
    return crud.create_chat(prompt)

@router.get("", response_model=list[str])
def get_available_models():
    model_manager.refresh()
    return model_manager.get_model_names()