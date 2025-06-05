const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  getUserProfile, 
  updateUser, 
  updateUserProfile, 
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Các routes cho người dùng
router.route('/')
  .get(protect, admin, getUsers);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/stats')
  .get(protect, admin, getUserStats);

router.route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
