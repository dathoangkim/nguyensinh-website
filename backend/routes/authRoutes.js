const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  changePassword 
} = require('../controllers/authController');
const { protect, rateLimit } = require('../middleware/authMiddleware');

// Giới hạn số lần đăng nhập thất bại
const loginRateLimit = rateLimit(5, 60 * 1000); // 5 lần trong 1 phút

// Các routes xác thực
router.post('/register', register);
router.post('/login', loginRateLimit, login);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router;
