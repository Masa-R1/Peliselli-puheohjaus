import random
import httpx
from langchain.tools import tool

TIMEOUT = 60


@tool
def get_chuck_norris_joke(category: str = str(), query: str = str()) -> str:
    """English: Tool to get a Chuck Norris joke.
    Finnish: Työkalu Chuck Norris -vitsin hakemiseen.

    Returns the joke text from the `value` field in the API response.

        Args:
            category: The category of the random Chuck Norris joke to retrieve. If empty, utilizes the `query` parameter to search for jokes. If both are empty, returns a random joke.
            query: The query by which to get a Chuck Norris joke. If a category is given, it takes priority over the query. If both are empty, returns a random joke.

    """
    MISSING_FIELD = "Chuck Norris doesn’t check for missing JSON fields. The JSON adds them out of fear."

    url = "https://api.chucknorris.io/jokes/random"
    try:
        params = dict()

        if category and len(category.strip()) > 0:
            params["category"] = category
        elif query and len(query.strip()) > 0:
            url = "https://api.chucknorris.io/jokes/search"
            params["query"] = query

        response = httpx.get(url, timeout=httpx.Timeout(TIMEOUT), params=params)
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
            
            return get_chuck_norris_joke()

        return MISSING_FIELD
    except Exception as exc:
        return f"Chuck Norris once sent a GET request for a Chuck Norris joke. The endpoint returned {exc}—because the server couldn’t handle the pressure of retrieving Chuck Norris."
