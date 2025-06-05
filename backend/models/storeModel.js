const { pool } = require('../config/db');

// Lấy tất cả cửa hàng
const getAllStores = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM stores
      ORDER BY name
    `);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy cửa hàng theo ID
const getStoreById = async (storeId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM stores WHERE store_id = ?',
      [storeId]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Tìm cửa hàng gần nhất
const getNearestStores = async (lat, lng, limit = 5) => {
  try {
    // Sử dụng công thức Haversine để tính khoảng cách
    const [rows] = await pool.query(`
      SELECT *,
      (
        6371 * acos(
          cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) +
          sin(radians(?)) * sin(radians(lat))
        )
      ) AS distance
      FROM stores
      HAVING distance IS NOT NULL
      ORDER BY distance
      LIMIT ?
    `, [lat, lng, lat, limit]);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

// Tạo cửa hàng mới
const createStore = async (storeData) => {
  const { name, address, city, district, phone, opening_hours, lat, lng } = storeData;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO stores (name, address, city, district, phone, opening_hours, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, address, city, district, phone, opening_hours, lat, lng]
    );
    
    return await getStoreById(result.insertId);
  } catch (error) {
    throw error;
  }
};

// Cập nhật cửa hàng
const updateStore = async (storeId, storeData) => {
  try {
    let query = 'UPDATE stores SET ';
    const values = [];
    
    if (storeData.name) {
      query += 'name = ?, ';
      values.push(storeData.name);
    }
    
    if (storeData.address) {
      query += 'address = ?, ';
      values.push(storeData.address);
    }
    
    if (storeData.city) {
      query += 'city = ?, ';
      values.push(storeData.city);
    }
    
    if (storeData.district) {
      query += 'district = ?, ';
      values.push(storeData.district);
    }
    
    if (storeData.phone) {
      query += 'phone = ?, ';
      values.push(storeData.phone);
    }
    
    if (storeData.opening_hours) {
      query += 'opening_hours = ?, ';
      values.push(storeData.opening_hours);
    }
    
    if (storeData.lat) {
      query += 'lat = ?, ';
      values.push(storeData.lat);
    }
    
    if (storeData.lng) {
      query += 'lng = ?, ';
      values.push(storeData.lng);
    }
    
    // Xóa dấu phẩy cuối cùng và khoảng trắng
    query = query.slice(0, -2);
    
    query += ' WHERE store_id = ?';
    values.push(storeId);
    
    const [result] = await pool.query(query, values);
    
    return result.affectedRows > 0 ? await getStoreById(storeId) : null;
  } catch (error) {
    throw error;
  }
};

// Xóa cửa hàng
const deleteStore = async (storeId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM stores WHERE store_id = ?',
      [storeId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
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