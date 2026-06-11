# Alcovia — Offline-first Focus & Syllabus Sync

Take-home implementation for Alcovia's offline-first focus sessions, syllabus progress, multi-device sync, and n8n automation.

## Stack

- **Client:** React Native (Expo, web supported) + TypeScript + React Navigation + AsyncStorage
- **UI:** Custom screens with Google Fonts (Fraunces, DM Sans, JetBrains Mono), `react-native-svg`, `expo-linear-gradient`
- **Backend:** Express + TypeScript + JSON file store
- **Automation:** n8n workflow (`n8n-workflow.json`)

## Prerequisites

- Node.js 18+
- Docker (for n8n) or n8n Cloud
- Two browser contexts for multi-device demo (normal window + incognito, or two profiles)

## Quick start

### 1. Install (monorepo root)

```bash
npm install
```

Workspaces: `@alcovia/client` (`alcovia-client/`) and `@alcovia/backend` (`backend/`).

### 2. Run backend + client

**Both together:**

```bash
npm run dev
```

**Or separately:**

```bash
npm run dev:backend   # http://localhost:3001
npm run dev:client    # Expo web
```

Open `http://localhost:3001` — you should see API info JSON (not “Cannot GET /”).
Health check: `http://localhost:3001/health`

**Production (local):**

```bash
npm run build
npm run start -w @alcovia/backend
```

Optional backend env:

```bash
PORT=3001
N8N_WEBHOOK_URL=http://localhost:5678/webhook/focus-success
```

**Reseed syllabus data** (11 subjects, 107 topics + device-a / device-b local snapshots):

```bash
npm run reseed
```

If the server is already running, also call `POST http://localhost:3001/dev/reset` or use **Reset server + local** in the client dev panel.

### 3. n8n workflow

1. Open n8n (Docker example):

```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

2. Import `n8n-workflow.json` from the repo root.
3. Activate the workflow.
4. Confirm webhook path: `POST /webhook/focus-success`

The workflow dedupes on `sessionId` using workflow static data, then POSTs to the backend mock sink at `http://host.docker.internal:3001/dev/mock-whatsapp`.

### 4. Client (two devices)

With `npm run dev:client` or `npm run dev` running, open two separate browser contexts (tabs share storage):

- Window A → **dev** button → select `device-a`
- Window B (incognito) → **dev** button → select `device-b`

Both use hardcoded `studentId = student-1`.

After reseeding, refresh each device with **Reset server + local** → **Sync now**, or run:

```bash
npm run apply-device-seeds
```

## App overview

### Landing page

- Study quote on the left, **Focus** and **Syllabus** entry cards on the right
- Responsive layout with gradient background

### Focus

- Tap the plant to open a **round duration dial** (25–120 min), then start a session
- **Empty stems** appear when the session starts; **leaves attach** over time (no grow animation)
- Floating **✎** stats menu (bottom-right): streak, coins, today's minutes, recent sessions
  - Session list colors: green = completed, red = failed, blue = running
- Give up / dev-complete controls during an active session

### Syllabus

- **Book shelf** (3 books per row) — one book per subject
- Click a book to show its **topics panel** on the right (grouped by chapter)
- Tap a topic to cycle status; color updates:
  - Gray = not started
  - Blue = in progress
  - Green = done
- Selected book becomes **translucent** (no lift animation)

### Dev panel

- Small **dev** button next to the header title opens a **draggable** floating panel
- Online/offline toggle, device switch (`device-a` / `device-b`)
- Sync now, reset local, reset server + local
- Live state, pending mutations, sync log, n8n notifications

## Demo script (matches video checklist)

1. **Offline focus on both devices**
   - Set both offline in the dev panel.
   - Device A: open Focus → set duration → start → Dev-complete a session.
   - Device B: repeat with another session.
2. **Conflicting syllabus edit**
   - Device A offline: open Syllabus → select a book → tap a topic until **Done**.
   - Device B offline: tap the same topic to **In progress**.
3. **Reconnect**
   - Bring both online → **Sync now**.
   - Both devices show identical coins, streak, today minutes, task status, and session history.
4. **n8n idempotency**
   - Open dev panel → n8n notifications.
   - You should see **one notification per successful session**, even if replayed during sync.

## Features

### Focus sessions

