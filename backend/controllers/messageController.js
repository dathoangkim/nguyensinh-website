const messageModel = require('../models/messageModel');

// @desc    Lấy tất cả tin nhắn
// @route   GET /api/messages
// @access  Admin
const getAllMessages = async (req, res) => {
  try {
    const messages = await messageModel.getAllMessages();
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error in getAllMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách tin nhắn',
      error: error.message
    });
  }
};

// @desc    Lấy tin nhắn theo ID
// @route   GET /api/messages/:id
// @access  Admin
const getMessageById = async (req, res) => {
  try {
    const message = await messageModel.getMessageById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn'
      });
    }
    
    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error in getMessageById:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin tin nhắn',
      error: error.message
    });
  }
};

// @desc    Lấy tin nhắn của người dùng hiện tại
// @route   GET /api/messages/me
// @access  Private
const getMyMessages = async (req, res) => {
  try {
    const messages = await messageModel.getMessagesByUser(req.user.user_id);
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error in getMyMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách tin nhắn của bạn',
      error: error.message
    });
  }
};

// @desc    Tạo tin nhắn mới (form liên hệ)
// @route   POST /api/messages
// @access  Public
const createMessage = async (req, res) => {
  try {
    const { subject, content, channel } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung tin nhắn'
      });
    }
    
    // Lấy user_id nếu người dùng đã đăng nhập
    const user_id = req.user ? req.user.user_id : null;
    
    const newMessage = await messageModel.createMessage({
      user_id,
      channel: channel || 'contact_form',
      subject,
      content
    });
    
    res.status(201).json({
      success: true,
      message: 'Gửi tin nhắn thành công',
      data: newMessage
    });
  } catch (error) {
    console.error('Error in createMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn',
      error: error.message
    });
  }
};

// @desc    Cập nhật trạng thái tin nhắn
// @route   PUT /api/messages/:id/status
// @access  Admin
const updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['new', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái hợp lệ: new, replied, closed'
      });
    }
    
    const updatedMessage = await messageModel.updateMessageStatus(req.params.id, status);
    
    if (!updatedMessage) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái tin nhắn thành công',
      data: updatedMessage
    });
  } catch (error) {
    console.error('Error in updateMessageStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái tin nhắn',
      error: error.message
    });
  }
};

// @desc    Xóa tin nhắn
// @route   DELETE /api/messages/:id
// @access  Admin
const deleteMessage = async (req, res) => {
  try {
    const success = await messageModel.deleteMessage(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Xóa tin nhắn thành công'
    });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa tin nhắn',
      error: error.message
    });
  }
};

// @desc    Lấy số lượng tin nhắn mới
// @route   GET /api/messages/count/new
// @access  Admin
const getNewMessagesCount = async (req, res) => {
  try {
    const count = await messageModel.getNewMessagesCount();
    
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error in getNewMessagesCount:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy số lượng tin nhắn mới',
      error: error.message
    });
  }
};

module.exports = {
  getAllMessages,
  getMessageById,
  getMyMessages,
  createMessage,
  updateMessageStatus,
  deleteMessage,
  getNewMessagesCount
};