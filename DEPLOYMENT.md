# Contexto de Despliegue - La Coca de Jacks

Este documento provee un resumen de la arquitectura, tecnologías y variables de entorno necesarias para el correcto despliegue del proyecto en entornos de producción (como Render, Heroku, Railway o VPS).

---

## 1. Arquitectura y Stack Tecnológico

El proyecto sigue una arquitectura clásica Cliente-Servidor separada en dos carpetas principales: `frontend` y `backend`.

### Frontend
- **Framework**: React + Vite
- **Estilos**: TailwindCSSl
- **Comportamiento**: Realiza peticiones HTTP (Axios/Fetch) al backend utilizando la variable de entorno con la URL de la API o proxys en desarrollo.
- **Despliegue sugerido**: Vercel, Netlify, o Render (como sitio estático o SPA).
- **Manejo de Imágenes**: Las imágenes dinámicas que renderiza (como comprobantes de pago o menús) las espera en formato URL HTTP absoluto desde Cloudinary.

### Backend
- **Entorno**: Node.js + Express
- **Base de Datos**: PostgreSQL (`pg`) administrado mediante el ORM Sequelize. *(Nota: Aunque en algunas configuraciones anteriores puede haber referencias a MySQL, el dialecto configurado en código es `postgres`)*.
- **Manejo de Imágenes**: Cloudinary + Multer. Todas las subidas de imágenes se envían directamente a la cuenta de Cloudinary mediante `multer-storage-cloudinary`.
- **Integraciones Clave**:
  - **WhatsApp API / Meta**: Uso de webhooks y tokens para mensajería y automatizaciones.
  - **Autenticación**: JWT (JSON Web Tokens).
  - **Utilidades adicionales**: Generación de PDF (`pdfkit`), manipulación de Excel (`exceljs`), envíos de correo (`resend`).
- **Despliegue sugerido**: Render (Web Service), Railway o Heroku.

---

## 2. Variables de Entorno Requeridas (Backend)

Para que el backend funcione en producción, es necesario configurar las siguientes variables de entorno en el panel de control de tu proveedor de hosting:

### Configuración del Servidor y Base de Datos
- `NODE_ENV`: Debe estar establecido en `production`.
- `PORT`: Generalmente proporcionado automáticamente por la plataforma de hosting (ej: Render lo inyecta).
- `DATABASE_URL`: Cadena de conexión completa a tu base de datos PostgreSQL.  
  *(Formato común: `postgres://usuario:contraseña@host:puerto/basedatos`)*

### Configuración de Seguridad y JWT
- `JWT_SECRET`: Una cadena de texto larga, aleatoria y muy segura para firmar los tokens de las sesiones de los administradores.

### Configuración de WhatsApp / Meta
- `WEBHOOK_VERIFY_TOKEN`: Un token personalizado que tú eliges para validar el webhook desde el panel de Meta.
- `WHATSAPP_TOKEN`: El token de acceso permanente generado en la consola de Meta for Developers.
- `PHONE_NUMBER_ID`: El identificador único del número telefónico de tu bot.

### Configuración de Almacenamiento de Imágenes (Cloudinary)
- `CLOUDINARY_CLOUD_NAME`: El nombre asignado a tu cuenta de Cloudinary.
- `CLOUDINARY_API_KEY`: Tu clave de API de Cloudinary.
- `CLOUDINARY_API_SECRET`: Tu secreto de API de Cloudinary.

> [!WARNING]
> Nunca subas el archivo `.env` o las claves reales a repositorios públicos como GitHub. El archivo `.env.example` funciona como plantilla para saber qué variables existen, pero los valores reales solo deben existir en tu máquina local o en el panel de "Environment Variables" de tu hosting.

---

## 3. Consideraciones para el Frontend en Producción

### Comunicación Frontend -> Backend
Durante el desarrollo local (Vite), el frontend usa un **proxy** (definido en `vite.config.js`) para redirigir las peticiones `/api` al backend (`http://localhost:3000`). 

En **producción**, este proxy de Vite **NO funcionará**. Debes asegurarte de:
1. Configurar una variable de entorno en el frontend (por ejemplo, `VITE_API_URL`) que apunte a la URL pública de tu backend desplegado (ej. `https://lacocadejacks-api.onrender.com`).
2. Actualizar la configuración de tu instancia de Axios en el frontend para que use esa variable de entorno en lugar de hacer peticiones relativas (`/api/...`).

### Redirecciones de Rutas (SPA)
Dado que usas React (una Single Page Application), si despliegas en servicios como Vercel o Netlify, debes configurar un archivo de redirección (como `vercel.json` o `_redirects`) para que todas las rutas sean redirigidas al `index.html`. De lo contrario, al recargar páginas específicas o entrar por un link directo, obtendrás un error 404.

---

## 4. Pasos Generales de Despliegue

1. **Base de Datos**: Crear una instancia de PostgreSQL en la nube (Render, Supabase, Neon, etc.) y copiar la `DATABASE_URL`.
2. **Backend**: 
   - Crear un "Web Service" en tu proveedor (ej. Render).
   - Vincular el repositorio y establecer el directorio raíz como `backend`.
   - Comando de instalación: `npm install`
   - Comando de inicio: `npm start` (o `node app.js`)
   - Agregar TODAS las variables de entorno mencionadas anteriormente.
3. **Frontend**:
   - Crear un "Static Site" en tu proveedor (ej. Vercel o Render).
   - Vincular el repositorio y establecer el directorio raíz como `frontend`.
   - Comando de build: `npm run build`
   - Configurar la variable de la URL del backend (`VITE_API_URL`).
4. **Verificación**: Realizar una compra de prueba y verificar que los comprobantes suban a Cloudinary, las validaciones funcionen y se guarden los datos en PostgreSQL.
