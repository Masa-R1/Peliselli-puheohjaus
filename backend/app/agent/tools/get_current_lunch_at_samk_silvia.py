import httpx
import json
from datetime import datetime as dt, timezone as tz, timedelta as td
from langchain.tools import tool

TIMEOUT = 60


@tool
def get_current_lunch_at_samk_silvia(hour_offset: int) -> str:
    """English: Tool to get the current or a future day in the same week's lunch menu at SAMK Silvia restaurant. 
    Finnish: Työkalu, jolla voi hakea tietyn päivän lounasmenun nykyisen viikon nykyhetkeltä tai sen tulevaisuudesta SAMKin Silvian ravintolasta.
    
    Args:
        hour_offset (int): The number of hours to offset from the current time in UTC. Should be positive and fall within the same week. For example, 0 for current lunch, 24 for the next day's lunch, etc.
    """
    url = "https://www.compass-group.fi/menuapi/feed/json?costNumber=0351&language=fi"
    try:
        response = httpx.get(url, timeout=httpx.Timeout(TIMEOUT))
        response.raise_for_status()
        payload = response.json()
        selected_date = (dt.now(tz.utc).date() + td(hours=hour_offset)).isoformat()

        for menu_day in payload.get("MenusForDays", []):
            menu_date = str(menu_day.get("Date", ""))[:10]
            if menu_date == selected_date:
                return json.dumps(menu_day, ensure_ascii=False)

        return json.dumps({"ErrorText": f"No lunch menu found for {selected_date}"}, ensure_ascii=False)
    except Exception as exc:
        return json.dumps({"ErrorText": f"Failed to fetch lunch menu: {exc}"}, ensure_ascii=False)
