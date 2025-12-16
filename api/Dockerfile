# ---------- Build stage ----------
FROM node:20-bookworm-slim AS build

WORKDIR /app

RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build


# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/swagger.yaml ./swagger.yaml

# 🔑 CRITICAL FIX
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4010

CMD ["node", "dist/index.js"]
