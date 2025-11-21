# TinyLink - Take-Home Assignment Implementation

This is a compact implementation of the TinyLink assignment.

Features implemented:
- Create short links (optional custom code, validated by regex `[A-Za-z0-9]{6,8}`)
- Redirect `/:code` with HTTP 302, increments clicks and updates last_clicked
- Delete links (mark as deleted; deleted codes return 404)
- Dashboard `/` (list, add, delete, search)
- Stats page `/code/:code`
- Health endpoint `/healthz`
- API endpoints required by autograder:
  - `POST /api/links` (409 if code exists)
  - `GET /api/links`
  - `GET /api/links/:code`
  - `DELETE /api/links/:code`

Technology:
- Node.js + Express
- EJS templates for a small frontend
- SQLite (better-sqlite3) for portability; can be replaced with Postgres in production

Important files:
- `server.js` - main Express server and API
- `db.js` - database wrapper (better-sqlite3). Swap out for Postgres if needed.
- `views/*` - EJS templates for dashboard and stats
- `public/*` - CSS and frontend assets
- `.env.example` - environment variables example

Run locally:
1. `npm install`
2. `cp .env.example .env` and edit if desired
3. `npm start`
4. Open `http://localhost:3000/`

Deployment notes:
- This project can be deployed to Render / Railway / Vercel (use a Node service).
- For Postgres (Neon), set `DATABASE_URL` to your Postgres connection string.
- If using Postgres, replace `db.js` with a small knex or Prisma setup; the SQL calls in `server.js` are straightforward to adapt.

Autograder compatibility checklist:
- `/` → Dashboard
- `/code/:code` → Stats
- `/:code` → Redirect (302) or 404 for missing/deleted
- `/healthz` → returns JSON with `ok: true`
- API endpoints and response codes follow spec.

Included in this zip:
- Full project files ready to run.
- `data/tinylink.db` will be created when starting the app.

Notes & limitations:
- Uses SQLite by default for simplicity. If your evaluator requires Postgres, adapt `db.js` or run a migration to Postgres.
- This repository is intentionally simple and small so you can explain every line during interviews.

Good luck with your submission! If you want, I can:
- Convert this to a Next.js project.
- Add Postgres (Knex/Prisma) setup and migrations.
- Create a GitHub-ready repo with commits and a demo deployment guide.
