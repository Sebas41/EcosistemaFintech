FROM node:24.16.0-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install

COPY apps/api apps/api
RUN npm run prisma:generate --workspace @fintech/api
RUN npm run build --workspace @fintech/api

FROM node:24.16.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma

EXPOSE 4000
CMD ["sh", "-c", "for i in $(seq 1 30); do nc -z db 5432 && break; echo 'Waiting for DB...'; sleep 1; done && npm run db:migrate --workspace @fintech/api && npm run db:seed --workspace @fintech/api && npm start --workspace @fintech/api"]
