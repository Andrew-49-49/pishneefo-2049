# Backend

API-only Express application with better-sqlite3 and cookie-parser, ES modules, Node >=20.

```sh
npm ci
npm run dev
# production (works in Windows shells too)
npm start
```

Health: http://localhost:4000/api/health. No frontend installation or build is required. npm start sets NODE_ENV=production through a small Node launcher, equivalent to `NODE_ENV=production node server/index.js` without POSIX-only syntax.

Environment variables: PORT=4000, DATA_DIR=./data, DB_PATH=./data/pishneefo.db, NODE_ENV, TRUST_PROXY=1. Relative database paths resolve against backend/. Absolute paths remain supported. Parent directories are created as needed. `.env.example` documents defaults; use shell environment variables or `node --env-file=.env server/index.js` where supported to load a copied `.env`. For production set NODE_ENV=production, use HTTPS, and configure the correct trusted proxy hop count.

Database, sessions, password hashes, and WAL files remain backend-only. Existing httpOnly cookies, SameSite policy, production Secure flag, session checks, password hashing, and login rate limiting are unchanged. Back up the SQLite database consistently before deployment/migration.

All existing routes and payloads are retained: /api/health, /api/storefront, /api/orders, /api/auth/*, /api/db, /api/products, /api/journal, /api/faq, /api/about, /api/settings, /api/export, /api/import, /api/data/*.

`npm test` runs the original API regression suite against an isolated temporary database and checks API-only production behavior. Requires Bash and curl (Windows: Git Bash/WSL). `API_URL=http://127.0.0.1:4000/api bash tests/api-test.sh` tests a running server directly and MUTATES its database; use only disposable test data. Browser tests are in ../frontend/tests/.
