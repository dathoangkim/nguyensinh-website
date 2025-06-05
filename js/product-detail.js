// Hàm hiển thị mini cart preview
function showMiniCartPreview(productInfo, quantity, optionsText, totalPrice) {
  // Tạo phần tử mini cart
  const miniCart = document.createElement('div');
  miniCart.className = 'mini-cart-preview';
  
  // Xử lý ảnh sản phẩm
  let productImage = "/img/_12A7780.jpg"; // Ảnh mặc định
  if (productInfo.images && Array.isArray(productInfo.images) && productInfo.images.length > 0) {
    const firstImage = productInfo.images[0];
    if (typeof firstImage === "string") {
      productImage = getProxyImageUrl(firstImage);
    } else if (firstImage.img_url) {
      productImage = getProxyImageUrl(firstImage.img_url);
    } else if (firstImage.url) {
      productImage = getProxyImageUrl(firstImage.url);
    } else if (firstImage.image_url) {
      productImage = getProxyImageUrl(firstImage.image_url);
    }
  }
  
  // Tạo nội dung mini cart
  miniCart.innerHTML = `
    <div class="mini-cart-header">
      <h3>Sản phẩm đã thêm vào giỏ hàng</h3>
      <button class="mini-cart-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="mini-cart-body">
      <div class="mini-cart-item">
        <div class="mini-cart-item-image">
          <img src="${productImage}" alt="${productInfo.name}">
        </div>
        <div class="mini-cart-item-details">
          <h4>${productInfo.name}</h4>
          ${optionsText ? `<p class="mini-cart-item-options">${optionsText}</p>` : ''}
          <div class="mini-cart-item-price-qty">
            <span class="mini-cart-item-price">${formatCurrency(totalPrice)}</span>
            <span class="mini-cart-item-qty">x ${quantity}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="mini-cart-footer">
      <a href="cart.html" class="btn-view-cart">Xem giỏ hàng</a>
      <button class="btn-continue-shopping">Tiếp tục mua sắm</button>
    </div>
  `;
  
  // Thêm CSS cho mini cart
  const style = document.createElement('style');
  if (!document.querySelector('style#mini-cart-style')) {
    style.id = 'mini-cart-style';
    style.textContent = `
      .mini-cart-preview {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        width: 400px;
        max-width: 90vw;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .mini-cart-preview.show {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, -50%) scale(1);
      }
      
      .mini-cart-header {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .mini-cart-header h3 {
        margin: 0;
        font-size: 18px;
        color: #333;
      }
      
      .mini-cart-close {
        background: none;
        border: none;
        font-size: 16px;
        color: #999;
        cursor: pointer;
      }
      
      .mini-cart-body {
        padding: 20px;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .mini-cart-item {
        display: flex;
        margin-bottom: 15px;
      }
      
      .mini-cart-item-image {
        width: 80px;
        height: 80px;
        margin-right: 15px;
      }
      
      .mini-cart-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
      }
      
      .mini-cart-item-details {
        flex: 1;
      }
      
      .mini-cart-item-details h4 {
        margin: 0 0 5px;
        font-size: 16px;
        color: #333;
      }
      
      .mini-cart-item-options {
        margin: 5px 0;
        font-size: 13px;
        color: #666;
        font-style: italic;
      }
      
      .mini-cart-item-price-qty {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
      }
      
      .mini-cart-item-price {
        font-weight: bold;
        color: #e0b573;
      }
      
      .mini-cart-item-qty {
        color: #666;
      }
      
      .mini-cart-footer {
        padding: 15px 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
      }
      
      .btn-view-cart, .btn-continue-shopping {
        padding: 10px 15px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .btn-view-cart {
        background-color: #e0b573;
        color: white;
        border: none;
        text-decoration: none;
      }
      
      .btn-view-cart:hover {
        background-color: #d0a563;
      }
      
      .btn-continue-shopping {
        background-color: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
      }
      
      .btn-continue-shopping:hover {
        background-color: #eee;
      }
      
      .mini-cart-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);
        z-index: 9998;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .mini-cart-overlay.show {
        opacity: 1;
        visibility: visible;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Tạo overlay
  const overlay = document.createElement('div');
  overlay.className = 'mini-cart-overlay';
  
  // Thêm mini cart và overlay vào body
  document.body.appendChild(overlay);
  document.body.appendChild(miniCart);
  
  // Hiển thị mini cart và overlay với animation
  setTimeout(() => {
    overlay.classList.add('show');
    miniCart.classList.add('show');
  }, 10);
  
  // Xử lý nút đóng
  const closeBtn = miniCart.querySelector('.mini-cart-close');
  closeBtn.addEventListener('click', closeMiniCart);
  
  // Xử lý nút tiếp tục mua sắm
  const continueBtn = miniCart.querySelector('.btn-continue-shopping');
  continueBtn.addEventListener('click', closeMiniCart);
  
  // Xử lý click vào overlay
  overlay.addEventListener('click', closeMiniCart);
  
  // Hàm đóng mini cart
  function closeMiniCart() {
    overlay.classList.remove('show');
    miniCart.classList.remove('show');
    
    setTimeout(() => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      if (document.body.contains(miniCart)) document.body.removeChild(miniCart);
    }, 300);
  }
  
  // Tự động đóng sau 5 giây
  setTimeout(closeMiniCart, 5000);
}

// Hàm hiển thị thông báo hiện đại
function showModernNotification(message, type = 'info', duration = 3000) {
  // Tạo phần tử thông báo
  const notification = document.createElement('div');
  notification.className = `modern-notification ${type}`;
  
  // Thêm icon dựa vào loại thông báo
  let icon = '';
  switch(type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }
  
  // Tạo nội dung thông báo
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${icon}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close"><i class="fas fa-times"></i></button>
  `;
  
  // Thêm CSS cho thông báo
  const style = document.createElement('style');
  if (!document.querySelector('style#modern-notification-style')) {
    style.id = 'modern-notification-style';
    style.textContent = `
      .modern-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 450px;
        background-color: white;
        color: #333;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 8px;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 9999;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        overflow: hidden;
      }
      
      .modern-notification.show {
        transform: translateX(0);
      }
      
      .modern-notification .notification-content {
        display: flex;
        align-items: center;
        flex: 1;
      }
      
      .modern-notification .notification-icon {
        margin-right: 12px;
        font-size: 24px;
      }
      
      .modern-notification .notification-message {
        flex: 1;
        font-size: 14px;
      }
      
      .modern-notification .notification-close {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        margin-left: 12px;
      }
      
      .modern-notification.success {
        border-left: 4px solid #4CAF50;
      }
      
      .modern-notification.success .notification-icon {
        color: #4CAF50;
      }
      
      .modern-notification.error {
        border-left: 4px solid #F44336;
      }
      
      .modern-notification.error .notification-icon {
        color: #F44336;
      }
      
      .modern-notification.warning {
        border-left: 4px solid #FF9800;
      }
      
      .modern-notification.warning .notification-icon {
        color: #FF9800;
      }
      
      .modern-notification.info {
        border-left: 4px solid #2196F3;
      }
      
      .modern-notification.info .notification-icon {
        color: #2196F3;
      }
      
      @media (max-width: 768px) {
        .modern-notification {
          min-width: auto;
          max-width: calc(100% - 40px);
          width: calc(100% - 40px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Thêm thông báo vào body
  document.body.appendChild(notification);
  
  // Hiển thị thông báo với animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Xử lý nút đóng
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  });
  
  // Tự động đóng sau thời gian duration
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, duration);
}

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

      // Nếu là lỗi 404 cho options, trả về mảng trống
      if (response.status === 404 && url.includes("/options")) {
        console.debug(`Không tìm thấy options cho sản phẩm: ${url}`)
        return {
          success: true,
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

    // Nếu là lỗi liên quan đến options, trả về mảng trống
    if (url.includes("/options")) {
      console.debug(`Lỗi khi lấy options: ${error.message}`)
      return {
        success: true,
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

// Hàm lấy tham số từ URL
function getUrlParameter(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]")
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
  const results = regex.exec(location.search)
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

// Hàm chuyển đổi URL ảnh để sử dụng proxy CORS
function getProxyImageUrl(originalUrl) {
  // Kiểm tra URL hợp lệ
  if (!originalUrl || typeof originalUrl !== "string") {
    console.error("URL ảnh không hợp lệ:", originalUrl)
    return "/img/_12A7780.jpg"
  }

  // Nếu URL đã là URL tương đối hoặc data URL, trả về nguyên bản
  if (
    originalUrl.startsWith("/") ||
    originalUrl.startsWith("data:") ||
    originalUrl.startsWith("./") ||
    originalUrl.startsWith("../")
  ) {
    return originalUrl
  }

  // Nếu URL đã là URL tuyệt đối với cùng domain, trả về nguyên bản
  if (originalUrl.startsWith(window.location.origin)) {
    return originalUrl
  }

  // Kiểm tra nếu là URL Facebook, sử dụng ảnh mặc định
  if (originalUrl.includes("fbcdn.net") || originalUrl.includes("facebook.com")) {
    console.debug("Phát hiện URL Facebook, sử dụng ảnh mặc định")
    return "/img/_12A7780.jpg"
  }

  // Thử sử dụng trực tiếp URL gốc (không qua proxy)
  console.debug("Thử sử dụng URL ảnh trực tiếp:", originalUrl)
  return originalUrl
}

// Kiểm tra xem người dùng đã đăng nhập chưa
function isLoggedIn() {
  return !!localStorage.getItem("token") && !!JSON.parse(localStorage.getItem("user") || "null")
}

// Hàm tải chi tiết sản phẩm
async function loadProductDetail() {
  const productId = getUrlParameter("id")

  // Đảm bảo container tồn tại
  const detailContainer = document.querySelector(".product-detail-container")
  if (!detailContainer) {
    console.error("Không tìm thấy phần tử .product-detail-container")
    return
  }

  if (!productId) {
    detailContainer.innerHTML = '<div class="error">Không tìm thấy sản phẩm. Vui lòng quay lại trang thực đơn.</div>'
    return
  }

  try {
    // Hiển thị loading
    detailContainer.innerHTML = '<div class="loading">Đang tải thông tin sản phẩm...</div>'

    // Lấy thông tin sản phẩm từ API
    const response = await fetchData(`http://localhost:5000/api/products/${productId}`)

    if (!response.success || !response.data) {
      throw new Error("Không thể lấy thông tin sản phẩm")
    }

    const product = response.data
    console.log("Dữ liệu sản phẩm hoàn chỉnh:", product)

    // Cập nhật tiêu đề trang
    document.title = `${product.name} - Nguyên Sinh`

    // Xử lý URL ảnh sản phẩm - Sử dụng ảnh mặc định nếu không có ảnh
    let imageUrl = "/img/_12A7780.jpg"
    // In ra để debug
    console.log("Thông tin hình ảnh của sản phẩm:", {
      product_id: product.product_id,
      name: product.name,
      images: product.images,
    })

    // Kiểm tra mảng images thay vì image_url
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      try {
        // Lấy URL từ mảng images
        const firstImage = product.images[0]

        // Xem cấu trúc của object ảnh để debug
        console.log("Object ảnh đầu tiên:", firstImage)

        // Đã biết rằng URL ảnh nằm trong trường img_url
        if (firstImage.img_url) {
          imageUrl = getProxyImageUrl(firstImage.img_url)
          console.log("Sử dụng URL ảnh từ images[0].img_url:", imageUrl)
        }
        // Trường hợp dự phòng
        else if (firstImage.url) {
          imageUrl = getProxyImageUrl(firstImage.url)
          console.log("Sử dụng URL ảnh từ images[0].url:", imageUrl)
        }
        // Trường hợp dự phòng
        else if (firstImage.image_url) {
          imageUrl = getProxyImageUrl(firstImage.image_url)
          console.log("Sử dụng URL ảnh từ images[0].image_url:", imageUrl)
        }
        // Nếu là chuỗi URL trực tiếp
        else if (typeof firstImage === "string") {
          imageUrl = getProxyImageUrl(firstImage)
          console.log("Sử dụng URL ảnh trực tiếp từ images[0]:", imageUrl)
        }
      } catch (error) {
        console.error("Lỗi khi xử lý mảng images:", error)
      }
    } else {
      console.warn("Sản phẩm không có dữ liệu ảnh hợp lệ trong mảng images")
    }

    // Tạo HTML mới cho container
    detailContainer.innerHTML = `
            <!-- Product Gallery -->
            <div class="product-gallery">
                <div class="product-main-image">
                    <img src="${imageUrl}" alt="${product.name}" id="main-product-image" 
                        onerror="this.onerror=null; console.error('Lỗi tải ảnh sản phẩm từ URL: ' + this.src); this.src='/img/_12A7780.jpg';" 
                        data-original-url="${product.image_url}">
                </div>
                <div class="product-thumbnails">
                    <div class="product-thumbnail active" data-image="${imageUrl}">
                        <img src="${imageUrl}" alt="${product.name} - Hình 1" crossorigin="anonymous"
                            onerror="this.onerror=null; this.src='/img/_12A7780.jpg';">
                    </div>
                </div>
            </div>
            
            <!-- Product Info -->
            <div class="product-info">
                <span class="product-category">${product.category_name || "Sản phẩm"}</span>
                <h1  class="product-title">${product.name}</h1>
                
                <div class="product-rating">
                    <div class="rating-stars">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                    </div>
                    <span class="rating-count">(${product.review_count || 0} đánh giá)</span>
                </div>
                
                <div class="product-price-container">
                    <span class="product-price" data-base-price="${product.price}">${formatCurrency(product.price)}</span>
                </div>
                
                <div class="product-description">
                    <p>${product.description || "Không có mô tả cho sản phẩm này."}</p>
                </div>
                
                <!-- Product Options Container -->
                <div class="product-options-container">
                    <!-- Options sẽ được thêm vào đây bằng JavaScript -->
                </div>
                
                <div class="product-quantity">
                    <span class="quantity-label">Số lượng:</span>
                    <div class="quantity-control">
                        <button class="quantity-btn decrease">-</button>
                        <input type="number" id="product-quantity" class="quantity-input" value="1" min="1">
                        <button class="quantity-btn increase">+</button>
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn-add-to-cart" data-product-id="${product.product_id}">
                        <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                    </button>
                    <button class="btn-buy-now">
                        <i class="fas fa-bolt"></i> Mua ngay
                    </button>
                    <button class="btn-add-to-wishlist" data-product-id="${product.product_id}">
                        <i class="far fa-heart"></i> Yêu thích
                    </button>
                </div>
                
                <div class="product-meta">
                    <div class="meta-item">
                        <span class="meta-label">Mã sản phẩm:</span>
                        <span>${product.product_id}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Danh mục:</span>
                        <span>${product.category_name || "Chưa phân loại"}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Tình trạng:</span>
                        <span>${product.stock_quantity > 0 ? "Còn hàng" : "Hết hàng"}</span>
                    </div>
                </div>
            </div>
        `

    // Cập nhật breadcrumb
    const breadcrumbList = document.querySelector(".breadcrumb")
    if (breadcrumbList) {
      breadcrumbList.innerHTML = `
                <li><a href="../index.html">Trang Chủ</a></li>
                <li><a href="menu.html">Thực Đơn</a></li>
                <li>${product.name}</li>
            `
    }

    // Tải và hiển thị các tùy chọn sản phẩm
    console.log("Bắt đầu tải tùy chọn sản phẩm cho productId:", productId)
    try {
      await loadAndRenderProductOptions(productId)
      console.log("Đã tải xong tùy chọn sản phẩm")
    } catch (optionError) {
      console.error("Lỗi khi tải tùy chọn sản phẩm:", optionError)
    }

    // Gắn sự kiện cho các nút
    attachProductEvents(product)

    // Tải sản phẩm liên quan
    await loadRelatedProducts(product.category_id, product.product_id)

    // Tải đánh giá sản phẩm
    await loadProductReviews(productId)
  } catch (error) {
    console.error("Lỗi khi tải chi tiết sản phẩm:", error)
    document.querySelector(".product-detail-container").innerHTML =
      `<div class="error">Có lỗi xảy ra khi tải thông tin sản phẩm: ${error.message}</div>`
  }
}

