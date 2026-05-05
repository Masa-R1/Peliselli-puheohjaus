from ..database.models import ChatPrompt
from ..database.agent import agent

def create_chat(prompt: ChatPrompt):
    result = agent.invoke(
        {"messages": [{"role": "user", "content": prompt.prompt}]}
    )

    return result["messages"][-1].content_blocks[-1]["text"]
    