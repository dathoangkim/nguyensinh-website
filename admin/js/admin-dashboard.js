 // Constants
const API_BASE_URL = "http://localhost:5000/api"
const TOKEN_KEY = "admin_token"
const USER_KEY = "admin_user"
const COUPONS_PER_PAGE = 10

// Helper Functions
function formatCurrency(amount) {
  try {
    // Handle null, undefined, or invalid values
    if (amount === null || amount === undefined || isNaN(amount)) {
      amount = 0;
    }
    
    // Convert to number if it's not already
    const num = typeof amount === 'number' ? amount : Number(amount || 0)
    
    // Format as Vietnamese currency
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  } catch (error) {
    console.error("Error formatting currency:", error)
    return "0 ₫" // Fallback value
  }
}

function showNotification(message, type = "success") {
  // Create notification element if it doesn't exist
  let notification = document.querySelector(".notification")
  if (!notification) {
    notification = document.createElement("div")
    notification.className = "notification"
    document.body.appendChild(notification)
  }
  
  // Set notification type
  notification.className = `notification ${type}`
  
  // Set notification content
  let icon = ""
  let title = ""
  
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle notification-icon"></i>'
      title = "Thành công!"
      break
    case "error":
      icon = '<i class="fas fa-exclamation-circle notification-icon"></i>'
      title = "Lỗi!"
      break
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle notification-icon"></i>'
      title = "Cảnh báo!"
      break
    case "info":
      icon = '<i class="fas fa-info-circle notification-icon"></i>'
      title = "Thông tin!"
      break
  }
  
  notification.innerHTML = `
    ${icon}
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" onclick="this.parentElement.classList.remove('show')">
      <i class="fas fa-times"></i>
    </button>
  `
  
  // Show notification
  setTimeout(() => {
    notification.classList.add("show")
  }, 10)
  
  // Hide notification after 5 seconds
  setTimeout(() => {
    notification.classList.remove("show")
  }, 5000)
}

// Debounce function for input events
function debounce(func, wait) {
  let timeout
  return function() {
    const context = this
    const args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(context, args)
    }, wait)
  }
}

// Format date for display
function formatDate(dateString) {
  try {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    // Format as DD/MM/YYYY HH:MM
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString || "N/A";
  }
}

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  checkAuth()

  // Login form submission
  document.getElementById("login-form").addEventListener("submit", handleLogin)

  // Logout button
  document.getElementById("logout-btn").addEventListener("click", handleLogout)
  
  // Sidebar toggle
  document.getElementById("sidebar-toggle").addEventListener("click", function() {
    document.body.classList.toggle("sidebar-toggled")
  })

  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const sectionId = this.getAttribute("data-section")
      activateSection(sectionId)
      
      // Close sidebar on mobile when a link is clicked
      if (window.innerWidth < 768) {
        document.body.classList.add("sidebar-toggled")
      }
    })
  })
  
  // Sự kiện thay đổi năm cho biểu đồ doanh thu
  document.getElementById("revenue-chart-year").addEventListener("change", function() {
    loadChartData();
  })

  // Products section
  document.getElementById("add-product-btn").addEventListener("click", showProductForm)
  document.getElementById("cancel-product-btn").addEventListener("click", hideProductForm)
  document.getElementById("product-form").addEventListener("submit", handleProductSubmit)
  document.getElementById("product-search").addEventListener("input", debounce(function() {
    loadProducts(1, this.value)
  }, 500))
  document.getElementById("add-option-btn").addEventListener("click", addProductOption)

  // Categories section
  document.getElementById("add-category-btn").addEventListener("click", showCategoryForm)
  document.getElementById("cancel-category-btn").addEventListener("click", hideCategoryForm)
  document.getElementById("category-form").addEventListener("submit", handleCategorySubmit)

  // Orders section
  document.getElementById("order-status-filter").addEventListener("change", () => loadOrders(1))
  document.getElementById("update-order-status-btn").addEventListener("click", updateOrderStatus)
  document.getElementById("close-order-detail-btn").addEventListener("click", hideOrderDetail)
  document.getElementById("order-search").addEventListener("input", debounce(function() {
    loadOrders(1, this.value)
  }, 500))

  // Users section
  document.getElementById("user-search").addEventListener("input", debounce(function() {
    loadUsers(1, this.value)
  }, 500))
  document.getElementById("cancel-user-btn").addEventListener("click", hideUserDetail)
  document.getElementById("user-form").addEventListener("submit", handleUserSubmit)

  // Tables section
  document.getElementById("add-table-btn").addEventListener("click", showTableForm)
  document.getElementById("cancel-table-btn").addEventListener("click", hideTableForm)
  document.getElementById("table-form").addEventListener("submit", handleTableSubmit)
  document.getElementById("store-filter").addEventListener("change", () => loadTables(1))
  document.getElementById("table-status-filter").addEventListener("change", () => loadTables(1))
  document.getElementById("table-search").addEventListener("input", debounce(function() {
    loadTables(1, this.value)
  }, 500))
  document.getElementById("list-view-btn").addEventListener("click", showTablesListView)
  document.getElementById("grid-view-btn").addEventListener("click", showTablesGridView)
  document.getElementById("floor-plan-view-btn").addEventListener("click", showFloorPlanView)
  document.getElementById("bulk-update-tables-btn").addEventListener("click", showBulkUpdateForm)
  document.getElementById("cancel-bulk-update-btn").addEventListener("click", hideBulkUpdateForm)
  document.getElementById("bulk-update-form").addEventListener("submit", handleBulkUpdateSubmit)
  document.getElementById("save-floor-plan-btn").addEventListener("click", saveTablePositions)
  document.getElementById("reset-floor-plan-btn").addEventListener("click", resetFloorPlan)
  
  // Reservations section
  document.getElementById("reservation-status-filter").addEventListener("change", () => loadReservations(1))
  document.getElementById("reservation-search").addEventListener("input", debounce(function() {
    loadReservations(1, this.value)
  }, 500))
  document.getElementById("reservation-store-filter").addEventListener("change", () => loadReservations(1))
  document.getElementById("reservation-date-filter").addEventListener("change", () => loadReservations(1))
  document.getElementById("cancel-reservation-btn").addEventListener("click", hideReservationDetail)
  document.getElementById("reservation-form").addEventListener("submit", handleReservationSubmit)
  document.getElementById("add-reservation-btn").addEventListener("click", showAddReservationForm)
  document.getElementById("cancel-add-reservation-btn").addEventListener("click", hideAddReservationForm)
  document.getElementById("add-reservation-form").addEventListener("submit", handleAddReservationSubmit)
  document.getElementById("new-reservation-store").addEventListener("change", loadAvailableTables)

  // Coupons section
  document.getElementById("add-coupon-btn").addEventListener("click", () => {
    resetCouponForm()
    showCouponForm(false)
  })
  document.getElementById("cancel-coupon-btn").addEventListener("click", hideCouponForm)
  document.getElementById("coupon-form").addEventListener("submit", saveCoupon)
  document.getElementById("coupon-search").addEventListener("input", debounce(function() {
    const searchValue = document.getElementById("coupon-search").value
    const statusFilter = document.getElementById("coupon-status-filter").value
    loadCoupons(1, {
      search: searchValue,
      status: statusFilter
    })
  }, 500))
  document.getElementById("coupon-status-filter").addEventListener("change", () => {
    const searchValue = document.getElementById("coupon-search").value
    const statusFilter = document.getElementById("coupon-status-filter").value
    loadCoupons(1, {
      search: searchValue,
      status: statusFilter
    })
  })

  // Blogs section
  document.getElementById("add-blog-btn").addEventListener("click", showBlogForm)
  document.getElementById("cancel-blog-btn").addEventListener("click", hideBlogForm)
  document.getElementById("blog-form").addEventListener("submit", handleBlogSubmit)
  document.getElementById("blog-search").addEventListener("input", debounce(function() {
    loadBlogs(1, this.value)
  }, 500))
  
  // Blog title input event listener for slug and URL generation
  document.getElementById("blog-title").addEventListener("input", debounce(function() {
    updateBlogPostUrl()
  }, 300))
  
  // Blog image URL input event listener for image preview
  document.getElementById("blog-image").addEventListener("input", debounce(function() {
    updateBlogImagePreview()
  }, 300))
  
  // Blog categories management
  document.getElementById("manage-blog-categories-btn").addEventListener("click", showBlogCategoriesManager)
  document.getElementById("close-blog-categories-btn").addEventListener("click", hideBlogCategoriesManager)
  document.getElementById("add-blog-category-btn").addEventListener("click", showBlogCategoryForm)
  document.getElementById("cancel-blog-category-btn").addEventListener("click", hideBlogCategoryForm)
  document.getElementById("blog-category-form").addEventListener("submit", handleBlogCategorySubmit)
  document.getElementById("blog-category-name").addEventListener("input", debounce(function() {
    updateBlogCategorySlug()
  }, 300))
  
  // Load blog categories when the page loads
  loadBlogCategories()

  // Stores section
  document.getElementById("add-store-btn").addEventListener("click", function() {
    resetStoreForm()
    showStoreForm(false)
  })
  document.getElementById("cancel-store-btn").addEventListener("click", hideStoreForm)
  document.getElementById("store-form").addEventListener("submit", saveStore)
})

// Authentication Functions
function checkAuth() {
  console.log("Checking authentication...")
  const token = localStorage.getItem(TOKEN_KEY)
  const user = JSON.parse(localStorage.getItem(USER_KEY) || "{}")
  console.log("Token:", token ? "exists" : "not found")
  console.log("User:", user)

  if (token && user && user.role === "admin") {
    console.log("User is authenticated as admin")
    document.getElementById("login-section").style.display = "none"
    document.getElementById("admin-dashboard").style.display = "block"
    document.getElementById("admin-name").textContent = `Xin chào, ${user.username || user.name || "Admin"}`

    // Load initial data
    loadDashboardData()
    loadProducts()
    loadCategories()
    loadOrders()
    loadUsers()
    loadReservations()
    loadTables()
    loadCoupons()
    loadBlogs()
    loadStores()
  } else {
    console.log("User is not authenticated as admin")
    document.getElementById("login-section").style.display = "block"
    document.getElementById("admin-dashboard").style.display = "none"
  }
}

async function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const alertElement = document.getElementById("login-alert")

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Đăng nhập thất bại")
    }

    // Check if user is admin
    if (data.user.role !== "admin") {
      throw new Error("Bạn không có quyền truy cập trang quản trị")
    }

    // Save token and user data
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))

    // Redirect to admin dashboard
    checkAuth()
  } catch (error) {
    alertElement.textContent = error.message
    alertElement.className = "alert alert-danger"
    alertElement.style.display = "block"

    // Hide alert after 3 seconds
    setTimeout(() => {
      alertElement.style.display = "none"
    }, 3000)
  }
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  checkAuth()
}

// Navigation Functions
function activateSection(sectionId) {
  console.log("Activating section:", sectionId)
  
  // Hide all sections
  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.remove("active")
    console.log("Removed active class from:", section.id)
  })

  // Show selected section
  const selectedSection = document.getElementById(sectionId)
  if (selectedSection) {
    selectedSection.classList.add("active")
    console.log("Added active class to:", sectionId)
    
    // Load section data if needed
    if (sectionId === "products-section" && !document.getElementById("products-body").innerHTML.trim()) {
      console.log("Loading products data")
      loadProducts()
    } else if (sectionId === "categories-section" && !document.getElementById("categories-body").innerHTML.trim()) {
      console.log("Loading categories data")
      loadCategories()
    } else if (sectionId === "orders-section" && !document.getElementById("orders-body").innerHTML.trim()) {
      console.log("Loading orders data")
      loadOrders()
    } else if (sectionId === "users-section" && !document.getElementById("users-body").innerHTML.trim()) {
      console.log("Loading users data")
      loadUsers()
    } else if (sectionId === "reservations-section" && !document.getElementById("reservations-body").innerHTML.trim()) {
      console.log("Loading reservations data")
      loadReservations()
    } else if (sectionId === "tables-section" && !document.getElementById("tables-body").innerHTML.trim()) {
      console.log("Loading tables data")
      loadTables()
    } else if (sectionId === "blogs-section" && !document.getElementById("blogs-body").innerHTML.trim()) {
      console.log("Loading blogs data")
      loadBlogs()
    } else if (sectionId === "coupons-section" && !document.getElementById("coupons-body").innerHTML.trim()) {
      console.log("Loading coupons data")
      loadCoupons()
    } else if (sectionId === "stores-section" && !document.getElementById("stores-body").innerHTML.trim()) {
      console.log("Loading stores data")
      loadStores()
    }
  } else {
    console.error("Section not found:", sectionId)
  }

  // Update active nav link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
    if (link.getAttribute("data-section") === sectionId) {
      link.classList.add("active")
      console.log("Set active nav link for:", sectionId)
    }
  })
}

// API Helper Functions
async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem(TOKEN_KEY)

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  const options = {
    method,
    headers,
  }

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body)
  }

  try {
    console.log(`Calling API: ${API_BASE_URL}${endpoint}`)
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    
    // Handle token expiration
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.reload()
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
    }
    
    // For 404 errors, return empty data with appropriate structure
    if (response.status === 404) {
      console.warn(`API endpoint not found: ${endpoint}`)
      // Return default empty structures based on endpoint
      if (endpoint.includes('/products')) {
        return { products: [], total: 0 }
      } else if (endpoint.includes('/categories')) {
        return { categories: [] }
      } else if (endpoint.includes('/orders')) {
        return { orders: [], total: 0 }
      } else if (endpoint.includes('/users')) {
        return { users: [], total: 0 }
      } else if (endpoint.includes('/reservations')) {
        return { reservations: [], total: 0 }
      } else if (endpoint.includes('/coupons')) {
        return { coupons: [] }
      } else if (endpoint.includes('/blogs')) {
        return { blogs: [], total: 0 }
      } else if (endpoint.includes('/stores')) {
        return { stores: [] }
      } else if (endpoint.includes('/dashboard/stats')) {
        return { totalOrders: 0, totalRevenue: 0, totalUsers: 0, totalProducts: 0 }
      } else if (endpoint.includes('/dashboard/recent-orders')) {
        return { orders: [] }
      } else if (endpoint.includes('/dashboard/recent-reservations')) {
        return { reservations: [] }
      } else {
        return {}
      }
    }
    
    let data
    try {
      data = await response.json()
      console.log(`API Response for ${endpoint}:`, data)
    } catch (e) {
      console.warn('Failed to parse JSON response', e)
      data = {}
    }

    if (!response.ok) {
      throw new Error(data.message || "Có lỗi xảy ra")
    }

    // Ensure data has expected structure
    if (endpoint.includes('/products')) {
      if (!data.products && !data.data) {
        data = { products: Array.isArray(data) ? data : [], total: data.length || 0 }
      } else if (data.data && !data.products) {
        data = { products: Array.isArray(data.data) ? data.data : [], total: data.data.length || 0, ...data }
      }
    } else if (endpoint.includes('/categories')) {
      if (!data.categories && !data.data) {
        data = { categories: Array.isArray(data) ? data : [] }
      } else if (data.data && !data.categories) {
        data = { categories: Array.isArray(data.data) ? data.data : [], ...data }
      }
    } else if (endpoint.includes('/orders')) {
      if (!data.orders && !data.data) {
        data = { orders: Array.isArray(data) ? data : [], total: data.length || 0 }
      } else if (data.data && !data.orders) {
        data = { orders: Array.isArray(data.data) ? data.data : [], total: data.data.length || 0, ...data }
      }
    } else if (endpoint.includes('/users')) {
      if (!data.users && !data.data) {
        data = { users: Array.isArray(data) ? data : [], total: data.length || 0 }
      } else if (data.data && !data.users) {
        data = { users: Array.isArray(data.data) ? data.data : [], total: data.data.length || 0, ...data }
      }
    } else if (endpoint.includes('/reservations')) {
      if (!data.reservations && !data.data) {
        data = { reservations: Array.isArray(data) ? data : [], total: data.length || 0 }
      } else if (data.data && !data.reservations) {
        data = { reservations: Array.isArray(data.data) ? data.data : [], total: data.data.length || 0, ...data }
      }
    } else if (endpoint.includes('/coupons')) {
      if (!data.coupons && !data.data) {
        data = { coupons: Array.isArray(data) ? data : [] }
      } else if (data.data && !data.coupons) {
        data = { coupons: Array.isArray(data.data) ? data.data : [], ...data }
      }
    } else if (endpoint.includes('/blogs')) {
      if (!data.blogs && !data.data) {
        data = { blogs: Array.isArray(data) ? data : [], total: data.length || 0 }
      } else if (data.data && !data.blogs) {
        data = { blogs: Array.isArray(data.data) ? data.data : [], total: data.data.length || 0, ...data }
      }
    } else if (endpoint.includes('/stores')) {
      if (!data.stores && !data.data) {
        data = { stores: Array.isArray(data) ? data : [] }
      } else if (data.data && !data.stores) {
        data = { stores: Array.isArray(data.data) ? data.data : [], ...data }
      }
    }

    return data
  } catch (error) {
    console.error("API Error:", error)
    throw error
  }
}

// Format helpers
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
  return new Date(dateString).toLocaleDateString("vi-VN", options)
}

function formatShortDate(dateString) {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" }
  return new Date(dateString).toLocaleDateString("vi-VN", options)
}

// Status translation helpers
function translateOrderStatus(status) {
  const statusMap = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    preparing: "Đang chuẩn bị",
    delivering: "Đang giao hàng",  // Thay thế "shipped" bằng "delivering"
    completed: "Hoàn thành",       // Thay thế "delivered" bằng "completed"
    cancelled: "Đã hủy",
  }
  return statusMap[status] || status
}



function translateReservationStatus(status) {
  const statusMap = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  }
  return statusMap[status] || status
}

function translatePaymentMethod(method) {
  const methodMap = {
    cod: "Thanh toán khi nhận hàng",
    bank_transfer: "Chuyển khoản ngân hàng",
    credit_card: "Thẻ tín dụng",
    momo: "Ví MoMo",
    zalopay: "ZaloPay",
  }
  return methodMap[method] || method
}

// Pagination helper
function createPagination(elementId, currentPage, totalPages, onPageChange) {
  const paginationElement = document.getElementById(elementId)
  paginationElement.innerHTML = ""

  // Previous button
  const prevButton = document.createElement("button")
  prevButton.textContent = "«"
  prevButton.disabled = currentPage === 1
  prevButton.addEventListener("click", () => onPageChange(currentPage - 1))
  paginationElement.appendChild(prevButton)

  // Page buttons
  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, startPage + 4)

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button")
    pageButton.textContent = i
    if (i === currentPage) {
      pageButton.classList.add("active")
    }
    pageButton.addEventListener("click", () => onPageChange(i))
    paginationElement.appendChild(pageButton)
  }

  // Next button
  const nextButton = document.createElement("button")
  nextButton.textContent = "»"
  nextButton.disabled = currentPage === totalPages
  nextButton.addEventListener("click", () => onPageChange(currentPage + 1))
  paginationElement.appendChild(nextButton)
}

// Notification helper
function showNotification(message, type = "success") {
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.textContent = message
  
  document.body.appendChild(notification)
  
  // Show notification
  setTimeout(() => {
    notification.classList.add("show")
  }, 10)
  
  // Hide and remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show")
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// Debounce helper for search inputs
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func.apply(this, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Date formatting helpers
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'N/A';
  }
}

function formatShortDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (error) {
    console.error("Error formatting short date:", error);
    return 'N/A';
  }
}

// Currency formatting helper
function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '0 ₫';
  
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₫', '').trim() + ' ₫';
  } catch (error) {
    console.error("Error formatting currency:", error);
    return '0 ₫';
  }
}