// Hàm tải và hiển thị các tùy chọn sản phẩm
async function loadAndRenderProductOptions(productId) {
  try {
    // Lấy container cho các tùy chọn
    const optionsContainer = document.querySelector(".product-options-container")
    console.log("Container tùy chọn sản phẩm:", optionsContainer)
    if (!optionsContainer) {
      console.error("Không tìm thấy container cho tùy chọn sản phẩm")
      return
    }
    
    // Đảm bảo container hiển thị
    optionsContainer.style.display = "block"

    // Hiển thị loading
    optionsContainer.innerHTML = '<div class="loading">Đang tải tùy chọn sản phẩm...</div>'

    // Lấy dữ liệu tùy chọn từ API
    console.log("Đang gọi API lấy tùy chọn sản phẩm:", `http://localhost:5000/api/products/${productId}/options`)
    const response = await fetchData(`http://localhost:5000/api/products/${productId}/options`)
    console.log("Kết quả API tùy chọn sản phẩm:", response)

    // Nếu không có tùy chọn hoặc có lỗi, tạo tùy chọn mẫu
    if (!response.success || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.warn("Không có tùy chọn sản phẩm hoặc có lỗi:", response)
      
      // Tạo tùy chọn mẫu
      const defaultOptions = [
        {
          option_id: "default_1",
          name: "Kích cỡ",
          description: "Chọn kích cỡ bánh mì",
          values: [
            { value_id: "default_1_1", option_id: "default_1", value: "Nhỏ", additional_price: 0 },
            { value_id: "default_1_2", option_id: "default_1", value: "Vừa", additional_price: 10000 },
            { value_id: "default_1_3", option_id: "default_1", value: "Lớn", additional_price: 20000 }
          ]
        },
        {
          option_id: "default_2",
          name: "Thêm topping",
          description: "Chọn topping thêm",
          values: [
            { value_id: "default_2_1", option_id: "default_2", value: "Không thêm", additional_price: 0 },
            { value_id: "default_2_2", option_id: "default_2", value: "Thêm phô mai", additional_price: 10000 },
            { value_id: "default_2_3", option_id: "default_2", value: "Thêm trứng", additional_price: 5000 },
            { value_id: "default_2_4", option_id: "default_2", value: "Thêm thịt", additional_price: 15000 }
          ]
        }
      ];
      
      // Sử dụng tùy chọn mẫu
      response.data = defaultOptions;
    }

    const options = response.data
    console.log("Tùy chọn sản phẩm:", options)

    // Tạo HTML cho các tùy chọn
    let optionsHTML = "<h3 style='color: white; margin-bottom: 15px;'>Tùy chọn sản phẩm:</h3>"

    options.forEach((option) => {
      optionsHTML += `
        <div class="product-option">
          <h4 style='color: white; class="option-name">${option.name}</h4>
          <div class="option-values" data-option-id="${option.option_id}">
      `

      // Thêm các giá trị cho tùy chọn
      if (option.values && Array.isArray(option.values) && option.values.length > 0) {
        option.values.forEach((value, index) => {
          const isDefault = index === 0 // Mặc định chọn giá trị đầu tiên
          optionsHTML += `
            <div class="option-value ${isDefault ? "active" : ""}" 
                data-value-id="${value.value_id}" 
                data-additional-price="${value.additional_price || 0}">
              ${value.value} ${value.additional_price > 0 ? `(+${formatCurrency(value.additional_price)})` : ""}
            </div>
          `
        })
      } else {
        optionsHTML += '<div class="no-options">Không có tùy chọn</div>'
      }

      optionsHTML += `
          </div>
        </div>
      `
    })

    // Cập nhật HTML
    console.log("Cập nhật HTML cho container tùy chọn:", optionsHTML)
    optionsContainer.innerHTML = optionsHTML
    optionsContainer.style.display = "block" // Đảm bảo container hiển thị

    // Thêm CSS cho các tùy chọn
    addOptionStyles()

    // Gắn sự kiện cho các tùy chọn
    document.querySelectorAll(".option-value").forEach((optionValue) => {
      optionValue.addEventListener("click", function () {
        // Bỏ active tất cả các option value trong cùng một nhóm
        const optionValues = this.closest(".option-values")
        optionValues.querySelectorAll(".option-value").forEach((el) => {
          el.classList.remove("active")
        })

        // Active option value được chọn
        this.classList.add("active")

        // Cập nhật giá sản phẩm
        updateProductPrice()
      })
    })

    // Cập nhật giá ban đầu
    updateProductPrice()
  } catch (error) {
    console.error("Lỗi khi tải tùy chọn sản phẩm:", error)
    const optionsContainer = document.querySelector(".product-options-container")
    if (optionsContainer) {
      optionsContainer.style.display = "none"
    }
  }
}

