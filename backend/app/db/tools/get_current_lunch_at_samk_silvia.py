import httpx
import json
from datetime import datetime, timezone
from langchain.tools import tool

TIMEOUT = 60


@tool
def get_current_lunch_at_samk_silvia() -> str:
    """English: Tool to get the current day's lunch menu at SAMK Silvia restaurant. 
    Finnish: Työkalu, jolla voi hakea tämän päivän lounasmenun SAMKin Silvian ravintolasta."""
    url = "https://www.compass-group.fi/menuapi/feed/json?costNumber=0351&language=fi"
    try:
        response = httpx.get(url, timeout=httpx.Timeout(TIMEOUT))
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
