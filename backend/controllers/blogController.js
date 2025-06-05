const blogModel = require('../models/blogModel');

// Lấy tất cả bài viết blog
const getAllPosts = async (req, res) => {
  try {
    const posts = await blogModel.getAllPosts();
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách bài viết',
      error: error.message
    });
  }
};

// Lấy bài viết blog theo ID
const getPostById = async (req, res) => {
  try {
    const post = await blogModel.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }
    
    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin bài viết',
      error: error.message
    });
  }
};

// Lấy bài viết blog theo danh mục
const getPostsByCategory = async (req, res) => {
  try {
    const posts = await blogModel.getPostsByCategory(req.params.categoryId);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error in getPostsByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách bài viết theo danh mục',
      error: error.message
    });
  }
};

// Tìm kiếm bài viết blog
const searchPosts = async (req, res) => {
  try {
    const keyword = req.params.keyword;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp từ khóa tìm kiếm'
      });
    }
    
    const posts = await blogModel.searchPosts(keyword);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error in searchPosts:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tìm kiếm bài viết',
      error: error.message
    });
  }
};

// Tạo bài viết blog mới
const createPost = async (req, res) => {
  try {
    const { title, slug, post_url, img_url, content, category_id, is_published } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!title || !slug || !content || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: title, slug, content, category_id'
      });
    }
    
    // Lấy author_id từ user đã đăng nhập
    const author_id = req.user.user_id;
    
    const newPost = await blogModel.createPost({
      title,
      slug,
      post_url,
      img_url,
      content,
      author_id,
      category_id,
      is_published: is_published !== undefined ? is_published : false
    });
    
    res.status(201).json({
      success: true,
      data: newPost
    });
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo bài viết mới',
      error: error.message
    });
  }
};

// Cập nhật bài viết blog
const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const updateData = req.body;
    
    const updatedPost = await blogModel.updatePost(postId, updateData);
    
    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedPost
    });
  } catch (error) {
    console.error('Error in updatePost:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật bài viết',
      error: error.message
    });
  }
};

// Xóa bài viết blog
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    const success = await blogModel.deletePost(postId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa bài viết thành công'
    });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa bài viết',
      error: error.message
    });
  }
};

// Lấy tất cả danh mục blog
// Lấy tất cả danh mục blog
const getAllCategories = async (req, res) => {
  try {
    const categories = await blogModel.getAllCategories();
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error in getAllCategories controller:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách danh mục',
      error: error.message
    });
  }
};


// Tạo danh mục blog mới
const createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: name, slug'
      });
    }
    
    const newCategory = await blogModel.createCategory({ name, slug });
    
    res.status(201).json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    console.error('Error in createCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo danh mục mới',
      error: error.message
    });
  }
};

// Thêm bình luận cho bài viết
const addComment = async (req, res) => {
  try {
    const { post_id, content, parent_id } = req.body;
    
    if (!post_id || !content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: post_id, content'
      });
    }
    
    let user_id = null;
    let guest_name = null;
    
    // Nếu đã đăng nhập, lấy user_id
    if (req.user) {
      user_id = req.user.user_id;
    } else {
      // Nếu chưa đăng nhập, yêu cầu guest_name
      guest_name = req.body.guest_name;
      if (!guest_name) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tên của bạn (guest_name)'
        });
      }
    }
    
    const newComment = await blogModel.addComment({
      post_id,
      user_id,
      guest_name,
      content,
      parent_id
    });
    
    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể thêm bình luận',
      error: error.message
    });
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