const cron = require('node-cron');
const Suscripcion = require('./models/Suscripcion');
const Plan = require('./models/Plan');

const checkSubscriptionsExpiration = async () => {
    try {
        console.log('[Cron] Ejecutando verificación diaria de suscripciones vencidas...');
        
        const suscripciones = await Suscripcion.findAll({
            where: { estado: 'Activo' },
            include: [{ model: Plan }]
        });

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        let vencidasCount = 0;

        for (let sub of suscripciones) {
            if (sub.fecha_inicio && sub.Plan) {
                const startDate = new Date(sub.fecha_inicio + 'T12:00:00');
                startDate.setHours(0, 0, 0, 0);
                
                // Duración en días calendario para que se venza el sábado (si empieza el lunes)
                // Semanal: empieza Lunes, vence Sábado (5 días)
                // Quincenal: vence Sábado de la segunda semana (12 días)
                // Mensual: vence Sábado de la cuarta semana (26 días)
                let diasCalendario = 0;
                if (sub.Plan.nombre === 'Semanal') diasCalendario = 5;
                else if (sub.Plan.nombre === 'Quincenal') diasCalendario = 12;
                else if (sub.Plan.nombre === 'Mensual') diasCalendario = 26;
                else diasCalendario = sub.Plan.dias_duracion; // Fallback
                
                const expirationDate = new Date(startDate);
                expirationDate.setDate(expirationDate.getDate() + diasCalendario);

                if (currentDate >= expirationDate) {
                    sub.estado = 'Vencido';
                    await sub.save();
                    vencidasCount++;
                    console.log(`[Cron] Suscripción ID ${sub.id} marcada como Vencida.`);
                }
            }
        }

        console.log(`[Cron] Verificación finalizada. Se vencieron ${vencidasCount} suscripciones.`);
    } catch (error) {
        console.error('[Cron] Error al verificar suscripciones:', error);
    }
};

// Programar para que corra todos los días a la medianoche (00:01 AM)
const initCronJobs = () => {
    cron.schedule('1 0 * * *', () => {
        checkSubscriptionsExpiration();
    }, {
        scheduled: true,
        timezone: "America/Bogota"
    });
    console.log('✅ Cron Jobs inicializados.');
};

module.exports = {
    initCronJobs,
    checkSubscriptionsExpiration // Exportada para poder ejecutarla manualmente si es necesario
};
