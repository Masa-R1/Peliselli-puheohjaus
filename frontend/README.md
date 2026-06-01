# Frontend Pelisellin AI-puheohjaukseen

Ohjelma käyttää puheentunnistukseen (STT) Googlen Web Speech APIa, joka toimii Chrome selaimessa. 
Puhe (TTS) tulee myös Chromen kautta. Ohjelma ei siis toimi, ainakaan Firefoxissa, sellaisenaan

## Ohjelman käyttö

Ohjelma toimii 25 ja 24 alkuisilla node versiolla

1. Asenna riippuvuudet komennolla: `npm i`

2. Aja ohjelmaa komennolla: `npm run dev`

## Backend URL

Frontend käyttää `VITE_BACKEND_URL`-ympäristömuuttujaa, jos se on asetettu. Ilman sitä kehityspalvelin proxyttää pyynnöt osoitteeseen `http://localhost:8000`

- Osoite asetetaan komennolla: `Set-Variable -Name VITE_BACKEND_URL -Value http://backend.osoite:XXXX` (FastAPI portti on 8000)