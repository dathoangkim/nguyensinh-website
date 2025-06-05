const { pool } = require('../config/db');

/**
 * Lấy tất cả bàn theo cửa hàng
 * @param {number} storeId - ID của cửa hàng
 * @returns {Promise<Array>} - Danh sách bàn
 */
const getAllTables = async (storeId) => {
  try {
    // Include store name by joining with stores table
    const [rows] = await pool.query(
      `SELECT t.*, s.name as store_name 
       FROM tables t
       LEFT JOIN stores s ON t.store_id = s.store_id
       WHERE t.store_id = ? 
       ORDER BY t.table_number`,
      [storeId]
    );
    return rows;
  } catch (error) {
    console.error('Error in getAllTables model:', error);
    throw error;
  }
};

/**
 * Lấy các bàn có sẵn theo điều kiện
 * @param {number} storeId - ID của cửa hàng
 * @param {string} date - Ngày đặt bàn (YYYY-MM-DD)
 * @param {string} time - Giờ đặt bàn (HH:MM:SS)
 * @param {number} guests - Số lượng khách
 * @returns {Promise<Array>} - Danh sách bàn có sẵn
 */
const getAvailableTables = async (storeId, date, time, guests) => {
  try {
    // Lấy các bàn có đủ chỗ ngồi và không bị đặt trong khung giờ cụ thể
    // Khung giờ: 2 giờ trước và sau thời gian đặt
    const [rows] = await pool.query(
      `SELECT t.* FROM tables t
       WHERE t.store_id = ? 
       AND t.seats >= ?
       AND t.status = 'available'
       AND t.table_id NOT IN (
         SELECT r.table_id FROM reservations r
         WHERE r.store_id = ?
         AND r.reservation_date = ?
         AND r.reservation_time BETWEEN TIME(DATE_SUB(?, INTERVAL 2 HOUR)) AND TIME(DATE_ADD(?, INTERVAL 2 HOUR))
         AND r.status IN ('pending', 'confirmed')
       )
       ORDER BY t.seats ASC`,
      [storeId, guests, storeId, date, time, time]
    );
    return rows;
  } catch (error) {
    console.error('Error in getAvailableTables model:', error);
    throw error;
  }
};

/**
 * Lấy thông tin bàn theo ID
 * @param {number} tableId - ID của bàn
 * @returns {Promise<Object|null>} - Thông tin bàn hoặc null nếu không tìm thấy
 */
