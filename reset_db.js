const { sequelize } = require('./backend/config/database');

async function resetDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB conectada. Iniciando limpieza...\n');

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    await sequelize.query('TRUNCATE TABLE comprobantes;');
    console.log('🗑  comprobantes: limpiada');

    await sequelize.query('TRUNCATE TABLE direcciones_entrega;');
    console.log('🗑  direcciones_entrega: limpiada');

    await sequelize.query('TRUNCATE TABLE suscripciones;');
    console.log('🗑  suscripciones: limpiada');

    await sequelize.query('TRUNCATE TABLE clientes;');
    console.log('🗑  clientes: limpiada');

    await sequelize.query('TRUNCATE TABLE feriados;');
    console.log('🗑  feriados: limpiada');

    await sequelize.query('TRUNCATE TABLE menu_semanal;');
    console.log('🗑  menu_semanal: limpiada');

    // Reactivar checks de FK
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Verificar que el admin sigue intacto
    const [adminRows] = await sequelize.query("SELECT id, nombre, email, rol FROM usuarios WHERE rol = 'admin';");

    if (adminRows.length > 0) {
      console.log('\n✅ Usuario admin conservado:');
      adminRows.forEach(u => console.log(`   ID: ${u.id} | ${u.nombre} | ${u.email} | rol: ${u.rol}`));
    } else {
      console.log('\n⚠️  ADVERTENCIA: No se encontró ningún usuario admin en la tabla usuarios.');
    }

    console.log('\n🎉 Base de datos limpiada exitosamente.');
    console.log('   → planes y configuraciones se mantienen intactos.');
    console.log('   → usuarios (admin) se mantiene intacto.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    // Asegurar que se reactiven los FK checks
    try { await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;'); } catch (_) { }
    process.exit(1);
  }
}

resetDatabase();
