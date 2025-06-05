// Hàm để lấy dữ liệu từ API
async function fetchData(url, options = {}) {
  try {
    // Thêm token vào header nếu đã đăng nhập và token hợp lệ
    const token = getToken()
    if (token) {
      // Đảm bảo headers đã được khởi tạo
      options.headers = options.headers || {};
      
      // Thêm token vào header
      options.headers.Authorization = `Bearer ${token}`;
      
      // Log để debug
      console.log("Đang gửi request với token:", token.substring(0, 10) + "...");
    }

    const response = await fetch(url, options)
    
    // Kiểm tra lỗi xác thực
    if (response.status === 401) {
      // Nếu token không hợp lệ, xóa token và thông tin người dùng
      console.warn("Lỗi xác thực 401, đang xóa token không hợp lệ");
      localStorage.removeItem("token");
      
      // Không throw error để code có thể tiếp tục chạy với tư cách người dùng chưa đăng nhập
      return { success: false, message: "Phiên đăng nhập đã hết hạn" };
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu từ ${url}:`, error)
    throw error
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

// Hàm hiển thị thông báo
function showNotification(message, type = "info") {
  const notificationContainer = document.getElementById("notificationContainer") || createNotificationContainer()

  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
    </div>
  `

  notificationContainer.appendChild(notification)

  // Tự động ẩn thông báo sau 3 giây
  setTimeout(() => {
    notification.classList.add("hide")
    setTimeout(() => {
      notification.remove()
    }, 300)
  }, 300000)
}

// Hàm tạo container cho thông báo nếu chưa có
function createNotificationContainer() {
  const container = document.createElement("div")
  container.id = "notificationContainer"
  container.className = "notification-container"
  document.body.appendChild(container)

  // Thêm CSS cho thông báo
  const style = document.createElement("style")
  style.textContent = `
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    }
    
    .notification {
      background-color: #fff;
      border-left: 4px solid #4CAF50;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 4px;
      padding: 16px 20px;
      margin-bottom: 10px;
      min-width: 280px;
      max-width: 350px;
      transition: all 0.3s ease;
      animation: slideIn 0.3s ease;
    }
    
    .notification.error {
      border-left-color: #F44336;
    }
    
    .notification.success {
      border-left-color: #4CAF50;
    }
    
    .notification.warning {
      border-left-color: #FF9800;
    }
    
    .notification.info {
      border-left-color: #2196F3;
    }
    
    .notification.hide {
      opacity: 0;
      transform: translateX(100%);
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `
  document.head.appendChild(style)

  return container
}

// Lấy token từ localStorage
function getToken() {
  const token = localStorage.getItem("token");
  // Kiểm tra xem token có hợp lệ không (ít nhất phải có định dạng cơ bản của JWT)
  if (token && typeof token === 'string' && token.split('.').length === 3) {
    return token;
  }
  // Nếu token không hợp lệ, xóa khỏi localStorage để tránh lỗi
  if (token) {
    console.warn("Token không hợp lệ, đang xóa khỏi localStorage");
    localStorage.removeItem("token");
  }
  return null;
}

// Lấy user ID từ localStorage
function getUserId() {
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  return user.user_id || null
}

// Kiểm tra xem người dùng đã đăng nhập chưa
function isLoggedIn() {
  return !!getToken() && !!getUserId()
}

// Hàm lấy giỏ hàng từ API
async function fetchCart() {
  if (!isLoggedIn()) {
    // Nếu chưa đăng nhập, lấy giỏ hàng từ localStorage
    return getLocalCart()
  }

  try {
    const token = getToken()

    // Gọi API để lấy giỏ hàng
    try {
      const response = await fetchData(`http://localhost:5000/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.success) {
        return response.data
      } else {
        console.log("API giỏ hàng không trả về dữ liệu thành công, sử dụng giỏ hàng local")
        return getLocalCart() // Fallback to local cart if API fails
      }
    } catch (error) {
      console.log("API giỏ hàng không tồn tại hoặc có lỗi, sử dụng giỏ hàng local")
      return getLocalCart() // Fallback to local cart if API fails
    }
  } catch (error) {
    console.error("Lỗi khi lấy giỏ hàng:", error)
    return getLocalCart() // Fallback to local cart if API fails
  }
}

// Hàm lấy giỏ hàng từ localStorage (cho người dùng chưa đăng nhập)
function getLocalCart() {
  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")

  if (cartItems.length === 0) {
    return {
      cart_id: "local",
      user_id: null,
      items: [],
      total_amount: 0,
      item_count: 0,
    }
  }

  // Lấy thông tin sản phẩm từ localStorage
  const products = JSON.parse(localStorage.getItem("products") || "[]")

  // Map các sản phẩm trong giỏ hàng với thông tin sản phẩm
  const items = cartItems.map((item) => {
    const product = products.find((p) => p.product_id == item.productId) || {
      name: item.name || "Sản phẩm không xác định",
      price: item.price || 0,
      product_image: item.image || "/img/_12A7780.jpg",
    }

    return {
      cart_item_id: item.uniqueId || item.productId, // Sử dụng uniqueId hoặc productId làm cart_item_id tạm thời
      product_id: item.productId || item.product_id,
      quantity: item.quantity || 1, // Đảm bảo quantity có giá trị mặc định là 1
      name: item.name || product.name || "Sản phẩm không tên",
      price: item.price || product.price || 0,
      total_price: item.total_price || item.price || product.price || 0,
      product_image: item.image || product.product_image || "/img/_12A7780.jpg", // Ảnh mặc định nếu không có
      options: item.options || [], // Thêm tùy chọn sản phẩm
      options_text: item.options_text || "" // Thêm text mô tả tùy chọn
    }
  })

  // Tính tổng tiền
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  // Tính tổng số lượng các sản phẩm
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    cart_id: "local",
    user_id: null,
    items: items,
    total_amount: totalAmount,
    item_count: itemCount,
  }
}

// Hàm lấy thông tin người dùng
async function fetchUserInfo() {
  if (!isLoggedIn()) {
    return null
  }

  try {
    const userId = getUserId()
    const token = getToken()

    try {
      const response = await fetchData(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.success) {
        return response.data
      } else {
        console.error("Không thể lấy thông tin người dùng:", response)
        return getUserInfoFromLocalStorage()
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng từ API:", error)
      return getUserInfoFromLocalStorage()
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error)
    return null
  }
}

// Hàm lấy thông tin người dùng từ localStorage
function getUserInfoFromLocalStorage() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return {
      user_id: user.user_id,
      full_name: user.full_name || user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng từ localStorage:", error)
    return null
  }
}

// Hàm tạo đơn hàng mới
async function createOrder(orderData) {
  try {
    const token = getToken()
    const headers = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
      console.log("Đặt hàng với tài khoản đã đăng nhập");
    } else {
      console.log("Đặt hàng với tư cách khách (guest)");
      // Đảm bảo có thông tin khách hàng nếu chưa đăng nhập
      if (!orderData.guest_info) {
        return { 
          success: false, 
          message: "Vui lòng cung cấp thông tin người đặt hàng" 
        };
      }
    }

    const response = await fetchData("http://localhost:5000/api/orders", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(orderData),
    })
    
    // Nếu đặt hàng thành công, xóa giỏ hàng local
    if (response.success) {
      localStorage.removeItem("cart");
      console.log("Đã xóa giỏ hàng local sau khi đặt hàng thành công");
    }

    return response
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error)
    return { success: false, message: "Đã xảy ra lỗi khi tạo đơn hàng" }
  }
}

// Hàm áp dụng mã giảm giá từ cơ sở dữ liệu
async function applyDiscountCode(code, totalAmount) {
  if (!code) {
    return {
      discountAmount: 0,
      finalAmount: totalAmount,
      couponId: null,
      message: null
    }
  }

  try {
    // Gọi API để kiểm tra mã giảm giá
    const response = await fetchData(`http://localhost:5000/api/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: code,
        orderAmount: totalAmount
      })
    })

    if (response.success && response.data) {
      const coupon = response.data
      let discountAmount = 0

      // Tính số tiền giảm giá dựa vào loại giảm giá
      if (coupon.discount_type === "fixed") {
        // Giảm giá cố định
        discountAmount = coupon.discount_value
      } else if (coupon.discount_type === "percent") {
        // Giảm giá theo phần trăm
        discountAmount = Math.round((totalAmount * coupon.discount_value) / 100)
      }

      return {
        discountAmount: discountAmount,
        finalAmount: totalAmount - discountAmount,
        couponId: coupon.coupon_id,
        message: `Đã áp dụng mã giảm giá: ${coupon.description}`
      }
    } else {
      // Mã giảm giá không hợp lệ
      return {
        discountAmount: 0,
        finalAmount: totalAmount,
        couponId: null,
        message: response.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn"
      }
    }
  } catch (error) {
    console.error("Lỗi khi áp dụng mã giảm giá:", error)
    
    // Fallback: Sử dụng mã giảm giá cứng nếu API không hoạt động
    const discountCodes = {
      GIAOHANG0: {
        type: "shipping",
        value: 30000,
      },
      SALE10: {
        type: "percent",
        value: 10,
      },
      SALE20: {
        type: "percent",
        value: 20,
      },
      KHUYENMAI10: {
        type: "percent",
        value: 10,
      },
      FREESHIP: {
        type: "fixed",
        value: 20000,
      },
      SUMMER50: {
        type: "fixed",
        value: 50000,
      },
      WELCOME15: {
        type: "percent",
        value: 15,
      },
      BLACKFRIDAY: {
        type: "percent",
        value: 20,
      },
      YEAR2025: {
        type: "fixed",
        value: 25000,
      }
    }

    if (!discountCodes[code]) {
      return {
        discountAmount: 0,
        finalAmount: totalAmount,
        couponId: null,
        message: "Mã giảm giá không hợp lệ"
      }
    }

    const discount = discountCodes[code]
    let discountAmount = 0

    if (discount.type === "shipping") {
      discountAmount = discount.value
    } else if (discount.type === "percent") {
      discountAmount = Math.round((totalAmount * discount.value) / 100)
    } else if (discount.type === "fixed") {
      discountAmount = discount.value
    }

    return {
      discountAmount: discountAmount,
      finalAmount: totalAmount - discountAmount,
      couponId: null,
      message: `Đã áp dụng mã giảm giá: ${code}`
    }
  }
}

