# Backend Pelisellin puheohjaukseen

## Ohjelman käyttö

Ollama tarvitsee olla asennettuna koneelle

1. Luo virtuaaliympäristö: `python -m venv ./.venv`

2. Aktivoi virtuaaliympäristö `. ./.venv/Scripts/Activate.ps1` tai `source ./.venv/bin/activate`

3. Asenna riippuvuudet: `pip install -r requirements.txt`

4. Aja ohjelmaa: `fastapi run`

Tai `uv` (jos käytössä)

1. Suorita komento: `uv sync`

2. Aja ohjelmaa: `uv run fastapi run`

Voit myös käynnistää ohjelman juuresta löytyvällä `launcher.py` skriptillä, mutta sinun täytyy olla backendin aktivoidussa virtuaaliympäristössä

## Home Assistant

1. Jotta voit ohjata Home Assistanttia, HA:ssa tarvitsee olla MCP Server 
integraatio (https://www.home-assistant.io/integrations/mcp_server/)

2. Valitse paljastettavaksi kaikki ne entiteetit, joihin haluat tekoälyn 
pääsevän käsiksi. Ohjeet löytyvät aikaisemmasta linkistä

3. Lisää `.env` tiedostoon muuttujat `.env.example` tiedoston mukaisesti

Jos et halua käyttää Home Assistanttia, älä lisää `.env` tiedostoon Home Assistanttiin liittyviä muuttujia