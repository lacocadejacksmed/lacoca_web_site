const { connectDB, sequelize } = require('../backend/config/database');
async function alterEnum() {
    await connectDB();
    try {
        await sequelize.query("ALTER TABLE suscripciones MODIFY COLUMN estado ENUM('Pendiente', 'Activo', 'Cancelado', 'Vencido') DEFAULT 'Pendiente';");
        console.log('Enum altered successfully');
    } catch (e) {
        console.log('Error:', e.message);
    }
    process.exit(0);
}
alterEnum();
