# API Whatsapp & Dashboard Administrativo

Este proyecto es una solución integral para la gestión de pedidos y clientes a través de una integración con la API de WhatsApp (Meta) y un panel administrativo web. Permite recibir comprobantes de pago, gestionar estados de suscripción y exportar reportes detallados.

## 🚀 Contexto del Proyecto

El sistema actúa como un backend robusto que centraliza la interacción con clientes de WhatsApp y formularios de aterrizaje (Landing Pages). Su objetivo principal es automatizar la recepción de pedidos, la validación de comprobantes y el seguimiento de clientes recurrentes.

### 🛠️ Tecnologías Principales

- **React & Vite**: Frontend moderno con componentes reutilizables.
- **Tailwind CSS & Framer Motion**: Estilizado premium y animaciones fluidas.
- **Node.js & Express**: Servidor web y API REST.
- **Sequelize (ORM)**: Gestión de base de datos MySQL.
- **Meta WhatsApp Cloud API**: Recepción y procesamiento de mensajes automáticos.

---

## 📂 Estructura del Proyecto

```text
API_Whatsapp/
├── backend/            # Lógica de servidor y API
│   ├── controllers/    # Lógica de negocio
│   ├── models/         # Modelos de base de datos
│   ├── routes/         # Endpoints de la API
│   └── app.js          # Punto de entrada del backend
├── frontend/           # Aplicación React (Vite)
│   ├── src/            # Componentes y páginas
│   ├── public/         # Activos estáticos del frontend
│   └── index.html      # Punto de entrada del cliente
├── database/           # Scripts y configuración de DB
├── .env                # Variables de entorno
└── package.json        # Dependencias raíz
```

---

## ⚙️ Configuración e Instalación

### 1. Requisitos Previos
- **Node.js** (v18 o superior)
- **MySQL** (Local o Remoto)
- Cuenta de desarrollador en **Meta (Facebook Developers)** para WhatsApp Cloud API.

### 2. Instalación
```bash
npm install
```

### 3. Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz con el siguiente formato:
```env
PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_NAME=api_whatsapp_db
# Meta WhatsApp API (Opcional para pruebas locales de webhook)
WHATSAPP_TOKEN=tu_token_de_meta
VERIFY_TOKEN=token_definido_en_meta
```

### 4. Ejecución
```bash
# Modo Desarrollo (con auto-recarga)
npm run dev

# Modo Producción
npm start
```

---

## 📱 Flujo de Trabajo

### A. Recepción de Pedidos
1. El cliente llena el formulario en la **Landing Page**.
2. Sube su **comprobante de pago** (imagen/PDF).
3. El sistema crea o actualiza al **Cliente** y registra el **Comprobante** en la base de datos.

### B. Dashboard Administrativo (`/admin`)
- **Gestión de Comprobantes**: Ver lista de pagos, cambiar estados (Pendiente, Aprobado, Rechazado).
- **Control de Clientes**: Visualizar base de datos de usuarios y su estado de actividad.
- **Suscripciones**: Seguimiento detallado de planes activos.
- **Exportación**: Botones para descargar reportes en **Excel** y **PDF**.

### C. Webhook de WhatsApp
- Escucha mensajes entrantes de Meta.
- Procesa interacciones automáticas para responder a clientes o notificar estados de pedidos.

---

## 🛠️ Endpoints de la API

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/orders` | Crea un nuevo pedido con comprobante. |
| `GET` | `/api/admin/stats` | Obtiene estadísticas generales del dashboard. |
| `GET` | `/api/admin/comprobantes` | Lista todos los pagos recibidos. |
| `GET` | `/api/admin/clientes` | Lista la base de datos de clientes. |
| `GET` | `/api/admin/export/daily.xlsx` | Descarga reporte diario en Excel. |
| `POST` | `/api/admin/comprobantes/:id/status` | Actualiza el estado de un pago. |

---

## 🎨 Notas de Diseño
El frontend utiliza un enfoque de **Rich Aesthetics**:
- **Glassmorphism** en tarjetas y modales.
- **Dark Mode** optimizado para visualización prolongada.
- **Micro-animaciones** para feedback visual en acciones del administrador.

---

## 🤝 Soporte
Para reportar errores o solicitar nuevas funcionalidades, revisa la sección de logs en la consola o contacta al desarrollador principal.
