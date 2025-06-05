// API URL
const API_BASE_URL = "http://localhost:5000/api";

// Biến lưu trữ dữ liệu
let allReservations = [];
let selectedReservation = null;
let currentStoreId = 1; // Mặc định là cửa hàng đầu tiên
let currentDate = new Date().toISOString().split('T')[0]; // Ngày hiện tại

// Hàm để lấy dữ liệu từ API
async function fetchData(url, options = {}) {
  try {
    // Kiểm tra xem URL có phải là đường dẫn tương đối không
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu từ ${url}:`, error);
    return { success: false, data: [], message: error.message };
  }
}

// Lấy token từ localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Kiểm tra xem người dùng đã đăng nhập chưa và có quyền admin không
function checkAdminAccess() {
  const token = getToken();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  if (!token || !user || (user.role !== 'admin' && user.role !== 'staff')) {
    // Chuyển hướng về trang đăng nhập nếu không có quyền
    window.location.href = 'http://127.0.0.1:3002/admin/html/admin-dashboard.html';
    return false;
  }
  
  return true;
}

// Hàm hiển thị thông báo
function showNotification(message, type = "info") {
  // Xóa thông báo cũ nếu có
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Tạo thông báo mới
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Thêm icon phù hợp với loại thông báo
  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }

  notification.innerHTML = `${icon}${message}`;
  document.body.appendChild(notification);

  // Tự động xóa thông báo sau 5 giây
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out forwards";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Hàm hiển thị loading spinner
function showLoadingSpinner(show) {
  const loadingSpinner = document.getElementById("loading-spinner");
  if (loadingSpinner) {
    loadingSpinner.style.display = show ? "flex" : "none";
  }
}

// Hàm định dạng ngày tháng
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Hàm định dạng giờ
function formatTime(timeString) {
  // Nếu timeString là chuỗi HH:MM:SS, chuyển thành HH:MM
  if (timeString && timeString.length > 5) {
    return timeString.substring(0, 5);
  }
  return timeString;
}

// Hàm lấy danh sách cửa hàng
async function loadStores() {
  try {
    const token = getToken();
    const response = await fetchData("/stores", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.success && response.data) {
      const storeSelector = document.getElementById("store-selector");
      if (storeSelector) {
        storeSelector.innerHTML = response.data.map(store => 
          `<option value="${store.store_id}">${store.name}</option>`
        ).join('');
        
        // Lấy ID cửa hàng từ URL nếu có
        const urlParams = new URLSearchParams(window.location.search);
        const storeIdFromUrl = urlParams.get('storeId');
        
        if (storeIdFromUrl && response.data.some(s => s.store_id == storeIdFromUrl)) {
          storeSelector.value = storeIdFromUrl;
          currentStoreId = storeIdFromUrl;
        } else {
          currentStoreId = response.data[0].store_id;
        }
        
        // Thêm sự kiện change
        storeSelector.addEventListener('change', function() {
          currentStoreId = this.value;
          loadReservations();
        });
        
        // Tải danh sách đặt bàn
        loadReservations();
      }
    } else {
      showNotification("Không thể tải danh sách cửa hàng", "error");
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách cửa hàng:", error);
    showNotification("Đã xảy ra lỗi khi tải danh sách cửa hàng", "error");
  }
}

// Hàm lấy thống kê đặt bàn
async function loadReservationStats() {
  try {
    const token = getToken();
    const response = await fetchData("/reservations/stats", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.success && response.data) {
      const stats = response.data;
      
      // Cập nhật thống kê
      document.getElementById("total-reservations").textContent = stats.total_count || 0;
      document.getElementById("pending-reservations").textContent = stats.pending_count || 0;
      document.getElementById("confirmed-reservations").textContent = stats.confirmed_count || 0;
      document.getElementById("completed-reservations").textContent = stats.completed_count || 0;
      document.getElementById("cancelled-reservations").textContent = stats.cancelled_count || 0;
      document.getElementById("today-reservations").textContent = stats.today_count || 0;
    }
  } catch (error) {
    console.error("Lỗi khi tải thống kê đặt bàn:", error);
  }
}

// Hàm lấy danh sách đặt bàn theo cửa hàng và ngày
async function loadReservations() {
  try {
    showLoadingSpinner(true);
    
    const token = getToken();
    const dateInput = document.getElementById("date-selector");
    
    // Nếu có input ngày, sử dụng giá trị từ input
    if (dateInput) {
      currentDate = dateInput.value;
    }
    
    const response = await fetchData(`/reservations/store?storeId=${currentStoreId}&date=${currentDate}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.success) {
      allReservations = response.data || [];
      renderReservations(allReservations);
    } else {
      showNotification("Không thể tải danh sách đặt bàn", "error");
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách đặt bàn:", error);
    showNotification("Đã xảy ra lỗi khi tải danh sách đặt bàn", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm hiển thị danh sách đặt bàn
function renderReservations(reservations) {
  const reservationListContainer = document.getElementById("reservation-list");
  if (!reservationListContainer) return;
  
  if (reservations.length === 0) {
    reservationListContainer.innerHTML = '<p class="empty-message">Không có đơn đặt bàn nào trong ngày này</p>';
    return;
  }
  
  // Sắp xếp đặt bàn theo giờ
  reservations.sort((a, b) => {
    return a.reservation_time.localeCompare(b.reservation_time);
  });
  
  const reservationHTML = reservations.map(reservation => {
    // Xác định class cho trạng thái
    let statusClass = "";
    let statusText = "";
    
    switch (reservation.status) {
      case "pending":
        statusClass = "status-pending";
        statusText = "Chờ xác nhận";
        break;
      case "confirmed":
        statusClass = "status-confirmed";
        statusText = "Đã xác nhận";
        break;
      case "completed":
        statusClass = "status-completed";
        statusText = "Hoàn thành";
        break;
      case "cancelled":
        statusClass = "status-cancelled";
        statusText = "Đã hủy";
        break;
      case "no_show":
        statusClass = "status-no-show";
        statusText = "Không đến";
        break;
      default:
        statusClass = "";
        statusText = reservation.status;
    }
    
    return `
      <div class="reservation-card ${statusClass}" data-id="${reservation.reservation_id}">
        <div class="reservation-header">
          <div class="reservation-time">${formatTime(reservation.reservation_time)}</div>
          <div class="reservation-status ${statusClass}">${statusText}</div>
        </div>
        <div class="reservation-body">
          <div class="reservation-info">
            <h3>${reservation.full_name}</h3>
            <p><i class="fas fa-phone"></i> ${reservation.phone}</p>
            <p><i class="fas fa-users"></i> ${reservation.guests} người</p>
            <p><i class="fas fa-table"></i> Bàn ${reservation.table_number}</p>
          </div>
        </div>
        <div class="reservation-footer">
          <button class="btn-view-details" data-id="${reservation.reservation_id}">Chi tiết</button>
          <button class="btn-change-status" data-id="${reservation.reservation_id}">Đổi trạng thái</button>
        </div>
      </div>
    `;
  }).join('');
  
  reservationListContainer.innerHTML = reservationHTML;
  
  // Thêm sự kiện cho các nút
  document.querySelectorAll(".btn-view-details").forEach(button => {
    button.addEventListener("click", () => {
      const reservationId = button.dataset.id;
      viewReservationDetails(reservationId);
    });
  });
  
  document.querySelectorAll(".btn-change-status").forEach(button => {
    button.addEventListener("click", () => {
      const reservationId = button.dataset.id;
      showChangeStatusModal(reservationId);
    });
  });
}

// Hàm xem chi tiết đặt bàn
async function viewReservationDetails(reservationId) {
  try {
    showLoadingSpinner(true);
    
    const token = getToken();
    const response = await fetchData(`/reservations/${reservationId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.success && response.data) {
      selectedReservation = response.data;
      displayReservationDetails(selectedReservation);
    } else {
      showNotification("Không thể tải thông tin đặt bàn", "error");
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin đặt bàn:", error);
    showNotification("Đã xảy ra lỗi khi tải thông tin đặt bàn", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm hiển thị chi tiết đặt bàn
function displayReservationDetails(reservation) {
  const modal = document.getElementById("reservation-details-modal");
  if (!modal) return;
  
  // Cập nhật thông tin
  document.getElementById("detail-reservation-id").textContent = reservation.reservation_id;
  document.getElementById("detail-customer-name").textContent = reservation.full_name;
  document.getElementById("detail-customer-phone").textContent = reservation.phone;
  document.getElementById("detail-customer-email").textContent = reservation.email || "-";
  document.getElementById("detail-reservation-date").textContent = formatDate(reservation.reservation_date);
  document.getElementById("detail-reservation-time").textContent = formatTime(reservation.reservation_time);
  document.getElementById("detail-guests").textContent = reservation.guests;
  document.getElementById("detail-table").textContent = `Bàn ${reservation.table_number}`;
  document.getElementById("detail-occasion").textContent = reservation.occasion || "-";
  document.getElementById("detail-notes").textContent = reservation.notes || "-";
  
  // Xác định trạng thái
  let statusText = "";
  let statusClass = "";
  
  switch (reservation.status) {
    case "pending":
      statusText = "Chờ xác nhận";
      statusClass = "status-pending";
      break;
    case "confirmed":
      statusText = "Đã xác nhận";
      statusClass = "status-confirmed";
      break;
    case "completed":
      statusText = "Hoàn thành";
      statusClass = "status-completed";
      break;
    case "cancelled":
      statusText = "Đã hủy";
      statusClass = "status-cancelled";
      break;
    case "no_show":
      statusText = "Không đến";
      statusClass = "status-no-show";
      break;
    default:
      statusText = reservation.status;
      statusClass = "";
  }
  
  const statusElement = document.getElementById("detail-status");
  statusElement.textContent = statusText;
  statusElement.className = `status-badge ${statusClass}`;
  
  // Xử lý thông tin đặt cọc
  let depositText = "";
  if (reservation.deposit_method === "none" || !reservation.deposit_method) {
    depositText = "Không có đặt cọc";
  } else {
    let methodText = "";
    switch (reservation.deposit_method) {
      case "momo":
        methodText = "MoMo";
        break;
      case "bank_transfer":
        methodText = "Chuyển khoản";
        break;
      case "credit_card":
        methodText = "Thẻ tín dụng";
        break;
      default:
        methodText = reservation.deposit_method;
    }
    
    let statusText = "";
    switch (reservation.deposit_status) {
      case "pending":
        statusText = "Đang xử lý";
        break;
      case "paid":
        statusText = "Đã thanh toán";
        break;
      case "refunded":
        statusText = "Đã hoàn tiền";
        break;
      case "cancelled":
        statusText = "Đã hủy";
        break;
      default:
        statusText = reservation.deposit_status || "Không xác định";
    }
    
    depositText = `${methodText} - ${reservation.deposit_amount.toLocaleString('vi-VN')} ₫ (${statusText})`;
  }
  document.getElementById("detail-deposit").textContent = depositText;
  
  // Hiển thị lịch sử trạng thái
  const historyContainer = document.getElementById("status-history");
  if (historyContainer && reservation.status_history) {
    if (reservation.status_history.length === 0) {
      historyContainer.innerHTML = '<p class="empty-message">Chưa có lịch sử trạng thái</p>';
    } else {
      const historyHTML = reservation.status_history.map(history => {
        const date = new Date(history.changed_at);
        const formattedDate = date.toLocaleString("vi-VN");
        
        return `
          <div class="history-item">
            <div class="history-time">${formattedDate}</div>
            <div class="history-content">
              <p>Trạng thái thay đổi từ <strong>${getStatusText(history.old_status)}</strong> sang <strong>${getStatusText(history.new_status)}</strong></p>
              ${history.notes ? `<p class="history-notes">Ghi chú: ${history.notes}</p>` : ''}
              ${history.changed_by_username ? `<p class="history-user">Thực hiện bởi: ${history.changed_by_username}</p>` : ''}
            </div>
          </div>
        `;
      }).join('');
      
      historyContainer.innerHTML = historyHTML;
    }
  }
  
  // Hiển thị modal
  modal.style.display = "flex";
}

// Hàm chuyển đổi trạng thái sang text
function getStatusText(status) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    case "no_show":
      return "Không đến";
    default:
      return status;
  }
}

// Hàm hiển thị modal thay đổi trạng thái
function showChangeStatusModal(reservationId) {
  const reservation = allReservations.find(r => r.reservation_id == reservationId);
  if (!reservation) return;
  
  selectedReservation = reservation;
  
  const modal = document.getElementById("change-status-modal");
  const reservationInfo = document.getElementById("status-reservation-info");
  const statusSelector = document.getElementById("reservation-status");
  
  reservationInfo.textContent = `${reservation.full_name} - Bàn ${reservation.table_number} - ${formatTime(reservation.reservation_time)}`;
  statusSelector.value = reservation.status;
  
  modal.style.display = "flex";
}

// Hàm cập nhật trạng thái đặt bàn
async function updateReservationStatus() {
  try {
    if (!selectedReservation) return;
    
    const statusSelector = document.getElementById("reservation-status");
    const notesInput = document.getElementById("status-notes");
    
    const newStatus = statusSelector.value;
    const notes = notesInput.value;
    
    showLoadingSpinner(true);
    
    const token = getToken();
    const response = await fetchData(`/reservations/${selectedReservation.reservation_id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status: newStatus,
        notes: notes
      })
    });
    
    if (response.success) {
      showNotification("Cập nhật trạng thái đặt bàn thành công", "success");
      
      // Đóng modal
      document.getElementById("change-status-modal").style.display = "none";
      
      // Tải lại danh sách đặt bàn
      loadReservations();
      
      // Tải lại thống kê
      loadReservationStats();
    } else {
      showNotification(response.message || "Không thể cập nhật trạng thái đặt bàn", "error");
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đặt bàn:", error);
    showNotification("Đã xảy ra lỗi khi cập nhật trạng thái đặt bàn", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm cập nhật trạng thái thanh toán đặt cọc
async function updateDepositStatus() {
  try {
    if (!selectedReservation) return;
    
    const statusSelector = document.getElementById("deposit-status");
    const transactionIdInput = document.getElementById("transaction-id");
    
    const newStatus = statusSelector.value;
    const transactionId = transactionIdInput.value;
    
    showLoadingSpinner(true);
    
    const token = getToken();
    const response = await fetchData(`/reservations/${selectedReservation.reservation_id}/payment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status: newStatus,
        transaction_id: transactionId
      })
    });
    
    if (response.success) {
      showNotification("Cập nhật trạng thái thanh toán thành công", "success");
      
      // Đóng modal
      document.getElementById("deposit-status-modal").style.display = "none";
      
      // Tải lại thông tin đặt bàn
      viewReservationDetails(selectedReservation.reservation_id);
    } else {
      showNotification(response.message || "Không thể cập nhật trạng thái thanh toán", "error");
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
    showNotification("Đã xảy ra lỗi khi cập nhật trạng thái thanh toán", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm hiển thị modal cập nhật trạng thái thanh toán
function showDepositStatusModal() {
  if (!selectedReservation) return;
  
  const modal = document.getElementById("deposit-status-modal");
  const depositInfo = document.getElementById("deposit-info");
  const statusSelector = document.getElementById("deposit-status");
  const transactionIdInput = document.getElementById("transaction-id");
  
  // Hiển thị thông tin đặt cọc
  let depositText = "";
  if (selectedReservation.deposit_method === "none" || !selectedReservation.deposit_method) {
    depositText = "Không có đặt cọc";
    modal.style.display = "none";
    showNotification("Đơn đặt bàn này không có đặt cọc", "warning");
    return;
  } else {
    let methodText = "";
    switch (selectedReservation.deposit_method) {
      case "momo":
        methodText = "MoMo";
        break;
      case "bank_transfer":
        methodText = "Chuyển khoản";
        break;
      case "credit_card":
        methodText = "Thẻ tín dụng";
        break;
      default:
        methodText = selectedReservation.deposit_method;
    }
    
    depositText = `${methodText} - ${selectedReservation.deposit_amount.toLocaleString('vi-VN')} ₫`;
  }
  
  depositInfo.textContent = depositText;
  statusSelector.value = selectedReservation.deposit_status || "pending";
  transactionIdInput.value = "";
  
  modal.style.display = "flex";
}

// Hàm tìm kiếm đặt bàn theo số điện thoại
async function searchReservationsByPhone() {
  try {
    const phoneInput = document.getElementById("search-phone");
    if (!phoneInput || !phoneInput.value) {
      showNotification("Vui lòng nhập số điện thoại để tìm kiếm", "warning");
      return;
    }
    
    const phone = phoneInput.value;
    
    showLoadingSpinner(true);
    
    const token = getToken();
    const response = await fetchData(`/reservations/phone?phone=${phone}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.success) {
      const searchResults = response.data || [];
      
      const resultsContainer = document.getElementById("search-results");
      if (!resultsContainer) return;
      
      if (searchResults.length === 0) {
        resultsContainer.innerHTML = '<p class="empty-message">Không tìm thấy đơn đặt bàn nào với số điện thoại này</p>';
        return;
      }
      
      // Sắp xếp kết quả theo ngày và giờ, mới nhất lên đầu
      searchResults.sort((a, b) => {
        const dateA = new Date(`${a.reservation_date} ${a.reservation_time}`);
        const dateB = new Date(`${b.reservation_date} ${b.reservation_time}`);
        return dateB - dateA;
      });
      
      const resultsHTML = searchResults.map(reservation => {
        // Xác định class cho trạng thái
        let statusClass = "";
        let statusText = "";
        
        switch (reservation.status) {
          case "pending":
            statusClass = "status-pending";
            statusText = "Chờ xác nhận";
            break;
          case "confirmed":
            statusClass = "status-confirmed";
            statusText = "Đã xác nhận";
            break;
          case "completed":
            statusClass = "status-completed";
            statusText = "Hoàn thành";
            break;
          case "cancelled":
            statusClass = "status-cancelled";
            statusText = "Đã hủy";
            break;
          case "no_show":
            statusClass = "status-no-show";
            statusText = "Không đến";
            break;
          default:
            statusClass = "";
            statusText = reservation.status;
        }
        
        return `
          <div class="search-result-item">
            <div class="result-header">
              <div class="result-id">Đặt bàn #${reservation.reservation_id}</div>
              <div class="result-status ${statusClass}">${statusText}</div>
            </div>
            <div class="result-body">
              <p><strong>Khách hàng:</strong> ${reservation.full_name}</p>
              <p><strong>Ngày đặt:</strong> ${formatDate(reservation.reservation_date)}</p>
              <p><strong>Giờ đặt:</strong> ${formatTime(reservation.reservation_time)}</p>
              <p><strong>Bàn:</strong> ${reservation.table_number}</p>
            </div>
            <div class="result-footer">
              <button class="btn-view-details" data-id="${reservation.reservation_id}">Xem chi tiết</button>
            </div>
          </div>
        `;
      }).join('');
      
      resultsContainer.innerHTML = resultsHTML;
      
      // Thêm sự kiện cho các nút
      document.querySelectorAll("#search-results .btn-view-details").forEach(button => {
        button.addEventListener("click", () => {
          const reservationId = button.dataset.id;
          viewReservationDetails(reservationId);
        });
      });
      
      // Hiển thị kết quả tìm kiếm
      document.getElementById("search-results-container").style.display = "block";
    } else {
      showNotification("Không thể tìm kiếm đặt bàn", "error");
    }
  } catch (error) {
    console.error("Lỗi khi tìm kiếm đặt bàn:", error);
    showNotification("Đã xảy ra lỗi khi tìm kiếm đặt bàn", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm tạo đơn đặt bàn mới
async function createNewReservation() {
  try {
    // Lấy dữ liệu từ form
    const fullName = document.getElementById("new-customer-name").value;
    const phone = document.getElementById("new-customer-phone").value;
    const email = document.getElementById("new-customer-email").value;
    const date = document.getElementById("new-reservation-date").value;
    const time = document.getElementById("new-reservation-time").value;
    const guests = document.getElementById("new-guests").value;
    const tableId = document.getElementById("new-table").value;
    const occasion = document.getElementById("new-occasion").value;
    const notes = document.getElementById("new-notes").value;
    
    // Kiểm tra dữ liệu
    if (!fullName || !phone || !date || !time || !guests || !tableId) {
      showNotification("Vui lòng điền đầy đủ thông tin bắt buộc", "warning");
      return;
    }
    
    showLoadingSpinner(true);
    
    const token = getToken();
    const response = await fetchData("/reservations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        store_id: currentStoreId,
        table_id: tableId,
        full_name: fullName,
        email: email,
        phone: phone,
        reservation_date: date,
        reservation_time: time,
        guests: parseInt(guests),
        occasion: occasion,
        notes: notes,
        deposit_method: "none",
        deposit_amount: 0
      })
    });
    
    if (response.success) {
      showNotification("Tạo đơn đặt bàn mới thành công", "success");
      
      // Đóng modal
      document.getElementById("new-reservation-modal").style.display = "none";
      
      // Tải lại danh sách đặt bàn
      loadReservations();
      
      // Tải lại thống kê
      loadReservationStats();
    } else {
      showNotification(response.message || "Không thể tạo đơn đặt bàn mới", "error");
    }
  } catch (error) {
    console.error("Lỗi khi tạo đơn đặt bàn mới:", error);
    showNotification("Đã xảy ra lỗi khi tạo đơn đặt bàn mới", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm hiển thị modal tạo đơn đặt bàn mới
async function showNewReservationModal() {
  try {
    // Reset form
    document.getElementById("new-customer-name").value = "";
    document.getElementById("new-customer-phone").value = "";
    document.getElementById("new-customer-email").value = "";
    document.getElementById("new-reservation-date").value = new Date().toISOString().split('T')[0];
    document.getElementById("new-reservation-time").value = "";
    document.getElementById("new-guests").value = "2";
    document.getElementById("new-occasion").value = "";
    document.getElementById("new-notes").value = "";
    
    // Lấy danh sách bàn trống
    await loadAvailableTables();
    
    // Hiển thị modal
    document.getElementById("new-reservation-modal").style.display = "flex";
  } catch (error) {
    console.error("Lỗi khi hiển thị form tạo đơn đặt bàn:", error);
    showNotification("Đã xảy ra lỗi khi hiển thị form tạo đơn đặt bàn", "error");
  }
}

// Hàm lấy danh sách bàn trống
async function loadAvailableTables() {
  try {
    const date = document.getElementById("new-reservation-date").value;
    const time = document.getElementById("new-reservation-time").value;
    const guests = document.getElementById("new-guests").value;
    
    if (!date || !time || !guests) {
      return;
    }
    
    const token = getToken();
    const response = await fetchData(`/tables/available?storeId=${currentStoreId}&date=${date}&time=${time}&guests=${guests}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const tableSelector = document.getElementById("new-table");
    if (!tableSelector) return;
    
    if (response.success && response.data && response.data.length > 0) {
      tableSelector.innerHTML = response.data.map(table => 
        `<option value="${table.table_id}">Bàn ${table.table_number} (${formatTableType(table.table_type)}, ${table.seats} chỗ)</option>`
      ).join('');
    } else {
      tableSelector.innerHTML = '<option value="">Không có bàn trống</option>';
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách bàn trống:", error);
  }
}

// Hàm định dạng loại bàn
function formatTableType(type) {
  switch (type) {
    case "round":
      return "Bàn tròn";
    case "rectangle":
      return "Bàn chữ nhật";
    case "large":
      return "Bàn lớn";
    default:
      return type;
  }
}

// Hàm in thông tin đặt bàn
function printReservationDetails() {
  if (!selectedReservation) return;
  
  // Định dạng ngày tháng
  const date = new Date(selectedReservation.reservation_date);
  const formattedDate = date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  
  // Xác định trạng thái hiển thị
  let statusText = getStatusText(selectedReservation.status);
  
  // Tạo nội dung in
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Thông Tin Đặt Bàn - Nguyên Sinh</title>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        .header h1 {
          color: #4e73df;
          margin-bottom: 5px;
        }
        .info-row {
          display: flex;
          margin-bottom: 10px;
        }
        .info-label {
          width: 150px;
          font-weight: bold;
        }
        .status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          background-color: #f6c23e;
          color: #212529;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Thông Tin Đặt Bàn - Nguyên Sinh</h1>
        <p>Mã đặt bàn: #${selectedReservation.reservation_id}</p>
      </div>
      
      <div class="info-row">
        <div class="info-label">Trạng thái:</div>
        <div class="info-value"><span class="status">${statusText}</span></div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Họ tên:</div>
        <div class="info-value">${selectedReservation.full_name}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Số điện thoại:</div>
        <div class="info-value">${selectedReservation.phone}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Email:</div>
        <div class="info-value">${selectedReservation.email || "-"}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Cửa hàng:</div>
        <div class="info-value">${selectedReservation.store_name}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Ngày đặt:</div>
        <div class="info-value">${formattedDate}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Giờ đặt:</div>
        <div class="info-value">${formatTime(selectedReservation.reservation_time)}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Số lượng khách:</div>
        <div class="info-value">${selectedReservation.guests} người</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Bàn:</div>
        <div class="info-value">Bàn ${selectedReservation.table_number}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Dịp đặc biệt:</div>
        <div class="info-value">${selectedReservation.occasion || "-"}</div>
      </div>
      
      <div class="info-row">
        <div class="info-label">Ghi chú:</div>
        <div class="info-value">${selectedReservation.notes || "-"}</div>
      </div>
      
      <div class="footer">
        <p>Nguyên Sinh - Hệ thống quản lý đặt bàn</p>
        <p>Ngày in: ${new Date().toLocaleDateString("vi-VN")}</p>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// Hàm khởi tạo
function init() {
  // Kiểm tra quyền truy cập
  if (!checkAdminAccess()) return;
  
  // Tải danh sách cửa hàng
  loadStores();
  
  // Tải thống kê đặt bàn
  loadReservationStats();
  
  // Thiết lập ngày mặc định là hôm nay
  const dateSelector = document.getElementById("date-selector");
  if (dateSelector) {
    dateSelector.value = new Date().toISOString().split('T')[0];
    dateSelector.addEventListener("change", loadReservations);
  }
  
  // Thêm sự kiện cho các nút
  document.getElementById("btn-search").addEventListener("click", searchReservationsByPhone);
  document.getElementById("btn-new-reservation").addEventListener("click", showNewReservationModal);
  document.getElementById("btn-create-reservation").addEventListener("click", createNewReservation);
  document.getElementById("btn-update-status").addEventListener("click", updateReservationStatus);
  document.getElementById("btn-update-deposit").addEventListener("click", updateDepositStatus);
  document.getElementById("btn-print").addEventListener("click", printReservationDetails);
  document.getElementById("btn-update-deposit-status").addEventListener("click", showDepositStatusModal);
  
  // Thêm sự kiện cho các input trong form tạo đơn đặt bàn mới
  document.getElementById("new-reservation-date").addEventListener("change", loadAvailableTables);
  document.getElementById("new-reservation-time").addEventListener("change", loadAvailableTables);
  document.getElementById("new-guests").addEventListener("change", loadAvailableTables);
  
  // Thêm sự kiện đóng modal
  document.querySelectorAll(".close-modal").forEach(button => {
    button.addEventListener("click", function() {
      this.closest(".modal").style.display = "none";
    });
  });
  
  // Thêm sự kiện tìm kiếm khi nhấn Enter
  document.getElementById("search-phone").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      searchReservationsByPhone();
    }
  });
}

// Gọi hàm khởi tạo khi trang đã tải xong
document.addEventListener("DOMContentLoaded", init);