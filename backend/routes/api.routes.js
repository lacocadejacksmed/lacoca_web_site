const express = require("express");
const orderController = require("../controllers/order.controller");
const adminController = require("../controllers/admin.controller");
const menuController = require("../controllers/menu.controller");
const authController = require("../controllers/auth.controller");
const { protect, admin } = require("../utils/auth.middleware");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Límite estricto para Login (Evitar ataques de fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: { success: false, message: 'Demasiados intentos de inicio de sesión, por favor intenta de nuevo en 15 minutos.' }
});

// Autenticación
router.post("/auth/register", authController.register);
router.post("/auth/login", loginLimiter, authController.login);
router.post("/auth/google", loginLimiter, authController.googleLogin);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);
router.get("/auth/me", protect, authController.getMe);
router.put("/auth/me", protect, authController.updateProfile);
router.get("/client/suscripciones", protect, authController.getMySubscriptions);

// Rutas Públicas (Landing Page)
router.post("/orders", orderController.upload.single("comprobante"), orderController.createOrder);
router.get("/availability", orderController.getAvailability);
router.get("/check-client/:cedula", orderController.checkClient);
router.get("/feriados", adminController.getFeriados);
router.get("/menu", menuController.getMenu);
router.get("/planes", adminController.getPlanes);
router.get("/cobertura", adminController.getCoverage); // Nueva ruta pública
router.get("/geocode", orderController.geocodeAddress); // Proxy para Nominatim

// Rutas Administrativas (Protegidas)
router.get("/admin/stats", [protect, admin], adminController.getStats);
router.get("/admin/dashboard-stats", [protect, admin], adminController.getDashboardStats);
router.get("/admin/strategy-stats", [protect, admin], adminController.getStrategyStats);
router.get("/admin/comprobantes", [protect, admin], adminController.getComprobantes);
router.get("/admin/comprobantes/:id", [protect, admin], adminController.getComprobanteById);
router.post("/admin/comprobantes/:id/estado", [protect, admin], adminController.updateComprobanteStatus);
router.get("/admin/cupos", [protect, admin], adminController.getCupos);
router.get("/admin/clientes", [protect, admin], adminController.getClientes);
router.post("/admin/clientes/manual", [protect, admin], adminController.createClienteManual);
router.put("/admin/clientes/:cedula/full", [protect, admin], adminController.updateClienteFull);
router.put("/admin/clientes/:cedula", [protect, admin], adminController.updateCliente);
router.get("/admin/suscripciones", [protect, admin], adminController.getSubscriptions);
router.get("/admin/suscripciones/:id", [protect, admin], adminController.getSubscriptionById);
router.put("/admin/suscripciones/:id", [protect, admin], adminController.updateSubscription);
router.delete("/admin/clientes/:cedula/desactivar", [protect, admin], adminController.deactivateCliente);
router.get("/admin/repartidores", [protect, admin], adminController.getRepartidores);
router.post("/admin/asignar-repartidor", [protect, admin], adminController.assignRepartidor);

// Reportes
router.get("/admin/exportar/diario.xlsx", [protect, admin], adminController.exportDailyExcel);
router.get("/admin/exportar/diario.pdf", [protect, admin], adminController.exportDailyPdf);

// Feriados
router.get("/admin/feriados", [protect, admin], adminController.getFeriados);
router.post("/admin/feriados", [protect, admin], adminController.addFeriado);
router.delete("/admin/feriados/:id", [protect, admin], adminController.deleteFeriado);
router.post("/admin/feriados/toggle", [protect, admin], adminController.toggleFeriado);

// Cobertura (Zonas Geográficas)
router.get("/admin/cobertura", [protect, admin], adminController.getCoverage);
router.post("/admin/cobertura", [protect, admin], adminController.updateCoverage);

// Menú Semanal (Administración)
router.get("/admin/menus", [protect, admin], menuController.getMenus);
router.post("/admin/menu", [protect, admin, orderController.upload.single("menu_image")], menuController.updateMenu);

// Configuraciones
router.get("/admin/configuraciones", [protect, admin], adminController.getConfiguraciones);
router.post("/admin/configuraciones", [protect, admin], adminController.upsertConfiguracion);
router.delete("/admin/configuraciones/:clave", [protect, admin], adminController.deleteConfiguracion);

// Planes (Administración)
router.get("/admin/planes", [protect, admin], adminController.getAllPlanesAdmin);
router.post("/admin/planes", [protect, admin], adminController.upsertPlan);
router.delete("/admin/planes/:id", [protect, admin], adminController.deletePlan);

module.exports = router;
