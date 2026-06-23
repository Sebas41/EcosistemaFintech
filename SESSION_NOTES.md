# Session Notes

Este archivo registra cambios y observaciones para retomar el proyecto en futuras sesiones.

## 2026-06-23

- Solicitud: correr el proyecto con Docker Compose y dejar un archivo de notas para futuras sesiones.
- Estado inicial observado: el repositorio ya tenia cambios sin commitear en Prisma/API antes de esta sesion (`apps/api/prisma/schema.prisma`, rutas/mappers/budget y migraciones).
- Cambio realizado: se creo este archivo `SESSION_NOTES.md`.
- Validacion: `docker compose config` funciona y confirma servicios `db`, `api` y `web`.
- Bloqueo: `docker compose up --build` fallo antes de construir porque Docker Desktop/engine respondio `500 Internal Server Error` al consultar el pipe `dockerDesktopLinuxEngine`.
- Recuperacion: se reinicio Docker Desktop a nivel de usuario; despues `docker version` volvio a responder con server Docker Desktop `4.78.0`.
- Build: `docker compose up --build -d` avanzo hasta construir `web`, pero fallo por TypeScript en `apps/web/src/test.setup.ts`: `Cannot find name 'global'`.
- Cambio realizado: se cambio `global.ResizeObserver` por `globalThis.ResizeObserver` en `apps/web/src/test.setup.ts`.
- Arranque: el build completo paso, pero la API no pudo publicar `localhost:4000` porque estaba ocupado por un proceso local `node.exe` ejecutando `tsx src/server.ts` en este repo.
- Recuperacion: se detuvo ese proceso local para liberar el puerto `4000`.
- Bloqueo: la API fallo al aplicar migraciones porque `schema.prisma` estaba en `provider = "sqlite"` mientras Docker Compose usa PostgreSQL.
- Cambio realizado: se volvio `apps/api/prisma/schema.prisma` y `apps/api/prisma/migrations/migration_lock.toml` a `postgresql`; tambien se adapto `apps/api/prisma/migrations/20260623051640_init/migration.sql` a SQL PostgreSQL conservando `Float`/`String` del esquema actual.
- Bloqueo: la DB persistente ya tenia aplicada la migracion anterior `20260618160000_init`; la migracion nueva intentaba recrear tablas existentes y fallo con `relation "User" already exists`.
- Cambio realizado: se restauro `apps/api/prisma/migrations/20260618160000_init/migration.sql` para compatibilidad con DBs frescas y existentes; `20260623051640_init` ahora migra el esquema anterior a los tipos actuales (`DOUBLE PRECISION` y `TEXT`).
- Recuperacion: se ejecuto `npx prisma migrate resolve --rolled-back 20260623051640_init --schema apps/api/prisma/schema.prisma` contra PostgreSQL local para limpiar el registro de migracion fallida.
- Estado final: `docker compose up --build -d` completo correctamente.
- Verificacion final: contenedores `certificacion-db-1`, `certificacion-api-1` y `certificacion-web-1` quedaron arriba; frontend responde `200 OK` en `http://localhost:5173`; login demo responde `200 OK` en `POST http://localhost:4000/api/auth/login`.
