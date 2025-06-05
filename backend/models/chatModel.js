const pool = require('../config/db').pool;
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Lưu tin nhắn vào cơ sở dữ liệu
 * @param {number|null} userId - ID của người dùng (null nếu chưa đăng nhập)
 * @param {string|null} sessionId - ID phiên (nếu người dùng chưa đăng nhập)
 * @param {string} message - Nội dung tin nhắn
 * @param {boolean} isFromUser - Tin nhắn từ người dùng (true) hoặc từ AI (false)
 * @returns {Promise<number>} - ID của tin nhắn đã lưu
 */
const saveMessage = async (userId, sessionId, message, isFromUser) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO chat_messages (user_id, session_id, message, is_from_user) VALUES (?, ?, ?, ?)',
      [userId, sessionId, message, isFromUser]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử hội thoại của người dùng
 * @param {number} userId - ID của người dùng
 * @returns {Promise<Array>} - Danh sách tin nhắn
 */
const getConversationByUserId = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử hội thoại của phiên
 * @param {string} sessionId - ID phiên
 * @returns {Promise<Array>} - Danh sách tin nhắn
 */
const getConversationBySessionId = async (sessionId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );
    return rows;
  } catch (error) {
    console.error('Error getting conversation by session:', error);
    throw error;
  }
};

/**
 * Tạo hoặc cập nhật phiên chat
 * @param {string} sessionId - ID phiên
 * @param {string} ipAddress - Địa chỉ IP
 * @param {string} userAgent - User agent
 * @returns {Promise<void>}
 */
const createOrUpdateSession = async (sessionId, ipAddress, userAgent) => {
  try {
    const [existingSession] = await pool.query(
      'SELECT * FROM chat_sessions WHERE session_id = ?',
      [sessionId]
    );
    
    if (existingSession.length > 0) {
      // Cập nhật phiên hiện có
      await pool.query(
        'UPDATE chat_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?',
        [sessionId]
      );
    } else {
      // Tạo phiên mới
      await pool.query(
        'INSERT INTO chat_sessions (session_id, ip_address, user_agent) VALUES (?, ?, ?)',
        [sessionId, ipAddress, userAgent]
      );
    }
  } catch (error) {
    console.error('Error creating/updating session:', error);
    throw error;
  }
};

/**
 * Lấy cài đặt AI từ cơ sở dữ liệu
 * @returns {Promise<Object>} - Cài đặt AI
 */
const getAISettings = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM ai_settings');
    
    // Chuyển đổi mảng thành đối tượng
    const settings = {};
    rows.forEach(row => {
      // Chuyển đổi giá trị thành kiểu dữ liệu phù hợp
      let value = row.value;
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(value) && value.indexOf('.') !== -1) value = parseFloat(value);
      else if (!isNaN(value)) value = parseInt(value);
      
      settings[row.name] = value;
    });
    
    return settings;
  } catch (error) {
    console.error('Error getting AI settings:', error);
    // Trả về cài đặt mặc định nếu có lỗi
    return {
      openai_model: 'gpt-3.5-turbo',
      max_tokens: 300,
      temperature: 0.7,
      welcome_message: 'Xin chào! Tôi là trợ lý AI của Nguyên Sinh. Tôi có thể giúp gì cho bạn?',
      enable_promotion_notifications: true,
      promotion_display_delay: 2000
    };
  }
};

/**
 * Lấy prompt hệ thống từ cơ sở dữ liệu
 * @param {string} name - Tên prompt
 * @returns {Promise<string>} - Nội dung prompt
 */
