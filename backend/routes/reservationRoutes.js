const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { protect, admin, staff, optionalAuth } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/reservations
 * @desc    Tạo đơn đặt bàn mới
 * @access  Public
 */
router.post('/', reservationController.createReservation);

/**
 * @route   GET /api/reservations/my-reservations
 * @desc    Lấy đơn đặt bàn của người dùng đăng nhập
 * @access  Private
 */
router.get('/my-reservations', protect, reservationController.getUserReservations);

/**
 * @route   GET /api/reservations/store
 * @desc    Lấy đơn đặt bàn theo cửa hàng và ngày
 * @access  Private (Staff/Admin)
 */
router.get('/store', protect, staff, reservationController.getStoreReservations);

/**
 * @route   GET /api/reservations/stats
 * @desc    Lấy thống kê đơn đặt bàn
 * @access  Private (Staff/Admin)
 */
router.get('/stats', protect, staff, reservationController.getReservationStats);

/**
 * @route   GET /api/reservations/phone
 * @desc    Lấy đơn đặt bàn theo số điện thoại
 * @access  Private (Staff/Admin)
 */
router.get('/phone', protect, staff, reservationController.getReservationsByPhone);

/**
 * @route   GET /api/reservations/:id
 * @desc    Lấy chi tiết đơn đặt bàn
 * @access  Public (với xác thực tùy chọn)
 */
router.get('/:id', optionalAuth, reservationController.getReservationById);

/**
 * @route   PUT /api/reservations/:id/status
 * @desc    Cập nhật trạng thái đơn đặt bàn
 * @access  Private (Staff/Admin)
 */
router.put('/:id/status', protect, staff, reservationController.updateReservationStatus);

/**
 * @route   PUT /api/reservations/:id/payment
 * @desc    Cập nhật thông tin thanh toán đặt cọc
 * @access  Private (Staff/Admin)
 */
router.put('/:id/payment', protect, staff, reservationController.updateReservationPayment);

/**
 * @route   GET /api/reservations/:id/history
 * @desc    Lấy lịch sử trạng thái đơn đặt bàn
 * @access  Public (với xác thực tùy chọn)
 */
router.get('/:id/history', optionalAuth, reservationController.getReservationStatusHistory);

/**
 * @route   GET /api/reservations
 * @desc    Lấy tất cả đơn đặt bàn
 * @access  Private (Admin)
 */
router.get('/', protect, admin, reservationController.getAllReservations);

/**
 * @route   DELETE /api/reservations/:id
 * @desc    Xóa đơn đặt bàn
 * @access  Private (Admin)
 */
router.delete('/:id', protect, admin, reservationController.deleteReservation);

module.exports = router;
