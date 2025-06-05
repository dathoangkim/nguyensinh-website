const addressModel = require('../models/addressModel');

// @desc    Lấy tất cả địa chỉ của người dùng
// @route   GET /api/addresses
// @access  Private
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const addresses = await addressModel.getAddressesByUser(userId);
    
    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    console.error('Error in getUserAddresses:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách địa chỉ',
      error: error.message
    });
  }
};

// @desc    Lấy địa chỉ theo ID
// @route   GET /api/addresses/:id
// @access  Private
const getAddressById = async (req, res) => {
  try {
    const addressId = req.params.id;
    const address = await addressModel.getAddressById(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    // Kiểm tra xem địa chỉ có thuộc về người dùng hiện tại không
    if (address.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập địa chỉ này'
      });
    }
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error in getAddressById:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin địa chỉ',
      error: error.message
    });
  }
};

// @desc    Lấy địa chỉ mặc định của người dùng
// @route   GET /api/addresses/default
// @access  Private
const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const address = await addressModel.getDefaultAddress(userId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ mặc định'
      });
    }
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error in getDefaultAddress:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy địa chỉ mặc định',
      error: error.message
    });
  }
};

// @desc    Tạo địa chỉ mới
// @route   POST /api/addresses
// @access  Private
const createAddress = async (req, res) => {
  try {
    const { label, street, city, district, postal_code, lat, lng, is_default } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!street || !city || !district) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: street, city, district'
      });
    }
    
    const userId = req.user.user_id;
    
    const newAddress = await addressModel.createAddress({
      user_id: userId,
      label,
      street,
      city,
      district,
      postal_code,
      lat,
      lng,
      is_default: is_default !== undefined ? is_default : false
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo địa chỉ mới thành công',
      data: newAddress
    });
  } catch (error) {
    console.error('Error in createAddress:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo địa chỉ mới',
      error: error.message
    });
  }
};

// @desc    Cập nhật địa chỉ
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    
    // Kiểm tra xem địa chỉ có tồn tại không
    const address = await addressModel.getAddressById(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    // Kiểm tra xem địa chỉ có thuộc về người dùng hiện tại không
    if (address.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật địa chỉ này'
      });
    }
    
    const updatedAddress = await addressModel.updateAddress(addressId, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật địa chỉ thành công',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Error in updateAddress:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật địa chỉ',
      error: error.message
    });
  }
};

// @desc    Xóa địa chỉ
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    
    // Kiểm tra xem địa chỉ có tồn tại không
    const address = await addressModel.getAddressById(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    // Kiểm tra xem địa chỉ có thuộc về người dùng hiện tại không
    if (address.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa địa chỉ này'
      });
    }
    
    await addressModel.deleteAddress(addressId);
    
    res.status(200).json({
      success: true,
      message: 'Xóa địa chỉ thành công'
    });
  } catch (error) {
    console.error('Error in deleteAddress:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa địa chỉ',
      error: error.message
    });
  }
};

// @desc    Đặt địa chỉ làm mặc định
// @route   PUT /api/addresses/:id/default
// @access  Private
const setDefaultAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.user_id;
    
    // Kiểm tra xem địa chỉ có tồn tại không
    const address = await addressModel.getAddressById(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    // Kiểm tra xem địa chỉ có thuộc về người dùng hiện tại không
    if (address.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật địa chỉ này'
      });
    }
    
    const updatedAddress = await addressModel.setDefaultAddress(addressId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Đã đặt địa chỉ làm mặc định',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Error in setDefaultAddress:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đặt địa chỉ làm mặc định',
      error: error.message
    });
  }
};

module.exports = {
  getUserAddresses,
  getAddressById,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};