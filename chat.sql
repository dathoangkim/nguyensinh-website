-- Tạo bảng chat_messages để lưu trữ tin nhắn giữa người dùng và AI
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `message_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `session_id` VARCHAR(36) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `is_from_user` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng chat_sessions để lưu trữ phiên chat cho người dùng chưa đăng nhập
CREATE TABLE IF NOT EXISTS `chat_sessions` (
  `session_id` VARCHAR(36) PRIMARY KEY,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng ai_prompts để lưu trữ các prompt mẫu cho AI
CREATE TABLE IF NOT EXISTS `ai_prompts` (
  `prompt_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `content` TEXT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng ai_conversation_logs để lưu trữ lịch sử hội thoại với AI
CREATE TABLE IF NOT EXISTS `ai_conversation_logs` (
  `log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `session_id` VARCHAR(36) DEFAULT NULL,
  `user_message` TEXT NOT NULL,
  `ai_response` TEXT NOT NULL,
  `prompt_used` TEXT,
  `tokens_used` INT DEFAULT 0,
  `processing_time` FLOAT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng ai_feedback để lưu trữ phản hồi của người dùng về câu trả lời của AI
CREATE TABLE IF NOT EXISTS `ai_feedback` (
  `feedback_id` INT AUTO_INCREMENT PRIMARY KEY,
  `log_id` INT NOT NULL,
  `user_id` INT DEFAULT NULL,
  `session_id` VARCHAR(36) DEFAULT NULL,
  `rating` TINYINT(1) DEFAULT NULL,
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`log_id`) REFERENCES `ai_conversation_logs`(`log_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng ai_settings để lưu trữ cấu hình cho AI
CREATE TABLE IF NOT EXISTS `ai_settings` (
  `setting_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_setting_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng chat_notifications để lưu trữ thông báo tự động từ AI
CREATE TABLE IF NOT EXISTS `chat_notifications` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('promotion', 'system', 'event') NOT NULL DEFAULT 'system',
  `trigger_event` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `start_date` TIMESTAMP NULL DEFAULT NULL,
  `end_date` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng user_notification_logs để lưu trữ thông báo đã hiển thị cho người dùng
CREATE TABLE IF NOT EXISTS `user_notification_logs` (
  `log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `session_id` VARCHAR(36) DEFAULT NULL,
  `notification_id` INT NOT NULL,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`notification_id`) REFERENCES `chat_notifications`(`notification_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chèn dữ liệu mẫu cho bảng ai_prompts
INSERT INTO `ai_prompts` (`name`, `content`, `is_active`) VALUES
('default_system_prompt', 'Bạn là trợ lý AI của tiệm bánh mì Nguyên Sinh, một thương hiệu bánh mì gia truyền từ năm 1942. 
Thông tin về Nguyên Sinh:
- Địa chỉ chính: 141 Trần Đình Xu, Quận 1, TP.HCM
- Hotline: 08.1942.1942
- Giờ mở cửa: 7:00 - 21:00 hàng ngày
- Sản phẩm nổi bật: Bánh Mì Pate Thịt Nguội, Pate Gan Gà Thủ Công, Thịt Nguội Gia Truyền, Bánh Mì Chảo
- Dịch vụ: Đặt hàng online, giao hàng, đặt bàn
- Website: nguyensinh.com

Hãy trả lời thân thiện, ngắn gọn và chính xác. Nếu không biết câu trả lời, hãy đề nghị khách hàng liên hệ qua số điện thoại 08.1942.1942.', 1),
('promotion_prompt', 'Bạn là trợ lý AI của tiệm bánh mì Nguyên Sinh. Hãy giới thiệu về chương trình khuyến mãi hiện tại một cách hấp dẫn. Nhấn mạnh vào giá trị của khuyến mãi và thời hạn sử dụng. Kết thúc bằng lời mời sử dụng mã giảm giá.', 1),
('product_recommendation', 'Dựa trên thông tin về khách hàng và lịch sử mua hàng, hãy đề xuất các sản phẩm phù hợp từ menu của Nguyên Sinh. Giải thích ngắn gọn lý do đề xuất và đưa ra gợi ý về các combo phù hợp.', 1);

-- Chèn dữ liệu mẫu cho bảng ai_settings
INSERT INTO `ai_settings` (`name`, `value`, `description`) VALUES
('openai_model', 'gpt-3.5-turbo', 'Mô hình OpenAI được sử dụng cho chatbot'),
('max_tokens', '300', 'Số lượng token tối đa cho mỗi phản hồi của AI'),
('temperature', '0.7', 'Độ sáng tạo của AI (0.0 - 1.0)'),
('welcome_message', 'Xin chào! Tôi là trợ lý AI của Nguyên Sinh. Tôi có thể giúp gì cho bạn về bánh mì, đặt hàng, hoặc thông tin cửa hàng?', 'Tin nhắn chào mừng khi người dùng mở chatbox'),
('enable_promotion_notifications', 'true', 'Bật/tắt thông báo khuyến mãi tự động'),
('promotion_display_delay', '2000', 'Thời gian chờ trước khi hiển thị thông báo khuyến mãi (ms)');

-- Chèn dữ liệu mẫu cho bảng chat_notifications
INSERT INTO `chat_notifications` (`title`, `message`, `type`, `trigger_event`, `is_active`) VALUES
('Chào mừng thành viên mới', '👋 Chào mừng bạn đến với Nguyên Sinh! Nhân dịp này, bạn có thể sử dụng mã **WELCOME10** để được giảm 10% cho đơn hàng đầu tiên. Chúc bạn ngon miệng!', 'promotion', 'signup', 1),
('Khuyến mãi đặt hàng', '🛒 Cảm ơn bạn đã thêm sản phẩm vào giỏ hàng! Sử dụng mã **FREESHIP** để được miễn phí giao hàng cho đơn từ 200.000đ. Mã có hiệu lực đến hết tháng này!', 'promotion', 'addToCart', 1),
('Ưu đãi đặt bàn', '🍽️ Cảm ơn bạn đã đặt bàn tại Nguyên Sinh! Xuất trình mã **TABLE10** khi đến cửa hàng để được giảm 10% tổng hóa đơn cho nhóm của bạn.', 'promotion', 'reservation', 1),
('Sinh nhật', '🎂 Chúc mừng sinh nhật! Nguyên Sinh tặng bạn mã **BIRTHDAY25** để được giảm 25% cho đơn hàng trong ngày sinh nhật của bạn. Chúc bạn một ngày thật vui!', 'event', 'birthday', 1);