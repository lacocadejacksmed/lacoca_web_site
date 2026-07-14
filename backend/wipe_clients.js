require('dotenv').config();
const { sequelize } = require('./config/database');
const Cliente = require('./models/Cliente');
const Suscripcion = require('./models/Suscripcion');
const DireccionEntrega = require('./models/DireccionEntrega');
const Comprobante = require('./models/Comprobante');

const wipeData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos...');
    
    console.log('Borrando datos usando los modelos de Sequelize...');
    
    await Comprobante.destroy({ where: {}, force: true });
    await DireccionEntrega.destroy({ where: {}, force: true });
    await Suscripcion.destroy({ where: {}, force: true });
    await Cliente.destroy({ where: {}, force: true });

    console.log('✅ Todos los registros de clientes y sus dependencias han sido eliminados con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('Error al intentar limpiar la base de datos:', err);
    process.exit(1);
  }
};

wipeData();
