const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://lacocadejacks_user:3iNS13zJJ4um6V9bVMbgJt61peSw8AdW@dpg-d8r00rmgvqtc73ebe7r0-a.ohio-postgres.render.com/lacocadejacks',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  return client.query('SELECT * FROM planes;');
}).then(res => {
  console.log(res.rows);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
