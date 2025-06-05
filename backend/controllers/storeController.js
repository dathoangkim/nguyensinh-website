const storeModel = require('../models/storeModel');

// Lấy tất cả cửa hàng
const getAllStores = async (req, res) => {
  try {
    const stores = await storeModel.getAllStores();
    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores
    });
  } catch (error) {
    console.error('Error in getAllStores:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách cửa hàng',
      error: error.message
    });
  }
};

// Lấy cửa hàng theo ID
const getStoreById = async (req, res) => {
  try {
    const store = await storeModel.getStoreById(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cửa hàng'
      });
    }
    
    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Error in getStoreById:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin cửa hàng',
      error: error.message
    });
  }
};

// Tìm cửa hàng gần nhất
const getNearestStores = async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { limit } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tọa độ (lat, lng)'
      });
    }
    
    const stores = await storeModel.getNearestStores(
      parseFloat(lat),
      parseFloat(lng),
      limit ? parseInt(limit) : 5
    );
    
    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores
    });
  } catch (error) {
    console.error('Error in getNearestStores:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tìm cửa hàng gần nhất',
      error: error.message
    });
  }
};

// Tạo cửa hàng mới
const createStore = async (req, res) => {
  try {
    const { name, address, city, district, phone, opening_hours, lat, lng } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: name, address'
      });
    }
    
    const newStore = await storeModel.createStore({
      name,
      address,
      city,
      district,
      phone,
      opening_hours,
      lat,
      lng
    });
    
    res.status(201).json({
      success: true,
      data: newStore
    });
  } catch (error) {
    console.error('Error in createStore:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo cửa hàng mới',
      error: error.message
    });
  }
};

// Cập nhật cửa hàng
const updateStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    const updateData = req.body;
    
    const updatedStore = await storeModel.updateStore(storeId, updateData);
    
    if (!updatedStore) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cửa hàng'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedStore
    });
  } catch (error) {
    console.error('Error in updateStore:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật cửa hàng',
      error: error.message
    });
  }
};

// Xóa cửa hàng
const deleteStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    
    const success = await storeModel.deleteStore(storeId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cửa hàng'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Đã xóa cửa hàng thành công'
    });
  } catch (error) {
    console.error('Error in deleteStore:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa cửa hàng',
      error: error.message
    });
  }
};

module.exports = {
  getAllStores,
  getStoreById,
  getNearestStores,
  createStore,
  updateStore,
  deleteStore
};