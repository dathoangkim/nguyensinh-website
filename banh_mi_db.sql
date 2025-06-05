-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:3306
-- Thời gian đã tạo: Th5 30, 2025 lúc 07:42 AM
-- Phiên bản máy phục vụ: 8.0.30
-- Phiên bản PHP: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `banh_mi_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `addresses`
--

CREATE TABLE `addresses` (
  `address_id` int NOT NULL,
  `user_id` int NOT NULL,
  `label` varchar(50) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `addresses`
--

INSERT INTO `addresses` (`address_id`, `user_id`, `label`, `street`, `city`, `district`, `postal_code`, `lat`, `lng`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 7, 'Địa chỉ giao hàng', '1123uuiuiuguigiguigui', 'HN', 'HN', '', NULL, NULL, 0, '2025-05-16 16:45:42', '2025-05-16 16:45:42'),
(2, 7, 'Địa chỉ giao hàng', '1123uuiuiuguigiguigui', 'HN', 'HN', '', NULL, NULL, 0, '2025-05-16 20:26:42', '2025-05-16 20:26:42'),
(3, 7, 'Địa chỉ giao hàng', '1123uuiuiuguigiguigui', 'HN', 'HN', '', NULL, NULL, 0, '2025-05-16 20:43:28', '2025-05-16 20:43:28'),
(4, 7, 'Địa chỉ giao hàng', '1123uuiuiuguigiguigui', 'HN', 'HN', '', NULL, NULL, 0, '2025-05-16 21:16:57', '2025-05-16 21:16:57'),
(5, 7, 'Địa chỉ giao hàng', '1123uuiuiuguigiguigui', 'HN', 'HN', '', NULL, NULL, 0, '2025-05-16 21:17:02', '2025-05-16 21:17:02');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_conversation_logs`
--

