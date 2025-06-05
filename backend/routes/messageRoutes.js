const express = require('express');
const router = express.Router();
const {
  getAllMessages,
  getMessageById,
  getMyMessages,
  createMessage,
  updateMessageStatus,
  deleteMessage,
  getNewMessagesCount
} = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

// Tạo tin nhắn mới (form liên hệ) - Public
router.post('/', createMessage);

// Lấy tin nhắn của người dùng hiện tại - Private
router.get('/me', protect, getMyMessages);

// Lấy số lượng tin nhắn mới - Admin
router.get('/count/new', protect, admin, getNewMessagesCount);

// Lấy tất cả tin nhắn - Admin
router.get('/', protect, admin, getAllMessages);

// Lấy tin nhắn theo ID - Admin
router.get('/:id', protect, admin, getMessageById);

// Cập nhật trạng thái tin nhắn - Admin
router.put('/:id/status', protect, admin, updateMessageStatus);

// Xóa tin nhắn - Admin
router.delete('/:id', protect, admin, deleteMessage);

module.exports = router;