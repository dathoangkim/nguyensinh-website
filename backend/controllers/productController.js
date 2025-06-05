const productModel = require("../models/productModel")
const { pool } = require("../config/db") // Import pool từ module db

// @desc    Lấy tất cả sản phẩm
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { status, limit, featured } = req.query

    // Nếu có tham số featured=true, lấy sản phẩm có status='featured'
    const productStatus = featured === "true" ? "featured" : status

    const products = await productModel.getAllProducts(productStatus, limit)
    res.json(products)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    })
  }
}

// @desc    Lấy sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      })
    }

    res.json({
      success: true,
      data: product,
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

// @desc    Lấy sản phẩm theo danh mục
// @route   GET /api/products/category/:id
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const products = await productModel.getProductsByCategory(req.params.id)
    res.json({
      success: true,
      count: products.length,
      data: products,
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

// @desc    Tìm kiếm sản phẩm
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      })
    }

    const products = await productModel.searchProducts(keyword)
    res.json({
      success: true,
      count: products.length,
      data: products,
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

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      cost_price,
      category_id,
      stock_quantity,
      is_active,
      status,
      images,
      options,
    } = req.body

    const newProduct = await productModel.createProduct({
      name,
      slug,
      description,
      price,
      cost_price,
      category_id,
      stock_quantity,
      is_active,
      status,
      images,
      options,
    })

    res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: newProduct,
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

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, slug, description, price, cost_price, category_id, stock_quantity, is_active, status, images } =
      req.body

    // Kiểm tra xem sản phẩm có tồn tại không
    const existingProduct = await productModel.getProductById(req.params.id)

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      })
    }

    const updatedProduct = await productModel.updateProduct(req.params.id, {
      name,
      slug,
      description,
      price,
      cost_price,
      category_id,
      stock_quantity,
      is_active,
      status,
      images,
    })

    res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: updatedProduct,
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

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    // Kiểm tra xem sản phẩm có tồn tại không
    const existingProduct = await productModel.getProductById(req.params.id)

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      })
    }

    const result = await productModel.deleteProduct(req.params.id)

    if (result) {
      res.json({
        success: true,
        message: "Xóa sản phẩm thành công",
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Không thể xóa sản phẩm",
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    })
  }
}

// @desc    Lấy tùy chọn sản phẩm
// @route   GET /api/products/:id/options
// @access  Public
const getProductOptions = async (req, res) => {
  try {
    const productId = req.params.id

    // First, check if the product exists
    const productQuery = "SELECT * FROM products WHERE product_id = ?"
    const [product] = await pool.query(productQuery, [productId])

    if (!product || product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      })
    }

    // Lấy tất cả các tùy chọn của sản phẩm từ bảng product_options và options
    console.log("Đang lấy tùy chọn sản phẩm cho productId:", productId)
    const optionsQuery = `
      SELECT po.product_option_id, po.product_id, po.option_id, o.name, o.description
      FROM product_options po
      JOIN options o ON po.option_id = o.option_id
      WHERE po.product_id = ?
    `
    console.log("Query tùy chọn sản phẩm:", optionsQuery)
    const [options] = await pool.query(optionsQuery, [productId])
    console.log("Kết quả query tùy chọn sản phẩm:", options)

    if (!options || options.length === 0) {
      console.log("Không có tùy chọn sản phẩm cho productId:", productId)
      return res.status(200).json({
        success: true,
        data: [],
        message: "Sản phẩm này không có tùy chọn"
      })
    }

    // Lấy giá trị cho từng tùy chọn từ bảng option_values
    console.log("Đang lấy giá trị cho các tùy chọn sản phẩm")
    const optionsWithValues = await Promise.all(
      options.map(async (option) => {
        console.log("Đang lấy giá trị cho tùy chọn:", option)
        const valuesQuery = `
          SELECT value_id, option_id, value, additional_price
          FROM option_values
          WHERE option_id = ?
          ORDER BY additional_price ASC
        `
        console.log("Query giá trị tùy chọn:", valuesQuery, "với option_id:", option.option_id)
        const [values] = await pool.query(valuesQuery, [option.option_id])
        console.log("Kết quả query giá trị tùy chọn:", values)

        return {
          ...option,
          values: values || []
        }
      })
    )

    return res.status(200).json({
      success: true,
      data: optionsWithValues,
    })
  } catch (error) {
    console.error("Error fetching product options:", error)
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy tùy chọn sản phẩm",
      error: error.message,
    })
  }
}

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductOptions,
}