const getTableById = async (tableId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tables WHERE table_id = ?', 
      [tableId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error in getTableById model:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái bàn
 * @param {number} tableId - ID của bàn
 * @param {string} status - Trạng thái mới ('available', 'occupied', 'reserved', 'maintenance')
 * @returns {Promise<boolean>} - true nếu cập nhật thành công, false nếu không
 */
const updateTableStatus = async (tableId, status) => {
  try {
    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái bàn không hợp lệ');
    }
    
    const [result] = await pool.query(
      'UPDATE tables SET status = ? WHERE table_id = ?',
      [status, tableId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error in updateTableStatus model:', error);
    throw error;
  }
};

/**
 * Lấy danh sách bàn theo loại và số chỗ ngồi
 * @param {number} storeId - ID của cửa hàng
 * @param {string} tableType - Loại bàn ('round', 'rectangle', 'large')
 * @param {number} seats - Số chỗ ngồi tối thiểu
 * @returns {Promise<Array>} - Danh sách bàn
 */
const getTablesByTypeAndSeats = async (storeId, tableType, seats) => {
  try {
    let query = 'SELECT * FROM tables WHERE store_id = ?';
    const params = [storeId];
    
    if (tableType) {
      query += ' AND table_type = ?';
      params.push(tableType);
    }
    
    if (seats) {
      query += ' AND seats >= ?';
      params.push(seats);
    }
    
    query += ' ORDER BY table_number';
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error in getTablesByTypeAndSeats model:', error);
    throw error;
  }
};

/**
 * Kiểm tra xem bàn có sẵn để đặt không
 * @param {number} tableId - ID của bàn
 * @param {string} date - Ngày đặt bàn (YYYY-MM-DD)
 * @param {string} time - Giờ đặt bàn (HH:MM:SS)
 * @returns {Promise<boolean>} - true nếu bàn có sẵn, false nếu không
 */
const isTableAvailable = async (tableId, date, time) => {
  try {
    // Kiểm tra trạng thái bàn
    const [tableRows] = await pool.query(
      'SELECT status FROM tables WHERE table_id = ?',
      [tableId]
    );
    
    if (tableRows.length === 0 || tableRows[0].status !== 'available') {
      return false;
    }
    
    // Kiểm tra xem bàn đã được đặt trong khung giờ cụ thể chưa
    const [reservationRows] = await pool.query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE table_id = ? 
       AND reservation_date = ? 
       AND reservation_time BETWEEN TIME(DATE_SUB(?, INTERVAL 2 HOUR)) AND TIME(DATE_ADD(?, INTERVAL 2 HOUR))
       AND status IN ('pending', 'confirmed')`,
      [tableId, date, time, time]
    );
    
    return reservationRows[0].count === 0;
  } catch (error) {
    console.error('Error in isTableAvailable model:', error);
    throw error;
  }
};

/**
 * Tạo bàn mới
 * @param {Object} tableData - Thông tin bàn mới
 * @returns {Promise<Object>} - Thông tin bàn mới được tạo
 */
const createTable = async (tableData) => {
  try {
    const { table_number, store_id, table_type, seats, status, location, position_x, position_y, notes } = tableData;
    
    const [result] = await pool.query(
      `INSERT INTO tables 
       (table_number, store_id, table_type, seats, status, location, position_x, position_y, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [table_number, store_id, table_type, seats, status || 'available', location, position_x, position_y, notes]
    );
    
    if (result.insertId) {
      return getTableById(result.insertId);
    }
    throw new Error('Không thể tạo bàn mới');
  } catch (error) {
    console.error('Error in createTable model:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin bàn
 * @param {number} tableId - ID của bàn
 * @param {Object} tableData - Thông tin bàn cần cập nhật
 * @returns {Promise<Object>} - Thông tin bàn sau khi cập nhật
 */
const updateTable = async (tableId, tableData) => {
  try {
    const { table_number, store_id, table_type, seats, status, location, position_x, position_y, notes } = tableData;
    
    const [result] = await pool.query(
      `UPDATE tables SET 
       table_number = ?, 
       store_id = ?, 
       table_type = ?, 
       seats = ?, 
       status = ?, 
       location = ?, 
       position_x = ?, 
       position_y = ?, 
       notes = ? 
       WHERE table_id = ?`,
      [table_number, store_id, table_type, seats, status, location, position_x, position_y, notes, tableId]
    );
    
    if (result.affectedRows > 0) {
      return getTableById(tableId);
    }
    return null;
  } catch (error) {
    console.error('Error in updateTable model:', error);
    throw error;
  }
};

/**
 * Xóa bàn
 * @param {number} tableId - ID của bàn
 * @returns {Promise<boolean>} - true nếu xóa thành công, false nếu không
 */
const deleteTable = async (tableId) => {
  try {
    const [result] = await pool.query('DELETE FROM tables WHERE table_id = ?', [tableId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error in deleteTable model:', error);
    throw error;
  }
};

/**
 * Lọc bàn theo trạng thái và tìm kiếm
 * @param {Object} filters - Các điều kiện lọc
 * @returns {Promise<Array>} - Danh sách bàn thỏa mãn điều kiện
 */
const filterTables = async (filters) => {
  try {
    const { status, search, page = 1, limit = 10 } = filters;
    
    let query = `
      SELECT t.*, s.name as store_name 
      FROM tables t
      LEFT JOIN stores s ON t.store_id = s.store_id
      WHERE 1=1`;
    
    const params = [];
    
    // Add status filter if provided
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    // Add search filter if provided
    if (search) {
      query += ' AND (t.table_number LIKE ? OR t.location LIKE ? OR s.name LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    // Add sorting
    query += ' ORDER BY t.store_id, t.table_number';
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM tables t
      LEFT JOIN stores s ON t.store_id = s.store_id
      WHERE 1=1`;
    
    const countParams = [];
    
    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }
    
    if (search) {
      countQuery += ' AND (t.table_number LIKE ? OR t.location LIKE ? OR s.name LIKE ?)';
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    const [countRows] = await pool.query(countQuery, countParams);
    const total = countRows[0].total;
    
    const [rows] = await pool.query(query, params);
    
    return {
      tables: rows,
      total,
      total_pages: Math.ceil(total / limit),
      current_page: parseInt(page)
    };
  } catch (error) {
    console.error('Error in filterTables model:', error);
    throw error;
  }
};

/**
 * Cập nhật hàng loạt trạng thái bàn
 * @param {Object} updateData - Dữ liệu cập nhật hàng loạt
 * @returns {Promise<boolean>} - true nếu cập nhật thành công, false nếu không
 */
const bulkUpdateTableStatus = async (updateData) => {
  try {
    const { store_id, current_status, new_status } = updateData;
    
    let query = 'UPDATE tables SET status = ? WHERE 1=1';
    const params = [new_status];
    
    if (store_id) {
      query += ' AND store_id = ?';
      params.push(store_id);
    }
    
    if (current_status) {
      query += ' AND status = ?';
      params.push(current_status);
    }
    
    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error in bulkUpdateTableStatus model:', error);
    throw error;
  }
};

module.exports = {
  getAllTables,
  getAvailableTables,
  getTableById,
  updateTableStatus,
  getTablesByTypeAndSeats,
  isTableAvailable,
  createTable,
  updateTable,
  deleteTable,
  filterTables,
  bulkUpdateTableStatus
};
