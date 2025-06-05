const chatModel = require('../models/chatModel');

/**
 * Lưu tin nhắn vào cơ sở dữ liệu
 * @route POST /api/chat/messages
 * @access Private
 */
const saveMessage = async (req, res) => {
  try {
    const { message, isFromUser } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.body.sessionId || null;
    
    const messageId = await chatModel.saveMessage(userId, sessionId, message, isFromUser);
    
    res.status(201).json({
      success: true,
      data: { messageId }
    });
  } catch (error) {
    console.error('Error in saveMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lưu tin nhắn',
      error: error.message
    });
  }
};

/**
 * Lấy lịch sử hội thoại của người dùng
 * @route GET /api/chat/conversation
 * @access Private
 */
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const messages = await chatModel.getConversationByUserId(userId);
    
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error in getConversation:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử tin nhắn',
      error: error.message
    });
  }
};

/**
 * Lấy lịch sử hội thoại của phiên
 * @route GET /api/chat/public/conversation
 * @access Public
 */
const getPublicConversation = async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu sessionId'
      });
    }
    
    const messages = await chatModel.getConversationBySessionId(sessionId);
    
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error in getPublicConversation:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử tin nhắn',
      error: error.message
    });
  }
};

/**
 * Lấy phản hồi từ AI cho người dùng đã đăng nhập
 * @route POST /api/chat/ai-response
 * @access Private
 */
const getAIResponse = async (req, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.user ? req.user.id : null;
    
    // Lấy phản hồi từ AI
    const aiResponse = await chatModel.getAIResponse(message, history, userId);
    
    // Lưu tin nhắn của người dùng và phản hồi của AI vào cơ sở dữ liệu
    await chatModel.saveMessage(userId, null, message, true); // Tin nhắn người dùng
    await chatModel.saveMessage(userId, null, aiResponse, false); // Phản hồi AI
    
    res.status(200).json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('Error in getAIResponse:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy phản hồi từ AI',
      error: error.message
    });
  }
};

/**
 * Lấy phản hồi từ AI cho người dùng chưa đăng nhập
 * @route POST /api/chat/public/ai-response
 * @access Public
 */
const getPublicAIResponse = async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu sessionId'
      });
    }
    
    // Lưu hoặc cập nhật phiên chat
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await chatModel.createOrUpdateSession(sessionId, ipAddress, userAgent);
    
    // Lấy phản hồi từ AI
    const aiResponse = await chatModel.getAIResponse(message, history, null, sessionId);
    
    // Lưu tin nhắn của người dùng và phản hồi của AI vào cơ sở dữ liệu
    await chatModel.saveMessage(null, sessionId, message, true); // Tin nhắn người dùng
    await chatModel.saveMessage(null, sessionId, aiResponse, false); // Phản hồi AI
    
    res.status(200).json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('Error in getPublicAIResponse:', error);
    
    // Kiểm tra lỗi API
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi xác thực API. Vui lòng liên hệ quản trị viên.',
        error: 'API authentication error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Không thể lấy phản hồi từ AI',
      error: error.message
    });
  }
};

/**
 * Lưu phản hồi của người dùng về câu trả lời của AI
 * @route POST /api/chat/feedback
 * @access Private
 */
const saveAIFeedback = async (req, res) => {
  try {
    const { logId, rating, comment } = req.body;
    const userId = req.user ? req.user.id : null;
    
    if (!logId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết'
      });
    }
    
    const feedbackId = await chatModel.saveAIFeedback(logId, userId, null, rating, comment);
    
    res.status(201).json({
      success: true,
      data: { feedbackId }
    });
  } catch (error) {
    console.error('Error in saveAIFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lưu phản hồi',
      error: error.message
    });
  }
};

/**
 * Lưu phản hồi của người dùng chưa đăng nhập về câu trả lời của AI
 * @route POST /api/chat/public/feedback
 * @access Public
 */
const savePublicAIFeedback = async (req, res) => {
  try {
    const { logId, sessionId, rating, comment } = req.body;
    
    if (!logId || !sessionId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết'
      });
    }
    
    const feedbackId = await chatModel.saveAIFeedback(logId, null, sessionId, rating, comment);
    
    res.status(201).json({
      success: true,
      data: { feedbackId }
    });
  } catch (error) {
    console.error('Error in savePublicAIFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lưu phản hồi',
      error: error.message
    });
  }
};

/**
 * Lấy thông báo khuyến mãi cho người dùng đã đăng nhập
 * @route GET /api/chat/promotion
 * @access Private
 */
const getPromotionMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventType = req.query.event || null;
    
    // Lấy thông báo khuyến mãi
    const promotionMessage = await chatModel.getPromotionMessage(userId, null, eventType);
    
    res.status(200).json({
      success: true,
      data: { 
        hasPromotion: !!promotionMessage,
        message: promotionMessage 
      }
    });
  } catch (error) {
    console.error('Error in getPromotionMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông báo khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy thông báo khuyến mãi cho người dùng chưa đăng nhập
 * @route GET /api/chat/public/promotion
 * @access Public
 */
const getPublicPromotionMessage = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const eventType = req.query.event || null;
    
    // Lấy thông báo khuyến mãi cho người dùng chưa đăng nhập
    const promotionMessage = await chatModel.getPromotionMessage(null, sessionId, eventType);
    
    res.status(200).json({
      success: true,
      data: { 
        hasPromotion: !!promotionMessage,
        message: promotionMessage 
      }
    });
  } catch (error) {
    console.error('Error in getPublicPromotionMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông báo khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách mã khuyến mãi đang hoạt động
 * @route GET /api/chat/active-coupons
 * @access Private
 */
const getActiveCoupons = async (req, res) => {
  try {
    const coupons = await chatModel.getActiveCoupons();
    
    res.status(200).json({
      success: true,
      data: coupons
    });
  } catch (error) {
    console.error('Error in getActiveCoupons:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách mã khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy cài đặt AI
 * @route GET /api/chat/settings
 * @access Private/Admin
 */
const getAISettings = async (req, res) => {
  try {
    const settings = await chatModel.getAISettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error in getAISettings:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy cài đặt AI',
      error: error.message
    });
  }
};

module.exports = {
  saveMessage,
  getConversation,
  getPublicConversation,
  getAIResponse,
  getPublicAIResponse,
  saveAIFeedback,
  savePublicAIFeedback,
  getPromotionMessage,
  getPublicPromotionMessage,
  getActiveCoupons,
  getAISettings
};
