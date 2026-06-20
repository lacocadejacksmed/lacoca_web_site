const Plan = require('./models/Plan');
const Configuracion = require('./models/Configuracion');
const { sequelize } = require('./config/database');

async function checkPlans() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');
        const plans = await Plan.findAll();
        console.log('Current Plans:', JSON.stringify(plans, null, 2));

        const config = await Configuracion.findAll();
        console.log('Current Configuraciones:', JSON.stringify(config, null, 2));
        
        if (plans.length === 0) {
            console.log('Seeding default plans...');
            await Plan.bulkCreate([
                { nombre: 'Semanal', precio_base: 75000, dias_duracion: 5 },
                { nombre: 'Quincenal', precio_base: 140000, dias_duracion: 10 },
                { nombre: 'Mensual', precio_base: 260000, dias_duracion: 20 }
            ]);
            console.log('Plans seeded.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkPlans();
