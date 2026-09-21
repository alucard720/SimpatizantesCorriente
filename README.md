# Corriente Magisterial Juan Pablo Duarte — V1

Proyecto editable con Node.js, Express 5, TypeScript, Prisma 6.19, PostgreSQL 17 y React 19 + Vite. Formulario público sin cuenta; portal privado para ADMIN y usuarios LEADER.

## Decisión incorporada: un líder, varios usuarios

`Leader 1 → N User`; cada usuario LEADER pertenece a **un** líder. Las seccionales se asignan al líder mediante `leader_municipalities`. Todos sus usuarios comparten ese ámbito, con credenciales, sesiones y auditoría individuales. ADMIN no pertenece a un líder. Una seccional puede tener varios líderes. Las modificaciones del ámbito se aplican en la siguiente solicitud porque el servidor consulta los permisos en base de datos.

La conversación de referencia disponible contenía respuestas truncadas. Las decisiones completadas aquí son explícitas: escuela opcional (catálogo o texto libre), provincia derivada de la seccional en registros, recuperación de cédula/teléfono solo ADMIN, estado inicial PENDING y sesiones con vencimiento absoluto de ocho horas. No se incluyen datos de simpatizantes ni catálogos inventados.

## Requisitos

- Node.js 22.12 o superior compatible con las dependencias, npm y Docker Compose.
- Alternativa a Docker: PostgreSQL 17 accesible mediante `DATABASE_URL`.
- Terminal interactiva para crear el primer administrador.

## Puesta en marcha

Desde la carpeta del proyecto:

```sh
npm ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d db
```

Genere **dos claves diferentes**, ejecutando dos veces:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Guarde una en `DATA_ENCRYPTION_KEY` y la otra en `CEDULA_HMAC_KEY`, en `backend/.env`. Las claves no se envían al navegador. Mantenga copias protegidas fuera del repositorio: perder la clave AES impide recuperar cédulas y teléfonos; cambiar la clave HMAC sin recalcular los índices impide detectar duplicados anteriores.

