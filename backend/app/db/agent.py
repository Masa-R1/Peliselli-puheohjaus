from langchain_ollama import ChatOllama
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
import subprocess

def get_available_models() -> dict[str, ChatOllama]:
    models = dict()
    model_names = []

    data = subprocess.run(['ollama', 'list'], stdout=subprocess.PIPE).stdout.decode('utf-8')

    lines = data.strip().split("\n")

    # Skip the header (first line)
    for line in lines[1:]:
        parts = line.split()
        if parts:
            model_names.append(parts[0])

    print(model_names)

    [models.update({x: ChatOllama(model=x)}) for x in model_names]

    return models

def get_default_model(models: dict[str, ChatOllama]) -> ChatOllama:
    models = get_available_models()
    return models[list(models.keys())[0]]

selected_model = get_default_model(get_available_models())

def set_model(model: str):
    models = get_available_models()
    if model in models:
        selected_model = models[model]

@wrap_model_call
def dynamic_model_selection(request: ModelRequest, handler) -> ModelResponse:
    models = get_available_models()

    if selected_model not in models:
        selected_model = get_default_model(models)

    return handler(request.override(model=selected_model))

agent = create_agent(
    model=selected_model,
    middleware=[dynamic_model_selection],
    system_prompt="Answer FAST",
)

def invoke_agent(prompt: str) -> str:
    result = agent.invoke(
        {"messages": [{"role": "user", "content": prompt}]}
    )

    return result["messages"][-1].content_blocks[-1]["text"]