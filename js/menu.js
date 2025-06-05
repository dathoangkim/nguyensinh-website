// Hàm để lấy dữ liệu từ API
async function fetchData(url, options = {}) {
  // Kiểm tra nếu là API wishlist và người dùng chưa đăng nhập
  if (url.includes("/api/wishlist") && !isUserLoggedIn()) {
    // Trả về kết quả giả lập thay vì gọi API
    return {
      success: false,
      message: "Unauthorized",
      requireLogin: true,
      data: [],
    }
  }

  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      // Nếu là lỗi 401 và liên quan đến wishlist, xử lý im lặng
      if (response.status === 401 && url.includes("/api/wishlist")) {
        return {
          success: false,
          message: "Unauthorized",
          requireLogin: true,
          data: [],
        }
      }
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const data = await response.json()

    // Kiểm tra xem response có cấu trúc { success, data } không
    if (data && typeof data === "object" && "success" in data) {
      return data // Trả về nguyên trạng nếu đã có cấu trúc { success, data }
    } else {
      // Nếu là mảng hoặc object khác, bọc lại trong cấu trúc { success: true, data }
      return { success: true, data: data }
    }
  } catch (error) {
    // Nếu là lỗi liên quan đến wishlist và người dùng chưa đăng nhập, xử lý im lặng
    if (url.includes("/api/wishlist") && !isUserLoggedIn()) {
      console.debug(`Bỏ qua lỗi wishlist (người dùng chưa đăng nhập):`, error)
      return {
        success: false,
        message: "Unauthorized",
        requireLogin: true,
        data: [],
      }
    }

    console.error(`Lỗi khi lấy dữ liệu từ ${url}:`, error)
    return { success: false, data: [] }
  }
}

// Hàm định dạng tiền tệ Việt Nam
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Hàm tạo HTML cho các nút danh mục
function renderCategoryButtons(categories) {
  const categoriesContainer = document.querySelector(".menu-categories")
  if (!categoriesContainer) return

  // Xóa các nút hiện tại
  categoriesContainer.innerHTML = ""

  // Thêm nút 'Tất cả'
  const allButton = document.createElement("button")
  allButton.className = "category-btn active"
  allButton.dataset.category = "all"
  allButton.innerHTML = '<span>Tất Cả</span>'
  categoriesContainer.appendChild(allButton)

  // Thêm các nút danh mục từ API
  categories.forEach((category) => {
    const button = document.createElement("button")
    button.className = "category-btn"
    button.dataset.category = category.slug
    button.innerHTML = `<span>${category.name}</span>`
    categoriesContainer.appendChild(button)
  })

  // Thêm sự kiện click cho các nút
  attachCategoryButtonEvents()
}

// Hàm gắn sự kiện cho các nút danh mục
function attachCategoryButtonEvents() {
  const categoryButtons = document.querySelectorAll(".category-btn")

  categoryButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      // Loại bỏ class active từ tất cả các nút
      categoryButtons.forEach((btn) => btn.classList.remove("active"))

      // Thêm class active cho nút được click
      button.classList.add("active")

      const selectedCategory = button.dataset.category
      console.log("Đã chọn danh mục:", selectedCategory)

      // Hiển thị loading state
      showLoadingState()

      // Tải sản phẩm theo danh mục đã chọn
      if (selectedCategory === "all") {
        await loadProductsForCategory(0, "all")
      } else {
        await loadProductsForCategory(0, selectedCategory)
      }
    })
  })
}

// Hàm hiển thị loading state
function showLoadingState() {
  const menuItemsContainer = document.querySelector(".menu-items")
  const loadingState = document.getElementById("loadingState")
  const emptyState = document.getElementById("emptyState")
  
  if (menuItemsContainer) menuItemsContainer.style.display = "none"
  if (emptyState) emptyState.style.display = "none"
  if (loadingState) loadingState.style.display = "block"
}

// Hàm ẩn loading state
function hideLoadingState() {
  const menuItemsContainer = document.querySelector(".menu-items")
  const loadingState = document.getElementById("loadingState")
  
  if (loadingState) loadingState.style.display = "none"
  if (menuItemsContainer) menuItemsContainer.style.display = "block"
}

