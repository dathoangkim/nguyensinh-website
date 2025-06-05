const { pool } = require('../config/db');

// Lấy tất cả danh mục
const getAllCategories = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, 
      (SELECT COUNT(*) FROM products WHERE category_id = c.category_id) as product_count,
      p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.category_id
      ORDER BY c.name
    `);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy danh mục theo ID
const getCategoryById = async (categoryId) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, 
      (SELECT COUNT(*) FROM products WHERE category_id = c.category_id) as product_count,
      p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.category_id
      WHERE c.category_id = ?
    `, [categoryId]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Lấy danh mục theo slug
const getCategoryBySlug = async (slug) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, 
      (SELECT COUNT(*) FROM products WHERE category_id = c.category_id) as product_count,
      p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.category_id
      WHERE c.slug = ?
    `, [slug]);
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Tạo danh mục mới
const createCategory = async (categoryData) => {
  const { name, slug, parent_id } = categoryData;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)',
      [name, slug, parent_id || null]
    );
    
    return await getCategoryById(result.insertId);
  } catch (error) {
    throw error;
  }
};

// Cập nhật danh mục
const updateCategory = async (categoryId, categoryData) => {
  const { name, slug, parent_id } = categoryData;
  
  try {
    let query = 'UPDATE categories SET ';
    const values = [];
    
    if (name) {
      query += 'name = ?, ';
      values.push(name);
    }
    
    if (slug) {
      query += 'slug = ?, ';
      values.push(slug);
    }
    
    if (parent_id !== undefined) {
      query += 'parent_id = ?, ';
      values.push(parent_id === null ? null : parent_id);
    }
    
    // Xóa dấu phẩy cuối cùng và khoảng trắng
    query = query.slice(0, -2);
    
    query += ' WHERE category_id = ?';
    values.push(categoryId);
    
    await pool.query(query, values);
    
    return await getCategoryById(categoryId);
  } catch (error) {
    throw error;
  }
};

// Xóa danh mục
const deleteCategory = async (categoryId) => {
  try {
    // Kiểm tra xem danh mục có sản phẩm không
    const [productRows] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [categoryId]
    );
    
    if (productRows[0].count > 0) {
      throw new Error('Không thể xóa danh mục có sản phẩm');
    }
    
    // Kiểm tra xem danh mục có danh mục con không
    const [childRows] = await pool.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [categoryId]
    );
    
    if (childRows[0].count > 0) {
      throw new Error('Không thể xóa danh mục có danh mục con');
    }
    
    const [result] = await pool.query(
      'DELETE FROM categories WHERE category_id = ?',
      [categoryId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};