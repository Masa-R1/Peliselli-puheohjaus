import subprocess
import json
import os
from httpx import InvalidURL, HTTPError
from dotenv import load_dotenv
from ollama import Client as OllamaClient
from langchain_ollama import ChatOllama
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from typing import Any, AsyncIterator, Optional
import time
from langchain.tools import tool
from .mcp_tools import get_tools as get_mcp_tools
from .tools import get_tools as get_local_tools

load_dotenv()

class ModelManager:
    def __load_models_and_set_default(self): 
        self.models = self._load_models()
        self.selected_model_name = self._get_default_model_name()

    def _wait_for_ollama(self, timeout_seconds: int = 45):
        deadline = time.monotonic() + timeout_seconds

        while time.monotonic() < deadline:
            try:
                self._ollama_client.list()
                return
            except HTTPError:
                time.sleep(0.5)
            except InvalidURL:
                raise ValueError(f"Invalid Ollama host URL: {self.ollama_host}")

        raise TimeoutError(f"Ollama did not become ready at {self.ollama_host or 'default host'}")

    def __init__(self):
        self.ollama_host = os.getenv("OLLAMA_HOST")
        self._ollama_client = OllamaClient(host=self.ollama_host)

        if self.ollama_host is None:
            subprocess.Popen(
                ['ollama', 'serve'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

        self._wait_for_ollama()

        self.__load_models_and_set_default()

        if not self.selected_model_name or len(self.selected_model_name) < 1:
            raise RuntimeError("No Ollama models found. Please add a model and restart the application.")

    def _load_models(self) -> dict[str, ChatOllama]:
        models = {}

        for model in self._ollama_client.list().models:
            name = model.model
            if name:
                models[name] = ChatOllama(
                    model=name,
                    base_url=self.ollama_host,
                    reasoning=False,
                )

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

    def describe_model(self, model_name: str) -> str:
        model = self._ollama_client.show(model_name)
        lines: list[str] = [f"Model: {model_name}"]

        if model.modified_at:
            lines.append(f"Modified at: {model.modified_at.isoformat()}")

        if model.details:
            details = model.details
            detail_parts: list[str] = []
            if details.family:
                detail_parts.append(f"family: {details.family}")
            if details.parameter_size:
                detail_parts.append(f"parameters: {details.parameter_size}")
            if details.quantization_level:
                detail_parts.append(f"quantization: {details.quantization_level}")
            if detail_parts:
                lines.append("Details: " + ", ".join(detail_parts))

        if model.capabilities:
            lines.append("Capabilities: " + ", ".join(model.capabilities))

        if model.parameters:
            lines.append("Parameters:\n" + model.parameters.strip())

        if model.template:
            lines.append("Template:\n" + model.template.strip())

        if model.modelfile:
            lines.append("Modelfile:\n" + model.modelfile.strip())

        if model.license:
            lines.append("License:\n" + model.license.strip())

        if model.modelinfo:
            lines.append("Model info:\n" + json.dumps(model.modelinfo, ensure_ascii=False, indent=2, default=str))

        return "\n\n".join(lines)

    def describe_models(self) -> str:
        lines: list[str] = []

        for model in self._ollama_client.list().models:
            name = model.model
            if not name:
                continue

            description_parts: list[str] = []
            if model.details:
                if model.details.family:
                    description_parts.append(model.details.family)
                if model.details.parameter_size:
                    description_parts.append(model.details.parameter_size)
                if model.details.quantization_level:
                    description_parts.append(model.details.quantization_level)

            description = ", ".join(description_parts) if description_parts else "No description available."
            lines.append(f"{name}: {description}")

        return "\n".join(lines)


# Create a single manager instance
model_manager = ModelManager()

@wrap_model_call
async def dynamic_model_selection(request: ModelRequest, handler) -> ModelResponse:
    model_manager.refresh()
    return await handler(request.override(model=model_manager.selected_model))

@tool
def get_model_information(model_name: str) -> str:
    """English: Tool to get information about you and other available models. 
    Finnish: Työkalu, jolla voi hakea tietoja sinusta ja muista saatavilla olevista malleista.
    
    Args:        
        model_name: 
                    If equal to "current", returns information about the currently selected model.
                    Otherwise, if not empty, returns information about the specified model. 
                    If empty, returns information about all available models.
    """

    if model_name is None or model_name == "":
        return model_manager.describe_models()
    
    if model_name.lower() == "current":
        model_name = model_manager.selected_model_name  

    return model_manager.describe_model(model_name)

agent = None

async def build_agent():
    mcp_tools = await get_mcp_tools()
    local_tools = [*get_local_tools(), get_model_information]

    if not mcp_tools or len(mcp_tools) < 1:
        tools = local_tools
    else:
        # Avoid duplicate tools with same functionality
        tools = [x for x in (mcp_tools + local_tools) if x.name != "get_date_and_time"]  

    agent = create_agent(
        model=model_manager.selected_model,
        middleware=[dynamic_model_selection],
        tools=tools,
    )

    return agent

async def init_agent():
    global agent
    agent = await build_agent()

def _is_tool_related_message(message_chunk: Any) -> bool:
    message_type = getattr(message_chunk, "type", str()).lower()
    class_name = type(message_chunk).__name__.lower()

    if "tool" in message_type or "tool" in class_name:
        return True

    return False


def _extract_text_from_message_chunk(message_chunk: Any) -> str:
    if message_chunk is None:
        return str()

    if _is_tool_related_message(message_chunk):
        return str()

    content_blocks = getattr(message_chunk, "content_blocks", None)
    if content_blocks:
        text_parts: list[str] = []
        for block in content_blocks:
            if isinstance(block, dict):
                block_type = str(block.get("type", str())).lower()
                if block_type and block_type not in {"text", "message", "assistant"}:
                    continue

                text = block.get("text")
                if text:
                    text_parts.append(str(text))
        if text_parts:
            return "".join(text_parts)

    content = getattr(message_chunk, "content", None)

    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                text_parts.append(item)
                continue
            if isinstance(item, dict):
                item_type = str(item.get("type", str())).lower()
                if item_type and item_type not in {"text", "message", "assistant"}:
                    continue

                text = item.get("text")
                if text:
                    text_parts.append(str(text))
        return "".join(text_parts)

    if isinstance(message_chunk, dict):
        text = message_chunk.get("text")
        if text:
            return str(text)

    return str()


def _extract_stream_text(stream_item: Any) -> str:
    # `agent.astream(..., stream_mode="messages")` can yield:
    # - `(message_chunk, metadata)`
    # - `(namespace, "messages", (message_chunk, metadata))`
    if isinstance(stream_item, tuple) and stream_item:
        if len(stream_item) == 2:
            return _extract_text_from_message_chunk(stream_item[0])

        if len(stream_item) == 3 and stream_item[1] == "messages":
            data = stream_item[2]
            if isinstance(data, tuple) and data:
                return _extract_text_from_message_chunk(data[0])
            return _extract_text_from_message_chunk(data)

        return _extract_text_from_message_chunk(stream_item[-1])

    if isinstance(stream_item, dict):
        message = stream_item.get("messages")
        if isinstance(message, list) and message:
            return _extract_text_from_message_chunk(message[-1])
        data = stream_item.get("data")
        if data is not None:
            return _extract_stream_text(data)
        return _extract_text_from_message_chunk(stream_item)

    return _extract_text_from_message_chunk(stream_item)


async def stream_agent(prompt: str, history: Optional[list[dict[str, str]]] = None) -> AsyncIterator[str]:
    global agent
    if agent is None:
        await init_agent()

    messages = history[:] if history else []
    messages.append({"role": "user", "content": prompt})

    async for stream_item in agent.astream({"messages": messages}, stream_mode="messages"):
        chunk_text = _extract_stream_text(stream_item)
        if chunk_text:
            yield chunk_text