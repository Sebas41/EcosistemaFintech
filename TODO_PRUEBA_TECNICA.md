# TODO Prueba Tecnica

## Critico

- [ ] Publicar la aplicacion y reemplazar en `README.md` la seccion `URL de despliegue` con la URL real. Bloqueado: falta proveedor/credenciales de hosting.
- [x] Ajustar GitHub Actions para validar tambien la rama `dev` o asegurar entrega/PR hacia `main`.
- [x] Agregar registro de usuario en el frontend usando `POST /api/auth/register`.
- [x] Agregar edicion de transacciones en el frontend usando `PATCH /api/transactions/:id`.
- [x] Completar gestion de categorias en el frontend: editar y eliminar desde la UI.

## Medio

- [x] Agregar filtro por rango de fechas en la UI de transacciones y conectarlo con `from` / `to`.
- [x] Usar paginacion real de API en el frontend en vez de traer `pageSize=50` y paginar localmente.
- [x] Corregir el texto demo del login: `demo@fintech.local` / `Password123!`.

## Cubierto

- [x] Backend con auth, sesiones, autorizacion por usuario y CRUD principal.
- [x] Persistencia real con PostgreSQL.
- [x] Docker Compose levanta base de datos, API y frontend.
- [x] README incluye stack, scripts, usuario demo, justificacion y AI Usage.
