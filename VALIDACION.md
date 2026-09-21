# Verificación de la entrega

Verificaciones ejecutadas el 17 de septiembre de 2026:

| Comprobación | Resultado |
|---|---|
| Instalación limpia con `npm ci` en directorio separado | Correcta; se omitieron scripts de instalación en esa comprobación. |
| `prisma generate` | Correcto, cliente 6.19.0. |
| `prisma validate` | Esquema válido. |
| `npm run build` | Backend TypeScript y frontend React compilados. |
| `npm test` | 5 pruebas unitarias aprobadas. |
| `npm run test:integration` | 1 escenario integral aprobado contra PostgreSQL 17 en Docker. |
| Migración desde base vacía | Aplicada correctamente, incluidos triggers y CHECK. |
| Seed de roles | Ejecutado; no crea personas ni catálogos. |
| `npm audit --omit=dev` | 0 vulnerabilidades reportadas al momento de la comprobación. |
| Navegador local | Formulario y login renderizados; registro deshabilitado con catálogo vacío y sin error de conexión a la API. |

El escenario de integración verifica:

- Sesión en cookie HttpOnly y SameSite Strict.
- Rechazo de acceso anónimo y acceso ADMIN desde LEADER.
- Rechazo de escrituras sin origen autorizado.
- Consentimiento obligatorio y escuela coherente con municipio.
- Dos envíos concurrentes de la misma cédula: una fila y la misma respuesta pública.
- Cédula/teléfono cifrados y recuperación exclusiva ADMIN auditada.
- Dos usuarios del mismo líder ven el mismo municipio.
- Consulta y modificación fuera del ámbito denegadas.
- Cambio de municipios del líder efectivo para ambos usuarios sin iniciar sesión otra vez.
- Auditoría atribuida al usuario que realizó la acción.
- Restricciones SQL: escuela de otro municipio, LEADER sin perfil y eliminación de auditoría rechazadas.
- Desactivar un usuario revoca sus sesiones sin revocar las del otro usuario del líder.
- Logout revoca sesión.
- Bloqueo de cuenta tras cinco intentos y rate limit HTTP 429.

Los fixtures son explícitamente sintéticos y se ejecutaron en una base desechable. El seed entregado contiene únicamente roles.

No se comprobó Turnstile con credenciales de un sitio real ni un despliegue público HTTPS. Tampoco constituye una auditoría externa de seguridad. Para publicar, complete catálogos, responsable/contacto/conservación, claves y configuración CAPTCHA indicados en README.

## Actualización del catálogo — 21 de septiembre de 2026

- Prisma Client regenerado y esquema formateado.
- Backend y frontend compilados con `npm run build`.
- `npm test`: 7 pruebas aprobadas, incluyendo los 174 registros del catálogo y números positivos obligatorios. Los buscadores de provincia y seccional fueron retirados a petición del usuario; se mantienen sus selectores. En el formulario público, la escuela se indica únicamente mediante el campo de nombre opcional.
- Contratos de integración actualizados a seccionales; incluyen rechazo de provincia incorrecta, municipios históricos para nuevos registros, duplicados de número y endpoint municipal retirado.
- La conexión de desarrollo se corrigió en `backend/.env` para utilizar PostgreSQL local de Docker. La migración `20260921000000_local_seccionales` se aplicó correctamente allí; no se modificó la base remota ni producción.
- Migraciones ejecutadas en PostgreSQL embebido (PGlite), aislado de la base remota: 32 provincias y 174 seccionales verificadas; números duplicados y no positivos rechazados.
- Escenario con datos previos: UUID, relaciones de registros/escuelas/líderes y alias de provincias conservados. Los municipios sin correspondencia mantienen número NULL.
- `npm run test:integration`: escenario integral aprobado contra PostgreSQL 17 de Docker en una base temporal, eliminada al terminar. Incluye catálogo, correspondencia provincia/seccional, registro, cifrado, duplicados, RBAC, CSRF, auditoría y revocación.
- Los endpoints locales de provincias y seccionales responden HTTP 200, con 174 seccionales cargadas. También se verificaron HTTP 200 para provincias y privacidad a través del proxy del frontend en el puerto 5173. Se conservaron las provincias preexistentes ajenas al catálogo.
- La revisión visual quedó bloqueada por una interfaz de extensión abierta en Chrome.