// Hàm hiển thị empty state
function showEmptyState() {
  const menuItemsContainer = document.querySelector(".menu-items")
  const loadingState = document.getElementById("loadingState")
  const emptyState = document.getElementById("emptyState")
  
  if (loadingState) loadingState.style.display = "none"
  if (menuItemsContainer) menuItemsContainer.style.display = "none"
  if (emptyState) emptyState.style.display = "block"
}

// Hàm tạo HTML cho sản phẩm theo danh mục
function renderProductsByCategory(products, categories) {
  const menuItemsContainer = document.querySelector(".menu-items")
  if (!menuItemsContainer) return

  // Ẩn loading state
  hideLoadingState()

  // Xóa các mục hiện tại
  menuItemsContainer.innerHTML = ""

  // Kiểm tra nếu không có sản phẩm
  if (!products || products.length === 0) {
    showEmptyState()
    return
  }

  console.log("Đang render", products.length, "sản phẩm theo", categories.length, "danh mục")

  // Nhóm sản phẩm theo danh mục
  const productsByCategory = {}

  // Khởi tạo danh mục
  categories.forEach((category) => {
    productsByCategory[category.category_id] = {
      category,
      products: [],
    }
  })

  // Thêm sản phẩm vào danh mục tương ứng
  let productsWithoutCategory = 0
  products.forEach((product) => {
    if (productsByCategory[product.category_id]) {
      productsByCategory[product.category_id].products.push(product)
    } else {
      productsWithoutCategory++
      console.warn(`Sản phẩm có category_id=${product.category_id} không khớp với bất kỳ danh mục nào`, product)
    }
  })

  console.log(`Có ${productsWithoutCategory} sản phẩm không thuộc danh mục nào`)

  // Đếm số danh mục có sản phẩm
  const categoriesWithProducts = Object.values(productsByCategory).filter((cat) => cat.products.length > 0)
  console.log(`Có ${categoriesWithProducts.length} danh mục có sản phẩm`)

  if (categoriesWithProducts.length === 0) {
    showEmptyState()
    return
  }

  // Tạo HTML cho từng danh mục và sản phẩm với animation delay
  let animationDelay = 0
  Object.values(productsByCategory).forEach((categoryData) => {
    const { category, products } = categoryData
    if (products.length === 0) return // Bỏ qua danh mục không có sản phẩm

    const categoryDiv = document.createElement("div")
    categoryDiv.className = "menu-category"
    categoryDiv.id = category.slug
    categoryDiv.style.animationDelay = `${animationDelay}s`

    const titleDiv = document.createElement("div")
    titleDiv.className = "menu-category-title"
    titleDiv.innerHTML = `<h3>${category.name}</h3>`
    categoryDiv.appendChild(titleDiv)

    const gridDiv = document.createElement("div")
    gridDiv.className = "menu-grid"

    products.forEach((product, index) => {
      const productCard = createProductCard(product)
      productCard.style.animationDelay = `${animationDelay + (index * 0.1)}s`
      gridDiv.appendChild(productCard)
    })

    categoryDiv.appendChild(gridDiv)
    menuItemsContainer.appendChild(categoryDiv)
    
    animationDelay += 0.2
  })
}

