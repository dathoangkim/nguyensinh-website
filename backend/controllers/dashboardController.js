const { pool } = require('../config/db');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total orders
    const [ordersResult] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders');
    const totalOrders = ordersResult[0]?.totalOrders || 0;

    // Get total revenue
    const [revenueResult] = await pool.query('SELECT SUM(total_amount) as totalRevenue FROM orders WHERE status != "cancelled"');
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Get total users
    const [usersResult] = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE role = "customer"');
    const totalUsers = usersResult[0]?.totalUsers || 0;

    // Get total products
    const [productsResult] = await pool.query('SELECT COUNT(*) as totalProducts FROM products');
    const totalProducts = productsResult[0]?.totalProducts || 0;

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalUsers,
        totalProducts
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thống kê tổng quan',
      error: error.message 
    });
  }
};

// Get recent orders
const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const [orders] = await pool.query(`
      SELECT o.*, u.username as userName, u.email as userEmail
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);

    // Format orders
    const formattedOrders = orders.map(order => ({
      id: order.order_id,
      user: order.user_id ? {
        id: order.user_id,
        userName: order.userName,
        email: order.userEmail
      } : null,
      totalAmount: order.total_amount,
      status: order.status,
      createdAt: order.created_at
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders
      }
    });
  } catch (error) {
    console.error('Error getting recent orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy đơn hàng gần đây',
      error: error.message
    });
  }
};

// Get recent reservations
const getRecentReservations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const [reservations] = await pool.query(`
      SELECT * FROM reservations
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);

    // Format reservations
    const formattedReservations = reservations.map(reservation => ({
      id: reservation.reservation_id,
      customerName: reservation.full_name,
      customerPhone: reservation.phone,
      date: reservation.reservation_date,
      time: reservation.reservation_time,
      numberOfPeople: reservation.guests,
      status: reservation.status,
      note: reservation.notes,
      createdAt: reservation.created_at
    }));

    res.status(200).json({
      success: true,
      data: {
        reservations: formattedReservations
      }
    });
  } catch (error) {
    console.error('Error getting recent reservations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy đặt bàn gần đây',
      error: error.message
    });
  }
};

// Get revenue by month
const getRevenueByMonth = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Query to get revenue by month for the specified year
    const [results] = await pool.query(`
      SELECT 
        MONTH(created_at) as month,
        SUM(total_amount) as revenue
      FROM orders
      WHERE 
        YEAR(created_at) = ? 
        AND status != 'cancelled'
      GROUP BY MONTH(created_at)
      ORDER BY month
    `, [year]);
    
    // Initialize array with all months (1-12)
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    // Initialize revenues with 0 for all months
    const revenues = Array(12).fill(0);
    
    // Fill in actual revenue data
    results.forEach(row => {
      const monthIndex = row.month - 1; // Convert 1-based month to 0-based index
      revenues[monthIndex] = parseFloat(row.revenue) || 0;
    });
    
    res.status(200).json({
      success: true,
      data: {
        months,
        revenues
      }
    });
  } catch (error) {
    console.error('Error getting revenue by month:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy doanh thu theo tháng',
      error: error.message
    });
  }
};

// Get orders by status
const getOrdersByStatus = async (req, res) => {
  try {
    // Query to get count of orders by status
    const [results] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);
    
    // Map database status to display status
    const statusMap = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'shipped': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    
    // Initialize with default statuses
    const defaultStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const statuses = [];
    const counts = [];
    
    // Create a map to store counts by status
    const statusCounts = {};
    results.forEach(row => {
      statusCounts[row.status] = parseInt(row.count);
    });
    
    // Fill in data for default statuses first
    defaultStatuses.forEach(status => {
      statuses.push(statusMap[status] || status);
      counts.push(statusCounts[status] || 0);
    });
    
    // Add any additional statuses not in the default list
    results.forEach(row => {
      if (!defaultStatuses.includes(row.status)) {
        statuses.push(statusMap[row.status] || row.status);
        counts.push(parseInt(row.count));
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        statuses,
        counts
      }
    });
  } catch (error) {
    console.error('Error getting orders by status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy đơn hàng theo trạng thái',
      error: error.message
    });
  }
};

// Get top selling products
const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Query to get top selling products
    const [results] = await pool.query(`
      SELECT 
        p.product_id,
        p.name,
        SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'cancelled'
      GROUP BY p.product_id
      ORDER BY total_quantity DESC
      LIMIT ?
    `, [limit]);
    
    const products = [];
    const quantities = [];
    
    results.forEach(row => {
      products.push(row.name);
      quantities.push(parseInt(row.total_quantity));
    });
    
    // If we have fewer than the limit, pad with empty data
    while (products.length < limit) {
      products.push(`Sản phẩm ${products.length + 1}`);
      quantities.push(0);
    }
    
    res.status(200).json({
      success: true,
      data: {
        products,
        quantities
      }
    });
  } catch (error) {
    console.error('Error getting top products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy sản phẩm bán chạy',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders,
  getRecentReservations,
  getRevenueByMonth,
  getOrdersByStatus,
  getTopProducts
};