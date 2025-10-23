const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'nenasa_user',
      password: 'Nemika123#',
      database: 'attendance_db'
    });
    
    console.log('Successfully connected to MySQL!');
    await connection.end();
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
}

testConnection();