// Hàm tạo HTML cho một sản phẩm
function createProductCard(product) {
  const itemDiv = document.createElement("div")
  itemDiv.className = "menu-item"
  itemDiv.dataset.productId = product.product_id

  // Xác định URL ảnh từ các trường có thể có
  const imageUrl = product.image_url || product.main_image || "/img/_12A7780.jpg"

  // Log để debug
  console.log(`Sản phẩm ${product.name} - URL ảnh: ${imageUrl}`)

  // Tạo badge nếu sản phẩm có đặc điểm nổi bật
  const badge = product.is_popular ? '<div class="menu-item-badge">Phổ biến</div>' : 
               product.is_new ? '<div class="menu-item-badge">Mới</div>' : ''

  // Tạo rating stars
  const rating = product.rating || 4.5
  const ratingStars = generateRatingStars(rating)

  // Tạo tags
  const tags = product.tags ? product.tags.split(',').map(tag => 
    `<span class="menu-item-tag">${tag.trim()}</span>`
  ).join('') : ''

  itemDiv.innerHTML = `
        <div class="menu-item-image">
            <img src="${imageUrl}" alt="${product.name}" onerror="this.src='/img/_12A7780.jpg'">
            ${badge}
        </div>
        <div class="menu-item-info">
            <div class="menu-item-header">
                <h4 class="menu-item-title">${product.name}</h4>
                <span class="menu-item-price">${formatCurrency(product.price)}</span>
            </div>
            <p class="menu-item-description">${product.description || "Không có mô tả"}</p>
            <div class="menu-item-meta">
                <div class="menu-item-rating">
                    ${ratingStars}
                    <span class="rating-text">(${rating})</span>
                </div>
                <span class="menu-item-time">15-20 phút</span>
            </div>
            ${tags ? `<div class="menu-item-tags">${tags}</div>` : ''}
            <div class="menu-item-actions">
                <div class="quantity-selector">
                    <button class="quantity-btn decrease">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="quantity-input" value="1" min="1" max="99">
                    <button class="quantity-btn increase">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="add-to-cart-btn" data-product-id="${product.product_id}">
                    <i class="fas fa-cart-plus"></i>
                    Thêm vào giỏ
                </button>
            </div>
        </div>
    `

  // Thêm sự kiện click để chuyển đến trang chi tiết sản phẩm
  const productImage = itemDiv.querySelector(".menu-item-image")
  const productTitle = itemDiv.querySelector(".menu-item-title")

  const clickHandler = () => {
    window.location.href = `product-detail.html?id=${product.product_id}`
  }

  productImage.addEventListener("click", clickHandler)
  productTitle.addEventListener("click", clickHandler)

  // Thêm style để hiển thị cursor pointer khi hover
  productImage.style.cursor = "pointer"
  productTitle.style.cursor = "pointer"

  return itemDiv
}

// Hàm tạo rating stars
function generateRatingStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
  
  let starsHtml = ''
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>'
  }
  
  // Half star
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>'
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>'
  }
  
  return starsHtml
}

// Hàm gắn sự kiện cho các nút số lượng và thêm vào giỏ
function attachProductEvents() {
  // Xử lý nút tăng giảm số lượng
  document.querySelectorAll(".quantity-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.parentElement.querySelector(".quantity-input")
      const isDecrease = this.classList.contains("decrease")
      const isIncrease = this.classList.contains("increase")
      
      if (isDecrease && input.value > 1) {
        input.value = parseInt(input.value) - 1
      } else if (isIncrease) {
        input.value = parseInt(input.value) + 1
      }
    })
  })

  // Xử lý nút thêm vào giỏ
  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.dataset.productId
      const quantityInput = this.closest(".menu-item-actions").querySelector(".quantity-input")
      const quantity = parseInt(quantityInput.value)

        // Thêm hiệu ứng loading cho button
      const originalText = this.innerHTML
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang thêm...'
      this.disabled = true

      // Simulate loading time
      setTimeout(() => {
        addToCart(productId, quantity)
        
        // Reset button
        this.innerHTML = originalText
        this.disabled = false
        
        // Thêm hiệu ứng thành công
        this.innerHTML = '<i class="fas fa-check"></i> Đã thêm!'
        this.style.background = '#28a745'
        
        setTimeout(() => {
          this.innerHTML = originalText
          this.style.background = ''
        }, 1500)
      }, 500)
    })
  })

  // Xử lý nút thêm vào danh sách yêu thích
  document.querySelectorAll(".add-to-wishlist").forEach((button) => {
    const productId = button.dataset.productId

    // Chỉ kiểm tra trạng thái yêu thích nếu người dùng đã đăng nhập
    if (typeof window.wishlistFunctions !== "undefined" && isUserLoggedIn()) {
      window.wishlistFunctions
        .checkWishlistItem(productId)
        .then((isInWishlist) => {
          if (isInWishlist) {
            button.innerHTML = '<i class="fas fa-heart"></i>'
            button.classList.add("in-wishlist")
          }
        })
        .catch((error) => {
          // Xử lý lỗi một cách im lặng, không hiển thị lỗi trong console
          console.debug("Không thể kiểm tra trạng thái yêu thích:", error)
        })
    }

    // Thêm sự kiện click
    button.addEventListener("click", async function () {
      if (typeof window.wishlistFunctions === "undefined") {
        alert("Chức năng yêu thích chưa được tải. Vui lòng tải lại trang.")
        return
      }

      // Kiểm tra đăng nhập trước khi thực hiện thao tác
      if (!isUserLoggedIn()) {
        if (confirm("Bạn cần đăng nhập để sử dụng tính năng yêu thích. Đến trang đăng nhập ngay?")) {
          // Lưu URL hiện tại để sau khi đăng nhập có thể quay lại
          localStorage.setItem("redirectAfterLogin", window.location.href)
          window.location.href = "account.html"
        }
        return
      }

      try {
        const isInWishlist = this.classList.contains("in-wishlist")

        if (!isInWishlist) {
          // Thêm vào danh sách yêu thích
          const result = await window.wishlistFunctions.addToWishlist(productId)

          if (result.success) {
            this.innerHTML = '<i class="fas fa-heart"></i>'
            this.classList.add("in-wishlist")
            showToast("Đã thêm sản phẩm vào danh sách yêu thích!")
          } else {
            showToast(`Không thể thêm vào danh sách yêu thích: ${result.message}`, "error")
          }
        } else {
          // Xóa khỏi danh sách yêu thích
          const result = await window.wishlistFunctions.removeFromWishlist(productId)

          if (result.success) {
            this.innerHTML = '<i class="far fa-heart"></i>'
            this.classList.remove("in-wishlist")
            showToast("Đã xóa sản phẩm khỏi danh sách yêu thích!")
          } else {
            showToast(`Không thể xóa khỏi danh sách yêu thích: ${result.message}`, "error")
          }
        }
      } catch (error) {
        console.error("Lỗi khi thao tác với danh sách yêu thích:", error)
        showToast("Đã xảy ra lỗi khi thao tác với danh sách yêu thích", "error")
      }
    })
  })
}

