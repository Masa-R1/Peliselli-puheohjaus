from fastapi import APIRouter
from ..database.models import ChatPrompt
from ..crud import prompt_crud as crud

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=str)
def create_chat(prompt: ChatPrompt):
    return crud.create_chat(prompt)