// Generate slug from text
function generateSlug(text) {
  if (!text) return '';
  
  // Convert Vietnamese characters to ASCII
  const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ";
  const to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD";
  
  // Replace Vietnamese characters
  let str = text;
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

// Dashboard Functions
// Biến lưu trữ các biểu đồ
let revenueChart = null;
let ordersStatusChart = null;
let topProductsChart = null;

async function loadDashboardData() {
  try {
    // Get dashboard stats
    const response = await apiRequest("/dashboard/stats")
    const stats = response.success && response.data ? response.data : {
      totalOrders: 0,
      totalRevenue: 0,
      totalUsers: 0,
      totalProducts: 0
    }

    document.getElementById("total-orders").textContent = stats.totalOrders
    document.getElementById("total-revenue").textContent = formatCurrency(stats.totalRevenue)
    document.getElementById("total-users").textContent = stats.totalUsers
    document.getElementById("total-products").textContent = stats.totalProducts

    // Get recent orders
    const recentOrdersResponse = await apiRequest("/dashboard/recent-orders")
    const recentOrders = recentOrdersResponse.success && recentOrdersResponse.data ? recentOrdersResponse.data : { orders: [] }
    const ordersBody = document.getElementById("recent-orders-body")
    ordersBody.innerHTML = ""

    if (recentOrders.orders && recentOrders.orders.length > 0) {
      recentOrders.orders.forEach((order) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>#${order.id}</td>
                  <td>${order.user ? order.user.userName || order.user.username : "Khách vãng lai"}</td>
                  <td>${formatDate(order.createdAt)}</td>
                  <td>${formatCurrency(order.totalAmount)}</td>
                  <td>${getOrderStatusBadge(order.status)}</td>
                  <td>
                      <button class="btn-admin" onclick="viewOrderDetail(${order.id})">Xem</button>
                  </td>
              `
        ordersBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="6" class="text-center">Không có đơn hàng nào</td>`
      ordersBody.appendChild(row)
    }
    
    // Get recent reservations
    const recentReservationsResponse = await apiRequest("/dashboard/recent-reservations")
    const recentReservations = recentReservationsResponse.success && recentReservationsResponse.data ? recentReservationsResponse.data : { reservations: [] }
    const reservationsBody = document.getElementById("recent-reservations-body")
    reservationsBody.innerHTML = ""
    
    if (recentReservations.reservations && recentReservations.reservations.length > 0) {
      recentReservations.reservations.forEach((reservation) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${reservation.id}</td>
                  <td>${reservation.customerName}</td>
                  <td>${formatShortDate(reservation.date)} ${reservation.time}</td>
                  <td>${reservation.numberOfPeople}</td>
                  <td>${getReservationStatusBadge(reservation.status)}</td>
                  <td>
                      <button class="btn-admin" onclick="editReservation(${reservation.id})">Xem</button>
                  </td>
              `
        reservationsBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="6" class="text-center">Không có đặt bàn nào</td>`
      reservationsBody.appendChild(row)
    }
    
    // Tải dữ liệu cho biểu đồ
    await loadChartData();
    
  } catch (error) {
    console.error("Error loading dashboard data:", error)
    showNotification("Lỗi khi tải dữ liệu tổng quan", "error")
  }
}

// Hàm tải dữ liệu cho biểu đồ
async function loadChartData() {
  try {
    // Hiển thị thông báo đang tải
    showLoadingIndicators();
    
    // Lấy năm hiện tại từ dropdown
    const selectedYear = document.getElementById("revenue-chart-year").value;
    
    // Tải dữ liệu doanh thu theo tháng
    let revenueData;
    try {
      const revenueResponse = await apiRequest(`/dashboard/revenue-by-month?year=${selectedYear}`);
      revenueData = revenueResponse.success && revenueResponse.data ? revenueResponse.data : null;
      console.log("Revenue data:", revenueData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      revenueData = null;
    }
    
    // Tải dữ liệu đơn hàng theo trạng thái
    let orderStatusData;
    try {
      const orderStatusResponse = await apiRequest("/dashboard/orders-by-status");
      orderStatusData = orderStatusResponse.success && orderStatusResponse.data ? orderStatusResponse.data : null;
      console.log("Order status data:", orderStatusData);
    } catch (error) {
      console.error("Error fetching order status data:", error);
      orderStatusData = null;
    }
    
    // Tải dữ liệu top sản phẩm bán chạy
    let topProductsData;
    try {
      const topProductsResponse = await apiRequest("/dashboard/top-products");
      topProductsData = topProductsResponse.success && topProductsResponse.data ? topProductsResponse.data : null;
      console.log("Top products data:", topProductsData);
    } catch (error) {
      console.error("Error fetching top products data:", error);
      topProductsData = null;
    }
    
    // Ẩn thông báo đang tải
    hideLoadingIndicators();
    
    // Hiển thị biểu đồ với dữ liệu từ API hoặc dữ liệu mẫu nếu không có
    if (revenueData && revenueData.months && revenueData.revenues) {
      renderRevenueChart(revenueData.months, revenueData.revenues);
    } else {
      renderRevenueChartWithSampleData();
    }
    
    if (orderStatusData && orderStatusData.statuses && orderStatusData.counts) {
      renderOrderStatusChart(orderStatusData.statuses, orderStatusData.counts);
    } else {
      renderOrderStatusChartWithSampleData();
    }
    
    if (topProductsData && topProductsData.products && topProductsData.quantities) {
      renderTopProductsChart(topProductsData.products, topProductsData.quantities);
    } else {
      renderTopProductsChartWithSampleData();
    }
    
  } catch (error) {
    console.error("Error loading chart data:", error);
    hideLoadingIndicators();
    
    // Hiển thị biểu đồ với dữ liệu mẫu nếu có lỗi
    renderRevenueChartWithSampleData();
    renderOrderStatusChartWithSampleData();
    renderTopProductsChartWithSampleData();
    
    // Hiển thị thông báo lỗi
    showNotification("Không thể tải dữ liệu biểu đồ. Đang hiển thị dữ liệu mẫu.", "warning");
  }
}

// Hiển thị thông báo đang tải
function showLoadingIndicators() {
  const chartContainers = document.querySelectorAll('.chart-body');
  chartContainers.forEach(container => {
    // Thêm lớp loading
    container.classList.add('loading');
    
    // Thêm thông báo đang tải
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'chart-loading';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...';
    
    // Xóa thông báo đang tải cũ nếu có
    const existingIndicator = container.querySelector('.chart-loading');
    if (existingIndicator) {
      container.removeChild(existingIndicator);
    }
    
    container.appendChild(loadingIndicator);
  });
}

// Ẩn thông báo đang tải
function hideLoadingIndicators() {
  const chartContainers = document.querySelectorAll('.chart-body');
  chartContainers.forEach(container => {
    // Xóa lớp loading
    container.classList.remove('loading');
    
    // Xóa thông báo đang tải
    const loadingIndicator = container.querySelector('.chart-loading');
    if (loadingIndicator) {
      container.removeChild(loadingIndicator);
    }
  });
}

// Hàm hiển thị biểu đồ doanh thu theo tháng
function renderRevenueChart(months, revenues) {
  const ctx = document.getElementById('revenue-chart').getContext('2d');
  
  // Hủy biểu đồ cũ nếu có
  if (revenueChart) {
    revenueChart.destroy();
  }
  
  // Tạo biểu đồ mới
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map(month => `Tháng ${month}`),
      datasets: [{
        label: 'Doanh thu (VNĐ)',
        data: revenues,
        backgroundColor: 'rgba(78, 115, 223, 0.05)',
        borderColor: 'rgba(78, 115, 223, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(78, 115, 223, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgba(78, 115, 223, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

// Hàm hiển thị biểu đồ đơn hàng theo trạng thái
function renderOrderStatusChart(statuses, counts) {
  const ctx = document.getElementById('orders-status-chart').getContext('2d');
  
  // Hủy biểu đồ cũ nếu có
  if (ordersStatusChart) {
    ordersStatusChart.destroy();
  }
  
  // Màu sắc cho các trạng thái
  const backgroundColors = [
    'rgba(255, 193, 7, 0.8)',   // Chờ xử lý - Vàng
    'rgba(23, 162, 184, 0.8)',  // Đang xử lý - Xanh dương
    'rgba(0, 123, 255, 0.8)',   // Đang giao - Xanh da trời
    'rgba(40, 167, 69, 0.8)',   // Đã giao - Xanh lá
    'rgba(220, 53, 69, 0.8)'    // Đã hủy - Đỏ
  ];
  
  // Tạo biểu đồ mới
  ordersStatusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statuses,
      datasets: [{
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 20,
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });
}

// Hàm hiển thị biểu đồ top sản phẩm bán chạy
function renderTopProductsChart(products, quantities) {
  const ctx = document.getElementById('top-products-chart').getContext('2d');
  
  // Hủy biểu đồ cũ nếu có
  if (topProductsChart) {
    topProductsChart.destroy();
  }
  
  // Tạo biểu đồ mới
  topProductsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: products,
      datasets: [{
        label: 'Số lượng đã bán',
        data: quantities,
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Hàm hiển thị biểu đồ doanh thu với dữ liệu mẫu
function renderRevenueChartWithSampleData() {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const revenues = [
    5000000, 7500000, 10000000, 8500000, 12000000, 15000000,
    13500000, 17000000, 14500000, 16000000, 18500000, 20000000
  ];
  
  renderRevenueChart(months, revenues);
}

// Hàm hiển thị biểu đồ đơn hàng theo trạng thái với dữ liệu mẫu
function renderOrderStatusChartWithSampleData() {
  const statuses = ["Chờ xử lý", "Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"];
  const counts = [15, 25, 10, 45, 5];
  
  renderOrderStatusChart(statuses, counts);
}

// Hàm hiển thị biểu đồ top sản phẩm bán chạy với dữ liệu mẫu
function renderTopProductsChartWithSampleData() {
  const products = [
    "Bánh mì thịt", "Bánh mì gà", "Bánh mì chả", "Bánh mì pate",
    "Bánh mì trứng", "Bánh mì xíu mại", "Bánh mì heo quay",
    "Bánh mì bò kho", "Bánh mì cá", "Bánh mì thập cẩm"
  ];
  const quantities = [120, 95, 85, 75, 65, 55, 45, 40, 35, 30];
  
  renderTopProductsChart(products, quantities);
}

function getOrderStatusBadge(status) {
  const statusMap = {
    pending:
      '<span style="background-color: #ffc107; padding: 3px 8px; border-radius: 3px; color: #000;">Chờ xử lý</span>',
    processing:
      '<span style="background-color: #17a2b8; padding: 3px 8px; border-radius: 3px; color: #fff;">Đang xử lý</span>',
    shipped:
      '<span style="background-color: #007bff; padding: 3px 8px; border-radius: 3px; color: #fff;">Đang giao</span>',
    delivered:
      '<span style="background-color: #28a745; padding: 3px 8px; border-radius: 3px; color: #fff;">Đã giao</span>',
    cancelled:
      '<span style="background-color: #dc3545; padding: 3px 8px; border-radius: 3px; color: #fff;">Đã hủy</span>',
  }

  return statusMap[status] || status
}

function getReservationStatusBadge(status) {
  const statusMap = {
    pending:
      '<span style="background-color: #ffc107; padding: 3px 8px; border-radius: 3px; color: #000;">Chờ xác nhận</span>',
    confirmed:
      '<span style="background-color: #28a745; padding: 3px 8px; border-radius: 3px; color: #fff;">Đã xác nhận</span>',
    completed:
      '<span style="background-color: #007bff; padding: 3px 8px; border-radius: 3px; color: #fff;">Hoàn thành</span>',
    cancelled:
      '<span style="background-color: #dc3545; padding: 3px 8px; border-radius: 3px; color: #fff;">Đã hủy</span>',
  }

  return statusMap[status] || status
}

// Products Functions
let productsCurrentPage = 1
let productsTotalPages = 1

async function loadProducts(page = 1, search = "") {
  try {
    let url = `/products?page=${page}&limit=10`
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    
    console.log("Calling loadProducts with URL:", url)
    const response = await apiRequest(url)
    console.log("Products response:", response)
    
    // Handle different response formats
    let products = []
    let total = 0
    
    if (Array.isArray(response)) {
      // Direct array of products
      products = response
      total = response.length
      console.log("Products is an array:", products)
    } else if (response.products) {
      // Object with products property
      products = response.products
      total = response.total || products.length
    } else if (response.data && Array.isArray(response.data)) {
      // Object with data property containing array
      products = response.data
      total = response.total || products.length
    } else if (response.success && response.data) {
      // Success response with data property
      products = Array.isArray(response.data) ? response.data : (response.data.products || [])
      total = response.total || response.data.total || products.length
    }
    
    console.log("Final products data:", products)
    productsCurrentPage = page
    productsTotalPages = Math.ceil(total / 10)

    const productsBody = document.getElementById("products-body")
    productsBody.innerHTML = ""

    if (products && products.length > 0) {
      products.forEach((product) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${product.product_id}</td>
                  <td>${product.name || 'Không có tên'}</td>
                  <td>${product.category_name || "N/A"}</td>
                  <td>${formatCurrency(product.price || 0)}</td>
                  <td>${product.stock_quantity || 0}</td>
                  <td>
                    ${product.images && product.images.length > 0 
                      ? `<img src="${product.images[0].img_url}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">`
                      : (product.image_url 
                          ? `<img src="${product.image_url}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">`
                          : 'Không có ảnh')
                    }
                  </td>
                  <td>
                      <button class="btn-admin" onclick="editProduct(${product.product_id})">Sửa</button>
                      <button class="btn-admin btn-danger" onclick="deleteProduct(${product.product_id})">Xóa</button>
                  </td>
              `
        productsBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="7" class="text-center">Không có sản phẩm nào</td>`
      productsBody.appendChild(row)
    }

    createPagination("products-pagination", productsCurrentPage, productsTotalPages, loadProducts)

    // Load categories for product form
    const categoriesResponse = await apiRequest("/categories")
    console.log("Categories for product form:", categoriesResponse)
    
    // Handle different response formats
    let categories = []
    
    if (Array.isArray(categoriesResponse)) {
      // Direct array of categories
      categories = categoriesResponse
    } else if (categoriesResponse.categories) {
      // Object with categories property
      categories = categoriesResponse.categories
    } else if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
      // Object with data property containing array
      categories = categoriesResponse.data
    } else if (categoriesResponse.success && categoriesResponse.data) {
      // Success response with data property
      categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : (categoriesResponse.data.categories || [])
    }
    
    console.log("Final categories for product form:", categories)
    
    const categorySelect = document.getElementById("product-category")
    categorySelect.innerHTML = ""

    if (categories && categories.length > 0) {
      categories.forEach((category) => {
        const option = document.createElement("option")
        option.value = category.category_id || category.id
        option.textContent = category.name || 'Không có tên'
        categorySelect.appendChild(option)
      })
    } else {
      const option = document.createElement("option")
      option.value = ""
      option.textContent = "Không có danh mục"
      categorySelect.appendChild(option)
    }
  } catch (error) {
    console.error("Error loading products:", error)
    showNotification("Lỗi khi tải danh sách sản phẩm", "error")
  }
}

function showProductForm() {
  document.getElementById("product-form-title").textContent = "Thêm Sản Phẩm Mới"
  document.getElementById("product-id").value = ""
  document.getElementById("product-form").reset()
  
  // Set default values
  document.getElementById("product-price").value = 0
  document.getElementById("product-cost-price").value = 0
  document.getElementById("product-stock").value = 0
  
  // Clear options
  document.getElementById("product-options-container").innerHTML = ""
  
  document.getElementById("product-form-container").style.display = "block"
}

function addProductOption() {
  const optionsContainer = document.getElementById("product-options-container")
  const optionIndex = optionsContainer.children.length
  
  const optionDiv = document.createElement("div")
  optionDiv.className = "option-item"
  optionDiv.innerHTML = `
    <div class="form-row">
      <div class="form-col">
        <input type="text" class="option-name" placeholder="Tên tùy chọn (ví dụ: Kích cỡ)" data-index="${optionIndex}">
      </div>
      <div class="form-col">
        <button type="button" class="btn-admin btn-danger btn-sm remove-option" onclick="removeProductOption(this)">Xóa</button>
      </div>
    </div>
  `
  
  optionsContainer.appendChild(optionDiv)
}

function removeProductOption(button) {
  const optionItem = button.closest(".option-item")
  optionItem.remove()
}

function hideProductForm() {
  document.getElementById("product-form-container").style.display = "none"
}

async function editProduct(id) {
  if (!id) {
    showNotification("ID sản phẩm không hợp lệ", "error")
    return
  }
  
  try {
    const response = await apiRequest(`/products/${id}`)
    const product = response.success && response.data ? response.data : null
    
    if (!product) {
      showNotification("Không tìm thấy sản phẩm", "error")
      return
    }

    document.getElementById("product-form-title").textContent = "Chỉnh Sửa Sản Phẩm"
    document.getElementById("product-id").value = product.product_id
    document.getElementById("product-name").value = product.name
    document.getElementById("product-category").value = product.category_id
    document.getElementById("product-price").value = product.price
    document.getElementById("product-cost-price").value = product.cost_price || 0
    document.getElementById("product-description").value = product.description
    document.getElementById("product-stock").value = product.stock_quantity
    
    // Handle product images
    if (product.images && product.images.length > 0) {
      document.getElementById("product-image").value = product.images[0].img_url || "";
    } else {
      // Try to fetch images separately
      fetchProductImages(product.product_id);
    }
    
    // Clear options container
    document.getElementById("product-options-container").innerHTML = ""
    
    // Load product options
    fetchProductOptions(product.product_id);
    
    // Store the original slug if available
    if (product.slug) {
      document.getElementById("product-form").dataset.originalSlug = product.slug
    }

    document.getElementById("product-form-container").style.display = "block"
  } catch (error) {
    console.error("Error loading product details:", error)
    showNotification("Lỗi khi tải thông tin sản phẩm", "error")
  }
}

async function deleteProduct(id) {
  if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
    try {
      await apiRequest(`/products/${id}`, "DELETE")
      showNotification("Xóa sản phẩm thành công")
      loadProducts(productsCurrentPage)
    } catch (error) {
      console.error("Error deleting product:", error)
      showNotification("Không thể xóa sản phẩm. Vui lòng thử lại sau.", "error")
    }
  }
}

async function fetchProductImages(productId) {
  if (!productId) return;
  
  try {
    const response = await apiRequest(`/products/${productId}/images`);
    console.log("Product images response:", response);
    
    let images = [];
    
    if (Array.isArray(response)) {
      images = response;
    } else if (response.images) {
      images = response.images;
    } else if (response.data && Array.isArray(response.data)) {
      images = response.data;
    } else if (response.success && response.data) {
      images = Array.isArray(response.data) ? response.data : (response.data.images || []);
    }
    
    if (images && images.length > 0) {
      document.getElementById("product-image").value = images[0].img_url || "";
    }
  } catch (error) {
    console.error("Error fetching product images:", error);
  }
}

async function fetchProductOptions(productId) {
  if (!productId) return;
  
  try {
    const response = await apiRequest(`/products/${productId}/options`);
    console.log("Product options response:", response);
    
    let options = [];
    
    if (Array.isArray(response)) {
      options = response;
    } else if (response.options) {
      options = response.options;
    } else if (response.data && Array.isArray(response.data)) {
      options = response.data;
    } else if (response.success && response.data) {
      options = Array.isArray(response.data) ? response.data : (response.data.options || []);
    }
    
    const optionsContainer = document.getElementById("product-options-container");
    
    if (options && options.length > 0) {
      options.forEach((option, index) => {
        const optionDiv = document.createElement("div");
        optionDiv.className = "option-item";
        optionDiv.innerHTML = `
          <div class="form-row">
            <div class="form-col">
              <input type="text" class="option-name" placeholder="Tên tùy chọn" value="${option.name}" data-option-id="${option.option_id}" data-index="${index}">
            </div>
            <div class="form-col">
              <button type="button" class="btn-admin btn-danger btn-sm remove-option" onclick="removeProductOption(this)">Xóa</button>
            </div>
          </div>
        `;
        
        optionsContainer.appendChild(optionDiv);
      });
    }
  } catch (error) {
    console.error("Error fetching product options:", error);
  }
}

async function handleProductSubmit(e) {
  e.preventDefault()

  const productId = document.getElementById("product-id").value
  const productName = document.getElementById("product-name").value
  
  // Validate product name
  if (!productName.trim()) {
    showNotification("Vui lòng nhập tên sản phẩm", "error")
    return
  }
  
  // Get the original slug if updating, or generate a new one if creating
  let slug = '';
  if (productId) {
    // Use the original slug if available
    slug = document.getElementById("product-form").dataset.originalSlug || generateSlug(productName);
  } else {
    // Generate new slug for new products
    slug = generateSlug(productName);
  }
  
  const productData = {
    name: productName,
    slug: slug,
    category_id: document.getElementById("product-category").value,
    price: document.getElementById("product-price").value,
    cost_price: document.getElementById("product-cost-price").value,
    description: document.getElementById("product-description").value,
    stock_quantity: document.getElementById("product-stock").value,
    is_active: 1,
    status: "normal"
  }
  
  // Handle image separately
  const imageUrl = document.getElementById("product-image").value;
  if (imageUrl) {
    productData.images = [{
      img_url: imageUrl,
      alt_text: productName,
      sort_order: 1
    }];
  }
  
  // Handle product options
  const optionElements = document.querySelectorAll(".option-name");
  if (optionElements.length > 0) {
    productData.options = [];
    
    optionElements.forEach(element => {
      const optionName = element.value.trim();
      if (optionName) {
        const option = {
          name: optionName
        };
        
        // If editing an existing option, include the option_id
        const optionId = element.getAttribute("data-option-id");
        if (optionId) {
          option.option_id = optionId;
        }
        
        productData.options.push(option);
      }
    });
  }
  
  console.log("Final product data:", productData);
  
  console.log("Submitting product data:", productData)

  try {
    if (productId) {
      // Update existing product
      await apiRequest(`/products/${productId}`, "PUT", productData)
      showNotification("Cập nhật sản phẩm thành công")
    } else {
      // Create new product
      await apiRequest("/products", "POST", productData)
      showNotification("Thêm sản phẩm mới thành công")
    }

    hideProductForm()
    loadProducts(productsCurrentPage)
  } catch (error) {
    console.error("Error saving product:", error)
    showNotification("Không thể lưu sản phẩm. Vui lòng thử lại sau.", "error")
  }
}

// Categories Functions
async function loadCategories() {
  try {
    console.log("Calling loadCategories")
    const response = await apiRequest("/categories")
    console.log("Categories response:", response)
    
    // Handle different response formats
    let categories = []
    
    if (Array.isArray(response)) {
      // Direct array of categories
      categories = response
    } else if (response.categories) {
      // Object with categories property
      categories = response.categories
    } else if (response.data && Array.isArray(response.data)) {
      // Object with data property containing array
      categories = response.data
    } else if (response.success && response.data) {
      // Success response with data property
      categories = Array.isArray(response.data) ? response.data : (response.data.categories || [])
    }
    
    console.log("Final categories data:", categories)

    const categoriesBody = document.getElementById("categories-body")
    categoriesBody.innerHTML = ""

    if (categories.length > 0) {
      categories.forEach((category) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${category.category_id}</td>
                  <td>${category.name || 'Không có tên'}</td>
                  <td>${category.description || ""}</td>
                  <td>
                      <button class="btn-admin" onclick="editCategory(${category.category_id})">Sửa</button>
                      <button class="btn-admin btn-danger" onclick="deleteCategory(${category.category_id})">Xóa</button>
                  </td>
              `
        categoriesBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="4" class="text-center">Không có danh mục nào</td>`
      categoriesBody.appendChild(row)
    }
  } catch (error) {
    console.error("Error loading categories:", error)
    showNotification("Lỗi khi tải danh sách danh mục", "error")
  }
}

function showCategoryForm() {
  document.getElementById("category-form-title").textContent = "Thêm Danh Mục Mới"
  document.getElementById("category-id").value = ""
  document.getElementById("category-form").reset()
  document.getElementById("category-form-container").style.display = "block"
}

function hideCategoryForm() {
  document.getElementById("category-form-container").style.display = "none"
}

async function editCategory(id) {
  if (!id) {
    showNotification("ID danh mục không hợp lệ", "error")
    return
  }
  
  try {
    const response = await apiRequest(`/categories/${id}`)
    const category = response.success && response.data ? response.data : null
    
    if (!category) {
      showNotification("Không tìm thấy danh mục", "error")
      return
    }

    document.getElementById("category-form-title").textContent = "Chỉnh Sửa Danh Mục"
    document.getElementById("category-id").value = category.category_id
    document.getElementById("category-name").value = category.name
    document.getElementById("category-description").value = category.description || ""
    
    // Store the original slug if available
    if (category.slug) {
      document.getElementById("category-form").dataset.originalSlug = category.slug
    }

    document.getElementById("category-form-container").style.display = "block"
  } catch (error) {
    console.error("Error loading category details:", error)
    showNotification("Lỗi khi tải thông tin danh mục", "error")
  }
}

async function deleteCategory(id) {
  if (confirm("Bạn có chắc chắn muốn xóa danh mục này? Tất cả sản phẩm thuộc danh mục này sẽ không còn danh mục.")) {
    try {
      await apiRequest(`/categories/${id}`, "DELETE")
      showNotification("Xóa danh mục thành công")
      loadCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      showNotification("Không thể xóa danh mục. Vui lòng thử lại sau.", "error")
    }
  }
}

async function handleCategorySubmit(e) {
  e.preventDefault()

  const categoryId = document.getElementById("category-id").value
  const categoryName = document.getElementById("category-name").value.trim()
  
  // Validate category name
  if (!categoryName) {
    showNotification("Vui lòng nhập tên danh mục", "error")
    return
  }
  
  // Get the original slug if updating, or generate a new one if creating
  let slug = '';
  if (categoryId) {
    // Use the original slug if available
    slug = document.getElementById("category-form").dataset.originalSlug || generateSlug(categoryName);
  } else {
    // Generate new slug for new categories
    slug = generateSlug(categoryName);
  }
  
  const categoryData = {
    name: categoryName,
    slug: slug,
    description: document.getElementById("category-description").value,
  }

  try {
    if (categoryId) {
      // Update existing category
      await apiRequest(`/categories/${categoryId}`, "PUT", categoryData)
      showNotification("Cập nhật danh mục thành công")
    } else {
      // Create new category
      await apiRequest("/categories", "POST", categoryData)
      showNotification("Thêm danh mục mới thành công")
    }

    hideCategoryForm()
    loadCategories()
  } catch (error) {
    console.error("Error saving category:", error)
    showNotification("Không thể lưu danh mục. Vui lòng thử lại sau.", "error")
  }
}

// Orders Functions
let ordersCurrentPage = 1
let ordersTotalPages = 1

async function loadOrders(page = 1, search = "") {
  try {
    const statusFilter = document.getElementById("order-status-filter").value
    let url = `/orders?page=${page}&limit=10`

    if (statusFilter) {
      url += `&status=${statusFilter}`
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    console.log("Calling loadOrders with URL:", url)
    
    // Make API request
    let response
    try {
      response = await apiRequest(url)
      console.log("Orders response:", response)
    } catch (error) {
      console.error("API request failed:", error)
      // Get guest orders from localStorage if API fails
      response = getGuestOrdersFromLocalStorage()
    }
    
    // Handle different response formats
    let orders = []
    let total = 0
    
    if (Array.isArray(response)) {
      // Direct array of orders
      orders = response
      total = response.length
    } else if (response.orders) {
      // Object with orders property
      orders = response.orders
      total = response.total || orders.length
    } else if (response.data && Array.isArray(response.data)) {
      // Object with data property containing array
      orders = response.data
      total = response.total || orders.length
    } else if (response.success && response.data) {
      // Success response with data property
      orders = Array.isArray(response.data) ? response.data : (response.data.orders || [])
      total = response.total || response.data.total || orders.length
    }
    
    console.log("Final orders data:", orders)
    ordersCurrentPage = page
    ordersTotalPages = Math.ceil(total / 10)

    const ordersBody = document.getElementById("orders-body")
    ordersBody.innerHTML = ""

    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        // Access user information safely
        let userName = "Khách vãng lai";
        if (order.user) {
          userName = order.user.username || order.user.userName || order.user.name || order.user.full_name || "Khách hàng #" + order.user_id;
        }
        
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>#${order.order_id}</td>
                  <td>${userName}</td>
                  <td>${formatDate(order.created_at)}</td>
                  <td>${formatCurrency(order.total_amount || 0)}</td>
                  <td>${getOrderStatusBadge(order.status)}</td>
                  <td>
                      <button class="btn-admin btn-sm" onclick="viewOrderDetail(${order.order_id})">
                        <i class="fas fa-eye"></i> Chi tiết
                      </button>
                  </td>
              `
        ordersBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="6" class="text-center">Không có đơn hàng nào</td>`
      ordersBody.appendChild(row)
    }

    createPagination("orders-pagination", ordersCurrentPage, ordersTotalPages, loadOrders)
  } catch (error) {
    console.error("Error loading orders:", error)
    showNotification("Lỗi khi tải danh sách đơn hàng", "error")
    
    // Display sample data for demo purposes
    displaySampleOrders()
  }
}

// Hàm để lấy đơn hàng từ localStorage
function getGuestOrdersFromLocalStorage() {
  try {
    const guestOrderIds = localStorage.getItem('guestOrderIds');
    if (!guestOrderIds) {
      return { orders: [], total: 0 };
    }
    
    const parsedOrderIds = JSON.parse(guestOrderIds);
    if (!parsedOrderIds || !Array.isArray(parsedOrderIds) || parsedOrderIds.length === 0) {
      return { orders: [], total: 0 };
    }
    
    // Lấy thông tin đơn hàng từ localStorage
    const guestOrdersData = [];
    
    for (const orderId of parsedOrderIds) {
      const orderData = localStorage.getItem(`order_${orderId}`);
      
      if (orderData) {
        try {
          const parsedOrder = JSON.parse(orderData);
          guestOrdersData.push(parsedOrder);
        } catch (e) {
          console.error("Error parsing order data:", e);
        }
      }
    }
    
    return { orders: guestOrdersData, total: guestOrdersData.length };
  } catch (error) {
    console.error("Error getting guest orders from localStorage:", error);
    return { orders: [], total: 0 };
  }
}

// Display guest orders from localStorage when API fails
function displaySampleOrders() {
  const guestOrdersData = getGuestOrdersFromLocalStorage();
  const ordersBody = document.getElementById("orders-body");
  
  if (ordersBody) {
    ordersBody.innerHTML = "";
    
    if (guestOrdersData.orders.length > 0) {
      guestOrdersData.orders.forEach(order => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>#${order.order_id}</td>
          <td>${order.customer_name || "Khách vãng lai"}</td>
          <td>${formatDate(order.created_at)}</td>
          <td>${formatCurrency(order.total_amount || 0)}</td>
          <td>${getOrderStatusBadge(order.status)}</td>
          <td>
              <button class="btn-admin btn-sm" onclick="viewOrderDetail(${order.order_id})">
                <i class="fas fa-eye"></i> Chi tiết
              </button>
          </td>
        `;
        ordersBody.appendChild(row);
      });
      
      // Add a note that these are guest orders
      const noteRow = document.createElement("tr");
      noteRow.innerHTML = `
        <td colspan="6" class="text-center" style="background-color: #e8f4fd; color: #0c5460;">
          <i class="fas fa-info-circle"></i> Đơn hàng của khách không đăng nhập (lấy từ localStorage)
        </td>
      `;
      ordersBody.appendChild(noteRow);
    } else {
      // No guest orders found
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
        <td colspan="6" class="text-center">
          <i class="fas fa-info-circle"></i> Không có đơn hàng nào của khách không đăng nhập
        </td>
      `;
      ordersBody.appendChild(emptyRow);
    }
  }
}

// Hàm cũ được thay thế bởi hàm mới
async function viewOrderDetail(id) {
  if (!id) {
    showNotification("ID đơn hàng không hợp lệ", "error")
    return
  }
  
  try {
    // Gọi API để lấy thông tin đơn hàng
    const response = await apiRequest(`/orders/${id}`)
    let order = response.success && response.data ? response.data : null
    
    // Nếu không tìm thấy đơn hàng, hiển thị thông báo lỗi
    if (!order) {
      showNotification("Không tìm thấy đơn hàng", "error")
      return
    }

    console.log("Order data:", order)

    // Hiển thị ID đơn hàng
    document.getElementById("order-detail-id").textContent = order.order_id
    
    // Thiết lập trạng thái đơn hàng trong dropdown
    const statusSelect = document.getElementById("order-status")
    statusSelect.value = order.status
    statusSelect.setAttribute("data-current-status", order.status)
    
    // Xử lý thông tin khách hàng
    let userName = "Khách vãng lai"
    let userEmail = "N/A"
    let userPhone = "N/A"
    
    // Nếu đơn hàng có user_id, truy vấn thông tin người dùng từ API
    if (order.user_id) {
      try {
        // Gọi API để lấy thông tin người dùng
        const userResponse = await apiRequest(`/users/${order.user_id}`)
        const userData = userResponse.success && userResponse.data ? userResponse.data : null
        
        if (userData) {
          // Sử dụng thông tin người dùng từ API
          userName = userData.username || userData.full_name || userData.name || `Khách hàng #${order.user_id}`
          userEmail = userData.email || "N/A"
          userPhone = userData.phone || "N/A"
          console.log("User data:", userData)
        } else {
          // Nếu không lấy được thông tin người dùng từ API, hiển thị ID người dùng
          userName = `Khách hàng #${order.user_id}`
        }
      } catch (userError) {
        console.error("Error loading user data:", userError)
        // Nếu có lỗi khi truy vấn API, hiển thị ID người dùng
        userName = `Khách hàng #${order.user_id}`
      }
    } else if (order.user) {
      // Nếu đơn hàng đã có thông tin user
      userName = order.user.username || order.user.full_name || order.user.name || "Khách vãng lai"
      userEmail = order.user.email || "N/A"
      userPhone = order.user.phone || "N/A"
    } else if (order.customer) {
      // Một số API có thể trả về thông tin khách hàng trong trường customer
      userName = order.customer.username || order.customer.full_name || order.customer.name || "Khách vãng lai"
      userEmail = order.customer.email || "N/A"
      userPhone = order.customer.phone || "N/A"
    }
    
    // Nếu có phone trong đơn hàng (không phải trong user)
    if (order.phone) {
      userPhone = order.phone
    }
    
    // Hiển thị thông tin khách hàng
    document.getElementById("order-customer-name").textContent = userName
    document.getElementById("order-customer-email").textContent = userEmail
    document.getElementById("order-customer-phone").textContent = userPhone

    // Xử lý địa chỉ giao hàng
    let addressText = "N/A"
    
    // Nếu đơn hàng có address_id, truy vấn thông tin địa chỉ từ API
    if (order.address_id) {
      try {
        // Gọi API để lấy thông tin địa chỉ
        const addressResponse = await apiRequest(`/addresses/${order.address_id}`)
        const addressData = addressResponse.success && addressResponse.data ? addressResponse.data : null
        
        if (addressData) {
          // Sử dụng thông tin địa chỉ từ API
          const addressParts = []
          
          if (addressData.street) addressParts.push(addressData.street)
          if (addressData.ward) addressParts.push(addressData.ward)
          if (addressData.district) addressParts.push(addressData.district)
          if (addressData.city) addressParts.push(addressData.city)
          
          if (addressParts.length > 0) {
            addressText = addressParts.join(", ")
          } else {
            addressText = addressData.label || `Địa chỉ #${order.address_id}`
          }
          
          console.log("Address data:", addressData)
        } else {
          // Nếu không lấy được thông tin địa chỉ từ API, hiển thị ID địa chỉ
          addressText = `Địa chỉ #${order.address_id}`
        }
      } catch (addressError) {
        console.error("Error loading address data:", addressError)
        // Nếu có lỗi khi truy vấn API, hiển thị ID địa chỉ
        addressText = `Địa chỉ #${order.address_id}`
      }
    } else if (order.address) {
      // Trường hợp địa chỉ là một chuỗi
      addressText = order.address
    } else if (order.shipping_address) {
      // Trường hợp địa chỉ là một chuỗi trong shipping_address
      addressText = order.shipping_address
    } else if (order.shippingAddress) {
      // Trường hợp địa chỉ là một đối tượng
      const address = order.shippingAddress
      const addressParts = []
      
      if (address.street) addressParts.push(address.street)
      if (address.ward) addressParts.push(address.ward)
      if (address.district) addressParts.push(address.district)
      if (address.city) addressParts.push(address.city)
      
      if (addressParts.length > 0) {
        addressText = addressParts.join(", ")
      }
    }
    
    // Hiển thị địa chỉ giao hàng
    document.getElementById("order-shipping-address").textContent = addressText

    // Xử lý phương thức thanh toán
    const paymentMethod = order.payment_method || order.paymentMethod || "N/A"
    let paymentMethodText = "N/A"
    
    switch(paymentMethod.toLowerCase()) {
      case "cod":
        paymentMethodText = "Thanh toán khi nhận hàng (COD)"
        break
      case "online":
        paymentMethodText = "Thanh toán trực tuyến"
        break
      case "zalopay":
        paymentMethodText = "ZaloPay"
        break
      case "momo":
        paymentMethodText = "MoMo"
        break
      case "bank_transfer":
        paymentMethodText = "Chuyển khoản ngân hàng"
        break
      default:
        paymentMethodText = paymentMethod
    }
    
    // Thêm phương thức thanh toán vào modal
    let paymentMethodElement = document.getElementById("order-payment-method-container")
    if (!paymentMethodElement) {
      paymentMethodElement = document.createElement("p")
      paymentMethodElement.id = "order-payment-method-container"
      paymentMethodElement.innerHTML = `<strong>Phương thức thanh toán:</strong> <span id="order-payment-method">${paymentMethodText}</span>`
      
      // Chèn phương thức thanh toán sau địa chỉ giao hàng
      const shippingAddressElement = document.getElementById("order-shipping-address").parentElement
      shippingAddressElement.parentNode.insertBefore(paymentMethodElement, shippingAddressElement.nextSibling)
    } else {
      document.getElementById("order-payment-method").textContent = paymentMethodText
    }

    // Xử lý ngày đặt hàng
    const orderDate = order.created_at || order.createdAt || order.order_date || "N/A"
    let orderDateElement = document.getElementById("order-date-container")
    if (!orderDateElement) {
      orderDateElement = document.createElement("p")
      orderDateElement.id = "order-date-container"
      orderDateElement.innerHTML = `<strong>Ngày đặt hàng:</strong> <span id="order-date">${formatDate(orderDate)}</span>`
      
      // Chèn ngày đặt hàng sau phương thức thanh toán
      paymentMethodElement.parentNode.insertBefore(orderDateElement, paymentMethodElement.nextSibling)
    } else {
      document.getElementById("order-date").textContent = formatDate(orderDate)
    }

    // Xử lý chi tiết sản phẩm
    const orderItemsBody = document.getElementById("order-items-body")
    orderItemsBody.innerHTML = ""

    // Tính tổng tiền hàng
    let subtotal = 0
    let hasItems = false

    // Kiểm tra các trường hợp khác nhau của danh sách sản phẩm
    if (order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
      hasItems = true
      order.orderItems.forEach((item) => {
        if (item) {
          const productName = item.product ? (item.product.name || 'Sản phẩm không xác định') : 'Sản phẩm không xác định'
          const price = item.price || item.unit_price || 0
          const quantity = item.quantity || 1
          const itemTotal = price * quantity
          subtotal += itemTotal
          
          const row = document.createElement("tr")
          row.innerHTML = `
                <td>${productName}</td>
                <td>${formatCurrency(price)}</td>
                <td>${quantity}</td>
                <td>${formatCurrency(itemTotal)}</td>
            `
          orderItemsBody.appendChild(row)
        }
      })
    } else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      hasItems = true
      order.items.forEach((item) => {
        if (item) {
          const productName = item.product ? (item.product.name || 'Sản phẩm không xác định') : 
                             (item.name || item.productName || item.product_name || 'Sản phẩm không xác định')
          
          const price = item.price || item.unit_price || 0
          const quantity = item.quantity || 1
          const itemTotal = price * quantity
          subtotal += itemTotal
          
          // Xử lý URL ảnh sản phẩm
          let imageUrl = item.image || item.product_image;
          
          // Nếu URL không bắt đầu bằng http hoặc / thì thêm đường dẫn tương đối
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `../img/products/${imageUrl}`;
          }
          
          // Nếu không có ảnh, sử dụng ảnh mặc định
          if (!imageUrl) {
            imageUrl = '../img/products/default.jpg';
          }
          
          const row = document.createElement("tr")
          row.innerHTML = `
                <td>
                  <div class="product-info">
                    <img src="${imageUrl}" alt="${productName}" class="product-thumbnail" onerror="this.src='../img/products/default.jpg'">
                    <span>${productName}</span>
                  </div>
                </td>
                <td>${formatCurrency(price)}</td>
                <td>${quantity}</td>
                <td>${formatCurrency(itemTotal)}</td>
            `
          orderItemsBody.appendChild(row)
        }
      })
    } else if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
      hasItems = true
      order.order_items.forEach((item) => {
        if (item) {
          const productName = item.product ? (item.product.name || 'Sản phẩm không xác định') : 
                             (item.productName || item.product_name || 'Sản phẩm không xác định')
          
          const price = item.price || item.unit_price || 0
          const quantity = item.quantity || 1
          const itemTotal = price * quantity
          subtotal += itemTotal
          
          const row = document.createElement("tr")
          row.innerHTML = `
                <td>${productName}</td>
                <td>${formatCurrency(price)}</td>
                <td>${quantity}</td>
                <td>${formatCurrency(itemTotal)}</td>
            `
          orderItemsBody.appendChild(row)
        }
      })
    }
    
    // Nếu không có sản phẩm nào, hiển thị thông báo
    if (!hasItems) {
      // Thử lấy thông tin sản phẩm từ API
      try {
        const orderItemsResponse = await apiRequest(`/orders/${id}/items`)
        if (orderItemsResponse.success && orderItemsResponse.data && Array.isArray(orderItemsResponse.data) && orderItemsResponse.data.length > 0) {
          orderItemsResponse.data.forEach((item) => {
            if (item) {
              const productName = item.product ? (item.product.name || 'Sản phẩm không xác định') : 
                                 (item.productName || item.product_name || 'Sản phẩm không xác định')
              
              const price = item.price || item.unit_price || 0
              const quantity = item.quantity || 1
              const itemTotal = price * quantity
              subtotal += itemTotal
              
              const row = document.createElement("tr")
              row.innerHTML = `
                    <td>${productName}</td>
                    <td>${formatCurrency(price)}</td>
                    <td>${quantity}</td>
                    <td>${formatCurrency(itemTotal)}</td>
                `
              orderItemsBody.appendChild(row)
            }
          })
        } else {
          throw new Error("No items found")
        }
      } catch (error) {
        console.error("Error loading order items:", error)
        const row = document.createElement("tr")
        row.innerHTML = `<td colspan="4" class="text-center">Không có thông tin sản phẩm</td>`
        orderItemsBody.appendChild(row)
      }
    }

    // Xử lý tổng tiền đơn hàng
    const orderSubtotal = order.subtotal || subtotal || 0
    const shippingFee = order.shippingFee || order.shipping_fee || 0
    const discount = order.discount || order.discount_amount || 0
    const total = order.totalAmount || order.total_amount || order.total || (orderSubtotal + shippingFee - discount)
    
    document.getElementById("order-subtotal").textContent = formatCurrency(orderSubtotal)
    document.getElementById("order-shipping").textContent = formatCurrency(shippingFee)
    document.getElementById("order-discount").textContent = formatCurrency(discount)
    document.getElementById("order-total").textContent = formatCurrency(total)

    // Xử lý ghi chú đơn hàng
    const orderNote = order.note || order.notes || order.customer_note || ""
    let noteElement = document.getElementById("order-note-container")
    
    if (orderNote) {
      if (!noteElement) {
        noteElement = document.createElement("div")
        noteElement.id = "order-note-container"
        noteElement.className = "order-note"
        noteElement.innerHTML = `
          <h4>Ghi chú đơn hàng</h4>
          <p id="order-note">${orderNote}</p>
        `
        
        // Chèn ghi chú trước phần tổng tiền
        const totalSection = document.querySelector("#order-subtotal").closest("div")
        totalSection.parentNode.insertBefore(noteElement, totalSection)
      } else {
        document.getElementById("order-note").textContent = orderNote
        noteElement.style.display = "block"
      }
    } else if (noteElement) {
      noteElement.style.display = "none"
    }

    // Hiển thị modal chi tiết đơn hàng
    document.getElementById("order-detail-container").style.display = "block"
  } catch (error) {
    console.error("Error loading order details:", error)
    showNotification("Lỗi khi tải chi tiết đơn hàng", "error")
    
    // Hiển thị dữ liệu mẫu nếu API lỗi
    try {
      displaySampleOrderDetail(id)
    } catch (e) {
      console.error("Error displaying sample order detail:", e)
    }
  }
}

// Hàm hiển thị dữ liệu đơn hàng từ localStorage
async function displaySampleOrderDetail(id) {
  try {
    // Thử truy vấn trực tiếp vào cơ sở dữ liệu để lấy thông tin đơn hàng
    const orderData = await fetchOrderDataFromDatabase(id)
    
    if (orderData) {
      // Nếu lấy được dữ liệu từ cơ sở dữ liệu, hiển thị dữ liệu đó
      displayOrderDetail(orderData)
    } else {
      // Nếu không lấy được dữ liệu từ cơ sở dữ liệu, kiểm tra trong localStorage
      const orderData = localStorage.getItem(`order_${id}`);
      
      if (orderData) {
        try {
          const parsedOrder = JSON.parse(orderData);
          console.log("Found order in localStorage:", parsedOrder);
          displayOrderDetail(parsedOrder);
        } catch (e) {
          console.error("Error parsing order data from localStorage:", e);
          showNotification("Lỗi khi đọc dữ liệu đơn hàng", "error");
        }
      } else {
        showNotification("Không tìm thấy đơn hàng", "error");
      }
    }
  } catch (error) {
    console.error("Error in displaySampleOrderDetail:", error);
    
    // Nếu có lỗi, kiểm tra trong localStorage
    const orderData = localStorage.getItem(`order_${id}`);
    
    if (orderData) {
      try {
        const parsedOrder = JSON.parse(orderData);
        console.log("Found order in localStorage after error:", parsedOrder);
        displayOrderDetail(parsedOrder);
      } catch (e) {
        console.error("Error parsing order data from localStorage:", e);
        showNotification("Lỗi khi đọc dữ liệu đơn hàng", "error");
      }
    } else {
      showNotification("Không tìm thấy đơn hàng", "error");
    }
  }
}

// Hàm truy vấn trực tiếp vào cơ sở dữ liệu để lấy thông tin đơn hàng
async function fetchOrderDataFromDatabase(orderId) {
  try {
    // Thử gọi API trực tiếp đến endpoint của cơ sở dữ liệu
    const response = await fetch(`${API_BASE_URL}/db/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || !data.order) {
      throw new Error("Invalid data format")
    }
    
    // Lấy thông tin người dùng từ cơ sở dữ liệu
    if (data.order.user_id) {
      try {
        const userResponse = await fetch(`${API_BASE_URL}/db/users/${data.order.user_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}`
          }
        })
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData && userData.user) {
            data.order.user = userData.user
          }
        }
      } catch (userError) {
        console.error("Error fetching user data:", userError)
      }
    }
    
    // Lấy thông tin địa chỉ từ cơ sở dữ liệu
    if (data.order.address_id) {
      try {
        const addressResponse = await fetch(`${API_BASE_URL}/db/addresses/${data.order.address_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem(TOKEN_KEY)}`
          }
        })
        
        if (addressResponse.ok) {
          const addressData = await addressResponse.json()
          if (addressData && addressData.address) {
            data.order.address = addressData.address
          }
        }
      } catch (addressError) {
        console.error("Error fetching address data:", addressError)
      }
    }
    
    return data.order
  } catch (error) {
    console.error("Error fetching order data from database:", error)
    return null
  }
}

// Hàm hiển thị dữ liệu đơn hàng
function displayOrderDetail(order) {
  // Hiển thị ID đơn hàng
  document.getElementById("order-detail-id").textContent = order.order_id
  
  // Thiết lập trạng thái đơn hàng trong dropdown
  const statusSelect = document.getElementById("order-status")
  statusSelect.value = order.status
  statusSelect.setAttribute("data-current-status", order.status)
  
  // Hiển thị thông tin khách hàng
  let userName = "Khách vãng lai"
  let userEmail = "N/A"
  let userPhone = "N/A"
  
  if (order.user) {
    userName = order.user.username || order.user.full_name || `Khách hàng #${order.user_id}`
    userEmail = order.user.email || "N/A"
    userPhone = order.user.phone || "N/A"
  } else if (order.user_id) {
    userName = `Khách hàng #${order.user_id}`
  } else if (order.guest_info) {
    // Thông tin khách hàng không đăng nhập
    userName = order.guest_info.full_name || order.guest_info.name || "Khách vãng lai"
    userEmail = order.guest_info.email || "N/A"
    userPhone = order.guest_info.phone || "N/A"
  } else if (order.customer_name || order.customer_email || order.customer_phone) {
    // Thông tin khách hàng lưu trực tiếp trong đơn hàng
    userName = order.customer_name || "Khách vãng lai"
    userEmail = order.customer_email || "N/A"
    userPhone = order.customer_phone || "N/A"
  }
  
  document.getElementById("order-customer-name").textContent = userName
  document.getElementById("order-customer-email").textContent = userEmail
  document.getElementById("order-customer-phone").textContent = userPhone
  
  // Hiển thị địa chỉ giao hàng
  let addressText = "N/A"
  
  if (order.address) {
    if (typeof order.address === 'string') {
      addressText = order.address
    } else {
      const addressParts = []
      
      if (order.address.street) addressParts.push(order.address.street)
      if (order.address.ward) addressParts.push(order.address.ward)
      if (order.address.district) addressParts.push(order.address.district)
      if (order.address.city) addressParts.push(order.address.city)
      
      if (addressParts.length > 0) {
        addressText = addressParts.join(", ")
      }
    }
  } else if (order.shipping_address) {
    addressText = order.shipping_address
  } else if (order.shippingAddress) {
    const address = order.shippingAddress
    const addressParts = []
    
    if (address.street) addressParts.push(address.street)
    if (address.ward) addressParts.push(address.ward)
    if (address.district) addressParts.push(address.district)
    if (address.city) addressParts.push(address.city)
    
    if (addressParts.length > 0) {
      addressText = addressParts.join(", ")
    }
  } else if (order.guest_info && (order.guest_info.address || order.guest_info.city)) {
    // Trường hợp địa chỉ trong thông tin khách
    const addressParts = []
    
    if (order.guest_info.address) addressParts.push(order.guest_info.address)
    if (order.guest_info.city) addressParts.push(order.guest_info.city)
    
    if (addressParts.length > 0) {
      addressText = addressParts.join(", ")
    }
  }
  
  document.getElementById("order-shipping-address").textContent = addressText
  
  // Hiển thị phương thức thanh toán
  const paymentMethod = order.payment_method || order.paymentMethod || "N/A"
  let paymentMethodText = "N/A"
  
  switch(paymentMethod.toLowerCase()) {
    case "cod":
      paymentMethodText = "Thanh toán khi nhận hàng (COD)"
      break
    case "online":
      paymentMethodText = "Thanh toán trực tuyến"
      break
    case "zalopay":
      paymentMethodText = "ZaloPay"
      break
    case "momo":
      paymentMethodText = "MoMo"
      break
    case "bank_transfer":
      paymentMethodText = "Chuyển khoản ngân hàng"
      break
    default:
      paymentMethodText = paymentMethod
  }
  
  // Thêm phương thức thanh toán vào modal
  let paymentMethodElement = document.getElementById("order-payment-method-container")
  if (!paymentMethodElement) {
    paymentMethodElement = document.createElement("p")
    paymentMethodElement.id = "order-payment-method-container"
    paymentMethodElement.innerHTML = `<strong>Phương thức thanh toán:</strong> <span id="order-payment-method">${paymentMethodText}</span>`
    
    // Chèn phương thức thanh toán sau địa chỉ giao hàng
    const shippingAddressElement = document.getElementById("order-shipping-address").parentElement
    shippingAddressElement.parentNode.insertBefore(paymentMethodElement, shippingAddressElement.nextSibling)
  } else {
    document.getElementById("order-payment-method").textContent = paymentMethodText
  }
  
  // Hiển thị ngày đặt hàng
  const orderDate = order.created_at || order.createdAt || order.order_date || "N/A"
  let orderDateElement = document.getElementById("order-date-container")
  if (!orderDateElement) {
    orderDateElement = document.createElement("p")
    orderDateElement.id = "order-date-container"
    orderDateElement.innerHTML = `<strong>Ngày đặt hàng:</strong> <span id="order-date">${formatDate(orderDate)}</span>`
    
    // Chèn ngày đặt hàng sau phương thức thanh toán
    paymentMethodElement.parentNode.insertBefore(orderDateElement, paymentMethodElement.nextSibling)
  } else {
    document.getElementById("order-date").textContent = formatDate(orderDate)
  }
  
  // Hiển thị chi tiết sản phẩm
  const orderItemsBody = document.getElementById("order-items-body")
  orderItemsBody.innerHTML = ""
  
  // Tính tổng tiền hàng
  let subtotal = 0
  let hasItems = false
  
  if (order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0) {
    hasItems = true
    order.orderItems.forEach((item) => {
      if (item) {
        const productName = item.product ? (item.product.name || 'Sản phẩm không xác định') : 'Sản phẩm không xác định'
        const price = item.price || item.unit_price || 0
        const quantity = item.quantity || 1
        const itemTotal = price * quantity
        subtotal += itemTotal
        
        const row = document.createElement("tr")
        row.innerHTML = `
              <td>${productName}</td>
              <td>${formatCurrency(price)}</td>
              <td>${quantity}</td>
              <td>${formatCurrency(itemTotal)}</td>
          `
        orderItemsBody.appendChild(row)
      }
    })
  } else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    hasItems = true
    order.items.forEach((item) => {
      if (item) {
        const productName = item.product ? (item.product.name || 'Sản phẩm không xác định') : 
                           (item.productName || item.product_name || 'Sản phẩm không xác định')
        
        const price = item.price || item.unit_price || 0
        const quantity = item.quantity || 1
        const itemTotal = price * quantity
        subtotal += itemTotal
        
        const row = document.createElement("tr")
        row.innerHTML = `
              <td>${productName}</td>
              <td>${formatCurrency(price)}</td>
              <td>${quantity}</td>
              <td>${formatCurrency(itemTotal)}</td>
          `
        orderItemsBody.appendChild(row)
      }
    })
  } else if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
    hasItems = true
    order.order_items.forEach((item) => {
      if (item) {
        const productName = item.product ? (item.product.name || 'Sản phẩm không xác định') : 
                           (item.productName || item.product_name || 'Sản phẩm không xác định')
        
        const price = item.price || item.unit_price || 0
        const quantity = item.quantity || 1
        const itemTotal = price * quantity
        subtotal += itemTotal
        
        const row = document.createElement("tr")
        row.innerHTML = `
              <td>${productName}</td>
              <td>${formatCurrency(price)}</td>
              <td>${quantity}</td>
              <td>${formatCurrency(itemTotal)}</td>
          `
        orderItemsBody.appendChild(row)
      }
    })
  }
  
  if (!hasItems) {
    const row = document.createElement("tr")
    row.innerHTML = `<td colspan="4" class="text-center">Không có thông tin sản phẩm</td>`
    orderItemsBody.appendChild(row)
  }
  
  // Hiển thị tổng tiền đơn hàng
  const orderSubtotal = order.subtotal || subtotal || 0
  const shippingFee = order.shippingFee || order.shipping_fee || 0
  const discount = order.discount || order.discount_amount || 0
  const total = order.totalAmount || order.total_amount || order.total || (orderSubtotal + shippingFee - discount)
  
  document.getElementById("order-subtotal").textContent = formatCurrency(orderSubtotal)
  document.getElementById("order-shipping").textContent = formatCurrency(shippingFee)
  document.getElementById("order-discount").textContent = formatCurrency(discount)
  document.getElementById("order-total").textContent = formatCurrency(total)
  
  // Hiển thị ghi chú đơn hàng
  const orderNote = order.note || order.notes || order.customer_note || ""
  let noteElement = document.getElementById("order-note-container")
  
  if (orderNote) {
    if (!noteElement) {
      noteElement = document.createElement("div")
      noteElement.id = "order-note-container"
      noteElement.className = "order-note"
      noteElement.innerHTML = `
        <h4>Ghi chú đơn hàng</h4>
        <p id="order-note">${orderNote}</p>
      `
      
      // Chèn ghi chú trước phần tổng tiền
      const totalSection = document.querySelector("#order-subtotal").closest("div")
      totalSection.parentNode.insertBefore(noteElement, totalSection)
    } else {
      document.getElementById("order-note").textContent = orderNote
      noteElement.style.display = "block"
    }
  } else if (noteElement) {
    noteElement.style.display = "none"
  }
  
  // Hiển thị modal chi tiết đơn hàng
  document.getElementById("order-detail-container").style.display = "block"
}

// Hàm hiển thị dữ liệu mẫu
function displaySampleData(id) {
  // Tạo dữ liệu mẫu
  const sampleOrder = {
    order_id: id,
    status: "pending",
    user_id: 7,
    user: {
      username: "nguyenvana",
      email: "vana@example.com",
      phone: "0912345678"
    },
    address_id: 1,
    address: {
      street: "123 Đường Lê Lợi",
      ward: "Phường Bến Nghé",
      district: "Quận 1",
      city: "TP. Hồ Chí Minh"
    },
    payment_method: "cod",
    created_at: new Date().toISOString(),
    items: [
      {
        product: { name: "Bánh Mì Thịt" },
        price: 25000,
        quantity: 2
      },
      {
        product: { name: "Bánh Mì Gà" },
        price: 30000,
        quantity: 1
      }
    ],
    subtotal: 80000,
    shipping_fee: 15000,
    discount: 0,
    total: 95000,
    note: "Giao hàng giờ hành chính"
  }
  
  // Hiển thị dữ liệu mẫu
  displayOrderDetail(sampleOrder)
}

function hideOrderDetail() {
  document.getElementById("order-detail-container").style.display = "none"
}

// Helper function to get human-readable status text
function getStatusText(status) {
  // Log the status value for debugging
  console.log("Getting status text for:", status);
  
  if (!status) {
    console.warn("Status is undefined or null");
    return "Không xác định";
  }
  
  // Normalize the status to handle inconsistencies
  const normalizedStatus = String(status).toLowerCase().trim();
  
  // Make sure this matches EXACTLY with your backend ENUM values
  switch (normalizedStatus) {
    case "pending":
      return "Chờ xử lý";
    case "confirmed":
      return "Đã xác nhận";
    case "preparing":
      return "Đang chuẩn bị";
    case "delivering":
      return "Đang giao";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
    case "canceled": // Handle alternative spelling
      return "Đã hủy";
    default:
      console.warn(`Unknown status value: "${status}" (normalized: "${normalizedStatus}")`);
      return "Không xác định";
  }
}


// Helper function to generate status badges with consistent styling
function getOrderStatusBadge(status) {
  if (!status) {
    return '<span class="status-badge">Không xác định</span>';
  }
  
  // Normalize status to handle inconsistencies
  const normalizedStatus = String(status).toLowerCase().trim();
  
  // Get text representation
  const statusText = getStatusText(status);
  
  // Special case for canceled/cancelled (to handle both spellings)
  let cssClass = normalizedStatus;
  if (normalizedStatus === 'canceled') {
    cssClass = 'cancelled'; // Use the British spelling for CSS class
  }
  
  return `<span class="status-badge ${cssClass}">${statusText}</span>`;
}

async function updateOrderStatus() {
  // Lấy ID đơn hàng và giá trị trạng thái
  const orderId = document.getElementById("order-detail-id").textContent;
  const statusSelect = document.getElementById("order-status");
  const newStatus = statusSelect.value;
  const oldStatus = statusSelect.getAttribute("data-current-status") || "pending";
  
  // Xác thực giá trị trạng thái
  if (!newStatus) {
    showNotification("Trạng thái mới không hợp lệ", "error");
    return;
  }
  
  // Kiểm tra xem trạng thái có nằm trong danh sách cho phép không
  const allowedStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(newStatus)) {
    showNotification(`Trạng thái "${newStatus}" không hợp lệ. Các trạng thái hợp lệ: ${allowedStatuses.join(', ')}`, "error");
    return;
  }
  
  console.log(`Cập nhật đơn hàng #${orderId} từ trạng thái ${oldStatus} sang ${newStatus}`);
  console.log(`Updating order #${orderId} status from ${oldStatus} to ${newStatus}`);

  try {
    // Prepare update data
    const updateData = {
      status: newStatus, 
      old_status: oldStatus, // Use underscore for consistency with database
      // Include admin user ID if available
      changed_by: JSON.parse(localStorage.getItem(USER_KEY) || '{}').user_id || null
    };
    
    console.log("Update data:", updateData);
    
    // Try different API patterns based on backend structure
    let success = false;
    let error = null;
    
    // Try standard RESTful endpoint first
    try {
      await apiRequest(`/orders/${orderId}/status`, "PUT", updateData);
      success = true;
    } catch (err1) {
      console.log("Standard endpoint failed, trying alternative...", err1);
      error = err1;
      
      // Try direct order update
      try {
        await apiRequest(`/orders/${orderId}`, "PATCH", { status: newStatus });
        success = true;
        
        // Also try to record in history table if endpoint exists
        try {
          await apiRequest('/order-status-history', "POST", {
            order_id: orderId,
            old_status: oldStatus,
            new_status: newStatus,
            changed_by: updateData.changed_by
          });
        } catch (historyErr) {
          console.log("Could not record history, but order was updated", historyErr);
        }
      } catch (err2) {
        console.log("Alternative endpoint also failed", err2);
        error = err2;
        
        // Try simple update as last resort
        try {
          await apiRequest(`/orders/${orderId}`, "PUT", { status: newStatus });
          success = true;
        } catch (err3) {
          console.log("All API attempts failed", err3);
          error = err3;
        }
      }
    }
    
    if (success) {
      // Get the human-readable status text for the notification
      const statusText = getStatusText(newStatus);
      showNotification(`Đơn hàng #${orderId} đã được cập nhật sang "${statusText}"`, "success");
      hideOrderDetail();
      loadOrders(ordersCurrentPage);
    } else {
      throw error || new Error("Không thể kết nối với API");
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    
    // Provide more helpful error message
    let errorMessage = "Không thể cập nhật trạng thái đơn hàng.";
    if (error.message) {
      errorMessage += " " + error.message;
    }
    
    showNotification(errorMessage, "error");
    
    // Since we can't update through API, simulate success for demo purposes
    if (confirm("API không phản hồi. Bạn có muốn cập nhật giao diện tạm thời không?")) {
      // Update the UI to show the change even though API failed
      hideOrderDetail();
      
      // Find and update the order in the table
      const orderRows = document.querySelectorAll("#orders-body tr");
      let updated = false;
      
      orderRows.forEach(row => {
        const idCell = row.querySelector("td:first-child");
        if (idCell && idCell.textContent === `#${orderId}`) {
          const statusCell = row.querySelector("td:nth-child(5)");
          if (statusCell) {
            statusCell.innerHTML = getOrderStatusBadge(newStatus);
            updated = true;
          }
        }
      });
      
      if (updated) {
        showNotification(`Đơn hàng #${orderId} đã được cập nhật sang "${getStatusText(newStatus)}" (chỉ tạm thời)`, "warning");
      } else {
        showNotification("Không thể tìm thấy đơn hàng trong bảng để cập nhật giao diện", "error");
      }
    }
  }
}

// Users Functions
let usersCurrentPage = 1
let usersTotalPages = 1

async function loadUsers(page = 1, search = "") {
  try {
    let url = `/users?page=${page}&limit=10`
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    
    console.log("Calling loadUsers with URL:", url)
    const response = await apiRequest(url)
    console.log("Users response:", response)
    
    // Handle different response formats
    let users = []
    let total = 0
    
    if (Array.isArray(response)) {
      // Direct array of users
      users = response
      total = response.length
    } else if (response.users) {
      // Object with users property
      users = response.users
      total = response.total || users.length
    } else if (response.data && Array.isArray(response.data)) {
      // Object with data property containing array
      users = response.data
      total = response.total || users.length
    } else if (response.success && response.data) {
      // Success response with data property
      users = Array.isArray(response.data) ? response.data : (response.data.users || [])
      total = response.total || response.data.total || users.length
    }
    
    console.log("Final users data:", users)
    usersCurrentPage = page
    usersTotalPages = Math.ceil(total / 10)

    const usersBody = document.getElementById("users-body")
    usersBody.innerHTML = ""

    if (users && users.length > 0) {
      users.forEach((user) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${user.user_id}</td>
                  <td>${user.username || 'Không có tên'}</td>
                  <td>${user.email || 'Không có email'}</td>
                  <td>${user.phone || "N/A"}</td>
                  <td>${user.role === "admin" ? "Quản trị viên" : "Người dùng"}</td>
                  <td>${formatDate(user.created_at)}</td>
                  <td>
                      <button class="btn-admin" onclick="editUser(${user.user_id})">Sửa</button>
                      ${user.role !== "admin" ? `<button class="btn-admin btn-danger" onclick="deleteUser(${user.user_id})">Xóa</button>` : ""}
                  </td>
              `
        usersBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="7" class="text-center">Không có người dùng nào</td>`
      usersBody.appendChild(row)
    }

    createPagination("users-pagination", usersCurrentPage, usersTotalPages, loadUsers)
  } catch (error) {
    console.error("Error loading users:", error)
    showNotification("Lỗi khi tải danh sách người dùng", "error")
  }
}

async function editUser(id) {
  if (!id) {
    showNotification("ID người dùng không hợp lệ", "error")
    return
  }
  
  try {
    const response = await apiRequest(`/users/${id}`)
    const user = response.success && response.data ? response.data : null
    
    if (!user) {
      showNotification("Không tìm thấy người dùng", "error")
      return
    }

    document.getElementById("user-id").value = user.user_id
    document.getElementById("user-name").value = user.username
    document.getElementById("user-email").value = user.email
    document.getElementById("user-phone").value = user.phone || ""
    document.getElementById("user-role").value = user.role

    document.getElementById("user-detail-container").style.display = "block"
  } catch (error) {
    console.error("Error loading user details:", error)
    showNotification("Lỗi khi tải thông tin người dùng", "error")
  }
}

function hideUserDetail() {
  document.getElementById("user-detail-container").style.display = "none"
}

async function deleteUser(id) {
  if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
    try {
      await apiRequest(`/users/${id}`, "DELETE")
      showNotification("Xóa người dùng thành công")
      loadUsers(usersCurrentPage)
    } catch (error) {
      console.error("Error deleting user:", error)
      showNotification("Không thể xóa người dùng. Vui lòng thử lại sau.", "error")
    }
  }
}

async function handleUserSubmit(e) {
  e.preventDefault()

  const userId = document.getElementById("user-id").value
  const userData = {
    username: document.getElementById("user-name").value,
    email: document.getElementById("user-email").value,
    phone: document.getElementById("user-phone").value,
    role: document.getElementById("user-role").value,
  }

  try {
    await apiRequest(`/users/${userId}`, "PUT", userData)
    showNotification("Cập nhật người dùng thành công")
    hideUserDetail()
    loadUsers(usersCurrentPage)
  } catch (error) {
    console.error("Error updating user:", error)
    showNotification("Không thể cập nhật người dùng. Vui lòng thử lại sau.", "error")
  }
}

// Reservations Functions
let reservationsCurrentPage = 1
let reservationsTotalPages = 1

async function loadReservations(page = 1, search = "") {
  try {
    const statusFilter = document.getElementById("reservation-status-filter").value
    let url = `/reservations?page=${page}&limit=10`

    if (statusFilter) {
      url += `&status=${statusFilter}`
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    console.log("Calling loadReservations with URL:", url)
    const response = await apiRequest(url)
    console.log("Reservations response:", response)
    
    // Handle different response formats
    let reservations = []
    let total = 0
    
    if (Array.isArray(response)) {
      // Direct array of reservations
      reservations = response
      total = response.length
    } else if (response.reservations) {
      // Object with reservations property
      reservations = response.reservations
      total = response.total || reservations.length
    } else if (response.data && Array.isArray(response.data)) {
      // Object with data property containing array
      reservations = response.data
      total = response.total || reservations.length
    } else if (response.success && response.data) {
      // Success response with data property
      reservations = Array.isArray(response.data) ? response.data : (response.data.reservations || [])
      total = response.total || response.data.total || reservations.length
    }
    
    console.log("Final reservations data:", reservations)
    reservationsCurrentPage = page
    reservationsTotalPages = Math.ceil(total / 10)

    const reservationsBody = document.getElementById("reservations-body")
    reservationsBody.innerHTML = ""

    if (reservations && reservations.length > 0) {
      reservations.forEach((reservation) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${reservation.reservation_id}</td>
                  <td>${reservation.full_name || 'Không có tên'}</td>
                  <td>${reservation.phone || 'N/A'}</td>
                  <td>${formatShortDate(reservation.reservation_date)}</td>
                  <td>${reservation.reservation_time || 'N/A'}</td>
                  <td>${reservation.guests || 0}</td>
                  <td>${getReservationStatusBadge(reservation.status)}</td>
                  <td>
                      <button class="btn-admin" onclick="editReservation(${reservation.reservation_id})">Chi tiết</button>
                  </td>
              `
        reservationsBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="8" class="text-center">Không có đặt bàn nào</td>`
      reservationsBody.appendChild(row)
    }

    createPagination("reservations-pagination", reservationsCurrentPage, reservationsTotalPages, loadReservations)
  } catch (error) {
    console.error("Error loading reservations:", error)
    showNotification("Lỗi khi tải danh sách đặt bàn", "error")
  }
}

async function editReservation(id) {
  if (!id) {
    showNotification("ID đặt bàn không hợp lệ", "error")
    return
  }
  
  try {
    const response = await apiRequest(`/reservations/${id}`)
    const reservation = response.success && response.data ? response.data : null
    
    if (!reservation) {
      showNotification("Không tìm thấy đặt bàn", "error")
      return
    }

    document.getElementById("reservation-id").value = reservation.reservation_id
    document.getElementById("reservation-status").value = reservation.status
    document.getElementById("reservation-note").value = reservation.notes || ""

    document.getElementById("reservation-detail-container").style.display = "block"
  } catch (error) {
    console.error("Error loading reservation details:", error)
    showNotification("Lỗi khi tải thông tin đặt bàn", "error")
  }
}

function hideReservationDetail() {
  document.getElementById("reservation-detail-container").style.display = "none"
}

async function handleReservationSubmit(e) {
  e.preventDefault()

  const reservationId = document.getElementById("reservation-id").value
  const reservationData = {
    status: document.getElementById("reservation-status").value,
    note: document.getElementById("reservation-note").value,
  }

  try {
    await apiRequest(`/reservations/${reservationId}`, "PUT", reservationData)
    showNotification("Cập nhật thông tin đặt bàn thành công")
    hideReservationDetail()
    loadReservations(reservationsCurrentPage)
  } catch (error) {
    console.error("Error updating reservation:", error)
    showNotification("Không thể cập nhật thông tin đặt bàn. Vui lòng thử lại sau.", "error")
  }
}

// Tables Functions
let tablesCurrentPage = 1
let tablesTotalPages = 1
let allTables = [] // Store all tables for floor plan view
let isDragging = false
let draggedTable = null
let tablePositionsChanged = false

async function loadTables(page = 1, search = "") {
  tablesCurrentPage = page
  
  try {
    const storeId = document.getElementById("store-filter").value
    const status = document.getElementById("table-status-filter").value
    const searchQuery = search || document.getElementById("table-search").value
    
    let endpoint = ""
    
    // Sử dụng endpoint lấy tất cả bàn theo cửa hàng nếu có store filter
    if (storeId && storeId !== "all") {
      endpoint = `/tables/store/${storeId}?page=${page}`
    } 
    // Sử dụng endpoint filter nếu có status filter hoặc search
    else if (status && status !== "all" || searchQuery) {
      endpoint = `/tables/filter?page=${page}`
      if (status && status !== "all") {
        endpoint += `&status=${status}`
      }
      if (searchQuery) {
        endpoint += `&search=${searchQuery}`
      }
    }
    // Mặc định lấy tất cả bàn
    else {
      // Lấy cửa hàng đầu tiên nếu không có filter
      const firstStore = document.querySelector("#store-filter option:not([value='all'])")
      const defaultStoreId = firstStore ? firstStore.value : ""
      
      if (defaultStoreId) {
        endpoint = `/tables/store/${defaultStoreId}?page=${page}`
      } else {
        // Fallback nếu không có cửa hàng nào
        endpoint = `/tables/filter?page=${page}`
      }
    }
    
    const response = await apiRequest(endpoint)
    
    // Handle different response formats
    let tables = []
    let totalPages = 1
    
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        tables = response.data
      } else if (response.data.tables) {
        tables = response.data.tables
        totalPages = response.data.total_pages || 1
      }
    } else if (Array.isArray(response)) {
      tables = response
    }
    
    tablesTotalPages = totalPages
    allTables = tables // Store all tables for floor plan view
    
    // Update filter tags
    updateFilterTags(storeId, status, searchQuery)
    
    // Update tables list view
    updateTablesListView(tables)
    
    // Update tables grid view
    updateTablesGridView(tables)
    
    // Update floor plan view
    updateFloorPlanView(tables)
    
    // Create pagination
    createPagination("tables-pagination", tablesCurrentPage, tablesTotalPages, loadTables)
    
    // Load stores for filter if needed
    if (!document.getElementById("store-filter").innerHTML.trim()) {
      loadStoresForFilter()
    }
  } catch (error) {
    console.error("Error loading tables:", error)
    showNotification("Lỗi khi tải danh sách bàn", "error")
  }
}

function updateFilterTags(storeId, status, search) {
  const filterTagsContainer = document.getElementById("tables-filter-tags")
  let tagsHTML = ''
  
  if (storeId && storeId !== "all") {
    const storeSelect = document.getElementById("store-filter")
    const storeName = storeSelect.options[storeSelect.selectedIndex].text
    tagsHTML += `
      <div class="filter-tag">
        <span>Cửa hàng: ${storeName}</span>
        <button onclick="clearStoreFilter()"><i class="fas fa-times"></i></button>
      </div>
    `
  }
  
  if (status && status !== "all") {
    let statusText = ""
    switch (status) {
      case "available": statusText = "Trống"; break
      case "occupied": statusText = "Đang sử dụng"; break
      case "reserved": statusText = "Đã đặt"; break
      case "maintenance": statusText = "Bảo trì"; break
    }
    
    tagsHTML += `
      <div class="filter-tag">
        <span>Trạng thái: ${statusText}</span>
        <button onclick="clearStatusFilter()"><i class="fas fa-times"></i></button>
      </div>
    `
  }
  
  if (search) {
    tagsHTML += `
      <div class="filter-tag">
        <span>Tìm kiếm: "${search}"</span>
        <button onclick="clearSearchFilter()"><i class="fas fa-times"></i></button>
      </div>
    `
  }
  
  if (tagsHTML) {
    tagsHTML += `
      <div class="filter-tag clear-all">
        <button onclick="clearAllFilters()">Xóa tất cả bộ lọc</button>
      </div>
    `
  }
  
  filterTagsContainer.innerHTML = tagsHTML
}

function clearStoreFilter() {
  document.getElementById("store-filter").value = "all"
  loadTables(1)
}

function clearStatusFilter() {
  document.getElementById("table-status-filter").value = "all"
  loadTables(1)
}

function clearSearchFilter() {
  document.getElementById("table-search").value = ""
  loadTables(1)
}

function clearAllFilters() {
  document.getElementById("store-filter").value = "all"
  document.getElementById("table-status-filter").value = "all"
  document.getElementById("table-search").value = ""
  loadTables(1)
}

function updateTablesListView(tables) {
  const tablesBody = document.getElementById("tables-body")
  tablesBody.innerHTML = ""
  
  if (tables && tables.length > 0) {
    tables.forEach((table) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${table.table_id}</td>
        <td>${table.table_number}</td>
        <td>${formatTableType(table.table_type)}</td>
        <td>${table.seats} người</td>
        <td>${table.store_name || 'N/A'}</td>
        <td>${table.location || 'N/A'}</td>
        <td>${getTableStatusBadge(table.status)}</td>
        <td>
          <button class="btn-admin btn-sm" onclick="editTable(${table.table_id})" title="Chỉnh sửa">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-admin btn-sm btn-danger" onclick="deleteTable(${table.table_id})" title="Xóa">
            <i class="fas fa-trash"></i>
          </button>
          <button class="btn-admin btn-sm btn-info" onclick="showQuickStatusChange(${table.table_id})" title="Đổi trạng thái">
            <i class="fas fa-exchange-alt"></i>
          </button>
        </td>
      `
      tablesBody.appendChild(row)
    })
  } else {
    const row = document.createElement("tr")
    row.innerHTML = `<td colspan="8" class="text-center">Không có bàn nào</td>`
    tablesBody.appendChild(row)
  }
}

function updateTablesGridView(tables) {
  const tablesGrid = document.getElementById("tables-grid")
  tablesGrid.innerHTML = ""
  
  if (tables && tables.length > 0) {
    tables.forEach((table) => {
      const tableCard = document.createElement("div")
      tableCard.className = `table-card ${table.status}`
      
      // Determine table shape class based on type
      let tableShapeClass = ""
      switch (table.table_type) {
        case "round": tableShapeClass = "table-round"; break
        case "rectangle": tableShapeClass = "table-rectangle"; break
        case "square": tableShapeClass = "table-square"; break
        case "booth": tableShapeClass = "table-booth"; break
        case "large": tableShapeClass = "table-large"; break
      }
      
      tableCard.innerHTML = `
        <div class="table-card-header">
          <div class="table-icon ${tableShapeClass}">
            <span>${table.table_number}</span>
          </div>
          <div class="table-info">
            <h3>Bàn ${table.table_number}</h3>
            ${getTableStatusBadge(table.status)}
          </div>
        </div>
        <div class="table-card-body">
          <p><strong>Loại:</strong> ${formatTableType(table.table_type)}</p>
          <p><strong>Số chỗ:</strong> ${table.seats} người</p>
          <p><strong>Cửa hàng:</strong> ${table.store_name || 'N/A'}</p>
          <p><strong>Vị trí:</strong> ${table.location || 'N/A'}</p>
        </div>
        <div class="table-card-footer">
          <button class="btn-admin btn-sm" onclick="editTable(${table.table_id})">
            <i class="fas fa-edit"></i> Sửa
          </button>
          <button class="btn-admin btn-sm btn-info" onclick="showQuickStatusChange(${table.table_id})">
            <i class="fas fa-exchange-alt"></i> Đổi trạng thái
          </button>
          <button class="btn-admin btn-sm btn-danger" onclick="deleteTable(${table.table_id})">
            <i class="fas fa-trash"></i> Xóa
          </button>
        </div>
      `
      tablesGrid.appendChild(tableCard)
    })
  } else {
    tablesGrid.innerHTML = `<div class="empty-message">Không có bàn nào</div>`
  }
}

function updateFloorPlanView(tables) {
  const floorPlan = document.getElementById("floor-plan")
  floorPlan.innerHTML = ""
  
  // Filter tables by selected store
  const storeId = document.getElementById("store-filter").value
  let filteredTables = tables
  
  if (storeId && storeId !== "all") {
    filteredTables = tables.filter(table => table.store_id == storeId)
  }
  
  if (filteredTables && filteredTables.length > 0) {
    filteredTables.forEach((table) => {
      // Create table element
      const tableElement = document.createElement("div")
      tableElement.id = `floor-table-${table.table_id}`
      tableElement.className = `floor-table ${table.status} ${table.table_type}`
      tableElement.dataset.tableId = table.table_id
      tableElement.dataset.status = table.status
      
      // Set position if available
      if (table.position_x !== null && table.position_y !== null) {
        tableElement.style.left = `${table.position_x}px`
        tableElement.style.top = `${table.position_y}px`
      } else {
        // Default position if not set
        tableElement.style.left = "50px"
        tableElement.style.top = "50px"
      }
      
      // Add table content
      tableElement.innerHTML = `
        <div class="table-number">${table.table_number}</div>
        <div class="table-seats">${table.seats}</div>
      `
      
      // Add event listeners for dragging
      tableElement.addEventListener("mousedown", startDragging)
      tableElement.addEventListener("dblclick", function() {
        showQuickStatusChange(table.table_id)
      })
      
      floorPlan.appendChild(tableElement)
    })
  } else {
    floorPlan.innerHTML = `
      <div class="floor-plan-empty">
        <p>Không có bàn nào trong cửa hàng này</p>
        <p>Vui lòng chọn cửa hàng khác hoặc thêm bàn mới</p>
      </div>
    `
  }
}

function startDragging(e) {
  // Only allow dragging in floor plan view
  if (document.getElementById("floor-plan-view").style.display === "none") {
    return
  }
  
  isDragging = true
  draggedTable = this
  
  // Calculate offset
  const rect = draggedTable.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const offsetY = e.clientY - rect.top
  
  // Store offset in the element
  draggedTable.dataset.offsetX = offsetX
  draggedTable.dataset.offsetY = offsetY
  
  // Add dragging class
  draggedTable.classList.add("dragging")
  
  // Add event listeners for dragging
  document.addEventListener("mousemove", dragTable)
  document.addEventListener("mouseup", stopDragging)
  
  // Prevent default behavior
  e.preventDefault()
}

function dragTable(e) {
  if (!isDragging || !draggedTable) return
  
  const floorPlan = document.getElementById("floor-plan")
  const floorPlanRect = floorPlan.getBoundingClientRect()
  
  // Calculate new position
  const offsetX = parseFloat(draggedTable.dataset.offsetX)
  const offsetY = parseFloat(draggedTable.dataset.offsetY)
  
  let newX = e.clientX - floorPlanRect.left - offsetX
  let newY = e.clientY - floorPlanRect.top - offsetY
  
  // Ensure table stays within floor plan
  newX = Math.max(0, Math.min(newX, floorPlanRect.width - draggedTable.offsetWidth))
  newY = Math.max(0, Math.min(newY, floorPlanRect.height - draggedTable.offsetHeight))
  
  // Update position
  draggedTable.style.left = `${newX}px`
  draggedTable.style.top = `${newY}px`
  
  // Mark positions as changed
  tablePositionsChanged = true
}

function stopDragging() {
  if (!isDragging) return
  
  // Remove dragging class
  if (draggedTable) {
    draggedTable.classList.remove("dragging")
  }
  
  // Reset variables
  isDragging = false
  draggedTable = null
  
  // Remove event listeners
  document.removeEventListener("mousemove", dragTable)
  document.removeEventListener("mouseup", stopDragging)
}

async function saveTablePositions() {
  try {
    const floorPlan = document.getElementById("floor-plan")
    const tables = floorPlan.querySelectorAll(".floor-table")
    const positionUpdates = []
    
    tables.forEach(table => {
      const tableId = table.dataset.tableId
      const positionX = parseInt(table.style.left)
      const positionY = parseInt(table.style.top)
      
      positionUpdates.push({
        table_id: tableId,
        position_x: positionX,
        position_y: positionY
      })
    })
    
    // Send position updates to server
    await apiRequest("/tables/positions", "PUT", { positions: positionUpdates })
    
    showNotification("Vị trí bàn đã được lưu thành công")
    tablePositionsChanged = false
  } catch (error) {
    console.error("Error saving table positions:", error)
    showNotification("Lỗi khi lưu vị trí bàn", "error")
  }
}

function resetFloorPlan() {
  if (confirm("Bạn có chắc chắn muốn đặt lại vị trí tất cả các bàn?")) {
    loadTables(tablesCurrentPage)
  }
}

function formatTableType(type) {
  switch (type) {
    case "round":
      return "Bàn tròn"
    case "rectangle":
      return "Bàn chữ nhật"
    case "square":
      return "Bàn vuông"
    case "booth":
      return "Bàn booth"
    case "large":
      return "Bàn lớn"
    default:
      return type || "N/A"
  }
}

function getTableStatusBadge(status) {
  let badgeClass = ""
  let statusText = ""
  let icon = ""
  
  switch (status) {
    case "available":
      badgeClass = "success"
      statusText = "Trống"
      icon = "check-circle"
      break
    case "occupied":
      badgeClass = "danger"
      statusText = "Đang sử dụng"
      icon = "utensils"
      break
    case "reserved":
      badgeClass = "primary"
      statusText = "Đã đặt"
      icon = "calendar-check"
      break
    case "maintenance":
      badgeClass = "warning"
      statusText = "Bảo trì"
      icon = "tools"
      break
    default:
      badgeClass = "secondary"
      statusText = status || "N/A"
      icon = "question-circle"
  }
  
  return `<span class="status-badge ${badgeClass}"><i class="fas fa-${icon}"></i> ${statusText}</span>`
}

async function loadStoresForFilter() {
  try {
    const response = await apiRequest("/stores")
    
    // Handle different response formats
    let stores = []
    
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        stores = response.data
      } else if (response.data.stores) {
        stores = response.data.stores
      }
    } else if (Array.isArray(response)) {
      stores = response
    }
    
    // Update store filter
    const storeFilter = document.getElementById("store-filter")
    const reservationStoreFilter = document.getElementById("reservation-store-filter")
    const tableStore = document.getElementById("table-store")
    const newReservationStore = document.getElementById("new-reservation-store")
    
    // Create options HTML
    let optionsHTML = '<option value="all">Tất cả cửa hàng</option>'
    
    if (stores && stores.length > 0) {
      stores.forEach((store) => {
        optionsHTML += `<option value="${store.store_id}">${store.name}</option>`
      })
    }
    
    // Update all store selects
    storeFilter.innerHTML = optionsHTML
    if (reservationStoreFilter) reservationStoreFilter.innerHTML = optionsHTML
    
    // For form selects, remove the "All stores" option
    let formOptionsHTML = ''
    if (stores && stores.length > 0) {
      stores.forEach((store) => {
        formOptionsHTML += `<option value="${store.store_id}">${store.name}</option>`
      })
    }
    
    if (tableStore) tableStore.innerHTML = formOptionsHTML
    if (newReservationStore) newReservationStore.innerHTML = formOptionsHTML
  } catch (error) {
    console.error("Error loading stores for filter:", error)
  }
}

function showTablesListView() {
  document.getElementById("list-view-btn").classList.add("active")
  document.getElementById("grid-view-btn").classList.remove("active")
  document.getElementById("floor-plan-view-btn").classList.remove("active")
  document.getElementById("tables-list-view").style.display = "block"
  document.getElementById("tables-grid-view").style.display = "none"
  document.getElementById("floor-plan-view").style.display = "none"
}

function showTablesGridView() {
  document.getElementById("list-view-btn").classList.remove("active")
  document.getElementById("grid-view-btn").classList.add("active")
  document.getElementById("floor-plan-view-btn").classList.remove("active")
  document.getElementById("tables-list-view").style.display = "none"
  document.getElementById("tables-grid-view").style.display = "block"
  document.getElementById("floor-plan-view").style.display = "none"
}

function showFloorPlanView() {
  document.getElementById("list-view-btn").classList.remove("active")
  document.getElementById("grid-view-btn").classList.remove("active")
  document.getElementById("floor-plan-view-btn").classList.add("active")
  document.getElementById("tables-list-view").style.display = "none"
  document.getElementById("tables-grid-view").style.display = "none"
  document.getElementById("floor-plan-view").style.display = "block"
  
  // Check if we need to reload the floor plan
  if (document.getElementById("floor-plan").children.length === 0) {
    updateFloorPlanView(allTables)
  }
}

function showTableForm() {
  document.getElementById("table-form-title").textContent = "Thêm Bàn Mới"
  document.getElementById("table-id").value = ""
  document.getElementById("table-form").reset()
  document.getElementById("table-form-container").style.display = "block"
}

function hideTableForm() {
  document.getElementById("table-form-container").style.display = "none"
}

function showBulkUpdateForm() {
  // Load stores into the bulk update form
  const storeSelect = document.getElementById("store-filter")
  const bulkUpdateStore = document.getElementById("bulk-update-store")
  
  // Copy options from store filter
  bulkUpdateStore.innerHTML = storeSelect.innerHTML
  
  // Show the form
  document.getElementById("bulk-update-form-container").style.display = "block"
}

function hideBulkUpdateForm() {
  document.getElementById("bulk-update-form-container").style.display = "none"
}

async function handleBulkUpdateSubmit(e) {
  e.preventDefault()
  
  const storeId = document.getElementById("bulk-update-store").value
  const currentStatus = document.getElementById("bulk-update-status").value
  const newStatus = document.getElementById("bulk-update-new-status").value
  
  if (storeId === "all" && currentStatus === "all") {
    if (!confirm("Bạn đang cập nhật trạng thái cho TẤT CẢ các bàn. Bạn có chắc chắn muốn tiếp tục?")) {
      return
    }
  }
  
  try {
    await apiRequest("/tables/bulk-update", "PUT", {
      store_id: storeId === "all" ? null : storeId,
      current_status: currentStatus === "all" ? null : currentStatus,
      new_status: newStatus
    })
    
    showNotification("Cập nhật hàng loạt thành công")
    hideBulkUpdateForm()
    loadTables(tablesCurrentPage)
  } catch (error) {
    console.error("Error performing bulk update:", error)
    showNotification("Lỗi khi cập nhật hàng loạt", "error")
  }
}

async function editTable(id) {
  try {
    // Sử dụng đúng endpoint để lấy thông tin bàn theo ID
    const response = await apiRequest(`/tables/${id}`)
    
    let table = null
    if (response.success && response.data) {
      table = response.data
    } else if (response.table) {
      table = response.table
    } else {
      table = response
    }
    
    if (!table) {
      showNotification("Không tìm thấy thông tin bàn", "error")
      return
    }
    
    document.getElementById("table-form-title").textContent = "Chỉnh Sửa Bàn"
    document.getElementById("table-id").value = table.table_id
    document.getElementById("table-number").value = table.table_number
    document.getElementById("table-store").value = table.store_id
    document.getElementById("table-type").value = table.table_type || "round"
    document.getElementById("table-seats").value = table.seats || 4
    document.getElementById("table-status").value = table.status || "available"
    document.getElementById("table-location").value = table.location || ""
    document.getElementById("table-position-x").value = table.position_x || ""
    document.getElementById("table-position-y").value = table.position_y || ""
    document.getElementById("table-notes").value = table.notes || ""
    
    document.getElementById("table-form-container").style.display = "block"
  } catch (error) {
    console.error("Error loading table details:", error)
    showNotification("Lỗi khi tải thông tin bàn", "error")
  }
}

async function handleTableSubmit(e) {
  e.preventDefault()
  
  const tableId = document.getElementById("table-id").value
  const isNewTable = !tableId
  
  const tableData = {
    table_number: document.getElementById("table-number").value,
    store_id: document.getElementById("table-store").value,
    table_type: document.getElementById("table-type").value,
    seats: document.getElementById("table-seats").value,
    status: document.getElementById("table-status").value,
    location: document.getElementById("table-location").value,
    position_x: document.getElementById("table-position-x").value || null,
    position_y: document.getElementById("table-position-y").value || null,
    notes: document.getElementById("table-notes").value
  }
  
  try {
    // Xử lý tạo mới bàn
    if (isNewTable) {
      // Endpoint để tạo bàn mới - sử dụng /tables theo như trong tableRoutes.js
      await apiRequest("/tables", "POST", tableData)
      showNotification("Thêm bàn mới thành công")
    } else {
      // Cập nhật thông tin bàn - sử dụng /tables/:id theo như trong tableRoutes.js
      await apiRequest(`/tables/${tableId}`, "PUT", tableData)
      showNotification("Cập nhật thông tin bàn thành công")
    }
    
    hideTableForm()
    loadTables(tablesCurrentPage)
  } catch (error) {
    console.error("Error saving table:", error)
    showNotification("Lỗi khi lưu thông tin bàn", "error")
  }
}

async function deleteTable(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa bàn này không?")) {
    return
  }
  
  try {
    await apiRequest(`/tables/${id}`, "DELETE")
    showNotification("Xóa bàn thành công")
    loadTables(tablesCurrentPage)
  } catch (error) {
    console.error("Error deleting table:", error)
    showNotification("Lỗi khi xóa bàn", "error")
  }
}

async function changeTableStatus(id) {
  try {
    const response = await apiRequest(`/tables/${id}`)
    
    let table = null
    if (response.success && response.data) {
      table = response.data
    } else if (response.table) {
      table = response.table
    } else {
      table = response
    }
    
    if (!table) {
      showNotification("Không tìm thấy thông tin bàn", "error")
      return
    }
    
    // Create a modal for changing status
    const modal = document.createElement("div")
    modal.className = "modal"
    modal.style.display = "flex"
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Thay đổi trạng thái bàn</h3>
          <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
        </div>
        <div class="modal-body">
          <p>Bàn: <strong>${table.table_number}</strong> (${formatTableType(table.table_type)}, ${table.seats} chỗ)</p>
          <div class="form-group">
            <label for="new-status">Trạng thái mới:</label>
            <select id="new-status" class="form-control">
              <option value="available" ${table.status === "available" ? "selected" : ""}>Trống</option>
              <option value="occupied" ${table.status === "occupied" ? "selected" : ""}>Đang sử dụng</option>
              <option value="reserved" ${table.status === "reserved" ? "selected" : ""}>Đã đặt</option>
              <option value="maintenance" ${table.status === "maintenance" ? "selected" : ""}>Bảo trì</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-admin btn-danger" onclick="this.parentElement.parentElement.parentElement.remove()">Hủy</button>
          <button class="btn-admin" onclick="updateTableStatus(${id})">Cập nhật</button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error("Error loading table details:", error)
    showNotification("Lỗi khi tải thông tin bàn", "error")
  }
}

async function updateTableStatus(id) {
  const newStatus = document.getElementById("new-status").value
  
  try {
    await apiRequest(`/tables/${id}`, "PATCH", { status: newStatus })
    showNotification("Cập nhật trạng thái bàn thành công")
    
    // Close the modal
    document.querySelector(".modal").remove()
    
    // Reload tables
    loadTables(tablesCurrentPage)
  } catch (error) {
    console.error("Error updating table status:", error)
    showNotification("Lỗi khi cập nhật trạng thái bàn", "error")
  }
}


async function loadReservations(page = 1, search = "") {
  reservationsCurrentPage = page
  
  try {
    const storeId = document.getElementById("reservation-store-filter")?.value || "all"
    const status = document.getElementById("reservation-status-filter")?.value || "all"
    const date = document.getElementById("reservation-date-filter")?.value || ""
    
    let endpoint = `/reservations?page=${page}`
    if (storeId && storeId !== "all") {
      endpoint += `&store_id=${storeId}`
    }
    if (status && status !== "all") {
      endpoint += `&status=${status}`
    }
    if (date) {
      endpoint += `&date=${date}`
    }
    if (search) {
      endpoint += `&search=${search}`
    }
    
    const response = await apiRequest(endpoint)
    
    // Handle different response formats
    let reservations = []
    let totalPages = 1
    
    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        reservations = response.data
      } else if (response.data.reservations) {
        reservations = response.data.reservations
        totalPages = response.data.total_pages || 1
      }
    } else if (Array.isArray(response)) {
      reservations = response
    }
    
    reservationsTotalPages = totalPages
    
    const reservationsBody = document.getElementById("reservations-body")
    reservationsBody.innerHTML = ""

    if (reservations && reservations.length > 0) {
      reservations.forEach((reservation) => {
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${reservation.reservation_id}</td>
                  <td>${reservation.full_name || 'Không có tên'}</td>
                  <td>${reservation.phone || 'N/A'}</td>
                  <td>${formatShortDate(reservation.reservation_date)}</td>
                  <td>${reservation.reservation_time || 'N/A'}</td>
                  <td>${reservation.guests || 0}</td>
                  <td>${getReservationStatusBadge(reservation.status)}</td>
                  <td>
                      <button class="btn-admin" onclick="editReservation(${reservation.reservation_id})">Chi tiết</button>
                  </td>
              `
        reservationsBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="8" class="text-center">Không có đặt bàn nào</td>`
      reservationsBody.appendChild(row)
    }

    createPagination("reservations-pagination", reservationsCurrentPage, reservationsTotalPages, loadReservations)
  } catch (error) {
    console.error("Error loading reservations:", error)
    showNotification("Lỗi khi tải danh sách đặt bàn", "error")
  }
}

function formatShortDate(dateString) {
  if (!dateString) return "N/A"
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  } catch (error) {
    return dateString
  }
}

function getReservationStatusBadge(status) {
  let badgeClass = ""
  let statusText = ""
  
  switch (status) {
    case "pending":
      badgeClass = "warning"
      statusText = "Chờ xác nhận"
      break
    case "confirmed":
      badgeClass = "primary"
      statusText = "Đã xác nhận"
      break
    case "completed":
      badgeClass = "success"
      statusText = "Hoàn thành"
      break
    case "cancelled":
      badgeClass = "danger"
      statusText = "Đã hủy"
      break
    case "no_show":
      badgeClass = "secondary"
      statusText = "Không đến"
      break
    default:
      badgeClass = "secondary"
      statusText = status || "N/A"
  }
  
  return `<span class="status-badge ${badgeClass}">${statusText}</span>`
}

async function editReservation(id) {
  if (!id) {
    showNotification("ID đặt bàn không hợp lệ", "error")
    return
  }
  
  try {
    const response = await apiRequest(`/reservations/${id}`)
    const reservation = response.success && response.data ? response.data : response
    
    if (!reservation) {
      showNotification("Không tìm thấy đặt bàn", "error")
      return
    }

    // Fill in reservation details
    document.getElementById("detail-reservation-id").textContent = reservation.reservation_id
    document.getElementById("detail-customer-name").textContent = reservation.full_name || 'N/A'
    document.getElementById("detail-customer-phone").textContent = reservation.phone || 'N/A'
    document.getElementById("detail-customer-email").textContent = reservation.email || 'N/A'
    document.getElementById("detail-reservation-date").textContent = formatShortDate(reservation.reservation_date)
    document.getElementById("detail-reservation-time").textContent = reservation.reservation_time || 'N/A'
    document.getElementById("detail-guests").textContent = reservation.guests || '0'
    document.getElementById("detail-table").textContent = reservation.table_number ? `Bàn ${reservation.table_number}` : 'N/A'
    document.getElementById("detail-store").textContent = reservation.store_name || 'N/A'
    document.getElementById("detail-status").innerHTML = getReservationStatusBadge(reservation.status)
    document.getElementById("detail-notes").textContent = reservation.notes || 'Không có ghi chú'
    
    // Fill in form for updating
    document.getElementById("reservation-id").value = reservation.reservation_id
    document.getElementById("reservation-status").value = reservation.status || 'pending'
    document.getElementById("reservation-note").value = reservation.notes || ''

    document.getElementById("reservation-detail-container").style.display = "block"
  } catch (error) {
    console.error("Error loading reservation details:", error)
    showNotification("Lỗi khi tải thông tin đặt bàn", "error")
  }
}

function hideReservationDetail() {
  document.getElementById("reservation-detail-container").style.display = "none"
}

async function handleReservationSubmit(e) {
  e.preventDefault()

  const reservationId = document.getElementById("reservation-id").value
  const reservationData = {
    status: document.getElementById("reservation-status").value,
    notes: document.getElementById("reservation-note").value,
  }

  try {
    await apiRequest(`/reservations/${reservationId}`, "PUT", reservationData)
    showNotification("Cập nhật thông tin đặt bàn thành công")
    hideReservationDetail()
    loadReservations(reservationsCurrentPage)
  } catch (error) {
    console.error("Error updating reservation:", error)
    showNotification("Không thể cập nhật thông tin đặt bàn. Vui lòng thử lại sau.", "error")
  }
}

function showAddReservationForm() {
  // Set default date to today
  const today = new Date().toISOString().split('T')[0]
  document.getElementById("new-reservation-date").value = today
  
  // Set default time to current hour + 1
  const now = new Date()
  now.setHours(now.getHours() + 1)
  now.setMinutes(0)
  const timeString = now.toTimeString().slice(0, 5)
  document.getElementById("new-reservation-time").value = timeString
  
  document.getElementById("add-reservation-form").reset()
  document.getElementById("add-reservation-container").style.display = "block"
}

function hideAddReservationForm() {
  document.getElementById("add-reservation-container").style.display = "none"
}

async function loadAvailableTables() {
  const storeId = document.getElementById("new-reservation-store").value
  const date = document.getElementById("new-reservation-date").value
  const time = document.getElementById("new-reservation-time").value
  const guests = document.getElementById("new-reservation-guests").value
  
  if (!storeId || !date || !time) {
    return
  }
  
  try {
    // Sử dụng endpoint chính xác từ routes
    const endpoint = `/tables/available?store_id=${storeId}&date=${date}&time=${time}&guests=${guests}`
    const response = await apiRequest(endpoint)
    
    let availableTables = []
    
    if (response.success && response.data) {
      availableTables = response.data
    } else if (Array.isArray(response)) {
      availableTables = response
    }
    
    const tableSelect = document.getElementById("new-reservation-table")
    tableSelect.innerHTML = '<option value="">-- Chọn bàn --</option>'
    
    if (availableTables && availableTables.length > 0) {
      availableTables.forEach((table) => {
        tableSelect.innerHTML += `<option value="${table.table_id}">Bàn ${table.table_number} (${table.seats} chỗ)</option>`
      })
    } else {
      tableSelect.innerHTML += '<option value="" disabled>Không có bàn trống</option>'
    }
  } catch (error) {
    console.error("Error loading available tables:", error)
  }
}

async function handleAddReservationSubmit(e) {
  e.preventDefault()
  
  const reservationData = {
    full_name: document.getElementById("new-customer-name").value,
    phone: document.getElementById("new-customer-phone").value,
    email: document.getElementById("new-customer-email").value,
    reservation_date: document.getElementById("new-reservation-date").value,
    reservation_time: document.getElementById("new-reservation-time").value,
    guests: document.getElementById("new-reservation-guests").value,
    store_id: document.getElementById("new-reservation-store").value,
    table_id: document.getElementById("new-reservation-table").value,
    notes: document.getElementById("new-reservation-notes").value,
    status: "confirmed" // Default to confirmed for admin-created reservations
  }
  
  try {
    await apiRequest("/reservations", "POST", reservationData)
    showNotification("Thêm đặt bàn mới thành công")
    hideAddReservationForm()
    loadReservations(1)
  } catch (error) {
    console.error("Error creating reservation:", error)
    showNotification("Lỗi khi tạo đặt bàn mới", "error")
  }
}

// Coupons Functions
async function loadCoupons() {
  try {
    console.log("Calling loadCoupons")
    const response = await apiRequest("/coupons")
    console.log("Coupons response:", response)
    
    // Handle different response formats
    let coupons = []
    
    if (Array.isArray(response)) {
      // Direct array of coupons
      coupons = response
    } else if (response.coupons) {
      // Object with coupons property
      coupons = response.coupons
    } else if (response.data && Array.isArray(response.data)) {
      // Object with data property containing array
      coupons = response.data
    } else if (response.success && response.data) {
      // Success response with data property
      coupons = Array.isArray(response.data) ? response.data : (response.data.coupons || [])
    }
    
    console.log("Final coupons data:", coupons)

    const couponsBody = document.getElementById("coupons-body")
    couponsBody.innerHTML = ""

    coupons.forEach((coupon) => {
      // Extract coupon data with fallbacks
      const couponId = coupon.coupon_id || coupon.id || '';
      const code = coupon.code || '';
      const discountPercent = (coupon.discount_percent || coupon.discountPercent || 0) + '%';
      
      // Handle dates
      let startDate = 'N/A';
      let endDate = 'N/A';
      
      if (coupon.start_date || coupon.startDate) {
        try {
          startDate = formatShortDate(coupon.start_date || coupon.startDate);
        } catch (e) {
          console.error("Error formatting start date:", e);
        }
      }
      
      if (coupon.end_date || coupon.endDate) {
        try {
          endDate = formatShortDate(coupon.end_date || coupon.endDate);
        } catch (e) {
          console.error("Error formatting end date:", e);
        }
      }
      
      // Handle usage counts
      const usedCount = coupon.used_count || coupon.usedCount || 0;
      const maxUses = coupon.max_uses || coupon.maxUses || 0;
      
      // Determine if coupon is active
      let isActive = false;
      try {
        const endDateObj = new Date(coupon.end_date || coupon.endDate);
        isActive = !isNaN(endDateObj.getTime()) && endDateObj >= new Date() && usedCount < maxUses;
      } catch (e) {
        console.error("Error checking coupon active status:", e);
      }

      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${couponId}</td>
                <td>${code}</td>
                <td>${discountPercent}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${usedCount} / ${maxUses}</td>
                <td>${isActive ? '<span style="color: green;">Đang hoạt động</span>' : '<span style="color: red;">Hết hạn</span>'}</td>
                <td>
                    <button class="btn-admin" onclick="editCoupon(${couponId})">Sửa</button>
                    <button class="btn-admin btn-danger" onclick="deleteCoupon(${couponId})">Xóa</button>
                </td>
            `
      couponsBody.appendChild(row)
    })
  } catch (error) {
    console.error("Error loading coupons:", error)
    showNotification("Lỗi khi tải danh sách mã giảm giá", "error")
  }
}

function showCouponForm() {
  document.getElementById("coupon-form-title").textContent = "Thêm Mã Giảm Giá Mới"
  document.getElementById("coupon-id").value = ""
  document.getElementById("coupon-form").reset()

  // Set default values
  document.getElementById("coupon-discount").value = 10
  document.getElementById("coupon-min-purchase").value = 0
  document.getElementById("coupon-max-uses").value = 100

  // Set default dates
  try {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const nextMonthStr = nextMonth.toISOString().split("T")[0]

    document.getElementById("coupon-start-date").value = todayStr
    document.getElementById("coupon-end-date").value = nextMonthStr
  } catch (e) {
    console.error("Error setting default dates:", e)
  }

  document.getElementById("coupon-form-container").style.display = "block"
}

function hideCouponForm() {
  document.getElementById("coupon-form-container").style.display = "none"
}

async function editCoupon(id) {
  if (!id) {
    showNotification("ID mã giảm giá không hợp lệ", "error")
    return
  }
  
  try {
    const response = await apiRequest(`/coupons/${id}`)
    console.log("Edit coupon response:", response)
    const coupon = response.success && response.data ? response.data : null
    
    if (!coupon) {
      showNotification("Không tìm thấy mã giảm giá", "error")
      return
    }

    console.log("Editing coupon:", coupon)

    document.getElementById("coupon-form-title").textContent = "Chỉnh Sửa Mã Giảm Giá"
    document.getElementById("coupon-id").value = coupon.coupon_id || coupon.id
    document.getElementById("coupon-code").value = coupon.code || ''
    document.getElementById("coupon-discount").value = coupon.discount_percent || coupon.discountPercent || 0
    
    // Handle start date
    let startDateValue = ''
    try {
      if (coupon.start_date || coupon.startDate) {
        const startDate = new Date(coupon.start_date || coupon.startDate)
        if (!isNaN(startDate.getTime())) {
          startDateValue = startDate.toISOString().split("T")[0]
        }
      }
    } catch (e) {
      console.error("Error formatting start date for form:", e)
    }
    document.getElementById("coupon-start-date").value = startDateValue
    
    // Handle end date
    let endDateValue = ''
    try {
      if (coupon.end_date || coupon.endDate) {
        const endDate = new Date(coupon.end_date || coupon.endDate)
        if (!isNaN(endDate.getTime())) {
          endDateValue = endDate.toISOString().split("T")[0]
        }
      }
    } catch (e) {
      console.error("Error formatting end date for form:", e)
    }
    document.getElementById("coupon-end-date").value = endDateValue
    
    document.getElementById("coupon-min-purchase").value = coupon.min_purchase || coupon.minPurchase || 0
    document.getElementById("coupon-max-uses").value = coupon.max_uses || coupon.maxUses || 0

    document.getElementById("coupon-form-container").style.display = "block"
  } catch (error) {
    console.error("Error loading coupon details:", error)
    showNotification("Lỗi khi tải thông tin mã giảm giá", "error")
  }
}

async function deleteCoupon(id) {
  if (confirm("Bạn có chắc chắn muốn xóa mã giảm giá này?")) {
    try {
      await apiRequest(`/coupons/${id}`, "DELETE")
      showNotification("Xóa mã giảm giá thành công")
      loadCoupons()
    } catch (error) {
      console.error("Error deleting coupon:", error)
      showNotification("Không thể xóa mã giảm giá. Vui lòng thử lại sau.", "error")
    }
  }
}

async function handleCouponSubmit(e) {
  e.preventDefault()

  const couponId = document.getElementById("coupon-id").value
  
  // Validate form data
  const code = document.getElementById("coupon-code").value.trim()
  if (!code) {
    showNotification("Vui lòng nhập mã giảm giá", "error")
    return
  }
  
  const discountPercent = parseInt(document.getElementById("coupon-discount").value) || 0
  if (discountPercent <= 0 || discountPercent > 100) {
    showNotification("Phần trăm giảm giá phải từ 1 đến 100", "error")
    return
  }
  
  const startDate = document.getElementById("coupon-start-date").value
  const endDate = document.getElementById("coupon-end-date").value
  
  if (!startDate || !endDate) {
    showNotification("Vui lòng nhập ngày bắt đầu và kết thúc", "error")
    return
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    showNotification("Ngày kết thúc phải sau ngày bắt đầu", "error")
    return
  }
  
  const minPurchase = parseInt(document.getElementById("coupon-min-purchase").value) || 0
  const maxUses = parseInt(document.getElementById("coupon-max-uses").value) || 0
  
  if (maxUses <= 0) {
    showNotification("Số lần sử dụng tối đa phải lớn hơn 0", "error")
    return
  }
  
  const couponData = {
    code: code,
    discount_percent: discountPercent,
    start_date: startDate,
    end_date: endDate,
    min_purchase: minPurchase,
    max_uses: maxUses,
  }
  
  console.log("Submitting coupon data:", couponData)

  try {
    if (couponId) {
      // Update existing coupon
      await apiRequest(`/coupons/${couponId}`, "PUT", couponData)
      showNotification("Cập nhật mã giảm giá thành công")
    } else {
      // Create new coupon
      await apiRequest("/coupons", "POST", couponData)
      showNotification("Thêm mã giảm giá mới thành công")
    }

    hideCouponForm()
    loadCoupons()
  } catch (error) {
    console.error("Error saving coupon:", error)
    showNotification("Không thể lưu mã giảm giá. Vui lòng thử lại sau.", "error")
  }
}

// Blogs Functions
let blogsCurrentPage = 1
let blogsTotalPages = 1
let blogCategories = []

// Blog Categories Management Functions
function showBlogCategoriesManager() {
  document.getElementById("blog-categories-container").style.display = "block"
  loadBlogCategoriesTable()
}

function hideBlogCategoriesManager() {
  document.getElementById("blog-categories-container").style.display = "none"
}

function showBlogCategoryForm() {
  document.getElementById("blog-category-form-title").textContent = "Thêm Danh Mục Mới"
  document.getElementById("blog-category-id").value = ""
  document.getElementById("blog-category-form").reset()
  document.getElementById("blog-category-form-container").style.display = "block"
}

function hideBlogCategoryForm() {
  document.getElementById("blog-category-form-container").style.display = "none"
}

// Generate slug from category name
function generateBlogCategorySlug(name) {
  return name
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Update slug when category name changes
function updateBlogCategorySlug() {
  const nameInput = document.getElementById("blog-category-name")
  const slugInput = document.getElementById("blog-category-slug")
  
  if (nameInput && slugInput && !slugInput.value.trim()) {
    slugInput.value = generateBlogCategorySlug(nameInput.value)
  }
}

// Load blog categories for the table
async function loadBlogCategoriesTable() {
  try {
    await loadBlogCategories()
    
    const categoriesBody = document.getElementById("blog-categories-body")
    categoriesBody.innerHTML = ""
    
    if (blogCategories.length > 0) {
      blogCategories.forEach(category => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${category.category_id}</td>
          <td>${category.name}</td>
          <td>${category.slug}</td>
          <td>
            <button class="btn-admin" onclick="editBlogCategory(${category.category_id})">Sửa</button>
            <button class="btn-admin btn-danger" onclick="deleteBlogCategory(${category.category_id})">Xóa</button>
          </td>
        `
        categoriesBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="4" class="text-center">Không có danh mục nào</td>`
      categoriesBody.appendChild(row)
    }
  } catch (error) {
    console.error("Error loading blog categories table:", error)
    showNotification("Lỗi khi tải bảng danh mục bài viết", "error")
  }
}

// Edit blog category
async function editBlogCategory(id) {
  try {
    const category = blogCategories.find(c => c.category_id == id)
    
    if (!category) {
      showNotification("Không tìm thấy danh mục", "error")
      return
    }
    
    document.getElementById("blog-category-form-title").textContent = "Chỉnh Sửa Danh Mục"
    document.getElementById("blog-category-id").value = category.category_id
    document.getElementById("blog-category-name").value = category.name
    document.getElementById("blog-category-slug").value = category.slug
    
    document.getElementById("blog-category-form-container").style.display = "block"
  } catch (error) {
    console.error("Error editing blog category:", error)
    showNotification("Lỗi khi chỉnh sửa danh mục", "error")
  }
}

// Delete blog category
async function deleteBlogCategory(id) {
  if (confirm("Bạn có chắc chắn muốn xóa danh mục này? Các bài viết thuộc danh mục này sẽ không còn danh mục.")) {
    try {
      await apiRequest(`/categories/blog/${id}`, "DELETE")
      showNotification("Xóa danh mục thành công")
      await loadBlogCategories()
      loadBlogCategoriesTable()
    } catch (error) {
      console.error("Error deleting blog category:", error)
      showNotification("Không thể xóa danh mục. Vui lòng thử lại sau.", "error")
      
      // Remove the category from the local array for demo purposes
      blogCategories = blogCategories.filter(category => category.category_id != id)
      loadBlogCategoriesTable()
    }
  }
}

// Handle blog category form submission
async function handleBlogCategorySubmit(e) {
  e.preventDefault()
  
  const categoryId = document.getElementById("blog-category-id").value
  const categoryName = document.getElementById("blog-category-name").value.trim()
  
  if (!categoryName) {
    showNotification("Vui lòng nhập tên danh mục", "error")
    return
  }
  
  // Generate slug if not provided
  let slug = document.getElementById("blog-category-slug").value.trim()
  if (!slug) {
    slug = generateBlogCategorySlug(categoryName)
  }
  
  const categoryData = {
    name: categoryName,
    slug: slug,
    type: 'blog' // Specify that this is a blog category
  }
  
  try {
    if (categoryId) {
      // Update existing category
      await apiRequest(`/categories/blog/${categoryId}`, "PUT", categoryData)
      showNotification("Cập nhật danh mục thành công")
    } else {
      // Create new category
      await apiRequest("/categories/blog", "POST", categoryData)
      showNotification("Thêm danh mục mới thành công")
    }
    
    hideBlogCategoryForm()
    await loadBlogCategories()
    loadBlogCategoriesTable()
  } catch (error) {
    console.error("Error saving blog category:", error)
    showNotification("Không thể lưu danh mục. Vui lòng thử lại sau.", "error")
    
    // For demo purposes, update the local array
    if (categoryId) {
      // Update existing category in the local array
      const index = blogCategories.findIndex(c => c.category_id == categoryId)
      if (index !== -1) {
        blogCategories[index] = {
          ...blogCategories[index],
          name: categoryName,
          slug: slug
        }
      }
    } else {
      // Add new category to the local array
      const newId = blogCategories.length > 0 
        ? Math.max(...blogCategories.map(c => parseInt(c.category_id))) + 1 
        : 1
      
      blogCategories.push({
        category_id: newId,
        name: categoryName,
        slug: slug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    hideBlogCategoryForm()
    loadBlogCategoriesTable()
  }
}

// Load blog categories for the dropdown
async function loadBlogCategories() {
  try {
    console.log("Loading blog categories")
    // Use the categories endpoint with a type parameter for blog categories
    const response = await apiRequest("/categories/blog")
    console.log("Blog categories response:", response)
    
    // Handle different response formats
    if (Array.isArray(response)) {
      blogCategories = response
    } else if (response.categories) {
      blogCategories = response.categories
    } else if (response.data && Array.isArray(response.data)) {
      blogCategories = response.data
    } else if (response.success && response.data) {
      blogCategories = Array.isArray(response.data) ? response.data : (response.data.categories || [])
    }
    
    // If no categories were found, use the sample data from the database
    if (!blogCategories || blogCategories.length === 0) {
      console.log("No blog categories found from API, using sample data")
      blogCategories = [
        { category_id: 1, name: 'Tin tức cửa hàng', slug: 'tin-tuc-cua-hang' },
        { category_id: 2, name: 'Mẹo hay', slug: 'meo-hay' },
        { category_id: 3, name: 'Ẩm thực Việt', slug: 'am-thuc-viet' },
        { category_id: 4, name: 'Khuyến mãi', slug: 'khuyen-mai' },
        { category_id: 5, name: 'Câu chuyện thương hiệu', slug: 'cau-chuyen-thuong-hieu' },
        { category_id: 6, name: 'Phong cách sống', slug: 'phong-cach-song' }
      ]
    }
    
    console.log("Final blog categories data:", blogCategories)
    
    // Populate the category dropdown
    const categorySelect = document.getElementById("blog-category")
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Chọn danh mục</option>'
      
      blogCategories.forEach(category => {
        const option = document.createElement("option")
        option.value = category.category_id
        option.textContent = category.name
        categorySelect.appendChild(option)
      })
    }
  } catch (error) {
    console.error("Error loading blog categories:", error)
    showNotification("Lỗi khi tải danh mục bài viết", "error")
    
    // Use sample data in case of error
    blogCategories = [
      { category_id: 1, name: 'Tin tức cửa hàng', slug: 'tin-tuc-cua-hang' },
      { category_id: 2, name: 'Mẹo hay', slug: 'meo-hay' },
      { category_id: 3, name: 'Ẩm thực Việt', slug: 'am-thuc-viet' },
      { category_id: 4, name: 'Khuyến mãi', slug: 'khuyen-mai' },
      { category_id: 5, name: 'Câu chuyện thương hiệu', slug: 'cau-chuyen-thuong-hieu' },
      { category_id: 6, name: 'Phong cách sống', slug: 'phong-cach-song' }
    ]
    
    // Populate the category dropdown with sample data
    const categorySelect = document.getElementById("blog-category")
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Chọn danh mục</option>'
      
      blogCategories.forEach(category => {
        const option = document.createElement("option")
        option.value = category.category_id
        option.textContent = category.name
        categorySelect.appendChild(option)
      })
    }
  }
}

async function loadBlogs(page = 1, search = "") {
  try {
    let url = `/blogs?page=${page}&limit=10`
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    
    console.log("Calling loadBlogs with URL:", url)
    const response = await apiRequest(url)
    console.log("Blogs response:", response)
    
    // Handle different response formats
    let blogs = []
    let total = 0
    
    if (Array.isArray(response)) {
      // Direct array of blogs
      blogs = response
      total = response.length
    } else if (response.blogs) {
      // Object with blogs property
      blogs = response.blogs
      total = response.total || blogs.length
    } else if (response.data && Array.isArray(response.data)) {
      // Object with data property containing array
      blogs = response.data
      total = response.total || blogs.length
    } else if (response.success && response.data) {
      // Success response with data property
      blogs = Array.isArray(response.data) ? response.data : (response.data.blogs || [])
      total = response.total || response.data.total || blogs.length
    }
    
    console.log("Final blogs data:", blogs)
    blogsCurrentPage = page
    blogsTotalPages = Math.ceil(total / 10)

    const blogsBody = document.getElementById("blogs-body")
    blogsBody.innerHTML = ""

    if (blogs && blogs.length > 0) {
      blogs.forEach((blog) => {
        // Find category name if available
        let categoryName = "Không có danh mục"
        if (blog.category_id && blogCategories.length > 0) {
          const category = blogCategories.find(c => c.category_id == blog.category_id)
          if (category) {
            categoryName = category.name
          }
        }
        
        const row = document.createElement("tr")
        row.innerHTML = `
                  <td>${blog.post_id}</td>
                  <td>
                    ${blog.img_url ? 
                      `<img src="${blog.img_url}" alt="${blog.title}" class="blog-thumbnail">` : 
                      '<div class="no-image">Không có ảnh</div>'}
                  </td>
                  <td>${blog.title}</td>
                  <td>${categoryName}</td>
                  <td>${blog.is_published ? '<span class="status-badge published">Đã đăng</span>' : '<span class="status-badge draft">Bản nháp</span>'}</td>
                  <td>${formatDate(blog.published_at || blog.created_at)}</td>
                  <td>${blog.author_id ? blog.author_name || "Admin" : "Admin"}</td>
                  <td>
                      <button class="btn-admin" onclick="editBlog(${blog.post_id})">Sửa</button>
                      <button class="btn-admin btn-danger" onclick="deleteBlog(${blog.post_id})">Xóa</button>
                  </td>
              `
        blogsBody.appendChild(row)
      })
    } else {
      const row = document.createElement("tr")
      row.innerHTML = `<td colspan="7" class="text-center">Không có bài viết nào</td>`
      blogsBody.appendChild(row)
    }

    createPagination("blogs-pagination", blogsCurrentPage, blogsTotalPages, loadBlogs)
  } catch (error) {
    console.error("Error loading blogs:", error)
    showNotification("Lỗi khi tải danh sách bài viết", "error")
  }
}

function showBlogForm() {
  document.getElementById("blog-form-title").textContent = "Thêm Bài Viết Mới"
  document.getElementById("blog-id").value = ""
  document.getElementById("blog-form").reset()
  
  // Make sure we have categories loaded
  if (blogCategories.length === 0) {
    loadBlogCategories()
  }
  
  // Set default values
  document.getElementById("blog-is-published").checked = false
  
  document.getElementById("blog-form-container").style.display = "block"
}

function hideBlogForm() {
  document.getElementById("blog-form-container").style.display = "none"
}

// Generate slug from title
function generateBlogSlug(title) {
  return title
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Update post URL when title changes
function updateBlogPostUrl() {
  const titleInput = document.getElementById("blog-title")
  const postUrlInput = document.getElementById("blog-post-url")
  const slugInput = document.getElementById("blog-slug")
  
  if (titleInput && postUrlInput) {
    const slug = generateBlogSlug(titleInput.value)
    slugInput.value = slug
    postUrlInput.value = `/blog/${slug}`
  }
}

// Update image preview when image URL changes
function updateBlogImagePreview() {
  const imageUrlInput = document.getElementById("blog-image")
  const imagePreviewContainer = document.getElementById("blog-image-preview")
  
  if (imageUrlInput && imagePreviewContainer) {
    const imageUrl = imageUrlInput.value.trim()
    
    if (imageUrl) {
      // Clear previous preview
      imagePreviewContainer.innerHTML = ''
      
      // Create new image preview
      const img = document.createElement('img')
      img.src = imageUrl
      img.alt = 'Xem trước hình ảnh'
      img.className = 'image-preview'
      
      // Handle image load error
      img.onerror = function() {
        imagePreviewContainer.innerHTML = '<div class="no-image">URL hình ảnh không hợp lệ</div>'
      }
      
      imagePreviewContainer.appendChild(img)
    } else {
      // No image URL provided
      imagePreviewContainer.innerHTML = ''
    }
  }
}

async function editBlog(id) {
  if (!id) {
    showNotification("ID bài viết không hợp lệ", "error")
    return
  }
  
  // Make sure we have categories loaded
  if (blogCategories.length === 0) {
    await loadBlogCategories()
  }
  
  try {
    const response = await apiRequest(`/blogs/${id}`)
    const blog = response.success && response.data ? response.data : response
    
    if (!blog) {
      showNotification("Không tìm thấy bài viết", "error")
      return
    }

    document.getElementById("blog-form-title").textContent = "Chỉnh Sửa Bài Viết"
    document.getElementById("blog-id").value = blog.post_id
    document.getElementById("blog-title").value = blog.title || ""
    document.getElementById("blog-content").value = blog.content || ""
    document.getElementById("blog-image").value = blog.img_url || ""
    document.getElementById("blog-post-url").value = blog.post_url || ""
    document.getElementById("blog-slug").value = blog.slug || ""
    
    // Update image preview if there's an image URL
    if (blog.img_url) {
      updateBlogImagePreview()
    }
    
    // Set category if available
    if (blog.category_id) {
      document.getElementById("blog-category").value = blog.category_id
    }
    
    // Set published status
    document.getElementById("blog-is-published").checked = blog.is_published === 1 || blog.is_published === true
    
    // Set published date if available
    if (blog.published_at) {
      const publishDate = new Date(blog.published_at)
      const formattedDate = publishDate.toISOString().split('T')[0]
      document.getElementById("blog-published-at").value = formattedDate
    }

    document.getElementById("blog-form-container").style.display = "block"
  } catch (error) {
    console.error("Error loading blog details:", error)
    showNotification("Lỗi khi tải thông tin bài viết", "error")
  }
}

async function deleteBlog(id) {
  if (confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
    try {
      await apiRequest(`/blogs/${id}`, "DELETE")
      showNotification("Xóa bài viết thành công")
      loadBlogs(blogsCurrentPage)
    } catch (error) {
      console.error("Error deleting blog:", error)
      showNotification("Không thể xóa bài viết. Vui lòng thử lại sau.", "error")
    }
  }
}

async function handleBlogSubmit(e) {
  e.preventDefault()

  const blogId = document.getElementById("blog-id").value
  const title = document.getElementById("blog-title").value.trim()
  
  if (!title) {
    showNotification("Vui lòng nhập tiêu đề bài viết", "error")
    return
  }
  
  // Generate slug if not provided
  let slug = document.getElementById("blog-slug").value.trim()
  if (!slug) {
    slug = generateBlogSlug(title)
  }
  
  // Generate post URL if not provided
  let postUrl = document.getElementById("blog-post-url").value.trim()
  if (!postUrl) {
    postUrl = `/blog/${slug}`
  }
  
  const isPublished = document.getElementById("blog-is-published").checked
  let publishedAt = document.getElementById("blog-published-at").value
  
  // If published but no date set, use current date
  if (isPublished && !publishedAt) {
    publishedAt = new Date().toISOString().split('T')[0]
  }
  
  const blogData = {
    title: title,
    slug: slug,
    post_url: postUrl,
    content: document.getElementById("blog-content").value,
    img_url: document.getElementById("blog-image").value,
    category_id: document.getElementById("blog-category").value || null,
    is_published: isPublished,
    published_at: publishedAt || null
  }

  try {
    if (blogId) {
      // Update existing blog
      await apiRequest(`/blogs/${blogId}`, "PUT", blogData)
      showNotification("Cập nhật bài viết thành công")
    } else {
      // Create new blog
      await apiRequest("/blogs", "POST", blogData)
      showNotification("Thêm bài viết mới thành công")
    }

    hideBlogForm()
    loadBlogs(blogsCurrentPage)
  } catch (error) {
    console.error("Error saving blog:", error)
    showNotification("Không thể lưu bài viết. Vui lòng thử lại sau.", "error")
  }
}

// Stores Functions
async function loadStores() {
  try {
    console.log("Calling loadStores")
    const response = await apiRequest("/stores")
    console.log("Stores response:", response)
    
    // Handle different response formats
    let stores = []
    
    if (Array.isArray(response)) {
      // Direct array of stores
      stores = response
    } else if (response.stores) {
      // Object with stores property
      stores = response.stores
    } else if (response.data && Array.isArray(response.data)) {
      // Object with data property containing array
      stores = response.data
    } else if (response.success && response.data) {
      // Success response with data property
      stores = Array.isArray(response.data) ? response.data : (response.data.stores || [])
    }
    
    console.log("Final stores data:", stores)

    const storesBody = document.getElementById("stores-body")
    storesBody.innerHTML = ""

    stores.forEach((store) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${store.store_id}</td>
                <td>${store.name}</td>
                <td>${store.address}</td>
                <td>${store.phone}</td>
                <td>${store.open_time || store.openTime || 'N/A'} - ${store.close_time || store.closeTime || 'N/A'}</td>
                <td>
                    <button class="btn-admin" onclick="editStore(${store.store_id})">Sửa</button>
                    <button class="btn-admin btn-danger" onclick="deleteStore(${store.store_id})">Xóa</button>
                </td>
            `
      storesBody.appendChild(row)
    })
  } catch (error) {
    console.error("Error loading stores:", error)
    showNotification("Lỗi khi tải danh sách cửa hàng", "error")
  }
}

function showStoreForm() {
  document.getElementById("store-form-title").textContent = "Thêm Cửa Hàng Mới"
  document.getElementById("store-id").value = ""
  document.getElementById("store-form").reset()
  document.getElementById("store-form-container").style.display = "block"
}

function hideStoreForm() {
  document.getElementById("store-form-container").style.display = "none"
}

async function editStore(id) {
  if (!id) {
    showNotification("ID cửa hàng không hợp lệ", "error")
    return
  }
  
  try {
    const response = await apiRequest(`/stores/${id}`)
    const store = response.success && response.data ? response.data : null
    
    if (!store) {
      showNotification("Không tìm thấy cửa hàng", "error")
      return
    }

    document.getElementById("store-form-title").textContent = "Chỉnh Sửa Cửa Hàng"
    document.getElementById("store-id").value = store.store_id
    document.getElementById("store-name").value = store.name
    document.getElementById("store-address").value = store.address
    document.getElementById("store-phone").value = store.phone
    document.getElementById("store-email").value = store.email || ""
    document.getElementById("store-open-time").value = store.open_time || store.openTime
    document.getElementById("store-close-time").value = store.close_time || store.closeTime
    document.getElementById("store-description").value = store.description || ""
    document.getElementById("store-image").value = store.image || ""

    document.getElementById("store-form-container").style.display = "block"
  } catch (error) {
    console.error("Error loading store details:", error)
    showNotification("Lỗi khi tải thông tin cửa hàng", "error")
  }
}

async function deleteStore(id) {
  if (confirm("Bạn có chắc chắn muốn xóa cửa hàng này?")) {
    try {
      await apiRequest(`/stores/${id}`, "DELETE")
      showNotification("Xóa cửa hàng thành công")
      loadStores()
    } catch (error) {
      console.error("Error deleting store:", error)
      showNotification("Không thể xóa cửa hàng. Vui lòng thử lại sau.", "error")
    }
  }
}

async function handleStoreSubmit(e) {
  e.preventDefault()

  const storeId = document.getElementById("store-id").value
  const storeData = {
    name: document.getElementById("store-name").value,
    address: document.getElementById("store-address").value,
    phone: document.getElementById("store-phone").value,
    email: document.getElementById("store-email").value,
    openTime: document.getElementById("store-open-time").value,
    closeTime: document.getElementById("store-close-time").value,
    description: document.getElementById("store-description").value,
    image: document.getElementById("store-image").value,
  }

  try {
    if (storeId) {
      // Update existing store
      await apiRequest(`/stores/${storeId}`, "PUT", storeData)
      showNotification("Cập nhật cửa hàng thành công")
    } else {
      // Create new store
      await apiRequest("/stores", "POST", storeData)
      showNotification("Thêm cửa hàng mới thành công")
    }

    hideStoreForm()
    loadStores()
  } catch (error) {
    console.error("Error saving store:", error)
    showNotification("Không thể lưu cửa hàng. Vui lòng thử lại sau.", "error")
  }
}

// Global functions for event handlers
// Reservation detail function
async function viewReservationDetail(id) {
  try {
    const reservation = await apiRequest(`/reservations/${id}`)

    document.getElementById("reservation-detail-id").textContent = reservation.id
    document.getElementById("reservation-status").value = reservation.status
    document.getElementById("reservation-note").value = reservation.note || ""

    document.getElementById("reservation-detail-container").style.display = "block"
  } catch (error) {
    console.error("Error loading reservation details:", error)
    showNotification("Lỗi khi tải chi tiết đặt bàn", "error")
  }
}

// Blog Functions are now in blog-management.js

// Make functions available to the window object for onclick handlers
window.viewOrderDetail = viewOrderDetail
window.viewReservationDetail = viewReservationDetail
window.editProduct = editProduct
window.deleteProduct = deleteProduct
window.editCategory = editCategory
window.deleteCategory = deleteCategory
window.editUser = editUser
window.deleteUser = deleteUser
window.editReservation = editReservation
// Coupon Management
let currentCouponPage = 1
let totalCouponPages = 1
let coupons = []

// Load coupons
async function loadCoupons(page = 1, filters = {}) {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      showLoginSection()
      return
    }
    
    // Build query string
    let queryParams = `?page=${page}&limit=${COUPONS_PER_PAGE}`
    
    if (filters.search) {
      queryParams += `&search=${encodeURIComponent(filters.search)}`
    }
    
    if (filters.status && filters.status !== 'all') {
      queryParams += `&status=${filters.status}`
    }
    
    const response = await fetch(`${API_BASE_URL}/coupons${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to load coupons')
    }
    
    const data = await response.json()
    
    // Handle different API response formats
    if (data.success === false) {
      throw new Error(data.message || 'Failed to load coupons')
    }
    
    // Check if the API returns data in the expected format
    if (data.data) {
      // Standard format with data and count properties
      coupons = data.data
      totalCouponPages = Math.ceil(data.count / COUPONS_PER_PAGE)
    } else if (Array.isArray(data)) {
      // Direct array of coupons
      coupons = data
      totalCouponPages = Math.ceil(data.length / COUPONS_PER_PAGE)
    } else if (data.success && Array.isArray(data.data)) {
      // Success property with data array
      coupons = data.data
      totalCouponPages = Math.ceil(data.count || data.data.length / COUPONS_PER_PAGE)
    } else {
      console.error('Unexpected API response format:', data)
      coupons = []
      totalCouponPages = 1
    }
    
    currentCouponPage = page
    
    renderCoupons()
    renderCouponPagination()
  } catch (error) {
    console.error('Error loading coupons:', error)
    showNotification(error.message, 'error')
  }
}

// Render coupons
function renderCoupons() {
  const couponsBody = document.getElementById('coupons-body')
  
  if (!couponsBody) {
    console.error('Coupons table body not found')
    return
  }
  
  if (!coupons || coupons.length === 0) {
    couponsBody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center">Không có mã giảm giá nào</td>
      </tr>
    `
    return
  }
  
  couponsBody.innerHTML = coupons.map(coupon => {
    const now = new Date()
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null
    const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null
    
    let status = 'Đang hoạt động'
    let statusClass = 'status-active'
    
    if (!coupon.is_active) {
      status = 'Không hoạt động'
      statusClass = 'status-inactive'
    } else if (validTo && validTo < now) {
      status = 'Đã hết hạn'
      statusClass = 'status-expired'
    } else if (validFrom && validFrom > now) {
      status = 'Chưa bắt đầu'
      statusClass = 'status-pending'
    }
    
    const discountValue = coupon.discount_type === 'percent' 
      ? `${coupon.discount_value}%` 
      : formatCurrency(coupon.discount_value)
    
    // Format dates properly
    const formattedValidFrom = coupon.valid_from 
      ? new Date(coupon.valid_from).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : 'N/A'
    
    const formattedValidTo = coupon.valid_to 
      ? new Date(coupon.valid_to).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : 'N/A'
    
    // Format minimum order amount
    const minOrderAmount = coupon.min_order_amount 
      ? formatCurrency(coupon.min_order_amount)
      : '0 ₫'
    
    return `
      <tr>
        <td>${coupon.coupon_id}</td>
        <td><strong>${coupon.code}</strong></td>
        <td>${coupon.description || 'Không có mô tả'}</td>
        <td>${coupon.discount_type === 'percent' ? 'Phần trăm' : 'Cố định'}</td>
        <td>${discountValue}</td>
        <td>${minOrderAmount}</td>
        <td>${formattedValidFrom}</td>
        <td>${formattedValidTo}</td>
        <td>${coupon.used_count || 0}${coupon.usage_limit ? `/${coupon.usage_limit}` : ''}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
        <td>
          <div class="action-buttons">
            <button onclick="editCoupon(${coupon.coupon_id})" class="btn-icon btn-edit" title="Sửa">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteCoupon(${coupon.coupon_id})" class="btn-icon btn-delete" title="Xóa">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

// Render coupon pagination
function renderCouponPagination() {
  const paginationElement = document.getElementById('coupons-pagination')
  
  if (!paginationElement) {
    console.error('Coupons pagination element not found')
    return
  }
  
  if (totalCouponPages <= 1) {
    paginationElement.innerHTML = ''
    return
  }
  
  let paginationHTML = ''
  
  // Previous button
  paginationHTML += `
    <button class="pagination-btn ${currentCouponPage === 1 ? 'disabled' : ''}" 
      ${currentCouponPage === 1 ? 'disabled' : `onclick="loadCoupons(${currentCouponPage - 1})"`}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `
  
  // Page numbers
  for (let i = 1; i <= totalCouponPages; i++) {
    paginationHTML += `
      <button class="pagination-btn ${currentCouponPage === i ? 'active' : ''}" 
        onclick="loadCoupons(${i})">
        ${i}
      </button>
    `
  }
  
  // Next button
  paginationHTML += `
    <button class="pagination-btn ${currentCouponPage === totalCouponPages ? 'disabled' : ''}" 
      ${currentCouponPage === totalCouponPages ? 'disabled' : `onclick="loadCoupons(${currentCouponPage + 1})"`}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `
  
  paginationElement.innerHTML = paginationHTML
}

// Show coupon form
function showCouponForm(isEdit = false) {
  const formContainer = document.getElementById('coupon-form-container')
  const formTitle = document.getElementById('coupon-form-title')
  
  if (!formContainer || !formTitle) {
    console.error('Coupon form elements not found')
    return
  }
  
  formTitle.textContent = isEdit ? 'Cập Nhật Mã Giảm Giá' : 'Thêm Mã Giảm Giá Mới'
  formContainer.style.display = 'block'
  
  // Scroll to form
  formContainer.scrollIntoView({ behavior: 'smooth' })
}

// Hide coupon form
function hideCouponForm() {
  const formContainer = document.getElementById('coupon-form-container')
  
  if (!formContainer) {
    console.error('Coupon form container not found')
    return
  }
  
  formContainer.style.display = 'none'
  resetCouponForm()
}

// Reset coupon form
function resetCouponForm() {
  const form = document.getElementById('coupon-form')
  
  if (!form) {
    console.error('Coupon form not found')
    return
  }
  
  form.reset()
  document.getElementById('coupon-id').value = ''
}

// Edit coupon
async function editCoupon(couponId) {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      showLoginSection()
      return
    }
    
    const response = await fetch(`${API_BASE_URL}/coupons/${couponId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to get coupon details')
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get coupon details')
    }
    
    const coupon = data.data
    
    // Fill form with coupon data
    document.getElementById('coupon-id').value = coupon.coupon_id
    document.getElementById('coupon-code').value = coupon.code
    document.getElementById('coupon-description').value = coupon.description || ''
    document.getElementById('coupon-discount-type').value = coupon.discount_type
    document.getElementById('coupon-discount-value').value = coupon.discount_value
    document.getElementById('coupon-min-order').value = coupon.min_order_amount || 0
    document.getElementById('coupon-usage-limit').value = coupon.usage_limit || ''
    
    if (coupon.valid_from) {
      document.getElementById('coupon-valid-from').value = new Date(coupon.valid_from).toISOString().split('T')[0]
    }
    
    if (coupon.valid_to) {
      document.getElementById('coupon-valid-to').value = new Date(coupon.valid_to).toISOString().split('T')[0]
    }
    
    document.getElementById('coupon-is-active').checked = coupon.is_active
    
    showCouponForm(true)
  } catch (error) {
    console.error('Error editing coupon:', error)
    showNotification(error.message, 'error')
  }
}

// Delete coupon
async function deleteCoupon(couponId) {
  try {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
      return
    }
    
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      showLoginSection()
      return
    }
    
    const response = await fetch(`${API_BASE_URL}/coupons/${couponId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete coupon')
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete coupon')
    }
    
    showNotification('Xóa mã giảm giá thành công')
    loadCoupons(currentCouponPage)
  } catch (error) {
    console.error('Error deleting coupon:', error)
    showNotification(error.message, 'error')
  }
}

// Save coupon
async function saveCoupon(event) {
  event.preventDefault()
  
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      showLoginSection()
      return
    }
    
    const couponId = document.getElementById('coupon-id').value
    const isEdit = !!couponId
    
    const couponData = {
      code: document.getElementById('coupon-code').value,
      description: document.getElementById('coupon-description').value,
      discount_type: document.getElementById('coupon-discount-type').value,
      discount_value: parseFloat(document.getElementById('coupon-discount-value').value),
      min_order_amount: parseFloat(document.getElementById('coupon-min-order').value) || 0,
      usage_limit: document.getElementById('coupon-usage-limit').value ? parseInt(document.getElementById('coupon-usage-limit').value) : null,
      valid_from: document.getElementById('coupon-valid-from').value,
      valid_to: document.getElementById('coupon-valid-to').value,
      is_active: document.getElementById('coupon-is-active').checked
    }
    
    const url = isEdit 
      ? `${API_BASE_URL}/coupons/${couponId}` 
      : `${API_BASE_URL}/coupons`
    
    const method = isEdit ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(couponData)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to ${isEdit ? 'update' : 'create'} coupon`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} coupon`)
    }
    
    showNotification(`${isEdit ? 'Cập nhật' : 'Tạo'} mã giảm giá thành công`)
    hideCouponForm()
    loadCoupons(currentCouponPage)
  } catch (error) {
    console.error(`Error ${couponId ? 'updating' : 'creating'} coupon:`, error)
    showNotification(error.message, 'error')
  }
}

// No need for separate initialization functions as we've added the event listeners directly in the DOMContentLoaded event

// Hàm mới để xem chi tiết đơn hàng
async function viewOrderDetailNew(id) {
  if (!id) {
    showNotification("ID đơn hàng không hợp lệ", "error")
    return
  }
  
  try {
    // Gọi API để lấy thông tin đơn hàng
    const response = await apiRequest(`/orders/${id}`)
    let order = response.success && response.data ? response.data : null
    
    // Nếu không tìm thấy đơn hàng, hiển thị thông báo lỗi
    if (!order) {
      showNotification("Không tìm thấy đơn hàng", "error")
      return
    }

    console.log("Order data:", order)
    
    // Nếu đơn hàng có user_id, truy vấn thông tin người dùng từ API
    if (order.user_id && !order.user) {
      try {
        // Gọi API để lấy thông tin người dùng
        const userResponse = await apiRequest(`/users/${order.user_id}`)
        const userData = userResponse.success && userResponse.data ? userResponse.data : null
        
        if (userData) {
          // Sử dụng thông tin người dùng từ API
          order.user = userData
          console.log("User data:", userData)
        }
      } catch (userError) {
        console.error("Error loading user data:", userError)
      }
    }
    
    // Nếu đơn hàng có address_id, truy vấn thông tin địa chỉ từ API
    if (order.address_id && !order.address) {
      try {
        // Gọi API để lấy thông tin địa chỉ
        const addressResponse = await apiRequest(`/addresses/${order.address_id}`)
        const addressData = addressResponse.success && addressResponse.data ? addressResponse.data : null
        
        if (addressData) {
          // Sử dụng thông tin địa chỉ từ API
          order.address = addressData
          console.log("Address data:", addressData)
        }
      } catch (addressError) {
        console.error("Error loading address data:", addressError)
      }
    }
    
    // Hiển thị thông tin đơn hàng
    displayOrderDetail(order)
  } catch (error) {
    console.error("Error loading order details:", error)
    showNotification("Lỗi khi tải chi tiết đơn hàng", "error")
    
    // Hiển thị dữ liệu mẫu nếu API lỗi
    try {
      displaySampleOrderDetail(id)
    } catch (e) {
      console.error("Error displaying sample order detail:", e)
    }
  }
}

// Ghi đè hàm cũ bằng hàm mới
document.addEventListener("DOMContentLoaded", function() {
  // Tìm tất cả các nút "Chi tiết" trong bảng đơn hàng
  const orderDetailButtons = document.querySelectorAll(".btn-admin[onclick^='viewOrderDetail']")
  
  // Thay đổi onclick handler của các nút này
  orderDetailButtons.forEach(button => {
    const originalOnclick = button.getAttribute("onclick")
    if (originalOnclick) {
      const orderId = originalOnclick.match(/viewOrderDetail\((\d+)\)/)[1]
      button.setAttribute("onclick", `viewOrderDetailNew(${orderId})`)
    }
  })
  
  // Ghi đè hàm cũ bằng hàm mới
  window.viewOrderDetail = viewOrderDetailNew
});

window.editCoupon = editCoupon
window.deleteCoupon = deleteCoupon
// Blog functions are now in blog-management.js
// Store Management
let stores = []

// Load stores
async function loadStores() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      showLoginSection()
      return
    }
    
    const response = await fetch(`${API_BASE_URL}/stores`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to load stores')
    }
    
    const data = await response.json()
    
    // Handle different API response formats
    if (data.success === false) {
      throw new Error(data.message || 'Failed to load stores')
    }
    
    // Check if the API returns data in the expected format
    if (data.data) {
      // Standard format with data property
      stores = data.data
    } else if (Array.isArray(data)) {
      // Direct array of stores
      stores = data
    } else if (data.success && Array.isArray(data.data)) {
      // Success property with data array
      stores = data.data
    } else {
      console.error('Unexpected API response format:', data)
      stores = []
    }
    
    renderStores()
  } catch (error) {
    console.error('Error loading stores:', error)
    showNotification(error.message, 'error')
  }
}

// Render stores
function renderStores() {
  const storesBody = document.getElementById('stores-body')
  
  if (!storesBody) {
    console.error('Stores table body not found')
    return
  }
  
  if (!stores || stores.length === 0) {
    storesBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">Không có cửa hàng nào</td>
      </tr>
    `
    return
  }
  
  storesBody.innerHTML = stores.map(store => {
    // Format coordinates
    const coordinates = (store.lat && store.lng) 
      ? `${parseFloat(store.lat).toFixed(7)}, ${parseFloat(store.lng).toFixed(7)}`
      : 'N/A'
    
    return `
      <tr>
        <td>${store.store_id}</td>
        <td><strong>${store.name}</strong></td>
        <td>${store.address || 'N/A'}</td>
        <td>${store.district || 'N/A'}</td>
        <td>${store.city || 'N/A'}</td>
        <td>${store.phone || 'N/A'}</td>
        <td>${store.opening_hours || 'N/A'}</td>
        <td>${coordinates}</td>
        <td>
          <div class="action-buttons">
            <button onclick="editStore(${store.store_id})" class="btn-icon btn-edit" title="Sửa">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteStore(${store.store_id})" class="btn-icon btn-delete" title="Xóa">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

// Show store form
function showStoreForm(isEdit = false) {
  const formContainer = document.getElementById('store-form-container')
  const formTitle = document.getElementById('store-form-title')
  
  if (!formContainer || !formTitle) {
    console.error('Store form elements not found')
    return
  }
  
  formTitle.textContent = isEdit ? 'Cập Nhật Cửa Hàng' : 'Thêm Cửa Hàng Mới'
  formContainer.style.display = 'block'
  
  // Scroll to form
  formContainer.scrollIntoView({ behavior: 'smooth' })
}

// Hide store form
function hideStoreForm() {
  const formContainer = document.getElementById('store-form-container')
  
  if (!formContainer) {
    console.error('Store form container not found')
    return
  }
  
  formContainer.style.display = 'none'
  resetStoreForm()
}

// Reset store form
function resetStoreForm() {
  const form = document.getElementById('store-form')
  
  if (!form) {
    console.error('Store form not found')
    return
  }
  
  form.reset()
  document.getElementById('store-id').value = ''
}

// Edit store
async function editStore(storeId) {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      showLoginSection()
      return
    }
    
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to get store details')
    }
    
    const data = await response.json()
    
    if (data.success === false) {
      throw new Error(data.message || 'Failed to get store details')
    }
    
    // Get store data from response
    const store = data.data || data
    
    if (!store) {
      throw new Error('Store data not found')
    }
    
    // Fill form with store data
    document.getElementById('store-id').value = store.store_id
    document.getElementById('store-name').value = store.name || ''
    document.getElementById('store-address').value = store.address || ''
    document.getElementById('store-district').value = store.district || ''
    document.getElementById('store-city').value = store.city || ''
    document.getElementById('store-phone').value = store.phone || ''
    document.getElementById('store-opening-hours').value = store.opening_hours || ''
    document.getElementById('store-lat').value = store.lat || ''
    document.getElementById('store-lng').value = store.lng || ''
    
    showStoreForm(true)
  } catch (error) {
    console.error('Error editing store:', error)
    showNotification(error.message, 'error')
  }
}

// Delete store
async function deleteStore(storeId) {
  try {
    if (!confirm('Bạn có chắc chắn muốn xóa cửa hàng này?')) {
      return
    }
    
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      showLoginSection()
      return
    }
    
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete store')
    }
    
    const data = await response.json()
    
    if (data.success === false) {
      throw new Error(data.message || 'Failed to delete store')
    }
    
    showNotification('Xóa cửa hàng thành công')
    loadStores()
  } catch (error) {
    console.error('Error deleting store:', error)
    showNotification(error.message, 'error')
  }
}

// Save store
async function saveStore(event) {
  event.preventDefault()
  
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      showLoginSection()
      return
    }
    
    const storeId = document.getElementById('store-id').value
    const isEdit = !!storeId
    
    const storeData = {
      name: document.getElementById('store-name').value,
      address: document.getElementById('store-address').value,
      district: document.getElementById('store-district').value,
      city: document.getElementById('store-city').value,
      phone: document.getElementById('store-phone').value,
      opening_hours: document.getElementById('store-opening-hours').value,
      lat: document.getElementById('store-lat').value || null,
      lng: document.getElementById('store-lng').value || null
    }
    
    const url = isEdit 
      ? `${API_BASE_URL}/stores/${storeId}` 
      : `${API_BASE_URL}/stores`
    
    const method = isEdit ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(storeData)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to ${isEdit ? 'update' : 'create'} store`)
    }
    
    const data = await response.json()
    
    if (data.success === false) {
      throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'create'} store`)
    }
    
    showNotification(`${isEdit ? 'Cập nhật' : 'Tạo'} cửa hàng thành công`)
    hideStoreForm()
    loadStores()
  } catch (error) {
    console.error(`Error ${storeId ? 'updating' : 'creating'} store:`, error)
    showNotification(error.message, 'error')
  }
}

