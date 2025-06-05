-- SQL Script: Cơ sở dữ liệu cho trang web bán bánh mì
-- Tên CSDL: banh_mi_db (bạn có thể thay đổi theo ý muốn)

CREATE DATABASE IF NOT EXISTS `banh_mi_db`
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
USE `banh_mi_db`;

-- Xóa các bảng (thứ tự: bảng con trước bảng cha)
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `post_comments`;
DROP TABLE IF EXISTS `blog_posts`;
DROP TABLE IF EXISTS `blog_categories`;
DROP TABLE IF EXISTS `loyalty_points`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `addresses`;
DROP TABLE IF EXISTS `stores`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `users`;

-- Xóa các bảng bổ sung
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `shipping_rates`;
DROP TABLE IF EXISTS `shipping_zones`;
DROP TABLE IF EXISTS `wishlist_items`;
DROP TABLE IF EXISTS `wishlists`;
DROP TABLE IF EXISTS `email_subscriptions`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `option_values`;
DROP TABLE IF EXISTS `product_options`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `carts`;

-- 1. Bảng Người dùng
CREATE TABLE `users` (
  `user_id`      INT AUTO_INCREMENT PRIMARY KEY,
  `username`     VARCHAR(50) NOT NULL,
  `email`        VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name`    VARCHAR(100) NOT NULL,
  `phone`        VARCHAR(20),
  `role`         ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 2. Bảng Cửa hàng (nhánh/chi nhánh)
CREATE TABLE `stores` (
  `store_id`     INT AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL,
  `address`      VARCHAR(255) NOT NULL,
  `city`         VARCHAR(100),
  `district`     VARCHAR(100),
  `phone`        VARCHAR(20),
  `opening_hours` VARCHAR(100),
  `lat`          DECIMAL(10,7),
  `lng`          DECIMAL(10,7),
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 3. Bảng Danh mục sản phẩm
CREATE TABLE `categories` (
  `category_id`  INT AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL,
  `slug`         VARCHAR(100) NOT NULL UNIQUE,
  `parent_id`    INT DEFAULT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_categories_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 4. Bảng Phiếu giảm giá
CREATE TABLE `coupons` (
  `coupon_id`       INT AUTO_INCREMENT PRIMARY KEY,
  `code`            VARCHAR(50) NOT NULL UNIQUE,
  `description`     VARCHAR(255),
  `discount_type`   ENUM('percent','fixed') NOT NULL,
  `discount_value`  DECIMAL(10,2) NOT NULL,
  `min_order_amount` DECIMAL(10,2) DEFAULT 0,
  `usage_limit`     INT DEFAULT NULL,
  `used_count`      INT NOT NULL DEFAULT 0,
  `valid_from`      DATE,
  `valid_to`        DATE,
  `is_active`       BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 5. Bảng Địa chỉ giao hàng
CREATE TABLE `addresses` (
  `address_id`  INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT NOT NULL,
  `label`       VARCHAR(50),
  `street`      VARCHAR(255),
  `city`        VARCHAR(100),
  `district`    VARCHAR(100),
  `postal_code` VARCHAR(20),
  `lat`         DECIMAL(10,7),
  `lng`         DECIMAL(10,7),
  `is_default`  BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_addresses_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 6. Bảng Sản phẩm
CREATE TABLE `products` (
  `product_id`     INT AUTO_INCREMENT PRIMARY KEY,
  `name`           VARCHAR(150) NOT NULL,
  `slug`           VARCHAR(150) NOT NULL UNIQUE,
  `description`    TEXT,
  `price`          DECIMAL(10,2) NOT NULL,
  `cost_price`     DECIMAL(10,2),
  `category_id`    INT NOT NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `is_active`      BOOLEAN NOT NULL DEFAULT TRUE,
  `status`         ENUM('normal', 'featured') DEFAULT 'normal',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 7. Bảng Ảnh sản phẩm
CREATE TABLE `product_images` (
  `image_id`    INT AUTO_INCREMENT PRIMARY KEY,
  `product_id`  INT NOT NULL,
  `img_url`     VARCHAR(255) NOT NULL,
  `alt_text`    VARCHAR(150),
  `sort_order`  INT NOT NULL DEFAULT 0,
  CONSTRAINT `fk_images_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 8. Bảng Đơn hàng
CREATE TABLE `orders` (
  `order_id`       INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`        INT NOT NULL,
  `address_id`     INT NOT NULL,
  `status`         ENUM('pending','confirmed','preparing','delivering','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('cod','online','zalopay') NOT NULL,
  `total_amount`   DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) DEFAULT 0,
  `shipping_fee`   DECIMAL(10,2) DEFAULT 0,
  `coupon_id`      INT DEFAULT NULL,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_orders_address`
    FOREIGN KEY (`address_id`) REFERENCES `addresses` (`address_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_orders_coupon`
    FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`coupon_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 9. Bảng Chi tiết đơn hàng
CREATE TABLE `order_items` (
  `order_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id`      INT NOT NULL,
  `product_id`    INT NOT NULL,
  `quantity`      INT NOT NULL,
  `unit_price`    DECIMAL(10,2) NOT NULL,
  `subtotal`      DECIMAL(10,2) NOT NULL,
  CONSTRAINT `fk_items_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_items_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 10. Bảng Thanh toán
CREATE TABLE `payments` (
  `payment_id`              INT AUTO_INCREMENT PRIMARY KEY,
  `order_id`                INT NOT NULL,
  `provider`                VARCHAR(50) NOT NULL,
  `provider_transaction_id` VARCHAR(100),
  `amount`                  DECIMAL(10,2) NOT NULL,
  `status`                  ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  `paid_at`                 DATETIME,
  CONSTRAINT `fk_payments_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 11. Bảng Đánh giá sản phẩm
CREATE TABLE `reviews` (
  `review_id`  INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `product_id` INT NOT NULL,
  `rating`     TINYINT UNSIGNED NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment`    TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reviews_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_reviews_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 12. Bảng Điểm thưởng
CREATE TABLE `loyalty_points` (
  `points_id`  INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `order_id`   INT DEFAULT NULL,
  `change`     INT NOT NULL,
  `reason`     VARCHAR(100),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_points_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_points_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 13. Bảng Chuyên mục Blog
CREATE TABLE `blog_categories` (
  `category_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(100) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL UNIQUE,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 14. Bảng Blog Posts (liên kết URL và ảnh URL)
CREATE TABLE `blog_posts` (
  `post_id`      INT AUTO_INCREMENT PRIMARY KEY,
  `title`        VARCHAR(255) NOT NULL,
  `slug`         VARCHAR(255) NOT NULL UNIQUE,
  `post_url`     VARCHAR(255) NOT NULL,
  `img_url`      VARCHAR(255) DEFAULT NULL,
  `content`      LONGTEXT,
  `author_id`    INT NOT NULL,
  `category_id`  INT NOT NULL,
  `published_at` DATETIME,
  `is_published` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_blog_posts_author`
    FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_blog_posts_category`
    FOREIGN KEY (`category_id`) REFERENCES `blog_categories` (`category_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 15. Bảng Bình luận Blog
CREATE TABLE `post_comments` (
  `comment_id`  INT AUTO_INCREMENT PRIMARY KEY,
  `post_id`     INT NOT NULL,
  `user_id`     INT DEFAULT NULL,
  `guest_name`  VARCHAR(100),
  `content`     TEXT NOT NULL,
  `parent_id`   INT DEFAULT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_comments_post`
    FOREIGN KEY (`post_id`) REFERENCES `blog_posts` (`post_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_comments_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `post_comments` (`comment_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 16. Bảng Tin nhắn / Yêu cầu liên hệ
CREATE TABLE `messages` (
  `message_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT DEFAULT NULL,
  `channel`    ENUM('contact_form','messenger','zalo') NOT NULL,
  `subject`    VARCHAR(150),
  `content`    TEXT NOT NULL,
  `status`     ENUM('new','replied','closed') NOT NULL DEFAULT 'new',
  `received_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_messages_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 17. Bảng Giỏ hàng (Shopping Cart)
CREATE TABLE `carts` (
  `cart_id`      INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`      INT NOT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_carts_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

CREATE TABLE `cart_items` (
  `cart_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `cart_id`      INT NOT NULL,
  `product_id`   INT NOT NULL,
  `quantity`     INT NOT NULL,
  `added_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cart_items_cart`
    FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 18. Bảng Sản phẩm biến thể (Variants / Options)
CREATE TABLE `product_options` (
  `option_id`    INT AUTO_INCREMENT PRIMARY KEY,
  `product_id`   INT NOT NULL,
  `name`         VARCHAR(100) NOT NULL,
  CONSTRAINT `fk_product_options_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

CREATE TABLE `option_values` (
  `value_id`        INT AUTO_INCREMENT PRIMARY KEY,
  `option_id`       INT NOT NULL,
  `value`           VARCHAR(100) NOT NULL,
  `additional_price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT `fk_option_values_option`
    FOREIGN KEY (`option_id`) REFERENCES `product_options` (`option_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 19. Bảng Lịch sử trạng thái đơn hàng (Order Status History)
CREATE TABLE `order_status_history` (
  `history_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id`   INT NOT NULL,
  `old_status` ENUM('pending','confirmed','preparing','delivering','completed','cancelled') NOT NULL,
  `new_status` ENUM('pending','confirmed','preparing','delivering','completed','cancelled') NOT NULL,
  `changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` INT DEFAULT NULL,
  CONSTRAINT `fk_osh_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_osh_user`
    FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL
) ENGINE=InnoDB CHARSET=utf8mb4;

-- 20. Bảng Phiên người dùng và bảo mật
CREATE TABLE `sessions` (
  `session_id` VARCHAR(128) PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  CONSTRAINT `fk_sessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

CREATE TABLE password_resets (
  reset_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  reset_token VARCHAR(255) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME NOT NULL,
  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;