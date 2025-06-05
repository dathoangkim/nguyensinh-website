const { pool } = require('../config/db');

// Lấy tất cả sản phẩm
const getAllProducts = async (status = null, limit = null) => {
  try {
    let query = `
      SELECT p.*, c.name as category_name, 
      (SELECT img_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
    `;
    
    const queryParams = [];
    
    // Nếu có status, thêm điều kiện lọc
    if (status) {
      query += ` WHERE p.status = ?`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    // Nếu có limit, thêm giới hạn số lượng kết quả
    if (limit) {
      query += ` LIMIT ?`;
      queryParams.push(parseInt(limit));
    }
    
    const [rows] = await pool.query(query, queryParams);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (productId) => {
  try {
    // Lấy thông tin sản phẩm
    const [productRows] = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [productId]);
    
    if (productRows.length === 0) {
      return null;
    }
    
    const product = productRows[0];
    
    // Lấy hình ảnh sản phẩm
    const [imageRows] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [productId]
    );
    
    // Lấy đánh giá sản phẩm
    const [reviewRows] = await pool.query(`
      SELECT r.*, u.username, u.full_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);
    
    // Lấy tùy chọn sản phẩm từ bảng product_options và options
    const [optionRows] = await pool.query(`
      SELECT po.product_option_id, po.product_id, po.option_id, o.name, o.description
      FROM product_options po
      JOIN options o ON po.option_id = o.option_id
      WHERE po.product_id = ?
    `, [productId]);
    
    const options = [];
    
    for (const option of optionRows) {
      // Lấy giá trị cho từng tùy chọn từ bảng option_values
      const [valueRows] = await pool.query(`
        SELECT value_id, option_id, value, additional_price
        FROM option_values
        WHERE option_id = ?
        ORDER BY additional_price ASC
      `, [option.option_id]);
      
      options.push({
        ...option,
        values: valueRows || []
      });
    }
    return {
      ...product,
      images: imageRows,
      reviews: reviewRows,
      options: options
    };
  } catch (error) {
    throw error;
  }
};

// Lấy sản phẩm theo danh mục
const getProductsByCategory = async (categoryId) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name, 
      (SELECT img_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as main_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.category_id = ?
      ORDER BY p.created_at DESC
    `, [categoryId]);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Tìm kiếm sản phẩm
const searchProducts = async (keyword) => {
  try {
    const searchTerm = `%${keyword}%`;
    const [rows] = await pool.query(`
      SELECT p.*, c.name as category_name, 
      (SELECT img_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as main_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.name LIKE ? OR p.description LIKE ?
      ORDER BY p.created_at DESC
    `, [searchTerm, searchTerm]);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Tạo sản phẩm mới
const createProduct = async (productData) => {
  const { name, slug, description, price, cost_price, category_id, stock_quantity, is_active, status } = productData;
  
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Thêm sản phẩm
      const [result] = await connection.query(
        'INSERT INTO products (name, slug, description, price, cost_price, category_id, stock_quantity, is_active, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, slug, description, price, cost_price, category_id, stock_quantity, is_active !== undefined ? is_active : true, status || 'normal']
      );
      
      const productId = result.insertId;
      
      // Thêm hình ảnh nếu có
      if (productData.images && productData.images.length > 0) {
        const imageValues = productData.images.map((image, index) => [
          productId,
          image.img_url,
          image.alt_text || name,
          index
        ]);
        
        await connection.query(
          'INSERT INTO product_images (product_id, img_url, alt_text, sort_order) VALUES ?',
          [imageValues]
        );
      }
      
      // Thêm tùy chọn nếu có
      if (productData.options && productData.options.length > 0) {
        for (const option of productData.options) {
          const [optionResult] = await connection.query(
            'INSERT INTO product_options (product_id, name) VALUES (?, ?)',
            [productId, option.name]
          );
          
          const optionId = optionResult.insertId;
          
          if (option.values && option.values.length > 0) {
            const optionValueValues = option.values.map(value => [
              optionId,
              value.value,
              value.additional_price || 0
            ]);
            
            await connection.query(
              'INSERT INTO option_values (option_id, value, additional_price) VALUES ?',
              [optionValueValues]
            );
          }
        }
      }
      
      await connection.commit();
      
      return await getProductById(productId);
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

// Cập nhật sản phẩm
const updateProduct = async (productId, productData) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Cập nhật thông tin sản phẩm
      if (Object.keys(productData).some(key => ['name', 'slug', 'description', 'price', 'cost_price', 'category_id', 'stock_quantity', 'is_active', 'status'].includes(key))) {
        let query = 'UPDATE products SET ';
        const values = [];
        
        if (productData.name) {
          query += 'name = ?, ';
          values.push(productData.name);
        }
        
        if (productData.slug) {
          query += 'slug = ?, ';
          values.push(productData.slug);
        }
        
        if (productData.description !== undefined) {
          query += 'description = ?, ';
          values.push(productData.description);
        }
        
        if (productData.price) {
          query += 'price = ?, ';
          values.push(productData.price);
        }
        
        if (productData.cost_price) {
          query += 'cost_price = ?, ';
          values.push(productData.cost_price);
        }
        
        if (productData.category_id) {
          query += 'category_id = ?, ';
          values.push(productData.category_id);
        }
        
        if (productData.stock_quantity !== undefined) {
          query += 'stock_quantity = ?, ';
          values.push(productData.stock_quantity);
        }
        
        if (productData.is_active !== undefined) {
          query += 'is_active = ?, ';
          values.push(productData.is_active);
        }
        
        if (productData.status) {
          query += 'status = ?, ';
          values.push(productData.status);
        }
        
        // Xóa dấu phẩy cuối cùng và khoảng trắng
        query = query.slice(0, -2);
        
        query += ' WHERE product_id = ?';
        values.push(productId);
        
        await connection.query(query, values);
      }
      
      // Cập nhật hình ảnh nếu có
      if (productData.images) {
        // Xóa hình ảnh cũ
        await connection.query(
          'DELETE FROM product_images WHERE product_id = ?',
          [productId]
        );
        
        // Thêm hình ảnh mới
        if (productData.images.length > 0) {
          const imageValues = productData.images.map((image, index) => [
            productId,
            image.img_url,
            image.alt_text || '',
            index
          ]);
          
          await connection.query(
            'INSERT INTO product_images (product_id, img_url, alt_text, sort_order) VALUES ?',
            [imageValues]
          );
        }
      }
      
      await connection.commit();
      
      return await getProductById(productId);
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

// Xóa sản phẩm
const deleteProduct = async (productId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM products WHERE product_id = ?',
      [productId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct
};