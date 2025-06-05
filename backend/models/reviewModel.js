const { pool } = require('../config/db');

// Lấy tất cả đánh giá
const getAllReviews = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.username, u.full_name, p.name as product_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      ORDER BY r.created_at DESC
    `);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy đánh giá theo ID
const getReviewById = async (reviewId) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.username, u.full_name, p.name as product_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE r.review_id = ?
    `, [reviewId]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Lấy đánh giá theo sản phẩm
const getReviewsByProduct = async (productId) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.username, u.full_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy đánh giá theo người dùng
const getReviewsByUser = async (userId) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, p.name as product_name, 
      (SELECT img_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as product_image
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.product_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

// Tạo đánh giá mới
const createReview = async (reviewData) => {
  const { user_id, product_id, rating, comment } = reviewData;
  
  try {
    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const [existingReviews] = await pool.query(
      'SELECT * FROM reviews WHERE user_id = ? AND product_id = ?',
      [user_id, product_id]
    );
    
    if (existingReviews.length > 0) {
      throw new Error('Bạn đã đánh giá sản phẩm này rồi');
    }
    
    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [user_id, product_id, rating, comment]
    );
    
    return await getReviewById(result.insertId);
  } catch (error) {
    throw error;
  }
};

// Cập nhật đánh giá
const updateReview = async (reviewId, reviewData) => {
  try {
    let query = 'UPDATE reviews SET ';
    const values = [];
    
    if (reviewData.rating) {
      query += 'rating = ?, ';
      values.push(reviewData.rating);
    }
    
    if (reviewData.comment !== undefined) {
      query += 'comment = ?, ';
      values.push(reviewData.comment);
    }
    
    // Xóa dấu phẩy cuối cùng và khoảng trắng
    query = query.slice(0, -2);
    
    query += ' WHERE review_id = ?';
    values.push(reviewId);
    
    const [result] = await pool.query(query, values);
    
    return result.affectedRows > 0 ? await getReviewById(reviewId) : null;
  } catch (error) {
    throw error;
  }
};

// Xóa đánh giá
const deleteReview = async (reviewId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM reviews WHERE review_id = ?',
      [reviewId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Lấy thống kê đánh giá cho sản phẩm
const getProductReviewStats = async (productId) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
      WHERE product_id = ?
    `, [productId]);
    
    return rows[0];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  getReviewsByProduct,
  getReviewsByUser,
  createReview,
  updateReview,
  deleteReview,
  getProductReviewStats
};