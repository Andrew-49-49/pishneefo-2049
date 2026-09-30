# Pishneefo 2049

Two independent applications. Requires Node.js >=20 (use a current Node LTS) and npm. UI, `/api` endpoint names, payloads, and authentication are preserved.

## Local development

In terminal 1:

```sh
cd backend
npm ci
npm run dev
```

In terminal 2:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. The API health check is http://localhost:4000/api/health. Frontend requests remain relative `/api/...`; Vite proxies them to the API and forwards session cookies. First admin setup remains in the existing admin screen.

Frontend: `npm run build`, `npm run lint`, `npm run preview`. Backend: `npm start` for production. Each application has its own manifest and lockfile; neither uses a workspace or a root dependency install.

## Configuration

See each application's `.env.example`. Vite automatically loads `frontend/.env`. Backend variables must be supplied in the process environment; on Node versions supporting it, `node --env-file=.env server/index.js` loads `backend/.env`. Merely copying the backend example does not load it.

SQLite belongs exclusively to `backend/data/`. Relative DATA_DIR and DB_PATH values resolve from the backend directory, independent of the current working directory. No database was present in the supplied archive; the existing seed logic initializes it on first start.

## Production

Build and deploy `frontend/dist/` to a static web server. Route `/api` on the same public HTTPS origin to the backend and serve frontend routes with an index.html fallback. The backend is API-only and never serves frontend files. Keep HTTPS and forwarded protocol headers configured so the existing production Secure cookies work. Set TRUST_PROXY to the correct number of trusted proxy hops. No cross-origin cookie or CORS change is needed for this same-origin arrangement.

## Tests

```sh
cd backend
npm test
cd ../frontend
npx playwright install chromium
npm run test:e2e
```

The API test uses Bash and curl (on Windows use Git Bash/WSL). The Node test runners start isolated servers on free ports with temporary SQLite databases; they never delete `backend/data/` or kill unrelated processes. Browser suites live in frontend/tests, including the suite named backend-test.mjs because it tests backend features through the UI. Browser integration tests require dependencies installed in both apps; ordinary frontend build/start does not depend on the backend package.

Historical ADMIN.md and LEGACY_BACKEND.md are retained for feature reference. Their old combined-project launch/deployment instructions are superseded by these READMEs.

Proxy regression without a browser: run `npm run test:proxy` in frontend/ (requires both apps installed, Bash, and curl).
