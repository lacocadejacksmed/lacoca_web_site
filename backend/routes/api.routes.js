const express = require("express");
const orderController = require("../controllers/order.controller");
const adminController = require("../controllers/admin.controller");
const menuController = require("../controllers/menu.controller");
const authController = require("../controllers/auth.controller");
const { protect, admin } = require("../utils/auth.middleware");

const router = express.Router();

// Autenticación
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", protect, authController.getMe);
router.get("/client/suscripciones", protect, authController.getMySubscriptions);

// Rutas Públicas (Landing Page)
router.post("/orders", orderController.upload.single("comprobante"), orderController.createOrder);
router.get("/availability", orderController.getAvailability);
router.get("/check-client/:cedula", orderController.checkClient);
router.get("/feriados", adminController.getFeriados);
router.get("/menu", menuController.getMenu);
router.get("/cobertura", adminController.getCoverage); // Nueva ruta pública
router.get("/geocode", orderController.geocodeAddress); // Proxy para Nominatim

// Rutas Administrativas (Protegidas)
router.get("/admin/stats", [protect, admin], adminController.getStats);
router.get("/admin/comprobantes", [protect, admin], adminController.getComprobantes);
router.get("/admin/comprobantes/:id", [protect, admin], adminController.getComprobanteById);
router.post("/admin/comprobantes/:id/estado", [protect, admin], adminController.updateComprobanteStatus);
router.get("/admin/cupos", [protect, admin], adminController.getCupos);
router.get("/admin/clientes", [protect, admin], adminController.getClientes);
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

// Cobertura (Zonas Geográficas)
router.get("/admin/cobertura", [protect, admin], adminController.getCoverage);
router.post("/admin/cobertura", [protect, admin], adminController.updateCoverage);

// Menú Semanal (Administración)
router.get("/admin/menus", [protect, admin], menuController.getMenus);
router.post("/admin/menu", [protect, admin, orderController.upload.single("menu_image")], menuController.updateMenu);

module.exports = router;
