const express = require("express")
const router = express.Router()
const {
  getOrders,
  getOrderById,
  getMyOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController")
const { protect, admin, optionalAuth } = require("../middleware/authMiddleware")

// Các routes cho đơn hàng
router.route("/").get(protect, admin, getOrders).post(optionalAuth, createOrder)

router.route("/myorders").get(protect, getMyOrders)

// Lấy trạng thái của tất cả đơn hàng (cho người dùng đã đăng nhập)
router.route("/status/all").get(protect, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { pool } = require('../config/db');
    
    // Lấy trạng thái của tất cả đơn hàng của người dùng
    const [orders] = await pool.query(
      "SELECT order_id, status FROM orders WHERE user_id = ?",
      [userId]
    );
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error("Error fetching all order statuses:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy trạng thái đơn hàng",
      error: error.message
    });
  }
});

router.route("/:id").get(optionalAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { pool } = require('../config/db');
    
    // Lấy thông tin đơn hàng
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }
    
    const order = orders[0];
    
    // Kiểm tra quyền truy cập
    if (req.user) {
      // Người dùng đã đăng nhập
      if (req.user.role !== "admin" && req.user.user_id !== order.user_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem đơn hàng này"
        });
      }
    } else {
      // Khách không đăng nhập - kiểm tra thông tin guest_info nếu có
      if (order.user_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem đơn hàng này"
        });
      }
    }
    
    // Lấy chi tiết đơn hàng
    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId]
    );
    
    res.json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin đơn hàng",
      error: error.message
    });
  }
});

// Lấy trạng thái đơn hàng
router.route("/:id/status").get(async (req, res) => {
  try {
    const orderId = req.params.id;
    const { pool } = require('../config/db');
    
    // Lấy trạng thái đơn hàng
    const [orders] = await pool.query(
      "SELECT status FROM orders WHERE order_id = ?",
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }
    
    res.json({
      success: true,
      data: {
        order_id: orderId,
        status: orders[0].status
      }
    });
  } catch (error) {
    console.error("Error fetching order status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy trạng thái đơn hàng",
      error: error.message
    });
  }
}).put(protect, admin, updateOrderStatus);

// Cập nhật trạng thái đơn hàng (cho khách không đăng nhập)
router.route("/:id/update-status").put(optionalAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, isGuest, guest_info } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp trạng thái mới"
      });
    }
    
    const { pool } = require('../config/db');
    
    // Lấy thông tin đơn hàng
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }
    
    const order = orders[0];
    
    // Kiểm tra quyền truy cập
    if (req.user) {
      // Người dùng đã đăng nhập
      if (req.user.role !== "admin" && req.user.user_id !== order.user_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật đơn hàng này"
        });
      }
    } else if (isGuest) {
      // Khách không đăng nhập - kiểm tra thông tin guest_info nếu có
      if (order.user_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật đơn hàng này"
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật đơn hàng này"
      });
    }
    
    // Lấy trạng thái hiện tại
    const oldStatus = order.status;
    
    // Cập nhật trạng thái
    await pool.query(
      "UPDATE orders SET status = ? WHERE order_id = ?",
      [status, orderId]
    );
    
    // Thêm lịch sử trạng thái
    await pool.query(
      "INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?)",
      [orderId, oldStatus, status, req.user ? req.user.user_id : null, "Cập nhật từ client"]
    );
    
    // Lấy thông tin đơn hàng đã cập nhật
    const [updatedOrders] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [orderId]
    );
    
    res.json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: updatedOrders[0]
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái đơn hàng",
      error: error.message
    });
  }
});

router.route("/:id/cancel").put(optionalAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { isGuest, guest_info, guest_cancel } = req.body;
    
    const { pool } = require('../config/db');
    
    // Lấy thông tin đơn hàng
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng"
      });
    }
    
    const order = orders[0];
    
    // Kiểm tra quyền truy cập
    if (req.user) {
      // Người dùng đã đăng nhập
      if (req.user.role !== "admin" && req.user.user_id !== order.user_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền hủy đơn hàng này"
        });
      }
    } else if (isGuest && guest_cancel) {
      // Khách không đăng nhập - kiểm tra thông tin guest_info nếu có
      if (order.user_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền hủy đơn hàng này"
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy đơn hàng này"
      });
    }
    
    // Kiểm tra xem đơn hàng có thể hủy không
    if (order.status === "completed" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn hàng ở trạng thái này"
      });
    }
    
    // Lấy chi tiết đơn hàng để hoàn lại số lượng sản phẩm
    const [itemRows] = await pool.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );
    
    // Cập nhật trạng thái
    await pool.query(
      "UPDATE orders SET status = ? WHERE order_id = ?",
      ["cancelled", orderId]
    );
    
    // Thêm lịch sử trạng thái
    await pool.query(
      "INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?)",
      [orderId, order.status, "cancelled", req.user ? req.user.user_id : null, "Đơn hàng đã bị hủy bởi khách hàng"]
    );
    
    // Hoàn lại số lượng sản phẩm
    for (const item of itemRows) {
      await pool.query(
        "UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?",
        [item.quantity, item.product_id]
      );
    }
    
    // Lấy thông tin đơn hàng đã cập nhật
    const [updatedOrders] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [orderId]
    );
    
    res.json({
      success: true,
      message: "Đơn hàng đã được hủy thành công",
      data: updatedOrders[0]
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy đơn hàng",
      error: error.message
    });
  }
});


module.exports = router
