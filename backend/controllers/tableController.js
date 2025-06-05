const tableModel = require('../models/tableModel');

/**
 * Lấy tất cả bàn theo cửa hàng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllTables = async (req, res) => {
  try {
    const storeId = req.params.storeId;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID cửa hàng'
      });
    }
    
    const tables = await tableModel.getAllTables(storeId);
    
    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error('Error in getAllTables controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách bàn',
      error: error.message
    });
  }
};

/**
 * Lấy các bàn có sẵn theo điều kiện
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAvailableTables = async (req, res) => {
  try {
    const { storeId, date, time, guests } = req.query;
    
    if (!storeId || !date || !time || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết: storeId, date, time, guests'
      });
    }
    
    const tables = await tableModel.getAvailableTables(storeId, date, time, guests);
    
    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error('Error in getAvailableTables controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách bàn trống',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin bàn theo ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getTableById = async (req, res) => {
  try {
    const tableId = req.params.id;
    
    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID bàn'
      });
    }
    
    const table = await tableModel.getTableById(tableId);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bàn'
      });
    }
    
    res.status(200).json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error('Error in getTableById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin bàn',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái bàn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateTableStatus = async (req, res) => {
  try {
    const tableId = req.params.id;
    const { status } = req.body;
    
    if (!tableId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết: tableId, status'
      });
    }
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Trạng thái hợp lệ: available, occupied, reserved, maintenance'
      });
    }
    
    const result = await tableModel.updateTableStatus(tableId, status);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bàn hoặc không thể cập nhật trạng thái'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái bàn thành công'
    });
  } catch (error) {
    console.error('Error in updateTableStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái bàn',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách bàn theo loại và số chỗ ngồi
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getTablesByTypeAndSeats = async (req, res) => {
  try {
    const { storeId, tableType, seats } = req.query;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID cửa hàng'
      });
    }
    
    const tables = await tableModel.getTablesByTypeAndSeats(storeId, tableType, seats);
    
    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    console.error('Error in getTablesByTypeAndSeats controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách bàn',
      error: error.message
    });
  }
};

/**
 * Kiểm tra xem bàn có sẵn để đặt không
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const checkTableAvailability = async (req, res) => {
  try {
    const { tableId, date, time } = req.query;
    
    if (!tableId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết: tableId, date, time'
      });
    }
    
    const isAvailable = await tableModel.isTableAvailable(tableId, date, time);
    
    res.status(200).json({
      success: true,
      isAvailable
    });
  } catch (error) {
    console.error('Error in checkTableAvailability controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra tình trạng bàn',
      error: error.message
    });
  }
};

/**
 * Tạo bàn mới
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createTable = async (req, res) => {
  try {
    const tableData = req.body;
    
    if (!tableData.table_number || !tableData.store_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết: table_number, store_id'
      });
    }
    
    const newTable = await tableModel.createTable(tableData);
    
    res.status(201).json({
      success: true,
      message: 'Tạo bàn mới thành công',
      data: newTable
    });
  } catch (error) {
    console.error('Error in createTable controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo bàn mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin bàn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    const tableData = req.body;
    
    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID bàn'
      });
    }
    
    const updatedTable = await tableModel.updateTable(tableId, tableData);
    
    if (!updatedTable) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bàn hoặc không thể cập nhật'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin bàn thành công',
      data: updatedTable
    });
  } catch (error) {
    console.error('Error in updateTable controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông tin bàn',
      error: error.message
    });
  }
};

/**
 * Xóa bàn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    
    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID bàn'
      });
    }
    
    const result = await tableModel.deleteTable(tableId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bàn hoặc không thể xóa'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Xóa bàn thành công'
    });
  } catch (error) {
    console.error('Error in deleteTable controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa bàn',
      error: error.message
    });
  }
};

/**
 * Lọc bàn theo trạng thái và tìm kiếm
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const filterTables = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    const result = await tableModel.filterTables({
      status,
      search,
      page,
      limit
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in filterTables controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lọc danh sách bàn',
      error: error.message
    });
  }
};

/**
 * Cập nhật hàng loạt trạng thái bàn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const bulkUpdateTableStatus = async (req, res) => {
  try {
    const { store_id, current_status, new_status } = req.body;
    
    if (!new_status) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu trạng thái mới (new_status)'
      });
    }
    
    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!validStatuses.includes(new_status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Trạng thái hợp lệ: available, occupied, reserved, maintenance'
      });
    }
    
    const result = await tableModel.bulkUpdateTableStatus({
      store_id,
      current_status,
      new_status
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Không có bàn nào được cập nhật'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật hàng loạt trạng thái bàn thành công'
    });
  } catch (error) {
    console.error('Error in bulkUpdateTableStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật hàng loạt trạng thái bàn',
      error: error.message
    });
  }
};

module.exports = {
  getAllTables,
  getAvailableTables,
  getTableById,
  updateTableStatus,
  getTablesByTypeAndSeats,
  checkTableAvailability,
  createTable,
  updateTable,
  deleteTable,
  filterTables,
  bulkUpdateTableStatus
};
