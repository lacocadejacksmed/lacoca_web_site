const mysql = require('mysql2/promise');

async function fixDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Alejandro15',
    database: 'lacocadejacks'
  });

  const [rows] = await connection.execute('SHOW INDEX FROM usuarios');
  
  for (const row of rows) {
    if (row.Key_name.startsWith('email_')) {
      console.log(`Dropping index ${row.Key_name}`);
      await connection.execute(`ALTER TABLE usuarios DROP INDEX ${row.Key_name}`);
    }
  }

  console.log('Fixed DB indexes.');
  await connection.end();
}

fixDb().catch(console.error);
