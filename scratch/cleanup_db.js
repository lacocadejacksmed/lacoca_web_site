const { sequelize } = require('../backend/config/database');

async function cleanupIndexes() {
    try {
        console.log('--- Analizando índices de la tabla clientes ---');
        const [results] = await sequelize.query('SHOW INDEX FROM clientes');
        console.log(`Encontrados ${results.length} índices.`);
        
        // Filtrar índices duplicados en la columna 'correo'
        // Normalmente Sequelize crea nombres como 'correo', 'correo_2', 'clientes_correo_unique', etc.
        const correoIndexes = results.filter(idx => idx.Column_name === 'correo' && idx.Key_name !== 'PRIMARY');
        
        console.log(`Encontrados ${correoIndexes.length} índices en la columna "correo".`);
        
        if (correoIndexes.length > 1) {
            console.log('Eliminando índices duplicados...');
            // Mantener solo uno o eliminar todos para que alter:true lo cree de nuevo limpiamente
            for (const idx of correoIndexes) {
                console.log(`Borrando índice: ${idx.Key_name}`);
                await sequelize.query(`ALTER TABLE clientes DROP INDEX ${idx.Key_name}`);
            }
            console.log('Limpieza completada.');
        } else {
            console.log('No se encontraron índices duplicados obvios en la columna "correo".');
            console.log('Lista completa de índices:');
            results.forEach(idx => console.log(`- ${idx.Key_name} (${idx.Column_name})`));
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error durante la limpieza:', err);
        process.exit(1);
    }
}

cleanupIndexes();