// Tọa độ mặc định của cửa hàng
const STORE_LOCATION = {
  lat: 10.7769, // Tọa độ mặc định (ví dụ: TP.HCM)
  lng: 106.7009,
  address: "141 Trần Đình Xu, Quận 1, TP.HCM"
};

// Hàm lấy vị trí hiện tại của người dùng
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt của bạn không hỗ trợ định vị"));
      return;
    }
    
    const locationStatus = document.getElementById("locationStatus");
    if (locationStatus) {
      locationStatus.textContent = "Đang xác định vị trí...";
      locationStatus.style.color = "#666";
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Lấy địa chỉ từ tọa độ (reverse geocoding)
          const response = await fetchData(`http://localhost:5000/api/reverse-geocode`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ lat, lng })
          });
          
          if (response.success && response.data) {
            if (locationStatus) {
              locationStatus.textContent = "Đã xác định vị trí thành công";
              locationStatus.style.color = "green";
            }
            
            resolve({
              lat,
              lng,
              address: response.data.address,
              street: response.data.street || "",
              ward: response.data.ward || "",
              district: response.data.district || "",
              city: response.data.city || ""
            });
          } else {
            // Nếu không lấy được địa chỉ chi tiết, trả về tọa độ
            if (locationStatus) {
              locationStatus.textContent = "Đã xác định tọa độ, nhưng không thể lấy địa chỉ chi tiết";
              locationStatus.style.color = "orange";
            }
            
            resolve({
              lat,
              lng,
              address: `Vị trí (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
              street: "",
              ward: "",
              district: "",
              city: ""
            });
          }
        } catch (error) {
          console.error("Lỗi khi lấy địa chỉ từ tọa độ:", error);
          if (locationStatus) {
            locationStatus.textContent = "Đã xác định tọa độ, nhưng không thể lấy địa chỉ";
            locationStatus.style.color = "orange";
          }
          
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `Vị trí (${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)})`,
            street: "",
            ward: "",
            district: "",
            city: ""
          });
        }
      },
      (error) => {
        console.error("Lỗi khi lấy vị trí:", error);
        if (locationStatus) {
          locationStatus.textContent = "Không thể xác định vị trí. Vui lòng kiểm tra quyền truy cập vị trí.";
          locationStatus.style.color = "red";
        }
        
        reject(new Error("Không thể xác định vị trí: " + getGeolocationErrorMessage(error)));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Hàm lấy thông báo lỗi định vị
function getGeolocationErrorMessage(error) {
  switch(error.code) {
    case error.PERMISSION_DENIED:
      return "Người dùng từ chối cấp quyền truy cập vị trí.";
    case error.POSITION_UNAVAILABLE:
      return "Thông tin vị trí không khả dụng.";
    case error.TIMEOUT:
      return "Yêu cầu lấy vị trí đã hết thời gian chờ.";
    case error.UNKNOWN_ERROR:
      return "Đã xảy ra lỗi không xác định.";
    default:
      return "Đã xảy ra lỗi không xác định.";
  }
}

// Hàm tính phí giao hàng dựa trên khoảng cách
async function calculateShippingFee(customerLocation) {
  try {
    let distance = 0;
    let customerCoords = null;
    
    // Nếu đã có tọa độ khách hàng
    if (customerLocation && customerLocation.lat && customerLocation.lng) {
      customerCoords = {
        lat: customerLocation.lat,
        lng: customerLocation.lng
      };
    } 
    // Nếu chỉ có địa chỉ, thử lấy tọa độ từ API
    else if (customerLocation && customerLocation.address) {
      try {
        const response = await fetchData(`http://localhost:5000/api/geocode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ address: customerLocation.address })
        });
        
        if (response.success && response.data) {
          customerCoords = {
            lat: response.data.lat,
            lng: response.data.lng
          };
        }
      } catch (error) {
        console.error("Lỗi khi lấy tọa độ từ địa chỉ:", error);
      }
    }
    
    // Nếu không lấy được tọa độ từ API, thử lấy từ localStorage
    if (!customerCoords) {
      const addressId = localStorage.getItem("selectedAddressId");
      if (addressId) {
        const addresses = JSON.parse(localStorage.getItem("userAddresses") || "[]");
        const selectedAddress = addresses.find(addr => addr.address_id == addressId);
        
        if (selectedAddress && selectedAddress.lat && selectedAddress.lng) {
          customerCoords = {
            lat: selectedAddress.lat,
            lng: selectedAddress.lng
          };
        }
      }
    }
    
    // Nếu có tọa độ khách hàng, tính khoảng cách
    if (customerCoords) {
      distance = calculateDistance(
        STORE_LOCATION.lat, 
        STORE_LOCATION.lng, 
        customerCoords.lat, 
        customerCoords.lng
      );
      
      // Lưu tọa độ khách hàng vào localStorage để sử dụng sau
      localStorage.setItem("customerLocation", JSON.stringify(customerCoords));
    } else {
      // Nếu không có tọa độ, sử dụng khoảng cách mặc định (5km)
      distance = 5;
    }
    
    // Tính phí giao hàng dựa trên khoảng cách
    let shippingFee = 15000; // Phí cơ bản
    
    // Cộng thêm phí theo khoảng cách
    if (distance <= 2) {
      // Dưới 2km: phí cơ bản
      shippingFee = 15000;
    } else if (distance <= 5) {
      // 2-5km: 15k + 5k/km
      shippingFee = 15000 + (distance - 2) * 5000;
    } else if (distance <= 10) {
      // 5-10km: 30k + 6k/km
      shippingFee = 30000 + (distance - 5) * 6000;
    } else {
      // Trên 10km: 60k + 8k/km
      shippingFee = 60000 + (distance - 10) * 8000;
    }
    
    // Làm tròn phí giao hàng đến 1000đ
    shippingFee = Math.ceil(shippingFee / 1000) * 1000;
    
    // Cập nhật thông tin khoảng cách trên giao diện
    updateDistanceInfo(distance, shippingFee);
    
    return {
      fee: shippingFee,
      distance: distance,
      unit: "km"
    };
  } catch (error) {
    console.error("Lỗi khi tính phí giao hàng:", error);
    // Trả về phí giao hàng mặc định nếu có lỗi
    return {
      fee: 30000,
      distance: 0,
      unit: "km"
    };
  }
}

