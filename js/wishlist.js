// Hàm để lấy dữ liệu từ API
async function fetchData(url, options = {}) {
  // Kiểm tra nếu là API wishlist và người dùng chưa đăng nhập
  if (url.includes("/api/wishlist") && !isLoggedIn()) {
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
    return await response.json()
  } catch (error) {
    // Nếu là lỗi liên quan đến wishlist và người dùng chưa đăng nhập, xử lý im lặng
    if (url.includes("/api/wishlist") && !isLoggedIn()) {
      console.debug(`Bỏ qua lỗi wishlist (người dùng chưa đăng nhập):`, error)
      return {
        success: false,
        message: "Unauthorized",
        requireLogin: true,
        data: [],
      }
    }

    console.error(`Lỗi khi lấy dữ liệu từ ${url}:`, error)
    return { success: false, message: error.message, data: [] }
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

// Lấy token từ localStorage
function getToken() {
  return localStorage.getItem("token")
}

// Lấy user ID từ localStorage
function getUserId() {
  const user = JSON.parse(localStorage.getItem("user"))
  return user ? user.user_id : null
}

// Kiểm tra xem người dùng đã đăng nhập chưa
function isLoggedIn() {
  return !!getToken() && !!getUserId()
}

// Hàm lấy danh sách yêu thích
async function fetchWishlist() {
  if (!isLoggedIn()) {
    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    alert("Vui lòng đăng nhập để xem danh sách yêu thích")
    window.location.href = "account.html?redirect=wishlist"
    return null
  }

  try {
    const token = getToken()

    const response = await fetchData("http://localhost:5000/api/wishlist", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.success) {
      return response.data
    } else {
      console.error("Không thể lấy danh sách yêu thích:", response)
      return null
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu thích:", error)
    return null
  }
}

// Hàm thêm sản phẩm vào danh sách yêu thích
async function addToWishlist(productId) {
  if (!isLoggedIn()) {
    return {
      success: false,
      message: "Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích",
      requireLogin: true,
    }
  }

  try {
    const token = getToken()

    const response = await fetchData("http://localhost:5000/api/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
      }),
    })

    return response
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm vào danh sách yêu thích:", error)
    return { success: false, message: "Đã xảy ra lỗi khi thêm sản phẩm vào danh sách yêu thích" }
  }
}

// Hàm xóa sản phẩm khỏi danh sách yêu thích
async function removeFromWishlist(productId) {
  if (!isLoggedIn()) {
    return {
      success: false,
      message: "Vui lòng đăng nhập để xóa sản phẩm khỏi danh sách yêu thích",
      requireLogin: true,
    }
  }

  try {
    const token = getToken()

    const response = await fetchData(`http://localhost:5000/api/wishlist/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi danh sách yêu thích:", error)
    return { success: false, message: "Đã xảy ra lỗi khi xóa sản phẩm khỏi danh sách yêu thích" }
  }
}

// Hàm kiểm tra xem sản phẩm có trong danh sách yêu thích không
async function checkWishlistItem(productId) {
  if (!isLoggedIn()) {
    return false
  }

  try {
    const token = getToken()

    const response = await fetchData(`http://localhost:5000/api/wishlist/check/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.success) {
      return response.data.is_in_wishlist
    } else {
      console.debug("Không thể kiểm tra sản phẩm trong danh sách yêu thích:", response)
      return false
    }
  } catch (error) {
    console.debug("Lỗi khi kiểm tra sản phẩm trong danh sách yêu thích:", error)
    return false
  }
}

// Hàm xóa tất cả sản phẩm khỏi danh sách yêu thích
async function clearWishlist() {
  if (!isLoggedIn()) {
    return {
      success: false,
      message: "Vui lòng đăng nhập để xóa danh sách yêu thích",
      requireLogin: true,
    }
  }

  try {
    const token = getToken()

    const response = await fetchData("http://localhost:5000/api/wishlist", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response
  } catch (error) {
    console.error("Lỗi khi xóa danh sách yêu thích:", error)
    return { success: false, message: "Đã xảy ra lỗi khi xóa danh sách yêu thích" }
  }
}

// Hàm render danh sách yêu thích
function renderWishlist(wishlist) {
  const wishlistContainer = document.querySelector(".wishlist-container")

  if (!wishlistContainer) return

  // Xóa nội dung cũ
  wishlistContainer.innerHTML = ""

  // Kiểm tra nếu danh sách yêu thích trống
  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    wishlistContainer.innerHTML = `
            <div class="empty-wishlist">
                <i class="fas fa-heart-broken"></i>
                <h3>Danh sách yêu thích của bạn đang trống</h3>
                <p>Hãy thêm sản phẩm vào danh sách yêu thích để xem sau</p>
                <a href="menu.html" class="btn btn-primary">Tiếp tục mua sắm</a>
            </div>
        `
    return
  }

  // Tạo nút xóa tất cả
  const clearButton = document.createElement("div")
  clearButton.className = "clear-wishlist"
  clearButton.innerHTML = `<button class="btn btn-danger">Xóa tất cả</button>`
  wishlistContainer.appendChild(clearButton)

  // Tạo grid chứa các sản phẩm
  const wishlistGrid = document.createElement("div")
  wishlistGrid.className = "wishlist-grid"

  // Render các sản phẩm trong danh sách yêu thích
  wishlist.items.forEach((item) => {
    const wishlistItem = document.createElement("div")
    wishlistItem.className = "wishlist-item"
    wishlistItem.dataset.productId = item.product_id

    wishlistItem.innerHTML = `
            <div class="wishlist-item-image">
                <img src="${item.image || "/img/_12A7780.jpg"}" alt="${item.name}" onerror="this.src='/img/_12A7780.jpg'">
            </div>
            <div class="wishlist-item-info">
                <h3 class="wishlist-item-title">${item.name}</h3>
                <p class="wishlist-item-price">${formatCurrency(item.price)}</p>
                <div class="wishlist-item-actions">
                    <button class="btn btn-primary add-to-cart" data-product-id="${item.product_id}">Thêm vào giỏ</button>
                    <button class="btn btn-outline remove-from-wishlist" data-product-id="${item.product_id}">Xóa</button>
                </div>
            </div>
        `

    wishlistGrid.appendChild(wishlistItem)
  })

  wishlistContainer.appendChild(wishlistGrid)

  // Gắn sự kiện cho các nút
  attachWishlistEvents()
}

