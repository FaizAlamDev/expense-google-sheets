# Expense Sheets

A full-stack daily expense tracker with a web app, a mobile app (Expo/React Native), and a Node/Express API. The backend persists every expense to a local **SQLite** database (the single source of truth), mirrors new writes to **Google Sheets** as a best-effort sync, and protects the data with automated **AWS S3** snapshots.

## What it does

- Log up to **10 expenses per day**, each with a name and amount.
- Track which days still have free slots (`GET /api/getAvailableSlots`) and enforce the limit server-side.
- Write expenses transactionally to SQLite, then fan out to Google Sheets in the background so users never wait on a third-party API.
- Browse the full expense history: paged day list, search by date, and per-expense **edit**, **delete**, and **add** — all backed by SQLite.
- Back up the database automatically every 12 hours to S3 (plus one snapshot 10s after server start).

## Architecture

```
┌────────────────┐   ┌────────────────┐
│  Web client     │   │  Mobile app    │
│  (React + Vite) │   │  (Expo / RN)   │
└───────┬─────────┘   └───────┬────────┘
        │        HTTP         │
        ▼                     ▼
┌─────────────────────────────────────────┐
│  Express API  (server/ )                │
│  - Google OAuth 2.0 session             │
│  - Expense CRUD: log, history, edit,    │
│    delete (SQLite-first)                │
│  - Async Google Sheets sync (new writes)│
│  - S3 backup scheduler + endpoints      │
└──────┬──────────────┬──────────┬────────┘
       │              │          │
       ▼              ▼          ▼
   SQLite        Google        AWS S3
  (source of      Sheets      (12h snapshots,
   truth)         (mirror)     backups/…)
```

### SQLite is the source of truth

The write flow for a new expense in `server/controllers/expenses.js`:

1. Validate the payload (max 10 expenses per day).
2. Compute available slots from **SQLite**, not Google Sheets.
3. Insert into SQLite inside a transaction (`server/utils/db.js`).
4. Reply `{ success: true, expenses: [...] }` to the client immediately, including the created records (so the UI can show the real id).
5. Fire `syncToGoogleSheets()` as an async side effect. If the Sheets sync fails, it is logged and the user's write is unaffected; if SQLite fails, the write is rejected.

Every write/update/delete that succeeds against SQLite is logged via `server/utils/logger.js` (e.g. `Inserted 1 expenses into SQLite for date: …`, `Updated expense 515 in SQLite (…)`, `Deleted expense 515 from SQLite`).

Google Sheets is a **mirror**: `Sheet1` stores the date in column A, each expense in columns B–K formatted as `"name: amount"`, and a regex-based formula in column L computes the daily total. Sheets integration lives in `server/utils/sheetsSync.js`. New writes append to the date's row; **edits and deletes rewrite the whole row** (columns B–K, preserving the date and the L formula) so the mirror follows SQLite. All Sheets jobs for a date are **serialized per-date** in an in-process queue (fails never block the user or later jobs, but see Known caveats).

### Expense history & management

Both clients ship a History view that reads and manages past expenses straight from SQLite. The web and mobile API layers call it directly (no mock layer).

