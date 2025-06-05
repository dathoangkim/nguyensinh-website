const express = require('express');
const router = express.Router();
const {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

// Lấy tất cả phiếu giảm giá (Admin)
router.get('/', protect, admin, getAllCoupons);

// Lấy phiếu giảm giá theo ID (Admin)
router.get('/:id', protect, admin, getCouponById);

// Tạo phiếu giảm giá mới (Admin)
router.post('/', protect, admin, createCoupon);

// Cập nhật phiếu giảm giá (Admin)
router.put('/:id', protect, admin, updateCoupon);

// Xóa phiếu giảm giá (Admin)
router.delete('/:id', protect, admin, deleteCoupon);

// Kiểm tra tính hợp lệ của phiếu giảm giá (Public)
router.post('/validate', validateCoupon);

module.exports = router;