```sh
npm run db:generate
npm run db:deploy
npm run db:seed
npm run admin:create
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Salud del proceso: http://localhost:3000/api/health
- El frontend usa el proxy de Vite; utilice **localhost**, coherente con `FRONTEND_ORIGIN`.

El instalador de administrador pide nombre, apellido, correo y contraseña oculta de al menos 12 caracteres. No hay usuario ni contraseña por defecto. El seed es idempotente y contiene exclusivamente ADMIN y LEADER. La migración inicial también establece ambos roles.

### Primer uso

1. Entre por `/login` con el administrador creado.
2. Ejecute `npm run db:deploy` para cargar el catálogo local de provincias y seccionales; las escuelas pueden añadirse después en Administración → Catálogos. No se reciben registros sin una seccional válida.
3. En Líderes, cree un perfil y asigne sus seccionales. Puede seleccionar seccionales de varias provincias antes de guardar.
4. En Usuarios, cree uno o varios accesos LEADER para ese mismo perfil.
5. El formulario `/` queda abierto sin autenticación. La escuela puede dejarse vacía o escribirse como texto libre.
6. Los usuarios LEADER consultan y actualizan el estado de los registros de sus seccionales. ADMIN administra todos los ámbitos y puede solicitar los datos protegidos con un motivo.

## Comandos

```sh
npm run dev                 # Ambos servidores
npm run build               # TypeScript backend y bundle frontend
npm start -w backend        # Backend compilado
npm run preview -w frontend # Solo vista previa del bundle, no servidor de producción
npm run test                # Pruebas de cifrado, contraseñas, validación y alcance
```

Para crear cambios de esquema en desarrollo, pase los argumentos directamente al workspace:

```sh
npm run db:migrate -w backend -- --name descripcion_del_cambio
npm run db:generate
npm run db:seed
```

`db:deploy` aplica las migraciones existentes sin reconstruirlas; es el comando para una instalación o despliegue. No sustituya migraciones por `db push`: los CHECK y triggers personalizados están en SQL. Después de modificar el esquema, revise el SQL generado para conservarlos.

## Variables de entorno

| Variable del backend   | Uso                                                                               |
| ---------------------- | --------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Conexión PostgreSQL; use credenciales propias fuera del desarrollo local.         |
| `PORT`                 | Puerto API; por defecto 3000.                                                     |
| `NODE_ENV`             | development, test o production.                                                   |
| `FRONTEND_ORIGIN`      | Un origen exacto permitido para CORS y operaciones de escritura. Sin barra final. |
| `DATA_ENCRYPTION_KEY`  | 32 bytes aleatorios, base64, para AES-256-GCM.                                    |
| `CEDULA_HMAC_KEY`      | Otra clave de 32 bytes para HMAC-SHA256.                                          |
| `CAPTCHA_PROVIDER`     | disabled solo desarrollo/pruebas; turnstile obligatorio en producción.            |
| `TURNSTILE_SECRET_KEY` | Secreto de verificación del servidor.                                             |
| `TURNSTILE_HOSTNAME`   | Host esperado, sin esquema ni puerto.                                             |
| `TRUST_PROXY_HOPS`     | 0 sin proxy. Número exacto de proxies de confianza; no configure valores amplios. |
| `PRIVACY_VERSION`      | Versión que acepta explícitamente cada inscripción.                               |
| `PRIVACY_CONTROLLER`   | Responsable del tratamiento; completar antes de publicar.                         |
| `PRIVACY_CONTACT`      | Contacto operativo para solicitudes de derechos.                                  |
| `PRIVACY_RETENTION`    | Plazo y procedimiento real de conservación y supresión.                           |

Frontend: `VITE_API_URL=/api` para mismo origen y `VITE_TURNSTILE_SITE_KEY` para el widget. No use prefijo `VITE_` en secretos. Vite incorpora sus variables al compilar; recompilar después de cambiarlas.

## Estructura

```text
backend/
  prisma/schema.prisma         Modelo completo
  prisma/migrations/           Tablas, índices, roles, CHECK y triggers
  prisma/seed.ts               Roles idempotentes
  scripts/create-admin.ts      Alta administrativa por terminal
  src/config/                  Validación de entorno
  src/routes/                  Rutas y RBAC
  src/controllers/             Adaptación HTTP
  src/services/                Casos de uso y transacciones
  src/repositories/            Proyecciones, ámbito y auditoría
  src/middleware/              Sesión, origen, límites y errores
  src/validators/              Contratos Zod
  src/lib/                     Prisma, cifrado, errores
  test/                        Pruebas unitarias y de integración
frontend/
  src/pages/                   Registro, éxito, privacidad, login, dashboard, admin, líder
  src/components/              Layout, guardas y CAPTCHA
  src/context/                 Sesión en memoria
  src/services/api.ts          Cliente HTTP con cookie
  src/types.ts                 Tipos del frontend
