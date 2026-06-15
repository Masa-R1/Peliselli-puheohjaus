# Backend Pelisellin puheohjaukseen

## Ohjelman käyttö

Ollama tarvitsee olla asennettuna koneelle

1. Luo virtuaaliympäristö: `python -m venv ./.venv`

2. Asenna riippuvuudet: `pip install -r requirements.txt`

3. Aja ohjelmaa: `fastapi run`

Tai `uv` (jos käytössä)

1. Suorita komento: `uv sync`

2. Aja ohjelmaa: `uv run fastapi run`

## Home Assistant

1. Jotta voit ohjata Home Assistanttia, HA:ssa tarvitsee olla MCP Server 
integraatio (https://www.home-assistant.io/integrations/mcp_server/)

2. Valitse paljastettavaksi kaikki ne entiteetit, joihin haluat tekoälyn 
pääsevän käsiksi. Ohjeet löytyvät aikaisemmasta linkistä

3. Lisää `.env` tiedostoon muuttujat `HA_BASE_URL`, johon tulee Home Assistantin 
osoite ja `HA_ACCESS_TOKEN`, johon tulee  HA:n Long-lived access token

Katso `.env.example` jos haluat katsoa mallia miltä `.env` tiedoston pitäisi näyttää

Jos et halua käyttää Home Assistanttia, älä lisää `.env` tiedostoa.
