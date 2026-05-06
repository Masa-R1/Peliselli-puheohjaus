from fastapi import APIRouter
from ..db.models import ChatPrompt
from ..db import agent
from ..crud import prompt_crud as crud

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=str)
def create_chat(prompt: ChatPrompt):
    return crud.create_chat(prompt)

@router.get("", response_model=list[str])
def get_available_models():
    return list(agent.get_available_models().keys())