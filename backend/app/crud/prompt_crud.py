from ..db.models import ChatPrompt
from ..db.agent import model_manager, invoke_agent, stream_agent

def create_chat(prompt: ChatPrompt):
    if prompt.model:
        model_manager.set_model(prompt.model)

    return invoke_agent(prompt.prompt, prompt.history)


async def create_chat_stream(prompt: ChatPrompt):
    if prompt.model:
        model_manager.set_model(prompt.model)

    async for token in stream_agent(prompt.prompt, prompt.history):
        yield token
    