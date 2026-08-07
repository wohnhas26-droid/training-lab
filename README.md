# Futbol Training Lab

**Train Smarter. Play Faster.**

A subscription-based soccer training platform with personalized development plans, structured daily training, progress tracking, and accountability for players, parents, coaches, and clubs.

## Prerequisites

Install [Node.js 22+](https://nodejs.org/) (LTS recommended).

## Quick Start

```powershell
# 1. Install all dependencies
cd C:\Users\Ryan\training-lab
npm install
cd backend && npm install && cd ..

# 2. Configure environment
copy .env.example .env
# Edit .env — at minimum set JWT_SECRET

# 3. Set up database + seed demo data
npm run setup

# 4. Start frontend + backend together
npm run dev
```

- **Frontend:** http://localhost:8080
- **API:** http://localhost:3001/api/health

### Demo Accounts

| Role   | Email                    | Password  |
|--------|--------------------------|-----------|
| Player | player@traininglab.com   | demo1234  |
| Coach  | coach@traininglab.com      | demo1234  |
| Parent | parent@traininglab.com   | demo1234  |

## What's Included

### Frontend (Vanilla JS)
- Landing page, pricing, login, onboarding
- Player dashboard — daily training, library, progress, challenges
- Coach dashboard — team management, assignments, video review
- Parent dashboard — reports, attendance, progress

### Backend API (Express + Prisma)
- JWT authentication (register, login, sessions)
- SQLite database (dev) — swap to PostgreSQL for production
- Training plan generation and session tracking
- Progress, XP, streaks, achievements
- Challenge enrollment and completion
- Coach team management and feedback
- Stripe subscription checkout (configure keys to enable)

### Infrastructure
- Docker Compose for production deployment
- GitHub Actions CI pipeline
- Nginx reverse proxy config
- Environment variable template

## Project Structure

```
training-lab/
├── index.html, pricing.html, login.html, onboarding.html
├── player/          Player dashboard pages
├── coach/           Coach dashboard pages
├── parent/          Parent dashboard pages
├── css/             Styles
├── js/
│   ├── app.js       App bootstrap
│   ├── data/        Static training content
│   └── services/    API client, storage, planner
├── backend/
│   ├── prisma/      Database schema + seed
│   └── src/
│       ├── routes/  API endpoints
│       ├── services/ Business logic
│       └── data/    Shared catalog JSON
├── docker-compose.yml
├── nginx.conf
└── .github/workflows/ci.yml
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current user state |
| GET | `/api/training/today` | Today's session |
| POST | `/api/training/session/complete` | Complete session |
| GET | `/api/progress/summary` | XP, streak, level |
| GET | `/api/challenges` | List challenges |
| POST | `/api/coach/assignments` | Assign training |
| POST | `/api/subscriptions/checkout` | Stripe checkout |
| GET | `/api/catalog/exercises` | Exercise library |

## Stripe Setup

Full guide: [docs/STRIPE.md](docs/STRIPE.md) · Webhooks: [docs/WEBHOOKS.md](docs/WEBHOOKS.md)

```powershell
npm run stripe:setup
powershell -File scripts/setup-webhooks-local.ps1
```

Test card: `4242 4242 4242 4242`

## Git Setup

```powershell
powershell -File scripts/setup-git.ps1
```

Creates the repo, initial commit, and prints steps to push to GitHub.

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for Docker, Railway, and Render.

```bash
docker compose -f docker-compose.prod.yml up -d --build
npm run stripe:webhooks -- https://yourdomain.com
```

Production serves frontend on port 80 (nginx proxies `/api` to the backend).

## Production Checklist

- [ ] Install Node.js and run `npm run setup`
- [ ] Set strong `JWT_SECRET` in `.env`
- [ ] Switch `DATABASE_URL` to PostgreSQL
- [ ] Configure Stripe keys and create products
- [ ] Set up Stripe webhooks for subscription events
- [ ] Deploy with Docker or host API + static files separately
- [ ] Add OpenAI key for Elite-tier AI evaluations (optional)
- [ ] Set up video hosting (S3/Cloudflare) for skill assessments
- [ ] Configure custom domain and SSL

## Offline Mode

If the API isn't running, the app falls back to **localStorage** demo mode — all features work locally without persistence across devices.

## Mobile App (Capacitor)

Build for **Google Play** and **App Store**:

```powershell
npm run cap:sync
npm run cap:open:android   # requires Android Studio
```

Set your API URL in `js/config/appConfig.js` before building. Full guide: [docs/MOBILE.md](docs/MOBILE.md)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend |
| `npm run setup` | Initialize DB and seed data |
| `npm run start` | Start API only (production) |
| `npm run db:studio` | Open Prisma database GUI |
| `npm run stripe:setup` | Create Stripe products/prices |
| `npm run stripe:webhooks` | Register production webhook endpoint |
| `npm run setup:git` | Init repo + first commit |
| `npm run setup:webhooks` | Forward Stripe webhooks locally |
| `npm run cap:sync` | Build www + sync Android/iOS projects |
| `npm run cap:open:android` | Open project in Android Studio |
