const { pool } = require('../config/db');

// Lấy tổng điểm thưởng của người dùng
const getUserPoints = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT SUM(`change`) as total_points FROM loyalty_points WHERE user_id = ?',
      [userId]
    );
    return rows[0].total_points || 0;
  } catch (error) {
    throw error;
  }
};

// Lấy lịch sử điểm thưởng của người dùng
const getUserPointsHistory = async (userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT lp.*, o.order_id, o.total_amount 
      FROM loyalty_points lp
      LEFT JOIN orders o ON lp.order_id = o.order_id
      WHERE lp.user_id = ?
      ORDER BY lp.created_at DESC
    `, [userId]);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Thêm điểm thưởng cho người dùng
const addPoints = async (pointsData) => {
  const { user_id, order_id, change, reason } = pointsData;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO loyalty_points (user_id, order_id, `change`, reason) VALUES (?, ?, ?, ?)',
      [user_id, order_id, change, reason]
    );
    
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

// Sử dụng điểm thưởng
const usePoints = async (pointsData) => {
  const { user_id, order_id, change, reason } = pointsData;
  
  try {
    // Kiểm tra xem người dùng có đủ điểm không
    const currentPoints = await getUserPoints(user_id);
    
    if (currentPoints < Math.abs(change)) {
      throw new Error('Không đủ điểm thưởng');
    }
    
    const [result] = await pool.query(
      'INSERT INTO loyalty_points (user_id, order_id, `change`, reason) VALUES (?, ?, ?, ?)',
      [user_id, order_id, -Math.abs(change), reason]
    );
    
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

// Tính toán điểm thưởng từ giá trị đơn hàng
const calculateOrderPoints = (orderAmount) => {
  // Ví dụ: 1 điểm cho mỗi 10,000 VND
  return Math.floor(orderAmount / 10000);
};

// Tính toán giá trị tiền từ điểm thưởng
const calculatePointsValue = (points) => {
  // Ví dụ: 1 điểm = 1,000 VND
  return points * 1000;
};

module.exports = {
  getUserPoints,
  getUserPointsHistory,
  addPoints,
  usePoints,
  calculateOrderPoints,
  calculatePointsValue
};