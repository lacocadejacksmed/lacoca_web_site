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

// Middleware para servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas base
app.use("/webhook", webhookRoutes);
app.use("/api", apiRoutes);

// Catch-all para React Router (SPA)
app.use((req, res) => {
  const indexPath = path.join(__dirname, "../frontend/dist/index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send("Frontend build not found. Please run 'npm run build' in the frontend directory.");
    }
  });
});

// Iniciar servidor y conectar a DB
const startServer = async () => {
  try {
    await connectDB();

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log("✅ Modelos sincronizados con la base de datos.");
    
    initCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
      console.log(
        `📡 Esperando conexión con Meta en http://localhost:${PORT}/webhook`,
      );
    });
  } catch (error) {
    console.error("❌ Error fatal al iniciar el servidor:");
    if (error.name === "SequelizeConnectionRefusedError") {
      console.error(
        "No se pudo conectar a MySQL. Asegúrate de que el servicio de MySQL esté iniciado.",
      );
      console.error("Si usas Windows, verifica que el servicio 'MYSQL80' esté en ejecución.");
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

startServer();
