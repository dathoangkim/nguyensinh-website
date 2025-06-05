const express = require('express');
const router = express.Router();
const { 
  getDashboardStats,
  getRecentOrders,
  getRecentReservations,
  getRevenueByMonth,
  getOrdersByStatus,
  getTopProducts
} = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/authMiddleware');

// Dashboard routes (all protected by admin middleware)
router.get('/stats', protect, admin, getDashboardStats);
router.get('/recent-orders', protect, admin, getRecentOrders);
router.get('/recent-reservations', protect, admin, getRecentReservations);

// Chart data routes
router.get('/revenue-by-month', protect, admin, getRevenueByMonth);
router.get('/orders-by-status', protect, admin, getOrdersByStatus);
router.get('/top-products', protect, admin, getTopProducts);

module.exports = router;