```

## Modelo

- `roles`: ADMIN y LEADER, activos/inactivos.
- `users`: identidad de acceso, email normalizado único, hash scrypt, bloqueo temporal; teléfono opcional cifrado. FK opcional `leader_id`, obligatoria para LEADER y prohibida para ADMIN.
- `leaders`: perfil con nombre y estado; **sin credenciales propias**; múltiples usuarios.
- `leader_municipalities`: PK compuesta que evita asignaciones repetidas.
- `provinces`, `municipalities`, `schools`: catálogo jerárquico, códigos únicos, nombres únicos dentro de su ámbito.
- `registrations`: nombre y apellido, cédula cifrada y HMAC único, teléfono cifrado, seccional, escuela opcional o texto libre, consentimiento, fuente y estado.
- `audit_logs`: actor individual, acción, entidad, requestId y motivo; sin cédulas, teléfonos, contraseñas ni tokens.
- `sessions`: complemento técnico; token aleatorio guardado como SHA-256 y vencimiento.

Se emplean UUID y `timestamptz`. La provincia de una inscripción se deriva de la seccional para evitar divergencias. La FK compuesta escuela/seccional impide asociaciones inconsistentes. Índices para ámbitos, estado, fechas, sesiones y auditoría. Restricciones adicionales en SQL validan nombres, email normalizado, hash, consentimiento y vínculo rol/líder. Triggers impiden UPDATE/DELETE/TRUNCATE de auditoría; el administrador de la base aún podría deshabilitarlos: no es un registro inmutable frente al propietario de PostgreSQL.

## API

Todos los cuerpos son JSON. Toda escritura debe incluir `Origin` igual a `FRONTEND_ORIGIN`. Los errores tienen `{ "error": "..." }`; los de validación también incluyen `fields`. La sesión viaja en cookie HttpOnly; use `credentials: include`.

### Públicos

| Método y ruta                                         | Parámetros / resultado                                  |
| ----------------------------------------------------- | ------------------------------------------------------- |
| GET `/api/public/privacy`                             | Texto y versión del consentimiento.                     |
| GET `/api/public/provinces`                           | Provincias activas.                                     |
| GET `/api/public/seccionales?provinceId=UUID`      | Seccionales activas de la provincia.                     |
| GET `/api/public/schools?seccionalId=UUID&q=texto` | Hasta 100 coincidencias; buscar por nombre para acotar. |
| POST `/api/public/registrations`                      | Inscripción; 202 idéntico para nuevo y duplicado.       |

Cuerpo de inscripción (marcadores, no datos reales):

```json
{
  "firstName": "<nombre>",
  "lastName": "<apellido>",
  "cedula": "<11 dígitos>",
  "phone": "<10 a 15 dígitos, + opcional>",
  "provinceId": "<UUID>",
  "seccionalId": "<UUID>",
  "schoolName": "<nombre opcional; excluir si se envía schoolId>",
  "consent": true,
  "consentVersion": "2026-01",
  "captchaToken": "<token Turnstile>"
}
```

La validación de cédula es de **formato**, no consulta identidad ni existencia en una fuente oficial. Una inscripción pública entra como PENDING: no acredita identidad ni autoría. La restricción única HMAC resuelve duplicados concurrentes. La respuesta nunca revela un identificador ni confirma una afiliación previa; no ofrece garantía de indistinguibilidad temporal absoluta. No existe GET público de personas, teléfono, cédula o estadísticas.

### Sesión

| Método y ruta           | Cuerpo                     |
| ----------------------- | -------------------------- |
| POST `/api/auth/login`  | `{email,password}`         |
| GET `/api/auth/me`      | Usuario, rol y seccionales. |
| POST `/api/auth/logout` | Revoca sesión actual.      |

### ADMIN y LEADER

| Método y ruta                                 | Uso                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------- |
| GET `/api/private/dashboard`                  | Totales por estado, filtrados por ámbito.                                                         |
| GET `/api/private/registrations`              | `page`, `pageSize` (máx. 100), `seccionalId`, `status`. Retorna `{items,total,page,pageSize}`. |
| PATCH `/api/private/registrations/:id/status` | `{status: "PENDING"                                                                               | "VERIFIED" | "ARCHIVED"}`; 404 fuera del ámbito. |

### Solo ADMIN

| Método y ruta                                       | Cuerpo / uso                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| POST `/api/private/registrations/:id/sensitive`     | `{reason}` de 10–300 caracteres; descifra cédula y teléfono y audita antes de responder.              |
| GET `/api/private/admin/users`                      | Array paginado; sin hashes ni datos cifrados.                                                         |
| POST `/api/private/admin/users`                     | `{firstName,lastName,email,password,role,leaderId?,phone?}`. LEADER exige leaderId; ADMIN lo prohíbe. |
| PATCH `/api/private/admin/users/:id`                | `{active}`; desactivar revoca todas sus sesiones. No permite autodesactivación.                       |
| GET `/api/private/admin/leaders`                    | Array paginado, seccionales y número de usuarios.                                                      |
| POST `/api/private/admin/leaders`                   | `{name}`.                                                                                             |
| PUT `/api/private/admin/leaders/:id/seccionales` | `{seccionalIds: [...]}` reemplaza el ámbito completo, vacío lo revoca.                             |
| POST `/api/private/admin/provinces`                 | `{code,name}`.                                                                                        |
| POST `/api/private/admin/seccionales`            | `{provinceId,number,name}`.                                                                             |
| POST `/api/private/admin/schools`                   | `{seccionalId,name,code?}`.                                                                        |
| GET `/api/private/admin/audit-logs`                 | Array paginado.                                                                                       |

Listados administrativos: `page=1&pageSize=25`, máximo 100 por página. La interfaz de creación de usuarios muestra hasta 100 líderes; para un catálogo mayor, use el endpoint paginado y `leaderId` en API hasta ampliar ese selector.

## Controles implementados

- Contraseñas scrypt N=32768, r=8, p=1, salt aleatoria. Mensaje uniforme y cálculo scrypt también para correos inexistentes.
- Cinco intentos fallidos bloquean una cuenta 15 minutos. Bloqueo de fila para serializar intentos paralelos.
- Cookie HttpOnly, SameSite=Strict, Secure en producción, sin token en localStorage. Sesiones revocables en base de datos; expiración absoluta de ocho horas.
- RBAC y filtros por seccional en el servidor; no se confía en el frontend para permisos.
- Protección CSRF mediante origen exacto obligatorio en escrituras y SameSite; CORS restringido. El cliente de servidor a servidor también debe enviar Origin. `Origin` no sustituye autenticación.
- AES-256-GCM, IV aleatorio por valor, AAD que vincula campo e ID. Sobre `v1.iv.tag.ciphertext`. HMAC-SHA256 con clave distinta para duplicados.
- Datos protegidos excluidos de listados. Recuperación ADMIN con motivo; la interfaz los oculta al minuto o al cerrar la consulta. Ningún dato de sesión se persiste en el navegador fuera de la cookie.
- Auditoría y mutaciones en una transacción. Consultas de registros, resumen, auditoría y recuperación sensible también se registran. No hay logging de cuerpos, contraseñas, tokens o errores Prisma completos.
- Helmet, máximo JSON 16 KiB, validación Zod, consultas parametrizadas, paginación.
- Límites por IP: 180 solicitudes/minuto, 15 logins/15 minutos, 20 inscripciones/hora. El almacén de límites es en memoria, **una instancia** de API; se reinicia con el proceso. Para varias instancias, sustituya por un store compartido antes de escalar. El bloqueo de cuentas sí persiste en PostgreSQL.
- Adaptador CAPTCHA Turnstile real: verifica token en servidor, hostname y acción `registration`, con timeout y fallo cerrado. En producción se impide desactivarlo.

## Pruebas de integración

Use exclusivamente una base **desechable** cuyo nombre termine en `_test`. Las pruebas aplican migraciones y crean fixtures rotuladas TEST con emails `example.invalid`; no consultan ni importan personas reales. Los fixtures permanecen en esa base y usan claves efímeras; elimine la base al terminar si no quiere conservarlos.

```sh
docker compose exec db createdb -U corriente corriente_test
TEST_DATABASE_URL='postgresql://corriente:local-development-only@localhost:5432/corriente_test?schema=public' npm run test:integration
```

Se comprueban cifrado y recuperación, duplicados, rechazo de escuela de otro seccional, RBAC, consentimiento, CSRF, mismo líder con dos usuarios, cambio inmediato de ámbito, auditoría por usuario, revocación, bloqueo por intentos y restricciones de base de datos.

## Publicación y límites de esta V1

Sirva `frontend/dist` por HTTPS con fallback SPA a `index.html` y reenvíe `/api` al backend **en el mismo origen**. La previsualización de Vite no es un despliegue. Configure encabezados de seguridad también en el servidor del frontend; si usa CSP, autorice el widget de Turnstile y su frame de `challenges.cloudflare.com`. Configure un único proxy conocido y no exponga el backend por otra ruta que eluda ese proxy. Use usuario de migraciones separado del usuario runtime y limite sus privilegios; el Compose entregado es para desarrollo local.

Antes de recibir registros reales, complete responsable, contacto y conservación, cree el sitio Turnstile y compruebe sus claves. La configuración de producción rechaza valores de privacidad pendientes, CAPTCHA desactivado y origen sin HTTPS. El texto de privacidad es una plantilla operativa editable, no una evaluación legal.

Los nombres, seccional, escuela y simpatía implícita siguen siendo datos sensibles aunque cédula y teléfono estén cifrados. Proteja accesos, copias de seguridad y logs de infraestructura. No registre cookies ni cuerpos en el proxy. La V1 no implementa MFA, recuperación por email, importación masiva, exportación, reportes avanzados ni borrado automatizado por conservación. `ARCHIVED` es un estado, no una supresión. Solicitudes de derechos y vencimiento del plazo requieren un procedimiento administrativo real antes de operar.

Para rotar cifrado, diseñe primero lectura de claves antiguas por versión y un trabajo que descifre/re-cifre bajo control. No reemplace el secreto sin migrar los registros. Para HMAC, descifre con autorización, recalcule todos los valores bajo una ventana controlada y conserve unicidad antes de activar la nueva clave. La V1 proporciona un formato versionado pero no un comando de rotación.

## Verificación de esta entrega

Consulte `VALIDACION.md` para los resultados ejecutados. El lockfile fija las dependencias resueltas. Se incluyen overrides para `deepmerge-ts` y `effect` para evitar avisos transitivos presentes en las versiones fijadas por Prisma 6; generación, migración y pruebas se verificaron con esos overrides.

## Referencias técnicas

- [Express: seguridad](https://expressjs.com/en/advanced/best-practice-security/)
- [Prisma 6: migraciones](https://docs.prisma.io/docs/orm/v6/prisma-migrate/getting-started)

## Administrador local de desarrollo

Configure `DEV_ADMIN_EMAIL` y `DEV_ADMIN_PASSWORD` (mínimo 12 caracteres) en `backend/.env` y ejecute `npm run admin:dev`. Este comando exige `NODE_ENV=development`, crea o restablece explícitamente la cuenta ADMIN y revoca sus sesiones anteriores. No se ejecuta automáticamente con el seed, al arrancar ni al iniciar sesión. Las credenciales no están incluidas en los archivos de ejemplo.

En desarrollo se aceptan `localhost` y `127.0.0.1` con el mismo protocolo y puerto configurados en `FRONTEND_ORIGIN`. En producción se mantiene únicamente el origen exacto autorizado. Use el mismo host durante toda la sesión.

## Puertos y una sola ejecución local

Use una sola terminal, desde la raíz del proyecto, para ejecutar `npm run dev`. Manténgala abierta. Para reiniciar, detenga esa misma ejecución con Ctrl+C antes de volver a iniciarla.

- Frontend: `http://localhost:5173` (Vite tiene `port: 5173` y `strictPort: true`).
- API: puerto `3000` (`PORT` en `backend/.env`).
- Origen autorizado: `FRONTEND_ORIGIN=http://localhost:5173` en `backend/.env`.
- Cliente: `VITE_API_URL=/api` en `frontend/.env`; Vite reenvía `/api` al puerto 3000.

