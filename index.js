const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'hayabusa.proxy.rlwy.net',
  user: 'root',
  password: 'MozPSGKpUNMYXLDARMmXiUMBaEBWijGK',
  database: 'railway',
  port: 16012
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    return;
  }
  console.log('✅ Success! Connected to your cloud MySQL database on Railway!');
  
  connection.query('SELECT 1 + 1 AS solution', (error, results) => {
    if (error) throw error;
    console.log('Test query result: 1 + 1 =', results[0].solution);
    connection.end();
  });
});