// Hàm thêm CSS cho các tùy chọn
function addOptionStyles() {
  const style = document.createElement("style")
  style.textContent = `
    .product-option {
      margin-bottom: 20px;
    }
    
    .option-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
    }
    
    .option-values {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .option-value {
      padding: 8px 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
      background-color: #f9f9f9;
    }
    
    .option-value:hover {
      border-color: #e0b573;
      background-color: #fdf6e3;
    }
    
    .option-value.active {
      border-color: #e0b573;
      background-color: #e0b573;
      color: white;
      font-weight: 500;
    }
    
    .no-options {
      color: #999;
      font-style: italic;
    }
  `
  document.head.appendChild(style)
}

// Hàm cập nhật giá sản phẩm dựa trên các tùy chọn được chọn
function updateProductPrice() {
  const priceElement = document.querySelector(".product-price")
  if (!priceElement) return

  // Lấy giá cơ bản
  const basePrice = Number.parseFloat(priceElement.dataset.basePrice || 0)

  // Tính tổng giá thêm từ các tùy chọn được chọn
  let additionalPrice = 0
  document.querySelectorAll(".option-value.active").forEach((optionValue) => {
    additionalPrice += Number.parseFloat(optionValue.dataset.additionalPrice || 0)
  })

  // Lấy số lượng
  const quantity = Number.parseInt(document.getElementById("product-quantity")?.value || 1)

  // Tính tổng giá
  const totalPrice = (basePrice + additionalPrice) * quantity

  // Cập nhật hiển thị giá
  priceElement.textContent = formatCurrency(totalPrice)

  return totalPrice
}

