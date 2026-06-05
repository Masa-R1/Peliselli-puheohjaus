# Frontend Pelisellin AI-puheohjaukseen

Ohjelma käyttää puheentunnistukseen (STT) Googlen Web Speech APIa, joka toimii Chrome selaimessa. 
Puhe (TTS) tulee myös Chromen kautta. Ohjelma ei siis toimi, ainakaan Firefoxissa, sellaisenaan

## Ohjelman käyttö

Ohjelma toimii 25 ja 24 alkuisilla node versiolla

1. Asenna riippuvuudet komennolla: `npm i`

2. Ohjelman voit käynnistää `start.sh` skriptillä, joka aukaisee Chromen ja laittaa frontendin pyörimään

## Backend URL

Frontend käyttää `VITE_BACKEND_URL`-ympäristömuuttujaa, jos se on asetettu. Ilman sitä kehityspalvelin proxyttää pyynnöt osoitteeseen `http://localhost:8000` (8000 on FastAPIn oletusportti)

Laita `.env` tiedostoon muuttuja:
- `VITE_BACKEND_URL`, johon tulee backendin pelkkä http-osoite 

Ja jos Home Assistant käytössä:
- `VITE_HA_ACCESS_TOKEN`, johon tulee HA:n WebSocket endpoint (/api/websocket) osoite
- `VITE_HA_WS_API_URL`, HA:n long-lived access token
- `VITE_HA_URL`, HA:n http osoite
- `VITE_ENTITY_ID`, kuuntelu switchin id