# WordWork API — Backend

API REST de WordWork, desarrollada como trabajo integrador final de la Diplomatura en Desarrollo Web de UTN.

El backend administra usuarios, autenticación, verificación de correo, perfiles, conversaciones privadas, grupos y mensajes. Utiliza una arquitectura en capas para separar HTTP, reglas de negocio y acceso a datos.

## Tecnologías

- Node.js
- Express 5
- MongoDB y Mongoose
- bcrypt
- JSON Web Token
- Nodemailer
- dotenv
- CORS
- Node Test Runner

## Funcionalidades

- Registro con contraseña hasheada mediante bcrypt.
- Verificación de correo con enlace JWT de 24 horas.
- Reenvío de verificación con límite de un envío por minuto.
- Inicio de sesión mediante Bearer JWT con expiración.
- Perfiles de usuario y estados de presencia.
- Listado de usuarios con correo verificado.
- Chats privados únicos entre dos usuarios.
- Grupos de hasta 50 integrantes.
- Roles de administrador y miembro.
- Edición de nombre, descripción e imagen del grupo.
- Incorporación y expulsión de integrantes.
- Mensajes con estados de entrega y lectura.
- Búsqueda de mensajes.
- Validación estricta de entradas y manejo centralizado de errores.
- Pruebas automatizadas sin utilizar la base de desarrollo.

## Arquitectura

```text
routes → controllers → services → repositories → models
```

```text
src/
├── config/         # Entorno y conexión con MongoDB
├── controllers/    # Manejo de request y response
├── middleware/     # JWT, validaciones y errores
├── mappers/        # Respuestas públicas de la API
├── models/         # Esquemas de Mongoose
├── repositories/   # Consultas y persistencia
├── routes/         # Definición de endpoints
├── services/       # Reglas de negocio
├── utils/          # JWT y errores de aplicación
├── app.js          # Configuración de Express
└── main.js         # Conexión e inicio del servidor
```

Los controladores no contienen consultas de MongoDB. Los servicios aplican las reglas de negocio y los repositorios concentran el acceso a la base.

## Requisitos

- Node.js 24 recomendado, versión utilizada para desarrollo y pruebas.
- npm.
- MongoDB local o un clúster de MongoDB Atlas.
- Cuenta SMTP para enviar correos reales.

## Instalación

```bash
git clone <URL_DEL_REPOSITORIO_BACKEND>
cd backend
npm install
```

Copiar `.env.example` como `.env`, completar las variables y ejecutar:

```bash
npm run dev
```

La API estará disponible normalmente en `http://localhost:3000`.

## Variables de entorno

| Variable | Obligatoria | Ejemplo | Descripción |
|---|---:|---|---|
| `NODE_ENV` | Sí | `development` | Entorno de ejecución |
| `PORT` | Sí | `3000` | Puerto HTTP |
| `MONGO_URI` | Sí | `mongodb://127.0.0.1:27017/wordwork` | Conexión con MongoDB |
| `JWT_SECRET` | Sí | valor aleatorio largo | Firma de tokens; nunca publicarlo |
| `JWT_EXPIRES_IN` | Sí | `1d` | Duración del token de acceso |
| `FRONTEND_URL` | Sí | `http://localhost:5173` | Origen permitido por CORS y redirección |
| `BACKEND_URL` | Sí | `http://localhost:3000` | Base de los enlaces de verificación |
| `SMTP_HOST` | Para email real | `smtp.gmail.com` | Servidor SMTP |
| `SMTP_PORT` | Para email real | `587` | Puerto SMTP |
| `SMTP_SECURE` | Para email real | `false` | `true` normalmente para puerto 465 |
| `SMTP_USER` | Para email real | cuenta SMTP | Usuario SMTP |
| `SMTP_PASS` | Para email real | contraseña de aplicación | Contraseña SMTP |
| `MAIL_FROM` | Para email real | `WordWork <correo@dominio.com>` | Remitente visible |

