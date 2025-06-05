const { pool } = require('../config/db');

/**
 * Lấy tất cả đơn đặt bàn
 * @returns {Promise<Array>} - Danh sách đơn đặt bàn
 */
const getAllReservations = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, t.table_number, t.seats, t.table_type, s.name as store_name
      FROM reservations r
      JOIN tables t ON r.table_id = t.table_id
      JOIN stores s ON r.store_id = s.store_id
      ORDER BY r.reservation_date DESC, r.reservation_time DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error in getAllReservations model:', error);
    throw error;
  }
};

/**
 * Tạo đơn đặt bàn mới
 * @param {Object} reservationData - Dữ liệu đơn đặt bàn
 * @returns {Promise<number>} - ID của đơn đặt bàn mới
 */
const createReservation = async (reservationData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Kiểm tra xem bàn có sẵn không
    const [tableCheck] = await connection.query(
      `SELECT status FROM tables WHERE table_id = ?`,
      [reservationData.table_id]
    );
    
    if (tableCheck.length === 0 || tableCheck[0].status !== 'available') {
      throw new Error('Bàn đã được đặt hoặc không khả dụng');
    }
    
    // Kiểm tra xem bàn đã được đặt trong khung giờ này chưa
    const [timeCheck] = await connection.query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE table_id = ? 
       AND reservation_date = ? 
       AND reservation_time BETWEEN TIME(DATE_SUB(?, INTERVAL 2 HOUR)) AND TIME(DATE_ADD(?, INTERVAL 2 HOUR))
       AND status IN ('pending', 'confirmed')`,
      [
        reservationData.table_id, 
        reservationData.reservation_date, 
        reservationData.reservation_time,
        reservationData.reservation_time
      ]
    );
    
    if (timeCheck[0].count > 0) {
      throw new Error('Bàn đã được đặt trong khung giờ này');
    }
    
    // Tạo đơn đặt bàn
    const [result] = await connection.query(
      `INSERT INTO reservations 
       (user_id, store_id, table_id, full_name, email, phone, 
        reservation_date, reservation_time, guests, occasion, notes, 
        status, deposit_method, deposit_amount, deposit_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reservationData.user_id || null,
        reservationData.store_id,
        reservationData.table_id,
        reservationData.full_name,
        reservationData.email,
        reservationData.phone,
        reservationData.reservation_date,
        reservationData.reservation_time,
        reservationData.guests,
        reservationData.occasion || null,
        reservationData.notes || null,
        'pending',
        reservationData.deposit_method || 'none',
        reservationData.deposit_amount || 0,
        reservationData.deposit_amount > 0 ? 'pending' : null
      ]
    );
    
    const reservationId = result.insertId;
    
    // Cập nhật trạng thái bàn nếu cần
    if (reservationData.update_table_status) {
      await connection.query(
        'UPDATE tables SET status = "reserved" WHERE table_id = ?',
        [reservationData.table_id]
      );
    }
    
    // Thêm lịch sử trạng thái
    await connection.query(
      `INSERT INTO reservation_status_history 
       (reservation_id, old_status, new_status, changed_by, notes)
       VALUES (?, 'pending', 'pending', ?, 'Đơn đặt bàn mới')`,
      [reservationId, reservationData.user_id || null]
    );
    
    // Thêm thanh toán đặt cọc nếu có
    if (reservationData.deposit_method !== 'none' && reservationData.deposit_amount > 0) {
      await connection.query(
        `INSERT INTO reservation_payments 
         (reservation_id, amount, payment_method, status) 
         VALUES (?, ?, ?, 'pending')`,
        [reservationId, reservationData.deposit_amount, reservationData.deposit_method]
      );
    }
    
    await connection.commit();
    return reservationId;
  } catch (error) {
    await connection.rollback();
    console.error('Error in createReservation model:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Lấy thông tin đơn đặt bàn theo ID
 * @param {number} reservationId - ID của đơn đặt bàn
 * @returns {Promise<Object|null>} - Thông tin đơn đặt bàn hoặc null nếu không tìm thấy
 */
const getReservationById = async (reservationId) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, t.table_number, t.seats, t.table_type, s.name as store_name
       FROM reservations r
       JOIN tables t ON r.table_id = t.table_id
       JOIN stores s ON r.store_id = s.store_id
       WHERE r.reservation_id = ?`,
      [reservationId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    // Lấy lịch sử trạng thái
    const [historyRows] = await pool.query(
      `SELECT h.*, u.username as changed_by_username
       FROM reservation_status_history h
       LEFT JOIN users u ON h.changed_by = u.user_id
       WHERE h.reservation_id = ?
       ORDER BY h.changed_at DESC`,
      [reservationId]
    );
    
    // Lấy thông tin thanh toán
    const [paymentRows] = await pool.query(
      `SELECT * FROM reservation_payments
       WHERE reservation_id = ?
       ORDER BY created_at DESC`,
      [reservationId]
    );
    
    return {
      ...rows[0],
      status_history: historyRows,
      payments: paymentRows
    };
  } catch (error) {
    console.error('Error in getReservationById model:', error);
    throw error;
  }
};

/**
 * Lấy danh sách đơn đặt bàn của người dùng
 * @param {number} userId - ID của người dùng
 * @returns {Promise<Array>} - Danh sách đơn đặt bàn
 */
const getUserReservations = async (userId) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, t.table_number, t.seats, t.table_type, s.name as store_name
       FROM reservations r
       JOIN tables t ON r.table_id = t.table_id
       JOIN stores s ON r.store_id = s.store_id
       WHERE r.user_id = ?
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error in getUserReservations model:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái đơn đặt bàn
 * @param {number} reservationId - ID của đơn đặt bàn
 * @param {string} status - Trạng thái mới
 * @param {number} userId - ID của người thay đổi
 * @param {string} notes - Ghi chú
 * @returns {Promise<boolean>} - true nếu cập nhật thành công
 */
const updateReservationStatus = async (reservationId, status, userId, notes) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Lấy trạng thái hiện tại
    const [currentStatus] = await connection.query(
      'SELECT status, table_id FROM reservations WHERE reservation_id = ?',
      [reservationId]
    );
    
    if (currentStatus.length === 0) {
      throw new Error('Đơn đặt bàn không tồn tại');
    }
    
    const oldStatus = currentStatus[0].status;
    const tableId = currentStatus[0].table_id;
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }
    
    // Cập nhật trạng thái
    await connection.query(
      'UPDATE reservations SET status = ? WHERE reservation_id = ?',
      [status, reservationId]
    );
    
    // Lưu lịch sử thay đổi trạng thái
    await connection.query(
      `INSERT INTO reservation_status_history 
       (reservation_id, old_status, new_status, changed_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [reservationId, oldStatus, status, userId, notes || null]
    );
    
    // Cập nhật trạng thái bàn nếu cần
    if (status === 'completed' || status === 'cancelled' || status === 'no_show') {
      await connection.query(
        'UPDATE tables SET status = "available" WHERE table_id = ?',
        [tableId]
      );
    } else if (status === 'confirmed' && oldStatus === 'pending') {
      // Nếu xác nhận đơn đặt bàn, cập nhật trạng thái bàn thành reserved
      await connection.query(
        'UPDATE tables SET status = "reserved" WHERE table_id = ?',
        [tableId]
      );
    }
    
    // Cập nhật trạng thái thanh toán đặt cọc nếu cần
    if (status === 'cancelled') {
      await connection.query(
        'UPDATE reservation_payments SET status = "refunded" WHERE reservation_id = ? AND status = "completed"',
        [reservationId]
      );
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error in updateReservationStatus model:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Lấy danh sách đơn đặt bàn theo cửa hàng và ngày
 * @param {number} storeId - ID của cửa hàng
 * @param {string} date - Ngày đặt bàn (YYYY-MM-DD)
 * @returns {Promise<Array>} - Danh sách đơn đặt bàn
 */
const getStoreReservations = async (storeId, date) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, t.table_number, t.seats, t.table_type
       FROM reservations r
       JOIN tables t ON r.table_id = t.table_id
       WHERE r.store_id = ? AND r.reservation_date = ?
       ORDER BY r.reservation_time`,
      [storeId, date]
    );
    return rows;
  } catch (error) {
    console.error('Error in getStoreReservations model:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử trạng thái đơn đặt bàn
 * @param {number} reservationId - ID của đơn đặt bàn
 * @returns {Promise<Array>} - Lịch sử trạng thái
 */
const getReservationStatusHistory = async (reservationId) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, u.username as changed_by_username
       FROM reservation_status_history h
       LEFT JOIN users u ON h.changed_by = u.user_id
       WHERE h.reservation_id = ?
       ORDER BY h.changed_at DESC`,
      [reservationId]
    );
    return rows;
  } catch (error) {
    console.error('Error in getReservationStatusHistory model:', error);
    throw error;
  }
};

