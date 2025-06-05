const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentById,
  getPaymentByOrder,
  getMyPayments,
  createPayment,
  updatePaymentStatus
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Lấy tất cả thanh toán (Admin)
router.get('/', protect, admin, getAllPayments);

// Lấy thanh toán của người dùng hiện tại
router.get('/user', protect, getMyPayments);

// Lấy thanh toán theo đơn hàng
router.get('/order/:orderId', protect, getPaymentByOrder);

// Lấy thanh toán theo ID
router.get('/:id', protect, getPaymentById);

// Tạo thanh toán mới
router.post('/', protect, createPayment);

// Cập nhật trạng thái thanh toán (Admin hoặc Webhook)
router.put('/:id/status', updatePaymentStatus);

module.exports = router;