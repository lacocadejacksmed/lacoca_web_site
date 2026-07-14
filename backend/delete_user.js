require('dotenv').config();
const { sequelize } = require('./config/database');
const Usuario = require('./models/Usuario');
const { Op } = require('sequelize');

const deleteUser = async () => {
  try {
    await sequelize.authenticate();
    
    const usuarios = await Usuario.findAll({
      where: {
        [Op.or]: [
          { cedula: '1000899884' },
          { email: { [Op.iLike]: '%alejandro gomez%' } },
          { nombre: { [Op.iLike]: '%alejandro gomez%' } }
        ]
      }
    });

    for (let u of usuarios) {
      console.log(`Borrando usuario: ${u.correo}`);
      await u.destroy({ force: true });
    }

    console.log('Finalizado.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

deleteUser();
