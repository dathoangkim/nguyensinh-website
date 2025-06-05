const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// Lấy giỏ hàng của người dùng đã đăng nhập
router.get('/', protect, cartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', protect, cartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update/:id', protect, cartController.updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:id', protect, cartController.removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', protect, cartController.clearCart);

// Đồng bộ giỏ hàng từ local lên server
router.post('/sync', protect, cartController.syncCart);

module.exports = router;
