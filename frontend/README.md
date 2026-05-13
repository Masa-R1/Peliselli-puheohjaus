# Frontend Pelisellin AI-puheohjaukseen

## Ohjelman käyttö

Asenna riippuvuudet komennolla: `npm i`

Aja ohjelmaa komennolla: `npm run dev`

## Backend-osoite

Frontend käyttää `VITE_BACKEND_URL`-ympäristömuuttujaa, jos se on asetettu. Ilman sitä kehityspalvelin proxyttää pyynnöt osoitteeseen `http://localhost:8000`.