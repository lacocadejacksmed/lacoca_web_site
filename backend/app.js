require("dotenv").config();
const express = require("express");
const path = require("path");
const { connectDB, sequelize } = require("./config/database");
const webhookRoutes = require("./routes/webhook.routes");
const apiRoutes = require("./routes/api.routes");
const { initCronJobs } = require("./cron");

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Habilitar CORS básico y responder preflight (OPTIONS)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Middleware para servir archivos estáticos del backend (si los hay)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas base
app.use("/webhook", webhookRoutes);
app.use("/api", apiRoutes);

// 404 para rutas de API no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
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
