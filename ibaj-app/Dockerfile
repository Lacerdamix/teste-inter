# Imagem única: a API serve o PWA compilado e aplica as migrações ao subir.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci
COPY . .
ARG VITE_YOUTUBE_URL
ARG VITE_MAPS_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --omit=dev -w api
COPY --from=build /app/api/dist api/dist
COPY --from=build /app/api/db api/db
COPY --from=build /app/web/dist web/dist
EXPOSE 3001
CMD ["sh", "-c", "node api/dist/src/migrate.js && node api/dist/src/server.js"]
