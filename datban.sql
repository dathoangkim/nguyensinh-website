-- Cấu trúc bảng cho bảng `tables`
CREATE TABLE `tables` (
  `table_id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `table_number` int NOT NULL,
  `seats` int NOT NULL,
  `table_type` enum('round','rectangle','large') NOT NULL DEFAULT 'round',
  `status` enum('available','occupied','reserved','maintenance') NOT NULL DEFAULT 'available',
  `position_x` int DEFAULT NULL,
  `position_y` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`table_id`),
  KEY `fk_tables_store` (`store_id`),
  CONSTRAINT `fk_tables_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Đang đổ dữ liệu cho bảng `tables`
INSERT INTO `tables` (`table_id`, `store_id`, `table_number`, `seats`, `table_type`, `status`, `position_x`, `position_y`) VALUES
(1, 1, 1, 2, 'round', 'available', 100, 100),
(2, 1, 2, 2, 'round', 'available', 200, 100),
(3, 1, 3, 4, 'round', 'available', 300, 100),
(4, 1, 4, 4, 'round', 'occupied', 400, 100),
(5, 1, 5, 6, 'rectangle', 'available', 100, 200),
(6, 1, 6, 6, 'rectangle', 'available', 250, 200),
(7, 1, 7, 6, 'rectangle', 'occupied', 400, 200),
(8, 1, 8, 8, 'large', 'available', 100, 300),
(9, 1, 9, 8, 'large', 'occupied', 250, 300),
(10, 1, 10, 8, 'large', 'available', 400, 300),
(11, 2, 1, 2, 'round', 'available', 100, 100),
(12, 2, 2, 2, 'round', 'available', 200, 100),
(13, 2, 3, 4, 'round', 'available', 300, 100),
(14, 2, 4, 4, 'round', 'available', 400, 100),
(15, 2, 5, 6, 'rectangle', 'available', 100, 200),
(16, 2, 6, 6, 'rectangle', 'occupied', 250, 200),
(17, 2, 7, 6, 'rectangle', 'available', 400, 200),
(18, 2, 8, 8, 'large', 'available', 100, 300),
(19, 2, 9, 8, 'large', 'available', 250, 300),
(20, 2, 10, 8, 'large', 'occupied', 400, 300),
(21, 3, 1, 2, 'round', 'available', 100, 100),
(22, 3, 2, 2, 'round', 'available', 200, 100),
(23, 3, 3, 4, 'round', 'occupied', 300, 100),
(24, 3, 4, 4, 'round', 'available', 400, 100),
(25, 3, 5, 6, 'rectangle', 'available', 100, 200),
(26, 3, 6, 6, 'rectangle', 'available', 250, 200),
(27, 3, 7, 6, 'rectangle', 'available', 400, 200),
(28, 3, 8, 8, 'large', 'occupied', 100, 300),
(29, 3, 9, 8, 'large', 'available', 250, 300),
(30, 3, 10, 8, 'large', 'available', 400, 300);

-- Cấu trúc bảng cho bảng `reservations`
CREATE TABLE `reservations` (
  `reservation_id` int NOT NULL AUTO_INCREMENT,
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
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`reservation_id`),
  KEY `fk_reservations_user` (`user_id`),
  KEY `fk_reservations_store` (`store_id`),
  KEY `fk_reservations_table` (`table_id`),
  CONSTRAINT `fk_reservations_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  CONSTRAINT `fk_reservations_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`table_id`),
  CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Đang đổ dữ liệu cho bảng `reservations`
INSERT INTO `reservations` (`reservation_id`, `user_id`, `store_id`, `table_id`, `full_name`, `email`, `phone`, `reservation_date`, `reservation_time`, `guests`, `occasion`, `notes`, `status`, `deposit_method`, `deposit_amount`, `deposit_status`, `created_at`) VALUES
(1, 1, 1, 3, 'Nguyễn Văn A', 'vana@example.com', '0912345678', '2025-05-15', '18:30:00', 4, 'Sinh nhật', 'Cần bánh sinh nhật', 'confirmed', 'momo', 100000.00, 'paid', '2025-05-10 10:30:00'),
(2, 2, 2, 13, 'Trần Thị B', 'thib@example.com', '0923456789', '2025-05-16', '19:00:00', 4, 'Kỷ niệm', 'Cần bàn yên tĩnh', 'confirmed', 'bank_transfer', 100000.00, 'paid', '2025-05-11 11:45:00'),
(3, 3, 3, 24, 'Lê Quang C', 'quangc@example.com', '0934567890', '2025-05-17', '12:30:00', 2, 'Gặp đối tác', 'Cần bàn gần cửa sổ', 'pending', 'credit_card', 100000.00, 'pending', '2025-05-12 09:15:00'),
(4, NULL, 1, 5, 'Phạm Thị D', 'thid@example.com', '0945678901', '2025-05-18', '18:00:00', 6, 'Họp gia đình', 'Có trẻ em', 'pending', 'momo', 100000.00, 'pending', '2025-05-12 14:20:00'),
(5, NULL, 2, 18, 'Võ Trần F', 'tranf@example.com', '0956789012', '2025-05-20', '20:00:00', 8, 'Tiệc công ty', 'Cần không gian riêng tư', 'confirmed', 'bank_transfer', 100000.00, 'paid', '2025-05-13 10:10:00');

-- Cấu trúc bảng cho bảng `reservation_status_history`
CREATE TABLE `reservation_status_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `old_status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL,
  `new_status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` int DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`history_id`),
  KEY `fk_reservation_history_reservation` (`reservation_id`),
  KEY `fk_reservation_history_user` (`changed_by`),
  CONSTRAINT `fk_reservation_history_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`reservation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservation_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Đang đổ dữ liệu cho bảng `reservation_status_history`
INSERT INTO `reservation_status_history` (`history_id`, `reservation_id`, `old_status`, `new_status`, `changed_at`, `changed_by`, `notes`) VALUES
(1, 1, 'pending', 'confirmed', '2025-05-10 11:30:00', 4, 'Đã xác nhận qua điện thoại'),
(2, 2, 'pending', 'confirmed', '2025-05-11 12:45:00', 4, 'Đã xác nhận qua email'),
(3, 5, 'pending', 'confirmed', '2025-05-13 11:10:00', 4, 'Đã xác nhận qua điện thoại');

-- Cấu trúc bảng cho bảng `reservation_payments`
CREATE TABLE `reservation_payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('momo','bank_transfer','credit_card','cash') NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `payment_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `fk_reservation_payments_reservation` (`reservation_id`),
  CONSTRAINT `fk_reservation_payments_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`reservation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Đang đổ dữ liệu cho bảng `reservation_payments`
INSERT INTO `reservation_payments` (`payment_id`, `reservation_id`, `amount`, `payment_method`, `transaction_id`, `status`, `payment_date`, `created_at`) VALUES
(1, 1, 100000.00, 'momo', 'MOMO123456789', 'completed', '2025-05-10 10:35:00', '2025-05-10 10:30:00'),
(2, 2, 100000.00, 'bank_transfer', 'BT987654321', 'completed', '2025-05-11 12:00:00', '2025-05-11 11:45:00'),
(3, 5, 100000.00, 'bank_transfer', 'BT123987456', 'completed', '2025-05-13 10:20:00', '2025-05-13 10:10:00');
