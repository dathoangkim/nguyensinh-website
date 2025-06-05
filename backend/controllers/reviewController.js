const reviewModel = require("../models/reviewModel")

// Lấy tất cả đánh giá
const getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.getAllReviews()
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    })
  } catch (error) {
    console.error("Error in getAllReviews:", error)
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách đánh giá",
      error: error.message,
    })
  }
}

// Lấy đánh giá theo ID
const getReviewById = async (req, res) => {
  try {
    const review = await reviewModel.getReviewById(req.params.id)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      })
    }

    res.status(200).json({
      success: true,
      data: review,
    })
  } catch (error) {
    console.error("Error in getReviewById:", error)
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin đánh giá",
      error: error.message,
    })
  }
}

// Lấy đánh giá theo sản phẩm
const getReviewsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId
    const reviews = await reviewModel.getReviewsByProduct(productId)

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    })
  } catch (error) {
    console.error("Error in getReviewsByProduct:", error)
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách đánh giá theo sản phẩm",
      error: error.message,
    })
  }
}

// Lấy đánh giá theo người dùng
const getReviewsByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.user_id
    const reviews = await reviewModel.getReviewsByUser(userId)

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    })
  } catch (error) {
    console.error("Error in getReviewsByUser:", error)
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách đánh giá theo người dùng",
      error: error.message,
    })
  }
}

// Tạo đánh giá mới
const createReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body

    // Kiểm tra dữ liệu đầu vào
    if (!product_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin: product_id, rating",
      })
    }

    // Lấy user_id từ user đã đăng nhập
    const user_id = req.user.user_id

    const newReview = await reviewModel.createReview({
      user_id,
      product_id,
      rating,
      comment,
    })

    res.status(201).json({
      success: true,
      data: newReview,
    })
  } catch (error) {
    console.error("Error in createReview:", error)
    res.status(500).json({
      success: false,
      message: "Không thể tạo đánh giá mới",
      error: error.message,
    })
  }
}

// Cập nhật đánh giá
const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id
    const { rating, comment } = req.body

    // Kiểm tra quyền sở hữu đánh giá
    const review = await reviewModel.getReviewById(reviewId)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      })
    }

    if (review.user_id !== req.user.user_id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật đánh giá này",
      })
    }

    const updatedReview = await reviewModel.updateReview(reviewId, {
      rating,
      comment,
    })

    res.status(200).json({
      success: true,
      data: updatedReview,
    })
  } catch (error) {
    console.error("Error in updateReview:", error)
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật đánh giá",
      error: error.message,
    })
  }
}

// Xóa đánh giá
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id

    // Kiểm tra quyền sở hữu đánh giá
    const review = await reviewModel.getReviewById(reviewId)

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      })
    }

    if (review.user_id !== req.user.user_id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa đánh giá này",
      })
    }

    const success = await reviewModel.deleteReview(reviewId)

    res.status(200).json({
      success: true,
      message: "Đã xóa đánh giá thành công",
    })
  } catch (error) {
    console.error("Error in deleteReview:", error)
    res.status(500).json({
      success: false,
      message: "Không thể xóa đánh giá",
      error: error.message,
    })
  }
}

// Lấy thống kê đánh giá cho sản phẩm
const getProductReviewStats = async (req, res) => {
  try {
    const productId = req.params.productId
    const stats = await reviewModel.getProductReviewStats(productId)

    res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Error in getProductReviewStats:", error)
    res.status(500).json({
      success: false,
      message: "Không thể lấy thống kê đánh giá",
      error: error.message,
    })
  }
}

module.exports = {
  getAllReviews,
  getReviewById,
  getReviewsByProduct,
  getReviewsByUser,
  createReview,
  updateReview,
  deleteReview,
  getProductReviewStats,
}
