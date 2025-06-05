const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// Lấy tất cả người dùng
const getAllUsers = async () => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, email, full_name, phone, role, created_at, updated_at FROM users'
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy người dùng theo ID
const getUserById = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, email, full_name, phone, role, created_at, updated_at FROM users WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Lấy người dùng theo email
const getUserByEmail = async (email) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Tạo người dùng mới
const createUser = async (userData) => {
  const { username, email, password, full_name, phone, role } = userData;

  // Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, phone, role || 'customer']
    );
    
    const [rows] = await pool.query(
      'SELECT user_id, username, email, full_name, phone, role, created_at, updated_at FROM users WHERE user_id = ?',
      [result.insertId]
    );
    
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Cập nhật thông tin người dùng
const updateUser = async (userId, userData) => {
  const { username, email, password, full_name, phone, role } = userData;
  
  try {
    let query = 'UPDATE users SET ';
    const values = [];
    
    if (username) {
      query += 'username = ?, ';
      values.push(username);
    }
    
    if (email) {
      query += 'email = ?, ';
      values.push(email);
    }
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query += 'password_hash = ?, ';
      values.push(hashedPassword);
    }
    
    if (full_name) {
      query += 'full_name = ?, ';
      values.push(full_name);
    }
    
    if (phone) {
      query += 'phone = ?, ';
      values.push(phone);
    }
    
    if (role) {
      query += 'role = ?, ';
      values.push(role);
    }
    
    // Thêm updated_at
    query += 'updated_at = NOW(), ';
    
    // Xóa dấu phẩy cuối cùng và khoảng trắng
    query = query.slice(0, -2);
    
    query += ' WHERE user_id = ?';
    values.push(userId);
    
    await pool.query(query, values);
    
    const [rows] = await pool.query(
      'SELECT user_id, username, email, full_name, phone, role, created_at, updated_at FROM users WHERE user_id = ?',
      [userId]
    );
    
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Xóa người dùng
const deleteUser = async (userId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM users WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Kiểm tra mật khẩu
const matchPassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};

// Thêm phiên đăng nhập mới
const createSession = async (userId, token, expiresAt) => {
  try {
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    
    await pool.query(
      'INSERT INTO sessions (session_id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, userId, token, expiresAt]
    );
    
    return sessionId;
  } catch (error) {
    throw error;
  }
};

// Xóa phiên đăng nhập
const deleteSession = async (token) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM sessions WHERE token = ?',
      [token]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Xóa tất cả phiên đăng nhập của người dùng
const deleteAllUserSessions = async (userId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM sessions WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Kiểm tra phiên đăng nhập có hợp lệ không
const validateSession = async (token) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Đếm số lượng người dùng
const countUsers = async () => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách người dùng mới nhất
const getLatestUsers = async (limit = 5) => {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  matchPassword,
  createSession,
  deleteSession,
  deleteAllUserSessions,
  validateSession,
  countUsers,
  getLatestUsers
};
