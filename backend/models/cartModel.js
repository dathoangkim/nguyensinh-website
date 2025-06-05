const { pool } = require('../config/db');

// Lấy giỏ hàng của người dùng
const getCartByUserId = async (userId) => {
  try {
    // Kiểm tra xem người dùng đã có giỏ hàng chưa
    const [cartRows] = await pool.query(
      'SELECT * FROM carts WHERE user_id = ?',
      [userId]
    );
    
    let cartId;
    
    // Nếu chưa có giỏ hàng, tạo mới
    if (cartRows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO carts (user_id) VALUES (?)',
        [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = cartRows[0].cart_id;
    }
    
    // Lấy các sản phẩm trong giỏ hàng
    const [itemRows] = await pool.query(`
      SELECT ci.cart_item_id, ci.product_id, ci.quantity, ci.options, ci.options_text,
      p.name, p.price, p.stock_quantity,
      (SELECT img_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as product_image
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.product_id
      WHERE ci.cart_id = ?
    `, [cartId]);
    
    // Tính tổng tiền
    let totalAmount = 0;
    let itemCount = 0;
    
    for (const item of itemRows) {
      totalAmount += item.price * item.quantity;
      itemCount += item.quantity;
      
      // Thêm log để debug
      console.log(`Cart item ${item.cart_item_id}:`, {
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        options: item.options,
        options_text: item.options_text
      });
    }
    
    return {
      cart_id: cartId,
      user_id: userId,
      items: itemRows,
      total_amount: totalAmount,
      item_count: itemCount
    };
  } catch (error) {
    throw error;
  }
};

// Thêm sản phẩm vào giỏ hàng
const addItemToCart = async (userId, productId, quantity, options = null, optionsText = null) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Kiểm tra xem người dùng đã có giỏ hàng chưa
      const [cartRows] = await connection.query(
        'SELECT * FROM carts WHERE user_id = ?',
        [userId]
      );
      
      let cartId;
      
      // Nếu chưa có giỏ hàng, tạo mới
      if (cartRows.length === 0) {
        const [result] = await connection.query(
          'INSERT INTO carts (user_id) VALUES (?)',
          [userId]
        );
        cartId = result.insertId;
      } else {
        cartId = cartRows[0].cart_id;
      }
      
      // Tạo một unique key cho sản phẩm dựa trên options
      const uniqueKey = options ? `${productId}_${options}` : `${productId}`;
      console.log('Unique key for cart item:', uniqueKey);
      
      // Kiểm tra xem sản phẩm với options này đã có trong giỏ hàng chưa
      const [itemRows] = await connection.query(
        'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND (options = ? OR (options IS NULL AND ? IS NULL))',
        [cartId, productId, options, options]
      );
      
      console.log('Found existing cart items:', itemRows.length);
      
      // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
      if (itemRows.length > 0) {
        console.log('Updating existing cart item:', itemRows[0].cart_item_id);
        await connection.query(
          'UPDATE cart_items SET quantity = quantity + ?, options_text = COALESCE(?, options_text) WHERE cart_item_id = ?',
          [quantity, optionsText, itemRows[0].cart_item_id]
        );
      } else {
        // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
        console.log('Adding new cart item with options:', { options, optionsText });
        await connection.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity, options, options_text) VALUES (?, ?, ?, ?, ?)',
          [cartId, productId, quantity, options, optionsText]
        );
      }
      
      await connection.commit();
      
      return await getCartByUserId(userId);
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

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateCartItem = async (userId, cartItemId, quantity) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Kiểm tra xem cart item có thuộc về người dùng không
      const [itemRows] = await connection.query(`
        SELECT ci.* FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.cart_id
        WHERE ci.cart_item_id = ? AND c.user_id = ?
      `, [cartItemId, userId]);
      
      if (itemRows.length === 0) {
        throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
      }
      
      // Nếu số lượng là 0, xóa sản phẩm khỏi giỏ hàng
      if (quantity <= 0) {
        await connection.query(
          'DELETE FROM cart_items WHERE cart_item_id = ?',
          [cartItemId]
        );
      } else {
        // Cập nhật số lượng
        await connection.query(
          'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
          [quantity, cartItemId]
        );
      }
      
      await connection.commit();
      
      return await getCartByUserId(userId);
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

