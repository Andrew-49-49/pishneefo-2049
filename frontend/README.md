# Frontend

React 19, TypeScript, Vite, Tailwind CSS, and lucide-react. Requires Node >=20.

```sh
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

Development runs on http://localhost:3000. Copy `.env.example` to `.env` to override `VITE_API_PROXY_TARGET` (default http://127.0.0.1:4000). Existing relative `/api` requests and cookie credentials are preserved; the Vite proxy works in development and preview. Production static hosting must proxy `/api` to the backend on the same HTTPS origin. Backend does not serve frontend files.

Browser tests: install dependencies in both applications, run `npx playwright install chromium`, then `npm run test:e2e`. The runner uses a fresh temporary backend database per suite and free ports. For a custom Chromium installation set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. Individual commands `npm run test:admin` and `npm run test:backend-ui` target an already running frontend (FRONTEND_URL overrides the default); use a disposable database for those mutation tests.

Screenshots are written to tests/shots/. The original browser suites are diagnostic checks; their printed results should be reviewed alongside their exit status.

Proxy regression without a browser: run `npm run test:proxy` in frontend/ (requires both apps installed, Bash, and curl).