// Hàm gắn sự kiện cho các nút
async function attachProductEvents(product) {
  // Xử lý nút tăng giảm số lượng
  const decreaseBtn = document.querySelector(".quantity-btn.decrease")
  const increaseBtn = document.querySelector(".quantity-btn.increase")
  const quantityInput = document.getElementById("product-quantity")

  if (decreaseBtn && quantityInput) {
    decreaseBtn.addEventListener("click", () => {
      if (Number.parseInt(quantityInput.value) > 1) {
        quantityInput.value = Number.parseInt(quantityInput.value) - 1
        updateProductPrice()
      }
    })
  }

  if (increaseBtn && quantityInput) {
    increaseBtn.addEventListener("click", () => {
      quantityInput.value = Number.parseInt(quantityInput.value) + 1
      updateProductPrice()
    })
  }

  if (quantityInput) {
    quantityInput.addEventListener("change", updateProductPrice)
  }

// Phần này đã được xóa và di chuyển lên đầu file

// Xử lý nút thêm vào giỏ
  const addToCartBtn = document.querySelector(".btn-add-to-cart")
  if (addToCartBtn && quantityInput) {
    addToCartBtn.addEventListener("click", async () => {
      // Thêm class loading khi đang xử lý
      addToCartBtn.classList.add('loading');
      addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
      
      const quantity = Number.parseInt(quantityInput.value)

      // Lấy các tùy chọn được chọn
      const selectedOptions = []
      document.querySelectorAll(".option-value.active").forEach((optionValue) => {
        const optionContainer = optionValue.closest(".product-option")
        const optionName = optionContainer.querySelector(".option-name").textContent
        const optionId = optionValue.closest(".option-values").dataset.optionId
        const valueId = optionValue.dataset.valueId
        const valueName = optionValue.textContent.split("(")[0].trim()
        const additionalPrice = Number.parseFloat(optionValue.dataset.additionalPrice || 0)

        selectedOptions.push({
          option_id: optionId,
          value_id: valueId,
          option_name: optionName,
          value_name: valueName,
          additional_price: additionalPrice,
        })
      })

      try {
        // Thêm vào giỏ hàng và đợi kết quả
        const success = await addToCart(product.product_id, quantity, product, selectedOptions);
        
        // Khôi phục nút sau khi xử lý xong
        addToCartBtn.classList.remove('loading');
        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Thêm vào giỏ';
        
        // KHÔNG chuyển hướng đến trang giỏ hàng sau khi thêm sản phẩm
      } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        showModernNotification("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng", "error");
        
        // Khôi phục nút sau khi xử lý xong
        addToCartBtn.classList.remove('loading');
        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Thêm vào giỏ';
      }
    })
  }

  // Xử lý nút mua ngay
  const buyNowBtn = document.querySelector(".btn-buy-now")
  if (buyNowBtn && quantityInput) {
    buyNowBtn.addEventListener("click", async () => {
      // Thêm class loading khi đang xử lý
      buyNowBtn.classList.add('loading');
      buyNowBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
      
      const quantity = Number.parseInt(quantityInput.value)

      // Lấy các tùy chọn được chọn
      const selectedOptions = []
      document.querySelectorAll(".option-value.active").forEach((optionValue) => {
        const optionContainer = optionValue.closest(".product-option")
        const optionName = optionContainer.querySelector(".option-name").textContent
        const optionId = optionValue.closest(".option-values").dataset.optionId
        const valueId = optionValue.dataset.valueId
        const valueName = optionValue.textContent.split("(")[0].trim()
        const additionalPrice = Number.parseFloat(optionValue.dataset.additionalPrice || 0)

        selectedOptions.push({
          option_id: optionId,
          value_id: valueId,
          option_name: optionName,
          value_name: valueName,
          additional_price: additionalPrice,
        })
      })

      try {
        // Thêm vào giỏ hàng và đợi kết quả
        const success = await addToCart(product.product_id, quantity, product, selectedOptions);
        
        // Khôi phục nút sau khi xử lý xong
        buyNowBtn.classList.remove('loading');
        buyNowBtn.innerHTML = '<i class="fas fa-bolt"></i> Mua ngay';
        
        // Chuyển hướng đến trang giỏ hàng sau khi thêm sản phẩm thành công
        if (success) {
          window.location.href = "cart.html";
        }
      } catch (error) {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        showModernNotification("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng", "error");
        
        // Khôi phục nút sau khi xử lý xong
        buyNowBtn.classList.remove('loading');
        buyNowBtn.innerHTML = '<i class="fas fa-bolt"></i> Mua ngay';
      }
    })
  }

  // Xử lý nút thêm vào danh sách yêu thích
  const addToWishlistBtn = document.querySelector(".btn-add-to-wishlist")
  if (addToWishlistBtn) {
    // Kiểm tra xem sản phẩm đã có trong danh sách yêu thích chưa
    let isInWishlist = false

    // Nếu đã đăng nhập, kiểm tra trạng thái yêu thích
    if (isLoggedIn()) {
      try {
        isInWishlist = await checkWishlistItem(product.product_id)

        // Cập nhật giao diện nút
        if (isInWishlist) {
          addToWishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Đã yêu thích'
          addToWishlistBtn.classList.add("in-wishlist")
        }
      } catch (error) {
        console.debug("Lỗi khi kiểm tra trạng thái yêu thích:", error)
      }
    }

    // Thêm sự kiện click
    addToWishlistBtn.addEventListener("click", async function () {
      if (!isLoggedIn()) {
        if (confirm("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích. Bạn có muốn đăng nhập ngay?")) {
          window.location.href = `account.html?redirect=${encodeURIComponent(window.location.href)}`
        }
        return
      }

      try {
        if (!isInWishlist) {
          // Thêm vào danh sách yêu thích
          const result = await addToWishlist(product.product_id)

          if (result.success) {
            isInWishlist = true
            this.innerHTML = '<i class="fas fa-heart"></i> Đã yêu thích'
            this.classList.add("in-wishlist")
            alert("Đã thêm sản phẩm vào danh sách yêu thích!")
          } else {
            if (result.requireLogin) {
              if (confirm("Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích. Bạn có muốn đăng nhập ngay?")) {
                window.location.href = `account.html?redirect=${encodeURIComponent(window.location.href)}`
              }
            } else {
              alert(`Không thể thêm vào danh sách yêu thích: ${result.message}`)
            }
          }
        } else {
          // Xóa khỏi danh sách yêu thích
          const result = await removeFromWishlist(product.product_id)

          if (result.success) {
            isInWishlist = false
            this.innerHTML = '<i class="far fa-heart"></i> Yêu thích'
            this.classList.remove("in-wishlist")
            alert("Đã xóa sản phẩm khỏi danh sách yêu thích!")
          } else {
            alert(`Không thể xóa khỏi danh sách yêu thích: ${result.message}`)
          }
        }
      } catch (error) {
        console.error("Lỗi khi thao tác với danh sách yêu thích:", error)
        alert("Đã xảy ra lỗi khi thao tác với danh sách yêu thích")
      }
    })
  }
}