// Hàm cập nhật thông tin khoảng cách trên giao diện
function updateDistanceInfo(distance, shippingFee) {
  const distanceInfo = document.getElementById("distanceInfo");
  if (distanceInfo) {
    distanceInfo.innerHTML = `
      <div>
        <strong>Khoảng cách:</strong> ${distance} km từ cửa hàng
        <div class="store-address"><small>${STORE_LOCATION.address}</small></div>
      </div>
      <div>
        <strong>Phí giao hàng:</strong> ${formatCurrency(shippingFee)}
      </div>
    `;
  }
}

// Hàm tính khoảng cách giữa hai tọa độ (công thức Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Làm tròn đến 1 chữ số thập phân
}

// Hàm chuyển đổi độ sang radian
function toRad(value) {
  return value * Math.PI / 180;
}

// Hàm render thông tin thanh toán
async function renderCheckout(cart, userInfo) {
  const orderSummary = document.getElementById("orderSummary")
  const totalAmountSpan = document.getElementById("totalAmount")

  if (!orderSummary || !totalAmountSpan) {
    console.error("Không tìm thấy phần tử DOM cần thiết")
    return
  }

  // Kiểm tra nếu giỏ hàng trống
  if (!cart || !cart.items || cart.items.length === 0) {
    orderSummary.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3 class="empty-cart-title">Giỏ hàng của bạn đang trống</h3>
                <p class="empty-cart-text">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
                <a href="menu.html" class="btn btn-primary">Xem thực đơn ngay</a>
            </div>
        `
    totalAmountSpan.textContent = "0đ"
    return
  }

  // Tạo HTML cho danh sách sản phẩm
  let productsHTML = ""
  let totalAmount = 0

  cart.items.forEach((item) => {
    // Tính giá sản phẩm bao gồm cả options
    let itemPrice = parseFloat(item.price);
    
    // Thêm giá của options nếu có
    if (item.options) {
      let options = item.options;
      
      // Nếu options là chuỗi, thử parse thành object
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch (e) {
          console.log(`Không thể parse options cho sản phẩm ${item.name}:`, e);
        }
      }
      
      // Nếu options là array, tính tổng giá
      if (Array.isArray(options)) {
        options.forEach(option => {
          if (option.additional_price) {
            itemPrice += parseFloat(option.additional_price);
          }
        });
      }
    }
    
    const itemTotal = itemPrice * item.quantity
    totalAmount += itemTotal
    
    // Kiểm tra xem sản phẩm có tùy chọn không
    const hasOptions = item.options && item.options.length > 0;
    const optionsText = hasOptions ? (item.options_text || item.optionsText || '') : '';

    productsHTML += `
            <div class="order-item">
                <img src="${item.product_image || "/images/default-product.jpg"}" alt="${item.name}" class="order-item-image">
                <div class="order-item-details">
                    <div class="order-item-info">
                        <div class="order-item-name">${item.name}</div>
                        ${optionsText ? `<div class="order-item-options">${optionsText}</div>` : ''}
                    </div>
                    <div class="order-item-price-qty">
                        <div class="order-item-price">${formatCurrency(itemPrice)}</div>
                        <div class="order-item-quantity">x${item.quantity}</div>
                    </div>
                </div>
            </div>
        `
  })

  // Lấy thông tin địa chỉ giao hàng
  let customerLocation = null;
  
  // Kiểm tra loại địa chỉ đang được chọn
  const addressTypeBtn = document.querySelector('.address-type-btn.active');
  if (addressTypeBtn && addressTypeBtn.getAttribute('data-type') === 'saved') {
    // Nếu đang sử dụng địa chỉ đã lưu
    const savedAddressesSelect = document.getElementById('savedAddresses');
    if (savedAddressesSelect && savedAddressesSelect.value) {
      const addressId = savedAddressesSelect.value;
      const addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
      const selectedAddress = addresses.find(addr => addr.address_id == addressId);
      
      if (selectedAddress) {
        customerLocation = {
          address: selectedAddress.street + ', ' + selectedAddress.district + ', ' + selectedAddress.city,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng
        };
      }
    }
  } else {
    // Nếu đang sử dụng địa chỉ mới
    const addressTextarea = document.getElementById("address");
    if (addressTextarea && addressTextarea.value) {
      customerLocation = {
        address: addressTextarea.value
      };
      
      // Kiểm tra xem có tọa độ đã lưu không
      const savedLocation = JSON.parse(localStorage.getItem('customerLocation') || 'null');
      if (savedLocation) {
        customerLocation.lat = savedLocation.lat;
        customerLocation.lng = savedLocation.lng;
      }
    }
  }
  
  // Tính phí giao hàng dựa trên khoảng cách
  let shippingInfo;
  if (customerLocation) {
    shippingInfo = await calculateShippingFee(customerLocation);
  } else {
    // Nếu chưa có địa chỉ, sử dụng phí giao hàng mặc định
    shippingInfo = {
      fee: 30000,
      distance: 0,
      unit: "km"
    };
  }
  
  const shippingFee = shippingInfo.fee;
  
  // Lấy thông tin giảm giá từ localStorage
  const discountAmount = Number.parseFloat(localStorage.getItem("discountAmount")) || 0;
  const couponId = localStorage.getItem("appliedCouponId") || null;
  const couponCode = localStorage.getItem("appliedCouponCode") || "";

  // Tổng thanh toán cuối cùng
  const finalAmount = totalAmount + shippingFee - discountAmount;

  // Cập nhật thông tin sản phẩm
  orderSummary.innerHTML = `
        <div class="order-items">
            ${productsHTML}
        </div>
        <div class="order-summary">
            <div class="summary-row">
                <span class="summary-label">Tổng tiền hàng:</span>
                <span class="summary-value">${formatCurrency(totalAmount)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Phí giao hàng (${shippingInfo.distance}${shippingInfo.unit}):</span>
                <span class="summary-value shipping">${formatCurrency(shippingFee)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Giảm giá${couponCode ? ` (${couponCode})` : ''}:</span>
                <span class="summary-value discount">-${formatCurrency(discountAmount)}</span>
            </div>
            <div class="summary-row total">
                <span class="summary-label">Tổng thanh toán:</span>
                <span class="summary-value">${formatCurrency(finalAmount)}</span>
            </div>
        </div>
    `

  // Cập nhật tổng tiền
  totalAmountSpan.textContent = formatCurrency(finalAmount);
  
  // Lưu thông tin phí giao hàng vào localStorage để sử dụng khi đặt hàng
  localStorage.setItem("shippingFee", shippingFee);
  localStorage.setItem("shippingDistance", shippingInfo.distance);

  // Điền thông tin người dùng vào form nếu đã đăng nhập
  if (userInfo) {
    // Điền thông tin vào các trường đã có sẵn trong HTML
    const fullNameInput = document.getElementById("fullName")
    const phoneInput = document.getElementById("phone")
    const emailInput = document.getElementById("email")

    if (fullNameInput && !fullNameInput.value) fullNameInput.value = userInfo.full_name || ""
    if (phoneInput && !phoneInput.value) phoneInput.value = userInfo.phone || ""
    if (emailInput && !emailInput.value) emailInput.value = userInfo.email || ""
  }

  // Thêm CSS cho form
  addCheckoutStyles()
}

// Hàm thêm CSS cho form
function addCheckoutStyles() {
  // Kiểm tra xem đã thêm style chưa
  if (document.getElementById("checkout-styles")) return

  const style = document.createElement("style")
  style.id = "checkout-styles"
  style.textContent = `
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-control {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .form-control:focus {
            border-color: var(--secondary-color);
            box-shadow: 0 0 0 2px rgba(224, 181, 115, 0.2);
            outline: none;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--primary-color);
        }
        
        textarea.form-control {
            min-height: 100px;
            resize: vertical;
        }
        
        .checkout-product {
            display: flex;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px dashed #eee;
        }
        
        .checkout-product:last-child {
            border-bottom: none;
        }
        
        .product-image {
            width: 80px;
            height: 80px;
            margin-right: 15px;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .product-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .product-details-info {
            flex: 1;
        }
        
        .product-details-info h4 {
            margin: 0 0 8px;
            color: var(--primary-color);
            font-size: 1.1rem;
        }
        
        .product-details-info p {
            margin: 5px 0;
            color: #666;
        }
        
        hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 20px 0;
        }
        
        .checkout-summary {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
        }
        
        .checkout-summary p {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
        }
        
        .total-amount {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--secondary-color);
            border-top: 1px solid #ddd;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .price {
            font-weight: 600;
        }
        
        .login-required {
            text-align: center;
            padding: 30px 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .login-required i {
            font-size: 3rem;
            color: var(--primary-color);
            margin-bottom: 15px;
        }
        
        .login-required h3 {
            margin-bottom: 10px;
            color: var(--primary-color);
        }
        
        .login-required p {
            margin-bottom: 20px;
            color: #666;
        }
        
        .empty-cart {
            text-align: center;
            padding: 30px 20px;
        }
        
        .empty-cart-icon {
            font-size: 3rem;
            color: #ddd;
            margin-bottom: 15px;
        }
        
        .empty-cart-title {
            margin-bottom: 10px;
            color: var(--primary-color);
        }
        
        .empty-cart-text {
            margin-bottom: 20px;
            color: #666;
        }
        
        .order-item-options {
            font-size: 0.85rem;
            color: #666;
            font-style: italic;
            margin-top: 4px;
            line-height: 1.3;
        }
    `
  document.head.appendChild(style)
}

// Hàm xử lý sự kiện khi chọn mã giảm giá
function handleDiscountCodeChange() {
  const discountSelect = document.getElementById("discount-code")
  const cart = JSON.parse(localStorage.getItem("checkout-cart") || "{}")

  if (!discountSelect || !cart || !cart.items || cart.items.length === 0) return

  discountSelect.addEventListener("change", function () {
    const code = this.value
    const shippingFee = 30000

    // Áp dụng mã giảm giá
    const { discountAmount, finalAmount } = applyDiscountCode(code, cart.total_amount + shippingFee)

    // Cập nhật hiển thị
    const discountElement = document.querySelector(".discount-amount .price")
    const totalElement = document.querySelector(".total-amount .price")

    if (discountElement) {
      discountElement.textContent = formatCurrency(discountAmount)
    }

    if (totalElement) {
      totalElement.textContent = formatCurrency(finalAmount)
    }
  })
}

// Hàm kiểm tra tính hợp lệ của form
function validateForm() {
  const fullName = document.getElementById("fullName").value.trim()
  const phone = document.getElementById("phone").value.trim()
  const email = document.getElementById("email").value.trim()
  const address = document.getElementById("address").value.trim()
  const city = document.getElementById("city").value

  const errors = []

  // Kiểm tra họ tên
  if (!fullName) {
    errors.push("Vui lòng nhập họ tên")
  } else if (fullName.length < 2) {
    errors.push("Họ tên phải có ít nhất 2 ký tự")
  }

  // Kiểm tra số điện thoại
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
  if (!phone) {
    errors.push("Vui lòng nhập số điện thoại")
  } else if (!phoneRegex.test(phone)) {
    errors.push("Số điện thoại không hợp lệ")
  }

  // Kiểm tra email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    errors.push("Vui lòng nhập email")
  } else if (!emailRegex.test(email)) {
    errors.push("Email không hợp lệ")
  }

  // Kiểm tra địa chỉ
  if (!address) {
    errors.push("Vui lòng nhập địa chỉ")
  } else if (address.length < 10) {
    errors.push("Địa chỉ phải có ít nhất 10 ký tự")
  }

  // Kiểm tra thành phố
  if (!city) {
    errors.push("Vui lòng chọn thành phố")
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  }
}

// Hàm hiển thị lỗi
function showErrors(errors) {
  const errorContainer =
    document.getElementById("errorContainer") ||
    (() => {
      const div = document.createElement("div")
      div.id = "errorContainer"
      div.className = "error-container"
      const form = document.getElementById("checkoutForm")
      form.insertBefore(div, form.firstChild)
      return div
    })()

  errorContainer.innerHTML = `
        <div class="alert alert-danger">
            <ul>
                ${errors.map((error) => `<li>${error}</li>`).join("")}
            </ul>
        </div>
    `

  // Tự động ẩn thông báo lỗi sau 5 giây
  setTimeout(() => {
    errorContainer.innerHTML = ""
  }, 5000)
}

// Modify the handleCheckoutButton function to fix the address handling and order data structure
// Replace the entire handleCheckoutButton function with this updated version

async function handleCheckoutButton() {
  const checkoutButton = document.querySelector(".btn-checkout")

  if (!checkoutButton) return

  // Hàm tính tổng tiền
  function calculateTotal(cartItems) {
    let total = 0
    cartItems.forEach((item) => {
      total += item.price * item.quantity
    })

    // Kiểm tra mã giảm giá
    const discountAmount = localStorage.getItem("discountAmount")
    if (discountAmount) {
      total -= Number.parseFloat(discountAmount)
    }

    return total
  }

  document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault()

    // Kiểm tra đăng nhập - cho phép thanh toán không cần đăng nhập
    // nhưng hiển thị thông báo về lợi ích khi đăng nhập
    if (!isLoggedIn()) {
      // Hiển thị thông báo khuyến khích đăng nhập nhưng không bắt buộc
      const confirmLogin = confirm("Đăng nhập để nhận thêm ưu đãi và tích điểm thành viên. Bạn có muốn đăng nhập không?");
      
      if (confirmLogin) {
        // Nếu người dùng chọn đăng nhập
        localStorage.setItem("checkout-data", JSON.stringify({
          fullName: document.getElementById("fullName").value.trim(),
          email: document.getElementById("email").value.trim(),
          phone: document.getElementById("phone").value.trim(),
          address: document.getElementById("address").value.trim(),
          city: document.getElementById("city").value
        }));
        
        window.location.href = "/pages/account.html?redirect=checkout";
        return;
      }
      // Nếu không đăng nhập, vẫn tiếp tục thanh toán
    }

    // Kiểm tra form
    const { isValid, errors } = validateForm()
    if (!isValid) {
      showErrors(errors)
      return
    }

    const paymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked')
    if (!paymentMethodElement) {
      showErrors(["Vui lòng chọn phương thức thanh toán."])
      return
    }

    const paymentMethod = paymentMethodElement.value

    // Lấy giỏ hàng từ localStorage
    const cart = JSON.parse(localStorage.getItem("checkout-cart")) || {}
    const cartItems = cart.items || []

    if (cartItems.length === 0) {
      showNotification("Giỏ hàng của bạn đang trống", "error")
      return
    }

    // Lấy thông tin từ form
    const fullName = document.getElementById("fullName").value.trim()
    const email = document.getElementById("email").value.trim()
    const phone = document.getElementById("phone").value.trim()
    const address = document.getElementById("address").value.trim()
    const city = document.getElementById("city").value
    // Lấy phí giao hàng từ localStorage (đã được tính toán dựa trên khoảng cách)
    const shippingFee = Number.parseFloat(localStorage.getItem("shippingFee")) || 30000
    const discountAmount = Number.parseFloat(localStorage.getItem("discountAmount")) || 0
    const couponId = Number.parseInt(localStorage.getItem("appliedCouponId")) || null
    const totalAmount = calculateTotal(cartItems) + shippingFee - discountAmount

    try {
      // Bước 1: Tạo địa chỉ mới hoặc lấy địa chỉ hiện có (chỉ khi đã đăng nhập)
      let addressId = null;

      // Nếu người dùng đã đăng nhập, tạo hoặc lấy địa chỉ
      if (isLoggedIn()) {
        try {
          // Tạo địa chỉ mới
          const addressResponse = await fetch("http://localhost:5000/api/addresses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
              street: address,
              city: city,
              district: city, // Using city as district since district field is required
              postal_code: "", // Optional field
              label: "Địa chỉ giao hàng",
              is_default: false, // Not setting as default to avoid changing user's existing default
            }),
          })

        if (!addressResponse.ok) {
          const errorData = await addressResponse.json()
          console.error("Address creation error details:", errorData)
          throw new Error(errorData.message || `HTTP error! Status: ${addressResponse.status}`)
        }

        const addressResult = await addressResponse.json()
        if (addressResult.success) {
          addressId = addressResult.data.address_id
          console.log("Address created successfully with ID:", addressId)
        } else {
          throw new Error(addressResult.message || "Lỗi khi tạo địa chỉ")
        }
      } catch (addressError) {
        console.error("Lỗi khi tạo địa chỉ:", addressError)
        // Nếu không tạo được địa chỉ mới, thử lấy địa chỉ mặc định của người dùng
        try {
          const addressesResponse = await fetch("http://localhost:5000/api/addresses", {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          })

          if (!addressesResponse.ok) {
            const errorData = await addressesResponse.json()
            console.error("Get addresses error details:", errorData)
            throw new Error(errorData.message || `HTTP error! Status: ${addressesResponse.status}`)
          }

          const addressesResult = await addressesResponse.json()
          if (addressesResult.success && addressesResult.data.length > 0) {
            // Lấy địa chỉ mặc định hoặc địa chỉ đầu tiên
            const defaultAddress = addressesResult.data.find((addr) => addr.is_default) || addressesResult.data[0]
            addressId = defaultAddress.address_id
            console.log("Using existing address with ID:", addressId)
          } else {
            // If no addresses found, create a fallback address with all required fields
            const fallbackAddressResponse = await fetch("http://localhost:5000/api/addresses", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
              },
              body: JSON.stringify({
                street: address || "Địa chỉ không xác định",
                city: city || "Thành phố không xác định",
                district: city || "Quận/Huyện không xác định", // Using city as district
                postal_code: "",
                label: "Địa chỉ giao hàng tạm thời",
              }),
            })

            if (fallbackAddressResponse.ok) {
              const fallbackResult = await fallbackAddressResponse.json()
              if (fallbackResult.success) {
                addressId = fallbackResult.data.address_id
                console.log("Created fallback address with ID:", addressId)
              } else {
                throw new Error("Không thể tạo địa chỉ dự phòng")
              }
            } else {
              throw new Error("Không tìm thấy địa chỉ và không thể tạo địa chỉ mới")
            }
          }
        } catch (getAddressError) {
          console.error("Lỗi khi lấy địa chỉ:", getAddressError)
          if (isLoggedIn()) {
            showNotification("Không thể tạo hoặc lấy địa chỉ. Vui lòng thử lại!", "error")
            return
          }
          // Nếu không đăng nhập, tiếp tục mà không cần addressId
          console.log("Người dùng chưa đăng nhập, tiếp tục đặt hàng không cần addressId");
        }
      }
    } else {
      // Nếu không đăng nhập, không cần tạo địa chỉ trong hệ thống
      console.log("Người dùng chưa đăng nhập, không tạo địa chỉ trong hệ thống");
    }

      // Bước 2: Tạo đơn hàng
      const orderData = {
        payment_method: paymentMethod,
        total_amount: totalAmount,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        
        // Thêm các trường tùy thuộc vào trạng thái đăng nhập
        ...(isLoggedIn() && addressId ? { address_id: addressId } : {}),
        ...(couponId ? { coupon_id: couponId } : {}),
        
        // Thêm thông tin khách hàng chỉ khi không đăng nhập
        ...(isLoggedIn() ? {} : {
          guest_info: {
            full_name: fullName,
            email: email,
            phone: phone,
            address: address,
            city: city
          }
        }),
        
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price
        })),
      }

      console.log("Sending order data:", orderData)

      // Chuẩn bị headers - chỉ thêm Authorization nếu đã đăng nhập
      const headers = {
        "Content-Type": "application/json"
      };
      
      if (isLoggedIn()) {
        const token = getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
      
      console.log("Sending request with headers:", headers);
      
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        // Xử lý lỗi xác thực
        if (response.status === 401 && isLoggedIn()) {
          // Nếu lỗi xác thực và người dùng đã đăng nhập, có thể token không hợp lệ
          localStorage.removeItem("token");
          showNotification("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "warning");
          
          // Chuyển hướng đến trang đăng nhập sau 2 giây
          setTimeout(() => {
            window.location.href = "/pages/account.html?redirect=checkout";
          }, 2000);
          return;
        }
        
        // Xử lý các lỗi khác
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      const result = await response.json()

      if (result.success) {
        console.log("Đặt hàng thành công:", result);
        
        // Lưu thông tin đơn hàng vào localStorage nếu không đăng nhập
        if (!isLoggedIn() && result.data && result.data.order_id) {
          console.log("Saving order to localStorage:", result.data);
          
          // Lấy thông tin sản phẩm từ giỏ hàng
          const cartItemsWithImages = cartItems.map(item => {
            // Tìm hình ảnh sản phẩm nếu có
            let image = item.image;
            if (!image) {
              // Nếu không có hình ảnh, sử dụng hình mặc định
              image = '../img/products/default.jpg';
            }
            
            return {
              product_id: item.product_id,
              name: item.name,
              quantity: item.quantity,
              unit_price: item.price,
              price: item.price,
              image: image
            };
          });
          
          // Lưu thông tin đơn hàng
          const orderData = {
            order_id: result.data.order_id,
            status: result.data.status || "pending",
            payment_method: paymentMethod,
            total_amount: totalAmount,
            created_at: new Date().toISOString(),
            items: cartItemsWithImages,
            guest_info: {
              full_name: fullName,
              email: email,
              phone: phone,
              address: address,
              city: city
            }
          };
          
          console.log("Order data to save:", orderData);
          
          // Lưu đơn hàng vào localStorage
          localStorage.setItem(`order_${result.data.order_id}`, JSON.stringify(orderData));
          
          // Thêm ID đơn hàng vào danh sách đơn hàng của khách
          const guestOrderIds = JSON.parse(localStorage.getItem('guestOrderIds') || '[]');
          guestOrderIds.push(result.data.order_id);
          localStorage.setItem('guestOrderIds', JSON.stringify(guestOrderIds));
          
          console.log("Guest order IDs:", guestOrderIds);
        }
        
        // Xóa giỏ hàng sau khi đặt hàng thành công
        localStorage.removeItem("cart");
        localStorage.removeItem("checkout-cart");
        localStorage.removeItem("discountAmount");
        localStorage.removeItem("appliedCouponId");
        localStorage.removeItem("shippingFee");
        localStorage.removeItem("memberDiscount");

        // Nếu đã đăng nhập, cũng xóa giỏ hàng trên server
        if (isLoggedIn()) {
          try {
            // Gọi API để xóa giỏ hàng trên server
            fetch("http://localhost:5000/api/cart/clear", {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${getToken()}`,
              },
            })
              .then((response) => {
                console.log("Đã xóa giỏ hàng trên server");
              })
              .catch((error) => {
                console.error("Lỗi khi xóa giỏ hàng trên server:", error);
              });
          } catch (error) {
            console.error("Lỗi khi xóa giỏ hàng:", error);
          }
        }

        // Cập nhật số lượng hiển thị trên icon giỏ hàng
        const cartCountElements = document.querySelectorAll(".cart-count, .cart-item-count-badge")
        cartCountElements.forEach((element) => {
          if (element) {
            element.textContent = "0"
            element.style.display = "none"
          }
        })

        // Hiển thị thông báo thành công
        showNotification("Đặt hàng thành công!", "success")

        // Chờ 1 giây trước khi chuyển hướng
        setTimeout(() => {
          // Chuyển hướng đến trang lịch sử đơn hàng với ID đơn hàng
          window.location.href = `order.html?id=${result.data.order_id}`
        }, 1000)
      } else {
        throw new Error(result.message || "Lỗi khi tạo đơn hàng")
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      
      // Hiển thị thông tin chi tiết hơn về lỗi
      let errorMessage = "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!";
      
      if (error.message) {
        if (error.message.includes("401")) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng làm mới trang và thử lại.";
        } else if (error.message.includes("404")) {
          errorMessage = "Không tìm thấy tài nguyên yêu cầu. Vui lòng kiểm tra lại thông tin.";
        } else if (error.message.includes("500")) {
          errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
        } else {
          errorMessage = error.message;
        }
      }
      
      showNotification(errorMessage, "error");
      
      // Log chi tiết lỗi để debug
      console.log("Chi tiết lỗi:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  })
}

