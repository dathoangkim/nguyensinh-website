const wishlistModel = require('../models/wishlistModel');

// @desc    Lấy danh sách yêu thích của người dùng
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const wishlist = await wishlistModel.getWishlistByUser(userId);
    
    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error('Error in getWishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách yêu thích',
      error: error.message
    });
  }
};

// @desc    Thêm sản phẩm vào danh sách yêu thích
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID sản phẩm'
      });
    }
    
    const result = await wishlistModel.addToWishlist(userId, product_id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể thêm sản phẩm vào danh sách yêu thích',
      error: error.message
    });
  }
};

// @desc    Xóa sản phẩm khỏi danh sách yêu thích
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const productId = req.params.productId;
    
    const result = await wishlistModel.removeFromWishlist(userId, productId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa sản phẩm khỏi danh sách yêu thích',
      error: error.message
    });
  }
};

// @desc    Kiểm tra xem sản phẩm có trong danh sách yêu thích không
// @route   GET /api/wishlist/check/:productId
// @access  Private
const checkWishlistItem = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const productId = req.params.productId;
    
    const isInWishlist = await wishlistModel.isProductInWishlist(userId, productId);
    
    res.status(200).json({
      success: true,
      data: {
        is_in_wishlist: isInWishlist
      }
    });
  } catch (error) {
    console.error('Error in checkWishlistItem:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra sản phẩm trong danh sách yêu thích',
      error: error.message
    });
  }
};

// @desc    Xóa tất cả sản phẩm khỏi danh sách yêu thích
// @route   DELETE /api/wishlist
// @access  Private
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const result = await wishlistModel.clearWishlist(userId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in clearWishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa danh sách yêu thích',
      error: error.message
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistItem,
  clearWishlist
};