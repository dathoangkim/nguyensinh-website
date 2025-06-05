const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

// Các routes cần xác thực
router.post('/messages', protect, chatController.saveMessage);
router.get('/conversation', protect, chatController.getConversation);
router.post('/ai-response', protect, chatController.getAIResponse);
router.post('/feedback', protect, chatController.saveAIFeedback);
router.get('/promotion', protect, chatController.getPromotionMessage);
router.get('/active-coupons', protect, chatController.getActiveCoupons);

// Routes công khai cho người dùng chưa đăng nhập
router.post('/public/ai-response', chatController.getPublicAIResponse);
router.get('/public/conversation', chatController.getPublicConversation);
router.post('/public/feedback', chatController.savePublicAIFeedback);
router.get('/public/promotion', chatController.getPublicPromotionMessage);

// Routes cho admin
router.get('/settings', protect, admin, chatController.getAISettings);

module.exports = router;
