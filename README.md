# SportSchool (PWA)

Ejecutar en local (localhost cuenta como contexto seguro):

    python3 -m http.server 8080
    # abrir http://localhost:8080

Publicar: sube la carpeta a GitHub Pages, Netlify o Vercel (HTTPS).

## Estructura
- index.html · css/styles.css · js/db.js (IndexedDB) · js/app.js (UI, Fetch, notificación, Geolocation)
- sw.js (Service Worker + Cache API) · manifest.webmanifest · icons/ · data/disciplinas.json
