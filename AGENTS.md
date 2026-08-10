# AGENTS.md

Operating guidance for agents working in the Futbol Training Lab repo.

## Overview

- Backend: Express + Prisma (SQLite) API in `backend/`, served on port `3001`.
- Frontend: static vanilla-JS pages at the repo root (`index.html`, `player/`, `coach/`, `parent/`, `css/`, `js/`), served on port `8080`.
- The frontend talks to the API at `http://localhost:3001/api`; if the API is unreachable it falls back to a localStorage-only demo mode.

## Setup

Run the idempotent setup script (installs root + backend deps, creates a gitignored `backend/.env` if missing, and runs Prisma generate/push/seed):

```bash
bash scripts/setup-cloud.sh
```

The SQLite database lives at `backend/prisma/dev.db` and is seeded with demo data.

## Running the app

- Backend: `npm run dev --prefix backend` (watch mode) or `npm run start --prefix backend`.
- Frontend: `node scripts/serve.mjs` (cross-platform static server; port via `FRONTEND_PORT`/`PORT`, default `8080`).
- Both together (cross-platform): `npm run dev`.

In Cloud Agents these two servers are started automatically by the `terminals` defined in `.cursor/environment.json`.

Note: `serve.ps1` and the `dev:frontend:ps` script are the original Windows/PowerShell static server. Prefer `scripts/serve.mjs` (`npm run dev:frontend`) on Linux/macOS.

## Demo accounts

Password for all: `demo1234`

| Role   | Email                    |
|--------|--------------------------|
| Player | `player@traininglab.com` |
| Coach  | `coach@traininglab.com`  |
| Parent | `parent@traininglab.com` |

The coach owns team "U16 Elite" containing the player; the parent is linked to the player.

## Environment variables

Defined in `backend/.env` (gitignored, created by the setup script). Defaults work for local dev without secrets:

- `DATABASE_URL` — SQLite file (default `file:./dev.db`).
- `JWT_SECRET` — falls back to a dev default if unset.
- `PORT`, `NODE_ENV`, `FRONTEND_URL`.
- Stripe (`STRIPE_*`) and `OPENAI_API_KEY` are optional; Stripe checkout and AI plans stay disabled until configured.

## Useful API endpoints

- `GET /api/health` — service health.
- `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`.
- `GET /api/training/today`, `POST /api/training/session/complete`.
- `GET /api/progress/summary`, `GET /api/challenges`, `GET /api/catalog/exercises`.
- `GET /api/coach/team`, `POST /api/coach/assignments`, `POST /api/coach/feedback`.

## Cursor Cloud specific instructions

- Environment is repository-managed via `.cursor/environment.json` (default image, `install` = `bash scripts/setup-cloud.sh`, plus `backend`/`frontend` terminals).
- There are no automated tests in this repo. Validate changes by running the servers and exercising the relevant flow — via `curl` against the API and/or the browser UI at `http://localhost:8080`.
- No secrets are required for the core player/coach/parent flows; only add Stripe/OpenAI keys when testing those specific integrations.
