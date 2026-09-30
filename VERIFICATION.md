# Verification

- Frontend: `npm run build` passed (TypeScript and Vite production build).
- Backend: 56 existing API checks passed against an isolated SQLite database.
- Vite proxy: the same 56 API checks passed through `/api`, including session-cookie login/logout, password changes, CRUD, validation, and import/export.
- Production: backend starts without a frontend build; `/`, `/admin`, and `/assets/test.js` return 404. Health endpoint succeeds. Production cookies retain HttpOnly, Secure, and SameSite=Strict.
- All files under the original src/ and backend routes.js, auth.js, and seed-data.js are byte-for-byte preserved.
- Separate manifests and lockfiles contain the respective application dependencies. No root install or shared runtime package is required.
- Browser suites were relocated and made portable (configurable browser executable, automatic screenshot directories, isolated runner). They were not executed in this environment because the Chromium download returned an invalid archive. Run `npx playwright install chromium` and `npm run test:e2e` in frontend/ on a machine with browser-download access. The legacy browser scripts primarily print diagnostic results; inspect those results as well as the exit code.

Checked with Node 24.19.0. The package engines retain Node >=20; use a current supported Node LTS for installation of native better-sqlite3 dependencies.
