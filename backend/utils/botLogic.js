const { sendTextMessage, sendInteractiveButtons } = require('../services/whatsapp.service');

// Lógica principal para procesar el mensaje entrante
const processIncomingMessage = async (message, senderId) => {
    try {
        // Verificar si es un mensaje de texto normal
        if (message.type === 'text') {
            const text = message.text.body.toLowerCase();
            
            // Si el cliente saluda o escribe cualquier cosa inicial
            await sendMainMenu(senderId);
            return;
        }

        // Verificar si es una respuesta a un botón interactivo
        if (message.type === 'interactive') {
            const interactiveType = message.interactive.type;
            
            if (interactiveType === 'button_reply') {
                const buttonId = message.interactive.button_reply.id;
                await handleButtonReply(senderId, buttonId);
            }
        }
    } catch (error) {
        console.error('❌ Error en botLogic:', error);
    }
};

// Función para enviar el menú principal
const sendMainMenu = async (to) => {
    const greeting = "¡Hola! Bienvenido a La Coca De Jacks 🍔.\n¿Cómo te podemos ayudar hoy?";
    const buttons = [
        { id: 'btn_menu', title: '📋 Ver Menú' },
        { id: 'btn_pedir', title: '🛒 Hacer un Pedido' },
        { id: 'btn_asesor', title: '🙋‍♂️ Asesor' }
    ];

    await sendInteractiveButtons(to, greeting, buttons);
};

// Función para manejar las respuestas de los botones
const handleButtonReply = async (to, buttonId) => {
    switch (buttonId) {
        case 'btn_menu':
            await sendTextMessage(to, "🍟 Nuestro menú cuenta con las mejores opciones.\nPuedes ver todos nuestros productos y precios en nuestra página web: https://www.lacocadejacks.com \n\n¿Deseas pedir algo?");
            // Podríamos enviar botones de nuevo si queremos mantener el ciclo
            break;
            
        case 'btn_pedir':
            // Aquí cerramos la venta guiando al cliente al formulario
            const formMessage = "¡Excelente! 🍔\nPara procesar tu pedido de la forma más rápida y segura, por favor llena nuestro formulario oficial.\nSolo te tomará 1 minuto:\n\n👉 https://www.lacocadejacks.com";
            await sendTextMessage(to, formMessage);
            break;
            
        case 'btn_asesor':
            await sendTextMessage(to, "En un momento uno de nuestros asesores humanos te atenderá. Por favor déjanos tu consulta. 👇");
            // Aquí en el futuro puedes marcar este chat en tu base de datos para que el bot no le responda más.
            break;
            
        default:
            await sendMainMenu(to);
            break;
    }
};

module.exports = {
    processIncomingMessage
};
