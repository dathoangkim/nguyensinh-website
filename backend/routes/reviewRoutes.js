const express = require("express")
const router = express.Router()
const {
  getAllReviews,
  getReviewById,
  getReviewsByProduct,
  getReviewsByUser,
  createReview,
  updateReview,
  deleteReview,
  getProductReviewStats,
} = require("../controllers/reviewController")
const { protect, admin } = require("../middleware/authMiddleware")

// Lấy tất cả đánh giá (Admin)
router.get("/", protect, admin, getAllReviews)

// Lấy đánh giá theo ID
router.get("/:id", getReviewById)

// Lấy đánh giá theo sản phẩm
router.get("/product/:productId", getReviewsByProduct)

// Lấy thống kê đánh giá cho sản phẩm
router.get("/stats/product/:productId", getProductReviewStats)

// Lấy đánh giá của người dùng hiện tại
router.get("/user/me", protect, getReviewsByUser)

// Lấy đánh giá theo người dùng (Admin)
router.get("/user/:userId", protect, admin, getReviewsByUser)

// Tạo đánh giá mới
router.post("/", protect, createReview)

// Cập nhật đánh giá
router.put("/:id", protect, updateReview)

// Xóa đánh giá
router.delete("/:id", protect, deleteReview)

module.exports = router