// Xóa sản phẩm khỏi giỏ hàng
const removeCartItem = async (userId, cartItemId) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Kiểm tra xem cart item có thuộc về người dùng không
      const [itemRows] = await connection.query(`
        SELECT ci.* FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.cart_id
        WHERE ci.cart_item_id = ? AND c.user_id = ?
      `, [cartItemId, userId]);
      
      if (itemRows.length === 0) {
        throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
      }
      
      // Xóa sản phẩm khỏi giỏ hàng
      await connection.query(
        'DELETE FROM cart_items WHERE cart_item_id = ?',
        [cartItemId]
      );
      
      await connection.commit();
      
      return await getCartByUserId(userId);
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

// Xóa tất cả sản phẩm trong giỏ hàng
const clearCart = async (userId) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Lấy cart_id của người dùng
      const [cartRows] = await connection.query(
        'SELECT * FROM carts WHERE user_id = ?',
        [userId]
      );
      
      if (cartRows.length === 0) {
        return {
          cart_id: null,
          user_id: userId,
          items: [],
          total_amount: 0,
          item_count: 0
        };
      }
      
      const cartId = cartRows[0].cart_id;
      
      // Xóa tất cả sản phẩm trong giỏ hàng
      await connection.query(
        'DELETE FROM cart_items WHERE cart_id = ?',
        [cartId]
      );
      
      await connection.commit();
      
      return {
        cart_id: cartId,
        user_id: userId,
        items: [],
        total_amount: 0,
        item_count: 0
      };
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

// Đồng bộ giỏ hàng từ local lên server
const syncCartFromLocal = async (userId, localCartItems) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Kiểm tra xem người dùng đã có giỏ hàng chưa
      const [cartRows] = await connection.query(
        'SELECT * FROM carts WHERE user_id = ?',
        [userId]
      );
      
      let cartId;
      
      // Nếu chưa có giỏ hàng, tạo mới
      if (cartRows.length === 0) {
        const [result] = await connection.query(
          'INSERT INTO carts (user_id) VALUES (?)',
          [userId]
        );
        cartId = result.insertId;
      } else {
        cartId = cartRows[0].cart_id;
      }
      
      // Thêm từng sản phẩm từ giỏ hàng local vào giỏ hàng server
      for (const item of localCartItems) {
        const productId = item.productId || item.product_id;
        const quantity = item.quantity || 1;
        const options = item.options ? (typeof item.options === 'string' ? item.options : JSON.stringify(item.options)) : null;
        const optionsText = item.optionsText || item.options_text || null;
        
        // Kiểm tra xem sản phẩm với options này đã có trong giỏ hàng chưa
        const [itemRows] = await connection.query(
          'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND (options = ? OR (options IS NULL AND ? IS NULL))',
          [cartId, productId, options, options]
        );
        
        // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
        if (itemRows.length > 0) {
          await connection.query(
            'UPDATE cart_items SET quantity = quantity + ?, options_text = COALESCE(?, options_text) WHERE cart_item_id = ?',
            [quantity, optionsText, itemRows[0].cart_item_id]
          );
        } else {
          // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
          await connection.query(
            'INSERT INTO cart_items (cart_id, product_id, quantity, options, options_text) VALUES (?, ?, ?, ?, ?)',
            [cartId, productId, quantity, options, optionsText]
          );
        }
      }
      
      await connection.commit();
      
      return await getCartByUserId(userId);
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

module.exports = {
  getCartByUserId,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCartFromLocal
};