Si 5173 está ocupado, Vite debe detenerse con un aviso; no debe iniciar en 5174. Cierre la ejecución anterior, sin abrir una segunda copia. No lance `npm run dev` a la vez desde varias terminales o herramientas. Si cambia los puertos deliberadamente, actualice también `FRONTEND_ORIGIN` y el destino del proxy cuando corresponda, y reinicie ambos servidores.

## Catálogo local de seccionales

La migración `20260921000000_local_seccionales` carga 32 provincias y 174 seccionales del Excel. Ya no existe sincronización con servicios territoriales externos. El frontend obtiene los catálogos de nuestra API, respaldada por PostgreSQL, y muestra desplegables de provincias y seccionales relacionadas.

La aplicación de producción está alojada en DigitalOcean. Esta actualización utiliza su base de datos actual y sus variables de entorno existentes; no requiere otra base, proveedor ni esquema. La conexión de desarrollo local no identifica necesariamente la base de producción. Aplicar la migración desde el entorno de la aplicación en DigitalOcean, conservando su `DATABASE_URL`.

### Probar este cambio en local

Con Docker Desktop abierto, ejecutar desde la raíz del proyecto en una misma terminal. Estas variables afectan solamente a esa terminal y tienen prioridad sobre `backend/.env`; no cambian la conexión guardada ni la configuración de DigitalOcean.

