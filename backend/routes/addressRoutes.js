const express = require('express');
const router = express.Router();
const {
  getUserAddresses,
  getAddressById,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');

// Tất cả các routes đều yêu cầu xác thực
router.use(protect);

// Lấy tất cả địa chỉ của người dùng
router.get('/', getUserAddresses);

// Lấy địa chỉ mặc định của người dùng
router.get('/default', getDefaultAddress);

// Lấy địa chỉ theo ID
router.get('/:id', getAddressById);

// Tạo địa chỉ mới
router.post('/', createAddress);

// Cập nhật địa chỉ
router.put('/:id', updateAddress);

// Đặt địa chỉ làm mặc định
router.put('/:id/default', setDefaultAddress);

// Xóa địa chỉ
router.delete('/:id', deleteAddress);

module.exports = router;