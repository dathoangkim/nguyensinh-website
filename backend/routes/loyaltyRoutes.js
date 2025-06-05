const express = require('express');
const router = express.Router();
const {
  getUserPoints,
  getUserPointsHistory,
  addPoints,
  usePoints,
  calculateOrderPoints
} = require('../controllers/loyaltyPointController');
const { protect, admin } = require('../middleware/authMiddleware');

// Tất cả các routes đều yêu cầu xác thực
router.use(protect);

// Lấy tổng điểm thưởng của người dùng
router.get('/points', getUserPoints);

// Lấy lịch sử điểm thưởng của người dùng
router.get('/history', getUserPointsHistory);

// Thêm điểm thưởng cho người dùng (Admin)
router.post('/add', admin, addPoints);

// Sử dụng điểm thưởng
router.post('/use', usePoints);

// Tính toán điểm thưởng từ giá trị đơn hàng
router.post('/calculate', calculateOrderPoints);

module.exports = router;