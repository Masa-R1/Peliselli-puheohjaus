from langchain_ollama import ChatOllama
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from typing import Optional
import subprocess
import time
from urllib.error import URLError
from urllib.request import urlopen
from langchain.tools import tool



# Testi tool
# @tool
# def change_Light_Color(color: str) -> str:
#     """Tool to change the light color in Home Assistant."""
#     print(color)
#     return f"Changed light color to {color}."

class ModelManager:
    def __load_models_and_set_default(self): 
        self.models = self._load_models()
        self.selected_model_name = self._get_default_model_name()

    def _wait_for_ollama(self, timeout_seconds: int = 45):
        deadline = time.monotonic() + timeout_seconds

        while time.monotonic() < deadline:
            try:
                with urlopen("http://localhost:11434", timeout=1) as response:
                    if response.status == 200:
                        return
            except URLError:
                pass    
            except TimeoutError:
                time.sleep(0.5)

        raise TimeoutError("Ollama did not become ready on localhost:11434")

    def __init__(self):
        subprocess.Popen(
            ['ollama', 'serve'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        self._wait_for_ollama()

        self.__load_models_and_set_default()

        if not self.selected_model_name or len(self.selected_model_name) < 1:
            subprocess.run(['ollama', 'pull', 'gpt-3.5-turbo']) 
            self.__load_models_and_set_default()

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

        # Ensure selected model still exists
        if self.selected_model_name not in self.models:
            self.selected_model_name = self._get_default_model_name()

    def _get_default_model_name(self) -> str:
        try:
            return next(iter(self.models.keys()))
        except StopIteration:
            return str()

    @property
    def selected_model(self) -> ChatOllama:
        return self.models[self.selected_model_name]

    def set_model(self, model_name: str):
        if model_name in self.models:
            self.selected_model_name = model_name


# Create a single manager instance
model_manager = ModelManager()


@wrap_model_call
def dynamic_model_selection(request: ModelRequest, handler) -> ModelResponse:
    model_manager.refresh()
    return handler(request.override(model=model_manager.selected_model))


agent = create_agent(
    model=model_manager.selected_model,
    middleware=[dynamic_model_selection]
    # tools=[change_Light_Color]
)


def invoke_agent(prompt: str, history: Optional[list[dict[str,str]]] = None) -> dict[str,str]:
    messages = history[:] if history else []
    messages.append({"role": "user", "content": prompt})
    result = agent.invoke({"messages": messages})

    try:
        answer = result["messages"][-1].content_blocks[-1]["text"]
        return {"role": "assistant", "content": answer}
    except:
        return {"role": "assistant", "content": "Error: No response from model."}


def invoke_agent_streaming(prompt: str, history: Optional[list[dict[str,str]]] = None):
    """Stream the response from the agent chunk by chunk"""
    messages = history[:] if history else []
    messages.append({"role": "user", "content": prompt})
    
    try:
        # Stream the response using the LangChain model's streaming capability
        for chunk in model_manager.selected_model.stream(messages):
            if hasattr(chunk, 'content') and chunk.content:
                yield chunk.content
            elif isinstance(chunk, str):
                yield chunk
    except Exception as e:
        yield f"Error: {str(e)}"