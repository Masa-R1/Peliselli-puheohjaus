from fastapi import APIRouter, status
from ..crud.voice_crud import is_voice_enabled, set_voice_enabled

router = APIRouter(prefix="/voice", tags=["voice"])

@router.get("")
def get_voice_state():
    return {"enabled": is_voice_enabled()}

@router.post("/enable", status_code=status.HTTP_204_NO_CONTENT)
def enable_voice_recognition():
    set_voice_enabled(True)

@router.post("/disable", status_code=status.HTTP_204_NO_CONTENT)
def disable_voice_recognition():
    set_voice_enabled(False)