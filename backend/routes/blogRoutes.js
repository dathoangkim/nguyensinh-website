const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect, admin } = require('../middleware/authMiddleware');

// Lấy tất cả bài viết blog
router.get('/', blogController.getAllPosts);

// Lấy tất cả danh mục blog
// Lấy tất cả danh mục blog
router.get('/categories/all', blogController.getAllCategories);


// Lấy bài viết blog theo danh mục
router.get('/category/:categoryId', blogController.getPostsByCategory);

// Tìm kiếm bài viết blog
router.get('/search/:keyword', blogController.searchPosts);

// Lấy bài viết blog theo ID
router.get('/:id', blogController.getPostById);

// Tạo bài viết blog mới (yêu cầu đăng nhập và quyền admin)
router.post('/', protect, admin, blogController.createPost);

// Cập nhật bài viết blog (yêu cầu đăng nhập và quyền admin)
router.put('/:id', protect, admin, blogController.updatePost);

// Xóa bài viết blog (yêu cầu đăng nhập và quyền admin)
router.delete('/:id', protect, admin, blogController.deletePost);

// Tạo danh mục blog mới (yêu cầu đăng nhập và quyền admin)
router.post('/categories', protect, admin, blogController.createCategory);

// Thêm bình luận cho bài viết
router.post('/:id/comments', blogController.addComment);

module.exports = router;