- `GET /api/expenses/dates?limit=&offset=` — distinct dates, newest first. Returns `{ dates: [{date, count, total}], total }` — each entry is a day row with its expense count and sum, so the UI can render the list without N+1 fetches.
- `GET /api/expenses?date=YYYY-MM-DD` — one day's expenses. Returns `{ date, expenses[], total }`.
- `PUT /api/expenses/:id` — body `{ name, amount }`; validates id/name/amount and returns the updated record (404 if the id doesn't exist).
- `DELETE /api/expenses/:id` — removes the row; returns `{ success: true }` (404 if it was already gone).

The History UI (`client/src/components/HistoryPage.tsx` / the matching mobile screen) shows a **paged list of date rows** (10 per page, newest first) with pagination above the list and a date search; clicking a row opens an animated **modal** with that day's full card and inline add/edit/delete (`DateGroupCard`). Each mutation re-fetches so the list stays consistent. The 10-slot-per-day invariant is still enforced server-side on `POST /api/expenses`. Edits and deletes also trigger a **best-effort background rewrite** of the affected date's row in Google Sheets (`syncDateGroupToGoogleSheets`), serialized per date.

### Authentication

A single shared Google OAuth 2.0 session authenticates the server, not individual users:

- `GET /auth?platform=web` redirects through Google and back to `FRONTEND_URL`.
- `GET /auth?platform=mobile` redirects back into the mobile app via the `expenseSheetsApp://` deep link (scheme must match `mobile/app.config.js`).
- Tokens are persisted to `tokens.json` (on Fly.io this lives on the persistent volume in `/data`).

### Backups

- `GET /api/backup/download` — download the raw SQLite file.
- `GET /api/backup/export-csv` — export all expenses as CSV.
- `POST /api/backup/s3` — trigger an immediate S3 upload.
- A scheduler (`server/utils/scheduler.js`) snapshots the DB with SQLite's `VACUUM INTO` and uploads to `backups/YYYY/MM/DD/HH-mm-ss.db` every 12 hours.

All backup endpoints are behind `requireAuth`. S3 uploads skip silently if credentials aren't configured.

## Repository layout

| Path      | What it is                                              |
|-----------|---------------------------------------------------------|
| `server/` | Express API. CommonJS, no build step. Entry: `server.js` |
| `client/` | React 19 + Vite + TypeScript web app                    |
| `mobile/` | Expo SDK 53 (React Native) app with NativeWind styling    |

Each package has its own `node_modules` and `package.json`. The root `package.json` only orchestrates local dev startup.

## Local development

Prerequisites: Node 20+, npm, a Google Cloud project with the Sheets API enabled, a Google Sheet, and (for mobile) the Expo Go app.

### 1. Google setup

1. In Google Cloud Console enable the **Google Sheets API** and create an **OAuth client ID** (Web application).
2. Add an authorized redirect URI:
   - Local: `http://localhost:5000/auth/callback`
   - Production: `https://your-app.fly.dev/auth/callback`
3. Note the client ID/secret and the spreadsheet's ID (from its URL) and its sheet tab name `Sheet1`.

### 2. Configure the server

Create `server/.env` (see `server/.env.example`):

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
SHEET_ID=your_spreadsheet_id
CLIENT_ID=your_oauth_client_id
CLIENT_SECRET=your_oauth_client_secret
REDIRECT_URI=http://localhost:5000/auth/callback

# Optional: for automatic S3 backups
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Create `mobile/.env` (LAN IP, not `localhost`, for physical devices):

```env
API_URL=http://192.168.1.50:5000
```

### 3. Run

```bash
# Root: client (Vite :5173) + server (:5000) concurrently
npm run dev

# Mobile (Expo / Metro; scan the QR with Expo Go)
cd mobile && npm start
```

To use the app, authenticate the server once at `http://localhost:5000/auth`, then log expenses from either client.

## Verification

There are no automated tests (`server`'s `npm test` is a stub); verification is static checks plus a manual smoke test against the running server.

- Server syntax: `cd server && node --check server.js` (repeat for `routes.js`, `controllers/*.js`, `utils/*.js`)
- Client typecheck + build: `cd client && npm run build` (runs `tsc -b && vite build`)
- Client lint: `cd client && npm run lint`
- Mobile typecheck + lint: `cd mobile && npx tsc --noEmit && npx eslint .`
- Manual smoke: with the server running, hit `/api/expenses/dates`, `/api/expenses?date=…`, and create/update/delete an expense via `curl`.

## Production deployment (Fly.io)

The server ships with a `Dockerfile` and `fly.toml`. A persistent volume mounted at `/data` keeps both the SQLite database and `tokens.json` across deploys.

```bash
fly volumes create tokens_data --region bom --size 1
fly deploy
fly secrets set \
  SHEET_ID=... CLIENT_ID=... CLIENT_SECRET=... \
  REDIRECT_URI="https://your-app.fly.dev/auth/callback" \
  FRONTEND_URL="https://your-app.fly.dev" \
  AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
  AWS_S3_BUCKET=... AWS_REGION=...
```

### Mobile builds (EAS)

`eas.json` defines `development`, `preview`, `production`, and `production-apk` profiles. Cloud builds read `API_URL` as an EAS secret:

```bash
eas login
eas secret:create --name API_URL --value https://your-api.fly.dev
eas build --platform android --profile production-apk
```

The OAuth deep-link scheme must stay `expenseSheetsApp` (defined in `mobile/app.config.js`) for the mobile `platform=mobile` redirect to work.

## Known caveats

- **Google Sheets mirror is eventually consistent, not transactional.** Edits and deletes trigger a background rewrite of the date's row (serialized per date), but each step is a separate best-effort Google API call: a failure is logged and SQLite — the source of truth — already has the change, so the sheet can temporarily (or, on repeated failure, persistently) drift. Sheet rewrites also overwrite any manual edits made directly in the spreadsheet.
- `tokens.json` holds a refresh token — keep it inside the persistent volume and never commit it.
- `server/credentials.json` (if present) holds an OAuth client secret and is not yet covered by `server/.gitignore` — never commit it.