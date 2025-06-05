const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

// Middleware xác thực người dùng
const protect = async (req, res, next) => {
  let token;

  // Kiểm tra token trong header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];
      
      // Kiểm tra token có đúng định dạng không
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('Token không đúng định dạng JWT');
      }

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin người dùng từ ID trong token
      const [rows] = await pool.query(
        'SELECT user_id, username, email, full_name, role FROM users WHERE user_id = ?',
        [decoded.id]
      );

      if (rows.length === 0) {
        res.status(401);
        throw new Error('Không tìm thấy người dùng');
      }

      // Lưu thông tin người dùng vào request
      req.user = rows[0];
      
      // Thêm các thuộc tính hữu ích
      req.user.isAdmin = req.user.role === 'admin';
      req.user.isStaff = req.user.role === 'staff' || req.user.role === 'admin';
      
      next();
    } catch (error) {
      console.error('Lỗi xác thực token:', error.message);
      
      // Phân loại lỗi để trả về thông báo phù hợp
      let errorMessage = 'Không được phép, token không hợp lệ';
      
      if (error.name === 'JsonWebTokenError' && error.message === 'jwt malformed') {
        errorMessage = 'Token không đúng định dạng, vui lòng đăng nhập lại';
      } else if (error.name === 'TokenExpiredError') {
        errorMessage = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
      }
      
      return res.status(401).json({
        success: false,
        message: errorMessage,
        error: error.name
      });
    }
  }

  if (!token) {
    // Nếu route yêu cầu xác thực bắt buộc, trả về lỗi
    return res.status(401).json({
      success: false,
      message: 'Không được phép, không có token'
    });
  }
};

// Middleware kiểm tra quyền admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, yêu cầu quyền admin'
    });
  }
};

// Middleware kiểm tra quyền nhân viên
const staff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, yêu cầu quyền nhân viên'
    });
  }
};

// Middleware kiểm tra quyền chủ sở hữu tài nguyên
const owner = (resourceModel, resourceIdParam) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.getById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài nguyên'
        });
      }
      
      // Kiểm tra nếu người dùng là admin hoặc chủ sở hữu
      if (req.user.role === 'admin' || resource.user_id === req.user.user_id) {
        next();
      } else {
        res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập tài nguyên này'
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
  };
};

// Middleware kiểm tra rate limit
const rateLimit = (maxRequests, timeWindow) => {
  const requestCounts = new Map();
  
  return (req, res, next) => {
    // Lấy IP của người dùng
    const ip = req.ip || req.connection.remoteAddress;
    
    // Lấy thời gian hiện tại
    const now = Date.now();
    
    // Lấy danh sách yêu cầu của IP này
    const requests = requestCounts.get(ip) || [];
    
    // Lọc các yêu cầu trong khoảng thời gian cho phép
    const recentRequests = requests.filter(time => time > now - timeWindow);
    
    // Kiểm tra số lượng yêu cầu
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
      });
    }
    
    // Thêm yêu cầu mới vào danh sách
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    
    next();
  };
};

// Middleware xác thực tùy chọn (cho phép cả người dùng đã đăng nhập và chưa đăng nhập)
const optionalAuth = async (req, res, next) => {
  let token;

  // Kiểm tra token trong header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];
      
      // Kiểm tra token có đúng định dạng không
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        console.warn('Token không đúng định dạng JWT');
        // Tiếp tục xử lý request mà không cần xác thực
        return next();
      }

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin người dùng từ ID trong token
      const [rows] = await pool.query(
        'SELECT user_id, username, email, full_name, role FROM users WHERE user_id = ?',
        [decoded.id]
      );

      if (rows.length === 0) {
        // Không tìm thấy người dùng nhưng vẫn tiếp tục
        console.log("User not found in database");
        return next();
      }

      // Lưu thông tin người dùng vào request
      req.user = rows[0];
      
      // Thêm các thuộc tính hữu ích
      req.user.isAdmin = req.user.role === 'admin';
      req.user.isStaff = req.user.role === 'staff' || req.user.role === 'admin';
    } catch (error) {
      console.warn('Lỗi xác thực token nhưng vẫn tiếp tục:', error.message);
      // Không trả về lỗi, tiếp tục xử lý request mà không cần xác thực
    }
  }
  
  // Tiếp tục xử lý request mà không cần xác thực
  next();
};

// Xuất middleware
module.exports = {
  protect,
  admin,
  staff,
  owner,
  rateLimit,
  optionalAuth
};
