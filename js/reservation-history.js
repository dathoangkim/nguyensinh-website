// Biến lưu trữ thông tin cho reservation-history.js
// Sử dụng tên khác để tránh xung đột
// Kiểm tra xem biến đã tồn tại chưa để tránh lỗi khai báo lại
window.reservationHistoryData = window.reservationHistoryData || [];
window.selectedReservationDetail = window.selectedReservationDetail || null;

// Sử dụng API_BASE_URL từ order.js
// Hàm để lấy dữ liệu từ API
async function fetchReservationData(endpoint, token = null) {
  try {
    // Đảm bảo API_BASE_URL được định nghĩa
    const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : "http://localhost:5000/api";
    const url = `${baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`Đang gọi API: ${url}`);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Kết quả từ API ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu từ ${endpoint}:`, error);
    return { success: false, data: [], message: error.message };
  }
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
  const loadingTexts = document.querySelectorAll(".loading-text");
  loadingTexts.forEach((text) => {
    text.style.display = show ? "block" : "none";
  });
}

// Hàm kiểm tra người dùng đã đăng nhập chưa
function checkUserLoggedIn() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!token && !!user;
}

// Hàm lấy token từ localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Hàm lấy danh sách đặt bàn của người dùng
async function loadUserReservations() {
  try {
    showLoadingSpinner(true);
    
    // Kiểm tra đăng nhập
    if (!checkUserLoggedIn()) {
      // Hiển thị form tìm kiếm đặt bàn cho người dùng chưa đăng nhập
      document.querySelector("#reservations-list").innerHTML = '';
      document.querySelector("#reservation-history-tab .not-logged-in").style.display = "block";
      
      // Kiểm tra xem có thông tin đặt bàn trong localStorage không
      const guestReservations = getGuestReservations();
      if (guestReservations && guestReservations.length > 0) {
        // Hiển thị danh sách đặt bàn của khách
        window.reservationHistoryData = guestReservations;
        displayReservations(guestReservations);
        
        // Hiển thị thông báo
        showNotification("Hiển thị các đơn đặt bàn được lưu trên thiết bị này", "info");
      }
      
      showLoadingSpinner(false);
      return;
    }
    
    document.querySelector("#reservation-history-tab .not-logged-in").style.display = "none";
    
    // Lấy token và user_id
    const token = getToken();
    const userId = typeof getUserId === 'function' ? getUserId() : null;
    
    // Gọi API với endpoint đúng
    let response;
    if (userId) {
      // Sử dụng endpoint với user_id
      response = await fetchReservationData(`/reservations?user_id=${userId}`, token);
    } else {
      // Fallback về endpoint cũ
      response = await fetchReservationData("/reservations/my-reservations", token);
    }
    
    // Cập nhật biến toàn cục
    window.reservationHistoryData = response.data || [];
    
    // Hiển thị danh sách đặt bàn
    displayReservations(window.reservationHistoryData);
    
  } catch (error) {
    console.error("Lỗi khi tải danh sách đặt bàn:", error);
    document.querySelector("#reservations-list").innerHTML = `
      <div class="empty-message">
        <p>Đã xảy ra lỗi khi tải dữ liệu đặt bàn</p>
        <p>Chi tiết lỗi: ${error.message}</p>
      </div>
    `;
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm lấy danh sách đặt bàn của khách từ localStorage
function getGuestReservations() {
  try {
    const guestReservationIds = localStorage.getItem('guestReservationIds');
    if (!guestReservationIds) return [];
    
    const reservationIds = JSON.parse(guestReservationIds);
    const reservations = [];
    
    for (const id of reservationIds) {
      const reservationData = localStorage.getItem(`reservation_${id}`);
      if (reservationData) {
        try {
          const reservation = JSON.parse(reservationData);
          reservations.push(reservation);
        } catch (e) {
          console.error("Lỗi khi parse dữ liệu đặt bàn:", e);
        }
      }
    }
    
    return reservations;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt bàn của khách:", error);
    return [];
  }
}

// Hàm hiển thị danh sách đặt bàn
function displayReservations(reservations) {
  const container = document.querySelector("#reservations-list");
  
  if (!reservations || reservations.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        <p>Bạn chưa có đơn đặt bàn nào</p>
        <p>Hãy <a href="datban.html">đặt bàn ngay</a> để trải nghiệm ẩm thực tại Nguyên Sinh!</p>
      </div>
    `;
    return;
  }
  
  // Sắp xếp theo ngày đặt (mới nhất lên đầu)
  reservations.sort((a, b) => {
    const dateA = new Date(`${a.reservation_date} ${a.reservation_time}`);
    const dateB = new Date(`${b.reservation_date} ${b.reservation_time}`);
    return dateB - dateA;
  });
  
  // Tạo HTML cho từng đơn đặt bàn
  const reservationsHTML = reservations.map(reservation => {
    // Định dạng ngày tháng
    const date = new Date(reservation.reservation_date);
    const formattedDate = date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    // Xác định trạng thái hiển thị
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
    
    return `
      <div class="reservation-card" data-id="${reservation.reservation_id}">
        <div class="reservation-header">
          <div class="reservation-id">Đặt bàn #${reservation.reservation_id}</div>
          <div class="reservation-status ${statusClass}">${statusText}</div>
        </div>
        <div class="reservation-body">
          <div class="reservation-info-row">
            <div class="reservation-label">Cửa hàng:</div>
            <div class="reservation-value">${reservation.store_name}</div>
          </div>
          <div class="reservation-info-row">
            <div class="reservation-label">Ngày đặt:</div>
            <div class="reservation-value">${formattedDate}</div>
          </div>
          <div class="reservation-info-row">
            <div class="reservation-label">Giờ đặt:</div>
            <div class="reservation-value">${reservation.reservation_time}</div>
          </div>
          <div class="reservation-info-row">
            <div class="reservation-label">Số lượng khách:</div>
            <div class="reservation-value">${reservation.guests} người</div>
          </div>
        </div>
        <div class="reservation-footer">
          <button class="btn-view-details" data-id="${reservation.reservation_id}">Xem chi tiết</button>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = reservationsHTML;
  
  // Thêm sự kiện click cho nút xem chi tiết
  document.querySelectorAll(".btn-view-details").forEach(button => {
    button.addEventListener("click", () => {
      const reservationId = button.dataset.id;
      viewReservationDetails(reservationId);
    });
  });
}

// Hàm xem chi tiết đặt bàn
async function viewReservationDetails(reservationId) {
  try {
    showLoadingSpinner(true);
    
    // Kiểm tra xem có thể tìm thấy thông tin đặt bàn trong dữ liệu đã có không
    const existingReservation = window.reservationHistoryData.find(r => 
      r.reservation_id.toString() === reservationId.toString()
    );
    
    if (existingReservation) {
      // Nếu đã có thông tin trong bộ nhớ, sử dụng luôn
      window.selectedReservationDetail = existingReservation;
      displayReservationDetails(existingReservation);
      
      // Vẫn gọi API để lấy thông tin mới nhất (nếu có)
      try {
        // Chuẩn bị thông tin xác thực
        const token = getToken();
        let apiUrl = `/reservations/${reservationId}`;
        
        // Nếu không đăng nhập, thêm thông tin xác thực vào query params
        if (!checkUserLoggedIn() && existingReservation) {
          const params = new URLSearchParams();
          if (existingReservation.phone) params.append('phone', existingReservation.phone);
          if (existingReservation.email) params.append('email', existingReservation.email);
          if (existingReservation.reservation_code) params.append('reservation_code', existingReservation.reservation_code);
          
          if (params.toString()) {
            apiUrl += `?${params.toString()}`;
          }
        }
        
        // Gọi API lấy chi tiết đặt bàn
        const response = await fetchReservationData(apiUrl, token);
        if (response.success && response.data) {
          window.selectedReservationDetail = response.data;
          displayReservationDetails(response.data);
        }
      } catch (apiError) {
        console.log("Không thể lấy thông tin chi tiết từ API, sử dụng dữ liệu đã có:", apiError);
      }
    } else {
      // Nếu chưa có thông tin, gọi API hoặc lấy từ localStorage
      if (checkUserLoggedIn()) {
        // Người dùng đã đăng nhập - gọi API
        const token = getToken();
        const response = await fetchReservationData(`/reservations/${reservationId}`, token);
        
        if (response.success && response.data) {
          window.selectedReservationDetail = response.data;
          displayReservationDetails(response.data);
        } else {
          // Nếu API không trả về dữ liệu, hiển thị thông báo lỗi
          showNotification("Không tìm thấy thông tin đặt bàn", "error");
          return;
        }
      } else {
        // Người dùng chưa đăng nhập - lấy từ localStorage
        const reservationData = localStorage.getItem(`reservation_${reservationId}`);
        if (reservationData) {
          try {
            const reservation = JSON.parse(reservationData);
            window.selectedReservationDetail = reservation;
            displayReservationDetails(reservation);
          } catch (e) {
            console.error("Lỗi khi parse dữ liệu đặt bàn:", e);
            showNotification("Không thể đọc thông tin đặt bàn", "error");
            return;
          }
        } else {
          showNotification("Không tìm thấy thông tin đặt bàn", "error");
          return;
        }
      }
    }
    
    // Lấy lịch sử trạng thái
    loadReservationStatusHistory(reservationId);
    
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đặt bàn:", error);
    showNotification("Đã xảy ra lỗi khi lấy chi tiết đặt bàn", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm hiển thị chi tiết đặt bàn trong modal
function displayReservationDetails(reservation) {
  // Định dạng ngày tháng
  const date = new Date(reservation.reservation_date);
  const formattedDate = date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  
  // Xác định trạng thái hiển thị
  let statusText = "";
  let statusClass = "";
  
  switch (reservation.status) {
    case "pending":
      statusText = "Chờ xác nhận";
      statusClass = "pending";
      break;
    case "confirmed":
      statusText = "Đã xác nhận";
      statusClass = "confirmed";
      break;
    case "completed":
      statusText = "Hoàn thành";
      statusClass = "completed";
      break;
    case "cancelled":
      statusText = "Đã hủy";
      statusClass = "cancelled";
      break;
    case "no_show":
      statusText = "Không đến";
      statusClass = "no_show";
      break;
    default:
      statusText = reservation.status;
      statusClass = "";
  }
  
  // Cập nhật thông tin trong modal
  document.getElementById("modalReservationId").textContent = reservation.reservation_id;
  
  const statusElement = document.getElementById("modalReservationStatus");
  statusElement.textContent = statusText;
  statusElement.className = `status-badge ${statusClass}`;
  
  document.getElementById("modalStore").textContent = reservation.store_name;
  document.getElementById("modalDate").textContent = formattedDate;
  document.getElementById("modalTime").textContent = reservation.reservation_time;
  document.getElementById("modalGuests").textContent = `${reservation.guests} người`;
  document.getElementById("modalTable").textContent = `Bàn ${reservation.table_number}`;
  document.getElementById("modalNotes").textContent = reservation.notes || "-";
  
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
  document.getElementById("modalDeposit").textContent = depositText;
  
  // Hiển thị/ẩn nút hủy đặt bàn dựa vào trạng thái
  const cancelButton = document.getElementById("cancelReservation");
  if (reservation.status === "pending" || reservation.status === "confirmed") {
    cancelButton.style.display = "block";
    cancelButton.onclick = () => cancelReservation(reservation.reservation_id);
  } else {
    cancelButton.style.display = "none";
  }
  
  // Hiển thị modal
  document.getElementById("reservationDetailsModal").style.display = "flex";
}

// Hàm lấy lịch sử trạng thái đặt bàn
async function loadReservationStatusHistory(reservationId) {
  try {
    // Lấy token
    const token = getToken();
    
    // Gọi API
    const response = await fetchReservationData(`/reservations/${reservationId}/history`, token);
    const history = response.data;
    
    // Hiển thị lịch sử
    displayStatusHistory(history);
    
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử trạng thái:", error);
    document.getElementById("statusHistory").innerHTML = `
      <div class="empty-message">
        <p>Không thể tải lịch sử trạng thái</p>
      </div>
    `;
  }
}

// Hàm hiển thị lịch sử trạng thái
function displayStatusHistory(history) {
  const container = document.getElementById("statusHistory");
  
  if (!history || history.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        <p>Chưa có lịch sử trạng thái</p>
      </div>
    `;
    return;
  }
  
  // Tạo HTML cho từng mục lịch sử
  const historyHTML = history.map(item => {
    // Định dạng ngày tháng
    const date = new Date(item.changed_at);
    const formattedDate = date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    
    // Xác định trạng thái hiển thị
    let oldStatusText = getStatusText(item.old_status);
    let newStatusText = getStatusText(item.new_status);
    
    return `
      <div class="status-item">
        <div class="status-date">${formattedDate}</div>
        <div class="status-change">Trạng thái thay đổi từ <strong>${oldStatusText}</strong> sang <strong>${newStatusText}</strong></div>
        ${item.notes ? `<div class="status-notes">Ghi chú: ${item.notes}</div>` : ''}
        ${item.changed_by_username ? `<div class="status-by">Thay đổi bởi: ${item.changed_by_username}</div>` : ''}
      </div>
    `;
  }).join('');
  
  container.innerHTML = historyHTML;
}

// Hàm lấy text hiển thị cho trạng thái
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

// Hàm hủy đặt bàn
async function cancelReservation(reservationId) {
  try {
    if (!confirm("Bạn có chắc chắn muốn hủy đặt bàn này không?")) {
      return;
    }
    
    showLoadingSpinner(true);
    
    // Lấy token
    const token = getToken();
    
    // Gọi API cập nhật trạng thái
    const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        status: "cancelled",
        notes: "Hủy bởi khách hàng"
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Đã xảy ra lỗi khi hủy đặt bàn");
    }
    
    // Hiển thị thông báo thành công
    showNotification("Hủy đặt bàn thành công", "success");
    
    // Đóng modal
    document.getElementById("reservationDetailsModal").style.display = "none";
    
    // Tải lại danh sách đặt bàn
    loadUserReservations();
    
  } catch (error) {
    console.error("Lỗi khi hủy đặt bàn:", error);
    showNotification(error.message, "error");
  } finally {
    showLoadingSpinner(false);
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
        <div class="info-value">${selectedReservation.email}</div>
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
        <div class="info-value">${selectedReservation.reservation_time}</div>
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
        <div class="info-label">Ghi chú:</div>
        <div class="info-value">${selectedReservation.notes || "-"}</div>
      </div>
      
      <div class="footer">
        <p>Cảm ơn bạn đã chọn Nguyên Sinh!</p>
        <p>Vui lòng đến trước giờ hẹn 10 phút. Nếu cần thay đổi hoặc hủy đặt bàn, vui lòng liên hệ trước ít nhất 2 giờ.</p>
        <p>Hotline: 0123 456 789 | Email: info@nguyensinh.com</p>
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

// Hàm xử lý chuyển tab
function handleTabChange() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      // Bỏ active tất cả các tab
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabContents.forEach(content => content.classList.remove("active"));
      
      // Active tab được chọn
      button.classList.add("active");
      const tabId = button.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      // Nếu là tab đặt bàn thì tải dữ liệu
      if (tabId === "reservation-history") {
        loadUserReservations();
      }
    });
  });
}

// Hàm kiểm tra URL để xác định tab hiển thị
function checkUrlForTab() {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');
  
  if (tab === "reservations") {
    // Chuyển sang tab đặt bàn
    document.querySelector('.tab-btn[data-tab="reservation-history"]').click();
  }
}

// Khởi chạy khi trang đã tải xong
document.addEventListener("DOMContentLoaded", function() {
  // Xử lý chuyển tab
  handleTabChange();
  
  // Kiểm tra URL để xác định tab hiển thị
  checkUrlForTab();
  
  // Thêm sự kiện cho nút đóng modal
  const closeModal = document.querySelector(".close-modal");
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      document.getElementById("reservationDetailsModal").style.display = "none";
    });
  }
  
  // Lắng nghe sự kiện đăng nhập để cập nhật giao diện
  document.addEventListener('login', function() {
    console.log('Đã nhận sự kiện đăng nhập, cập nhật giao diện lịch sử đặt bàn');
    // Tải lại danh sách đặt bàn
    loadUserReservations();
    
    // Ẩn thông báo "Vui lòng đăng nhập"
    const notLoggedInElement = document.querySelector("#reservation-history-tab .not-logged-in");
    if (notLoggedInElement) {
      notLoggedInElement.style.display = "none";
    }
  });
  
  // Lắng nghe sự kiện đăng xuất để cập nhật giao diện
  document.addEventListener('logout', function() {
    console.log('Đã nhận sự kiện đăng xuất, cập nhật giao diện lịch sử đặt bàn');
    // Hiển thị thông báo "Vui lòng đăng nhập"
    const notLoggedInElement = document.querySelector("#reservation-history-tab .not-logged-in");
    if (notLoggedInElement) {
      notLoggedInElement.style.display = "block";
    }
    
    // Xóa danh sách đặt bàn
    const reservationsContainer = document.getElementById("reservations-list");
    if (reservationsContainer) {
      reservationsContainer.innerHTML = '';
    }
  });
  
  // Thêm sự kiện cho nút in thông tin
  const printButton = document.getElementById("printReservationDetails");
  if (printButton) {
    printButton.addEventListener("click", printReservationDetails);
  }
});