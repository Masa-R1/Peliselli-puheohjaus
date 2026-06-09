from fastapi import APIRouter
from pydantic import BaseModel

from ..crud.frontend_language_crud import get_frontend_language, set_frontend_language


router = APIRouter(prefix="/ui", tags=["ui"])


class FrontendLanguagePayload(BaseModel):
    language: str


@router.get("/language")
def read_frontend_language():
    return {"language": get_frontend_language()}


@router.post("/language")
def update_frontend_language(payload: FrontendLanguagePayload):
    language = set_frontend_language(payload.language)
    return {"language": language}