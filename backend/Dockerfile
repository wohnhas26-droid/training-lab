FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

RUN npx prisma generate

ENV NODE_ENV=production
ENV DATABASE_URL="file:./data/prod.db"

RUN mkdir -p data

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
