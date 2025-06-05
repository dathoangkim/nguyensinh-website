const { pool } = require('../config/db');

// Lấy tất cả bài viết blog
const getAllPosts = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.username as author_name, c.name as category_name
      FROM blog_posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN blog_categories c ON p.category_id = c.category_id
      WHERE p.is_published = true
      ORDER BY p.published_at DESC
    `);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy bài viết blog theo ID
const getPostById = async (postId) => {
  try {
    // Lấy thông tin bài viết
    const [postRows] = await pool.query(`
      SELECT p.*, u.username as author_name, u.full_name as author_full_name, c.name as category_name
      FROM blog_posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN blog_categories c ON p.category_id = c.category_id
      WHERE p.post_id = ?
    `, [postId]);
    
    if (postRows.length === 0) {
      return null;
    }
    
    const post = postRows[0];
    
    // Lấy bình luận cho bài viết
    const [commentRows] = await pool.query(`
      SELECT c.*, u.username, u.full_name
      FROM post_comments c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = ? AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
    `, [postId]);
    
    // Lấy các bình luận phản hồi
    const comments = [];
    for (const comment of commentRows) {
      const [replyRows] = await pool.query(`
        SELECT c.*, u.username, u.full_name
        FROM post_comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.parent_id = ?
        ORDER BY c.created_at ASC
      `, [comment.comment_id]);
      
      comments.push({
        ...comment,
        replies: replyRows
      });
    }
    
    return {
      ...post,
      comments: comments
    };
  } catch (error) {
    throw error;
  }
};

// Lấy bài viết blog theo danh mục
const getPostsByCategory = async (categoryId) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.username as author_name, c.name as category_name
      FROM blog_posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN blog_categories c ON p.category_id = c.category_id
      WHERE p.category_id = ? AND p.is_published = true
      ORDER BY p.published_at DESC
    `, [categoryId]);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Tìm kiếm bài viết blog
const searchPosts = async (keyword) => {
  try {
    const searchTerm = `%${keyword}%`;
    const [rows] = await pool.query(`
      SELECT p.*, u.username as author_name, c.name as category_name
      FROM blog_posts p
      LEFT JOIN users u ON p.author_id = u.user_id
      LEFT JOIN blog_categories c ON p.category_id = c.category_id
      WHERE (p.title LIKE ? OR p.content LIKE ?) AND p.is_published = true
      ORDER BY p.published_at DESC
    `, [searchTerm, searchTerm]);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Tạo bài viết blog mới
const createPost = async (postData) => {
  const { title, slug, post_url, img_url, content, author_id, category_id, is_published } = postData;
  
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const published_at = is_published ? new Date() : null;
      
      const [result] = await connection.query(
        'INSERT INTO blog_posts (title, slug, post_url, img_url, content, author_id, category_id, published_at, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, slug, post_url, img_url, content, author_id, category_id, published_at, is_published]
      );
      
      const postId = result.insertId;
      
      await connection.commit();
      
      return await getPostById(postId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    throw error;
  }
};

// Cập nhật bài viết blog
const updatePost = async (postId, postData) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Kiểm tra nếu bài viết tồn tại
      const [existingPost] = await connection.query(
        'SELECT * FROM blog_posts WHERE post_id = ?',
        [postId]
      );
      
      if (existingPost.length === 0) {
        throw new Error('Bài viết không tồn tại');
      }
      
      // Cập nhật thông tin bài viết
      let query = 'UPDATE blog_posts SET ';
      const values = [];
      
      if (postData.title) {
        query += 'title = ?, ';
        values.push(postData.title);
      }
      
      if (postData.slug) {
        query += 'slug = ?, ';
        values.push(postData.slug);
      }
      
      if (postData.post_url) {
        query += 'post_url = ?, ';
        values.push(postData.post_url);
      }
      
      if (postData.img_url !== undefined) {
        query += 'img_url = ?, ';
        values.push(postData.img_url);
      }
      
      if (postData.content !== undefined) {
        query += 'content = ?, ';
        values.push(postData.content);
      }
      
      if (postData.category_id) {
        query += 'category_id = ?, ';
        values.push(postData.category_id);
      }
      
      if (postData.is_published !== undefined) {
        query += 'is_published = ?, ';
        values.push(postData.is_published);
        
        // Nếu đang publish bài viết, cập nhật published_at
        if (postData.is_published && !existingPost[0].is_published) {
          query += 'published_at = ?, ';
          values.push(new Date());
        }
      }
      
      // Xóa dấu phẩy cuối cùng và khoảng trắng
      query = query.slice(0, -2);
      
      query += ' WHERE post_id = ?';
      values.push(postId);
      
      await connection.query(query, values);
      
      await connection.commit();
      
      return await getPostById(postId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    throw error;
  }
};

// Xóa bài viết blog
const deletePost = async (postId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM blog_posts WHERE post_id = ?',
      [postId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Lấy tất cả danh mục blog
// Lấy tất cả danh mục blog
// Lấy tất cả danh mục blog
// Lấy tất cả danh mục blog
const getAllCategories = async () => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM blog_categories ORDER BY category_id'
    );
    return rows;
  } catch (error) {
    console.error('Error in getAllCategories model:', error);
    throw error;
  }
};



// Tạo danh mục blog mới
const createCategory = async (categoryData) => {
  const { name, slug } = categoryData;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO blog_categories (name, slug) VALUES (?, ?)',
      [name, slug]
    );
    
    const [newCategory] = await pool.query(
      'SELECT * FROM blog_categories WHERE category_id = ?',
      [result.insertId]
    );
    
    return newCategory[0];
  } catch (error) {
    throw error;
  }
};

// Thêm bình luận cho bài viết
const addComment = async (commentData) => {
  const { post_id, user_id, guest_name, content, parent_id } = commentData;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO post_comments (post_id, user_id, guest_name, content, parent_id) VALUES (?, ?, ?, ?, ?)',
      [post_id, user_id, guest_name, content, parent_id]
    );
    
    const [newComment] = await pool.query(`
      SELECT c.*, u.username, u.full_name
      FROM post_comments c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.comment_id = ?
    `, [result.insertId]);
    
    return newComment[0];
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  getPostsByCategory,
  searchPosts,
  createPost,
  updatePost,
  deletePost,
  getAllCategories,
  createCategory,
  addComment
};