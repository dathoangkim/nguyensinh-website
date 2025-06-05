const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protect, admin, staff } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/tables/store/:storeId
 * @desc    Lấy tất cả bàn theo cửa hàng
 * @access  Public
 */
router.get('/store/:storeId', tableController.getAllTables);

/**
 * @route   GET /api/tables/available
 * @desc    Lấy bàn trống theo điều kiện
 * @access  Public
 */
router.get('/available', tableController.getAvailableTables);

/**
 * @route   GET /api/tables/filter
 * @desc    Lọc bàn theo trạng thái và tìm kiếm
 * @access  Public
 */
router.get('/filter', tableController.filterTables);

/**
 * @route   GET /api/tables/check-availability
 * @desc    Kiểm tra xem bàn có sẵn để đặt không
 * @access  Public
 */
router.get('/check-availability', tableController.checkTableAvailability);

/**
 * @route   POST /api/tables
 * @desc    Tạo bàn mới
 * @access  Private (Staff/Admin)
 */
router.post('/', protect, staff, tableController.createTable);

/**
 * @route   PUT /api/tables/:id
 * @desc    Cập nhật thông tin bàn
 * @access  Private (Staff/Admin)
 */
router.put('/:id', protect, staff, tableController.updateTable);

/**
 * @route   DELETE /api/tables/:id
 * @desc    Xóa bàn
 * @access  Private (Staff/Admin)
 */
router.delete('/:id', protect, staff, tableController.deleteTable);

/**
 * @route   PUT /api/tables/:id/status
 * @desc    Cập nhật trạng thái bàn
 * @access  Private (Staff/Admin)
 */
router.put('/:id/status', protect, staff, tableController.updateTableStatus);

/**
 * @route   GET /api/tables/:id
 * @desc    Lấy thông tin bàn theo ID
 * @access  Public
 */
router.get('/:id', tableController.getTableById);

/**
 * @route   PUT /api/tables/bulk-update
 * @desc    Cập nhật hàng loạt trạng thái bàn
 * @access  Private (Staff/Admin)
 */
router.put('/bulk-update', protect, staff, tableController.bulkUpdateTableStatus);

module.exports = router;
