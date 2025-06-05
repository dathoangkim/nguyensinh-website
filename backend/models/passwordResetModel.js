const { pool } = require('../config/db');
const crypto = require('crypto');

// Tạo token đặt lại mật khẩu
const createResetToken = async (userId) => {
  try {
    // Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Thời gian hết hạn (1 giờ)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Xóa các token cũ của người dùng
    await pool.query(
      'DELETE FROM password_resets WHERE user_id = ?',
      [userId]
    );
    
    // Lưu token mới
    const [result] = await pool.query(
      'INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, ?)',
      [userId, resetToken, expiresAt]
    );
    
    return resetToken;
  } catch (error) {
    throw error;
  }
};

// Kiểm tra token đặt lại mật khẩu
const verifyResetToken = async (token) => {
  try {
    const [rows] = await pool.query(`
      SELECT pr.*, u.email, u.username
      FROM password_resets pr
      JOIN users u ON pr.user_id = u.user_id
      WHERE pr.reset_token = ? AND pr.expires_at > NOW()
    `, [token]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Xóa token đặt lại mật khẩu
const deleteResetToken = async (token) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM password_resets WHERE reset_token = ?',
      [token]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createResetToken,
  verifyResetToken,
  deleteResetToken
};