// Hàm xử lý khi người dùng thay đổi mã giảm giá
function handleDiscountCodeChange() {
  const discountCodeInput = document.getElementById("discountCode");
  const applyDiscountButton = document.getElementById("applyDiscount");
  
  if (!discountCodeInput || !applyDiscountButton) return;
  
  applyDiscountButton.addEventListener("click", async function() {
    const code = discountCodeInput.value.trim();
    if (!code) {
      showNotification("Vui lòng nhập mã giảm giá", "warning");
      return;
    }
    
    // Lấy giỏ hàng từ localStorage
    const cart = JSON.parse(localStorage.getItem("checkout-cart")) || {};
    const cartItems = cart.items || [];
    
    if (cartItems.length === 0) {
      showNotification("Giỏ hàng của bạn đang trống", "error");
      return;
    }
    
    // Tính tổng tiền hàng
    let totalAmount = 0;
    cartItems.forEach(item => {
      totalAmount += item.price * item.quantity;
    });
    
    // Lấy phí giao hàng từ localStorage
    const shippingFee = Number.parseFloat(localStorage.getItem("shippingFee")) || 30000;
    
    // Áp dụng mã giảm giá
    const discountResult = await applyDiscountCode(code, totalAmount);
    
    if (discountResult.discountAmount > 0) {
      // Lưu thông tin giảm giá vào localStorage
      localStorage.setItem("discountAmount", discountResult.discountAmount);
      localStorage.setItem("appliedCouponId", discountResult.couponId || "");
      localStorage.setItem("appliedCouponCode", code);
      
      // Hiển thị thông báo thành công
      showNotification(discountResult.message || "Áp dụng mã giảm giá thành công", "success");
      
      // Hiển thị thông tin mã giảm giá đã áp dụng
      if (discountResult) {
        discountResult.innerHTML = `
          <div class="discount-applied" style="color: green; margin-top: 10px;">
            <i class="fas fa-check-circle"></i> Đã áp dụng mã giảm giá: ${code} (-${formatCurrency(discountResult.discountAmount)})
          </div>
        `;
      }
      
      // Cập nhật lại giao diện
      const cart = JSON.parse(localStorage.getItem("checkout-cart"));
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      renderCheckout(cart, userInfo);
      
      // Vô hiệu hóa input và nút áp dụng
      discountCodeInput.disabled = true;
      applyDiscountButton.disabled = true;
      
      // Thêm nút xóa mã giảm giá
      const discountContainer = discountCodeInput.parentElement;
      const removeButton = document.createElement("button");
      removeButton.id = "removeDiscountBtn";
      removeButton.className = "btn btn-sm btn-outline-danger";
      removeButton.innerHTML = '<i class="fas fa-times"></i>';
      removeButton.style.marginLeft = "5px";
      discountContainer.appendChild(removeButton);
      
      // Gắn sự kiện cho nút xóa
      removeButton.addEventListener("click", function() {
        // Xóa thông tin giảm giá khỏi localStorage
        localStorage.removeItem("discountAmount");
        localStorage.removeItem("appliedCouponId");
        localStorage.removeItem("appliedCouponCode");
        
        // Kích hoạt lại input và nút áp dụng
        discountCodeInput.disabled = false;
        applyDiscountButton.disabled = false;
        discountCodeInput.value = "";
        
        // Xóa nút xóa
        removeButton.remove();
        
        // Cập nhật lại giao diện
        const cart = JSON.parse(localStorage.getItem("checkout-cart"));
        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
        renderCheckout(cart, userInfo);
        
        showNotification("Đã xóa mã giảm giá", "info");
      });
    } else {
      // Hiển thị thông báo lỗi
      showNotification(discountResult.message || "Mã giảm giá không hợp lệ", "error");
    }
  });
  
  // Hiển thị kết quả áp dụng mã giảm giá
  const discountResult = document.getElementById("discountResult");
  
  // Kiểm tra nếu đã có mã giảm giá được áp dụng
  const appliedCode = localStorage.getItem("appliedCouponCode");
  if (appliedCode) {
    discountCodeInput.value = appliedCode;
    discountCodeInput.disabled = true;
    applyDiscountButton.disabled = true;
    
    // Hiển thị thông báo mã giảm giá đã được áp dụng
    if (discountResult) {
      const discountAmount = Number.parseFloat(localStorage.getItem("discountAmount")) || 0;
      discountResult.innerHTML = `
        <div class="discount-applied" style="color: green; margin-top: 10px;">
          <i class="fas fa-check-circle"></i> Đã áp dụng mã giảm giá: ${appliedCode} (-${formatCurrency(discountAmount)})
        </div>
      `;
    }
    
    // Thêm nút xóa mã giảm giá
    const discountContainer = discountCodeInput.parentElement;
    if (!document.getElementById("removeDiscountBtn")) {
      const removeButton = document.createElement("button");
      removeButton.id = "removeDiscountBtn";
      removeButton.className = "btn btn-sm btn-outline-danger";
      removeButton.innerHTML = '<i class="fas fa-times"></i>';
      removeButton.style.marginLeft = "5px";
      discountContainer.appendChild(removeButton);
      
      // Gắn sự kiện cho nút xóa
      removeButton.addEventListener("click", function() {
        // Xóa thông tin giảm giá khỏi localStorage
        localStorage.removeItem("discountAmount");
        localStorage.removeItem("appliedCouponId");
        localStorage.removeItem("appliedCouponCode");
        
        // Kích hoạt lại input và nút áp dụng
        discountCodeInput.disabled = false;
        applyDiscountButton.disabled = false;
        discountCodeInput.value = "";
        
        // Xóa nút xóa
        removeButton.remove();
        
        // Cập nhật lại giao diện
        const cart = JSON.parse(localStorage.getItem("checkout-cart"));
        const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
        renderCheckout(cart, userInfo);
        
        showNotification("Đã xóa mã giảm giá", "info");
      });
    }
  }
}