// Store management event listeners are added in the main DOMContentLoaded event listener

window.editStore = editStore
window.deleteStore = deleteStore

// Quick status change functions
function showQuickStatusChange(id) {
  // Find the table in allTables
  const table = allTables.find(t => t.table_id == id)
  
  if (!table) {
    showNotification("Không tìm thấy thông tin bàn", "error")
    return
  }
  
  // Update the modal content
  const tableInfo = document.getElementById("status-change-table-info")
  tableInfo.innerHTML = `
    <div class="table-info-header">
      <div class="table-icon ${table.table_type}">
        <span>${table.table_number}</span>
      </div>
      <div>
        <h4>Bàn ${table.table_number}</h4>
        <p>${formatTableType(table.table_type)} - ${table.seats} chỗ ngồi</p>
        <p>Trạng thái hiện tại: ${getTableStatusBadge(table.status)}</p>
      </div>
    </div>
  `
  
  // Highlight current status
  const statusOptions = document.querySelectorAll(".status-option")
  statusOptions.forEach(option => {
    option.classList.remove("active")
    if (option.dataset.status === table.status) {
      option.classList.add("active")
    }
  })
  
  // Clear note
  document.getElementById("status-change-note").value = ""
  
  // Set table ID for the confirm button
  document.getElementById("confirm-status-change").dataset.tableId = table.table_id
  
  // Show the modal
  const modal = document.getElementById("status-change-modal")
  modal.style.display = "flex"
  
  // Add event listener to close button
  const closeButton = modal.querySelector(".close-modal")
  closeButton.addEventListener("click", hideQuickStatusChange)
  
  // Add event listener to cancel button
  const cancelButton = document.getElementById("cancel-status-change")
  cancelButton.addEventListener("click", hideQuickStatusChange)
  
  // Add event listener to confirm button
  const confirmButton = document.getElementById("confirm-status-change")
  confirmButton.addEventListener("click", confirmStatusChange)
  
  // Add event listeners to status options
  statusOptions.forEach(option => {
    option.addEventListener("click", function() {
      // Remove active class from all options
      statusOptions.forEach(opt => opt.classList.remove("active"))
      // Add active class to clicked option
      this.classList.add("active")
    })
  })
}

