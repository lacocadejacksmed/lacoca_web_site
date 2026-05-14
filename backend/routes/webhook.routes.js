const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Ruta GET para la verificación inicial de Meta
router.get('/', webhookController.verifyWebhook);

// Ruta POST para recibir mensajes de WhatsApp
router.post('/', webhookController.processMessage);

module.exports = router;
