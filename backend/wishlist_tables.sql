-- Tạo bảng danh sách yêu thích
CREATE TABLE IF NOT EXISTS `wishlists` (
  `wishlist_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_wishlists_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- Tạo bảng các sản phẩm trong danh sách yêu thích
CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `wishlist_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `wishlist_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_wishlist_items_wishlist`
    FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`wishlist_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_items_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `uq_wishlist_product` UNIQUE (`wishlist_id`, `product_id`)
) ENGINE=InnoDB CHARSET=utf8mb4;