function hideQuickStatusChange() {
  const modal = document.getElementById("status-change-modal")
  modal.style.display = "none"
}

async function confirmStatusChange() {
  const tableId = this.dataset.tableId
  const activeOption = document.querySelector(".status-option.active")
  const newStatus = activeOption ? activeOption.dataset.status : null
  const note = document.getElementById("status-change-note").value
  
  if (!newStatus) {
    showNotification("Vui lòng chọn trạng thái mới", "warning")
    return
  }
  
  try {
    // Sử dụng đúng endpoint cập nhật trạng thái bàn
    await apiRequest(`/tables/${tableId}/status`, "PUT", {
      status: newStatus,
      note: note
    })
    
    hideQuickStatusChange()
    showNotification("Cập nhật trạng thái bàn thành công")
    loadTables(tablesCurrentPage)
  } catch (error) {
    console.error("Error updating table status:", error)
    showNotification("Lỗi khi cập nhật trạng thái bàn", "error")
  }
}

// Make functions available globally
window.showQuickStatusChange = showQuickStatusChange
window.hideQuickStatusChange = hideQuickStatusChange
window.confirmStatusChange = confirmStatusChange
window.showFloorPlanView = showFloorPlanView
window.saveTablePositions = saveTablePositions
window.resetFloorPlan = resetFloorPlan
window.showBulkUpdateForm = showBulkUpdateForm
window.hideBulkUpdateForm = hideBulkUpdateForm
window.handleBulkUpdateSubmit = handleBulkUpdateSubmit
