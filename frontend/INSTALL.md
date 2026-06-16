# Frontend Pelisellin AI-puheohjaukseen

Ohjelma käyttää puheentunnistukseen (STT) Googlen Web Speech APIa, joka toimii Chrome selaimessa. 
Puhe (TTS) tulee myös Chromen kautta. Ohjelma ei siis toimi, ainakaan Firefoxissa, sellaisenaan

## Ohjelman käyttö

Ohjelma toimii 25 ja 24 alkuisilla node versiolla

1. Asenna riippuvuudet komennolla: `npm i`

2. Ohjelman voit käynnistää `start.sh` skriptillä, joka aukaisee Chromen ja laittaa frontendin pyörimään

## ENV

Frontend käyttää `VITE_BACKEND_URL`-ympäristömuuttujaa, jos se on asetettu. Ilman sitä kehityspalvelin proxyttää pyynnöt osoitteeseen `http://localhost:8000` (8000 on FastAPIn oletusportti)

Katso `.env.example` niin näet miltä `.env` tiedoston kuuluu näyttää 

Jos et halua käyttää Home Assistanttia, älä lisää `.env` tiedostoon Home Assistanttiin liittyviä muuttujia