require('dotenv').config({ path: __dirname + '/.env' });
const { sequelize } = require('./config/database');
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE feriados ADD COLUMN activo BOOLEAN DEFAULT true;');
    console.log('Migration successful');
  } catch (error) {
    if (error.message.includes('column "activo" of relation "feriados" already exists')) {
      console.log('Migration already applied');
    } else {
      console.error(error);
    }
  } finally {
    process.exit();
  }
})();
