const { pool } = require("../config/db")

// Lấy tất cả đơn hàng
const getAllOrders = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, u.username, u.email, u.full_name,
      a.street, a.city, a.district, a.postal_code
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN addresses a ON o.address_id = a.address_id
      ORDER BY o.created_at DESC
    `)
    return rows
  } catch (error) {
    throw error
  }
}

// Lấy đơn hàng theo ID
const getOrderById = async (orderId) => {
  try {
    // Lấy thông tin đơn hàng
    const [orderRows] = await pool.query(
      `
      SELECT o.*, u.username, u.email, u.full_name,
      a.street, a.city, a.district, a.postal_code
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN addresses a ON o.address_id = a.address_id
      WHERE o.order_id = ?
    `,
      [orderId],
    )

    if (orderRows.length === 0) {
      return null
    }

    const order = orderRows[0]

    // Lấy chi tiết đơn hàng
    const [itemRows] = await pool.query(
      `
  SELECT oi.*, p.name, p.slug, p.price,
  (SELECT img_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as product_image
  FROM order_items oi
  LEFT JOIN products p ON oi.product_id = p.product_id
  WHERE oi.order_id = ?
`,
      [orderId],
    )

    // Lấy lịch sử trạng thái đơn hàng
    const [historyRows] = await pool.query(
      `
      SELECT h.*, u.username, u.full_name
      FROM order_status_history h
      LEFT JOIN users u ON h.changed_by = u.user_id
      WHERE h.order_id = ?
      ORDER BY h.changed_at DESC
    `,
      [orderId],
    )

    // Lấy thông tin thanh toán
    const [paymentRows] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [orderId])

    return {
      ...order,
      items: itemRows,
      status_history: historyRows,
      payment: paymentRows[0] || null,
    }
  } catch (error) {
    throw error
  }
}

// Lấy đơn hàng theo người dùng
const getOrdersByUser = async (userId) => {
  try {
    // Lấy danh sách đơn hàng
    const [orders] = await pool.query(
      `
      SELECT o.*, 
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as item_count
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `,
      [userId],
    )

    // Lấy chi tiết sản phẩm cho từng đơn hàng
    for (let order of orders) {
      const [items] = await pool.query(
        `
        SELECT oi.*, p.name, p.slug, p.price,
        (SELECT img_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as product_image
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `,
        [order.order_id],
      )
      order.items = items
    }

    return orders
  } catch (error) {
    console.error('Error in getOrdersByUser:', error)
    throw error
  }
}

// Tạo đơn hàng mới
const createOrder = async (orderData) => {
  console.log("createOrder model function called");
  
  const { 
    user_id, 
    address_id, 
    payment_method, 
    total_amount, 
    discount_amount, 
    shipping_fee, 
    coupon_id, 
    items,
    guest_info
  } = orderData
  
  console.log("Model received order data:", {
    user_id: user_id || "Not provided",
    address_id: address_id || "Not provided",
    payment_method,
    total_amount,
    items: items ? items.length : 0,
    guest_info: guest_info ? "Present" : "Not present",
    guest_info_type: guest_info ? typeof guest_info : "N/A"
  })

  try {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()
      
      let orderId;
      
      // Xử lý khác nhau cho người dùng đã đăng nhập và chưa đăng nhập
      let orderQuery, orderParams;
      
      if (user_id) {
        // Người dùng đã đăng nhập - sử dụng user_id và address_id
        orderQuery = "INSERT INTO orders (user_id, address_id, payment_method, total_amount, discount_amount, shipping_fee, coupon_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
        orderParams = [user_id, address_id, payment_method, total_amount, discount_amount || 0, shipping_fee || 0, coupon_id || null];
      } else {
        // Kiểm tra xem bảng orders có cột guest_info không
        try {
          const [columns] = await connection.query("SHOW COLUMNS FROM orders LIKE 'guest_info'");
          
          if (columns.length > 0) {
            // Nếu có cột guest_info, sử dụng nó
            console.log("guest_info column exists in orders table");
            
            // Đảm bảo guest_info là chuỗi JSON
            let guestInfoJson;
            if (typeof guest_info === 'string') {
              try {
                // Kiểm tra xem đã là JSON string chưa
                JSON.parse(guest_info);
                guestInfoJson = guest_info;
              } catch (e) {
                // Nếu không phải JSON string, chuyển đổi
                guestInfoJson = JSON.stringify(guest_info);
              }
            } else if (typeof guest_info === 'object') {
              guestInfoJson = JSON.stringify(guest_info);
            } else {
              guestInfoJson = JSON.stringify({});
            }
            
            console.log("Prepared guest_info JSON:", guestInfoJson);
            
            orderQuery = "INSERT INTO orders (payment_method, total_amount, discount_amount, shipping_fee, coupon_id, guest_info) VALUES (?, ?, ?, ?, ?, ?)";
            orderParams = [
              payment_method, 
              total_amount, 
              discount_amount || 0, 
              shipping_fee || 0, 
              coupon_id || null,
              guestInfoJson
            ];
          } else {
            // Nếu không có cột guest_info, chỉ lưu thông tin cơ bản
            orderQuery = "INSERT INTO orders (payment_method, total_amount, discount_amount, shipping_fee, coupon_id) VALUES (?, ?, ?, ?, ?)";
            orderParams = [
              payment_method, 
              total_amount, 
              discount_amount || 0, 
              shipping_fee || 0, 
              coupon_id || null
            ];
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra cấu trúc bảng:", error);
          // Sử dụng truy vấn không có guest_info
          orderQuery = "INSERT INTO orders (payment_method, total_amount, discount_amount, shipping_fee, coupon_id) VALUES (?, ?, ?, ?, ?)";
          orderParams = [
            payment_method, 
            total_amount, 
            discount_amount || 0, 
            shipping_fee || 0, 
            coupon_id || null
          ];
        }
      }
      
      // Thực hiện truy vấn
      console.log("Executing query:", orderQuery);
      console.log("With params:", orderParams);
      
      const [orderResult] = await connection.query(orderQuery, orderParams);
      orderId = orderResult.insertId;

      // Thêm chi tiết đơn hàng
      if (items && items.length > 0) {
        const itemValues = items.map((item) => [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price,
        ])

        await connection.query(
          "INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ?",
          [itemValues],
        )

        // Cập nhật số lượng sản phẩm
        for (const item of items) {
          await connection.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?", [
            item.quantity,
            item.product_id,
          ])
        }
      }

      // Thêm lịch sử trạng thái đơn hàng
      // Nếu không có user_id, sử dụng null cho changed_by
      await connection.query(
        "INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)",
        [orderId, "pending", "pending", user_id || null],
      )

      // Cập nhật số lần sử dụng mã giảm giá
      if (coupon_id) {
        await connection.query("UPDATE coupons SET used_count = used_count + 1 WHERE coupon_id = ?", [coupon_id])
      }

      await connection.commit()

      try {
        // Trả về thông tin đơn hàng
        const orderDetails = await getOrderById(orderId);
        return orderDetails;
      } catch (error) {
        console.error("Lỗi khi lấy thông tin đơn hàng:", error);
        // Trả về thông tin cơ bản nếu không lấy được chi tiết
        return {
          order_id: orderId,
          status: "pending"
        };
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    throw error
  }
}

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (orderId, status, userId) => {
  try {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Lấy trạng thái hiện tại
      const [currentStatusRows] = await connection.query("SELECT status FROM orders WHERE order_id = ?", [orderId])

      if (currentStatusRows.length === 0) {
        throw new Error("Không tìm thấy đơn hàng")
      }

      const oldStatus = currentStatusRows[0].status

      // Cập nhật trạng thái
      await connection.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, orderId])

      // Thêm lịch sử trạng thái
      await connection.query(
        "INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)",
        [orderId, oldStatus, status, userId],
      )

      await connection.commit()

      return await getOrderById(orderId)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    throw error
  }
}

// Hủy đơn hàng
const cancelOrder = async (orderId, userId) => {
  try {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Lấy trạng thái hiện tại và chi tiết đơn hàng
      const [currentStatusRows] = await connection.query("SELECT status FROM orders WHERE order_id = ?", [orderId])

      if (currentStatusRows.length === 0) {
        throw new Error("Không tìm thấy đơn hàng")
      }

      const oldStatus = currentStatusRows[0].status

      // Kiểm tra xem đơn hàng có thể hủy không
      if (["completed", "cancelled"].includes(oldStatus)) {
        throw new Error("Không thể hủy đơn hàng đã hoàn thành hoặc đã hủy")
      }

      // Lấy chi tiết đơn hàng để hoàn lại số lượng sản phẩm
      const [itemRows] = await connection.query("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [
        orderId,
      ])

      // Cập nhật trạng thái
      await connection.query("UPDATE orders SET status = ? WHERE order_id = ?", ["cancelled", orderId])

      // Thêm lịch sử trạng thái
      await connection.query(
        "INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)",
        [orderId, oldStatus, "cancelled", userId],
      )

      // Hoàn lại số lượng sản phẩm
      for (const item of itemRows) {
        await connection.query("UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?", [
          item.quantity,
          item.product_id,
        ])
      }

      await connection.commit()

      return await getOrderById(orderId)
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    throw error
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  createOrder,
  updateOrderStatus,
  cancelOrder,
}