// Hàm kiểm tra người dùng đã đăng nhập chưa
function isUserLoggedIn() {
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user"))
  return !!token && !!user
}

// Hàm hiển thị thông báo toast với hiệu ứng nâng cao
function showToast(message, type = "success") {
  // Tạo phần tử toast nếu chưa có
  let toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.className = "toast-container"
    document.body.appendChild(toastContainer)

    // Thêm CSS cho toast với hiệu ứng nâng cao
    const style = document.createElement("style")
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
      }
      .toast {
        padding: 15px 25px;
        margin-bottom: 10px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        opacity: 0;
        transform: translateX(100%) scale(0.8);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
      }
      .toast.success {
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      }
      .toast.error {
        background: linear-gradient(135deg, #F44336 0%, #d32f2f 100%);
      }
      .toast.info {
        background: linear-gradient(135deg, #2196F3 0%, #1976d2 100%);
      }
      .toast.show {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
      .toast-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: 15px;
        padding: 5px;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }
      .toast-close:hover {
        background-color: rgba(255,255,255,0.2);
      }
      .toast-icon {
        margin-right: 10px;
        font-size: 18px;
      }
    `
    document.head.appendChild(style)
  }

  // Tạo icon cho toast
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  }

  // Tạo toast mới
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.innerHTML = `
    <div style="display: flex; align-items: center;">
      <i class="toast-icon ${icons[type]}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `
  toastContainer.appendChild(toast)

  // Hiển thị toast với hiệu ứng
  setTimeout(() => {
    toast.classList.add("show")
  }, 10)

  // Thêm sự kiện đóng toast
  const closeButton = toast.querySelector(".toast-close")
  closeButton.addEventListener("click", () => {
    toast.classList.remove("show")
    setTimeout(() => {
      toast.remove()
    }, 400)
  })

  // Tự động đóng sau 4 giây
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove("show")
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove()
        }
      }, 400)
    }
  }, 4000)
}

// Hàm thêm sản phẩm vào giỏ hàng
function addToCart(productId, quantity) {
  // Lấy giỏ hàng từ localStorage hoặc tạo mới nếu chưa có
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")

  // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
  const existingProductIndex = cart.findIndex((item) => item.productId === productId)

  if (existingProductIndex !== -1) {
    // Nếu đã có, cập nhật số lượng
    cart[existingProductIndex].quantity += quantity
  } else {
    // Nếu chưa có, thêm mới
    cart.push({
      productId,
      quantity,
    })
  }

  // Lưu giỏ hàng vào localStorage
  localStorage.setItem("cart", JSON.stringify(cart))

  // Thông báo cho người dùng
  showToast("Đã thêm sản phẩm vào giỏ hàng!")

  // Cập nhật hiển thị giỏ hàng nếu có
  updateCartDisplay()
}

