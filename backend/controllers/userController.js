const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// @desc    Lấy tất cả người dùng
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      data: users
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

// @desc    Lấy thông tin người dùng theo ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await userModel.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.json({
      success: true,
      data: user
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

// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.getUserById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.json({
      success: true,
      data: user
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

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { username, email, password, full_name, phone, role } = req.body;
    
    // Kiểm tra xem người dùng có tồn tại không
    const existingUser = await userModel.getUserById(req.params.id);
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Kiểm tra email đã tồn tại chưa (nếu thay đổi email)
    if (email && email !== existingUser.email) {
      const userWithEmail = await userModel.getUserByEmail(email);
      if (userWithEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }
    
    const updatedUser = await userModel.updateUser(req.params.id, {
      username,
      email,
      password,
      full_name,
      phone,
      role
    });
    
    res.json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      data: updatedUser
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

// @desc    Cập nhật thông tin cá nhân
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { username, email, password, full_name, phone } = req.body;
    
    // Kiểm tra email đã tồn tại chưa (nếu thay đổi email)
    if (email && email !== req.user.email) {
      const userWithEmail = await userModel.getUserByEmail(email);
      if (userWithEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }
    
    const updatedUser = await userModel.updateUser(req.user.user_id, {
      username,
      email,
      password,
      full_name,
      phone
    });
    
    // Tạo token mới nếu thông tin quan trọng thay đổi
    if (email || username) {
      const token = jwt.sign(
        { id: updatedUser.user_id, role: updatedUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
      );
      
      res.json({
        success: true,
        message: 'Cập nhật thông tin cá nhân thành công',
        data: updatedUser,
        token
      });
    } else {
      res.json({
        success: true,
        message: 'Cập nhật thông tin cá nhân thành công',
        data: updatedUser
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

// @desc    Xóa người dùng
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    // Kiểm tra xem người dùng có tồn tại không
    const existingUser = await userModel.getUserById(req.params.id);
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Không cho phép xóa tài khoản admin đang đăng nhập
    if (existingUser.user_id === req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản của chính bạn'
      });
    }
    
    const result = await userModel.deleteUser(req.params.id);
    
    if (result) {
      // Xóa tất cả phiên đăng nhập của người dùng
      await userModel.deleteAllUserSessions(req.params.id);
      
      res.json({
        success: true,
        message: 'Xóa người dùng thành công'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Không thể xóa người dùng'
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

// @desc    Lấy thống kê người dùng
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await userModel.countUsers();
    const latestUsers = await userModel.getLatestUsers(5);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        latestUsers
      }
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
  getUsers,
  getUserById,
  getUserProfile,
  updateUser,
  updateUserProfile,
  deleteUser,
  getUserStats
};