const getSystemPrompt = async (name = 'default_system_prompt') => {
  try {
    const [rows] = await pool.query(
      'SELECT content FROM ai_prompts WHERE name = ? AND is_active = 1',
      [name]
    );
    
    if (rows.length > 0) {
      return rows[0].content;
    }
    
    // Trả về prompt mặc định nếu không tìm thấy
    return `Bạn là trợ lý AI của tiệm bánh mì Nguyên Sinh, một thương hiệu bánh mì gia truyền từ năm 1942. 
    Thông tin về Nguyên Sinh:
    - Địa chỉ chính: 141 Trần Đình Xu, Quận 1, TP.HCM
    - Hotline: 08.1942.1942
    - Giờ mở cửa: 7:00 - 21:00 hàng ngày
    - Sản phẩm nổi bật: Bánh Mì Pate Thịt Nguội, Pate Gan Gà Thủ Công, Thịt Nguội Gia Truyền, Bánh Mì Chảo
    - Dịch vụ: Đặt hàng online, giao hàng, đặt bàn
    - Website: nguyensinh.com
    
    Hãy trả lời thân thiện, ngắn gọn và chính xác. Nếu không biết câu trả lời, hãy đề nghị khách hàng liên hệ qua số điện thoại 08.1942.1942.`;
  } catch (error) {
    console.error('Error getting system prompt:', error);
    // Trả về prompt mặc định nếu có lỗi
    return `Bạn là trợ lý AI của tiệm bánh mì Nguyên Sinh. Hãy trả lời thân thiện và hữu ích.`;
  }
};

/**
 * Lấy phản hồi từ AI
 * @param {string} message - Tin nhắn của người dùng
 * @param {Array} history - Lịch sử hội thoại
 * @param {number|null} userId - ID của người dùng (null nếu chưa đăng nhập)
 * @param {string|null} sessionId - ID phiên (nếu người dùng chưa đăng nhập)
 * @returns {Promise<string>} - Phản hồi từ AI
 */
const getAIResponse = async (message, history, userId = null, sessionId = null) => {
  try {
    // Lấy cài đặt AI
    const settings = await getAISettings();
    
    // Lấy prompt hệ thống
    const systemPrompt = await getSystemPrompt();
    
    // Thời gian bắt đầu xử lý
    const startTime = Date.now();
    
    // Khởi tạo Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Lấy model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: settings.temperature || 0.7,
        maxOutputTokens: settings.max_tokens || 300,
      }
    });
    
    // Chuẩn bị lịch sử hội thoại cho Gemini
    const chatHistory = [];
    
    // Thêm lịch sử hội thoại nếu có
    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.role === 'user') {
          chatHistory.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant') {
          chatHistory.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }
    }
    
    // Khởi tạo chat session
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: settings.temperature || 0.7,
        maxOutputTokens: settings.max_tokens || 300,
      },
    });
    
    // Gửi tin nhắn hệ thống trước (nếu chưa có lịch sử)
    if (!history || history.length === 0) {
      await chat.sendMessage(systemPrompt);
    }
    
    // Gửi tin nhắn người dùng và nhận phản hồi
    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();
    
    // Thời gian kết thúc xử lý
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000; // Chuyển đổi sang giây
    
    // Lưu log hội thoại
    await logAIConversation(
      userId,
      sessionId,
      message,
      aiResponse,
      systemPrompt,
      0, // Gemini không cung cấp thông tin về token
      processingTime
    );

    return aiResponse;
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Trả về phản hồi mặc định nếu có lỗi
    const fallbackResponse = `Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. 

Vui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.

Thông tin về Nguyên Sinh:
- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM
- Giờ mở cửa: 7:00 - 21:00 hàng ngày
- Website: nguyensinh.com`;
    
    return fallbackResponse;
  }
};

/**
 * Lưu log hội thoại với AI
 * @param {number|null} userId - ID của người dùng
 * @param {string|null} sessionId - ID phiên
 * @param {string} userMessage - Tin nhắn của người dùng
 * @param {string} aiResponse - Phản hồi từ AI
 * @param {string} promptUsed - Prompt đã sử dụng
 * @param {number} tokensUsed - Số token đã sử dụng
 * @param {number} processingTime - Thời gian xử lý (giây)
 * @returns {Promise<number>} - ID của log
 */
const logAIConversation = async (
  userId,
  sessionId,
  userMessage,
  aiResponse,
  promptUsed,
  tokensUsed,
  processingTime
) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO ai_conversation_logs 
       (user_id, session_id, user_message, ai_response, prompt_used, tokens_used, processing_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, sessionId, userMessage, aiResponse, promptUsed, tokensUsed, processingTime]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error logging AI conversation:', error);
    // Không ném lỗi để không ảnh hưởng đến luồng chính
    return null;
  }
};

