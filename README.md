# SportSchool (PWA)

Ejecutar en local (localhost cuenta como contexto seguro):

    python3 -m http.server 8080
    # abrir http://localhost:8080

Publicar: sube la carpeta a GitHub Pages, Netlify o Vercel (HTTPS).

## Estructura
- index.html · css/styles.css · js/db.js (IndexedDB) · js/app.js (UI, Fetch, notificación, Geolocation)
- sw.js (Service Worker + Cache API) · manifest.webmanifest · icons/ · data/disciplinas.json

## Checklist de pruebas y evidencias para el PDF
1. Splash y Home (captura).
2. Registrar 1 estudiante y 2 actividades; captura de Historial y Desempeño.
3. Recargar (F5): los datos siguen ahí. DevTools > Application > IndexedDB > sportschool (captura).
4. Fetch: DevTools > Network, filtrar "Fetch/XHR": `disciplinas.json` (GET) y, con "Enviar al servidor de prueba", el POST a API_URL (captura).
5. DevTools > Application > Service Workers (estado "activated") y Cache Storage > sportschool-v1 (capturas) y Manifest (captura).
6. Offline: Application > Service Workers > marcar "Offline" (o Network > Offline), recargar y mostrar que la app y los datos cargan.
7. Notificación: al guardar una actividad, aceptar el permiso y captura de la notificación.
8. Geolocation: botón "Agregar ubicación" y captura del mensaje.
9. Lighthouse (DevTools > Lighthouse > Progressive Web App / Best practices) y captura.
10. Si el POST no funciona (sin endpoint real), documenta que no hubo sincronización real.
