const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize('postgresql://postgres:BphyTXXgfgPhotwHynrZivlNgooRlFqN@tokaido.proxy.rlwy.net:17350/railway', {
  dialect: 'postgres',
  logging: false
});

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true },
  cedula: { type: DataTypes.STRING, allowNull: true },
  celular: { type: DataTypes.STRING, allowNull: true },
  rol: { type: DataTypes.ENUM('cliente', 'admin'), defaultValue: 'cliente', allowNull: false }
}, {
  tableName: 'usuarios',
  timestamps: true
});

async function updateAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la BD.');

    const email = 'lacocadejacksmed@gmail.com';
    const user = await Usuario.findOne({ where: { email } });
    
    if (user) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash('Lacoca1024#', salt);
      user.rol = 'admin';
      await user.save();
      console.log('¡Usuario actualizado exitosamente a ADMIN!');
    } else {
      console.log('No se encontró el usuario.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

updateAdmin();