/**
 * Lưu phản hồi của người dùng về câu trả lời của AI
 * @param {number} logId - ID của log hội thoại
 * @param {number|null} userId - ID của người dùng
 * @param {string|null} sessionId - ID phiên
 * @param {number} rating - Đánh giá (1: tích cực, 0: tiêu cực)
 * @param {string|null} comment - Bình luận
 * @returns {Promise<number>} - ID của phản hồi
 */
const saveAIFeedback = async (logId, userId, sessionId, rating, comment = null) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO ai_feedback 
       (log_id, user_id, session_id, rating, comment) 
       VALUES (?, ?, ?, ?, ?)`,
      [logId, userId, sessionId, rating, comment]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error saving AI feedback:', error);
    throw error;
  }
};

/**
 * Lấy mã khuyến mãi có hiệu lực
 * @returns {Promise<Array>} - Danh sách mã khuyến mãi
 */
const getActiveCoupons = async () => {
  try {
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const [rows] = await pool.query(`
      SELECT * FROM coupons 
      WHERE is_active = 1 
      AND (valid_from IS NULL OR valid_from <= ?) 
      AND (valid_to IS NULL OR valid_to >= ?)
      ORDER BY created_at DESC
      LIMIT 5
    `, [currentDate, currentDate]);
    
    return rows;
  } catch (error) {
    console.error('Error getting active coupons:', error);
    throw error;
  }
};

/**
 * Lấy thông báo từ cơ sở dữ liệu dựa trên sự kiện
 * @param {string} eventType - Loại sự kiện
 * @returns {Promise<Object|null>} - Thông báo
 */
const getNotificationByEvent = async (eventType) => {
  try {
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const [rows] = await pool.query(`
      SELECT * FROM chat_notifications 
      WHERE trigger_event = ? 
      AND is_active = 1
      AND (start_date IS NULL OR start_date <= ?)
      AND (end_date IS NULL OR end_date >= ?)
      ORDER BY created_at DESC
      LIMIT 1
    `, [eventType, currentDate, currentDate]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting notification by event:', error);
    return null;
  }
};

/**
 * Kiểm tra xem người dùng đã nhận thông báo chưa
 * @param {number|null} userId - ID của người dùng
 * @param {string|null} sessionId - ID phiên
 * @param {number} notificationId - ID của thông báo
 * @returns {Promise<boolean>} - Đã nhận thông báo hay chưa
 */
const hasReceivedNotification = async (userId, sessionId, notificationId) => {
  try {
    if (userId) {
      const [rows] = await pool.query(
        'SELECT * FROM user_notification_logs WHERE user_id = ? AND notification_id = ?',
        [userId, notificationId]
      );
      return rows.length > 0;
    } else if (sessionId) {
      const [rows] = await pool.query(
        'SELECT * FROM user_notification_logs WHERE session_id = ? AND notification_id = ?',
        [sessionId, notificationId]
      );
      return rows.length > 0;
    }
    return false;
  } catch (error) {
    console.error('Error checking notification status:', error);
    return true; // Trả về true để tránh hiển thị lại thông báo nếu có lỗi
  }
};

/**
 * Lưu log thông báo đã hiển thị cho người dùng
 * @param {number|null} userId - ID của người dùng
 * @param {string|null} sessionId - ID phiên
 * @param {number} notificationId - ID của thông báo
 * @returns {Promise<number>} - ID của log
 */
const logNotification = async (userId, sessionId, notificationId) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO user_notification_logs (user_id, session_id, notification_id) VALUES (?, ?, ?)',
      [userId, sessionId, notificationId]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error logging notification:', error);
    return null;
  }
};

/**
 * Lấy thông báo khuyến mãi cho người dùng
 * @param {number|null} userId - ID của người dùng
 * @param {string|null} sessionId - ID phiên
 * @param {string|null} eventType - Loại sự kiện
 * @returns {Promise<string|null>} - Thông báo khuyến mãi
 */
const getPromotionMessage = async (userId, sessionId = null, eventType = null) => {
  try {
    // Kiểm tra cài đặt
    const settings = await getAISettings();
    if (!settings.enable_promotion_notifications) {
      return null;
    }
    
    // Nếu có sự kiện cụ thể, ưu tiên lấy thông báo theo sự kiện
    if (eventType) {
      const notification = await getNotificationByEvent(eventType);
      
      if (notification) {
        // Kiểm tra xem người dùng đã nhận thông báo này chưa
        const received = await hasReceivedNotification(userId, sessionId, notification.notification_id);
        
        if (!received) {
          // Lưu log thông báo
          await logNotification(userId, sessionId, notification.notification_id);
          
          return notification.message;
        }
      }
    }
    
    // Nếu không có thông báo theo sự kiện hoặc người dùng đã nhận, thử lấy mã khuyến mãi
    const activeCoupons = await getActiveCoupons();
    
    if (!activeCoupons || activeCoupons.length === 0) {
      return null;
    }
    
    // Kiểm tra xem người dùng đã nhận thông báo về mã khuyến mãi này chưa
    if (userId) {
      const [userCoupons] = await pool.query(`
        SELECT coupon_id FROM user_coupons 
        WHERE user_id = ? AND coupon_id IN (?)
      `, [userId, activeCoupons.map(c => c.coupon_id)]);
      
      // Lọc ra các mã khuyến mãi mà người dùng chưa nhận
      const newCoupons = activeCoupons.filter(
        coupon => !userCoupons.some(uc => uc.coupon_id === coupon.coupon_id)
      );
      
      if (newCoupons.length === 0) {
        return null;
      }
      
      // Tạo thông báo với mã khuyến mãi mới nhất
      const coupon = newCoupons[0];
      
      // Lưu thông tin rằng người dùng đã nhận thông báo về mã khuyến mãi này
      await pool.query(`
        INSERT INTO user_coupons (user_id, coupon_id, is_used) 
        VALUES (?, ?, 0)
      `, [userId, coupon.coupon_id]);
      
      return formatCouponMessage(coupon);
    } else {
      // Đối với người dùng chưa đăng nhập, chỉ hiển thị mã khuyến mãi mới nhất
      return formatCouponMessage(activeCoupons[0]);
    }
  } catch (error) {
    console.error('Error getting promotion message:', error);
    return null;
  }
};

/**
 * Định dạng thông báo khuyến mãi
 * @param {Object} coupon - Thông tin mã khuyến mãi
 * @returns {string} - Thông báo đã định dạng
 */
const formatCouponMessage = (coupon) => {
  const discountText = coupon.discount_type === 'percentage' 
    ? `${coupon.discount_value}%` 
    : `${formatCurrency(coupon.discount_value)}`;
  
  const minOrderText = coupon.min_order_amount 
    ? ` cho đơn hàng từ ${formatCurrency(coupon.min_order_amount)}` 
    : '';
  
  const validToText = coupon.valid_to 
    ? ` (có hiệu lực đến ${formatDate(coupon.valid_to)})` 
    : '';
  
  return `🎁 *Khuyến mãi đặc biệt!* 🎁\n\nSử dụng mã **${coupon.code}** để được giảm ${discountText}${minOrderText}${validToText}.\n\n${coupon.description || 'Hãy sử dụng ngay hôm nay!'}`;
};

/**
 * Hàm định dạng tiền tệ
 * @param {number} amount - Số tiền
 * @returns {string} - Chuỗi đã định dạng
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Hàm định dạng ngày
 * @param {string} dateString - Chuỗi ngày
 * @returns {string} - Chuỗi đã định dạng
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

module.exports = {
  saveMessage,
  getConversationByUserId,
  getConversationBySessionId,
  createOrUpdateSession,
  getAISettings,
  getSystemPrompt,
  getAIResponse,
  logAIConversation,
  saveAIFeedback,
  getActiveCoupons,
  getNotificationByEvent,
  hasReceivedNotification,
  logNotification,
  getPromotionMessage
};