Si SMTP no está configurado y `NODE_ENV=development`, el enlace de verificación se imprime en la terminal. En producción, las variables SMTP deben estar completas.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor con recarga automática |
| `npm start` | Inicia el servidor en producción |
| `npm run check` | Comprueba la sintaxis y carga de módulos |
| `npm test` | Ejecuta las pruebas una vez |
| `npm run test:watch` | Ejecuta las pruebas al detectar cambios |

## Autenticación

Las rutas privadas requieren el encabezado:

```http
Authorization: Bearer <access_token>
```

El token se obtiene mediante `POST /api/auth/login`. Tiene un propósito `access` y la expiración configurada en `JWT_EXPIRES_IN`.

## Formato de respuestas

Respuesta correcta:

```json
{
  "ok": true,
  "message": "Operación realizada.",
  "data": {}
}
```

Respuesta de error:

```json
{
  "ok": false,
  "message": "Descripción del error."
}
```

Estados habituales: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `413` y `500`.

## Endpoints

### Estado

| Método | Ruta | Auth | Descripción |
|---|---|---:|---|
| GET | `/api/health` | No | Comprueba el estado de la API |

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---:|---|
| POST | `/api/auth/register` | No | Registra y envía la verificación |
| POST | `/api/auth/resend-verification` | No | Reenvía el enlace si la cuenta está pendiente |
| GET | `/api/auth/verify-email?token=...` | No | Verifica el correo y redirige al frontend |
| POST | `/api/auth/login` | No | Valida credenciales y devuelve JWT |

Registro:

```json
{
  "display_name": "Ana Pérez",
  "email": "ana@example.com",
  "password": "ClaveSegura2026!"
}
```

Reenvío:

```json
{
  "email": "ana@example.com"
}
```

Login:

```json
{
  "email": "ana@example.com",
  "password": "ClaveSegura2026!"
}
```

### Usuarios y perfil

| Método | Ruta | Auth | Descripción |
|---|---|---:|---|
| GET | `/api/users?q=ana` | Sí | Lista y busca usuarios verificados |
| GET | `/api/users/me` | Sí | Obtiene el perfil propio |
| PATCH | `/api/users/me` | Sí | Actualiza el perfil |
| POST | `/api/users/me/presence` | Sí | Actualiza la última conexión |

Actualización de perfil; todos los campos son opcionales, pero debe enviarse al menos uno:

```json
{
  "display_name": "Ana Pérez",
  "bio": "Disponible para conversar",
  "avatar_url": "https://example.com/avatar.jpg",
  "availability": "available"
}
```

Valores permitidos de `availability`: `available`, `busy` y `away`.

### Conversaciones y grupos

| Método | Ruta | Auth | Descripción |
|---|---|---:|---|
| GET | `/api/conversations` | Sí | Lista conversaciones y último mensaje |
| POST | `/api/conversations/private` | Sí | Crea o recupera un chat privado |
| POST | `/api/conversations/groups` | Sí | Crea un grupo |
| PATCH | `/api/conversations/:conversationId/group` | Sí, admin | Actualiza el grupo |
| POST | `/api/conversations/:conversationId/group/members` | Sí, admin | Agrega un integrante |
| DELETE | `/api/conversations/:conversationId/group/members/:userId` | Sí, admin | Expulsa un integrante |
| PATCH | `/api/conversations/:conversationId/group/members/:userId/role` | Sí, admin | Cambia el rol |

Chat privado:

```json
{
  "user_id": "507f1f77bcf86cd799439011"
}
```

Crear grupo:

```json
{
  "name": "Equipo WordWork",
  "member_ids": [
    "507f1f77bcf86cd799439011",
    "507f191e810c19729de860ea"
  ]
}
```

Actualizar grupo:

```json
{
  "name": "Nuevo nombre",
  "description": "Descripción del grupo",
  "avatar_url": "https://example.com/group.jpg"
}
```

Agregar integrante:

