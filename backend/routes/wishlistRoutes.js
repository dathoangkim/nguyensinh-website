const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistItem,
  clearWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

// Tất cả các routes đều yêu cầu xác thực
router.use(protect);

// Lấy danh sách yêu thích của người dùng
router.get('/', getWishlist);

// Thêm sản phẩm vào danh sách yêu thích
router.post('/', addToWishlist);

// Kiểm tra xem sản phẩm có trong danh sách yêu thích không
router.get('/check/:productId', checkWishlistItem);

// Xóa tất cả sản phẩm khỏi danh sách yêu thích
router.delete('/', clearWishlist);

// Xóa sản phẩm khỏi danh sách yêu thích
router.delete('/:productId', removeFromWishlist);

module.exports = router;