// Hàm thêm sản phẩm vào giỏ hàng
async function addToCart(productId, quantity, productInfo, selectedOptions = []) {
  // Tạo ID duy nhất cho sản phẩm với options
  const uniqueId =
    selectedOptions.length > 0
      ? `${productId}_${selectedOptions.map((o) => o.value_id).join("_")}`
      : productId.toString()

  // Xử lý ảnh sản phẩm
  let productImage = "/img/_12A7780.jpg" // Ảnh mặc định

  // Kiểm tra nếu có mảng images
  if (productInfo.images && Array.isArray(productInfo.images) && productInfo.images.length > 0) {
    const firstImage = productInfo.images[0]
    if (typeof firstImage === "string") {
      productImage = getProxyImageUrl(firstImage)
    } else if (firstImage.img_url) {
      productImage = getProxyImageUrl(firstImage.img_url)
    } else if (firstImage.url) {
      productImage = getProxyImageUrl(firstImage.url)
    } else if (firstImage.image_url) {
      productImage = getProxyImageUrl(firstImage.image_url)
    }
  }

  // Tính tổng giá với options
  let totalPrice = productInfo.price
  let optionsText = ""

  if (selectedOptions && selectedOptions.length > 0) {
    selectedOptions.forEach((option) => {
      totalPrice += option.additional_price || 0
      
      // Thêm giá vào tên tùy chọn nếu có giá thêm
      let optionDisplay = `${option.option_name}: ${option.value_name}`;
      if (option.additional_price > 0) {
        optionDisplay += ` (+${formatCurrency(option.additional_price)})`;
      }
      
      optionsText += optionDisplay + ", ";
    })

    // Xóa dấu phẩy và khoảng trắng cuối cùng
    optionsText = optionsText.slice(0, -2)
  }

  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (isLoggedIn()) {
    console.log("Người dùng đã đăng nhập, thêm sản phẩm vào giỏ hàng qua API");
    try {
      const token = localStorage.getItem('token');
      
      // Gọi API để thêm sản phẩm vào giỏ hàng
      const response = await fetchData('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
          options: selectedOptions,
          options_text: optionsText
        })
      });
      
      if (response.success) {
        console.log("Thêm sản phẩm vào giỏ hàng thành công qua API:", response.data);
      } else {
        throw new Error(response.message || "Không thể thêm sản phẩm vào giỏ hàng");
      }
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng qua API:", error);
      // Fallback to localStorage if API fails
      addToCartLocal(productId, quantity, productInfo, selectedOptions, uniqueId, productImage, totalPrice, optionsText);
      return;
    }
  } else {
    // Nếu chưa đăng nhập, lưu vào localStorage
    addToCartLocal(productId, quantity, productInfo, selectedOptions, uniqueId, productImage, totalPrice, optionsText);
  }

  // Hiển thị thông báo hiện đại thay vì alert
  showModernNotification(`Đã thêm ${quantity} ${productInfo.name}${optionsText ? ` (${optionsText})` : ""} vào giỏ hàng!`, 'success');

  // Hiển thị mini cart preview
  showMiniCartPreview(productInfo, quantity, optionsText, totalPrice);

  // Cập nhật hiển thị giỏ hàng nếu có
  updateCartDisplay()
  
  // Trả về true để biết thêm vào giỏ hàng thành công
  return true;
}

