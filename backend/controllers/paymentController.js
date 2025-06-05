const paymentModel = require('../models/paymentModel');
const orderModel = require('../models/orderModel');

// @desc    Lấy tất cả thanh toán
// @route   GET /api/payments
// @access  Admin
const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentModel.getAllPayments();
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error in getAllPayments:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách thanh toán',
      error: error.message
    });
  }
};

// @desc    Lấy thanh toán theo ID
// @route   GET /api/payments/:id
// @access  Admin
const getPaymentById = async (req, res) => {
  try {
    const payment = await paymentModel.getPaymentById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error in getPaymentById:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin thanh toán',
      error: error.message
    });
  }
};

// @desc    Lấy thanh toán theo đơn hàng
// @route   GET /api/payments/order/:orderId
// @access  Private
const getPaymentByOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    const order = await orderModel.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    if (order.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập thông tin thanh toán này'
      });
    }
    
    const payment = await paymentModel.getPaymentByOrder(orderId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán cho đơn hàng này'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error in getPaymentByOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin thanh toán',
      error: error.message
    });
  }
};

// @desc    Lấy thanh toán của người dùng hiện tại
// @route   GET /api/payments/user
// @access  Private
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const payments = await paymentModel.getPaymentsByUser(userId);
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error in getMyPayments:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách thanh toán của bạn',
      error: error.message
    });
  }
};

// @desc    Tạo thanh toán mới
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { order_id, provider, provider_transaction_id, amount } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!order_id || !provider || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: order_id, provider, amount'
      });
    }
    
    // Kiểm tra xem đơn hàng có tồn tại không
    const order = await orderModel.getOrderById(order_id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    if (order.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền tạo thanh toán cho đơn hàng này'
      });
    }
    
    // Kiểm tra xem đơn hàng đã có thanh toán chưa
    const existingPayment = await paymentModel.getPaymentByOrder(order_id);
    
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng này đã có thanh toán'
      });
    }
    
    const newPayment = await paymentModel.createPayment({
      order_id,
      provider,
      provider_transaction_id,
      amount,
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo thanh toán thành công',
      data: newPayment
    });
  } catch (error) {
    console.error('Error in createPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo thanh toán mới',
      error: error.message
    });
  }
};

// @desc    Cập nhật trạng thái thanh toán
// @route   PUT /api/payments/:id/status
// @access  Admin/Private (Webhook)
const updatePaymentStatus = async (req, res) => {
  try {
    const { status, provider_transaction_id } = req.body;
    
    if (!status || !['pending', 'success', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái hợp lệ: pending, success, failed'
      });
    }
    
    const payment = await paymentModel.getPaymentById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán'
      });
    }
    
    // Cập nhật trạng thái thanh toán
    const updatedPayment = await paymentModel.updatePaymentStatus(
      req.params.id,
      status,
      provider_transaction_id
    );
    
    // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng
    if (status === 'success') {
      await orderModel.updateOrderStatus(payment.order_id, 'confirmed');
    }
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái thanh toán',
      error: error.message
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentByOrder,
  getMyPayments,
  createPayment,
  updatePaymentStatus
};