// Hàm xử lý khi người dùng thay đổi địa chỉ giao hàng
function handleAddressChange() {
  // Xử lý chuyển đổi giữa địa chỉ mới và địa chỉ đã lưu
  const addressTypeBtns = document.querySelectorAll('.address-type-btn');
  const newAddressContainer = document.getElementById('newAddressContainer');
  const savedAddressContainer = document.getElementById('savedAddressContainer');
  
  if (addressTypeBtns.length > 0) {
    addressTypeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        // Xóa class active từ tất cả các nút
        addressTypeBtns.forEach(b => b.classList.remove('active'));
        // Thêm class active cho nút được click
        this.classList.add('active');
        
        const type = this.getAttribute('data-type');
        if (type === 'new') {
          newAddressContainer.style.display = 'block';
          savedAddressContainer.style.display = 'none';
        } else {
          newAddressContainer.style.display = 'none';
          savedAddressContainer.style.display = 'block';
          
          // Tải danh sách địa chỉ đã lưu
          loadSavedAddresses();
        }
      });
    });
  }
  
  // Xử lý khi người dùng chọn địa chỉ đã lưu
  const savedAddressesSelect = document.getElementById('savedAddresses');
  if (savedAddressesSelect) {
    savedAddressesSelect.addEventListener('change', async function() {
      const addressId = this.value;
      if (!addressId) return;
      
      // Lưu ID địa chỉ đã chọn vào localStorage
      localStorage.setItem('selectedAddressId', addressId);
      
      // Lấy thông tin địa chỉ đã chọn
      const addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
      const selectedAddress = addresses.find(addr => addr.address_id == addressId);
      
      if (selectedAddress) {
        // Tính phí giao hàng dựa trên địa chỉ đã chọn
        const shippingInfo = await calculateShippingFee({
          address: selectedAddress.street + ', ' + selectedAddress.district + ', ' + selectedAddress.city,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng
        });
        
        // Cập nhật lại giao diện
        const cart = JSON.parse(localStorage.getItem('checkout-cart'));
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        await renderCheckout(cart, userInfo);
      }
    });
  }
  
  // Xử lý khi người dùng nhập thông tin địa chỉ mới
  const streetInput = document.getElementById('street');
  const districtInput = document.getElementById('district');
  const wardInput = document.getElementById('ward');
  const citySelect = document.getElementById('city');
  const addressTextarea = document.getElementById('address');
  
  // Hàm cập nhật địa chỉ đầy đủ
  function updateFullAddress() {
    if (!streetInput || !districtInput || !wardInput || !citySelect || !addressTextarea) return;
    
    const street = streetInput.value.trim();
    const district = districtInput.value.trim();
    const ward = wardInput.value.trim();
    const city = citySelect.options[citySelect.selectedIndex]?.text || '';
    
    if (street && district && ward && city) {
      const fullAddress = `${street}, ${ward}, ${district}, ${city}`;
      addressTextarea.value = fullAddress;
      
      // Tính phí giao hàng dựa trên địa chỉ mới
      updateShippingFee(fullAddress);
    }
  }
  
  // Gắn sự kiện cho các trường nhập liệu
  if (streetInput) {
    streetInput.addEventListener('input', debounce(updateFullAddress, 500));
  }
  
  if (districtInput) {
    districtInput.addEventListener('input', debounce(updateFullAddress, 500));
  }
  
  if (wardInput) {
    wardInput.addEventListener('input', debounce(updateFullAddress, 500));
  }
  
  if (citySelect) {
    citySelect.addEventListener('change', updateFullAddress);
  }
  
  // Xử lý nút sử dụng vị trí hiện tại
  const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
  if (useCurrentLocationBtn) {
    useCurrentLocationBtn.addEventListener('click', async function() {
      try {
        // Lấy vị trí hiện tại
        const location = await getCurrentLocation();
        
        // Điền thông tin vào form
        if (streetInput) streetInput.value = location.street;
        if (districtInput) districtInput.value = location.district;
        if (wardInput) wardInput.value = location.ward;
        
        // Chọn thành phố trong dropdown nếu có
        if (citySelect && location.city) {
          const cityOptions = Array.from(citySelect.options);
          const cityOption = cityOptions.find(option => 
            option.text.toLowerCase().includes(location.city.toLowerCase())
          );
          
          if (cityOption) {
            citySelect.value = cityOption.value;
          }
        }
        
        // Cập nhật địa chỉ đầy đủ
        if (addressTextarea) addressTextarea.value = location.address;
        
        // Tính phí giao hàng dựa trên vị trí hiện tại
        const shippingInfo = await calculateShippingFee(location);
        
        // Cập nhật lại giao diện
        const cart = JSON.parse(localStorage.getItem('checkout-cart'));
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        await renderCheckout(cart, userInfo);
      } catch (error) {
        console.error('Lỗi khi lấy vị trí hiện tại:', error);
        showNotification(error.message, 'error');
      }
    });
  }
}

