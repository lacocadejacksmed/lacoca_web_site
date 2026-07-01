require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const xssMiddleware = require("./utils/xss.middleware");
const { connectDB, sequelize } = require("./config/database");
const webhookRoutes = require("./routes/webhook.routes");
const apiRoutes = require("./routes/api.routes");
const { initCronJobs } = require("./cron");

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// MEDIDAS DE SEGURIDAD (BEST PRACTICES)
// ==========================================
// 1. Helmet: Protege cabeceras HTTP
app.use(helmet());

// 2. CORS: Permitir peticiones solo de orígenes confiables (Frontend local y Producción)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.lacocadejacks.com',
  'https://lacocadejacks.com'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

// 3. Rate Limiting Global: Prevenir ataques de fuerza bruta general y DDoS (100 req por 15 min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo después de 15 minutos.' }
});
app.use('/api', limiter);

// Middleware para parsear JSON
app.use(express.json());

// 4. HPP: Prevenir HTTP Parameter Pollution
app.use(hpp());

// 5. XSS Clean: Sanitizar body, query y params de ataques Cross-Site Scripting
app.use(xssMiddleware);

// Middleware para servir archivos estáticos del backend (si los hay)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas base
app.use("/webhook", webhookRoutes);
app.use("/api", apiRoutes);

// 404 para rutas de API no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// 6. Global Error Handler: Prevenir filtración de Stack Traces en Producción
app.use((err, req, res, next) => {
  console.error("Error Global:", err);
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({ 
      success: false, 
      message: err.message && err.status ? err.message : "Error interno del servidor. Por favor intenta de nuevo más tarde." 
    });
  } else {
    // En desarrollo, enviar el stack trace para debuggear
    res.status(err.status || 500).json({ success: false, message: err.message, stack: err.stack });
  }
});

// Iniciar servidor y conectar a DB
const startServer = async () => {
  try {
    await connectDB();

    // Sincronizar modelos con la base de datos
    const alterDB = process.env.NODE_ENV !== 'production';
    await sequelize.sync({ alter: alterDB });
    console.log(`✅ Modelos sincronizados con la base de datos (alter: ${alterDB}).`);

    initCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
      console.log(
        `📡 Esperando conexión con Meta en http://localhost:${PORT}/`,
      );
    });
  } catch (error) {
    console.error("❌ Error fatal al iniciar el servidor:");
    if (error.name === "SequelizeConnectionRefusedError") {
      console.error(
        "No se pudo conectar a PostgreSQL. Asegúrate de que el servicio de base de datos esté iniciado y las credenciales sean correctas.",
      );
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

startServer();
