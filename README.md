# Pelisellin puheohjaus

Projektissa hyödynnetään paikallista tekoälymallia ääniavustajan toteuttamiseen. Avustajan päätehtävänä olisi hallita mm. 
Home Assistant järjestelmän valoja. 

## Backend

Backend on tarkoitus toteuttaa käyttäen Ollamaa, LangChainia ja FastAPIa. Löydät tarkemmat ohjeet backend kansion `INSTALLATION.md` tiedostosta.

## Frontend

Frontend on tarkoitus toteuttaa Reactilla, jossa olisi tarkoitus käyttää jotakin puheentunnistus palvelua. Löydät tarkemmat ohjeet frontend kansion `INSTALLATION.md` tiedostosta.

## Home Assistant

Home Assistanttia on tarkoitus ohjata <a href="https://www.home-assistant.io/integrations/mcp_server/">MCP Server integraation</a> avulla. Home Assistanttiin piti lisätä painikkeet kuuntelun tilan vaihtamiseksi, avustajan resetoimiseksi ja kielen valitsemiseksi. Näiden entiteettien id:t ovat merkattuna frontendin `.env` tiedostossa.

Nappien tilanmuutoksia kuunnellaan WebSocket yhteydellä.