// Hàm tải danh sách địa chỉ đã lưu
async function loadSavedAddresses() {
  const savedAddressesSelect = document.getElementById('savedAddresses');
  if (!savedAddressesSelect) return;
  
  // Xóa các option cũ
  while (savedAddressesSelect.options.length > 1) {
    savedAddressesSelect.remove(1);
  }
  
  try {
    if (!isLoggedIn()) {
      return;
    }
    
    // Gọi API để lấy danh sách địa chỉ
    const response = await fetchData('http://localhost:5000/api/addresses', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (response.success && response.data) {
      // Lưu danh sách địa chỉ vào localStorage
      localStorage.setItem('userAddresses', JSON.stringify(response.data));
      
      // Thêm các địa chỉ vào dropdown
      response.data.forEach(address => {
        const option = document.createElement('option');
        option.value = address.address_id;
        option.textContent = `${address.label || 'Địa chỉ'}: ${address.street}, ${address.district}, ${address.city}`;
        savedAddressesSelect.appendChild(option);
      });
      
      // Chọn địa chỉ mặc định nếu có
      const defaultAddress = response.data.find(addr => addr.is_default);
      if (defaultAddress) {
        savedAddressesSelect.value = defaultAddress.address_id;
        localStorage.setItem('selectedAddressId', defaultAddress.address_id);
      }
    }
  } catch (error) {
    console.error('Lỗi khi tải danh sách địa chỉ:', error);
  }
}

// Hàm cập nhật phí giao hàng dựa trên địa chỉ
async function updateShippingFee(address) {
  if (!address) return;
  
  try {
    // Tính phí giao hàng dựa trên địa chỉ
    const shippingInfo = await calculateShippingFee({ address });
    
    // Lưu thông tin phí giao hàng vào localStorage
    localStorage.setItem('shippingFee', shippingInfo.fee);
    localStorage.setItem('shippingDistance', shippingInfo.distance);
    
    // Cập nhật lại giao diện
    const cart = JSON.parse(localStorage.getItem('checkout-cart'));
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    await renderCheckout(cart, userInfo);
  } catch (error) {
    console.error('Lỗi khi cập nhật phí giao hàng:', error);
  }
}

// Hàm debounce để tránh gọi hàm quá nhiều lần
function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Hàm khởi tạo trang
async function initPage() {
  try {
    // Lấy giỏ hàng
    const cart = await fetchCart()

    if (!cart || !cart.items || cart.items.length === 0) {
      console.log("Giỏ hàng trống hoặc không tồn tại")
    } else {
      console.log(`Đã tìm thấy giỏ hàng với ${cart.items.length} sản phẩm`)
    }

    // Lưu giỏ hàng vào localStorage để sử dụng sau
    localStorage.setItem("checkout-cart", JSON.stringify(cart))

    // Lấy thông tin người dùng nếu đã đăng nhập
    let userInfo = null

    if (isLoggedIn()) {
      userInfo = await fetchUserInfo()
      console.log("Đã đăng nhập, lấy thông tin người dùng")
    } else {
      console.log("Chưa đăng nhập")
    }

    // Render thông tin thanh toán
    await renderCheckout(cart, userInfo)

    // Gắn sự kiện cho các phần tử
    handleDiscountCodeChange()
    handleAddressChange()
    handleCheckoutButton()
  } catch (error) {
    console.error("Lỗi khi khởi tạo trang:", error)
  }
}

// Hàm hiển thị ưu đãi đặc biệt cho người dùng đã đăng nhập
function displayMemberBenefits() {
  // Kiểm tra xem đã có phần hiển thị ưu đãi chưa
  if (document.getElementById('member-benefits')) return;
  
  // Tạo phần hiển thị ưu đãi
  const benefitsContainer = document.createElement('div');
  benefitsContainer.id = 'member-benefits';
  benefitsContainer.className = 'member-benefits-container';
  
  // Nội dung hiển thị tùy thuộc vào trạng thái đăng nhập
  if (isLoggedIn()) {
    // Lấy thông tin người dùng
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.username || user.full_name || 'Khách hàng';
    
    // Hiển thị ưu đãi cho thành viên
    benefitsContainer.innerHTML = `
      <div class="member-benefits">
        <h3>Ưu đãi dành riêng cho ${userName}</h3>
        <ul class="benefits-list">
          <li><i class="fas fa-gift"></i> Giảm thêm 5% cho tất cả đơn hàng</li>
          <li><i class="fas fa-shipping-fast"></i> Miễn phí giao hàng cho đơn từ 200.000đ</li>
          <li><i class="fas fa-star"></i> Tích điểm thành viên với mỗi đơn hàng</li>
          <li><i class="fas fa-birthday-cake"></i> Ưu đãi đặc biệt vào sinh nhật của bạn</li>
        </ul>
        <p class="benefits-note">Các ưu đãi đã được tự động áp dụng vào đơn hàng của bạn</p>
      </div>
    `;
    
    // Áp dụng giảm giá thêm 5% cho thành viên
    const cart = JSON.parse(localStorage.getItem('checkout-cart') || '{}');
    if (cart && cart.total_amount) {
      const memberDiscount = Math.round(cart.total_amount * 0.05);
      
      // Lưu giảm giá thành viên vào localStorage
      const currentDiscount = parseFloat(localStorage.getItem('discountAmount') || '0');
      localStorage.setItem('discountAmount', (currentDiscount + memberDiscount).toString());
      localStorage.setItem('memberDiscount', memberDiscount.toString());
      
      // Cập nhật hiển thị giảm giá
      const discountElement = document.querySelector('.discount-amount .price');
      if (discountElement) {
        discountElement.textContent = formatCurrency(currentDiscount + memberDiscount);
      }
      
      // Cập nhật tổng tiền
      const totalElement = document.querySelector('.total-amount .price');
      if (totalElement) {
        const shippingFee = parseFloat(localStorage.getItem('shippingFee') || '30000');
        const newTotal = cart.total_amount + shippingFee - (currentDiscount + memberDiscount);
        totalElement.textContent = formatCurrency(newTotal);
      }
    }
  } else {
    // Hiển thị lợi ích khi đăng nhập
    benefitsContainer.innerHTML = `
      <div class="member-benefits not-logged-in">
        <h3>Đăng nhập để nhận thêm ưu đãi</h3>
        <ul class="benefits-list">
          <li><i class="fas fa-gift"></i> Giảm thêm 5% cho tất cả đơn hàng</li>
          <li><i class="fas fa-shipping-fast"></i> Miễn phí giao hàng cho đơn từ 200.000đ</li>
          <li><i class="fas fa-star"></i> Tích điểm thành viên với mỗi đơn hàng</li>
        </ul>
        <a href="/pages/account.html?redirect=checkout" class="btn btn-outline-primary">Đăng nhập ngay</a>
      </div>
    `;
  }
  
  // Thêm CSS cho phần ưu đãi
  const style = document.createElement('style');
  style.textContent = `
    .member-benefits-container {
      margin-bottom: 30px;
    }
    
    .member-benefits {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid var(--primary-color);
    }
    
    .member-benefits h3 {
      color: var(--primary-color);
      margin-bottom: 15px;
      font-size: 1.2rem;
    }
    
    .benefits-list {
      list-style: none;
      padding: 0;
      margin: 0 0 15px 0;
    }
    
    .benefits-list li {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    
    .benefits-list li i {
      color: var(--primary-color);
      margin-right: 10px;
      font-size: 1.1rem;
    }
    
    .benefits-note {
      font-style: italic;
      color: #666;
      margin: 0;
      font-size: 0.9rem;
    }
    
    .member-benefits.not-logged-in {
      background-color: #fff3cd;
      border-left-color: #ffc107;
    }
    
    .member-benefits.not-logged-in h3 {
      color: #856404;
    }
    
    .member-benefits.not-logged-in .btn {
      margin-top: 15px;
    }
  `;
  document.head.appendChild(style);
  
  // Chèn vào trang
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.parentNode.insertBefore(benefitsContainer, checkoutForm);
  }
}

// Khởi chạy khi trang đã tải xong
document.addEventListener("DOMContentLoaded", function() {
  initPage();
  
  // Hiển thị ưu đãi cho thành viên
  displayMemberBenefits();
})
