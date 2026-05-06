from langchain_ollama import ChatOllama
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
import subprocess


class ModelManager:
    def __init__(self):
        self.models = self._load_models()
        self.selected_model = self._get_default_model()

    def _load_models(self) -> dict[str, ChatOllama]:
        models = {}

        data = subprocess.run(
            ['ollama', 'list'],
            stdout=subprocess.PIPE
        ).stdout.decode('utf-8')

        lines = data.strip().split("\n")

        for line in lines[1:]:  # skip header
            parts = line.split()
            if parts:
                name = parts[0]
                models[name] = ChatOllama(model=name)

        return models
    
    def get_model_names(self) -> list[str]:
        return list(self.models.keys())

    def refresh(self):
        self.models = self._load_models()
        if self.selected_model_name not in self.models:
            self.selected_model = self._get_default_model()

    def _get_default_model(self) -> ChatOllama:
        return next(iter(self.models.values()))

    @property
    def selected_model_name(self):
        for name, model in self.models.items():
            if model == self.selected_model:
                return name
        return None

    def set_model(self, model_name: str):
        if model_name in self.models:
            self.selected_model = self.models[model_name]


# Create a single manager instance
model_manager = ModelManager()


@wrap_model_call
def dynamic_model_selection(request: ModelRequest, handler) -> ModelResponse:
    model_manager.refresh()
    return handler(request.override(model=model_manager.selected_model))


agent = create_agent(
    model=model_manager.selected_model,
    middleware=[dynamic_model_selection],
    system_prompt="Answer FAST",
)


def invoke_agent(prompt: str) -> str:
    result = agent.invoke(
        {"messages": [{"role": "user", "content": prompt}]}
    )
    return result["messages"][-1].content_blocks[-1]["text"]