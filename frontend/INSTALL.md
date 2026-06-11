# Frontend Pelisellin AI-puheohjaukseen

Ohjelma käyttää puheentunnistukseen (STT) Googlen Web Speech APIa, joka toimii Chrome selaimessa. 
Puhe (TTS) tulee myös Chromen kautta. Ohjelma ei siis toimi, ainakaan Firefoxissa, sellaisenaan

## Ohjelman käyttö

Ohjelma toimii 25 ja 24 alkuisilla node versiolla

1. Asenna riippuvuudet komennolla: `npm i`

2. Ohjelman voit käynnistää `start.sh` skriptillä, joka aukaisee Chromen ja laittaa frontendin pyörimään

## Backend URL

Frontend käyttää `VITE_BACKEND_URL`-ympäristömuuttujaa, jos se on asetettu. Ilman sitä kehityspalvelin proxyttää pyynnöt osoitteeseen `http://localhost:8000` (8000 on FastAPIn oletusportti)

Katso `.env.example` jos haluat katsoa mallia miltä `.env` tiedoston pitäisi näyttää

Laita `.env` tiedostoon muuttuja (jos backend ei ole localhostissa):

- `VITE_BACKEND_URL`, johon tulee backendin pelkkä http-osoite 

Ja jos Home Assistant käytössä, lisää muuttujat:
- `VITE_HA_ACCESS_TOKEN`, HA:n long-lived access token
- `VITE_HA_WS_API_URL`, johon tulee HA:n WebSocket endpoint osoite (`ws://`*`ha-osoite`*`/api/websocket`)
- `VITE_HA_URL`, HA:n http-osoite
- `VITE_ENTITY_ID`, HA:n kuuntelu switchin id
- `VITE_LANGUAGE_ENTITY_ID`, HA:n entiteetti jonka state vaihtaa frontendin kielen (`en` tai `fi`)