// Hàm thêm sản phẩm vào giỏ hàng local
function addToCartLocal(productId, quantity, productInfo, selectedOptions, uniqueId, productImage, totalPrice, optionsText) {
  // Lấy giỏ hàng từ localStorage hoặc tạo mới nếu chưa có
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  
  // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
  const existingProductIndex = cart.findIndex((item) => item.uniqueId === uniqueId)

  if (existingProductIndex !== -1) {
    // Nếu đã có, cập nhật số lượng
    cart[existingProductIndex].quantity += quantity
  } else {
    // Nếu chưa có, thêm mới
    cart.push({
      productId,
      uniqueId,
      quantity,
      name: productInfo.name,
      price: totalPrice,
      basePrice: productInfo.price,
      image: productImage,
      options: selectedOptions,
      optionsText,
    })
  }

  // Lưu giỏ hàng vào localStorage
  localStorage.setItem("cart", JSON.stringify(cart))
}

// Phần này đã được xóa và di chuyển lên đầu file

// Hàm cập nhật hiển thị giỏ hàng
function updateCartDisplay() {
  // Sử dụng hàm updateCartIcon từ cart.js nếu có
  if (typeof updateCartIcon === 'function') {
    updateCartIcon();
  } else {
    // Fallback nếu không có hàm updateCartIcon
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

    // Nếu có phần tử hiển thị số lượng giỏ hàng, cập nhật nó
    const cartCountElement = document.querySelector(".cart-count")
    if (cartCountElement) {
      cartCountElement.textContent = totalItems
    }
  }
}

