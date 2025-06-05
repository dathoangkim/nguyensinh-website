const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo pool connection để quản lý kết nối đến MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Kết nối đến MySQL thành công!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Không thể kết nối đến MySQL:', error);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};