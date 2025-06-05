const couponModel = require('../models/couponModel');

// @desc    Lấy tất cả phiếu giảm giá
// @route   GET /api/coupons
// @access  Admin
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.getAllCoupons();
    
    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (error) {
    console.error('Error in getAllCoupons:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách phiếu giảm giá',
      error: error.message
    });
  }
};

// @desc    Lấy phiếu giảm giá theo ID
// @route   GET /api/coupons/:id
// @access  Admin
const getCouponById = async (req, res) => {
  try {
    const coupon = await couponModel.getCouponById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Error in getCouponById:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin phiếu giảm giá',
      error: error.message
    });
  }
};

// @desc    Tạo phiếu giảm giá mới
// @route   POST /api/coupons
// @access  Admin
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      usage_limit,
      valid_from,
      valid_to,
      is_active
    } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: code, discount_type, discount_value'
      });
    }
    
    // Kiểm tra xem mã code đã tồn tại chưa
    const existingCoupon = await couponModel.getCouponByCode(code);
    
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá này đã tồn tại'
      });
    }
    
    const newCoupon = await couponModel.createCoupon({
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      usage_limit,
      valid_from,
      valid_to,
      is_active
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo phiếu giảm giá thành công',
      data: newCoupon
    });
  } catch (error) {
    console.error('Error in createCoupon:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo phiếu giảm giá mới',
      error: error.message
    });
  }
};

// @desc    Cập nhật phiếu giảm giá
// @route   PUT /api/coupons/:id
// @access  Admin
const updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    
    // Kiểm tra xem phiếu giảm giá có tồn tại không
    const existingCoupon = await couponModel.getCouponById(couponId);
    
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    // Nếu code được cập nhật, kiểm tra xem code mới đã tồn tại chưa
    if (req.body.code && req.body.code !== existingCoupon.code) {
      const codeExists = await couponModel.getCouponByCode(req.body.code);
      
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá này đã tồn tại'
        });
      }
    }
    
    const updatedCoupon = await couponModel.updateCoupon(couponId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật phiếu giảm giá thành công',
      data: updatedCoupon
    });
  } catch (error) {
    console.error('Error in updateCoupon:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật phiếu giảm giá',
      error: error.message
    });
  }
};

// @desc    Xóa phiếu giảm giá
// @route   DELETE /api/coupons/:id
// @access  Admin
const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    
    // Kiểm tra xem phiếu giảm giá có tồn tại không
    const existingCoupon = await couponModel.getCouponById(couponId);
    
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    await couponModel.deleteCoupon(couponId);
    
    res.status(200).json({
      success: true,
      message: 'Xóa phiếu giảm giá thành công'
    });
  } catch (error) {
    console.error('Error in deleteCoupon:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa phiếu giảm giá',
      error: error.message
    });
  }
};

// @desc    Kiểm tra tính hợp lệ của phiếu giảm giá
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = async (req, res) => {
  try {
    const { code, order_amount } = req.body;
    
    if (!code || !order_amount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: code, order_amount'
      });
    }
    
    try {
      const coupon = await couponModel.validateCoupon(code, order_amount);
      const discount = couponModel.calculateDiscount(coupon, order_amount);
      
      res.status(200).json({
        success: true,
        message: 'Mã giảm giá hợp lệ',
        data: {
          coupon,
          discount,
          final_amount: order_amount - discount
        }
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    console.error('Error in validateCoupon:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra mã giảm giá',
      error: error.message
    });
  }
};

module.exports = {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};