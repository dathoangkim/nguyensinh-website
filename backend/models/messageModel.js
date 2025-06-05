const { pool } = require('../config/db');

// Lấy tất cả tin nhắn
const getAllMessages = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, u.username, u.email, u.full_name
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.user_id
      ORDER BY m.received_at DESC
    `);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy tin nhắn theo ID
const getMessageById = async (messageId) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, u.username, u.email, u.full_name
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.user_id
      WHERE m.message_id = ?
    `, [messageId]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Lấy tin nhắn theo người dùng
const getMessagesByUser = async (userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM messages
      WHERE user_id = ?
      ORDER BY received_at DESC
    `, [userId]);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

// Tạo tin nhắn mới
const createMessage = async (messageData) => {
  const { user_id, channel, subject, content } = messageData;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO messages (user_id, channel, subject, content) VALUES (?, ?, ?, ?)',
      [user_id, channel, subject, content]
    );
    
    return await getMessageById(result.insertId);
  } catch (error) {
    throw error;
  }
};

// Cập nhật trạng thái tin nhắn
const updateMessageStatus = async (messageId, status) => {
  try {
    const [result] = await pool.query(
      'UPDATE messages SET status = ? WHERE message_id = ?',
      [status, messageId]
    );
    
    return result.affectedRows > 0 ? await getMessageById(messageId) : null;
  } catch (error) {
    throw error;
  }
};

// Xóa tin nhắn
const deleteMessage = async (messageId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM messages WHERE message_id = ?',
      [messageId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Lấy số lượng tin nhắn mới
const getNewMessagesCount = async () => {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE status = "new"'
    );
    
    return rows[0].count;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllMessages,
  getMessageById,
  getMessagesByUser,
  createMessage,
  updateMessageStatus,
  deleteMessage,
  getNewMessagesCount
};