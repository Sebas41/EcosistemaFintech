# Saldo Vivo

MVP full stack para gestionar movimientos financieros personales, categorías y presupuestos mensuales.

## Stack

- Node.js `24.16.0`
- npm `11.13.0`
- Backend: Express `5`, TypeScript, Prisma `6`, PostgreSQL `16`
- Frontend: React `18`, Vite `8`, TypeScript
- Calidad: ESLint, Vitest, npm audit, GitHub Actions
- Contenedores: Docker Compose

## Inicio rápido

Requisito: Docker y Docker Compose instalados.

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api`
- PostgreSQL: `localhost:5432`

Usuario demo:

- Correo: `demo@fintech.local`
- Contraseña: `Password123!`

Para desarrollo local sin Docker, copia `.env.example` a `.env`, levanta PostgreSQL y ejecuta:

```bash
npm install
npm run prisma:generate --workspace @fintech/api
npm run db:dev --workspace @fintech/api
npm run db:seed --workspace @fintech/api
npm run dev
```

## Funcionalidad

- Registro, login, logout y sesión con cookie `httpOnly`.
- Hash de contraseña con bcrypt.
- Movimientos financieros con tipo, valor, descripción, categoría y fecha.
- Edición, eliminación, filtros, ordenamiento por fecha y paginación.
- Resumen de balance: ingresos menos egresos.
- Categorías por usuario con presupuesto mensual.
- Estado de presupuesto por categoría: presupuesto, gastado, porcentaje y alerta al superar 80% o 100%.

## Seguridad y arquitectura

La API aplica autorización por propietario en cada consulta de negocio usando `userId` desde el JWT firmado. Los datos no se almacenan en memoria: PostgreSQL es la fuente de verdad y Prisma define relaciones, índices y restricciones. Las contraseñas se guardan con bcrypt y la sesión se entrega en cookie `httpOnly`, con expiración controlada por `JWT_EXPIRES_IN`.

Elegí un monorepo Node/TypeScript porque reduce fricción entre frontend y backend, mantiene tipos y tooling consistentes, y es fácil de levantar en CI/CD. PostgreSQL se eligió por integridad transaccional, restricciones relacionales e idoneidad para datos financieros.

## Scripts

```bash
npm run lint
npm run test
npm run build
npm audit --audit-level=high
```

El pipeline en `.github/workflows/ci.yml` ejecuta instalación limpia, generación de Prisma, migraciones contra PostgreSQL, lint, tests y build.

## API principal

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/transactions`
- `POST /api/transactions`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/transactions/summary`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/categories/status`

## URL de despliegue

Pendiente de publicar. En este entorno no hay credenciales de hosting configuradas; para entrega final, desplegar `docker-compose.yml` o separar API/web en un proveedor administrado y reemplazar esta sección con la URL pública.

## AI Usage

Herramienta usada: Codex, para interpretar el PDF, generar una primera estructura de proyecto, implementar módulos repetitivos y ejecutar validaciones.

Ejemplo 1: pedí convertir los requerimientos del PDF en una arquitectura implementable. El resultado fue un monorepo con API Express, React, Prisma/PostgreSQL, Docker Compose y CI.

Ejemplo 2: pedí implementar validaciones y presupuesto mensual. El resultado fue el esquema Prisma, validadores Zod y cálculo de alerta por categoría para gastos del mes.

Sugerencia modificada o rechazada: una implementación inicial podía limitar la UI a crear y eliminar datos. La ajusté para incluir edición, paginación y ordenamiento porque esos flujos están explícitos en los requerimientos y deben poder verificarse desde frontend y API.

El uso de IA aceleró la creación de boilerplate y pruebas, pero las decisiones de seguridad, persistencia real, autorización por `userId`, stack y alcance de validación se revisaron manualmente para que sean defendibles en sustentación.
