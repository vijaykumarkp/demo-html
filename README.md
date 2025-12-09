# API Demo Proxy + Static Frontend

This repository contains:
- `server.js` — a tiny Node/Express app that:
  - Serves the static frontend at `/`
  - Exposes `/forward` which accepts `multipart/form-data` with fields:
      - `input_file` (file), `insurance_company` (text), `data_type` (text)
    and forwards the request to the configured backend ML API.
- `public/index.html` — simple Bootstrap frontend that posts to `/forward`.

## Why use this proxy?
Your API blocks CORS from browser origins. This proxy receives the browser request and performs a server-to-server POST to your API, avoiding CORS issues.

## Environment variables (set these on Render -> Environment)
- `TARGET_API_URL` (optional) — default: https://PIVOT-Port-PolDoc-Health.Attributum.com/api/ml_process
- `API_KEY` (optional) — when set, the server will forward an Authorization header as `Bearer <API_KEY>`.
  - If you need a different header name or value format, set:
    - `FORWARD_AUTH_HEADER` (e.g. `X-API-Key`) and/or
    - `FORWARD_AUTH_VALUE` (full header value, e.g. `ApiKey 12345`).
- `PORT` — Render provides this automatically.

### Security note
- For demos it's convenient to allow `Access-Control-Allow-Origin: *` — **in production**, restrict this to your frontend domain.
- Keep `API_KEY` secret — set it in Render environment and do not commit it to the repo.

## Deploy to Render (quick)
1. Create a new GitHub repo and push the files from this ZIP.
2. In Render.com -> New -> Web Service -> Connect repo -> Branch `main`.
3. For `Start Command`, use: `npm start`
4. In the Environment tab for the service, add:
   - `API_KEY` = (your API key)  [optional]
   - `TARGET_API_URL` = (if you want to override)
5. Deploy. After successful deploy, open the service URL — the frontend will be served, and the form will POST to `/forward`.

## Local testing
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` and try uploading a file.

