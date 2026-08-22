FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

# Production uses PostgreSQL (schema generated from schema.prisma).
RUN node scripts/make-postgres-schema.mjs && npx prisma generate --schema=prisma/schema.postgres.prisma

ENV NODE_ENV=production
# DATABASE_URL must be provided at runtime, e.g. a PostgreSQL connection string.

# openssl is required by Prisma's query engine on Alpine.
RUN apk add --no-cache openssl

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema.postgres.prisma && node src/index.js"]
