const reservationModel = require('../models/reservationModel');
const tableModel = require('../models/tableModel');

/**
 * Lấy tất cả đơn đặt bàn (chỉ admin)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllReservations = async (req, res) => {
  try {
    // Lấy tham số phân trang nếu có
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    
    const reservations = await reservationModel.getAllReservations();
    
    // Phân trang kết quả
    const paginatedReservations = reservations.slice(startIndex, startIndex + limit);
    
    res.status(200).json({
      success: true,
      count: reservations.length,
      totalPages: Math.ceil(reservations.length / limit),
      currentPage: page,
      data: paginatedReservations
    });
  } catch (error) {
    console.error('Error in getAllReservations controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn đặt bàn',
      error: error.message
    });
  }
};

/**
 * Tạo đơn đặt bàn mới
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createReservation = async (req, res) => {
  try {
    // Lấy thông tin từ request body
    const reservationData = {
      user_id: req.user ? req.user.user_id : null,
      store_id: req.body.store_id,
      table_id: req.body.table_id,
      full_name: req.body.full_name,
      email: req.body.email,
      phone: req.body.phone,
      reservation_date: req.body.reservation_date,
      reservation_time: req.body.reservation_time,
      guests: req.body.guests,
      occasion: req.body.occasion,
      notes: req.body.notes,
      deposit_method: req.body.deposit_method || 'none',
      deposit_amount: req.body.deposit_amount || 0,
      update_table_status: true
    };
    
    // Kiểm tra dữ liệu đầu vào
    if (!reservationData.store_id || !reservationData.table_id || !reservationData.full_name || 
        !reservationData.email || !reservationData.phone || !reservationData.reservation_date || 
        !reservationData.reservation_time || !reservationData.guests) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết cho đơn đặt bàn'
      });
    }
    
    // Kiểm tra bàn có trống không
    const isAvailable = await tableModel.isTableAvailable(
      reservationData.table_id, 
      reservationData.reservation_date, 
      reservationData.reservation_time
    );
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Bàn đã được đặt hoặc không khả dụng trong khung giờ này'
      });
    }
    
    // Tạo đơn đặt bàn
    const reservationId = await reservationModel.createReservation(reservationData);
    
    // Lấy thông tin đơn đặt bàn vừa tạo
    const reservation = await reservationModel.getReservationById(reservationId);
    
    res.status(201).json({
      success: true,
      message: 'Đặt bàn thành công',
      data: reservation
    });
  } catch (error) {
    console.error('Error in createReservation controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo đơn đặt bàn',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn đặt bàn của người dùng đăng nhập
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserReservations = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const reservations = await reservationModel.getUserReservations(userId);
    
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Error in getUserReservations controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn đặt bàn',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin đơn đặt bàn theo ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getReservationById = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservation = await reservationModel.getReservationById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt bàn'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user) {
      // Người dùng đã đăng nhập - kiểm tra quyền
      if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.user_id !== reservation.user_id) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập đơn đặt bàn này'
        });
      }
    } else {
      // Người dùng chưa đăng nhập - kiểm tra thông tin từ query params
      const { phone, email, reservation_code } = req.query;
      
      // Nếu không có thông tin xác thực, từ chối truy cập
      if (!phone && !email && !reservation_code) {
        return res.status(403).json({
          success: false,
          message: 'Vui lòng cung cấp thông tin xác thực để xem đơn đặt bàn'
        });
      }
      
      // Kiểm tra thông tin xác thực
      let isAuthorized = false;
      
      if (reservation_code && reservation.reservation_code === reservation_code) {
        isAuthorized = true;
      } else if (phone && reservation.phone === phone) {
        isAuthorized = true;
      } else if (email && reservation.email === email) {
        isAuthorized = true;
      }
      
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Thông tin xác thực không chính xác'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error in getReservationById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin đơn đặt bàn',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái đơn đặt bàn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateReservationStatus = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin trạng thái'
      });
    }
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Trạng thái hợp lệ: pending, confirmed, completed, cancelled, no_show'
      });
    }
    
    // Cập nhật trạng thái
    await reservationModel.updateReservationStatus(
      reservationId, 
      status, 
      req.user ? req.user.user_id : null, 
      notes
    );
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn đặt bàn thành công'
    });
  } catch (error) {
    console.error('Error in updateReservationStatus controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái đơn đặt bàn',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn đặt bàn theo cửa hàng và ngày
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getStoreReservations = async (req, res) => {
  try {
    // Kiểm tra quyền admin hoặc nhân viên nếu người dùng đã đăng nhập
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }
    
    const { storeId, date } = req.query;
    
    if (!storeId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết: storeId, date'
      });
    }
    
    const reservations = await reservationModel.getStoreReservations(storeId, date);
    
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Error in getStoreReservations controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn đặt bàn của cửa hàng',
      error: error.message
    });
  }
};

/**
 * Lấy lịch sử trạng thái đơn đặt bàn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getReservationStatusHistory = async (req, res) => {
  try {
    const reservationId = req.params.id;
    
    // Kiểm tra quyền truy cập tương tự như getReservationById
    const reservation = await reservationModel.getReservationById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt bàn'
      });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user) {
      // Người dùng đã đăng nhập - kiểm tra quyền
      if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.user_id !== reservation.user_id) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập lịch sử đơn đặt bàn này'
        });
      }
    } else {
      // Người dùng chưa đăng nhập - kiểm tra thông tin từ query params
      const { phone, email, reservation_code } = req.query;
      
      // Nếu không có thông tin xác thực, từ chối truy cập
      if (!phone && !email && !reservation_code) {
        return res.status(403).json({
          success: false,
          message: 'Vui lòng cung cấp thông tin xác thực để xem lịch sử đơn đặt bàn'
        });
      }
      
      // Kiểm tra thông tin xác thực
      let isAuthorized = false;
      
      if (reservation_code && reservation.reservation_code === reservation_code) {
        isAuthorized = true;
      } else if (phone && reservation.phone === phone) {
        isAuthorized = true;
      } else if (email && reservation.email === email) {
        isAuthorized = true;
      }
      
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Thông tin xác thực không chính xác'
        });
      }
    }
    
    const history = await reservationModel.getReservationStatusHistory(reservationId);
    
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error in getReservationStatusHistory controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử trạng thái đơn đặt bàn',
      error: error.message
    });
  }
};

/**
 * Xóa đơn đặt bàn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteReservation = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const result = await reservationModel.deleteReservation(reservationId);
    
    if (result) {
      res.status(200).json({
        success: true,
        message: 'Xóa đơn đặt bàn thành công'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt bàn'
      });
    }
  } catch (error) {
    console.error('Error in deleteReservation controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa đơn đặt bàn',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin thanh toán đặt cọc
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateReservationPayment = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const { status, transaction_id } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin trạng thái thanh toán'
      });
    }
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán không hợp lệ. Trạng thái hợp lệ: pending, completed, failed, refunded'
      });
    }
    
    const result = await reservationModel.updateReservationPayment(reservationId, {
      status,
      transaction_id: transaction_id || null
    });
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thanh toán thành công'
    });
  } catch (error) {
    console.error('Error in updateReservationPayment controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông tin thanh toán',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn đặt bàn theo số điện thoại
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getReservationsByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu số điện thoại'
      });
    }
    
    const reservations = await reservationModel.getReservationsByPhone(phone);
    
    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    console.error('Error in getReservationsByPhone controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn đặt bàn',
      error: error.message
    });
  }
};

/**
 * Lấy thống kê đơn đặt bàn
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getReservationStats = async (req, res) => {
  try {
    const stats = await reservationModel.getReservationStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getReservationStats controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê đơn đặt bàn',
      error: error.message
    });
  }
};

module.exports = {
  getAllReservations,
  createReservation,
  getUserReservations,
  getReservationById,
  updateReservationStatus,
  getStoreReservations,
  getReservationStatusHistory,
  deleteReservation,
  updateReservationPayment,
  getReservationsByPhone,
  getReservationStats
};