// Hàm cập nhật hiển thị giỏ hàng với hiệu ứng
function updateCartDisplay() {
  // Có thể triển khai sau để hiển thị số lượng sản phẩm trong giỏ hàng
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Nếu có phần tử hiển thị số lượng giỏ hàng, cập nhật nó với hiệu ứng
  const cartCountElement = document.querySelector("#cart-count")
  if (cartCountElement) {
    // Thêm hiệu ứng bounce khi cập nhật
    cartCountElement.style.transform = "scale(1.3)"
    cartCountElement.style.transition = "transform 0.2s ease"
    cartCountElement.textContent = totalItems
    
    setTimeout(() => {
      cartCountElement.style.transform = "scale(1)"
    }, 200)
  }
}

// Hàm render sản phẩm khi chọn danh mục
async function loadProductsForCategory(categoryId, categorySlug) {
  // Hiển thị loading
  showLoadingState()

  try {
    // Lấy tất cả danh mục trước
    const categoriesResponse = await fetchData("http://localhost:5000/api/categories")
    if (!categoriesResponse.success) {
      throw new Error("Không thể lấy dữ liệu danh mục từ API")
    }
    const categories = categoriesResponse.data
    console.log("Danh mục:", categories)

    let products

    if (categorySlug === "all") {
      // Nếu là "Tất cả", lấy tất cả sản phẩm
      const response = await fetchData("http://localhost:5000/api/products")
      if (!response.success) {
        throw new Error("Không thể lấy dữ liệu sản phẩm từ API")
      }
      products = response.data
      console.log("Tất cả sản phẩm:", products.length)

      // Hiển thị tất cả sản phẩm theo danh mục
      renderProductsByCategory(products, categories)
    } else {
      // Tìm danh mục hiện tại
      const currentCategory = categories.find((cat) => cat.slug === categorySlug)
      if (!currentCategory) {
        hideLoadingState()
        showEmptyState()
        return
      }

      // Nếu là danh mục cụ thể, lấy sản phẩm của danh mục đó
      const response = await fetchData(`http://localhost:5000/api/products/category/${currentCategory.category_id}`)
      if (!response.success) {
        throw new Error(`Không thể lấy sản phẩm cho danh mục ${currentCategory.name}`)
      }
      products = response.data
      console.log(`Sản phẩm của danh mục ${currentCategory.name}:`, products.length)

      // Ẩn loading state
      hideLoadingState()

      // Hiển thị chỉ sản phẩm của danh mục được chọn
      const menuItemsContainer = document.querySelector(".menu-items")
      menuItemsContainer.innerHTML = ""

      if (products.length === 0) {
        showEmptyState()
        return
      }

      const categoryDiv = document.createElement("div")
      categoryDiv.className = "menu-category"
      categoryDiv.id = categorySlug

      const titleDiv = document.createElement("div")
      titleDiv.className = "menu-category-title"
      titleDiv.innerHTML = `<h3>${currentCategory.name}</h3>`
      categoryDiv.appendChild(titleDiv)

      const gridDiv = document.createElement("div")
      gridDiv.className = "menu-grid"

      products.forEach((product, index) => {
        const productCard = createProductCard(product)
        productCard.style.animationDelay = `${index * 0.1}s`
        gridDiv.appendChild(productCard)
      })

      categoryDiv.appendChild(gridDiv)
      menuItemsContainer.appendChild(categoryDiv)
    }

    // Gắn sự kiện cho các sản phẩm mới
    attachProductEvents()
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm theo danh mục:", error)
    hideLoadingState()
    const menuItemsContainer = document.querySelector(".menu-items")
    menuItemsContainer.innerHTML = '<div class="error">Có lỗi xảy ra khi tải sản phẩm: ' + error.message + "</div>"
    menuItemsContainer.style.display = "block"
  }
}

