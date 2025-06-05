const orderModel = require("../models/orderModel")
const db = require("../config/db") // Assuming db is imported for SQL queries

// @desc    Lấy tất cả đơn hàng
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await orderModel.getAllOrders()
    res.json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    })
  }
}

// @desc    Lấy đơn hàng theo ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id
    const order = await orderModel.getOrderById(orderId)

    if (!order) {
      return res.status(404).json({ success: false, error: "Không tìm thấy đơn hàng" })
    }

    // Kiểm tra quyền truy cập
    if (req.user.role !== "admin" && req.user.user_id !== order.user_id) {
      return res.status(403).json({ success: false, error: "Bạn không có quyền xem đơn hàng này" })
    }

    res.json({ success: true, data: order })
  } catch (error) {
    console.error("Error in getOrderById:", error)
    res.status(500).json({ success: false, error: error.message })
  }
}

// @desc    Lấy đơn hàng của người dùng hiện tại
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await orderModel.getOrdersByUser(req.user.user_id)
    res.json({
      success: true,
      count: orders.length,
      data: orders,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    })
  }
}

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Public (có thể đặt hàng mà không cần đăng nhập)
const createOrder = async (req, res) => {
  console.log("createOrder controller running");
  console.log("User in request:", req.user ? `ID: ${req.user.user_id}` : "Not authenticated");
  console.log("Request body keys:", Object.keys(req.body));
  
  try {
    const { 
      address_id, 
      payment_method, 
      total_amount, 
      discount_amount, 
      shipping_fee, 
      coupon_id, 
      items,
      guest_info
    } = req.body
    
    // Log để debug
    console.log("Received order data:", {
      address_id, 
      payment_method, 
      total_amount, 
      discount_amount, 
      shipping_fee, 
      coupon_id,
      guest_info: guest_info ? "Present" : "Not present",
      items: items ? `${items.length} items` : "No items"
    });

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có sản phẩm trong đơn hàng",
      })
    }

    // Kiểm tra thông tin bắt buộc cho người dùng chưa đăng nhập
    if (!req.user && !guest_info) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp thông tin người đặt hàng",
      });
    }

    // Lấy user_id từ request nếu đã đăng nhập
    const user_id = req.user ? req.user.user_id : null;
    
    console.log("Đang tạo đơn hàng với user_id:", user_id);
    console.log("Thông tin khách hàng:", guest_info ? JSON.stringify(guest_info) : "Không có");

    // Tạo đơn hàng với thông tin người dùng
    const orderModelData = {
      payment_method,
      total_amount,
      discount_amount,
      shipping_fee,
      items
    };
    
    // Thêm các trường tùy chọn
    if (user_id) orderModelData.user_id = user_id;
    if (address_id) orderModelData.address_id = address_id;
    if (coupon_id) orderModelData.coupon_id = coupon_id;
    if (guest_info) orderModelData.guest_info = guest_info;
    
    console.log("Dữ liệu đơn hàng gửi đến model:", {
      ...orderModelData,
      items: orderModelData.items ? `${orderModelData.items.length} items` : "No items",
      guest_info: orderModelData.guest_info ? "Present" : "Not present"
    });
    
    const newOrder = await orderModel.createOrder(orderModelData)

    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      data: {
        order_id: newOrder.order_id,
        status: "pending"
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    })
  }
}

// @desc    Cập nhật trạng thái đơn hàng
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp trạng thái mới",
      })
    }

    // Kiểm tra xem đơn hàng có tồn tại không
    const existingOrder = await orderModel.getOrderById(req.params.id)

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      })
    }

    const updatedOrder = await orderModel.updateOrderStatus(req.params.id, status, req.user.user_id)

    res.json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: updatedOrder,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    })
  }
}

// @desc    Hủy đơn hàng
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id
    const userId = req.user.user_id

    // Check if the order exists and belongs to the user
    const orderQuery = "SELECT * FROM orders WHERE order_id = ?"
    const [orders] = await db.query(orderQuery, [orderId])

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại",
      })
    }

    const order = orders[0]

    // Check if the order belongs to the user or if the user is an admin
    if (order.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy đơn hàng này",
      })
    }

    // Check if the order can be cancelled (only pending or processing orders can be cancelled)
    if (order.status !== "pending" && order.status !== "processing") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn hàng ở trạng thái này",
      })
    }

    // Update the order status to cancelled
    const updateQuery = "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE order_id = ?"
    await db.query(updateQuery, [orderId])

    // If the order was paid, process refund logic here
    if (order.payment_status === "paid") {
      // Implement refund logic based on your payment provider
      console.log(`Order ${orderId} was paid. Refund should be processed.`)

      // Update payment status to refunded
      const updatePaymentQuery = "UPDATE orders SET payment_status = 'refunded' WHERE order_id = ?"
      await db.query(updatePaymentQuery, [orderId])
    }

    // Return the updated order
    const [updatedOrders] = await db.query(orderQuery, [orderId])

    return res.status(200).json({
      success: true,
      message: "Đơn hàng đã được hủy thành công",
      data: updatedOrders[0],
    })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return res.status(500).json({
      success: false,
      message: "Lỗi khi hủy đơn hàng",
      error: error.message,
    })
  }
}

module.exports = {
  getOrders,
  getOrderById,
  getMyOrders,
  createOrder,
  updateOrderStatus,
  cancelOrder,
}
