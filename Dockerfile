FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY backend/package.json ./backend/

RUN npm ci --workspace=@alcovia/backend

COPY backend ./backend

RUN npm run build -w @alcovia/backend

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY backend/package.json ./backend/

RUN npm ci --workspace=@alcovia/backend --omit=dev

COPY --from=build /app/backend/dist ./backend/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