- Duration: 25–120 minutes (circular dial + presets 25/45/60/90).
- Success: timer reaches target while staying in session.
- Fail: Give up, or app backgrounded > 5 seconds (`app_switch`).
- Rewards (offline optimistic, server authoritative): +50 coins, streak update, today's focus minutes.

### Syllabus progress

- 11 subjects (Mathematics, Science, History, English, Physics, Chemistry, Computer Science, Biology, Economics, Geography, Art & Design).
- Subjects → chapters → tasks (107 seeded topics).
- Tap task to cycle: Not started → In progress → Done.
- Chapter % = done tasks / total tasks; subject % = average of chapter %.
- Delete (×) on each topic for tombstone/delete conflict testing.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/sync/push` | Push mutation batch |
| GET | `/sync/pull` | Pull merged server state |
| GET | `/dev/notifications` | Mock notification log |
| POST | `/dev/mock-whatsapp` | n8n sink (deduped) |
| POST | `/dev/reset` | Reset server state |

## Conflict handling

| Case | Resolution |
|------|------------|
| Same task status conflict | Higher Lamport wins; tie → higher status rank (`done` > `in_progress` > `not_started`); tie → lexicographic `deviceId` |
| Task edited vs deleted | Tombstone delete wins if its Lamport ≥ competing update |
| Duplicate sync mutation | Ignored by mutation `id` |
| Same session replay | Session outcome applied once; rewards keyed by `sessionId` |
| n8n replay | Deduped in workflow static data + backend mock sink |

See `DECISIONS.md` for the full sync model.

## Assumptions / defaults

- Single student: `student-1`
- Coins: 50 per successful session
- App-switch grace: 5 seconds
- UTC calendar dates for streak/today totals
- Web demo uses per-device AsyncStorage namespaces (`alcovia:device-a:state`, `alcovia:device-b:state`)

## Project structure

```
alcovia/                     # npm workspaces monorepo
├── package.json             # root scripts: dev, reseed, …
├── package-lock.json
├── alcovia-client/          # @alcovia/client — Expo React Native app
│   ├── App.tsx
│   ├── metro.config.js      # monorepo-aware Metro config
│   ├── src/
│   │   ├── components/      # Focus, syllabus, dev panel UI
│   │   ├── screens/         # Landing, Focus, Syllabus
│   │   ├── navigation/
│   │   ├── state/           # AppProvider + sync orchestration
│   │   ├── sync/
│   │   └── storage/
│   └── scripts/             # apply-device-seeds.mjs
├── backend/                 # @alcovia/backend — Express API
│   ├── src/seed.ts          # Syllabus seed data
│   ├── src/scripts/reseed.ts
│   └── data/                # db.json (gitignored, generated)
├── n8n-workflow.json
├── DECISIONS.md
└── README.md
```

## Deployment

### Backend (Railway, Render, Fly.io, etc.)

1. Set build command: `npm install && npm run build -w @alcovia/backend`
2. Set start command: `npm run start -w @alcovia/backend`
3. Env vars: `PORT` (set by host), optional `N8N_WEBHOOK_URL`, optional `DATA_DIR` for persistent volume
4. Health check path: `/health`

Or use the included `Dockerfile`:

```bash
docker build -t alcovia-backend .
docker run -p 3001:3001 alcovia-backend
```

### Client (Vercel — Expo web)

In Vercel project settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | `alcovia-client` |
| **Build Command** | `npm run build` (or leave default — uses `vercel.json`) |
| **Output Directory** | `dist` |
| **Install Command** | `cd .. && npm install` (monorepo lockfile at repo root) |

Add env var `EXPO_PUBLIC_API_URL` = your deployed backend URL (e.g. `https://your-api.railway.app`).

Push to GitHub and redeploy. Do **not** use `expo start --web` for production — Vercel needs the static export from `npm run build`.

Copy `.env.example` to `.env` for local development.

## Left out / next steps

- Real WhatsApp provider (mock sink used instead)
- User login / multi-student support
- Incremental sync cursors (full state pull today)
- User-visible conflict UI
- Expo Go on physical phone (web demo provided)
- Property/fuzz convergence tests

## Deliverables in repo

- `README.md` — this file
- `DECISIONS.md` — sync model & tradeoffs
- `n8n-workflow.json` — importable workflow
- `backend/` — Express API + reseed script
- `alcovia-client/` — Expo app

## Video

Record a ~5 minute walkthrough showing two clients, offline edits, reconnect convergence, and single n8n notification per session. (Not included in repo — record locally before submission.)
