const mysql = require('mysql2/promise');

async function fixAllDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Alejandro15',
    database: 'lacocadejacks'
  });

  const [tables] = await connection.execute('SHOW TABLES');
  
  for (const tableObj of tables) {
    const tableName = Object.values(tableObj)[0];
    const [rows] = await connection.execute(`SHOW INDEX FROM \`${tableName}\``);
    
    for (const row of rows) {
      if (row.Key_name.match(/_(?:2|3|4|5|6|7|8|9|[1-9][0-9])$/)) {
        console.log(`Dropping index ${row.Key_name} on table ${tableName}`);
        await connection.execute(`ALTER TABLE \`${tableName}\` DROP INDEX \`${row.Key_name}\``);
      }
    }
  }

  console.log('Fixed ALL DB indexes.');
  await connection.end();
}

fixAllDb().catch(console.error);
