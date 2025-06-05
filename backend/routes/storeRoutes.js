const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { protect, admin } = require('../middleware/authMiddleware');

// Lấy tất cả cửa hàng
router.get('/', storeController.getAllStores);

// Lấy cửa hàng theo ID
router.get('/:id', storeController.getStoreById);

// Tìm cửa hàng gần nhất
router.get('/nearest/:lat/:lng', storeController.getNearestStores);

// Tạo cửa hàng mới (yêu cầu quyền admin)
router.post('/', protect, admin, storeController.createStore);

// Cập nhật cửa hàng (yêu cầu quyền admin)
router.put('/:id', protect, admin, storeController.updateStore);

// Xóa cửa hàng (yêu cầu quyền admin)
router.delete('/:id', protect, admin, storeController.deleteStore);

module.exports = router;