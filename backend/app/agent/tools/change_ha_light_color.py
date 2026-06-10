from langchain.tools import tool


@tool
def change_ha_light_color(color: str) -> str:
    """English: Tool to change the light color in Home Assistant. Input color can be in whatever language but has to be returned in English. 
    Finnish: Työkalu, jolla voi vaihtaa valon väriä Home Assistantissa. Palauta aina väri Englanniksi riippumatta syötekielestä.
    Args:
        color: The name of the color to change to. Should be returned in English, but can be in any language in the input."""
    print(color)
    return f"Changed light color to {color}."
