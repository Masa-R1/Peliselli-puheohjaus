from langchain.agents import create_agent

agent = create_agent(
    model="ollama:gemma3",
    system_prompt="Answer FAST",
)