CREATE TABLE `ai_conversation_logs` (
  `log_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ai_response` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `prompt_used` text COLLATE utf8mb4_unicode_ci,
  `tokens_used` int DEFAULT '0',
  `processing_time` float DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_feedback`
--

CREATE TABLE `ai_feedback` (
  `feedback_id` int NOT NULL,
  `log_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` tinyint(1) DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_prompts`
--

CREATE TABLE `ai_prompts` (
  `prompt_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `ai_prompts`
--

INSERT INTO `ai_prompts` (`prompt_id`, `name`, `content`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'default_system_prompt', 'Bạn là trợ lý AI của tiệm bánh mì Nguyên Sinh, một thương hiệu bánh mì gia truyền từ năm 1942. \r\nThông tin về Nguyên Sinh:\r\n- Địa chỉ chính: 141 Trần Đình Xu, Quận 1, TP.HCM\r\n- Hotline: 08.1942.1942\r\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\r\n- Sản phẩm nổi bật: Bánh Mì Pate Thịt Nguội, Pate Gan Gà Thủ Công, Thịt Nguội Gia Truyền, Bánh Mì Chảo\r\n- Dịch vụ: Đặt hàng online, giao hàng, đặt bàn\r\n- Website: nguyensinh.com\r\n\r\nHãy trả lời thân thiện, ngắn gọn và chính xác. Nếu không biết câu trả lời, hãy đề nghị khách hàng liên hệ qua số điện thoại 08.1942.1942.', 1, '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(2, 'promotion_prompt', 'Bạn là trợ lý AI của tiệm bánh mì Nguyên Sinh. Hãy giới thiệu về chương trình khuyến mãi hiện tại một cách hấp dẫn. Nhấn mạnh vào giá trị của khuyến mãi và thời hạn sử dụng. Kết thúc bằng lời mời sử dụng mã giảm giá.', 1, '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(3, 'product_recommendation', 'Dựa trên thông tin về khách hàng và lịch sử mua hàng, hãy đề xuất các sản phẩm phù hợp từ menu của Nguyên Sinh. Giải thích ngắn gọn lý do đề xuất và đưa ra gợi ý về các combo phù hợp.', 1, '2025-05-24 12:46:26', '2025-05-24 12:46:26');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_settings`
--

CREATE TABLE `ai_settings` (
  `setting_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `ai_settings`
--

INSERT INTO `ai_settings` (`setting_id`, `name`, `value`, `description`, `created_at`, `updated_at`) VALUES
(1, 'openai_model', 'gpt-3.5-turbo', 'Mô hình OpenAI được sử dụng cho chatbot', '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(2, 'max_tokens', '300', 'Số lượng token tối đa cho mỗi phản hồi của AI', '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(3, 'temperature', '0.7', 'Độ sáng tạo của AI (0.0 - 1.0)', '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(4, 'welcome_message', 'Xin chào! Tôi là trợ lý AI của Nguyên Sinh. Tôi có thể giúp gì cho bạn về bánh mì, đặt hàng, hoặc thông tin cửa hàng?', 'Tin nhắn chào mừng khi người dùng mở chatbox', '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(5, 'enable_promotion_notifications', 'true', 'Bật/tắt thông báo khuyến mãi tự động', '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(6, 'promotion_display_delay', '2000', 'Thời gian chờ trước khi hiển thị thông báo khuyến mãi (ms)', '2025-05-24 12:46:26', '2025-05-24 12:46:26');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `blog_categories`
--

CREATE TABLE `blog_categories` (
  `category_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `blog_categories`
--

INSERT INTO `blog_categories` (`category_id`, `name`, `slug`, `created_at`, `updated_at`) VALUES
(1, 'Tin tức cửa hàng', 'tin-tuc-cua-hang', '2025-05-10 00:19:12', '2025-05-10 00:19:12'),
(2, 'Mẹo hay', 'meo-hay', '2025-05-10 00:19:12', '2025-05-10 00:19:12'),
(3, 'Ẩm thực Việt', 'am-thuc-viet', '2025-05-10 00:19:12', '2025-05-10 00:19:12'),
(4, 'Khuyến mãi', 'khuyen-mai', '2025-05-10 00:19:12', '2025-05-10 00:19:12'),
(5, 'Câu chuyện thương hiệu', 'cau-chuyen-thuong-hieu', '2025-05-10 00:19:12', '2025-05-10 00:19:12'),
(6, 'Phong cách sống', 'phong-cach-song', '2025-05-10 00:19:12', '2025-05-10 00:19:12');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `blog_posts`
--

CREATE TABLE `blog_posts` (
  `post_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `post_url` varchar(255) NOT NULL,
  `img_url` varchar(255) DEFAULT NULL,
  `content` longtext,
  `author_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `blog_posts`
--

INSERT INTO `blog_posts` (`post_id`, `title`, `slug`, `post_url`, `img_url`, `content`, `author_id`, `category_id`, `published_at`, `is_published`, `created_at`, `updated_at`) VALUES
(13, 'Hiệu bánh mì trường tồn suốt 80 năm ở Thủ đô, giá lên tới 120 nghìn đồng 1 cái', 'mo-rong-chi-nhanh-quan-7', 'https://vietnamnet.vn/hieu-banh-mi-truong-ton-suot-80-nam-o-thu-do-gia-len-toi-120-nghin-dong-1-cai-2014970.html', 'https://static-images.vnncdn.net/files/publish/hieu-banh-mi-truong-ton-suot-80-nam-o-thu-do-gia-len-toi-120-nghin-dong-1-cai-bfb1213cb6aa47e1a460ad689b3ec10a.jpg?width=0&s=zJAMKdVuF7YTFWIhuMIyfA', 'Chúng tôi hân hoan thông báo...', 1, 1, '2025-05-01 08:00:00', 1, '2025-05-10 00:19:25', '2025-05-15 14:56:45'),
(14, 'Hàng bánh mì \"xưa và đắt\" bậc nhất Hà Nội có món pate gan ngỗng trứ danh, đến giờ vẫn nổi và được nhiều người yêu thích', 'bao-quan-banh-mi-ngon-lau', 'https://kenh14.vn/hang-banh-mi-xua-va-dat-bac-nhat-ha-noi-co-mon-pate-gan-ngong-tru-danh-den-gio-van-noi-va-duoc-nhieu-nguoi-yeu-thich-20180913122336334.chn', 'https://kenh14cdn.com/thumb_w/660/2018/9/14/ns10-1536902253502245901539.jpg', 'Để bánh mì luôn giòn ngon...', 2, 2, '2025-04-28 10:00:00', 1, '2025-05-10 00:19:25', '2025-05-15 15:26:04'),
(15, 'Bánh mì Việt Nam - Tự hào ẩm thực dân tộc', 'banh-mi-viet-nam-tu-hao-am-thuc', '/blog/banh-mi-viet-nam-tu-hao-am-thuc', '/images/blog3.jpg', 'Bánh mì không chỉ là món ăn...', 3, 3, '2025-04-25 09:30:00', 1, '2025-05-10 00:19:25', '2025-05-10 00:19:25'),
(16, 'Nguyên Sinh Bistro - est. 1942 lọt Top 10 thương hiệu bánh mỳ lâu đời', 'Tổ chức Kỷ lục Việt Nam (VietKings) vừa xác lập thành tích cho Nguyên Sinh Bistro - est. 1942, trong khuôn khổ Lễ hội Bánh mỳ Việt Nam tại TP HCM.', 'https://vnexpress.net/nguyen-sinh-bistro-est-1942-lot-top-10-thuong-hieu-banh-my-lau-doi-4606666.html', 'https://i1-dulich.vnecdn.net/2023/05/19/banh-2171-1684479318.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=YY5Cg9uJBGG8nz-QpEI8YA', '.', 1, 4, '2025-05-02 07:00:00', 1, '2025-05-10 00:19:25', '2025-05-23 08:12:07'),
(17, 'Hành trình 70 năm cùng bánh mì Nguyên Sinh', 'hanh-trinh-70-nam-nguyen-sinh', '/blog/hanh-trinh-70-nam-nguyen-sinh', '/images/blog5.jpg', 'Từ những ngày đầu năm 1950...', 2, 5, '2025-04-15 08:45:00', 1, '2025-05-10 00:19:25', '2025-05-10 00:19:25'),
(18, 'Bữa sáng lý tưởng cho dân văn phòng', 'bua-sang-cho-dan-van-phong', '/blog/bua-sang-cho-dan-van-phong', '/images/blog6.jpg', 'Bánh mì là lựa chọn tuyệt vời...', 3, 6, '2025-04-10 06:30:00', 1, '2025-05-10 00:19:25', '2025-05-10 00:19:25');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `carts`
--

CREATE TABLE `carts` (
  `cart_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `carts`
--

INSERT INTO `carts` (`cart_id`, `user_id`, `created_at`) VALUES
(1, 7, '2025-05-15 17:51:08'),
(2, 4, '2025-05-29 09:40:45'),
(3, 4, '2025-05-29 09:40:45'),
(4, 10, '2025-05-29 09:41:48'),
(5, 10, '2025-05-29 09:41:48'),
(6, 8, '2025-05-30 13:55:22');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `cart_items`
--

CREATE TABLE `cart_items` (
  `cart_item_id` int NOT NULL,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `options` json DEFAULT NULL,
  `options_text` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `cart_items`
--

INSERT INTO `cart_items` (`cart_item_id`, `cart_id`, `product_id`, `quantity`, `added_at`, `options`, `options_text`) VALUES
(16, 1, 6, 1, '2025-05-17 21:39:21', '[{\"value_id\": \"default_1_3\", \"option_id\": \"default_1\", \"value_name\": \"Lớn\", \"option_name\": \"Kích cỡ\", \"additional_price\": 20000}, {\"value_id\": \"default_2_3\", \"option_id\": \"default_2\", \"value_name\": \"Thêm trứng\", \"option_name\": \"Thêm topping\", \"additional_price\": 5000}]', 'Kích cỡ: Lớn (+20.000 ₫), Thêm topping: Thêm trứng (+5.000 ₫)'),
(17, 1, 2, 1, '2025-05-17 21:43:51', '[{\"value_id\": \"40\", \"option_id\": \"8\", \"value_name\": \"Thêm pate\", \"option_name\": \"Loại bánh\", \"additional_price\": 7000}]', 'Loại bánh: Thêm pate (+7.000 ₫)'),
(20, 1, 6, 1, '2025-05-22 11:11:42', '[{\"value_id\": \"35\", \"option_id\": \"6\", \"value_name\": \"Vừa\", \"option_name\": \"Độ cay\", \"additional_price\": 5000}]', 'Độ cay: Vừa (+5.000 ₫)'),
(21, 1, 2, 1, '2025-05-22 11:12:05', '[]', '');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `category_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `parent_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`category_id`, `name`, `slug`, `parent_id`, `created_at`, `updated_at`) VALUES
(1, 'Bánh mì truyền thống', 'banh-mi-truyen-thong', NULL, '2025-04-28 13:28:30', '2025-05-12 23:31:27'),
(2, 'Bánh mì đặc biệt', 'banh-mi-dac-biet', NULL, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(3, 'Bánh mì chay', 'banh-mi-chay', NULL, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(4, 'Combo bữa sáng', 'combo-bua-sang', NULL, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(5, 'Đồ uống', 'do-uong', NULL, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(6, 'Khuyến mãi', 'khuyen-mai', NULL, '2025-04-28 13:28:30', '2025-04-28 13:28:30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_messages`
--

CREATE TABLE `chat_messages` (
  `message_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_from_user` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chat_messages`
--

INSERT INTO `chat_messages` (`message_id`, `user_id`, `session_id`, `message`, `is_from_user`, `created_at`) VALUES
(1, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'hi', 1, '2025-05-24 14:24:14'),
(2, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. \n\nVui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.\n\nThông tin về Nguyên Sinh:\n- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\n- Website: nguyensinh.com', 0, '2025-05-24 14:24:14'),
(3, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'hi', 1, '2025-05-24 14:36:49'),
(4, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. \n\nVui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.\n\nThông tin về Nguyên Sinh:\n- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\n- Website: nguyensinh.com', 0, '2025-05-24 14:36:49'),
(5, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'hi', 1, '2025-05-24 14:39:41'),
(6, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. \n\nVui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.\n\nThông tin về Nguyên Sinh:\n- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\n- Website: nguyensinh.com', 0, '2025-05-24 14:39:41'),
(7, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', '? looix gif v', 1, '2025-05-24 14:40:00'),
(8, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. \n\nVui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.\n\nThông tin về Nguyên Sinh:\n- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\n- Website: nguyensinh.com', 0, '2025-05-24 14:40:00'),
(9, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'hi', 1, '2025-05-24 14:41:17'),
(10, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. \n\nVui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.\n\nThông tin về Nguyên Sinh:\n- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\n- Website: nguyensinh.com', 0, '2025-05-24 14:41:17'),
(11, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'hi', 1, '2025-05-24 14:42:58'),
(12, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. \n\nVui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.\n\nThông tin về Nguyên Sinh:\n- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\n- Website: nguyensinh.com', 0, '2025-05-24 14:42:58'),
(13, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'hi', 1, '2025-05-24 14:44:10'),
(14, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. \n\nVui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.\n\nThông tin về Nguyên Sinh:\n- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\n- Website: nguyensinh.com', 0, '2025-05-24 14:44:10'),
(15, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'hi', 1, '2025-05-25 13:41:21'),
(16, NULL, 'e69ce297-718a-4173-8ba0-b5e5cd186944', 'Xin lỗi, hệ thống AI đang tạm thời gặp sự cố. \n\nVui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942 để được hỗ trợ trực tiếp.\n\nThông tin về Nguyên Sinh:\n- Địa chỉ: 141 Trần Đình Xu, Quận 1, TP.HCM\n- Giờ mở cửa: 7:00 - 21:00 hàng ngày\n- Website: nguyensinh.com', 0, '2025-05-25 13:41:21');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_notifications`
--

CREATE TABLE `chat_notifications` (
  `notification_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('promotion','system','event') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `trigger_event` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chat_notifications`
--

INSERT INTO `chat_notifications` (`notification_id`, `title`, `message`, `type`, `trigger_event`, `is_active`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, 'Chào mừng thành viên mới', '👋 Chào mừng bạn đến với Nguyên Sinh! Nhân dịp này, bạn có thể sử dụng mã **WELCOME10** để được giảm 10% cho đơn hàng đầu tiên. Chúc bạn ngon miệng!', 'promotion', 'signup', 1, NULL, NULL, '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(2, 'Khuyến mãi đặt hàng', '🛒 Cảm ơn bạn đã thêm sản phẩm vào giỏ hàng! Sử dụng mã **FREESHIP** để được miễn phí giao hàng cho đơn từ 200.000đ. Mã có hiệu lực đến hết tháng này!', 'promotion', 'addToCart', 1, NULL, NULL, '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(3, 'Ưu đãi đặt bàn', '🍽️ Cảm ơn bạn đã đặt bàn tại Nguyên Sinh! Xuất trình mã **TABLE10** khi đến cửa hàng để được giảm 10% tổng hóa đơn cho nhóm của bạn.', 'promotion', 'reservation', 1, NULL, NULL, '2025-05-24 12:46:26', '2025-05-24 12:46:26'),
(4, 'Sinh nhật', '🎂 Chúc mừng sinh nhật! Nguyên Sinh tặng bạn mã **BIRTHDAY25** để được giảm 25% cho đơn hàng trong ngày sinh nhật của bạn. Chúc bạn một ngày thật vui!', 'event', 'birthday', 1, NULL, NULL, '2025-05-24 12:46:26', '2025-05-24 12:46:26');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `chat_sessions`
--

CREATE TABLE `chat_sessions` (
  `session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `chat_sessions`
--

INSERT INTO `chat_sessions` (`session_id`, `ip_address`, `user_agent`, `created_at`, `last_activity`) VALUES
('17089d84-b561-4ff4-a839-fed97225e51a', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36', '2025-05-24 14:01:21', '2025-05-24 14:01:21'),
('e69ce297-718a-4173-8ba0-b5e5cd186944', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0', '2025-05-24 13:45:24', '2025-05-25 13:41:21');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `coupons`
--

CREATE TABLE `coupons` (
  `coupon_id` int NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `discount_type` enum('percent','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(10,2) DEFAULT '0.00',
  `usage_limit` int DEFAULT NULL,
  `used_count` int NOT NULL DEFAULT '0',
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `coupons`
--

INSERT INTO `coupons` (`coupon_id`, `code`, `description`, `discount_type`, `discount_value`, `min_order_amount`, `usage_limit`, `used_count`, `valid_from`, `valid_to`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'KHUYENMAI10', 'Giảm 10% cho đơn hàng', 'percent', 10.00, 100000.00, 100, 0, '2025-01-01', '2025-12-31', 1, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(2, 'FREESHIP', 'Miễn phí vận chuyển cho đơn từ 200k', 'fixed', 20000.00, 200000.00, 50, 0, '2025-01-01', '2025-06-30', 1, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(3, 'SUMMER50', 'Giảm 50k mùa hè', 'fixed', 50000.00, 300000.00, 30, 0, '2025-06-01', '2025-08-31', 1, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(4, 'WELCOME15', 'Giảm 15% cho khách hàng mới', 'percent', 15.00, 0.00, 1000, 0, '2025-01-01', '2025-12-31', 1, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(5, 'BLACKFRIDAY', 'Siêu khuyến mãi Black Friday', 'percent', 20.00, 500000.00, 20, 0, '2025-11-01', '2025-11-30', 1, '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(6, 'YEAR2025', 'Mừng năm mới 2025', 'fixed', 25000.00, 0.00, 200, 0, '2025-01-01', '2025-02-28', 1, '2025-04-28 13:28:30', '2025-04-28 13:28:30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `loyalty_points`
--

CREATE TABLE `loyalty_points` (
  `points_id` int NOT NULL,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `changes` int NOT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `messages`
--

CREATE TABLE `messages` (
  `message_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `channel` enum('contact_form','messenger','zalo') NOT NULL,
  `subject` varchar(150) DEFAULT NULL,
  `content` text NOT NULL,
  `status` enum('new','replied','closed') NOT NULL DEFAULT 'new',
  `received_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `options`
--

CREATE TABLE `options` (
  `option_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `options`
--

INSERT INTO `options` (`option_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Kích cỡ', 'Kích cỡ bánh mì', '2025-05-16 14:29:15', '2025-05-16 14:29:15'),
(2, 'Độ cay', 'Mức độ cay của bánh mì', '2025-05-16 14:29:15', '2025-05-16 14:29:15'),
(3, 'Thêm phô mai', 'Thêm phô mai vào bánh mì', '2025-05-16 14:29:15', '2025-05-16 14:29:15'),
(4, 'Loại bánh', 'Loại bánh mì', '2025-05-16 14:29:15', '2025-05-16 14:29:15'),
(5, 'Kích cỡ', 'Kích cỡ bánh mì', '2025-05-17 14:36:01', '2025-05-17 14:36:01'),
(6, 'Độ cay', 'Mức độ cay của bánh mì', '2025-05-17 14:36:01', '2025-05-17 14:36:01'),
(7, 'Thêm phô mai', 'Thêm phô mai vào bánh mì', '2025-05-17 14:36:01', '2025-05-17 14:36:01'),
(8, 'Loại bánh', 'Loại bánh mì', '2025-05-17 14:36:01', '2025-05-17 14:36:01');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `option_values`
--

CREATE TABLE `option_values` (
  `value_id` int NOT NULL,
  `option_id` int NOT NULL,
  `value` varchar(100) NOT NULL,
  `additional_price` decimal(10,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `option_values`
--

INSERT INTO `option_values` (`value_id`, `option_id`, `value`, `additional_price`) VALUES
(19, 1, 'Nhỏ', 0.00),
(20, 1, 'Vừa', 5000.00),
(21, 1, 'Lớn', 10000.00),
(22, 2, 'Nhỏ', 0.00),
(23, 2, 'Vừa', 7000.00),
(24, 2, 'Lớn', 15000.00),
(25, 3, 'Nhỏ', 0.00),
(26, 3, 'Vừa', 5000.00),
(27, 3, 'Lớn', 10000.00),
(28, 4, 'Ít đá', 0.00),
(29, 4, 'Bình thường', 0.00),
(30, 4, 'Nhiều đá', 0.00),
(31, 5, 'Ít sữa', 0.00),
(32, 5, 'Bình thường', 0.00),
(33, 5, 'Nhiều sữa', 2000.00),
(34, 6, 'Nhỏ', 0.00),
(35, 6, 'Vừa', 5000.00),
(36, 6, 'Lớn', 10000.00),
(37, 7, 'Thêm pate', 5000.00),
(38, 7, 'Thêm thịt nguội', 8000.00),
(39, 7, 'Thêm trứng', 6000.00),
(40, 8, 'Thêm pate', 7000.00),
(41, 8, 'Thêm thịt nguội', 10000.00),
(42, 8, 'Thêm trứng', 6000.00),
(43, 8, 'Thêm dưa leo', 3000.00),
(44, 9, 'Thêm shot espresso', 10000.00),
(45, 9, 'Thêm kem', 8000.00),
(46, 9, 'Thêm socola', 5000.00),
(47, 1, 'Nhỏ', 0.00),
(48, 1, 'Vừa', 10000.00),
(49, 1, 'Lớn', 20000.00),
(50, 2, 'Không cay', 0.00),
(51, 2, 'Hơi cay', 0.00),
(52, 2, 'Cay vừa', 0.00),
(53, 2, 'Cay nhiều', 5000.00),
(54, 3, 'Không thêm', 0.00),
(55, 3, 'Thêm phô mai', 10000.00),
(56, 3, 'Thêm phô mai gấp đôi', 18000.00),
(57, 4, 'Bánh mì thường', 0.00),
(58, 4, 'Bánh mì nguyên cám', 5000.00),
(59, 4, 'Bánh mì đen', 8000.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `order_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `address_id` int DEFAULT NULL,
  `status` enum('pending','confirmed','preparing','delivering','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` enum('cod','online','banking') NOT NULL DEFAULT 'cod',
  `total_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `shipping_fee` decimal(10,2) DEFAULT '0.00',
  `coupon_id` int DEFAULT NULL,
  `guest_info` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `address_id`, `status`, `payment_method`, `total_amount`, `discount_amount`, `shipping_fee`, `coupon_id`, `guest_info`, `created_at`, `updated_at`) VALUES
(1, 7, 1, 'pending', 'cod', 90000.00, 0.00, 30000.00, NULL, NULL, '2025-05-16 16:45:42', '2025-05-16 16:45:42'),
(2, 7, 2, 'pending', 'cod', 90000.00, 0.00, 30000.00, NULL, NULL, '2025-05-16 20:26:42', '2025-05-16 20:26:42'),
(3, 7, 3, 'cancelled', 'cod', 90000.00, 0.00, 30000.00, NULL, NULL, '2025-05-16 20:43:28', '2025-05-30 13:16:40'),
(4, 7, 5, 'cancelled', 'cod', 60000.00, 0.00, 30000.00, NULL, NULL, '2025-05-16 21:17:02', '2025-05-16 21:24:29'),
(5, NULL, NULL, 'cancelled', 'cod', 60000.01, 0.00, 30000.00, NULL, '{\"city\": \"HN\", \"email\": \"vunamlong3522@gmail.com\", \"phone\": \"0943469858\", \"address\": \"1123, Tân Mai, hoàng mai, Hà Nội\", \"full_name\": \"long vũ\"}', '2025-05-24 14:47:24', '2025-05-24 18:50:20'),
(6, NULL, NULL, 'cancelled', 'cod', 60000.01, 0.00, 30000.00, NULL, '{\"city\": \"HN\", \"email\": \"vunamlong3522@gmail.com\", \"phone\": \"0943469858\", \"address\": \"1123, Tân Mai, hoàng mai, Hà Nội\", \"full_name\": \"long vũ\"}', '2025-05-24 18:30:43', '2025-05-30 09:46:34'),
(7, NULL, NULL, 'delivering', 'cod', 9114000.00, 7000.00, 9088000.00, NULL, '{\"city\": \"HN\", \"email\": \"vunamlong3522@gmail.com\", \"phone\": \"0943469858\", \"address\": \"1123, Tân Mai, hoàng mai, Hà Nội\", \"full_name\": \"long vũ\"}', '2025-05-28 15:27:03', '2025-05-30 13:55:38');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`) VALUES
(1, 1, 6, 2, 30000.00, 60000.00),
(2, 2, 6, 2, 30000.00, 60000.00),
(3, 3, 6, 2, 30000.00, 60000.00),
(4, 4, 6, 1, 30000.00, 30000.00),
(5, 5, 6, 1, 30000.01, 30000.01),
(6, 5, 6, 1, 0.00, 0.00),
(7, 6, 6, 1, 30000.01, 30000.01),
(8, 7, 2, 1, 40000.00, 40000.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_status_history`
--

CREATE TABLE `order_status_history` (
  `history_id` int NOT NULL,
  `order_id` int NOT NULL,
  `old_status` enum('pending','confirmed','preparing','delivering','completed','cancelled') NOT NULL,
  `new_status` enum('pending','confirmed','preparing','delivering','completed','cancelled') NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` int DEFAULT NULL,
  `note` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `order_status_history`
--

INSERT INTO `order_status_history` (`history_id`, `order_id`, `old_status`, `new_status`, `changed_at`, `changed_by`, `note`) VALUES
(1, 1, 'pending', 'pending', '2025-05-16 16:45:42', 7, NULL),
(2, 2, 'pending', 'pending', '2025-05-16 20:26:42', 7, NULL),
(3, 3, 'pending', 'pending', '2025-05-16 20:43:28', 7, NULL),
(4, 4, 'pending', 'pending', '2025-05-16 21:17:02', 7, NULL),
(5, 4, 'pending', 'cancelled', '2025-05-16 21:24:29', 7, NULL),
(6, 3, 'pending', 'cancelled', '2025-05-16 21:24:35', 7, NULL),
(7, 4, 'cancelled', 'cancelled', '2025-05-18 23:34:50', 4, NULL),
(8, 2, 'pending', 'pending', '2025-05-19 15:30:04', 4, NULL),
(9, 3, 'cancelled', 'preparing', '2025-05-21 16:00:20', 4, NULL),
(10, 5, 'pending', 'pending', '2025-05-24 14:47:24', NULL, NULL),
(11, 5, 'pending', 'confirmed', '2025-05-24 14:50:00', 4, NULL),
(12, 5, 'confirmed', 'confirmed', '2025-05-24 18:25:33', 4, NULL),
(13, 6, 'pending', 'pending', '2025-05-24 18:30:43', NULL, NULL),
(14, 6, 'pending', 'preparing', '2025-05-24 18:45:00', 4, NULL),
(15, 5, 'confirmed', 'cancelled', '2025-05-24 18:50:20', 4, NULL),
(16, 7, 'pending', 'pending', '2025-05-28 15:27:03', NULL, NULL),
(17, 7, 'pending', 'delivering', '2025-05-30 13:55:38', 8, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `password_resets`
--

CREATE TABLE `password_resets` (
  `reset_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reset_token` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `payment_id` int NOT NULL,
  `order_id` int NOT NULL,
  `provider` varchar(50) NOT NULL,
  `provider_transaction_id` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `post_comments`
--

CREATE TABLE `post_comments` (
  `comment_id` int NOT NULL,
  `post_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `guest_name` varchar(100) DEFAULT NULL,
  `content` text NOT NULL,
  `parent_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `product_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `category_id` int NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('normal','featured') DEFAULT 'normal',
  `featured` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`product_id`, `name`, `slug`, `description`, `price`, `cost_price`, `category_id`, `stock_quantity`, `is_active`, `created_at`, `updated_at`, `status`, `featured`) VALUES
(1, 'Bánh mì thịt nguội', 'banh-mi-thit-nguoi', 'Bánh mì thịt nguội thơm ngon, mang hương vị truyền thống đặc trưng. Vỏ bánh giòn rụm, kết hợp cùng lớp thịt nguội đậm đà, pate béo ngậy và rau thơm tươi mát, tạo nên món ăn hấp dẫn, thích hợp cho bữa sáng hoặc bữa xế tiện lợi, giàu năng lượng.', 25000.00, 15000.00, 1, 100, 1, '2025-04-28 13:28:30', '2025-05-25 19:46:48', 'featured', 1),
(2, 'Bánh mì đặc biệt Nguyên Sinh', 'banh-mi-dac-biet-nguyen-sinh', 'Bánh mì đặc biệt với pate gia truyền béo ngậy, thơm lừng, kết hợp lớp thịt nguội đậm đà, dưa leo giòn mát và nước sốt đậm vị. Vỏ bánh vàng giòn hấp dẫn, mang đến trải nghiệm ẩm thực truyền thống khó quên cho mọi thực khách.\n', 40000.00, 25000.00, 2, 49, 1, '2025-04-28 13:28:30', '2025-05-28 15:27:03', 'featured', 1),
(3, 'Bánh mì chay pate', 'banh-mi-chay-pate', 'Bánh mì chay với pate chay tự nhiên thanh đạm, thơm béo, hòa quyện cùng rau củ tươi giòn và nước sốt đặc biệt. Vỏ bánh giòn rụm, mang đến hương vị nhẹ nhàng, tốt cho sức khỏe, phù hợp cho người ăn chay hoặc yêu thích món ăn thuần thực vật.\n', 30000.00, 18000.00, 3, 60, 1, '2025-04-28 13:28:30', '2025-05-13 11:24:47', 'normal', 0),
(4, 'Combo bữa sáng 1', 'combo-bua-sang-1', 'Combo hấp dẫn gồm bánh mì thịt nguội thơm ngon, vỏ giòn nhân đậm đà, kết hợp cùng ly cà phê đá đậm vị, mát lạnh. Sự hòa quyện hoàn hảo giữa vị béo, mặn mà và vị cà phê nồng nàn, giúp bạn khởi đầu ngày mới tràn đầy năng lượng.\n', 55000.00, 35000.00, 4, 30, 1, '2025-04-28 13:28:30', '2025-05-25 19:55:27', 'featured', 0),
(5, 'Cà phê sữa đá', 'ca-phe-sua-da', 'Cà phê sữa đá đậm đà, chuẩn vị Việt với hương thơm quyến rũ, vị cà phê mạnh mẽ hòa quyện cùng sữa đặc béo ngậy. Từng ngụm mát lạnh lan tỏa vị ngọt dịu và đắng nhẹ, mang đến trải nghiệm sảng khoái, đậm đà khó quên cho người yêu cà phê.\n', 20000.00, 10000.00, 5, 200, 1, '2025-04-28 13:28:30', '2025-05-25 19:56:30', 'featured', 0),
(6, 'Bánh mì xúc xích', 'banh-mi-xuc-xich', 'Bánh mì xúc xích phô mai hấp dẫn với lớp bánh giòn rụm, nhân xúc xích thơm ngon hòa quyện cùng phô mai béo ngậy tan chảy. Hương vị đậm đà, ngậy béo, thích hợp cho bữa ăn nhanh tiện lợi, giàu năng lượng và kích thích vị giác.\n', 30000.00, 17000.00, 1, 73, 1, '2025-04-28 13:28:30', '2025-05-25 19:55:10', 'featured', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_images`
--

CREATE TABLE `product_images` (
  `image_id` int NOT NULL,
  `product_id` int NOT NULL,
  `img_url` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `alt_text` varchar(150) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `product_images`
--

INSERT INTO `product_images` (`image_id`, `product_id`, `img_url`, `alt_text`, `sort_order`) VALUES
(2, 2, 'https://i.pinimg.com/originals/1d/ca/e2/1dcae24d4745985753e71e2595f1d4a2.jpg', 'Bánh mì đặc biệt Nguyên Sinh', 1),
(3, 3, 'http://foodisafourletterword.com/wp-content/uploads/2020/11/Vietnamese_Chicken_Banh_Mi_Recipe_Banh_Mi_Ga_Roti_new2.jpg', 'Bánh mì chay pate', 1),
(4, 4, 'https://tse4.mm.bing.net/th?id=OIP.uKIch3Ve_b_E1Zi6pVhx5QHaGP&pid=Api&P=0&h=180', 'Combo bữa sáng 1', 1),
(5, 5, 'https://tse3.mm.bing.net/th?id=OIP.W1MzvSxrB77NDqWi3z4KMQHaFn&pid=Api&P=0&h=180', 'Cà phê sữa đá', 1),
(6, 6, 'https://tse4.mm.bing.net/th?id=OIP.Dp_OyC899S63pJH3YWqpuAHaEK&pid=Api&P=0&h=180', 'Bánh mì xúc xích', 1),
(7, 1, 'https://toplist.vn/images/800px/9-banh-mi-nguyen-sinh-ly-quoc-su-917728.jpg', 'Bánh mì thịt nguội', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_options`
--

CREATE TABLE `product_options` (
  `option_id` int NOT NULL,
  `product_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `product_option_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `product_options`
--

INSERT INTO `product_options` (`option_id`, `product_id`, `name`, `product_option_id`) VALUES
(1, 1, 'Kích cỡ bánh mì', 1),
(2, 6, 'Kích cỡ bánh mì', 2),
(3, 3, 'Kích cỡ bánh mì', 0),
(4, 5, 'Lượng đá', 0),
(5, 5, 'Lượng sữa', 0),
(6, 6, 'Kích cỡ bánh mì', 0),
(7, 1, 'Thêm topping', 0),
(8, 2, 'Thêm topping', 0),
(9, 5, 'Thêm topping', 0),
(10, 1, 'Thêm topping', 0),
(11, 2, 'Thêm topping', 0),
(12, 5, 'Thêm topping', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reservations`
--

CREATE TABLE `reservations` (
  `reservation_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `store_id` int NOT NULL,
  `table_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `guests` int NOT NULL,
  `occasion` varchar(50) DEFAULT NULL,
  `notes` text,
  `status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
  `deposit_method` enum('momo','bank_transfer','credit_card','none') NOT NULL DEFAULT 'none',
  `deposit_amount` decimal(10,2) DEFAULT '0.00',
  `deposit_status` enum('pending','paid','refunded','cancelled') DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `reservations`
--

INSERT INTO `reservations` (`reservation_id`, `user_id`, `store_id`, `table_id`, `full_name`, `email`, `phone`, `reservation_date`, `reservation_time`, `guests`, `occasion`, `notes`, `status`, `deposit_method`, `deposit_amount`, `deposit_status`, `created_at`, `updated_at`) VALUES
(2, 2, 2, 13, 'Trần Thị B', 'thib@example.com', '0923456789', '2025-05-16', '19:00:00', 4, 'Kỷ niệm', 'Cần bàn yên tĩnh', 'confirmed', 'bank_transfer', 100000.00, 'paid', '2025-05-11 11:45:00', '2025-05-17 21:46:07'),
(3, 3, 3, 24, 'Lê Quang C', 'quangc@example.com', '0934567890', '2025-05-17', '12:30:00', 2, 'Gặp đối tác', 'Cần bàn gần cửa sổ', 'pending', 'credit_card', 100000.00, 'pending', '2025-05-12 09:15:00', '2025-05-17 21:46:07'),
(4, NULL, 1, 5, 'Phạm Thị D', 'thid@example.com', '0945678901', '2025-05-18', '18:00:00', 6, 'Họp gia đình', 'Có trẻ em', 'pending', 'momo', 100000.00, 'pending', '2025-05-12 14:20:00', '2025-05-17 21:46:07'),
(5, NULL, 2, 18, 'Võ Trần F', 'tranf@example.com', '0956789012', '2025-05-20', '20:00:00', 8, 'Tiệc công ty', 'Cần không gian riêng tư', 'confirmed', 'bank_transfer', 100000.00, 'paid', '2025-05-13 10:10:00', '2025-05-17 21:46:07'),
(6, NULL, 1, 6, 'long vũ', 'vunamlong3522@gmail.com', '0943469858', '2025-05-22', '16:17:00', 8, 'business', 'no', 'pending', 'none', 0.00, NULL, '2025-05-22 13:17:36', '2025-05-22 13:17:36'),
(7, NULL, 2, 19, 'long vũ', 'vunamlong3522@gmail.com', '0943469858', '2025-05-23', '03:55:00', 5, 'business', NULL, 'pending', 'momo', 100000.00, 'pending', '2025-05-22 13:55:20', '2025-05-22 13:55:20'),
(8, NULL, 2, 17, 'Cao Sinh Tiến', 'vipproluxury@hotmail.com', '0962774455', '2025-05-24', '20:04:00', 15, 'family', 'cac', 'pending', 'momo', 100000.00, 'pending', '2025-05-22 14:04:50', '2025-05-22 14:04:50'),
(9, NULL, 3, 21, 'Vũ Ngô Long', 'vunamlong3522@gmail.com', '0336675826', '2025-05-24', '00:48:00', 10, 'business', 'cặc ', 'pending', 'momo', 100000.00, 'pending', '2025-05-24 21:48:42', '2025-05-24 21:48:42');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reservation_payments`
--

CREATE TABLE `reservation_payments` (
  `payment_id` int NOT NULL,
  `reservation_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('momo','bank_transfer','credit_card','cash') NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `payment_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `reservation_payments`
--

INSERT INTO `reservation_payments` (`payment_id`, `reservation_id`, `amount`, `payment_method`, `transaction_id`, `status`, `payment_date`, `created_at`, `updated_at`) VALUES
(2, 2, 100000.00, 'bank_transfer', 'BT987654321', 'completed', '2025-05-11 12:00:00', '2025-05-11 11:45:00', '2025-05-17 21:46:08'),
(3, 5, 100000.00, 'bank_transfer', 'BT123987456', 'completed', '2025-05-13 10:20:00', '2025-05-13 10:10:00', '2025-05-17 21:46:08'),
(4, 7, 100000.00, 'momo', NULL, 'pending', NULL, '2025-05-22 13:55:20', '2025-05-22 13:55:20'),
(5, 8, 100000.00, 'momo', NULL, 'pending', NULL, '2025-05-22 14:04:50', '2025-05-22 14:04:50'),
(6, 9, 100000.00, 'momo', NULL, 'pending', NULL, '2025-05-24 21:48:42', '2025-05-24 21:48:42');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reservation_status_history`
--

CREATE TABLE `reservation_status_history` (
  `history_id` int NOT NULL,
  `reservation_id` int NOT NULL,
  `old_status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL,
  `new_status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` int DEFAULT NULL,
  `notes` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `reservation_status_history`
--

INSERT INTO `reservation_status_history` (`history_id`, `reservation_id`, `old_status`, `new_status`, `changed_at`, `changed_by`, `notes`) VALUES
(2, 2, 'pending', 'confirmed', '2025-05-11 12:45:00', 4, 'Đã xác nhận qua email'),
(3, 5, 'pending', 'confirmed', '2025-05-13 11:10:00', 4, 'Đã xác nhận qua điện thoại'),
(4, 6, 'pending', 'pending', '2025-05-22 13:17:36', NULL, 'Đơn đặt bàn mới'),
(5, 7, 'pending', 'pending', '2025-05-22 13:55:20', NULL, 'Đơn đặt bàn mới'),
(6, 8, 'pending', 'pending', '2025-05-22 14:04:50', NULL, 'Đơn đặt bàn mới'),
(7, 9, 'pending', 'pending', '2025-05-24 21:48:42', NULL, 'Đơn đặt bàn mới');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `product_id` int NOT NULL,
  `rating` tinyint UNSIGNED NOT NULL,
  `comment` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `reviews`
--

INSERT INTO `reviews` (`review_id`, `user_id`, `product_id`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, 5, 'Sản phẩm rất tốt, tôi rất hài lòng.', '2025-05-01 10:30:00'),
(2, 2, 1, 4, 'Chất lượng ổn, sẽ quay lại mua lần sau.', '2025-05-02 14:20:00'),
(3, 3, 2, 3, 'Sản phẩm ở mức trung bình, giao hàng nhanh.', '2025-05-03 09:15:00'),
(4, 2, 2, 2, 'Không hài lòng lắm, sản phẩm không như mong đợi.', '2025-05-04 11:45:00'),
(5, 4, 3, 5, 'Tuyệt vời, đóng gói cẩn thận, giao hàng nhanh.', '2025-05-05 16:50:00'),
(6, 1, 4, 4, 'Hài lòng với dịch vụ và sản phẩm.', '2025-05-06 13:05:00'),
(7, 7, 1, 1, 'Như cặc', '2025-05-16 21:10:14');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `user_id` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `sessions`
--

INSERT INTO `sessions` (`session_id`, `user_id`, `token`, `created_at`, `expires_at`) VALUES
('003af7ed2e690e6b75145c3a8fe1d2cede5df94f8837d218a8f2925dc9c82d58', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3OTY0ODAyLCJleHAiOjE3NTA1NTY4MDJ9.x8qUB4rUm2Wgv0GmAhmwkWYxUo7W_G95JJAEYRwC3uM', '2025-05-23 08:46:42', '2025-06-22 08:46:42'),
('0190cbf84bb4e3b182768191c4ddfe45bf81aaf472330814e4213a6e701e57b4', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczMTY2LCJleHAiOjE3NTExNjUxNjZ9.Ve1awnQbaPjiWJQDGL3dcbA4E-FBnElaznC5g2va9fI', '2025-05-30 09:46:06', '2025-06-29 09:46:07'),
('027fa505bb18bd909f49dde58d17076f49d757788af2f6b62f1a410cb79fc375', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTg0ODMxLCJleHAiOjE3NTExNzY4MzF9.5p2TK96W558zQ9ZJOYnqDA5Yd8TIJlI6I6Ps5XT5IKo', '2025-05-30 13:00:31', '2025-06-29 13:00:31'),
('05a3a7f58530584ac8b380dab2b2f28b21be16a590bcc41e2c89ec64b3faf12e', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIwODA5LCJleHAiOjE3NTAyMTI4MDl9.OVRlrG3zThxHiNjYBJDc4x6T7_lsAauweALSvA-PoYs', '2025-05-19 09:13:29', '2025-06-18 09:13:29'),
('06a3272fe6704ffc1ac5949dda396b4e16eed5a076dfae56e7c693e706f24546', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4Mzk3NTM3LCJleHAiOjE3NTA5ODk1Mzd9.o1wO9rM5kCDX7-Ny6wBI6NTTtAS1SU485jqzKS-aEYQ', '2025-05-28 08:58:57', '2025-06-27 08:58:58'),
('072a11d36f9d90a2b79551e1ab8c10afb8aed4ea8c4900fa1abf182291cfa779', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyMjg0LCJleHAiOjE3NTAyMTQyODR9.VwFUiASFyRoEHTVs61lLDV4O2OIpPPB1_1ZhDEAyCw8', '2025-05-19 09:38:04', '2025-06-18 09:38:04'),
('07a8eb7136439be2ac56b92dff482667d21c7d32f15f9d97018fb87596aa8e65', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODQ4OTIyMSwiZXhwIjoxNzUxMDgxMjIxfQ.nHzo3C81ypeH62jMvTc0UcTtXuy_tkd7q9unRqSJorw', '2025-05-29 10:27:01', '2025-06-28 10:27:01'),
('0848a75b3bd6ba61c70b8d767fa1dc2b170f78a5796a8b050a98e25a73b39cd2', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczNzQyLCJleHAiOjE3NTExNjU3NDJ9.UZ482-whtJiPOiiP8_VWpA8LSF-ler9ZXtg0Pu9RThI', '2025-05-30 09:55:42', '2025-06-29 09:55:42'),
('0848ceaca8036c5465accab811bdede070ce6dcbb3c02aa88ff76ba9e3dc0579', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyNDkyLCJleHAiOjE3NTAyMTQ0OTJ9.xdhk3C63SkWLky-44utzg5jkvdiKkyue7f97HPXB0qA', '2025-05-19 09:41:32', '2025-06-18 09:41:33'),
('084b409a97d3c6c043654a0f0416d8e4e1350ebeb5e03169dac02f80e117b12e', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3OTY0ODM4LCJleHAiOjE3NTA1NTY4Mzh9.OgWdlumPjJHcedRQ6TkRT-bPrv7Oqg4CWqvPbzJMoxc', '2025-05-23 08:47:18', '2025-06-22 08:47:18'),
('0a8f44116cc65597a691bf988ab2431afb6e361b4b6a811f4ca3fae76feaa930', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4MzQyLCJleHAiOjE3NTAyNjAzNDJ9.XIrVJCnjctMw5Cqx4OvbE4aUlxQUHfSYKkWdpN0EglY', '2025-05-19 22:25:42', '2025-06-18 22:25:42'),
('0a94f09896ec9b39c8ab6258ebfc632a9f31fd295da3af5ac01c8dd1a5d89a1c', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3ODE4NTk5LCJleHAiOjE3NTA0MTA1OTl9.CiftsxtyX9gDjF7b2YeLAxLkWHUMjpgR0Av35On7tZ8', '2025-05-21 16:09:59', '2025-06-20 16:09:59'),
('0acde4e46e7e8fd8f2d01f79a5259a98c81674884a659e58967c7b9a1456fe4c', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4NDk1LCJleHAiOjE3NTAyNjA0OTV9.UzK1ykfWeaE5whp1iPSN7cm0Nfi5G1A82OlG3Z9QMK0', '2025-05-19 22:28:15', '2025-06-18 22:28:15'),
('0bea767cf483dc12c55a54d9dc11db50306f1aea3d21a918d081d9285b3b047d', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4Mzk3ODMwLCJleHAiOjE3NTA5ODk4MzB9.yz3u5KQ8_7O-oTMEYnG1p59GfizdGqWvbrc1LhvB4iw', '2025-05-28 09:03:50', '2025-06-27 09:03:50'),
('0c4f0e1a484b56028193bd4a685d64f42806d93575929ade89565f8d5dfad1b2', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDE3OTc3LCJleHAiOjE3NTEwMDk5Nzd9.9fc6HKcoNZlVSvD2uOyYRULChCxU8bdOIiF5722s5xU', '2025-05-28 14:39:37', '2025-06-27 14:39:37'),
('12de56f8c2f8a4084124784632ad3a2cb96a2cb9ec7853990320c4dffca599f9', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTg1MDE5LCJleHAiOjE3NTExNzcwMTl9.T__IjGcQuHi0gRKMgsByPFtbqJ470xyHaM19eTCDe7E', '2025-05-30 13:03:39', '2025-06-29 13:03:39'),
('14162f51e6f1e0b8fb58ca308a78d72f5bacb3198f6142bc6015fd99bddf0913', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyMjA5LCJleHAiOjE3NTAyMTQyMDl9.CEYLbP9XI0fSS7zcZlAi7Ke0z-rRh1leizDB2p-te1c', '2025-05-19 09:36:49', '2025-06-18 09:36:50'),
('16986d5816c0a3a7466af9c32abb14b65ee5a172cc47b9fed7c929b53bded3bc', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxMTI1LCJleHAiOjE3NTAyMTMxMjV9._Vc9r4XaU-pikgLPLiIA3s6qnFpxaeonF1WN0lSE0fQ', '2025-05-19 09:18:45', '2025-06-18 09:18:46'),
('178c90383fc1824c78bb8f6d0ee4749d7ed05abdbea81191354fd6c78340a9ed', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTgzNzk2LCJleHAiOjE3NTAxNzU3OTZ9.AU49ztxuzYvxvD-jm6Fl8_LDTN8u1xok5B4RVszW1Vk', '2025-05-18 22:56:36', '2025-06-17 22:56:37'),
('199fc030c762b06fb1da3900ebe977c1efd8447ab18ceaaa9dc9bc1e0f7defc4', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxNDA1LCJleHAiOjE3NTAyMTM0MDV9.ojC0AXYuvkIJNvJqCiLUANS-I9DI4FRGyDYLqdPRrkQ', '2025-05-19 09:23:25', '2025-06-18 09:23:26'),
('19e1a7acef9734b0c99a42bf6ad42119713ccf9f2345653193e05540a6d3bc10', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4Mzk3OTM5LCJleHAiOjE3NTA5ODk5Mzl9.mYZ3RoRXps-ZN4PuaB0DyI1DZvKCvU4jGJfrjqd0mYg', '2025-05-28 09:05:39', '2025-06-27 09:05:39'),
('1b6a024725bfeffcf278de2cea319c145e98aec7d290d0e0dd04870239bb2390', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyMTc4LCJleHAiOjE3NTAyMTQxNzh9.U0KOks07keeEjvhAOsTisHh_1VZwPmd447cOr5Nxrz4', '2025-05-19 09:36:18', '2025-06-18 09:36:18'),
('21b646cea4119eeffc5c4ba57978b90fef593c37b07446b9acf9c176c300d66f', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4MDg5NjA1LCJleHAiOjE3NTA2ODE2MDV9.54ck8DXvUBP86UlOsJuFHBDbk-aU9HZMFhY6X6Yk6ZA', '2025-05-24 19:26:45', '2025-06-23 19:26:46'),
('26b35f1e0cdf185b5c27fc09c7c15fda588dd488d73578e50a22e2fbc4618bd7', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODQ4OTIzNywiZXhwIjoxNzUxMDgxMjM3fQ.Yd1A1JY2XqM6Ofgyf3hVyUjsFl-DQLVRJfGyzfnJqZs', '2025-05-29 10:27:17', '2025-06-28 10:27:18'),
('27cde12dcc736d8cd92deea151b29a602e8424c97ecff27b14fe4a694ff6ea82', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTg0Mjk0LCJleHAiOjE3NTAxNzYyOTR9.cMWncCMswqOEF9YXCmfBJStOtM8PHcgYtgTqmonsv-c', '2025-05-18 23:04:54', '2025-06-17 23:04:54'),
('28176adbe283f4e6e7334cd790b36ab1c4bbc7aa6a3df5167dfc7f2d3ab0d447', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxMTMyLCJleHAiOjE3NTAyMTMxMzJ9.jXHoFtxvsbJmxA62Zu4vEUpUtlPv2QwiirP-DaTuSpU', '2025-05-19 09:18:52', '2025-06-18 09:18:52'),
('2a1a7a6ea634be4ec029a5a12eec1a0dfdc9dbc1ef4b82b3deefe15f7914b7c3', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDA0MDcyLCJleHAiOjE3NTA5OTYwNzJ9.z5AChQikawk-tsQKcKFXNLgea4oYZPKZM-wDq0GhWOw', '2025-05-28 10:47:52', '2025-06-27 10:47:53'),
('2a98159dcdcae2f497c8f43bf120e909b88d6ac8ad38c8e0ae55fbfa6bee24da', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgzMzEwLCJleHAiOjE3NTExNzUzMTB9.bssBpQXCKfYAeY_Y6uiN6r3DFdUXaVi6MVFwLxe9WKQ', '2025-05-30 12:35:10', '2025-06-29 12:35:10'),
('2b2c6d8f3361af25d37113edea2e37b1744e7be219de62bbe5ce779d07fa284f', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTg0OTYwLCJleHAiOjE3NTExNzY5NjB9.NYqVQFGhjVRdkbq3MTqa6By9UusOh_NRoXN9ir4ekzc', '2025-05-30 13:02:40', '2025-06-29 13:02:41'),
('2b56892889ab3c6ff7e175dc30d8781b63a00fca544aaa447c2f1c37ca5dd96b', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDg2NDYzLCJleHAiOjE3NTEwNzg0NjN9.lJtRB92PhwWoL2o-rUOpAlJORRSFnTS1CFerTCwbpYE', '2025-05-29 09:41:03', '2025-06-28 09:41:03'),
('2ececcdc425c7feb2116193220a9eb31abd6a83a3b235bd874cdafccc54920ba', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTg0MjkxLCJleHAiOjE3NTAxNzYyOTF9.T5bxloiChdrYa2TUKVF-biZSZnPQE73EYVht8HnvN5A', '2025-05-18 23:04:51', '2025-06-17 23:04:51'),
('2f107b0488217797f40bf09b62ddddb48f08af722abc5052d509c3328369e881', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4NDUyLCJleHAiOjE3NTAyNjA0NTJ9.p15bSdYsnr95UC36ld2adpuEfscRgA64oqQo95gKd2E', '2025-05-19 22:27:32', '2025-06-18 22:27:32'),
('2fe61531248a4d42e514ab27f240d536c3c565c22540dca06b6ad863ab385d88', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTgzNzI1LCJleHAiOjE3NTAxNzU3MjV9.iM2B7GPP5Elo2_6gllVax2EYc_j6CyXI0ygu9J0ZZXY', '2025-05-18 22:55:25', '2025-06-17 22:55:25'),
('3134012d040a27e571dcfcb4a19db92672467c14f9c1902c7230ac07e70f80f0', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTgzNzM3LCJleHAiOjE3NTAxNzU3Mzd9.FJ9Scls_T0SeR9GEWGdlyPkSfwxbF7YKRoEosPO-z7U', '2025-05-18 22:55:37', '2025-06-17 22:55:38'),
('33e770f80a094290b764698fe9c80d44061688fff29faa882cc86c2e8a9f2fa2', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE5OTg5LCJleHAiOjE3NTAyMTE5ODl9.VwLWulPZBNyYPK2p_VWf0mW2_NSmfB5oacR2AhAUIL4', '2025-05-19 08:59:49', '2025-06-18 08:59:49'),
('365c3667999bc933ead19b16d42b0860eedc7391496807125d0796e62bd4f8d5', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxOTkyLCJleHAiOjE3NTAyMTM5OTJ9.z-cTjPoK-dSUvleCBbiVaU6hwv31o0w2bf3tifjSEBU', '2025-05-19 09:33:12', '2025-06-18 09:33:13'),
('386b81c366cb28cb9b899077e68806468eacb5db5ecd0e27f3c4a62451cbf28c', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDg2NDQ1LCJleHAiOjE3NTEwNzg0NDV9.RG3pFtNhr5CBWLkEBvk4OP9GUYKUy7-HK189BnqiyeY', '2025-05-29 09:40:45', '2025-06-28 09:40:45'),
('38aa4211f98ee70458684b5aaaa2d6f62c559e99770bd6ddc9a19d116264190b', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODM5NzU3NCwiZXhwIjoxNzUwOTg5NTc0fQ.JllyvrdK9IgroNatVGwfI4FLiWM7uhjz7SMw8cJ-pDg', '2025-05-28 08:59:34', '2025-06-27 08:59:34'),
('3bc22f0d6fc4f272c9d606fa5ea63f368f812610596174fbbf70c95aac67587b', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDAzMTMxLCJleHAiOjE3NTA5OTUxMzF9.m_xXRPj-A39fLHohS9jmdVMh85KliTFalv86R7lLiiY', '2025-05-28 10:32:11', '2025-06-27 10:32:11'),
('3be69fcfff9ab7f5154df3524a5b739ceb1d93378d0069ff41ff35ccd06181b7', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDE5ODAyLCJleHAiOjE3NTEwMTE4MDJ9.xO3nhBZ1HcaRK8n6pfwupMTjENYolMdqAkWTK3sDAAY', '2025-05-28 15:10:02', '2025-06-27 15:10:03'),
('3c4c901d007ad2cd0fe6fe0ba363d923589f7c3f4d31b5923fe4b9508351daf0', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyMjI1LCJleHAiOjE3NTAyMTQyMjV9.I2MrjTWZSPBjiXj7V1scpaD-KgvjZShS57tLpSpzwu8', '2025-05-19 09:37:05', '2025-06-18 09:37:06'),
('3ec82f4d2aec04b60cb02180ff5382c19ee62a291778b5467f752fc6f1261727', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4Mjg4LCJleHAiOjE3NTAyNjAyODh9.SYlBa_a0gBs0RTvXDKTvAe1TPWWfxl8TGQRxtIckOQ4', '2025-05-19 22:24:48', '2025-06-18 22:24:48'),
('40d0387a41c079a033ea94d910af3e84ece64d3c00730981f60f509ec3ffa3ae', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE1OTcxLCJleHAiOjE3NTAyMDc5NzF9.4Zxk6boZY8drlkV_i2p0T22m-IRSyRu_AYmdcXiUGNE', '2025-05-19 07:52:51', '2025-06-18 07:52:52'),
('421784ea74af9a12ca100ae5de1b4d7c040d0ccfc11e48d32c0f9f2a9824f968', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3OTY0Nzg1LCJleHAiOjE3NTA1NTY3ODV9.cHy3TqZ9ixVtB5tHPkovcWV1SD3BkmjMfZxoJ_TyQcQ', '2025-05-23 08:46:25', '2025-06-22 08:46:25'),
('42f197e65d643a934755c5bfa109d1c4dc1704069d092305e0f0da168745734b', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTg0MjkzLCJleHAiOjE3NTAxNzYyOTN9._PrD6apf_D4LPyRdgg_N1Vi8off8zrKxCNc0CQJppJM', '2025-05-18 23:04:53', '2025-06-17 23:04:53'),
('4871861cc7dcce7db5b7cc71d9ba42e6ef63b8b25f5a18553fa056d2d2a761ee', 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQ3OTY0OTY2LCJleHAiOjE3NTA1NTY5NjZ9.uuiN_Tlzt7zYfsHZvMvrvN9VYqj9xexn8nDRGWQFkyA', '2025-05-23 08:49:26', '2025-06-22 08:49:27'),
('4f35e332866653a05a785764d9d202614af08ec3737437f62efb47879fc8f316', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3ODE4NTE4LCJleHAiOjE3NTA0MTA1MTh9.5GK5HInE1UilzUtQrYFW8zrBkJHAiVMGnHQ5FYBAaHs', '2025-05-21 16:08:38', '2025-06-20 16:08:39'),
('4fe1d0df51bce7b32e6062d651c48f1f93876480fe1ae8cc6d0981bb2dc2880d', 11, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODM5ODE4OSwiZXhwIjoxNzUwOTkwMTg5fQ.aj21VToAVyKO7yyhef8XSPCMDFDCCyaD_KKAu5jAsUE', '2025-05-28 09:09:49', '2025-06-27 09:09:49'),
('526494ee351374d846b9a854559b36d9aff11ff105d11caa58963298d41ac4f6', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczNTQwLCJleHAiOjE3NTExNjU1NDB9.-lHGf5ynL140FJRIR68sCDfEHfLdtlfomr5TFdW3RXU', '2025-05-30 09:52:20', '2025-06-29 09:52:20'),
('54fff58f9da54b9bebee50282446ac29acfe5f0c5ba2ef48b08aaadd3ac9d13d', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczNzQyLCJleHAiOjE3NTExNjU3NDJ9.UZ482-whtJiPOiiP8_VWpA8LSF-ler9ZXtg0Pu9RThI', '2025-05-30 09:55:42', '2025-06-29 09:55:42'),
('56cdae1aab5235f66614cd620f425daf89f88326f22770ed4193e04a1b58a8b9', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQ3NjQzMjgxLCJleHAiOjE3NTAyMzUyODF9.vq7rqRpNR3vedSUZXw5TewqvgdnIOShirxHHmW6iBE4', '2025-05-19 15:28:01', '2025-06-18 15:28:02'),
('58234ea0ba8dbded8641f9ef309f30d1f839b1a09915edfbbbe97e3d3cdb81b2', 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3ODE4NzU1LCJleHAiOjE3NTA0MTA3NTV9.TYeFt9ucrXQnvlxZPuLeDq0-_HiJ_LNLOVgKanXfYmI', '2025-05-21 16:12:35', '2025-06-20 16:12:36'),
('582c45d8e857a03e57639f63b8d8ee68418626675d81e1f02ace8c5132d83b8c', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgyNTAzLCJleHAiOjE3NTExNzQ1MDN9.jd_vJlUcwNAkj31zjF9NWu_mc4CoP_IFG_XPwXsrRv8', '2025-05-30 12:21:43', '2025-06-29 12:21:43'),
('5881f5074155aa9047b0879f547d40e803c66d09f24c13ad61308e6b5b5c1742', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODM5NzYwOSwiZXhwIjoxNzUwOTg5NjA5fQ.YSbAJXtkYegwS6enz1fICC_VwWl-Y6XJcDaO3EL2_OM', '2025-05-28 09:00:09', '2025-06-27 09:00:09'),
('5976edca904af271956d6ccf36d1dd86656ce677ddf0aa5e11aeed291da64535', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4NDI1LCJleHAiOjE3NTAyNjA0MjV9.PciZVQXvShOJxoU3bHWZWSrQeRULgKLL2_XJO9npzhA', '2025-05-19 22:27:05', '2025-06-18 22:27:05'),
('5d0f5acb99f82c2677343f4cdb06402b75d7733dcd2f52d19109b7af20a0475b', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTgzNzE0LCJleHAiOjE3NTAxNzU3MTR9.TBbnoOY0zgO3zvoQrVR_1ZvG2tLDpYqvL8Bc4AtpUxk', '2025-05-18 22:55:14', '2025-06-17 22:55:14'),
('5de8bc45e875bb62730defdc356b901d53c82f6dbbd941af0a72b8bf30e712ea', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4Mzk3NjgzLCJleHAiOjE3NTA5ODk2ODN9.eswrhpKbdfBI2NV5DFQj1EbO0JQKgP4bzaMsfR6s3Pg', '2025-05-28 09:01:23', '2025-06-27 09:01:23'),
('5e01a9062e866fab84f6c2b98e42fd0bf4b0e3760c99fb823c20644faa741229', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NzI5NjkwLCJleHAiOjE3NTAzMjE2OTB9.-XDbvA-UCss-IJU0nr2ZlbPHzEkpzUZiUcTi_npLWjc', '2025-05-20 15:28:10', '2025-06-19 15:28:10'),
('5fec18233dbe05937fef279c72322136d13052e7dd87fc4925ecfac2447b3528', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4Mzk3ODI3LCJleHAiOjE3NTA5ODk4Mjd9._S__YZ-4IRpYDBad_7rTiT12_kDYsAggY02xx9uWMTc', '2025-05-28 09:03:47', '2025-06-27 09:03:48'),
('62d27049d30fbcef4573d8289c4b28ff7dfe868e43fa877f6f44e4af0e267bf9', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDE5ODAyLCJleHAiOjE3NTEwMTE4MDJ9.xO3nhBZ1HcaRK8n6pfwupMTjENYolMdqAkWTK3sDAAY', '2025-05-28 15:10:02', '2025-06-27 15:10:03'),
('6530317661a7ff9ac351bba375986ac718420c6f0f2a12ff6aee3d1490d3b7ba', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3OTY0ODMyLCJleHAiOjE3NTA1NTY4MzJ9.Z41ztrXaJNmBvtItMtOSTpeosWdQHqAmx_rVnyuRt7U', '2025-05-23 08:47:12', '2025-06-22 08:47:13'),
('6883d21743fb9f14467ee09edd58a2b47576fd332bd5c0e1d43381cc95d45792', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODA5Nzk3OSwiZXhwIjoxNzUwNjg5OTc5fQ.dHIVJxDvBKAzSWjtPGavTqlx8h_b3BTm9TxxggN2Uyo', '2025-05-24 21:46:19', '2025-06-23 21:46:20'),
('69e7c58c15098ae98f608c8e031badb7eca52685ddc1bd95e3b1b6540ce47557', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyNDkwLCJleHAiOjE3NTAyMTQ0OTB9.3fE0FMjdSehfyI883CI4NduEKtOyvA9oNbHu-vxbmA4', '2025-05-19 09:41:30', '2025-06-18 09:41:30'),
('6c508d5b2d31bef53f83c904ee9484189ee3e20efa97bf763cf967e91941a0ff', 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3ODE5MTIyLCJleHAiOjE3NTA0MTExMjJ9.kSD8IwfTo8LiXoUq0nRK92X7JKNTXktA8EGgie4euy8', '2025-05-21 16:18:42', '2025-06-20 16:18:43'),
('6dcae82582768476efd94932edcd4e54f20daebb7463c71323f14b689bed753b', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIwOTgzLCJleHAiOjE3NTAyMTI5ODN9.pid4O2yAhIztCq90cI8KPRhju_lETTrnS7vPdTk_go4', '2025-05-19 09:16:23', '2025-06-18 09:16:24'),
('6f73ccfc653bfe0b91985a4c1918606137520b1b06d04ea6e4905a155111b413', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDAxNTA1LCJleHAiOjE3NTA5OTM1MDV9.uxMfKC4CbKJDZ4dhDmuO80n9kwb3GE2y7t0hbNodiS8', '2025-05-28 10:05:05', '2025-06-27 10:05:06'),
('716461e0ab10a2f8597aceaaf22eb7311b519556de727924c9ab5d82f612727d', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgwMTIzLCJleHAiOjE3NTExNzIxMjN9.HOTiJEFnUV9C4uTf4OHBKLxGHbHBT4Lvhc9BS8FtjdY', '2025-05-30 11:42:03', '2025-06-29 11:42:03'),
('7464492a841a00f260aba54045c6b1ac87c69dd2e95712dab0acaaa6bfeed26e', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxNDA0LCJleHAiOjE3NTAyMTM0MDR9.XPDF85jaZs41dEYNz9nr9TXKg-x1b0nbRAcN2nWdQuw', '2025-05-19 09:23:24', '2025-06-18 09:23:25'),
('75991ae0a3dd468d2360064cef3b48937a0618e1a6cdce7842c96411d257eb01', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NzMxODU3LCJleHAiOjE3NTAzMjM4NTd9._ApGptcXQj14HT58uvja-hadulLdwOcyCHAEIPj2_rc', '2025-05-20 16:04:17', '2025-06-19 16:04:18'),
('79d73fd790b476eb99218867cf83fcb509ddabd640f5ef684e8856558c5ace5e', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODQ4NjUwOCwiZXhwIjoxNzUxMDc4NTA4fQ.nRU1sdTy8hxj7DWXf-ooAIA3JZEbbOKR6O_22nnNYVA', '2025-05-29 09:41:48', '2025-06-28 09:41:49'),
('7ae06ffb730d8a9aa4908e1e9cb6026c2e01b9b0d116ab7fda023b59a22791e1', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDA0MTg2LCJleHAiOjE3NTA5OTYxODZ9.3Bz1sXLIvQZNA33o2ktoioqKTCubQnKZMnjXappO2Ws', '2025-05-28 10:49:46', '2025-06-27 10:49:46'),
('7ebcc507799fcb883ab7ff2805fc468b896356031b0a1cdea64a8caee9c893cc', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE2MDU4LCJleHAiOjE3NTAyMDgwNTh9.L4ZFaZQb5mJT9KsqxTBEfvwVKklBc-ouFDSAb0geP_c', '2025-05-19 07:54:18', '2025-06-18 07:54:19'),
('7edc6a7e36b84dc06639b33d2716d73739695b305b1d26216031a631935ffcaf', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTgzNDM5LCJleHAiOjE3NTAxNzU0Mzl9.ibZxf2iznQaQf3DbJGetn5s6z1AyOz0nq9yaytuQtT8', '2025-05-18 22:50:39', '2025-06-17 22:50:40'),
('7f8ed27e8d75678fb5d503e57abf04b7d0467829b4ca1b4d3c79a23ba2cf7877', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTg0Mjg4LCJleHAiOjE3NTAxNzYyODh9.IiBI7GUJxn6e6DZCJOoHYSgNvA26UG-QZCJSxPOHuRU', '2025-05-18 23:04:48', '2025-06-17 23:04:49'),
('7ff206928370b1e3a0ca1798c2378aaf5b44b31ab60fc46ce325ebbd11546a72', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxNDAzLCJleHAiOjE3NTAyMTM0MDN9.huu9FKrrNq9rapwghlFoQnPLRaG6eO0EVl9BmzOERuU', '2025-05-19 09:23:23', '2025-06-18 09:23:24'),
('8134a436a51e87f65039a0f21f689d49306e5d727b958298d02710e71f004623', 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQ3NjQzMzA1LCJleHAiOjE3NTAyMzUzMDV9.9bNvJPcThkZ-PN9iuouSOMRpM037j8ikDmdujUSKabw', '2025-05-19 15:28:25', '2025-06-18 15:28:26'),
('81fe5d0bbcfd4be26987b7aa262e8455846e7b979ed2fbe337e5d887174dfeaf', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3OTY0NzY3LCJleHAiOjE3NTA1NTY3Njd9.Sdme_gKRHRMql7AbvUhC_Fb_LKJNjj0IFvqwQr5vUm4', '2025-05-23 08:46:07', '2025-06-22 08:46:08'),
('8292bc55c64c9dbec6b2b9bd92050ff362e30491acbe8f12f6ecd9c236bfed16', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgzMzEwLCJleHAiOjE3NTExNzUzMTB9.bssBpQXCKfYAeY_Y6uiN6r3DFdUXaVi6MVFwLxe9WKQ', '2025-05-30 12:35:10', '2025-06-29 12:35:10'),
('82e744af4c1d233029b11d730ddd72091c567916c1af072584303916c92319fe', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3ODE3NzkyLCJleHAiOjE3NTA0MDk3OTJ9.YRtIzvuJgiIWIakxgFj089tJT2ovgjxG8BfQAL7XHKg', '2025-05-21 15:56:32', '2025-06-20 15:56:32'),
('8323a1f0ea74eaa4e1627003f39268eadf3fa7f354a948e15ee4adb442354b35', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczNTQwLCJleHAiOjE3NTExNjU1NDB9.-lHGf5ynL140FJRIR68sCDfEHfLdtlfomr5TFdW3RXU', '2025-05-30 09:52:20', '2025-06-29 09:52:20'),
('8667ff240da9f812297c5d5222c5511a7af47dcbe62eea81296abf63083695ca', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODM5NzQ2NiwiZXhwIjoxNzUwOTg5NDY2fQ.fNluqmWI0CTb5-vcH8wZ3lnLzi1qzUhQa2P3RMQuxHc', '2025-05-28 08:57:46', '2025-06-27 08:57:47'),
('88aa8db85714aac9a4d49382df1fdf2f0b077e0514ff101335e421e10e8093a8', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQ3NjQzMjY5LCJleHAiOjE3NTAyMzUyNjl9.LBWDdZNvZEqrYujGDAn9QnGg9V8r1zhnb1GJ9iZd2eU', '2025-05-19 15:27:49', '2025-06-18 15:27:50'),
('88f36dfa867d4da989b236550984fd501451a75179e4b07129f405196c0c600c', 11, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODM5ODE4MCwiZXhwIjoxNzUwOTkwMTgwfQ.wYzSlX7BfeFpHtxKk63ns_TOGht3sY1mDUXW24afPS0', '2025-05-28 09:09:40', '2025-06-27 09:09:41'),
('8a7c6ade32003ae1a8295d311941e61be9790cedbe46355d82ed43ba8a6e0f52', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDA0MTg2LCJleHAiOjE3NTA5OTYxODZ9.3Bz1sXLIvQZNA33o2ktoioqKTCubQnKZMnjXappO2Ws', '2025-05-28 10:49:46', '2025-06-27 10:49:46'),
('8b9f1f66821bbf9dcb938b3e3a7440b18dcd3dfd955c971965b51780eb33ba5c', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4NzAwLCJleHAiOjE3NTAyNjA3MDB9.knFX_tt5M_UecO08DYbNr-j5bg-Z3SQRJntBKu6n-1I', '2025-05-19 22:31:40', '2025-06-18 22:31:41'),
('8bc14ffe9b3fb355b2f066ad777e6ec25957bf34485b951924a96788a8cabc88', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyMjc4LCJleHAiOjE3NTAyMTQyNzh9.7Vv-9RlgkJ0mZ0O80ZbVsvEt_eE06eiJBQ9cGHBe9WI', '2025-05-19 09:37:58', '2025-06-18 09:37:59'),
('91bb95f32bdb6b634eb670564c74e6d2c92a0740eeb0fd6f3aa60d852a624482', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTg0MjkyLCJleHAiOjE3NTAxNzYyOTJ9.8dsdBXTtHeWqHoZIZkNDNUjOaX-1Pn-bSY6uYdYj4s0', '2025-05-18 23:04:52', '2025-06-17 23:04:52'),
('9246874e174b80b93f03370a651dbcf5c17fe1ac2b108e91105511f22c29381a', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgxMjA4LCJleHAiOjE3NTExNzMyMDh9.M7AFrMLhtlGC9S3SLNOh7xODOdVt0veil8clHlqkBNs', '2025-05-30 12:00:08', '2025-06-29 12:00:08'),
('92a339f0506c0ae0f14203369a0a268120081d35dfbec81e2d53f88bfbaefec6', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIwNDEwLCJleHAiOjE3NTAyMTI0MTB9.r4BPoTrMnohq7lUff-ygu0smFEGga9h3je4L1UbNF5w', '2025-05-19 09:06:50', '2025-06-18 09:06:50'),
('943d06111bfcf2fe56e7dffd0cf2def95727baf02c915e9390dfb406ca6ace82', 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3ODE4NTI2LCJleHAiOjE3NTA0MTA1MjZ9.tJTMUb16evnQE1tTT5oaFULdVQptT--OyR8SD_j99GE', '2025-05-21 16:08:46', '2025-06-20 16:08:46'),
('95ffdc3d6a4d1bfca9ab12a590cc76c0c2076a7e993ca5babcffa6880479ff7e', 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3ODE4NzQ2LCJleHAiOjE3NTA0MTA3NDZ9.AQPkAeym9-06ak20ey9CIBYH8Ki57BHzcAq7PVIwFak', '2025-05-21 16:12:26', '2025-06-20 16:12:27'),
('95fff60a634d02d47eb52f17c8e72599b187f6a5b7058dca32f903be982e470c', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODU3MjI4NSwiZXhwIjoxNzUxMTY0Mjg1fQ.jwXTlWCu_IstIU5LFuOhLkmcmfbm06l0NB_Wz6iEYCg', '2025-05-30 09:31:25', '2025-06-29 09:31:25'),
('9640cba64d276062fcf80382d5ce4da15f77936de189a0cdf38f4c91c2083636', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgwMTIzLCJleHAiOjE3NTExNzIxMjN9.HOTiJEFnUV9C4uTf4OHBKLxGHbHBT4Lvhc9BS8FtjdY', '2025-05-30 11:42:03', '2025-06-29 11:42:03'),
('97f4cfacb19712075d0941587fe3bdf9eff2b34143c66adfd2e6c6f8c9a9a468', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NzMzNDk4LCJleHAiOjE3NTAzMjU0OTh9.y5mVp9hUR9LyrbFHzjSwA05ABaSWRD9_F-Ys5A3FU4w', '2025-05-20 16:31:38', '2025-06-19 16:31:38'),
('9a1b436ee16ab2e8ebae85ee4f940241d8cc2decdd41fc6734fe796172c7f6a7', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4MzIxLCJleHAiOjE3NTAyNjAzMjF9.1R3tZg3hC6mX5uxg67k2rKu7j7Xe_c736yYxImaA6lo', '2025-05-19 22:25:21', '2025-06-18 22:25:22'),
('9a22e0dbd72216e5ba8bf65ca93c4f13b7d8f8a95b161bbd9fc94df7a2ce1451', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDIwOTEzLCJleHAiOjE3NTEwMTI5MTN9.olq3BHMOoL5prDJbvA-E2ln4JHJiyubUwlLgu1tnR3o', '2025-05-28 15:28:33', '2025-06-27 15:28:34'),
('9cd776163791bd7c285ae7918a1daf5b1bff9a92080d5053564502a1aa892b67', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgxMjA4LCJleHAiOjE3NTExNzMyMDh9.M7AFrMLhtlGC9S3SLNOh7xODOdVt0veil8clHlqkBNs', '2025-05-30 12:00:08', '2025-06-29 12:00:09'),
('9e4819c118704e399bb7be0bbc43c60773e0a5ddf4ec510d57289d5c7e54ad97', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQ3NjQzMjU2LCJleHAiOjE3NTAyMzUyNTZ9.Mzllr_5VLzbg3Ja1AkMW0PUt6EmUavJfSg7HrViwtdw', '2025-05-19 15:27:36', '2025-06-18 15:27:37'),
('a096598ea5d3e45f8944d4b354cabc05b7943e75102ccb2715b843b2b14ee015', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4NzEzLCJleHAiOjE3NTAyNjA3MTN9.fz3nPMXfLbvjfihbQnQmvwpYGarjgb_-hsm3jzLX0H0', '2025-05-19 22:31:53', '2025-06-18 22:31:53'),
('a0bd454070aa5d697558be7f0eee66ee5bbb97a818b1aeb0b533ed33d54a9fea', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjQzMTU4LCJleHAiOjE3NTAyMzUxNTh9.jmrF0RQCXyvRaZO2sa9Z1EXTml-FTZk04Pw5bsD_t5U', '2025-05-19 15:25:58', '2025-06-18 15:25:58'),
('a1b0301a38f223f16af361e7373f657f4c3eec9f9670d693520b8c304edf9d14', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4NzEwLCJleHAiOjE3NTAyNjA3MTB9.-TbQZkmDkQv-FH7ZK-nfmQBRJRO_amhAyCBVcJhJrVY', '2025-05-19 22:31:50', '2025-06-18 22:31:51'),
('a5df55d080cce436d38ebd6d0990c453f181fc4c09f85b0f0b30d06343a48d06', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxMTI4LCJleHAiOjE3NTAyMTMxMjh9.Et1Gg3VGrOYIZbeMbTKKcmLxNwRQLIvixce0vaBLs-Y', '2025-05-19 09:18:48', '2025-06-18 09:18:48'),
('a7e01b6fd873f529e81c1e6b6f6c5394ebde9cc02e451333440c971e767db6f9', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE1OTc1LCJleHAiOjE3NTAyMDc5NzV9.pogfW4jMJg6quTUsRlm1hyIxt1910rAZMRDN5BFMP40', '2025-05-19 07:52:55', '2025-06-18 07:52:56'),
('a91680b51e4c7a99cb99c1ce9afb51b3c1340a99fcf142bf44557b4d58445cec', 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQ3NjQzMzEzLCJleHAiOjE3NTAyMzUzMTN9.frHTep59Rhh-2tg7XT3v1xp8dO1JPpqsbcjg4H6bvyI', '2025-05-19 15:28:33', '2025-06-18 15:28:34'),
('aa4b56dcfc057c865779f122f54d4c0d85181fce85b0ed5e1a676c2bc9f98674', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE1OTA4LCJleHAiOjE3NTAyMDc5MDh9.ygn2BTEKDYQuTwMw2jZabFEB5sY-VkK98TWoOpjpczg', '2025-05-19 07:51:48', '2025-06-18 07:51:48'),
('aad64ebacf1e5307b797969fd58e49f754f1db187a12d95a57cd79667f8844ca', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTgzODA2LCJleHAiOjE3NTAxNzU4MDZ9.dvL42f9oSxOnzPRTF3kDGpSkcOojDbxBEZZDBbGYBXs', '2025-05-18 22:56:46', '2025-06-17 22:56:47'),
('aba63815f7022c67bf559d85b7e21db176e6bc3d353b29ba626c60cc27cb0e55', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDA0MDcyLCJleHAiOjE3NTA5OTYwNzJ9.z5AChQikawk-tsQKcKFXNLgea4oYZPKZM-wDq0GhWOw', '2025-05-28 10:47:52', '2025-06-27 10:47:53'),
('ae63eb5d4d2cfbde4a4beec7404ce050cc50e3b9b4dbc6aa8e169aef3d8833bd', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTgzNTIyLCJleHAiOjE3NTAxNzU1MjJ9.fj0_q9bYeHhT5_3xYqdzaHTDbo3eYS_MGx0Vzhh3JAw', '2025-05-18 22:52:02', '2025-06-17 22:52:02'),
('b214d2129f9be054157ca4e68fa7a14538b1c1098ff2c93872cf4745071e14b2', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDg2NDYzLCJleHAiOjE3NTEwNzg0NjN9.lJtRB92PhwWoL2o-rUOpAlJORRSFnTS1CFerTCwbpYE', '2025-05-29 09:41:03', '2025-06-28 09:41:03'),
('b2476f34c605f17e7f451e86dd2ec68dfcfc5eca3a00ca8332c9259c813e02d6', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4Mjk0LCJleHAiOjE3NTAyNjAyOTR9.qxFx68L440ELYQAus17AVW4rRWA6r311uwvXc9oO_wY', '2025-05-19 22:24:54', '2025-06-18 22:24:54'),
('b4b1e5140dbb9f7695f181e8750b3150983c2238309966611f6fa7d304a8fad4', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODA5Nzk4OCwiZXhwIjoxNzUwNjg5OTg4fQ.NNdW2rDIqRqFFoTZbVc2xce7PO5lDx6i7mwnlrrvwPE', '2025-05-24 21:46:28', '2025-06-23 21:46:28'),
('b934b73b14a710048c8417906c4f65b7783e9abaa422a056a2414be501a32c3b', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTg0MjU3LCJleHAiOjE3NTExNzYyNTd9.3_1-2BWMfwMngpxX4IHvVgGoRaWe7ILQ6b4zG13O46U', '2025-05-30 12:50:57', '2025-06-29 12:50:58'),
('b936153e91143970c22b4a07783b92c4da8b10262bbbfe95384e2840b7940b35', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODU3MzAyNywiZXhwIjoxNzUxMTY1MDI3fQ.lyJAfTIuog6XneBPCmzk3XF7MiJprKQTtULpZYRBWDs', '2025-05-30 09:43:47', '2025-06-29 09:43:48'),
('bacc37534995c45277b5f76165e0c37dc11bb7fd678e90882e50d94eaad8b5b4', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE2MDYxLCJleHAiOjE3NTAyMDgwNjF9.XPmtFj0x-FldpvclZLQQV9dzhOjq2JHLCTj1JgdSIcA', '2025-05-19 07:54:21', '2025-06-18 07:54:22'),
('bc15a2599e0e918855bf990964f22a8b1def8fa7c485c5779aa723f3770d4b7e', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQ3NTgzMTUwLCJleHAiOjE3NTAxNzUxNTB9.yHYguEOXbUPIM_UIn804AJ4ov265ArF6dOVjhD_e7Dg', '2025-05-18 22:45:50', '2025-06-17 22:45:50'),
('bf4ba4131c4af8850f330ae4f0d088591cab1defb1e0aafc6e43ec9bb3f1cece', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgyNTAzLCJleHAiOjE3NTExNzQ1MDN9.jd_vJlUcwNAkj31zjF9NWu_mc4CoP_IFG_XPwXsrRv8', '2025-05-30 12:21:43', '2025-06-29 12:21:43'),
('c0a5c5e4289623d3cf45a429ffeae65b0894918d2d98a24a1365bc711f94b9d8', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczNjI0LCJleHAiOjE3NTExNjU2MjR9.h4CWo-ixjmS7fSJTJ4aXWydgy-fgrfzTAM07ibKRRpQ', '2025-05-30 09:53:44', '2025-06-29 09:53:45'),
('c13a011261e2cd710bf87012e4cb9d439feed8400d17e89d84ff06f068029773', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTg1NjczLCJleHAiOjE3NTExNzc2NzN9.5gvThEFscdVmHtByvIFP3YQfBnEpynZgRHLmkxjlBTY', '2025-05-30 13:14:33', '2025-06-29 13:14:34'),
('c389c14f1090ee32fcd5a836a900279f02f208add405f5aaab4ab6ad171e39a6', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyNDg3LCJleHAiOjE3NTAyMTQ0ODd9.bniQRFco7RNx6H--36rsVg5KPKCclG5981x7v1stKuI', '2025-05-19 09:41:27', '2025-06-18 09:41:28'),
('c80775e8d642bdabf156dfafc587379133e15a0bed8bc395647becacd21e7243', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODU3MjI4NSwiZXhwIjoxNzUxMTY0Mjg1fQ.jwXTlWCu_IstIU5LFuOhLkmcmfbm06l0NB_Wz6iEYCg', '2025-05-30 09:31:25', '2025-06-29 09:31:25'),
('c98f58a7c2c948305b528f5fe4a0645198cf0122f066467b16d64408b3abec78', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTgzMzEwLCJleHAiOjE3NTExNzUzMTB9.bssBpQXCKfYAeY_Y6uiN6r3DFdUXaVi6MVFwLxe9WKQ', '2025-05-30 12:35:10', '2025-06-29 12:35:10'),
('ca6ef9bdf0b56d9af69839055e6935351af2e4dcc74651c792f8f9f955cbd7fb', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDIwOTEzLCJleHAiOjE3NTEwMTI5MTN9.olq3BHMOoL5prDJbvA-E2ln4JHJiyubUwlLgu1tnR3o', '2025-05-28 15:28:33', '2025-06-27 15:28:34'),
('cb86183c95b22b64171d74ee62d2b39a1dffccf71fee9b3f898c12b870f2e82e', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczNjI0LCJleHAiOjE3NTExNjU2MjR9.h4CWo-ixjmS7fSJTJ4aXWydgy-fgrfzTAM07ibKRRpQ', '2025-05-30 09:53:44', '2025-06-29 09:53:45'),
('cf5085c9a1e44c4bba1b6978953261ae9167ade1b629e96551f3516ce2578772', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTgzNTM5LCJleHAiOjE3NTAxNzU1Mzl9.L_Fi2sPjZn6GF980tJwCdo88ja4KA2_Fc38wTk5MsP8', '2025-05-18 22:52:19', '2025-06-17 22:52:19'),
('cfce94fe6e963caec8d31ae5230e88134ea93e560e0a7dd5127a1091f2794870', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIwODA1LCJleHAiOjE3NTAyMTI4MDV9.PEFbSGMO0NizFov8yUAdTY-6A_L0yXpYr0t5qWnozhU', '2025-05-19 09:13:25', '2025-06-18 09:13:25'),
('d2ecca0c92ce9a016481ef382d420449f64d9b2e46d5e932bcc33c235487d71e', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE1OTE0LCJleHAiOjE3NTAyMDc5MTR9.37QcbrXMgpMJg6FRMvWRfPjbM9N5l84tyXa4s6vymO8', '2025-05-19 07:51:54', '2025-06-18 07:51:54'),
('d4fe549730c52bad7b8dcd17828ccae90a10e25a6d3490f213fae9a9acb03521', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4MjkyLCJleHAiOjE3NTAyNjAyOTJ9.Wsg4L9Vil-u_YTXgb8Tti6qXo6uAIqt9YxbitDBjnLc', '2025-05-19 22:24:52', '2025-06-18 22:24:52'),
('d73ab50391b1e570c6a1e6aee602277586d85d84253a1f93ce903428cf53a383', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4NzA0LCJleHAiOjE3NTAyNjA3MDR9.FJRTjeVcYlckWGbLrfR929zWlBZIHthRNmXUHpiz2Gk', '2025-05-19 22:31:44', '2025-06-18 22:31:44'),
('d8f219001e7743cee00bccd7dfaf6b1d6bbba49e108bd368276b2860788f6f07', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE1OTYzLCJleHAiOjE3NTAyMDc5NjN9.NUHnDNUiaqtglqTUb-zOl_YtPRH4dOZC-WbgyqCm5ho', '2025-05-19 07:52:43', '2025-06-18 07:52:43'),
('d9b51ef35ca70f3abfaebfcab7abe55a382405c9886ad53c5cfcec39462a06c0', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjE1OTI1LCJleHAiOjE3NTAyMDc5MjV9.f4WMiK1K-xColGUuGrizY_jX4QQ0A8x88Q3mJRhbVSw', '2025-05-19 07:52:05', '2025-06-18 07:52:05'),
('d9f70beb6280377abb9bcd1cef2dd9cc78378357610131bca266ec8d49e085d1', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDg2NDQ1LCJleHAiOjE3NTEwNzg0NDV9.RG3pFtNhr5CBWLkEBvk4OP9GUYKUy7-HK189BnqiyeY', '2025-05-29 09:40:45', '2025-06-28 09:40:45'),
('da8cad4fbc69c74f5e612e2036a97701bc876951718ab0be7f67101b89eef6e1', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODQ4OTIzNywiZXhwIjoxNzUxMDgxMjM3fQ.Yd1A1JY2XqM6Ofgyf3hVyUjsFl-DQLVRJfGyzfnJqZs', '2025-05-29 10:27:17', '2025-06-28 10:27:18'),
('dc1031adcd783e41a0d28030ae5c1b88dc7fabadc0114b1577f7ea37c503150e', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjY4ODgwLCJleHAiOjE3NTAyNjA4ODB9.zOmxkFqCH-4MKaLBnqPjXWS6KxQXDuuoBBk9skiX0sM', '2025-05-19 22:34:40', '2025-06-18 22:34:41'),
('ddf76db26d1245bf7081a01ae411dcd2a9e5f68c27e625386c3fced98088d7ee', 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQ3OTY0OTYwLCJleHAiOjE3NTA1NTY5NjB9.yRyRkyg_LSIVSIPSwebx61lem5Exw5Q2MxlBCgtVUmA', '2025-05-23 08:49:20', '2025-06-22 08:49:20'),
('dfb9b6378783a88d844066989f1ad89cabfb93894136584f3c8b9030aaa70da2', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczMTY2LCJleHAiOjE3NTExNjUxNjZ9.Ve1awnQbaPjiWJQDGL3dcbA4E-FBnElaznC5g2va9fI', '2025-05-30 09:46:06', '2025-06-29 09:46:07'),
('dfeb3468f5f38a9e6d07cafec7a7d88a5c6762c3c18d03e560a3dda5981b4745', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3OTY0Nzk0LCJleHAiOjE3NTA1NTY3OTR9.YBtVyg7N0tgRbIL86FGb1BTus0sl8mOOLqqjXz18Zww', '2025-05-23 08:46:34', '2025-06-22 08:46:35'),
('e3d47d39f7d8488ba6acce01a09303ac3a933a0cb950ed1f0b64d1ad8c2a5a56', 8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTg4MTIyLCJleHAiOjE3NTExODAxMjJ9.7JscU4-flsILpSSXcqvePrvnxL-MCaURndrDDU_HwY4', '2025-05-30 13:55:22', '2025-06-29 13:55:23'),
('e725827a71ea942f1fc6e814f05f71a90a2d5b760f33cdc4f0b09071a07d917a', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIwOTc1LCJleHAiOjE3NTAyMTI5NzV9.if8WbjVaUaFDVLyoCV0EPQAvOFbgEhi7oCuUKlppWEQ', '2025-05-19 09:16:15', '2025-06-18 09:16:16'),
('e8421a828fe204d1e7f2f6b781804794d4d92a52f917ee5df59e4f591dd3c040', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxNTg5LCJleHAiOjE3NTAyMTM1ODl9.UuEbjVHxp26DT6Bi6LfulzjjWABE4wQItv9RJeoR41s', '2025-05-19 09:26:29', '2025-06-18 09:26:30'),
('ea1e5003d0aaa08c71f4f83962796b8c70d6c63523f7b523527b8044b408cfc7', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4Mzk3ODI1LCJleHAiOjE3NTA5ODk4MjV9.MeX_aTC39zrWxVwIkKZfxhiYA603KfBwCFVHsjDiO9o', '2025-05-28 09:03:45', '2025-06-27 09:03:45'),
('eb5d85b34417048d0fc642c1963b3f89d5235c9980e50218f3fe01cc82ad64b7', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODQ4NjUwOCwiZXhwIjoxNzUxMDc4NTA4fQ.nRU1sdTy8hxj7DWXf-ooAIA3JZEbbOKR6O_22nnNYVA', '2025-05-29 09:41:48', '2025-06-28 09:41:49'),
('ed20acabbdf69629df3204f35afbeb29c02388407489c521b10604427f5a3fe0', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczMDk2LCJleHAiOjE3NTExNjUwOTZ9.NlTI_zZK3Co3fM8piMmaQxU8EmScQfi_YH_JbPVolu0', '2025-05-30 09:44:56', '2025-06-29 09:44:57'),
('f05457a190bf1f434431f7cf5a183ddf4ad034726ec34ecef87853efece0b755', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxMzg3LCJleHAiOjE3NTAyMTMzODd9.QbwHzZGq6NodMFSGf8z0TjDEGdwvQOFhVzBvDjUbyfE', '2025-05-19 09:23:07', '2025-06-18 09:23:08'),
('f1ac3581f809c1328719f3a1766887d5855809504123796e5da8cfb2a10c57e9', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODU3MzAyNywiZXhwIjoxNzUxMTY1MDI3fQ.lyJAfTIuog6XneBPCmzk3XF7MiJprKQTtULpZYRBWDs', '2025-05-30 09:43:47', '2025-06-29 09:43:48'),
('f2ff1764c20c597f75455a5fc65764e9d49cd0dba7acd5a68d68f1a2ba9e67f5', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTg0NDAyLCJleHAiOjE3NTAxNzY0MDJ9.XP0V0NfBKGQ6k3zVd_PhPrNZu9uohF6CAR5JFsdiCww', '2025-05-18 23:06:42', '2025-06-17 23:06:42'),
('f67a9a3f6f2515eded93a3366a258f4c8f9259a9fbc8fb2af4ace1f3dd989194', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIxMzgyLCJleHAiOjE3NTAyMTMzODJ9.NMzn59sU1Rxx9tbqApB0z8exZ5aOATFs3q_s7xMjpZc', '2025-05-19 09:23:02', '2025-06-18 09:23:03'),
('f732df15186440c4d65ac1a9d21af865b7d727205f67aa94f85f0cc3d002495c', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NjIyMjA3LCJleHAiOjE3NTAyMTQyMDd9.z3JX-ZbmCbd3BlxV-ryFcEMWDQnAxSq4UVGNY-gUJxo', '2025-05-19 09:36:47', '2025-06-18 09:36:47'),
('fc9395fb880e0ef71d0241ec1f3b1309ee35b434b29138ccdba1169c8ec08ee5', 7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NTczMDk2LCJleHAiOjE3NTExNjUwOTZ9.NlTI_zZK3Co3fM8piMmaQxU8EmScQfi_YH_JbPVolu0', '2025-05-30 09:44:56', '2025-06-29 09:44:57'),
('fcac9777d1516a08c4707d4143118265964bed10ff8e793f209c97f3c04b8799', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ3NTg0NTk0LCJleHAiOjE3NTAxNzY1OTR9.5dPx5OyZNM_MC162waSZnOKixXX3kXHyfkuWqrFi4Hc', '2025-05-18 23:09:54', '2025-06-17 23:09:54'),
('fcc9923fd087119105f348af0ed899ce61f667881ba4046bd6bde768b0c0afc5', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4MDk3OTUyLCJleHAiOjE3NTA2ODk5NTJ9.k2yC0vad1DMYk1bMpbv0eKK4PXWAKGtb9H9p8zxbIJk', '2025-05-24 21:45:52', '2025-06-23 21:45:53'),
('fde3078d85a7516852bae87a0e953b5d0f44ffef3945adac502c132744809f56', 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ4NDE3OTc2LCJleHAiOjE3NTEwMDk5NzZ9.cBLIstnWIRJv9cTZjh1dPKB788Ipx8WWOK2I6WYiq04', '2025-05-28 14:39:36', '2025-06-27 14:39:37'),
('fefd0a159b009ec3e6312acaaf368ab87910ac544125279c37eb2c9a6278bbaa', 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc0ODQ4OTIyMSwiZXhwIjoxNzUxMDgxMjIxfQ.nHzo3C81ypeH62jMvTc0UcTtXuy_tkd7q9unRqSJorw', '2025-05-29 10:27:01', '2025-06-28 10:27:01');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stores`
--

CREATE TABLE `stores` (
  `store_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `opening_hours` varchar(100) DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `open_time` time DEFAULT '07:00:00',
  `close_time` time DEFAULT '21:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `stores`
--

INSERT INTO `stores` (`store_id`, `name`, `address`, `city`, `district`, `phone`, `opening_hours`, `lat`, `lng`, `created_at`, `updated_at`, `open_time`, `close_time`) VALUES
(1, 'Nguyên Sinh Trần Đình Xu', '141 Trần Đình Xu', 'TP.HCM', 'Quận 1', '02839203404', '6:00 - 21:00', 10.7626220, 106.6601720, '2025-04-28 13:28:30', '2025-05-22 12:52:18', '06:00:00', '21:00:00'),
(2, 'Nguyên Sinh Nguyễn Thị Minh Khai', '123 Nguyễn Thị Minh Khai', 'TP.HCM', 'Quận 3', '02839211234', '6:00 - 21:00', 10.7797830, 106.6826790, '2025-04-28 13:28:30', '2025-05-22 12:52:18', '06:00:00', '21:00:00'),
(3, 'Nguyên Sinh Quận 7', '45 Nguyễn Văn Linh', 'TP.HCM', 'Quận 7', '02837756677', '7:00 - 22:00', 10.7298430, 106.7211950, '2025-04-28 13:28:30', '2025-05-22 12:52:18', '07:00:00', '22:00:00'),
(4, 'Nguyên Sinh Bình Thạnh', '567 Điện Biên Phủ', 'TP.HCM', 'Bình Thạnh', '02835123456', '6:30 - 20:30', 10.8039570, 106.7115670, '2025-04-28 13:28:30', '2025-05-22 12:52:18', '06:30:00', '20:30:00'),
(5, 'Nguyên Sinh Hà Nội', '89 Giảng Võ', 'Hà Nội', 'Ba Đình', '02438256789', '7:00 - 22:00', 21.0294490, 105.8270850, '2025-04-28 13:28:30', '2025-05-22 12:52:18', '07:00:00', '22:00:00'),
(6, 'Nguyên Sinh Đà Nẵng', '12 Nguyễn Văn Linh', 'Đà Nẵng', 'Hải Châu', '02363867890', '7:00 - 21:00', 16.0608770, 108.2125660, '2025-04-28 13:28:30', '2025-04-28 13:28:30', '07:00:00', '21:00:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tables`
--

CREATE TABLE `tables` (
  `table_id` int NOT NULL,
  `store_id` int NOT NULL,
  `table_number` int NOT NULL,
  `seats` int NOT NULL,
  `table_type` enum('round','rectangle','large') NOT NULL DEFAULT 'round',
  `status` enum('available','occupied','reserved','maintenance') NOT NULL DEFAULT 'available',
  `position_x` int DEFAULT NULL,
  `position_y` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `tables`
--

INSERT INTO `tables` (`table_id`, `store_id`, `table_number`, `seats`, `table_type`, `status`, `position_x`, `position_y`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 2, 'round', 'available', 100, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(2, 1, 2, 2, 'round', 'available', 200, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(3, 1, 3, 4, 'round', 'available', 300, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(4, 1, 4, 4, 'round', 'occupied', 400, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(5, 1, 5, 6, 'rectangle', 'available', 100, 200, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(6, 1, 6, 6, 'rectangle', 'reserved', 250, 200, '2025-05-17 21:46:07', '2025-05-22 13:17:36'),
(7, 1, 7, 6, 'rectangle', 'maintenance', 400, 200, '2025-05-17 21:46:07', '2025-05-28 21:46:45'),
(8, 1, 8, 8, 'large', 'available', 100, 300, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(9, 1, 9, 8, 'large', 'available', 250, 300, '2025-05-17 21:46:07', '2025-05-28 10:23:17'),
(10, 1, 10, 8, 'large', 'available', 400, 300, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(11, 2, 1, 2, 'round', 'available', 100, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(12, 2, 2, 2, 'round', 'available', 200, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(13, 2, 3, 4, 'round', 'available', 300, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(14, 2, 4, 4, 'round', 'available', 400, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(15, 2, 5, 6, 'rectangle', 'available', 100, 200, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(16, 2, 6, 6, 'rectangle', 'occupied', 250, 200, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(17, 2, 7, 6, 'rectangle', 'reserved', 400, 200, '2025-05-17 21:46:07', '2025-05-22 14:04:50'),
(18, 2, 8, 8, 'large', 'available', 100, 300, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(19, 2, 9, 8, 'large', 'reserved', 250, 300, '2025-05-17 21:46:07', '2025-05-22 13:55:20'),
(20, 2, 10, 8, 'large', 'occupied', 400, 300, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(21, 3, 1, 2, 'round', 'reserved', 100, 100, '2025-05-17 21:46:07', '2025-05-24 21:48:42'),
(22, 3, 2, 2, 'round', 'available', 200, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(23, 3, 3, 4, 'round', 'occupied', 300, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(24, 3, 4, 4, 'round', 'available', 400, 100, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(25, 3, 5, 6, 'rectangle', 'available', 100, 200, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(26, 3, 6, 6, 'rectangle', 'available', 250, 200, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(27, 3, 7, 6, 'rectangle', 'available', 400, 200, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(28, 3, 8, 8, 'large', 'occupied', 100, 300, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(29, 3, 9, 8, 'large', 'available', 250, 300, '2025-05-17 21:46:07', '2025-05-17 21:46:07'),
(30, 3, 10, 8, 'large', 'available', 400, 300, '2025-05-17 21:46:07', '2025-05-17 21:46:07');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `full_name`, `phone`, `role`, `created_at`, `updated_at`) VALUES
(1, 'nguyenvana', 'vana@example.com', '1', 'Nguyễn Văn A', '0912345678', 'customer', '2025-04-28 13:28:30', '2025-05-15 13:46:49'),
(2, 'tranthib', 'thib@example.com', 'hashpassword2', 'Trần Thị B', '0923456789', 'customer', '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(3, 'lequangc', 'quangc@example.com', 'hashpassword3', 'Lê Quang C', '0934567890', 'customer', '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(4, 'admin1', 'admin1@example.com', '$2a$10$htMNZ7Nh/Df42QQ6rFg/OOHuH7f2m1Ut.Dz3Nrlv7pTsM5g8TOdKq', 'Admin One', '0909090909', 'admin', '2025-04-28 13:28:30', '2025-05-18 22:50:23'),
(5, 'phamthid', 'thid@example.com', 'hashpassword4', 'Phạm Thị D', '0945678901', 'customer', '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(6, 'votranf', 'tranf@example.com', 'hashpassword5', 'Võ Trần F', '0956789012', 'customer', '2025-04-28 13:28:30', '2025-04-28 13:28:30'),
(7, 'long', 'vunamlong3522@gmail.com', '$2a$10$htMNZ7Nh/Df42QQ6rFg/OOHuH7f2m1Ut.Dz3Nrlv7pTsM5g8TOdKq', 'long vũ', '0943469858', 'admin', '2025-05-15 13:57:39', '2025-05-21 01:33:16'),
(8, 'long', 'vunamlong35@gmail.com', '$2a$10$HtNpvouxo1DeD/Gs9kny1Otl.zRIuqdx7boSAzgW8WtcW.FPdMzIG', 'long vũ', '0000000000', 'admin', '2025-05-19 15:28:25', '2025-05-21 01:32:58'),
(9, 'long', 'vunamlong100@gmail.com', '$2a$10$E/R13le10QrEL7FnwojsIOps.LQDNkoFj9QF8EoSVttHXqhczzHrW', 'long vũ', '0000000001', 'customer', '2025-05-23 08:49:20', '2025-05-23 08:49:20'),
(10, 'long', 'vunamlong5@gmail.com', '$2a$10$D.ut1LNetayuPJw1RoasVuA5Hrv6APqvoesdQvkfOVJJ7wYvm7UCS', 'long vũ', '0000000007', 'customer', '2025-05-24 21:46:19', '2025-05-24 21:46:19'),
(11, 'long', 'longtest@gmail.com', '$2a$10$K9gVIH7UKS9KZHp/7uruaesr8kmToToC.DmpiBOLQWpL3Kng6A1IK', 'nguyễn văn lông', '0000000123', 'customer', '2025-05-28 09:09:40', '2025-05-28 09:09:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_notification_logs`
--

CREATE TABLE `user_notification_logs` (
  `log_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `session_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notification_id` int NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wishlists`
--

CREATE TABLE `wishlists` (
  `wishlist_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `wishlists`
--

INSERT INTO `wishlists` (`wishlist_id`, `user_id`, `created_at`) VALUES
(1, 7, '2025-05-16 20:54:07');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wishlist_items`
--

CREATE TABLE `wishlist_items` (
  `wishlist_item_id` int NOT NULL,
  `wishlist_id` int NOT NULL,
  `product_id` int NOT NULL,
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `wishlist_items`
--

INSERT INTO `wishlist_items` (`wishlist_item_id`, `wishlist_id`, `product_id`, `added_at`) VALUES
(1, 1, 3, '2025-05-16 21:01:39'),
(3, 1, 6, '2025-05-16 21:15:32'),
(4, 1, 1, '2025-05-22 11:11:53');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`address_id`),
  ADD KEY `fk_addresses_user` (`user_id`);

--
-- Chỉ mục cho bảng `ai_conversation_logs`
--
ALTER TABLE `ai_conversation_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `ai_feedback`
--
ALTER TABLE `ai_feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `log_id` (`log_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `ai_prompts`
--
ALTER TABLE `ai_prompts`
  ADD PRIMARY KEY (`prompt_id`);

--
-- Chỉ mục cho bảng `ai_settings`
--
ALTER TABLE `ai_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `unique_setting_name` (`name`);

--
-- Chỉ mục cho bảng `blog_categories`
--
ALTER TABLE `blog_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_blog_posts_author` (`author_id`),
  ADD KEY `fk_blog_posts_category` (`category_id`);

--
-- Chỉ mục cho bảng `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`cart_id`),
  ADD KEY `fk_carts_user` (`user_id`);

--
-- Chỉ mục cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD KEY `fk_cart_items_cart` (`cart_id`),
  ADD KEY `fk_cart_items_product` (`product_id`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_categories_parent` (`parent_id`);

--
-- Chỉ mục cho bảng `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `chat_notifications`
--
ALTER TABLE `chat_notifications`
  ADD PRIMARY KEY (`notification_id`);

--
-- Chỉ mục cho bảng `chat_sessions`
--
ALTER TABLE `chat_sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Chỉ mục cho bảng `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`coupon_id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Chỉ mục cho bảng `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD PRIMARY KEY (`points_id`),
  ADD KEY `fk_points_user` (`user_id`),
  ADD KEY `fk_points_order` (`order_id`);

--
-- Chỉ mục cho bảng `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `fk_messages_user` (`user_id`);

--
-- Chỉ mục cho bảng `options`
--
ALTER TABLE `options`
  ADD PRIMARY KEY (`option_id`);

--
-- Chỉ mục cho bảng `option_values`
--
ALTER TABLE `option_values`
  ADD PRIMARY KEY (`value_id`),
  ADD KEY `fk_option_values_option` (`option_id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `fk_orders_user` (`user_id`),
  ADD KEY `fk_orders_address` (`address_id`),
  ADD KEY `fk_orders_coupon` (`coupon_id`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `fk_items_order` (`order_id`),
  ADD KEY `fk_items_product` (`product_id`);

--
-- Chỉ mục cho bảng `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `fk_osh_order` (`order_id`),
  ADD KEY `fk_osh_user` (`changed_by`);

--
-- Chỉ mục cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`reset_id`),
  ADD KEY `fk_password_resets_user` (`user_id`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_payments_order` (`order_id`);

--
-- Chỉ mục cho bảng `post_comments`
--
ALTER TABLE `post_comments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `fk_comments_post` (`post_id`),
  ADD KEY `fk_comments_user` (`user_id`),
  ADD KEY `fk_comments_parent` (`parent_id`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_products_category` (`category_id`);

--
-- Chỉ mục cho bảng `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `fk_images_product` (`product_id`);

--
-- Chỉ mục cho bảng `product_options`
--
ALTER TABLE `product_options`
  ADD PRIMARY KEY (`option_id`),
  ADD KEY `fk_product_options_product` (`product_id`);

--
-- Chỉ mục cho bảng `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`reservation_id`),
  ADD KEY `fk_reservations_user` (`user_id`),
  ADD KEY `fk_reservations_store` (`store_id`),
  ADD KEY `fk_reservations_table` (`table_id`);

--
-- Chỉ mục cho bảng `reservation_payments`
--
ALTER TABLE `reservation_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_reservation_payments_reservation` (`reservation_id`);

--
-- Chỉ mục cho bảng `reservation_status_history`
--
ALTER TABLE `reservation_status_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `fk_reservation_history_reservation` (`reservation_id`),
  ADD KEY `fk_reservation_history_user` (`changed_by`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `fk_reviews_user` (`user_id`),
  ADD KEY `fk_reviews_product` (`product_id`);

--
-- Chỉ mục cho bảng `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `fk_sessions_user` (`user_id`);

--
-- Chỉ mục cho bảng `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`store_id`);

--
-- Chỉ mục cho bảng `tables`
--
ALTER TABLE `tables`
  ADD PRIMARY KEY (`table_id`),
  ADD KEY `fk_tables_store` (`store_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `user_notification_logs`
--
ALTER TABLE `user_notification_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `notification_id` (`notification_id`);

--
-- Chỉ mục cho bảng `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`wishlist_id`),
  ADD KEY `fk_wishlists_user` (`user_id`);

--
-- Chỉ mục cho bảng `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD PRIMARY KEY (`wishlist_item_id`),
  ADD UNIQUE KEY `uq_wishlist_product` (`wishlist_id`,`product_id`),
  ADD KEY `fk_wishlist_items_product` (`product_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `addresses`
--
ALTER TABLE `addresses`
  MODIFY `address_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `ai_conversation_logs`
--
ALTER TABLE `ai_conversation_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `ai_feedback`
--
ALTER TABLE `ai_feedback`
  MODIFY `feedback_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `ai_prompts`
--
ALTER TABLE `ai_prompts`
  MODIFY `prompt_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `ai_settings`
--
ALTER TABLE `ai_settings`
  MODIFY `setting_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `blog_categories`
--
ALTER TABLE `blog_categories`
  MODIFY `category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `blog_posts`
--
ALTER TABLE `blog_posts`
  MODIFY `post_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT cho bảng `carts`
--
ALTER TABLE `carts`
  MODIFY `cart_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `cart_item_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `message_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT cho bảng `chat_notifications`
--
ALTER TABLE `chat_notifications`
  MODIFY `notification_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `coupons`
--
ALTER TABLE `coupons`
  MODIFY `coupon_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `loyalty_points`
--
ALTER TABLE `loyalty_points`
  MODIFY `points_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `options`
--
ALTER TABLE `options`
  MODIFY `option_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `option_values`
--
ALTER TABLE `option_values`
  MODIFY `value_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `history_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `reset_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `post_comments`
--
ALTER TABLE `post_comments`
  MODIFY `comment_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `product_images`
--
ALTER TABLE `product_images`
  MODIFY `image_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `product_options`
--
ALTER TABLE `product_options`
  MODIFY `option_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `reservations`
--
ALTER TABLE `reservations`
  MODIFY `reservation_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `reservation_payments`
--
ALTER TABLE `reservation_payments`
  MODIFY `payment_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `reservation_status_history`
--
ALTER TABLE `reservation_status_history`
  MODIFY `history_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `stores`
--
ALTER TABLE `stores`
  MODIFY `store_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `tables`
--
ALTER TABLE `tables`
  MODIFY `table_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `user_notification_logs`
--
ALTER TABLE `user_notification_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `wishlist_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `wishlist_items`
--
ALTER TABLE `wishlist_items`
  MODIFY `wishlist_item_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `ai_conversation_logs`
--
ALTER TABLE `ai_conversation_logs`
  ADD CONSTRAINT `ai_conversation_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `ai_feedback`
--
ALTER TABLE `ai_feedback`
  ADD CONSTRAINT `ai_feedback_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `ai_conversation_logs` (`log_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ai_feedback_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD CONSTRAINT `fk_blog_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_blog_posts_category` FOREIGN KEY (`category_id`) REFERENCES `blog_categories` (`category_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE RESTRICT;

--
-- Ràng buộc cho bảng `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD CONSTRAINT `fk_points_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_points_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `option_values`
--
ALTER TABLE `option_values`
  ADD CONSTRAINT `fk_option_values_option` FOREIGN KEY (`option_id`) REFERENCES `product_options` (`option_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_address` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_orders_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`coupon_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE RESTRICT;

--
-- Ràng buộc cho bảng `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_osh_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `post_comments`
--
ALTER TABLE `post_comments`
  ADD CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `post_comments` (`comment_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `blog_posts` (`post_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE RESTRICT;

--
-- Ràng buộc cho bảng `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `product_options`
--
ALTER TABLE `product_options`
  ADD CONSTRAINT `fk_product_options_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `fk_reservations_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  ADD CONSTRAINT `fk_reservations_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`table_id`),
  ADD CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `reservation_payments`
--
ALTER TABLE `reservation_payments`
  ADD CONSTRAINT `fk_reservation_payments_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`reservation_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `reservation_status_history`
--
ALTER TABLE `reservation_status_history`
  ADD CONSTRAINT `fk_reservation_history_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`reservation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reservation_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `tables`
--
ALTER TABLE `tables`
  ADD CONSTRAINT `fk_tables_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `user_notification_logs`
--
ALTER TABLE `user_notification_logs`
  ADD CONSTRAINT `user_notification_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_notification_logs_ibfk_2` FOREIGN KEY (`notification_id`) REFERENCES `chat_notifications` (`notification_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `fk_wishlists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD CONSTRAINT `fk_wishlist_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wishlist_items_wishlist` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`wishlist_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
