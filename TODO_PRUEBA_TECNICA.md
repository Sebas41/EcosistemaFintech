# TODO Prueba Técnica

## Crítico

- [x] Publicar la aplicación e incluir la URL real en `README.md`.
- [x] Ajustar GitHub Actions para validar también la rama `dev` o asegurar entrega/PR hacia `main`.
- [x] Agregar registro de usuario en el frontend usando `POST /api/auth/register`.
- [x] Agregar edición de transacciones en el frontend usando `PATCH /api/transactions/:id`.
- [x] Completar gestión de categorías en el frontend: editar y eliminar desde la UI.

## Medio

- [x] Agregar filtro por rango de fechas en la UI de transacciones y conectarlo con `from` / `to`.
- [x] Usar paginación real de API en el frontend en vez de traer `pageSize=50` y paginar localmente.
- [x] Corregir el texto demo del login: `demo@fintech.local` / `Password123!`.
- [x] Implementar vista funcional de ahorros.
- [x] Usar histórico completo para dashboard y analíticas.

## Cubierto

- [x] Backend con auth, sesiones, autorización por usuario y CRUD principal.
- [x] Persistencia real con PostgreSQL.
- [x] Docker Compose levanta base de datos, API y frontend.
- [x] README incluye stack, scripts, usuario demo, justificación, URLs de despliegue y AI Usage.
