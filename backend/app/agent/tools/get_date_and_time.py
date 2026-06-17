import time
from langchain.tools import tool


@tool
def get_date_and_time() -> str:
    """English: Tool to get the current day of week, date and time. 
    Finnish: Työkalu, jolla voidaan hakea tämänhetkinen viikonpäivä, päivämäärä ja kellonaika."""
    return time.strftime("%A, %Y-%m-%d %H:%M:%S")
