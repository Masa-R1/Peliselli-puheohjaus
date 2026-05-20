import httpx
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from typing import Optional
import subprocess
import time
from urllib.error import URLError
from urllib.request import urlopen
from langchain.tools import tool
from langchain.chat_models import init_chat_model, BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
# Toolit
@tool
def change_light_color(color: str) -> str:
    """Tool to change the light color in Home Assistant."""
    print(color)
    return f"Changed light color to {color}."

@tool
def get_model_information(model_name: str) -> str:
    """Tool to get information about you and other available models.
    
    Args:        
        model_name: 
                    If equal to "current", returns information about the currently selected model.
                    Otherwise, if not empty, returns information about the specified model. 
                    If empty, returns information about all available models.
    """

    if model_name is None or model_name == "":
        data = str()
        for model_name in model_manager.get_model_names():
            data += subprocess.run(
                ['ollama', 'show', model_name],
                stdout=subprocess.PIPE
            ).stdout.decode('utf-8')
        return data
    
    if model_name.lower() == "current":
        model_name = model_manager.selected_model_name  

    return subprocess.run(
        ['ollama', 'show', model_name],
        stdout=subprocess.PIPE
    ).stdout.decode('utf-8')         

TOOLS = [change_light_color, get_model_information]

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
            raise RuntimeError("No Ollama models found. Please add a model and restart the application.")

    def _load_models(self) -> dict[str, BaseChatModel]:
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
                model = init_chat_model(
                    model_provider="ollama",
                    model=name,
                    timeout=httpx.Timeout(
                        connect=30.0,  # Connection timeout (like curl --connect-timeout)
                        read=60.0,     # Time to wait for response data
                        write=30.0,    # Time to wait for sending data
                        pool=30.0      # Time to wait for connection from pool
                    )
                )
                models[name] = model.bind_tools(TOOLS)

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
    def selected_model(self) -> BaseChatModel:
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

ERROR_NO_RESPONSE = "Error: No response from model."

def invoke_agent(prompt: str, history: Optional[list[dict[str,str]]] = None) -> dict[str,str]:
    messages = history[:] if history else []
    messages.append({"role": "user", "content": prompt})
    
    # Convert dict messages to LangChain message objects
    message_objects = []    

    for msg in messages:
        match msg["role"]:
            case "assistant":
                message_objects.append(AIMessage(content=msg["content"]))
            case "system":
                message_objects.append(SystemMessage(content=msg["content"]))
            case _:
                message_objects.append(HumanMessage(content=msg["content"]))

    try:
        result = model_manager.selected_model.invoke(message_objects)

        # Normalize various result shapes to a string response
        content = ERROR_NO_RESPONSE

        # plain string
        if isinstance(result, str):
            content = result
        # LangChain-like object with .content attribute
        elif hasattr(result, "content"):
            content = getattr(result, "content") or ERROR_NO_RESPONSE
        # list of strings or dicts [{...}] or [str,...]
        elif isinstance(result, list):
            parts: list[str] = []
            for item in result:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    for k in ("text", "content", "message"):
                        if k in item and isinstance(item[k], str):
                            parts.append(item[k])
                            break
            content = "\n".join(parts) if parts else ERROR_NO_RESPONSE
        # dict with possible keys
        elif isinstance(result, dict):
            for k in ("content", "text", "message"):
                if k in result and isinstance(result[k], str):
                    content = result[k]
                    break
            else:
                if "messages" in result and isinstance(result["messages"], list) and result["messages"]:
                    last = result["messages"][-1]
                    if isinstance(last, dict):
                        for k in ("content", "text", "message"):
                            if k in last and isinstance(last[k], str):
                                content = last[k]
                                break
                    elif isinstance(last, str):
                        content = last

        return {"role": "assistant", "content": content}
    except Exception:
        return {"role": "assistant", "content": ERROR_NO_RESPONSE}