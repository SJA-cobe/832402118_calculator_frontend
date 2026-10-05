# ClearCalc Frontend

Vanilla HTML, CSS, and JavaScript with no build step or npm dependency. The English interface includes expression input, scientific keys, angle modes, results, error messages, history search and pagination, deletion, memory controls, CSV export, keyboard shortcuts, and theme switching.

## Requirements and startup

Use Python 3.10+ for the local static server and a modern browser. Start the backend on port 8000 first.

```bash
python -m http.server 5500 --bind 127.0.0.1 --directory src
```

Open http://localhost:5500. Access the page over HTTP rather than opening the HTML file directly.

## Backend connection

`src/config.js` connects local pages on port 5500 to `http://127.0.0.1:8000`. Other deployments use same-origin `/api`, matching the supplied Nginx proxy. For separate hosts, set `window.CALCULATOR_API` to the backend HTTPS URL and add the frontend origin to the backend's `ALLOWED_ORIGINS`. An HTTPS page cannot call an HTTP API.

The frontend sends expressions and displays backend results. History and memory are read from the backend database. If the backend is unavailable, users can edit input but cannot obtain a new result.

Enter calculates; Esc clears. Click a history expression to edit it and restore its angle mode. Theme selection applies to the current page only. Timestamps use English formatting in the browser's local timezone. CSV timestamps remain in UTC.

## Deployment

The Dockerfile and nginx.conf work with the combined project's compose.yaml. Nginx expects the backend hostname `backend`. The frontend and backend can be submitted as separate GitHub repositories; keep README.md and codestyle.md in each.

For scientific functions, memory controls, upgrades, and CSV export instructions, see `docs/enhanced-user-guide.md` in the combined project.
