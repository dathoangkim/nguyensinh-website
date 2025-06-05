const { pool } = require('../config/db');

// Lấy tất cả phiếu giảm giá
const getAllCoupons = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM coupons
      ORDER BY created_at DESC
    `);
    return rows;
  } catch (error) {
    throw error;
  }
};

// Lấy phiếu giảm giá theo ID
const getCouponById = async (couponId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM coupons WHERE coupon_id = ?',
      [couponId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Lấy phiếu giảm giá theo mã code
const getCouponByCode = async (code) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM coupons WHERE code = ?',
      [code]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Tạo phiếu giảm giá mới
const createCoupon = async (couponData) => {
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
  } = couponData;

  try {
    const [result] = await pool.query(
      `INSERT INTO coupons 
        (code, description, discount_type, discount_value, min_order_amount, 
        usage_limit, valid_from, valid_to, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        description,
        discount_type,
        discount_value,
        min_order_amount || 0,
        usage_limit,
        valid_from,
        valid_to,
        is_active !== undefined ? is_active : true
      ]
    );

    return await getCouponById(result.insertId);
  } catch (error) {
    throw error;
  }
};

// Cập nhật phiếu giảm giá
const updateCoupon = async (couponId, couponData) => {
  try {
    let query = 'UPDATE coupons SET ';
    const values = [];

    if (couponData.code !== undefined) {
      query += 'code = ?, ';
      values.push(couponData.code);
    }

    if (couponData.description !== undefined) {
      query += 'description = ?, ';
      values.push(couponData.description);
    }

    if (couponData.discount_type !== undefined) {
      query += 'discount_type = ?, ';
      values.push(couponData.discount_type);
    }

    if (couponData.discount_value !== undefined) {
      query += 'discount_value = ?, ';
      values.push(couponData.discount_value);
    }

    if (couponData.min_order_amount !== undefined) {
      query += 'min_order_amount = ?, ';
      values.push(couponData.min_order_amount);
    }

    if (couponData.usage_limit !== undefined) {
      query += 'usage_limit = ?, ';
      values.push(couponData.usage_limit);
    }

    if (couponData.valid_from !== undefined) {
      query += 'valid_from = ?, ';
      values.push(couponData.valid_from);
    }

    if (couponData.valid_to !== undefined) {
      query += 'valid_to = ?, ';
      values.push(couponData.valid_to);
    }

    if (couponData.is_active !== undefined) {
      query += 'is_active = ?, ';
      values.push(couponData.is_active);
    }

    // Xóa dấu phẩy cuối cùng và khoảng trắng
    query = query.slice(0, -2);

    query += ' WHERE coupon_id = ?';
    values.push(couponId);

    const [result] = await pool.query(query, values);

    return result.affectedRows > 0 ? await getCouponById(couponId) : null;
  } catch (error) {
    throw error;
  }
};

// Xóa phiếu giảm giá
const deleteCoupon = async (couponId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM coupons WHERE coupon_id = ?',
      [couponId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

// Kiểm tra tính hợp lệ của phiếu giảm giá
const validateCoupon = async (code, orderAmount) => {
  try {
    const coupon = await getCouponByCode(code);

    if (!coupon) {
      throw new Error('Mã giảm giá không tồn tại');
    }

    if (!coupon.is_active) {
      throw new Error('Mã giảm giá đã bị vô hiệu hóa');
    }

    const currentDate = new Date();
    
    if (coupon.valid_from && new Date(coupon.valid_from) > currentDate) {
      throw new Error('Mã giảm giá chưa có hiệu lực');
    }

    if (coupon.valid_to && new Date(coupon.valid_to) < currentDate) {
      throw new Error('Mã giảm giá đã hết hạn');
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    if (coupon.min_order_amount > orderAmount) {
      throw new Error(`Đơn hàng phải có giá trị tối thiểu ${coupon.min_order_amount} để sử dụng mã này`);
    }

    return coupon;
  } catch (error) {
    throw error;
  }
};

// Tăng số lần sử dụng của phiếu giảm giá
const incrementCouponUsage = async (couponId) => {
  try {
    await pool.query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE coupon_id = ?',
      [couponId]
    );
    return true;
  } catch (error) {
    throw error;
  }
};

// Tính toán giá trị giảm giá
const calculateDiscount = (coupon, orderAmount) => {
  if (coupon.discount_type === 'percent') {
    return (orderAmount * coupon.discount_value) / 100;
  } else {
    return coupon.discount_value;
  }
};

module.exports = {
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  incrementCouponUsage,
  calculateDiscount
};