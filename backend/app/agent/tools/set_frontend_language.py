from langchain.tools import tool

from ...crud.frontend_language_crud import set_frontend_language as set_frontend_language_state


@tool
def set_frontend_language(language: str) -> str:
    """English: Tool to change frontend language.
    Finnish: Työkalu, jolla voi vaihtaa käyttöliittymän kielen.

    Args:
        language: Language code to switch frontend to. Use supported codes like en or fi.
    """

    normalized_language = set_frontend_language_state(language)
    return f"Frontend language set to {normalized_language}."