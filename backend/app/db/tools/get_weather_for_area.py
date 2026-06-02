import httpx
import json
from langchain.tools import tool

TIMEOUT = 60

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
            timeout=httpx.Timeout(TIMEOUT),
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
            timeout=httpx.Timeout(TIMEOUT),
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
