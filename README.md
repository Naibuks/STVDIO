# STVDIO°

A full-stack creative networking, portfolio, collaboration, and marketplace platform.

STVDIO° is being built for creatives — graphic designers, photographers, models, videographers, illustrators, UI/UX designers, stylists, artists, creative directors and brand owners — to build professional profiles, showcase work, discover and follow other creatives, find collaborations, offer creative services, and hire each other.

> **Status: Phase 1 — Foundation.**
> The project skeleton, tooling and API health endpoint are in place. No product features are implemented yet.

---

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, ESLint |
| Backend | Node.js, Express, JavaScript (CommonJS), REST |
| Database | MongoDB with Mongoose |
| Security middleware | Helmet, CORS |

### Planned (not yet installed or implemented)

| Area | Technology |
| --- | --- |
| Authentication | JWT, bcryptjs |
| Payments | Paystack |
| Transactional email | Resend |
| Media uploads | Cloudinary |
| Real-time messaging | Socket.io |

### Planned deployment

- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## Project structure

```
STVDIO°/
├── client/                  # Next.js frontend
│   ├── app/                 # App Router routes and layouts
│   ├── components/          # Reusable React components
│   ├── lib/                 # Client-side config and helpers
│   ├── services/            # API client (talks to the Express backend)
│   ├── types/               # Shared TypeScript types
│   ├── public/              # Static assets
│   └── .env.example
│
├── server/                  # Express REST API
│   ├── config/db.js         # Mongoose connection
│   ├── controllers/         # Request handlers
│   ├── routes/              # Route definitions
│   ├── middleware/          # Error handling and future auth
│   ├── models/              # Mongoose schemas (empty — next phase)
│   ├── services/            # Business logic and integrations (empty)
│   ├── utils/               # Shared helpers (empty)
│   ├── server.js            # App entry point
│   └── .env.example
│
├── .gitignore
└── README.md
```

The frontend and backend are fully separate applications with their own
`package.json`, dependencies and deployment target. There is no shared build step.

---

## Local development

**Requirements:** Node.js 18+ and npm. A MongoDB connection string is optional
for this phase — the API boots without one.

### 1. Clone and install

```bash
git clone <your-repo-url> && cd STVDIO°
```

Install each application separately:

```bash
cd server && npm install && cd ../client && npm install && cd ..
```

### 2. Environment variables

Neither `.env` nor `.env.local` is committed. Create them from the examples:

```bash
cp server/.env.example server/.env && cp client/.env.example client/.env.local
```

**`server/.env`** — required now:

| Variable | Purpose |
| --- | --- |
| `PORT` | Port the API listens on (default `5000`) |
| `MONGODB_URI` | MongoDB connection string. Leave blank to run without a database. |
| `CLIENT_URL` | Allowed CORS origin (default `http://localhost:3000`) |

> **macOS note:** AirPlay Receiver listens on port 5000, so the API cannot bind
> to it. Either turn AirPlay Receiver off under *System Settings → General →
> AirDrop & Handoff*, or set a different port. This repo's local `.env` files
> use `5050`; if you change `PORT`, update `NEXT_PUBLIC_API_URL` to match.

The remaining variables in `server/.env.example` (`JWT_SECRET`, Cloudinary,
Paystack, Resend) are placeholders for later phases and are unused today.

**`client/.env.local`** — required now:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API (default `http://localhost:5000/api`) |

Anything prefixed `NEXT_PUBLIC_` is bundled into the browser. Never put a secret
key in `client/.env.local`.

### 3. Start the backend

```bash
cd server && npm run dev
```

Runs on the port set in `server/.env` (`5050` locally) with nodemon auto-reload.
Use `npm start` for a plain, non-watching run.

### 4. Start the frontend

In a second terminal:

```bash
cd client && npm run dev
```

Runs on `http://localhost:3000`.

---

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Returns API status, database connection state and uptime |

```bash
curl http://localhost:5000/api/health
```

```json
{
  "status": "ok",
  "service": "STVDIO° API",
  "database": "disconnected",
  "uptime": 3,
  "timestamp": "2026-08-11T12:00:00.000Z"
}
```

No product endpoints exist yet.

---

## Scripts

**client/**

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

**server/**

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start with node |

---

## Design direction

STVDIO° should read as underground, editorial, minimal and premium — closer to a
design magazine or an artist-run platform than a corporate SaaS dashboard. The
degree symbol in the wordmark is part of the visual identity. The full interface
is not implemented in this phase.

---

## Roadmap

Each phase is built and verified before the next begins.

1. **Foundation** — project structure, tooling, API health check *(complete)*
2. **Database architecture & data models** — Mongoose schemas and relationships
3. Authentication & role-based access
4. Creative profiles
5. Projects & portfolios
6. Social feed, follows, likes, comments
7. Services marketplace & orders
8. Paystack payments
9. Cloudinary media uploads
10. Real-time messaging, notifications, reviews
11. Admin dashboard