// Hàm khởi tạo search và filter functionality
function initSearchAndFilter() {
  const searchInput = document.getElementById("searchInput")
  const searchBtn = document.getElementById("searchBtn")
  const sortSelect = document.getElementById("sortSelect")
  const viewBtns = document.querySelectorAll(".view-btn")

  // Search functionality
  if (searchInput && searchBtn) {
    const performSearch = () => {
      const searchTerm = searchInput.value.toLowerCase().trim()
      const menuItems = document.querySelectorAll(".menu-item")
      let visibleCount = 0

      menuItems.forEach(item => {
        const title = item.querySelector(".menu-item-title").textContent.toLowerCase()
        const description = item.querySelector(".menu-item-description").textContent.toLowerCase()
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
          item.style.display = "block"
          item.style.animation = "fadeInUp 0.5s ease-out"
          visibleCount++
        } else {
          item.style.display = "none"
        }
      })

      // Hiển thị/ẩn empty state
      if (visibleCount === 0 && searchTerm !== "") {
        showEmptyState()
      } else {
        document.getElementById("emptyState").style.display = "none"
        document.querySelector(".menu-items").style.display = "block"
      }
    }

    searchInput.addEventListener("input", performSearch)
    searchBtn.addEventListener("click", performSearch)
    
    // Enter key support
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch()
      }
    })
  }

  // Sort functionality
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const sortValue = sortSelect.value
      const menuCategories = document.querySelectorAll(".menu-category")
      
      menuCategories.forEach(category => {
        const menuGrid = category.querySelector(".menu-grid")
        const menuItems = Array.from(menuGrid.querySelectorAll(".menu-item"))
        
        menuItems.sort((a, b) => {
          switch (sortValue) {
            case "name":
              const nameA = a.querySelector(".menu-item-title").textContent
              const nameB = b.querySelector(".menu-item-title").textContent
              return nameA.localeCompare(nameB, 'vi')
              
            case "price-low":
              const priceA = parseFloat(a.querySelector(".menu-item-price").textContent.replace(/[^\d]/g, ''))
              const priceB = parseFloat(b.querySelector(".menu-item-price").textContent.replace(/[^\d]/g, ''))
              return priceA - priceB
              
            case "price-high":
              const priceA2 = parseFloat(a.querySelector(".menu-item-price").textContent.replace(/[^\d]/g, ''))
              const priceB2 = parseFloat(b.querySelector(".menu-item-price").textContent.replace(/[^\d]/g, ''))
              return priceB2 - priceA2
              
            case "rating":
              const ratingA = parseFloat(a.querySelector(".rating-text")?.textContent.replace(/[^\d.]/g, '') || 0)
              const ratingB = parseFloat(b.querySelector(".rating-text")?.textContent.replace(/[^\d.]/g, '') || 0)
              return ratingB - ratingA
              
            default:
              return 0
          }
        })
        
        // Re-append sorted items with stagger animation
        menuItems.forEach((item, index) => {
          item.style.animation = `slideInUp 0.5s ease-out ${index * 0.1}s both`
          menuGrid.appendChild(item)
        })
      })
    })
  }

  // View toggle functionality
  viewBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      viewBtns.forEach(b => b.classList.remove("active"))
      btn.classList.add("active")
      
      const viewType = btn.dataset.view
      const menuGrids = document.querySelectorAll(".menu-grid")
      
      menuGrids.forEach(grid => {
        if (viewType === "list") {
          grid.classList.add("list-view")
        } else {
          grid.classList.remove("list-view")
        }
      })
    })
  })
}

// Hàm khởi tạo hero stats animation
function initHeroStats() {
  const heroStats = document.querySelectorAll(".hero-stat-number")
  
  const animateCounter = (element) => {
    const target = parseInt(element.dataset.count)
    const duration = 2000
    const step = target / (duration / 16)
    let current = 0
    
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      
      if (target === 100) {
        element.textContent = Math.floor(current) + "%"
      } else {
        element.textContent = Math.floor(current) + "+"
      }
    }, 16)
  }
  
  // Intersection Observer để trigger animation khi scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statNumber = entry.target.querySelector(".hero-stat-number")
        if (statNumber && !statNumber.classList.contains("animated")) {
          statNumber.classList.add("animated")
          animateCounter(statNumber)
        }
      }
    })
  })
  
  document.querySelectorAll(".hero-stat").forEach(stat => {
    observer.observe(stat)
  })
}

// Hàm khởi tạo scroll animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)
  
  // Observe elements that should animate on scroll
  const animateElements = document.querySelectorAll(".menu-category, .section-header, .menu-controls")
  animateElements.forEach(el => {
    el.style.opacity = "0"
    el.style.transform = "translateY(30px)"
    el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out"
    observer.observe(el)
  })
}

