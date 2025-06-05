const { pool } = require('../config/db');

// Lấy danh sách yêu thích của người dùng
const getWishlistByUser = async (userId) => {
  try {
    // Kiểm tra xem người dùng đã có danh sách yêu thích chưa
    const [wishlists] = await pool.query(
      'SELECT * FROM wishlists WHERE user_id = ?',
      [userId]
    );
    
    // Nếu chưa có, tạo mới
    if (wishlists.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO wishlists (user_id) VALUES (?)',
        [userId]
      );
      
      return {
        wishlist_id: result.insertId,
        user_id: userId,
        items: []
      };
    }
    
    // Lấy các sản phẩm trong danh sách yêu thích
    const [items] = await pool.query(`
      SELECT wi.*, p.name, p.price, p.slug,
        (SELECT img_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as image
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.product_id
      WHERE wi.wishlist_id = ?
      ORDER BY wi.added_at DESC
    `, [wishlists[0].wishlist_id]);
    
    return {
      wishlist_id: wishlists[0].wishlist_id,
      user_id: userId,
      items
    };
  } catch (error) {
    throw error;
  }
};

// Thêm sản phẩm vào danh sách yêu thích
const addToWishlist = async (userId, productId) => {
  try {
    // Lấy hoặc tạo danh sách yêu thích
    let wishlistId;
    
    const [wishlists] = await pool.query(
      'SELECT * FROM wishlists WHERE user_id = ?',
      [userId]
    );
    
    if (wishlists.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO wishlists (user_id) VALUES (?)',
        [userId]
      );
      wishlistId = result.insertId;
    } else {
      wishlistId = wishlists[0].wishlist_id;
    }
    
    // Kiểm tra xem sản phẩm đã có trong danh sách yêu thích chưa
    const [existingItems] = await pool.query(
      'SELECT * FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?',
      [wishlistId, productId]
    );
    
    if (existingItems.length > 0) {
      return {
        success: false,
        message: 'Sản phẩm đã có trong danh sách yêu thích'
      };
    }
    
    // Thêm sản phẩm vào danh sách yêu thích
    await pool.query(
      'INSERT INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)',
      [wishlistId, productId]
    );
    
    return {
      success: true,
      message: 'Đã thêm sản phẩm vào danh sách yêu thích'
    };
  } catch (error) {
    throw error;
  }
};

// Xóa sản phẩm khỏi danh sách yêu thích
const removeFromWishlist = async (userId, productId) => {
  try {
    // Lấy danh sách yêu thích
    const [wishlists] = await pool.query(
      'SELECT * FROM wishlists WHERE user_id = ?',
      [userId]
    );
    
    if (wishlists.length === 0) {
      return {
        success: false,
        message: 'Không tìm thấy danh sách yêu thích'
      };
    }
    
    const wishlistId = wishlists[0].wishlist_id;
    
    // Xóa sản phẩm khỏi danh sách yêu thích
    const [result] = await pool.query(
      'DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?',
      [wishlistId, productId]
    );
    
    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Sản phẩm không có trong danh sách yêu thích'
      };
    }
    
    return {
      success: true,
      message: 'Đã xóa sản phẩm khỏi danh sách yêu thích'
    };
  } catch (error) {
    throw error;
  }
};

// Kiểm tra xem sản phẩm có trong danh sách yêu thích không
const isProductInWishlist = async (userId, productId) => {
  try {
    // Lấy danh sách yêu thích
    const [wishlists] = await pool.query(
      'SELECT * FROM wishlists WHERE user_id = ?',
      [userId]
    );
    
    if (wishlists.length === 0) {
      return false;
    }
    
    const wishlistId = wishlists[0].wishlist_id;
    
    // Kiểm tra sản phẩm
    const [items] = await pool.query(
      'SELECT * FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?',
      [wishlistId, productId]
    );
    
    return items.length > 0;
  } catch (error) {
    throw error;
  }
};

// Xóa tất cả sản phẩm khỏi danh sách yêu thích
const clearWishlist = async (userId) => {
  try {
    // Lấy danh sách yêu thích
    const [wishlists] = await pool.query(
      'SELECT * FROM wishlists WHERE user_id = ?',
      [userId]
    );
    
    if (wishlists.length === 0) {
      return {
        success: false,
        message: 'Không tìm thấy danh sách yêu thích'
      };
    }
    
    const wishlistId = wishlists[0].wishlist_id;
    
    // Xóa tất cả sản phẩm
    await pool.query(
      'DELETE FROM wishlist_items WHERE wishlist_id = ?',
      [wishlistId]
    );
    
    return {
      success: true,
      message: 'Đã xóa tất cả sản phẩm khỏi danh sách yêu thích'
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getWishlistByUser,
  addToWishlist,
  removeFromWishlist,
  isProductInWishlist,
  clearWishlist
};