const loyaltyPointModel = require('../models/loyaltyPointModel');

// @desc    Lấy tổng điểm thưởng của người dùng
// @route   GET /api/loyalty/points
// @access  Private
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const points = await loyaltyPointModel.getUserPoints(userId);
    
    res.status(200).json({
      success: true,
      data: {
        points,
        value: loyaltyPointModel.calculatePointsValue(points)
      }
    });
  } catch (error) {
    console.error('Error in getUserPoints:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin điểm thưởng',
      error: error.message
    });
  }
};

// @desc    Lấy lịch sử điểm thưởng của người dùng
// @route   GET /api/loyalty/history
// @access  Private
const getUserPointsHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const history = await loyaltyPointModel.getUserPointsHistory(userId);
    
    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Error in getUserPointsHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử điểm thưởng',
      error: error.message
    });
  }
};

// @desc    Thêm điểm thưởng cho người dùng (Admin)
// @route   POST /api/loyalty/add
// @access  Admin
const addPoints = async (req, res) => {
  try {
    const { user_id, points, reason } = req.body;
    
    if (!user_id || !points) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: user_id, points'
      });
    }
    
    await loyaltyPointModel.addPoints({
      user_id,
      order_id: null,
      change: points,
      reason: reason || 'Thêm điểm bởi quản trị viên'
    });
    
    const updatedPoints = await loyaltyPointModel.getUserPoints(user_id);
    
    res.status(200).json({
      success: true,
      message: 'Thêm điểm thưởng thành công',
      data: {
        user_id,
        points: updatedPoints,
        value: loyaltyPointModel.calculatePointsValue(updatedPoints)
      }
    });
  } catch (error) {
    console.error('Error in addPoints:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể thêm điểm thưởng',
      error: error.message
    });
  }
};

// @desc    Sử dụng điểm thưởng
// @route   POST /api/loyalty/use
// @access  Private
const usePoints = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { points, order_id } = req.body;
    
    if (!points) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số điểm cần sử dụng'
      });
    }
    
    // Kiểm tra xem người dùng có đủ điểm không
    const currentPoints = await loyaltyPointModel.getUserPoints(userId);
    
    if (currentPoints < points) {
      return res.status(400).json({
        success: false,
        message: 'Không đủ điểm thưởng'
      });
    }
    
    await loyaltyPointModel.usePoints({
      user_id: userId,
      order_id,
      change: -points,
      reason: order_id ? 'Sử dụng điểm cho đơn hàng' : 'Sử dụng điểm'
    });
    
    const updatedPoints = await loyaltyPointModel.getUserPoints(userId);
    
    res.status(200).json({
      success: true,
      message: 'Sử dụng điểm thưởng thành công',
      data: {
        points: updatedPoints,
        value: loyaltyPointModel.calculatePointsValue(updatedPoints),
        used_points: points,
        used_value: loyaltyPointModel.calculatePointsValue(points)
      }
    });
  } catch (error) {
    console.error('Error in usePoints:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể sử dụng điểm thưởng',
      error: error.message
    });
  }
};

// @desc    Tính toán điểm thưởng từ giá trị đơn hàng
// @route   POST /api/loyalty/calculate
// @access  Private
const calculateOrderPoints = async (req, res) => {
  try {
    const { order_amount } = req.body;
    
    if (!order_amount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp giá trị đơn hàng'
      });
    }
    
    const points = loyaltyPointModel.calculateOrderPoints(order_amount);
    
    res.status(200).json({
      success: true,
      data: {
        order_amount,
        points,
        value: loyaltyPointModel.calculatePointsValue(points)
      }
    });
  } catch (error) {
    console.error('Error in calculateOrderPoints:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tính toán điểm thưởng',
      error: error.message
    });
  }
};

module.exports = {
  getUserPoints,
  getUserPointsHistory,
  addPoints,
  usePoints,
  calculateOrderPoints
};