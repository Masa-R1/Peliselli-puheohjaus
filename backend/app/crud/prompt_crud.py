from ..db.models import ChatPrompt
from ..db.agent import set_model, invoke_agent

def create_chat(prompt: ChatPrompt):
    if prompt.model:
        set_model(prompt.model)

    return invoke_agent(prompt.prompt)
    