```sh
export DATABASE_URL='postgresql://corriente:local-development-only@localhost:5432/corriente?schema=public'
export NODE_ENV=development
export CAPTCHA_PROVIDER=disabled
export FRONTEND_ORIGIN=http://localhost:5173
export PORT=3000
export VITE_API_URL=/api
export VITE_TURNSTILE_SITE_KEY=''
docker compose up -d --wait db
npm run db:generate
npm run db:deploy
npm run dev
```

Las claves de cifrado y los demás valores requeridos siguen cargándose de `backend/.env`. Abrir `http://localhost:5173`, seleccionar una provincia y elegir una de sus seccionales. Por ejemplo, en AZUA debe aparecer `6. TÁBARA ARRIBA`. Al cambiar de provincia se limpia la seccional seleccionada. No iniciar una segunda instancia si ya hay una ejecución de `npm run dev` abierta. El despliegue en DigitalOcean se realizará posteriormente, después de la prueba local.

Ejecutar `npm run db:generate`, `npm run db:deploy` y `npm run build`, y reiniciar backend y frontend juntos: los contratos usan ahora `seccionalId`, `seccionalIds` y `/public/seccionales?provinceId=UUID`.

Antes del despliegue, comprobar el historial con `prisma migrate status` desde `backend`. Si la instalación existente no tiene historial de Prisma, verificar su estructura antes de establecer la migración inicial como aplicada. No ejecutar un reset ni el SQL independiente de `outputs/` contra la aplicación existente. El despliegue debe aplicar únicamente las migraciones pendientes. Tras actualizar ambos servicios, comprobar el listado de provincias, la selección de seccionales, y el acceso de los líderes a sus registros.

