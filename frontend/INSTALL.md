# Frontend Pelisellin AI-puheohjaukseen

Ohjelma käyttää puheentunnistukseen (STT) Googlen Web Speech APIa, joka toimii Chrome selaimessa. 
Puhe (TTS) tulee myös Chromen kautta. Ohjelma ei siis toimi, ainakaan Firefoxissa, sellaisenaan

## Ohjelman käyttö

Ohjelma toimii 25 ja 24 alkuisilla node versiolla

1. Asenna riippuvuudet komennolla: `npm i`

2. Ohjelman voit käynnistää `start.sh` skriptillä, joka aukaisee Chromen ja laittaa frontendin pyörimään

## Backend URL

Frontend käyttää `VITE_BACKEND_URL`-ympäristömuuttujaa, jos se on asetettu. Ilman sitä kehityspalvelin proxyttää pyynnöt osoitteeseen `http://localhost:8000` (8000 on FastAPIn oletusportti)

- Osoite asetetaan komennolla:
    - Linux: `VITE_BACKEND_URL=http://backend.osoite:8000`
    - Windows: `Set-Variable -Name VITE_BACKEND_URL -Value http://backend.osoite:8000`