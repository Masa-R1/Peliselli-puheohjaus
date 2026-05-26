import random

import httpx
from langchain_ollama import ChatOllama
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_model_call, ModelRequest, ModelResponse
from typing import Any, AsyncIterator, Optional
from datetime import datetime, timezone
import subprocess
import time
import json
from urllib.error import URLError
from urllib.request import urlopen
from langchain.tools import tool

AGENT_TIMEOUT = 60


def _open_meteo_weather_code_description(weather_code: int) -> str:
    descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail",
    }
    return descriptions.get(weather_code, "Unknown weather condition")

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
                models[name] = ChatOllama(
                    model=name,  
                    client_kwargs={
                        "timeout": httpx.Timeout(AGENT_TIMEOUT)
                    }
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


# Create a single manager instance
model_manager = ModelManager()

@wrap_model_call
async def dynamic_model_selection(request: ModelRequest, handler) -> ModelResponse:
    model_manager.refresh()
    return await handler(request.override(model=model_manager.selected_model))

# Toolit
@tool
def change_ha_light_color(color: str) -> str:
    """English: Tool to change the light color in Home Assistant. Input color can be in whatever language but has to be returned in English. 
    Finnish: Työkalu, jolla voi vaihtaa valon väriä Home Assistantissa. Palauta aina väri Englanniksi riippumatta syötekielestä.
    Args:
        color: The name of the color to change to. Should be returned in English, but can be in any language in the input."""
    print(color)
    return f"Changed light color to {color}."

@tool
def change_ha_scene(scene: str) -> str:
    """English: Tool to change the scene in Home Assistant. 
    Finnish: Työkalu, jolla voi vaihtaa sceneä Home Assistantissa.
    
    Args:
        scene: The name of the scene to change to. Should be returned in English, but can be in any language in the input."""
    print(scene)
    return f"Changed scene to {scene}."

@tool
def get_current_lunch_at_samk_silvia() -> str:
    """English: Tool to get the current day's lunch menu at SAMK Silvia restaurant. 
    Finnish: Työkalu, jolla voi hakea tämän päivän lounasmenun SAMKin Silvian ravintolasta."""
    url = "https://www.compass-group.fi/menuapi/feed/json?costNumber=0351&language=fi"
    try:
        response = httpx.get(url, timeout=httpx.Timeout(AGENT_TIMEOUT))
        response.raise_for_status()
        payload = response.json()
        current_day = datetime.now(timezone.utc).date().isoformat()

        for menu_day in payload.get("MenusForDays", []):
            menu_date = str(menu_day.get("Date", ""))[:10]
            if menu_date == current_day:
                return json.dumps(menu_day, ensure_ascii=False)

        return json.dumps({"ErrorText": f"No lunch menu found for {current_day}"}, ensure_ascii=False)
    except Exception as exc:
        return json.dumps({"ErrorText": f"Failed to fetch lunch menu: {exc}"}, ensure_ascii=False)

@tool
def get_chuck_norris_joke(category: str = str(), query: str = str()) -> str:
    """English: Tool to get a Chuck Norris joke.
    Finnish: Työkalu Chuck Norris -vitsin hakemiseen.

    Returns the joke text from the `value` field in the API response.

        Args:
            category: The category of the random Chuck Norris joke to retrieve.
            query: The query by which to get a Chuck Norris joke. If empty, returns a random joke. If a category is given, it takes priority over the query.

    """
    MISSING_FIELD = "Chuck Norris doesn’t check for missing JSON fields. The JSON adds them out of fear."

    url = "https://api.chucknorris.io/jokes/random"
    try:
        params = dict()

        if category and category != "":
            params.append(("category", category))
        elif query and query != "":
            url = "https://api.chucknorris.io/jokes/search"
            params.append(("query", query))

        response = httpx.get(url, timeout=httpx.Timeout(AGENT_TIMEOUT), params=params)
        response.raise_for_status()
        payload = response.json()

        joke = payload.get("value")
        if joke:
            return str(joke)
        else:
            jokes = payload.get("result", [])
            if jokes and isinstance(jokes, list) and len(jokes) > 0: 
                joke = jokes[random.randint(0, len(jokes) - 1)].get("value", MISSING_FIELD)
                return str(joke)
            else:
                return get_chuck_norris_joke()

        return MISSING_FIELD
    except Exception as exc:
        return f"Chuck Norris once sent a GET request for a Chuck Norris joke. The endpoint returned {exc}—because the server couldn’t handle the pressure of retrieving Chuck Norris."

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

@tool
def get_date_and_time() -> str:
    """English: Tool to get the current day of week, date and time. 
    Finnish: Työkalu, jolla voi hakea tämänhetkinen viikonpäivä, päivämäärä ja kellonaika."""
    return time.strftime("%A, %Y-%m-%d %H:%M:%S")       


@tool
def get_weather_for_area(area: str, forecast_days: int = 0) -> str:
    """English: Tool to get current weather for an area using Open-Meteo.
    Finnish: Työkalu, jolla voi hakea alueen säätilan Open-Meteon avulla.

    Args:
        area: City, town, region, or other searchable area name.
        forecast_days: Number of daily forecast days to include, from 0 to 7.
    """
    try:
        forecast_days = max(0, min(int(forecast_days), 7))

        geocoding_response = httpx.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": area, "count": 1, "language": "en", "format": "json"},
            timeout=httpx.Timeout(AGENT_TIMEOUT),
        )
        geocoding_response.raise_for_status()
        geocoding_payload = geocoding_response.json()

        results = geocoding_payload.get("results", [])
        if not results:
            return json.dumps({"ErrorText": f"No location found for {area}"}, ensure_ascii=False)

        location = results[0]
        latitude = location.get("latitude")
        longitude = location.get("longitude")

        weather_response = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
                "timezone": "auto",
                **(
                    {
                        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
                        "forecast_days": forecast_days,
                    }
                    if forecast_days > 0
                    else {}
                ),
            },
            timeout=httpx.Timeout(AGENT_TIMEOUT),
        )
        weather_response.raise_for_status()
        weather_payload = weather_response.json()

        current = weather_payload.get("current", {})
        weather_code = int(current.get("weather_code", -1))

        return json.dumps(
            {
                "location": {
                    "name": location.get("name"),
                    "admin1": location.get("admin1"),
                    "country": location.get("country"),
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "current": {
                    "time": current.get("time"),
                    "temperature_2m": current.get("temperature_2m"),
                    "apparent_temperature": current.get("apparent_temperature"),
                    "relative_humidity_2m": current.get("relative_humidity_2m"),
                    "weather_code": weather_code,
                    "weather_description": _open_meteo_weather_code_description(weather_code),
                    "wind_speed_10m": current.get("wind_speed_10m"),
                    "wind_direction_10m": current.get("wind_direction_10m"),
                },
                "forecast": [
                    {
                        "date": date,
                        "weather_code": weather_code,
                        "weather_description": _open_meteo_weather_code_description(weather_code),
                        "temperature_2m_max": temperature_max,
                        "temperature_2m_min": temperature_min,
                        "precipitation_sum": precipitation_sum,
                        "wind_speed_10m_max": wind_speed_max,
                    }
                    for date, weather_code, temperature_max, temperature_min, precipitation_sum, wind_speed_max in zip(
                        weather_payload.get("daily", {}).get("time", []),
                        weather_payload.get("daily", {}).get("weather_code", []),
                        weather_payload.get("daily", {}).get("temperature_2m_max", []),
                        weather_payload.get("daily", {}).get("temperature_2m_min", []),
                        weather_payload.get("daily", {}).get("precipitation_sum", []),
                        weather_payload.get("daily", {}).get("wind_speed_10m_max", []),
                    )
                ]
                if forecast_days > 0
                else [],
            },
            ensure_ascii=False,
        )
    except Exception as exc:
        return json.dumps({"ErrorText": f"Failed to fetch weather for {area}: {exc}"}, ensure_ascii=False)

agent = create_agent(
    model=model_manager.selected_model,
    middleware=[dynamic_model_selection],
    tools=[change_ha_light_color, change_ha_scene, get_current_lunch_at_samk_silvia, get_chuck_norris_joke, get_model_information, get_date_and_time, get_weather_for_area],
)

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
    messages = history[:] if history else []
    messages.append({"role": "user", "content": prompt})

    async for stream_item in agent.astream({"messages": messages}, stream_mode="messages"):
        chunk_text = _extract_stream_text(stream_item)
        if chunk_text:
            yield chunk_text