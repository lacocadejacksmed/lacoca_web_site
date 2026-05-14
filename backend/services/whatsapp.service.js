const axios = require('axios');

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// Función genérica para enviar peticiones a Meta
const sendToMeta = async (data) => {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.PHONE_NUMBER_ID;

    if (!token || !phoneId) {
        console.error('❌ Faltan credenciales (Token o ID del teléfono) en el .env');
        return;
    }

    try {
        const response = await axios({
            method: 'POST',
            url: `${BASE_URL}/${phoneId}/messages`,
            data: data,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando mensaje a Meta:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Marcar un mensaje como leído
const markMessageAsRead = async (messageId) => {
    const data = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
    };
    return sendToMeta(data);
};

// Enviar texto simple
const sendTextMessage = async (to, text) => {
    const data = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
            preview_url: true,
            body: text
        }
    };
    return sendToMeta(data);
};

// Enviar botones interactivos (Máximo 3 botones)
const sendInteractiveButtons = async (to, textBody, buttons) => {
    // Formatear los botones al estándar de Meta
    const formattedButtons = buttons.map(btn => ({
        type: 'reply',
        reply: {
            id: btn.id,
            title: btn.title
        }
    }));

    const data = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: textBody
            },
            action: {
                buttons: formattedButtons
            }
        }
    };
    return sendToMeta(data);
};

module.exports = {
    sendTextMessage,
    sendInteractiveButtons,
    markMessageAsRead
};
