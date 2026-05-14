const { processIncomingMessage } = require('../utils/botLogic');
const { markMessageAsRead } = require('../services/whatsapp.service');

// Controlador para verificar el Webhook (Requisito de Meta)
const verifyWebhook = (req, res) => {
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

    // Parsear los parámetros que envía Meta
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Comprobar si existe modo y token
    if (mode && token) {
        // Verificar si el modo y el token coinciden con nuestros datos
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ WEBHOOK VERIFICADO CORRECTAMENTE POR META');
            res.status(200).send(challenge);
        } else {
            // El token no coincide
            res.sendStatus(403);
        }
    } else {
        res.status(400).send('Faltan parámetros');
    }
};

// Controlador para recibir y procesar los mensajes
const processMessage = async (req, res) => {
    try {
        const body = req.body;

        // Comprobar si es un evento de WhatsApp API
        if (body.object === 'whatsapp_business_account') {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const message = body.entry[0].changes[0].value.messages[0];
                const senderId = message.from; // Número de teléfono del cliente
                const messageId = message.id;

                console.log(`📩 Mensaje recibido de: ${senderId}`);

                // Marcar el mensaje como leído (Buena práctica)
                await markMessageAsRead(messageId);

                // Pasar el mensaje a nuestra lógica del bot
                await processIncomingMessage(message, senderId);
            }
            // Siempre devolver 200 OK a Meta rápido para evitar reintentos
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('❌ Error procesando el mensaje:', error);
        res.sendStatus(500);
    }
};

module.exports = {
    verifyWebhook,
    processMessage
};
