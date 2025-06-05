const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  getProductsByCategory, 
  searchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getProductOptions
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Các routes cho sản phẩm
router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.get('/search', searchProducts);
router.get('/category/:id', getProductsByCategory);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

// Route để lấy tùy chọn sản phẩm
router.get('/:id/options', getProductOptions);

module.exports = router;