// Hàm khởi tạo parallax effect cho hero
function initParallaxEffect() {
  const hero = document.querySelector(".menu-hero")
  if (!hero) return
  
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset
    const rate = scrolled * -0.5
    hero.style.transform = `translateY(${rate}px)`
  })
}

// Hàm khởi tạo smooth scroll cho category navigation
function initSmoothScroll() {
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const categorySlug = btn.dataset.category
      if (categorySlug !== "all") {
        setTimeout(() => {
          const targetElement = document.getElementById(categorySlug)
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "start"
            })
          }
        }, 500) // Delay để đợi content load
      }
    })
  })
}

// Hàm khởi tạo trang
async function initPage() {
  try {
    console.log("Đang khởi tạo trang...")

    // Khởi tạo các hiệu ứng UI
    initHeroStats()
    initScrollAnimations()
    initParallaxEffect()
    initSearchAndFilter()
    initSmoothScroll()

    // Lấy dữ liệu danh mục từ API
    const categoriesResponse = await fetchData("http://localhost:5000/api/categories")

    if (categoriesResponse.success) {
      const categories = categoriesResponse.data
      console.log("Đã nhận danh mục từ API:", categories)

      // Render danh mục
      renderCategoryButtons(categories)

      // Tải tất cả sản phẩm ban đầu
      console.log("Đang tải tất cả sản phẩm...")
      await loadProductsForCategory(0, "all")

      // Cập nhật hiển thị giỏ hàng
      updateCartDisplay()
    } else {
      console.error("Không thể lấy dữ liệu danh mục từ API:", categoriesResponse)
      hideLoadingState()
      const menuItemsContainer = document.querySelector(".menu-items")
      menuItemsContainer.innerHTML = '<div class="error">Không thể tải danh mục sản phẩm. Vui lòng thử lại sau.</div>'
      menuItemsContainer.style.display = "block"
    }
  } catch (error) {
    console.error("Lỗi khi khởi tạo trang:", error)
    hideLoadingState()
    const menuItemsContainer = document.querySelector(".menu-items")
    menuItemsContainer.innerHTML = '<div class="error">Có lỗi xảy ra khi tải trang. Vui lòng thử lại sau.</div>'
    menuItemsContainer.style.display = "block"
  }
}

// Thêm CSS cho các hiệu ứng và animations
function addAdvancedStyles() {
  const style = document.createElement("style")
  style.textContent = `
    /* Enhanced Loading State */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Enhanced Error State */
    .error {
      text-align: center;
      padding: 40px 20px;
      color: #e74c3c;
      font-weight: 500;
      background: #fdf2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    /* Enhanced Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #666;
    }
    
    .empty-state i {
      font-size: 4rem;
      margin-bottom: 20px;
      opacity: 0.5;
      color: var(--primary-color);
    }
    
    .empty-state h3 {
      margin-bottom: 10px;
      color: var(--dark-brown);
      font-size: 1.5rem;
    }
    
    /* Smooth transitions for all interactive elements */
    .category-btn, .menu-item, .add-to-cart-btn, .quantity-btn {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Enhanced hover effects */
    .menu-item:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }
    
    .menu-item:hover .menu-item-image img {
      transform: scale(1.05);
    }
    
    /* Stagger animation for menu items */
    .menu-item {
      animation: slideInUp 0.6s ease-out forwards;
      opacity: 0;
      transform: translateY(30px);
    }
    
    @keyframes slideInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Enhanced button animations */
    .add-to-cart-btn:active {
      transform: translateY(-2px) scale(0.98);
    }
    
    .quantity-btn:active {
      transform: scale(0.95);
    }
    
    /* Pulse animation for cart count */
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    
    .cart-count-pulse {
      animation: pulse 0.3s ease-in-out;
    }
    
    /* Enhanced category button effects */
    .category-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(139, 69, 19, 0.2);
    }
    
    /* Smooth scroll behavior */
    html {
      scroll-behavior: smooth;
    }
    
    /* Loading skeleton for better UX */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `
  document.head.appendChild(style)
}

// Khởi chạy khi trang đã tải xong
document.addEventListener("DOMContentLoaded", () => {
  addAdvancedStyles()
  initPage()
})

// Xuất các hàm để sử dụng ở các file khác
window.addToCart = addToCart
window.isUserLoggedIn = isUserLoggedIn