// Thêm CSS cho thông báo loading và lỗi
function addStyles() {
  const style = document.createElement("style")
  style.textContent = `
        .loading {
            text-align: center;
            padding: 40px;
            font-style: italic;
            color: #666;
        }
        
        .error {
            text-align: center;
            padding: 40px;
            color: #e74c3c;
            font-weight: bold;
        }
        
        /* CSS cho trạng thái loading của nút */
        button.loading {
            opacity: 0.7;
            cursor: wait;
            padding: 10px 20px;
        }
        
        button.loading i.fa-spinner {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* CSS cho hiệu ứng khi thêm vào giỏ hàng */
        .btn-add-to-cart, .btn-buy-now {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .btn-add-to-cart:before, .btn-buy-now:before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.6s ease, height 0.6s ease;
        }
        
        .btn-add-to-cart:hover:before, .btn-buy-now:hover:before {
            width: 300px;
            height: 300px;
        }
    `
  document.head.appendChild(style)
}

// Hàm tải sản phẩm liên quan
async function loadRelatedProducts(categoryId, currentProductId) {
  try {
    // Tìm container sản phẩm liên quan
    const relatedProductsGrid = document.querySelector(".related-products-grid")
    if (!relatedProductsGrid) {
      console.error("Không tìm thấy phần tử .related-products-grid")
      return
    }

    // Hiển thị loading
    relatedProductsGrid.innerHTML = '<div class="loading">Đang tải sản phẩm liên quan...</div>'

    // Lấy sản phẩm cùng danh mục
    const response = await fetchData(`http://localhost:5000/api/products/category/${categoryId}`)

    if (!response.success || !response.data || !Array.isArray(response.data)) {
      throw new Error("Không thể lấy sản phẩm liên quan")
    }

    // Lọc bỏ sản phẩm hiện tại và giới hạn số lượng
    const relatedProducts = response.data.filter((product) => product.product_id != currentProductId).slice(0, 4)

    if (relatedProducts.length === 0) {
      relatedProductsGrid.innerHTML = '<div class="no-products">Không có sản phẩm liên quan</div>'
      return
    }

    // Tạo HTML cho sản phẩm liên quan
    let productsHTML = ""

    relatedProducts.forEach((product) => {
      // Xác định URL ảnh từ các trường có thể có - sử dụng cách xử lý từ menu.js
      let imageUrl = "/img/_12A7780.jpg"

      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0]
        if (typeof firstImage === "string") {
          imageUrl = getProxyImageUrl(firstImage)
        } else if (firstImage.img_url) {
          imageUrl = getProxyImageUrl(firstImage.img_url)
        } else if (firstImage.url) {
          imageUrl = getProxyImageUrl(firstImage.url)
        } else if (firstImage.image_url) {
          imageUrl = getProxyImageUrl(firstImage.image_url)
        }
      } else if (product.image_url) {
        imageUrl = getProxyImageUrl(product.image_url)
      } else if (product.main_image) {
        imageUrl = getProxyImageUrl(product.main_image)
      }

      // Log để debug
      console.log(`Sản phẩm liên quan ${product.name} - URL ảnh: ${imageUrl}`)

      // Tạo mô tả ngắn gọn
      const shortDescription = product.description
        ? product.description.length > 80
          ? product.description.substring(0, 80) + "..."
          : product.description
        : "Không có mô tả"

      productsHTML += `
                <div class="product-card">
                    <div class="product-image">
                        <a href="product-detail.html?id=${product.product_id}">
                            <img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='/img/_12A7780.jpg';">
                        </a>
                        ${product.status === "featured" ? '<span class="product-badge">Nổi bật</span>' : ""}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">
                            <a href="product-detail.html?id=${product.product_id}">${product.name}</a>
                        </h3>
                        <p class="product-description">${shortDescription}</p>
                        <div class="product-price">
                            <span class="price">${formatCurrency(product.price)}</span>
                        </div>
                        <div class="product-actions">
                            <button class="btn-add-to-cart" data-product-id="${product.product_id}">
                                <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                            </button>
                            <a href="product-detail.html?id=${product.product_id}" class="btn-view-details">
                                Chi tiết
                            </a>
                        </div>
                    </div>
                </div>
            `
    })

    // Cập nhật HTML
    relatedProductsGrid.innerHTML = productsHTML

    // Gắn sự kiện cho các nút thêm vào giỏ
    relatedProductsGrid.querySelectorAll(".btn-add-to-cart").forEach((button) => {
      button.addEventListener("click", async function () {
        const productId = this.dataset.productId

        try {
          // Lấy thông tin sản phẩm
          const productResponse = await fetchData(`http://localhost:5000/api/products/${productId}`)
          if (productResponse.success && productResponse.data) {
            addToCart(productId, 1, productResponse.data)
          } else {
            throw new Error("Không thể lấy thông tin sản phẩm")
          }
        } catch (error) {
          console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error)
          alert("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng")
        }
      })
    })
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm liên quan:", error)
    const relatedProductsGrid = document.querySelector(".related-products-grid")
    if (relatedProductsGrid) {
      relatedProductsGrid.innerHTML = '<div class="error">Có lỗi xảy ra khi tải sản phẩm liên quan</div>'
    }
  }
}

// Hàm lấy thông tin biến thể sản phẩm (options)
async function loadProductOptions(productId) {
  try {
    const response = await fetchData(`http://localhost:5000/api/products/${productId}/options`)

    if (!response.success) {
      return []
    }

    return response.data || []
  } catch (error) {
    console.debug("Lỗi khi lấy thông tin biến thể sản phẩm:", error)
    return []
  }
}