/**
 * Xóa đơn đặt bàn
 * @param {number} reservationId - ID của đơn đặt bàn
 * @returns {Promise<boolean>} - true nếu xóa thành công, false nếu không
 */
const deleteReservation = async (reservationId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Lấy thông tin bàn
    const [reservationInfo] = await connection.query(
      'SELECT table_id, status FROM reservations WHERE reservation_id = ?',
      [reservationId]
    );
    
    if (reservationInfo.length === 0) {
      await connection.rollback();
      return false;
    }
    
    const tableId = reservationInfo[0].table_id;
    const status = reservationInfo[0].status;
    
    // Xóa đơn đặt bàn
    const [result] = await connection.query(
      'DELETE FROM reservations WHERE reservation_id = ?',
      [reservationId]
    );
    
    // Cập nhật trạng thái bàn nếu đơn đặt bàn đang ở trạng thái pending hoặc confirmed
    if (status === 'pending' || status === 'confirmed') {
      await connection.query(
        'UPDATE tables SET status = "available" WHERE table_id = ?',
        [tableId]
      );
    }
    
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    console.error('Error in deleteReservation model:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Lấy thống kê đơn đặt bàn
 * @returns {Promise<Object>} - Thống kê đơn đặt bàn
 */
const getReservationStats = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_count,
        COUNT(CASE WHEN reservation_date = CURDATE() THEN 1 END) as today_count,
        COUNT(*) as total_count
      FROM reservations
    `);
    return rows[0];
  } catch (error) {
    console.error('Error in getReservationStats model:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin thanh toán đặt cọc
 * @param {number} reservationId - ID của đơn đặt bàn
 * @param {Object} paymentData - Dữ liệu thanh toán
 * @returns {Promise<boolean>} - true nếu cập nhật thành công
 */
const updateReservationPayment = async (reservationId, paymentData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Kiểm tra đơn đặt bàn
    const [reservationCheck] = await connection.query(
      'SELECT * FROM reservations WHERE reservation_id = ?',
      [reservationId]
    );
    
    if (reservationCheck.length === 0) {
      throw new Error('Đơn đặt bàn không tồn tại');
    }
    
    // Cập nhật thông tin thanh toán trong đơn đặt bàn
    await connection.query(
      'UPDATE reservations SET deposit_status = ? WHERE reservation_id = ?',
      [paymentData.status, reservationId]
    );
    
    // Kiểm tra xem đã có thanh toán chưa
    const [paymentCheck] = await connection.query(
      'SELECT * FROM reservation_payments WHERE reservation_id = ?',
      [reservationId]
    );
    
    if (paymentCheck.length > 0) {
      // Cập nhật thanh toán hiện có
      await connection.query(
        `UPDATE reservation_payments 
         SET status = ?, transaction_id = ?, payment_date = NOW()
         WHERE reservation_id = ?`,
        [paymentData.status, paymentData.transaction_id, reservationId]
      );
    } else {
      // Tạo thanh toán mới
      await connection.query(
        `INSERT INTO reservation_payments 
         (reservation_id, amount, payment_method, transaction_id, status, payment_date)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          reservationId, 
          reservationCheck[0].deposit_amount,
          reservationCheck[0].deposit_method,
          paymentData.transaction_id,
          paymentData.status
        ]
      );
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error in updateReservationPayment model:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Lấy danh sách đơn đặt bàn theo số điện thoại
 * @param {string} phone - Số điện thoại
 * @returns {Promise<Array>} - Danh sách đơn đặt bàn
 */
const getReservationsByPhone = async (phone) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, t.table_number, t.seats, t.table_type, s.name as store_name
       FROM reservations r
       JOIN tables t ON r.table_id = t.table_id
       JOIN stores s ON r.store_id = s.store_id
       WHERE r.phone = ?
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
      [phone]
    );
    return rows;
  } catch (error) {
    console.error('Error in getReservationsByPhone model:', error);
    throw error;
  }
};

module.exports = {
  getAllReservations,
  createReservation,
  getReservationById,
  getUserReservations,
  updateReservationStatus,
  getStoreReservations,
  getReservationStatusHistory,
  deleteReservation,
  getReservationStats,
  updateReservationPayment,
  getReservationsByPhone
};
