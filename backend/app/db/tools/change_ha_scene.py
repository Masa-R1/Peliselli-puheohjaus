from langchain.tools import tool


@tool
def change_ha_scene(scene: str) -> str:
    """English: Tool to change the scene in Home Assistant. 
    Finnish: Työkalu, jolla voi vaihtaa sceneä Home Assistantissa.
    
    Args:
        scene: The name of the scene to change to. Should be returned in English, but can be in any language in the input."""
    print(scene)
    return f"Changed scene to {scene}."