```json
{
  "user_id": "507f1f77bcf86cd799439011"
}
```

Cambiar rol:

```json
{
  "role": "admin"
}
```

Los roles permitidos son `admin` y `member`. Un grupo admite hasta 50 integrantes y siempre debe conservar al menos un administrador.

### Mensajes

| Método | Ruta | Auth | Descripción |
|---|---|---:|---|
| GET | `/api/conversations/:conversationId/messages?limit=50` | Sí | Obtiene de 1 a 100 mensajes |
| GET | `/api/conversations/:conversationId/messages/search?q=texto` | Sí | Busca mensajes en la conversación |
| POST | `/api/conversations/:conversationId/messages` | Sí | Envía un mensaje |

Enviar mensaje:

```json
{
  "content": "Hola, ¿cómo estás?"
}
```

Solo los integrantes pueden leer o enviar mensajes. El contenido admite hasta 2000 caracteres.

## Validaciones y seguridad

- Hash bcrypt con 12 rondas.
- Contraseñas de 8 caracteres como mínimo y hasta 72 bytes.
- JWT con firma, propósito y expiración.
- Tokens de verificación válidos durante 24 horas.
- CORS restringido a `FRONTEND_URL`.
- Límite de cuerpo JSON de 20 KB.
- Validación de ObjectId, email, URLs HTTP/HTTPS, longitudes y campos permitidos.
- Rutas sensibles protegidas por JWT.
- Errores internos sin detalles técnicos en la respuesta.
- Respuesta neutral en el reenvío para reducir enumeración de cuentas.
- Variables sensibles fuera del repositorio mediante `.env`.

## Pruebas automatizadas

```bash
npm test
```

La suite utiliza el runner integrado de Node y no se conecta con MongoDB. Comprueba rutas, validaciones, límites, errores HTTP y seguridad JWT.

Resultado actual:

```text
22 pruebas aprobadas
0 fallidas
```

## Colección de Postman

La carpeta `postman/` contiene:

- `WordWork.postman_collection.json`: todos los endpoints organizados por módulo.
- `WordWork.local.postman_environment.json`: variables para desarrollo local.

Para utilizarla:

1. Importar ambos archivos en Postman.
2. Seleccionar el entorno `WordWork Local`.
3. Completar `user_id` y `member_id` con usuarios verificados.
4. Ejecutar `Iniciar sesión`; el script guardará automáticamente `access_token` y `current_user_id`.
5. Abrir o crear una conversación para guardar automáticamente `conversation_id`.

Para probar la API desplegada, cambiar `base_url` por la URL pública del backend.

## Despliegue

El backend puede desplegarse en Render:

1. Crear un Web Service conectado al repositorio.
2. Usar `npm install` como comando de instalación.
3. Usar `npm start` como comando de inicio.
4. Configurar todas las variables de entorno.
5. Usar MongoDB Atlas y permitir la conexión desde Render.
6. Establecer `BACKEND_URL` con la URL pública de Render.
7. Establecer `FRONTEND_URL` con la URL pública de Vercel.

También se incluye `render.yaml` para crear el servicio como Blueprint. Render genera `JWT_SECRET`, utiliza `/api/health` como health check y solicita los valores secretos durante la creación. `BACKEND_URL` es opcional en Render porque la API utiliza automáticamente `RENDER_EXTERNAL_URL`.

## Enlaces de entrega

- API desplegada: https://wordwork-backend.onrender.com
- Frontend desplegado: https://wordwork-frontend.vercel.app
- Repositorio frontend: https://github.com/guillermosarnacchiaro/WordWork-frontend

## Usuario de prueba

Crear estas credenciales en la base de producción y verificar su correo antes de entregar:

```text
Correo: pendiente
Contraseña: pendiente
```

## Seguridad del repositorio

Nunca subir `.env`, `MONGO_URI`, `JWT_SECRET`, `SMTP_PASS` ni credenciales reales. El archivo `.env.example` contiene únicamente nombres y valores de ejemplo.
