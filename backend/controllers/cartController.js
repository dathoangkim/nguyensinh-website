const cartModel = require('../models/cartModel');

// @desc    Lấy giỏ hàng của người dùng hiện tại
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const cart = await cartModel.getCartByUserId(req.user.user_id);
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity, options, options_text } = req.body;
    
    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp product_id và quantity hợp lệ'
      });
    }
    
    console.log('Thêm sản phẩm vào giỏ hàng:', { product_id, quantity, options, options_text });
    
    // Chuyển đổi options thành chuỗi JSON nếu là object
    let optionsJson = null;
    if (options) {
      optionsJson = typeof options === 'string' ? options : JSON.stringify(options);
    }
    
    const cart = await cartModel.addItemToCart(
      req.user.user_id, 
      product_id, 
      quantity, 
      optionsJson, 
      options_text
    );
    
    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm vào giỏ hàng thành công',
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
// @route   PUT /api/cart/update/:id
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItemId = req.params.id;
    
    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp quantity'
      });
    }
    
    try {
      const cart = await cartModel.updateCartItem(req.user.user_id, cartItemId, quantity);
      
      res.json({
        success: true,
        message: 'Cập nhật giỏ hàng thành công',
        data: cart
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Xóa sản phẩm khỏi giỏ hàng
// @route   DELETE /api/cart/remove/:id
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const cartItemId = req.params.id;
    
    try {
      const cart = await cartModel.removeCartItem(req.user.user_id, cartItemId);
      
      res.json({
        success: true,
        message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
        data: cart
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Xóa tất cả sản phẩm trong giỏ hàng
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await cartModel.clearCart(req.user.user_id);
    
    res.json({
      success: true,
      message: 'Xóa giỏ hàng thành công',
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// @desc    Đồng bộ giỏ hàng từ local lên server
// @route   POST /api/cart/sync
// @access  Private
const syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách sản phẩm hợp lệ'
      });
    }
    
    console.log('Đồng bộ giỏ hàng từ local lên server:', items.length, 'sản phẩm');
    
    const cart = await cartModel.syncCartFromLocal(req.user.user_id, items);
    
    res.status(200).json({
      success: true,
      message: 'Đồng bộ giỏ hàng thành công',
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart
};
