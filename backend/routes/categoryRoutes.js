const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  getCategoryById, 
  getCategoryBySlug, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

// Các routes cho danh mục
router.route('/')
  .get(getCategories)
  .post(protect, admin, createCategory);

router.get('/slug/:slug', getCategoryBySlug);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, admin, updateCategory)
  .delete(protect, admin, deleteCategory);

module.exports = router;