from pydantic import BaseModel


class ChatPrompt(BaseModel):
    model: str | None = None
    prompt: str