Prisma expone `Seccional` y `LeaderSeccional`; las tablas físicas siguen siendo `municipalities` y `leader_municipalities`, con las columnas `municipality_id`, para conservar claves foráneas, UUID y relaciones. `n_seccional` es positivo y único dentro de una provincia. Su valor NULL identifica un municipio histórico sin correspondencia confirmada: no está disponible para nuevos registros, pero conserva registros, escuelas y permisos anteriores. Las coincidencias exactas de nombre dentro de una provincia reutilizan el UUID. Revisar las correspondencias restantes explícitamente, sin asignar escuelas ni ampliar permisos por semejanza de nombres.

Se agrupan Santiago I y II en Santiago; se conservan los nombres del archivo. Para reutilizar provincias previas se comparan sin tildes y se reconocen los alias VALVERDE MAO/VALVERDE y SANCHE RAMÍREZ/SÁNCHEZ RAMÍREZ. Las provincias duplicadas equivalentes impiden aplicar la migración hasta su revisión. El SQL independiente de `outputs/` es una referencia; en esta aplicación se utiliza la migración Prisma y no se crean catálogos paralelos.

Consulta de conciliación (solo metadatos):
```sql
SELECT p.name AS provincia, m.id, m.name AS municipio_historico
FROM municipalities m JOIN provinces p ON p.id = m.province_id
WHERE m.n_seccional IS NULL ORDER BY p.name, m.name;
```