// Hàm tải đánh giá sản phẩm
async function loadProductReviews(productId) {
  try {
    const reviewsContainer = document.querySelector("#reviews-tab .reviews-container")
    if (!reviewsContainer) {
      console.debug("Không tìm thấy phần tử .reviews-container")
      return
    }

    // Hiển thị loading
    reviewsContainer.innerHTML = '<div class="loading">Đang tải đánh giá...</div>'

    // Lấy đánh giá từ API - Sửa endpoint để phù hợp với backend routes
    const response = await fetchData(`http://localhost:5000/api/reviews/product/${productId}`)

    if (!response.success) {
      throw new Error("Không thể lấy đánh giá sản phẩm")
    }

    const reviews = response.data || []

    if (!Array.isArray(reviews) || reviews.length === 0) {
      reviewsContainer.innerHTML = "<p>Chưa có đánh giá nào cho sản phẩm này.</p>"
      return
    }

    // Tạo HTML cho đánh giá
    let reviewsHTML = ""

    reviews.forEach((review) => {
      // Tạo HTML cho số sao
      let starsHTML = ""
      for (let i = 1; i <= 5; i++) {
        if (i <= review.rating) {
          starsHTML += '<i class="fas fa-star"></i>'
        } else if (i - 0.5 <= review.rating) {
          starsHTML += '<i class="fas fa-star-half-alt"></i>'
        } else {
          starsHTML += '<i class="far fa-star"></i>'
        }
      }

      // Format ngày tháng
      const reviewDate = new Date(review.created_at)
      const formattedDate = new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(reviewDate)

      reviewsHTML += `
                <div class="review-item">
                    <div class="review-header">
                        <span class="review-author">${review.username || "Khách hàng"}</span>
                        <span class="review-date">${formattedDate}</span>
                    </div>
                    <div class="review-rating">
                        ${starsHTML}
                    </div>
                    <div class="review-content">
                        <p>${review.comment || "Không có bình luận"}</p>
                    </div>
                </div>
            `
    })

    // Cập nhật HTML
    reviewsContainer.innerHTML = reviewsHTML

    // Cập nhật số lượng đánh giá trong tab
    const reviewsTab = document.querySelector('.tab-btn[data-tab="reviews"]')
    if (reviewsTab) {
      reviewsTab.textContent = `Đánh giá (${reviews.length})`
    }
  } catch (error) {
    console.error("Lỗi khi tải đánh giá sản phẩm:", error)
    const reviewsContainer = document.querySelector("#reviews-tab .reviews-container")
    if (reviewsContainer) {
      reviewsContainer.innerHTML = '<div class="error">Có lỗi xảy ra khi tải đánh giá sản phẩm</div>'
    }
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
    const token = localStorage.getItem("token")
    if (!token) {
      return {
        success: false,
        message: "Chưa đăng nhập",
        requireLogin: true,
      }
    }

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
    console.error("Lỗi khi thêm vào danh sách yêu thích:", error)
    return { success: false, message: "Đã xảy ra lỗi khi thêm vào danh sách yêu thích" }
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
    const token = localStorage.getItem("token")
    if (!token) {
      return {
        success: false,
        message: "Chưa đăng nhập",
        requireLogin: true,
      }
    }

    const response = await fetchData(`http://localhost:5000/api/wishlist/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response
  } catch (error) {
    console.error("Lỗi khi xóa khỏi danh sách yêu thích:", error)
    return { success: false, message: "Đã xảy ra lỗi khi xóa khỏi danh sách yêu thích" }
  }
}

// Hàm kiểm tra sản phẩm có trong danh sách yêu thích không
async function checkWishlistItem(productId) {
  if (!isLoggedIn()) {
    return false
  }

  try {
    const token = localStorage.getItem("token")
    if (!token) {
      return false
    }

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

// Hàm gửi đánh giá sản phẩm
async function submitProductReview(productId, rating, comment) {
  try {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Vui lòng đăng nhập để gửi đánh giá")
      return { success: false, message: "Chưa đăng nhập" }
    }

    // Sửa endpoint API để phù hợp với backend routes
    const response = await fetchData(`http://localhost:5000/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        rating,
        comment,
      }),
    })

    return response
  } catch (error) {
    console.error("Lỗi khi gửi đánh giá:", error)
    return { success: false, message: "Đã xảy ra lỗi khi gửi đánh giá" }
  }
}

// Hàm gửi đánh giá sản phẩm
async function submitReview(event) {
  event.preventDefault()

  // Kiểm tra đăng nhập
  const token = localStorage.getItem("token")
  if (!token) {
    alert("Vui lòng đăng nhập để gửi đánh giá")
    return
  }

  const productId = getUrlParameter("id")
  const rating = document.querySelector('input[name="rating"]:checked')?.value
  const comment = document.getElementById("review-comment").value.trim()

  if (!rating) {
    alert("Vui lòng chọn số sao đánh giá")
    return
  }

  try {
    const result = await submitProductReview(productId, rating, comment)

    if (result.success) {
      alert("Cảm ơn bạn đã gửi đánh giá!")
      // Reset form
      document.getElementById("review-form").reset()
      // Tải lại đánh giá
      loadProductReviews(productId)
    } else {
      alert(`Không thể gửi đánh giá: ${result.message}`)
    }
  } catch (error) {
    console.error("Lỗi khi gửi đánh giá:", error)
    alert("Đã xảy ra lỗi khi gửi đánh giá")
  }
}

// Khởi chạy khi trang đã tải xong
document.addEventListener("DOMContentLoaded", () => {
  addStyles()
  loadProductDetail()
  updateCartDisplay()

  // Gắn sự kiện cho form đánh giá
  const reviewForm = document.getElementById("review-form")
  if (reviewForm) {
    reviewForm.addEventListener("submit", submitReview)
  }

  // Gắn sự kiện cho các tab
  document.querySelectorAll(".tab-btn").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Bỏ active tất cả các tab
      document.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("active"))
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"))

      // Active tab được chọn
      this.classList.add("active")
      const tabId = this.dataset.tab
      document.getElementById(`${tabId}-tab`).classList.add("active")
    })
  })
})
