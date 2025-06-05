const { pool } = require('../config/db');

// Lấy tất cả địa chỉ của người dùng
const getAddressesByUser = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy địa chỉ theo ID
const getAddressById = async (addressId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE address_id = ?',
      [addressId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Lấy địa chỉ mặc định của người dùng
const getDefaultAddress = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? AND is_default = true',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Tạo địa chỉ mới
const createAddress = async (addressData) => {
  const { user_id, label, street, city, district, postal_code, lat, lng, is_default } = addressData;
  
  try {
    // Nếu địa chỉ mới là mặc định, cập nhật tất cả các địa chỉ khác thành không mặc định
    if (is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = ?',
        [user_id]
      );
    }
    
    const [result] = await pool.query(
      `INSERT INTO addresses 
        (user_id, label, street, city, district, postal_code, lat, lng, is_default) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, label, street, city, district, postal_code, lat, lng, is_default]
    );
    
    return await getAddressById(result.insertId);
  } catch (error) {
    throw error;
  }
};

// Cập nhật địa chỉ
const updateAddress = async (addressId, addressData) => {
  try {
    // Lấy thông tin địa chỉ hiện tại
    const currentAddress = await getAddressById(addressId);
    
    if (!currentAddress) {
      throw new Error('Địa chỉ không tồn tại');
    }
    
    // Nếu địa chỉ được cập nhật thành mặc định, cập nhật tất cả các địa chỉ khác thành không mặc định
    if (addressData.is_default) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = ?',
        [currentAddress.user_id]
      );
    }
    
    let query = 'UPDATE addresses SET ';
    const values = [];
    
    if (addressData.label !== undefined) {
      query += 'label = ?, ';
      values.push(addressData.label);
    }
    
    if (addressData.street !== undefined) {
      query += 'street = ?, ';
      values.push(addressData.street);
    }
    
    if (addressData.city !== undefined) {
      query += 'city = ?, ';
      values.push(addressData.city);
    }
    
    if (addressData.district !== undefined) {
      query += 'district = ?, ';
      values.push(addressData.district);
    }
    
    if (addressData.postal_code !== undefined) {
      query += 'postal_code = ?, ';
      values.push(addressData.postal_code);
    }
    
    if (addressData.lat !== undefined) {
      query += 'lat = ?, ';
      values.push(addressData.lat);
    }
    
    if (addressData.lng !== undefined) {
      query += 'lng = ?, ';
      values.push(addressData.lng);
    }
    
    if (addressData.is_default !== undefined) {
      query += 'is_default = ?, ';
      values.push(addressData.is_default);
    }
    
    // Xóa dấu phẩy cuối cùng và khoảng trắng
    query = query.slice(0, -2);
    
    query += ' WHERE address_id = ?';
    values.push(addressId);
    
    const [result] = await pool.query(query, values);
    
    return result.affectedRows > 0 ? await getAddressById(addressId) : null;
  } catch (error) {
    throw error;
  }
};

// Xóa địa chỉ
const deleteAddress = async (addressId) => {
  try {
    // Lấy thông tin địa chỉ trước khi xóa
    const address = await getAddressById(addressId);
    
    if (!address) {
      throw new Error('Địa chỉ không tồn tại');
    }
    
    const [result] = await pool.query(
      'DELETE FROM addresses WHERE address_id = ?',
      [addressId]
    );
    
    // Nếu địa chỉ bị xóa là mặc định, cập nhật địa chỉ đầu tiên còn lại thành mặc định
    if (address.is_default) {
      const [remainingAddresses] = await pool.query(
        'SELECT address_id FROM addresses WHERE user_id = ? LIMIT 1',
        [address.user_id]
      );
      
      if (remainingAddresses.length > 0) {
        await pool.query(
          'UPDATE addresses SET is_default = true WHERE address_id = ?',
          [remainingAddresses[0].address_id]
        );
      }
    }
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Đặt địa chỉ làm mặc định
const setDefaultAddress = async (addressId, userId) => {
  try {
    // Kiểm tra xem địa chỉ có thuộc về người dùng không
    const [addressCheck] = await pool.query(
      'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
      [addressId, userId]
    );
    
    if (addressCheck.length === 0) {
      throw new Error('Địa chỉ không tồn tại hoặc không thuộc về người dùng này');
    }
    
    // Cập nhật tất cả các địa chỉ của người dùng thành không mặc định
    await pool.query(
      'UPDATE addresses SET is_default = false WHERE user_id = ?',
      [userId]
    );
    
    // Đặt địa chỉ được chọn làm mặc định
    await pool.query(
      'UPDATE addresses SET is_default = true WHERE address_id = ?',
      [addressId]
    );
    
    return await getAddressById(addressId);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAddressesByUser,
  getAddressById,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};