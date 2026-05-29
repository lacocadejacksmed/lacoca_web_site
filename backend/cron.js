const cron = require('node-cron');
const Suscripcion = require('./models/Suscripcion');
const Plan = require('./models/Plan');
const Feriado = require('./models/Feriado');
const { calcularVencimiento } = require('./utils/dateUtils');

const checkSubscriptionsExpiration = async () => {
    try {
        console.log('[Cron] Ejecutando verificación diaria de suscripciones vencidas...');
        
        const suscripciones = await Suscripcion.findAll({
            where: { estado: 'Activo' },
            include: [{ model: Plan }]
        });

        const feriadosDocs = await Feriado.findAll({ attributes: ['fecha'] });
        const feriadosArray = feriadosDocs.map(f => f.fecha);

        let vencidasCount = 0;

        for (let sub of suscripciones) {
            if (sub.fecha_inicio && sub.Plan) {
                const { diasRestantes } = calcularVencimiento(
                    sub.fecha_inicio,
                    sub.Plan.nombre,
                    sub.Plan.dias_duracion,
                    feriadosArray,
                    sub.estado
                );

                if (diasRestantes <= 0) {
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
