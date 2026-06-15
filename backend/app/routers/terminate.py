from fastapi import APIRouter
from _thread import interrupt_main

router = APIRouter(prefix="/terminate", tags=["terminate"])

@router.post("")
def terminate():
    return interrupt_main()