// Hàm gắn sự kiện cho các nút trong danh sách yêu thích
function attachWishlistEvents() {
  // Sự kiện cho nút xóa tất cả
  const clearButton = document.querySelector(".clear-wishlist button")
  if (clearButton) {
    clearButton.addEventListener("click", async () => {
      if (confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?")) {
        const result = await clearWishlist()

        if (result.success) {
          alert("Đã xóa tất cả sản phẩm khỏi danh sách yêu thích")
          renderWishlist({ items: [] })
        } else {
          alert(`Không thể xóa danh sách yêu thích: ${result.message}`)
        }
      }
    })
  }

  // Sự kiện cho nút xóa từng sản phẩm
  document.querySelectorAll(".remove-from-wishlist").forEach((button) => {
    button.addEventListener("click", async function () {
      const productId = this.dataset.productId

      if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách yêu thích?")) {
        const result = await removeFromWishlist(productId)

        if (result.success) {
          alert("Đã xóa sản phẩm khỏi danh sách yêu thích")

          // Xóa sản phẩm khỏi giao diện
          const wishlistItem = this.closest(".wishlist-item")
          wishlistItem.remove()

          // Kiểm tra nếu danh sách yêu thích trống
          const remainingItems = document.querySelectorAll(".wishlist-item")
          if (remainingItems.length === 0) {
            renderWishlist({ items: [] })
          }
        } else {
          alert(`Không thể xóa sản phẩm: ${result.message}`)
        }
      }
    })
  })

  // Sự kiện cho nút thêm vào giỏ hàng
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = this.dataset.productId

      // Thêm sản phẩm vào giỏ hàng (sử dụng hàm từ cart.js)
      if (window.addToCart) {
        window.addToCart(productId, 1)
      } else {
        // Nếu hàm addToCart không có sẵn, thực hiện thêm vào giỏ hàng ở đây
        const cart = JSON.parse(localStorage.getItem("cart") || "[]")

        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const existingProductIndex = cart.findIndex((item) => item.productId === productId)

        if (existingProductIndex !== -1) {
          // Nếu đã có, cập nhật số lượng
          cart[existingProductIndex].quantity += 1
        } else {
          // Nếu chưa có, thêm mới
          cart.push({
            productId,
            quantity: 1,
          })
        }

        // Lưu giỏ hàng vào localStorage
        localStorage.setItem("cart", JSON.stringify(cart))

        alert("Đã thêm sản phẩm vào giỏ hàng!")
      }
    })
  })
}

// Hàm khởi tạo trang
async function initPage() {
  try {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!isLoggedIn()) {
      // Nếu đang ở trang wishlist.html, hiển thị thông báo đăng nhập
      if (window.location.pathname.includes("wishlist.html")) {
        const wishlistContainer = document.querySelector(".wishlist-container")
        if (wishlistContainer) {
          wishlistContainer.innerHTML = `
            <div class="empty-wishlist">
              <i class="fas fa-user-lock"></i>
              <h3>Vui lòng đăng nhập</h3>
              <p>Bạn cần đăng nhập để xem danh sách yêu thích của mình</p>
              <a href="account.html?redirect=wishlist" class="btn btn-primary">Đăng nhập ngay</a>
            </div>
          `
        }
      }
      return
    }

    // Lấy danh sách yêu thích
    const wishlist = await fetchWishlist()

    // Render danh sách yêu thích
    if (wishlist) {
      renderWishlist(wishlist)
    }
  } catch (error) {
    console.error("Lỗi khi khởi tạo trang:", error)
  }
}

// Khởi chạy khi trang đã tải xong
document.addEventListener("DOMContentLoaded", initPage)

// Export các hàm để sử dụng ở các file khác
window.wishlistFunctions = {
  addToWishlist,
  removeFromWishlist,
  checkWishlistItem,
  isLoggedIn,
}
