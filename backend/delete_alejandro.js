require('dotenv').config();
const { sequelize } = require('./config/database');
const Cliente = require('./models/Cliente');
const Suscripcion = require('./models/Suscripcion');
const DireccionEntrega = require('./models/DireccionEntrega');
const Comprobante = require('./models/Comprobante');
const Usuario = require('./models/Usuario');
const { Op } = require('sequelize');

const deleteClient = async () => {
  try {
    await sequelize.authenticate();
    
    // Buscar clientes que se llamen "Alejandro Gomez" (insensible a mayúsculas)
    const clientes = await Cliente.findAll({
      where: {
        nombre: {
          [Op.iLike]: '%alejandro gomez%'
        }
      }
    });

    if (clientes.length === 0) {
      console.log('No se encontró ningún cliente con ese nombre.');
      process.exit(0);
    }

    for (let c of clientes) {
      console.log(`Borrando dependencias para: ${c.nombre} (Cédula: ${c.cedula})`);
      
      // Buscar suscripciones
      const subs = await Suscripcion.findAll({ where: { cliente_cedula: c.cedula } });
      for (let sub of subs) {
        // Borrar comprobantes
        await Comprobante.destroy({ where: { suscripcion_id: sub.id }, force: true });
        // Borrar direcciones
        await DireccionEntrega.destroy({ where: { suscripcion_id: sub.id }, force: true });
        // Borrar suscripción
        await sub.destroy({ force: true });
      }

      // Borrar Cliente
      await c.destroy({ force: true });
      console.log(`✅ Cliente ${c.nombre} borrado exitosamente.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error al intentar borrar el cliente:', err);
    process.exit(1);
  }
};

deleteClient();
