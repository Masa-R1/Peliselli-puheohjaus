from pydantic import BaseModel


class ChatPrompt(BaseModel):
    model: str | None
    prompt: str
