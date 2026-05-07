from pydantic import BaseModel
from typing import Optional

class ChatPrompt(BaseModel):
    model: Optional[str] = None
    prompt: str
    history: Optional[list[dict[str, str]]] = None
