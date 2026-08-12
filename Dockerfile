FROM node:22-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma
COPY backend/scripts ./scripts
COPY backend/src ./src

# Production uses PostgreSQL (schema generated from schema.prisma).
RUN node scripts/make-postgres-schema.mjs && npx prisma generate --schema=prisma/schema.postgres.prisma

# Frontend static files (served by Express in production)
WORKDIR /app
COPY index.html login.html onboarding.html pricing.html ./
COPY css ./css
COPY js ./js
COPY player ./player
COPY coach ./coach
COPY parent ./parent
COPY subscription ./subscription

WORKDIR /app/backend

ENV NODE_ENV=production
# DATABASE_URL must be provided at runtime, e.g. a PostgreSQL connection string.

# openssl is required by Prisma's query engine on Alpine.
RUN apk add --no-cache openssl wget

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD sh -c 'wget -qO- http://127.0.0.1:${PORT:-3001}/api/health || exit 1'

CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema.postgres.prisma && node src/index.js"]
