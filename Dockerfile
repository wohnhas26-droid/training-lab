FROM node:22-alpine

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma
COPY backend/scripts ./scripts
COPY backend/src ./src

RUN npx prisma generate
RUN mkdir -p data

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
ENV DATABASE_URL="file:./data/prod.db"

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:3001/api/health || wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
