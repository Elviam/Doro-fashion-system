# D'oro Fashion System

ERP para la gestión de productos, inventario por talla, ventas, proveedores y reabastecimiento.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Una base PostgreSQL; el desarrollo actual usa Neon.

## Configuración local

1. Instala las dependencias:

   ```powershell
   cd backend
   npm install
   cd ..\frontend
   npm install
   ```

2. Copia los archivos de ejemplo y completa los valores reales:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

   En `backend/.env`, usa una URL directa para migraciones y una URL pooled para la aplicación:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler/DB?sslmode=require"
   DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
   PORT=3000
   JWT_SECRET="cambia-este-secreto"
   JWT_REFRESH_SECRET="cambia-este-secreto-tambien"
   ```

   En Windows no incluyas `channel_binding=require`: TLS continúa protegido por `sslmode=require` y la configuración del proyecto descarta ese parámetro incompatible con el motor nativo de Prisma.

3. Aplica las migraciones **solo a tu base de desarrollo** y carga los roles/permisos iniciales:

   ```powershell
   cd backend
   npm run prisma:generate
   npm run prisma:migrate:dev
   npm run prisma:seed
   ```

   Para un entorno desplegado usa `npm run prisma:migrate:deploy`, nunca `migrate dev`.

4. Inicia ambos servicios en terminales separadas:

   ```powershell
   # Terminal 1
   cd backend
   npm run dev

   # Terminal 2
   cd frontend
   npm run dev
   ```

## Verificación

- API: `GET http://localhost:3000/api/health` devuelve el estado y la hora del servidor.
- Migraciones: `cd backend; npm run prisma:status`.
- Frontend: `cd frontend; npm run build`.

## Base de datos y seed

Las migraciones se guardan en `backend/prisma/migrations` y se aplican en orden desde una base vacía. Las migraciones y el seed usan `DIRECT_URL`; la API usa `DATABASE_URL`. El seed crea o actualiza los permisos de recepciones y deja:

- `ADMIN`: todos los permisos de recepciones.
- `BODEGUERO`: `recepciones:read` y `recepciones:confirm`.

El seed no crea cuentas con contraseñas conocidas. Para la primera cuenta administrativa usa `npm run seed:first-user`.
