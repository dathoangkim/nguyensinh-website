/**
 * Chat Integration Script
 * 
 * Tích hợp chatbox vào các trang web và kích hoạt các sự kiện để hiển thị thông báo khuyến mãi
 */

document.addEventListener('DOMContentLoaded', function() {
  // Tải CSS
  loadChatCSS();
  
  // Tải JavaScript
  loadChatJS();
  
  // Lắng nghe các sự kiện
  setupEventListeners();
});

/**
 * Tải file CSS của chatbox
 */
function loadChatCSS() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/chat/chat.css';
  document.head.appendChild(link);
}

/**
 * Tải file JavaScript của chatbox
 */
function loadChatJS() {
  const script = document.createElement('script');
  script.src = '/chat/chat.js';
  document.body.appendChild(script);
}

/**
 * Thiết lập các sự kiện để kích hoạt thông báo khuyến mãi
 */
function setupEventListeners() {
  // Lắng nghe sự kiện đăng nhập
  document.addEventListener('login', function(e) {
    // Kích hoạt sự kiện login cho chatbox
    window.dispatchEvent(new Event('login'));
  });
  
  // Lắng nghe sự kiện đăng ký
  document.addEventListener('signup', function(e) {
    // Kích hoạt sự kiện login cho chatbox
    window.dispatchEvent(new Event('login'));
  });
  
  // Lắng nghe sự kiện thêm vào giỏ hàng
  document.addEventListener('addToCart', function(e) {
    // Kích hoạt sự kiện addToCart cho chatbox
    window.dispatchEvent(new Event('addToCart'));
  });
  
  // Lắng nghe sự kiện đặt bàn
  document.addEventListener('reservation', function(e) {
    // Kích hoạt sự kiện reservation cho chatbox
    window.dispatchEvent(new Event('reservation'));
  });
}

/**
 * Kích hoạt sự kiện đăng nhập
 * Gọi hàm này sau khi người dùng đăng nhập thành công
 */
function triggerLoginEvent() {
  document.dispatchEvent(new Event('login'));
}

/**
 * Kích hoạt sự kiện thêm vào giỏ hàng
 * Gọi hàm này sau khi người dùng thêm sản phẩm vào giỏ hàng
 */
function triggerAddToCartEvent() {
  document.dispatchEvent(new Event('addToCart'));
}

/**
 * Kích hoạt sự kiện đặt bàn
 * Gọi hàm này sau khi người dùng đặt bàn thành công
 */
function triggerReservationEvent() {
  document.dispatchEvent(new Event('reservation'));
}

// Xuất các hàm để sử dụng trong các file JavaScript khác
window.chatIntegration = {
  triggerLoginEvent,
  triggerAddToCartEvent,
  triggerReservationEvent
};