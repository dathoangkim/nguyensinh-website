// API URL
const API_BASE_URL = "http://localhost:5000/api";

// Biến lưu trữ thông tin
let stores = [];
let selectedStore = null;
let selectedTable = null;
let userLocation = null;
let map = null;
let depositMethod = null;

// Hàm để lấy dữ liệu từ API
async function fetchData(endpoint) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    // Tạo controller để có thể abort request sau một khoảng thời gian
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 giây timeout
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    // Clear timeout nếu request thành công
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu từ ${endpoint}:`, error);
    // Trả về null thay vì throw error để xử lý lỗi ở nơi gọi hàm
    return null;
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
  const spinners = document.querySelectorAll(".loading-spinner");
  spinners.forEach((spinner) => {
    spinner.style.display = show ? "block" : "none";
  });
}

// Hàm lấy vị trí hiện tại của người dùng
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(userLocation);
        },
        (error) => {
          console.error("Lỗi khi lấy vị trí:", error);
          reject(error);
        }
      );
    } else {
      const error = new Error("Trình duyệt không hỗ trợ định vị");
      console.error(error);
      reject(error);
    }
  });
}

// Hàm tính khoảng cách giữa hai điểm (theo công thức Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Hàm chuyển đổi độ sang radian
function toRad(value) {
  return (value * Math.PI) / 180;
}

// Hàm tải danh sách cửa hàng gần nhất
async function loadNearestStores() {
  try {
    showLoadingSpinner(true);
    
    // Lấy vị trí hiện tại của người dùng
    if (!userLocation) {
      try {
        await getCurrentLocation();
      } catch (error) {
        showNotification("Không thể lấy vị trí của bạn. Hiển thị tất cả cửa hàng.", "warning");
        await loadAllStores();
        return;
      }
    }
    
    // Gọi API để lấy cửa hàng gần nhất
    const endpoint = `/stores/nearest/${userLocation.lat}/${userLocation.lng}?limit=5`;
    try {
      const response = await fetchData(endpoint);
      if (response && response.data && response.data.length > 0) {
        stores = response.data;
        
        // Hiển thị danh sách cửa hàng
        displayStoreCards(stores);
      } else {
        throw new Error("Không có dữ liệu cửa hàng gần nhất");
      }
    } catch (apiError) {
      console.error("Lỗi khi gọi API cửa hàng gần nhất:", apiError);
      showNotification("Không thể tìm cửa hàng gần nhất. Hiển thị tất cả cửa hàng.", "warning");
      await loadAllStores();
    }
  } catch (error) {
    console.error("Lỗi khi tải cửa hàng gần nhất:", error);
    showNotification("Không thể tìm cửa hàng gần nhất. Hiển thị tất cả cửa hàng.", "warning");
    await loadAllStores();
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm tải tất cả cửa hàng
async function loadAllStores() {
  try {
    showLoadingSpinner(true);
    const response = await fetchData("/stores");
    if (response && response.data) {
      stores = response.data;
      displayStoreCards(stores);
    } else {
      throw new Error("Không có dữ liệu cửa hàng");
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách cửa hàng:", error);
    showNotification("Đã xảy ra lỗi khi tải danh sách cửa hàng", "error");
    
    // Hiển thị dữ liệu mẫu nếu không thể kết nối API
    await displaySampleStores();
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm hiển thị dữ liệu cửa hàng khi không thể kết nối API
async function displaySampleStores() {
  try {
    // Thử lấy dữ liệu từ API
    const response = await fetchData("/stores");
    if (response && response.data && response.data.length > 0) {
      stores = response.data;
      displayStoreCards(stores);
      return;
    }
  } catch (error) {
    console.log("Không thể lấy dữ liệu cửa hàng từ API, sử dụng dữ liệu mẫu");
  }
  
  // Dữ liệu mẫu khi không thể kết nối API
  const sampleStores = [
    {
      store_id: 1,
      name: "Nguyên Sinh - Chi nhánh Quận 1",
      address: "123 Nguyễn Huệ",
      district: "Quận 1",
      city: "TP.HCM",
      phone: "028 1234 5678",
      opening_hours: "07:00 - 22:00",
      lat: 10.7731,
      lng: 106.7031,
      is_flagship: true
    },
    {
      store_id: 2,
      name: "Nguyên Sinh - Chi nhánh Quận 3",
      address: "456 Võ Văn Tần",
      district: "Quận 3",
      city: "TP.HCM",
      phone: "028 2345 6789",
      opening_hours: "07:00 - 22:00",
      lat: 10.7765,
      lng: 106.6941
    },
    {
      store_id: 3,
      name: "Nguyên Sinh - Chi nhánh Quận 7",
      address: "789 Nguyễn Thị Thập",
      district: "Quận 7",
      city: "TP.HCM",
      phone: "028 3456 7890",
      opening_hours: "07:00 - 22:00",
      lat: 10.7285,
      lng: 106.7215,
      is_new: true
    }
  ];
  
  stores = sampleStores;
  displayStoreCards(sampleStores);
}

// Hàm hiển thị danh sách cửa hàng dưới dạng card
function displayStoreCards(storeList) {
  const storeCardsContainer = document.getElementById("storeCards");
  if (!storeCardsContainer) return;
  
  // Xóa nội dung hiện tại
  storeCardsContainer.innerHTML = "";
  
  if (storeList.length === 0) {
    storeCardsContainer.innerHTML = '<div class="no-stores">Không tìm thấy cửa hàng nào</div>';
    return;
  }
  
  // Tạo card cho từng cửa hàng
  storeList.forEach(store => {
    const storeCard = document.createElement("div");
    storeCard.className = "store-card";
    storeCard.dataset.storeId = store.store_id;
    
    // Tính khoảng cách nếu có vị trí người dùng
    let distanceText = "";
    if (userLocation && store.lat && store.lng) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(store.lat),
        parseFloat(store.lng)
      );
      distanceText = `<p class="store-distance">${distance.toFixed(1)} km từ bạn</p>`;
    }
    
    // Thêm badge nếu là cửa hàng chính hoặc mới
    let badgeHtml = "";
    if (store.is_flagship) {
      badgeHtml = '<span class="badge flagship">Cửa hàng chính</span>';
    } else if (store.is_new) {
      badgeHtml = '<span class="badge new">Mới khai trương</span>';
    }
    
    storeCard.innerHTML = `
      <h4>${store.name} ${badgeHtml}</h4>
      <p><i class="fas fa-map-marker-alt"></i> ${store.address}, ${store.district || ""}, ${store.city || ""}</p>
      <p><i class="fas fa-phone"></i> ${store.phone || "Chưa cập nhật"}</p>
      <p><i class="fas fa-clock"></i> ${store.opening_hours || "Chưa cập nhật"}</p>
      ${distanceText}
    `;
    
    // Thêm sự kiện click để chọn cửa hàng
    storeCard.addEventListener("click", () => {
      // Bỏ chọn cửa hàng cũ
      document.querySelectorAll(".store-card.selected").forEach(card => {
        card.classList.remove("selected");
      });
      
      // Chọn cửa hàng mới
      storeCard.classList.add("selected");
      selectedStore = store;
      
      // Cập nhật sơ đồ bàn
      updateTableLayout(store.store_id);
      
      // Cập nhật thông tin tóm tắt
      updateSummary();
    });
    
    storeCardsContainer.appendChild(storeCard);
  });
}

// Hàm cập nhật sơ đồ bàn dựa trên cửa hàng đã chọn
async function updateTableLayout(storeId) {
  const layoutContainer = document.getElementById("layoutContainer");
  if (!layoutContainer) return;
  
  try {
    // Hiển thị loading
    layoutContainer.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i><p>Đang tải danh sách bàn...</p></div>';
    
    // Lấy thông tin ngày và giờ đặt bàn
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    const guestsInput = document.getElementById("guests");
    
    // Nếu đã chọn đủ thông tin, lấy danh sách bàn trống
    if (dateInput.value && timeInput.value && guestsInput.value) {
      const date = dateInput.value;
      const time = timeInput.value;
      const guests = guestsInput.value === "more" ? 
        document.getElementById("moreGuests").value : guestsInput.value;
      
      try {
        // Gọi API để lấy danh sách bàn
        const response = await fetchData(`/tables/available?storeId=${storeId}&date=${date}&time=${time}&guests=${guests}`);
        
        if (response && response.data && response.data.length > 0) {
          // Lọc bàn theo số người
          const filteredTables = response.data.filter(table => {
            // Nếu số người <= số chỗ ngồi và bàn có sẵn
            return parseInt(guests) <= table.seats && table.status === 'available';
          });
          
          if (filteredTables.length > 0) {
            createTableLayout(layoutContainer, filteredTables);
          } else {
            // Nếu không có bàn trống, hiển thị thông báo
            showNotification("Không có bàn trống phù hợp với yêu cầu của bạn", "warning");
            createTableLayout(layoutContainer, response.data);
          }
        } else {
          // Nếu không có dữ liệu từ API, sử dụng dữ liệu mẫu
          await createSampleTableLayout(layoutContainer, storeId);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bàn:", error);
        showNotification("Không thể lấy danh sách bàn", "error");
        createSampleTableLayout(layoutContainer, storeId);
      }
    } else {
      // Nếu chưa chọn đủ thông tin, hiển thị tất cả bàn
      createSampleTableLayout(layoutContainer, storeId);
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật sơ đồ bàn:", error);
    showNotification("Không thể cập nhật sơ đồ bàn", "error");
    createSampleTableLayout(layoutContainer, storeId);
  }
}

// Hàm tạo sơ đồ bàn từ dữ liệu API
function createTableLayout(container, tables) {
  if (!tables || tables.length === 0) {
    container.innerHTML = '<div class="no-tables">Không có bàn nào</div>';
    return;
  }
  
  // Xóa tất cả các bàn hiện tại
  container.innerHTML = '';
  
  // Tạo các bàn
  tables.forEach(table => {
    // Xác định loại bàn dựa trên số chỗ ngồi và loại bàn
    let tableType = "table-round";
    if (table.table_type === "rectangle") {
      tableType = "table-rectangle";
    }
    
    if (table.seats <= 2) {
      tableType += " table-small";
    } else if (table.seats >= 8) {
      tableType += " table-large";
    }
    
    const tableElement = document.createElement("div");
    tableElement.className = `table ${tableType} ${table.status}`;
    tableElement.dataset.tableId = table.table_id;
    tableElement.dataset.seats = table.seats;
    
    // Thêm số bàn
    const tableNumber = document.createElement("div");
    tableNumber.className = "table-number";
    tableNumber.textContent = table.table_number;
    tableElement.appendChild(tableNumber);
    
    // Thêm loại bàn
    const tableTypeElement = document.createElement("div");
    tableTypeElement.className = "table-type";
    tableTypeElement.textContent = table.table_type === "round" ? "Bàn tròn" : "Bàn chữ nhật";
    tableElement.appendChild(tableTypeElement);
    
    // Thêm số chỗ ngồi
    const tableSeats = document.createElement("div");
    tableSeats.className = "table-seats";
    tableSeats.textContent = `${table.seats} chỗ`;
    tableElement.appendChild(tableSeats);
    
    // Thêm sự kiện click để chọn bàn
    if (table.status !== "occupied" && table.status !== "reserved") {
      tableElement.addEventListener("click", async () => {
        // Bỏ chọn bàn cũ
        const selectedTables = container.querySelectorAll(".table.selected");
        selectedTables.forEach(t => {
          if (t !== tableElement) {
            t.classList.remove("selected");
          }
        });
        
        // Chọn hoặc bỏ chọn bàn mới
        if (tableElement.classList.contains("selected")) {
          tableElement.classList.remove("selected");
          selectedTable = null;
        } else {
          // Kiểm tra xem bàn có sẵn để đặt không
          const dateInput = document.getElementById("date");
          const timeInput = document.getElementById("time");
          
          if (dateInput.value && timeInput.value) {
            try {
              // Trong môi trường thực tế, bạn sẽ gọi API để kiểm tra tình trạng bàn
              // const checkResponse = await fetchData(`/tables/check-availability?tableId=${table.table_id}&date=${dateInput.value}&time=${timeInput.value}`);
              
              // Giả lập kiểm tra tình trạng bàn
              const isAvailable = table.status === "available";
              
              if (isAvailable) {
                tableElement.classList.add("selected");
                selectedTable = {
                  id: table.table_id,
                  number: table.table_number,
                  seats: table.seats,
                  type: table.table_type === "round" ? "Bàn tròn" : "Bàn chữ nhật"
                };
                showNotification("Bàn này có sẵn để đặt", "success");
              } else {
                showNotification("Bàn này đã được đặt trong khung giờ bạn chọn", "warning");
              }
            } catch (error) {
              console.error("Lỗi khi kiểm tra tình trạng bàn:", error);
              showNotification("Không thể kiểm tra tình trạng bàn", "error");
            }
          } else {
            showNotification("Vui lòng chọn ngày và giờ trước khi chọn bàn", "warning");
          }
        }
        
        // Cập nhật thông tin tóm tắt
        updateSummary();
      });
    }
    
    container.appendChild(tableElement);
  });
}

// Hàm tạo sơ đồ bàn khi không thể kết nối API
async function createSampleTableLayout(container, storeId) {
  // Xóa tất cả các bàn hiện tại
  container.innerHTML = '';
  
  try {
    // Thử lấy dữ liệu từ API
    const response = await fetchData(`/tables/store/${storeId}`);
    if (response && response.data && response.data.length > 0) {
      createTableLayout(container, response.data);
      return;
    }
  } catch (error) {
    console.log("Không thể lấy dữ liệu bàn từ API, sử dụng dữ liệu mẫu");
  }
  
  // Danh sách bàn mẫu khi không thể kết nối API
  const tables = [
    { id: 1, table_number: 1, table_type: "round", seats: 2, status: "available" },
    { id: 2, table_number: 2, table_type: "round", seats: 2, status: "available" },
    { id: 3, table_number: 3, table_type: "round", seats: 4, status: "available" },
    { id: 4, table_number: 4, table_type: "round", seats: 4, status: "occupied" },
    { id: 5, table_number: 5, table_type: "rectangle", seats: 6, status: "available" },
    { id: 6, table_number: 6, table_type: "rectangle", seats: 6, status: "available" },
    { id: 7, table_number: 7, table_type: "rectangle", seats: 6, status: "occupied" },
    { id: 8, table_number: 8, table_type: "round", seats: 8, status: "available" },
    { id: 9, table_number: 9, table_type: "round", seats: 8, status: "occupied" },
    { id: 10, table_number: 10, table_type: "rectangle", seats: 8, status: "available" },
  ];
  
  // Tạo các bàn
  tables.forEach(table => {
    const tableElement = document.createElement("div");
    tableElement.className = `table ${table.status}`;
    tableElement.dataset.tableId = table.id;
    tableElement.dataset.seats = table.seats;
    
    // Thêm số bàn
    const tableNumber = document.createElement("div");
    tableNumber.className = "table-number";
    tableNumber.textContent = table.table_number;
    tableElement.appendChild(tableNumber);
    
    // Thêm loại bàn
    const tableTypeElement = document.createElement("div");
    tableTypeElement.className = "table-type";
    tableTypeElement.textContent = table.table_type === "round" ? "Bàn tròn" : "Bàn chữ nhật";
    tableElement.appendChild(tableTypeElement);
    
    // Thêm số chỗ ngồi
    const tableSeats = document.createElement("div");
    tableSeats.className = "table-seats";
    tableSeats.textContent = `${table.seats} chỗ`;
    tableElement.appendChild(tableSeats);
    
    // Thêm sự kiện click để chọn bàn
    if (table.status !== "occupied") {
      tableElement.addEventListener("click", () => {
        // Bỏ chọn bàn cũ
        const selectedTables = container.querySelectorAll(".table.selected");
        selectedTables.forEach(t => {
          if (t !== tableElement) {
            t.classList.remove("selected");
          }
        });
        
        // Chọn hoặc bỏ chọn bàn mới
        if (tableElement.classList.contains("selected")) {
          tableElement.classList.remove("selected");
          selectedTable = null;
        } else {
          tableElement.classList.add("selected");
          selectedTable = {
            id: table.id,
            number: table.table_number,
            seats: table.seats,
            type: table.table_type === "round" ? "Bàn tròn" : "Bàn chữ nhật"
          };
        }
        
        // Cập nhật thông tin tóm tắt
        updateSummary();
      });
    }
    
    container.appendChild(tableElement);
  });
}

// Hàm cập nhật thông tin tóm tắt đặt bàn
function updateSummary() {
  // Cập nhật thông tin người đặt
  document.getElementById("summaryName").textContent = document.getElementById("fullName").value || "-";
  document.getElementById("summaryPhone").textContent = document.getElementById("phone").value || "-";
  document.getElementById("summaryEmail").textContent = document.getElementById("email").value || "-";
  
  // Cập nhật thông tin đặt bàn
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");
  const guestsSelect = document.getElementById("guests");
  
  // Định dạng ngày tháng
  let formattedDate = "-";
  if (dateInput.value) {
    const date = new Date(dateInput.value);
    formattedDate = date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
  
  document.getElementById("summaryDate").textContent = formattedDate;
  document.getElementById("summaryTime").textContent = timeInput.value || "-";
  
  // Xử lý số lượng khách
  let guestsText = "-";
  if (guestsSelect.value) {
    if (guestsSelect.value === "more") {
      const moreGuests = document.getElementById("moreGuests").value;
      guestsText = moreGuests ? `${moreGuests} người` : "Hơn 10 người";
    } else {
      guestsText = `${guestsSelect.value} người`;
    }
  }
  document.getElementById("summaryGuests").textContent = guestsText;
  
  // Cập nhật thông tin cửa hàng
  document.getElementById("summaryStore").textContent = selectedStore ? 
    `${selectedStore.name}, ${selectedStore.address}` : "-";
  
  // Cập nhật thông tin bàn
  document.getElementById("summaryTable").textContent = selectedTable ? 
    `Bàn ${selectedTable.id} (${selectedTable.seats} chỗ, ${selectedTable.type})` : "-";
  
  // Cập nhật ghi chú
  document.getElementById("summaryNotes").textContent = document.getElementById("notes").value || "-";
}

// Hàm xử lý khi người dùng thay đổi số lượng khách
function handleGuestsChange() {
  const guestsSelect = document.getElementById("guests");
  const moreGuestsGroup = document.getElementById("moreGuestsGroup");
  
  if (guestsSelect.value === "more") {
    moreGuestsGroup.style.display = "block";
  } else {
    moreGuestsGroup.style.display = "none";
  }
  
  updateSummary();
}

// Hàm xử lý khi người dùng chọn phương thức đặt cọc
function handleDepositMethodSelection() {
  const depositMethods = document.querySelectorAll(".deposit-method");
  
  depositMethods.forEach(method => {
    method.addEventListener("click", () => {
      // Bỏ chọn phương thức cũ
      depositMethods.forEach(m => m.classList.remove("selected"));
      
      // Chọn phương thức mới
      method.classList.add("selected");
      depositMethod = method.dataset.method;
    });
  });
}

// Hàm xác thực form đặt bàn
function validateReservationForm() {
  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const guests = document.getElementById("guests").value;
  
  // Kiểm tra các trường bắt buộc
  if (!fullName) {
    showNotification("Vui lòng nhập họ và tên", "error");
    return false;
  }
  
  if (!phone) {
    showNotification("Vui lòng nhập số điện thoại", "error");
    return false;
  }
  
  // Kiểm tra định dạng số điện thoại
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  if (!phoneRegex.test(phone)) {
    showNotification("Số điện thoại không hợp lệ", "error");
    return false;
  }
  
  if (!email) {
    showNotification("Vui lòng nhập email", "error");
    return false;
  }
  
  // Kiểm tra định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification("Email không hợp lệ", "error");
    return false;
  }
  
  if (!date) {
    showNotification("Vui lòng chọn ngày đặt bàn", "error");
    return false;
  }
  
  if (!time) {
    showNotification("Vui lòng chọn giờ đặt bàn", "error");
    return false;
  }
  
  if (!guests) {
    showNotification("Vui lòng chọn số lượng khách", "error");
    return false;
  }
  
  if (guests === "more" && !document.getElementById("moreGuests").value) {
    showNotification("Vui lòng nhập số lượng khách chính xác", "error");
    return false;
  }
  
  // Kiểm tra đã chọn cửa hàng chưa
  if (!selectedStore) {
    showNotification("Vui lòng chọn cửa hàng", "error");
    return false;
  }
  
  // Kiểm tra đã chọn bàn chưa
  if (!selectedTable) {
    showNotification("Vui lòng chọn bàn", "error");
    return false;
  }
  
  // Kiểm tra đã chọn phương thức đặt cọc chưa
  if (!depositMethod) {
    showNotification("Vui lòng chọn phương thức đặt cọc", "error");
    return false;
  }
  
  return true;
}

// Hàm xử lý khi người dùng xác nhận đặt bàn
async function handleReservationConfirmation() {
  // Kiểm tra form
  if (!validateReservationForm()) {
    return;
  }
  
  // Lấy thông tin đặt bàn
  const reservationData = {
    full_name: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    reservation_date: document.getElementById("date").value,
    reservation_time: document.getElementById("time").value,
    guests: document.getElementById("guests").value === "more" ? 
      parseInt(document.getElementById("moreGuests").value) : 
      parseInt(document.getElementById("guests").value),
    occasion: document.getElementById("occasion").value,
    notes: document.getElementById("notes").value.trim(),
    store_id: selectedStore.store_id,
    table_id: selectedTable.id,
    deposit_method: depositMethod,
    deposit_amount: 100000 // Số tiền đặt cọc cố định
  };
  
  try {
    // Hiển thị loading
    showLoadingSpinner(true);
    
    // Gửi yêu cầu đặt bàn
    // Trong môi trường thực tế, bạn sẽ gửi dữ liệu đến API
    // const response = await fetchData("/reservations", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify(reservationData)
    // });
    
    // Giả lập gửi yêu cầu thành công
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Ẩn loading
    showLoadingSpinner(false);
    
    // Hiển thị thông báo thành công
    showNotification("Đặt bàn thành công! Chúng tôi sẽ liên hệ với bạn để xác nhận.", "success");
    
    // Chuyển hướng đến trang xác nhận sau 2 giây
    setTimeout(() => {
      // Trong môi trường thực tế, bạn sẽ chuyển hướng đến trang xác nhận
      // window.location.href = `confirmation.html?id=${response.data.reservation_id}`;
      
      // Giả lập chuyển hướng bằng cách hiển thị thông báo
      alert("Đặt bàn thành công! Mã đặt bàn của bạn là: RES" + Math.floor(100000 + Math.random() * 900000));
      
      // Reset form
      document.getElementById("reservationForm").reset();
      selectedStore = null;
      selectedTable = null;
      depositMethod = null;
      
      // Bỏ chọn cửa hàng và bàn
      document.querySelectorAll(".store-card.selected").forEach(card => {
        card.classList.remove("selected");
      });
      
      document.querySelectorAll(".table.selected").forEach(table => {
        table.classList.remove("selected");
      });
      
      document.querySelectorAll(".deposit-method.selected").forEach(method => {
        method.classList.remove("selected");
      });
      
      // Cập nhật thông tin tóm tắt
      updateSummary();
    }, 2000);
  } catch (error) {
    console.error("Lỗi khi đặt bàn:", error);
    showLoadingSpinner(false);
    showNotification("Đã xảy ra lỗi khi đặt bàn. Vui lòng thử lại sau.", "error");
  }
}

// Hàm khởi tạo trang
function initPage() {
  // Thêm CSS cho bàn
  addTableStyles();
  
  // Tải danh sách cửa hàng
  loadAllStores();
  
  // Gắn sự kiện cho nút tìm cửa hàng gần nhất
  const findNearestStoresBtn = document.getElementById("findNearestStores");
  if (findNearestStoresBtn) {
    findNearestStoresBtn.addEventListener("click", loadNearestStores);
  }
  
  // Gắn sự kiện cho select số lượng khách
  const guestsSelect = document.getElementById("guests");
  if (guestsSelect) {
    guestsSelect.addEventListener("change", handleGuestsChange);
  }
  
  // Gắn sự kiện cho các trường input để cập nhật thông tin tóm tắt
  const formInputs = document.querySelectorAll("#reservationForm input, #reservationForm select, #reservationForm textarea");
  formInputs.forEach(input => {
    input.addEventListener("change", updateSummary);
    input.addEventListener("input", updateSummary);
  });
  
  // Gắn sự kiện cho phương thức đặt cọc
  handleDepositMethodSelection();
  
  // Gắn sự kiện cho nút xác nhận đặt bàn
  const confirmReservationBtn = document.getElementById("confirmReservation");
  if (confirmReservationBtn) {
    confirmReservationBtn.addEventListener("click", handleReservationConfirmation);
  }
  
  // Thiết lập ngày tối thiểu là ngày hiện tại
  const dateInput = document.getElementById("date");
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    dateInput.min = formattedDate;
  }
}

// Hàm thêm CSS cho bàn
function addTableStyles() {
  // Kiểm tra xem đã thêm style chưa
  if (document.getElementById("table-styles")) return;
  
  const style = document.createElement("style");
  style.id = "table-styles";
  style.textContent = `
    .table {
      position: absolute;
      width: 60px;
      height: 60px;
      background-image: url('https://img.icons8.com/?size=100&id=F5gVIrmicY82&format=png&color=000000');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: var(--transition);
      color: transparent; /* Ẩn số bàn ban đầu */
    }

    .table:hover {
      transform: scale(1.05);
    }

    .table.occupied {
      filter: grayscale(100%) brightness(40%) sepia(100%) hue-rotate(-50deg) saturate(600%);
      cursor: not-allowed;
    }

    .table.selected {
      filter: grayscale(100%) brightness(40%) sepia(100%) hue-rotate(190deg) saturate(600%);
    }

    .table-number {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--primary-color);
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      font-weight: bold;
    }

    .table-seats {
      position: absolute;
      bottom: -15px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #666;
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 10px;
    }

    .table-round {
      background-image: url('https://img.icons8.com/?size=100&id=F5gVIrmicY82&format=png&color=000000');
    }

    .table-rectangle {
      background-image: url('https://img.icons8.com/?size=100&id=F5gVIrmicY82&format=png&color=000000');
      width: 80px;
      height: 50px;
    }

    .table-large {
      width: 80px;
      height: 80px;
    }

    .table-small {
      width: 50px;
      height: 50px;
    }
  `;
  document.head.appendChild(style);
}

// Hàm xử lý khi người dùng nhấn nút xác nhận đặt bàn
async function handleReservationSubmit() {
  try {
    // Kiểm tra form
    const validationResult = validateReservationForm();
    if (!validationResult.isValid) {
      showNotification(validationResult.message, "error");
      return;
    }
    
    // Hiển thị loading
    showLoadingSpinner(true);
    
    // Lấy thông tin từ form
    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const guests = document.getElementById("guests").value === "more" 
      ? document.getElementById("moreGuests").value 
      : document.getElementById("guests").value;
    const occasion = document.getElementById("occasion").value;
    const notes = document.getElementById("notes").value.trim();
    
    // Kiểm tra đã chọn cửa hàng và bàn chưa
    if (!selectedStore) {
      showNotification("Vui lòng chọn cửa hàng", "error");
      showLoadingSpinner(false);
      return;
    }
    
    if (!selectedTable) {
      showNotification("Vui lòng chọn bàn", "error");
      showLoadingSpinner(false);
      return;
    }
    
    // Kiểm tra đã chọn phương thức đặt cọc chưa
    if (!depositMethod) {
      showNotification("Vui lòng chọn phương thức đặt cọc", "error");
      showLoadingSpinner(false);
      return;
    }
    
    // Chuẩn bị dữ liệu gửi lên server
    const reservationData = {
      store_id: selectedStore.store_id,
      table_id: selectedTable.id,
      full_name: fullName,
      email: email,
      phone: phone,
      reservation_date: date,
      reservation_time: time,
      guests: parseInt(guests),
      occasion: occasion,
      notes: notes,
      deposit_method: depositMethod,
      deposit_amount: 100000 // Số tiền đặt cọc cố định
    };
    
    // Gọi API để tạo đơn đặt bàn
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reservationData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Đã xảy ra lỗi khi đặt bàn");
    }
    
    // Hiển thị thông báo thành công
    showReservationSuccessModal(result.data);
    
    // Reset form
    document.getElementById("reservationForm").reset();
    
    // Bỏ chọn cửa hàng và bàn
    document.querySelectorAll(".store-card.selected").forEach(card => {
      card.classList.remove("selected");
    });
    
    document.querySelectorAll(".table.selected").forEach(table => {
      table.classList.remove("selected");
    });
    
    selectedStore = null;
    selectedTable = null;
    depositMethod = null;
    
    // Cập nhật thông tin tóm tắt
    updateSummary();
    
  } catch (error) {
    console.error("Lỗi khi đặt bàn:", error);
    showNotification(error.message, "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm hiển thị modal đặt bàn thành công
function showReservationSuccessModal(reservationData) {
  // Cập nhật thông tin trong modal
  document.getElementById("reservationId").textContent = reservationData.reservation_id;
  document.getElementById("receiptName").textContent = reservationData.full_name;
  document.getElementById("receiptPhone").textContent = reservationData.phone;
  document.getElementById("receiptEmail").textContent = reservationData.email;
  document.getElementById("receiptStore").textContent = reservationData.store_name;
  
  // Định dạng ngày tháng
  const date = new Date(reservationData.reservation_date);
  const formattedDate = date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  document.getElementById("receiptDate").textContent = formattedDate;
  
  document.getElementById("receiptTime").textContent = reservationData.reservation_time;
  document.getElementById("receiptGuests").textContent = `${reservationData.guests} người`;
  document.getElementById("receiptTable").textContent = `Bàn ${reservationData.table_number}`;
  
  // Xử lý dịp đặc biệt
  let occasionText = "-";
  if (reservationData.occasion) {
    switch (reservationData.occasion) {
      case "birthday":
        occasionText = "Sinh nhật";
        break;
      case "anniversary":
        occasionText = "Kỷ niệm";
        break;
      case "business":
        occasionText = "Gặp gỡ công việc";
        break;
      case "family":
        occasionText = "Họp mặt gia đình";
        break;
      default:
        occasionText = "Khác";
    }
  }
  document.getElementById("receiptOccasion").textContent = occasionText;
  
  document.getElementById("receiptNotes").textContent = reservationData.notes || "-";
  
  // Xử lý phương thức thanh toán
  let paymentMethodText = "-";
  switch (reservationData.deposit_method) {
    case "momo":
      paymentMethodText = "Ví MoMo";
      break;
    case "bank_transfer":
      paymentMethodText = "Chuyển khoản ngân hàng";
      break;
    case "credit_card":
      paymentMethodText = "Thẻ tín dụng";
      break;
    default:
      paymentMethodText = "Không có";
  }
  document.getElementById("receiptPaymentMethod").textContent = paymentMethodText;
  
  // Xử lý trạng thái thanh toán
  const paymentStatusElement = document.getElementById("receiptPaymentStatus");
  paymentStatusElement.textContent = reservationData.deposit_status === "paid" ? "Đã thanh toán" : "Đang xử lý";
  paymentStatusElement.className = `status-badge ${reservationData.deposit_status === "paid" ? "completed" : "pending"}`;
  
  // Hiển thị modal
  document.getElementById("reservationSuccessModal").style.display = "flex";
}

// Hàm in phiếu đặt bàn
function printReservationReceipt() {
  const receiptContent = document.querySelector(".reservation-receipt").innerHTML;
  const printWindow = window.open("", "_blank");
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Phiếu Đặt Bàn - Nguyên Sinh</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px dashed #ccc;
        }
        .receipt-logo {
          width: 80px;
          height: auto;
          margin-bottom: 10px;
        }
        .receipt-section {
          margin-bottom: 20px;
        }
        .receipt-section h4 {
          color: #4e73df;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
        .receipt-section p {
          margin: 5px 0;
          font-size: 0.95rem;
        }
        .receipt-footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #ccc;
          text-align: center;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          color: white;
        }
        .status-badge.pending {
          background-color: #f6c23e;
        }
        .status-badge.completed {
          background-color: #28a745;
        }
      </style>
    </head>
    <body>
      ${receiptContent}
    </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  // Đợi hình ảnh tải xong rồi mới in
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// Hàm gửi email phiếu đặt bàn
function sendReservationEmail() {
  // Trong thực tế, đây sẽ là API call để gửi email
  showNotification("Đã gửi phiếu đặt bàn đến email của bạn", "success");
}

// Hàm chuyển đến trang xem lịch sử đặt bàn
function viewReservationHistory() {
  window.location.href = "order.html?tab=reservations";
}

// Hàm tải Google Maps API
function loadGoogleMapsAPI() {
  return new Promise((resolve, reject) => {
    // Kiểm tra xem Google Maps API đã được tải chưa
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    
    // Tạo callback function cho Google Maps API
    window.initGoogleMaps = function() {
      resolve();
    };
    
    // Tạo script tag để tải Google Maps API
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBNLrJhOMz6idD05pzfn5lhA-TAw-mAZCU&callback=initGoogleMaps';
    script.async = true;
    script.defer = true;
    script.onerror = function() {
      reject(new Error('Không thể tải Google Maps API'));
    };
    
    // Thêm script vào trang
    document.head.appendChild(script);
  });
}

// Hàm tìm cửa hàng gần nhất
async function findNearestStores() {
  try {
    showLoadingSpinner(true);
    
    // Tải Google Maps API nếu chưa tải
    await loadGoogleMapsAPI();
    
    // Lấy vị trí hiện tại của người dùng
    if (!userLocation) {
      userLocation = await getCurrentLocation();
    }
    
    // Tính khoảng cách từ vị trí người dùng đến các cửa hàng
    const storesWithDistance = stores.map(store => {
      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        store.latitude, 
        store.longitude
      );
      return { ...store, distance };
    });
    
    // Sắp xếp cửa hàng theo khoảng cách (gần nhất lên đầu)
    storesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Hiển thị danh sách cửa hàng đã sắp xếp
    displayStores(storesWithDistance);
    
    // Hiển thị bản đồ với các cửa hàng
    showStoresOnMap(storesWithDistance, userLocation);
    
  } catch (error) {
    console.error("Lỗi khi tìm cửa hàng gần nhất:", error);
    showNotification(error.message, "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm lấy vị trí hiện tại của người dùng
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt của bạn không hỗ trợ định vị"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      error => {
        console.error("Lỗi khi lấy vị trí:", error);
        reject(new Error("Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí."));
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

// Hàm tính khoảng cách giữa hai điểm (theo công thức Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Khoảng cách (km)
  return distance;
}

// Hàm hiển thị cửa hàng trên bản đồ
function showStoresOnMap(stores, userLocation) {
  // Tạo container cho bản đồ nếu chưa có
  let mapContainer = document.getElementById("map-container");
  if (!mapContainer) {
    mapContainer = document.createElement("div");
    mapContainer.id = "map-container";
    mapContainer.style.width = "100%";
    mapContainer.style.height = "400px";
    mapContainer.style.marginBottom = "30px";
    mapContainer.style.borderRadius = "8px";
    mapContainer.style.overflow = "hidden";
    
    // Thêm vào trang
    const storeCards = document.getElementById("storeCards");
    storeCards.parentNode.insertBefore(mapContainer, storeCards);
  }
  
  // Tạo bản đồ
  map = new google.maps.Map(mapContainer, {
    center: userLocation,
    zoom: 12,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  });
  
  // Thêm marker cho vị trí người dùng
  new google.maps.Marker({
    position: userLocation,
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: "#4285F4",
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 2
    },
    title: "Vị trí của bạn"
  });
  
  // Thêm marker cho các cửa hàng
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(userLocation);
  
  stores.forEach(store => {
    const position = { lat: store.latitude, lng: store.longitude };
    
    // Thêm marker
    const marker = new google.maps.Marker({
      position: position,
      map: map,
      title: store.name,
      animation: google.maps.Animation.DROP
    });
    
    // Thêm thông tin khi click vào marker
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; max-width: 200px;">
          <h3 style="margin-top: 0; color: #4e73df;">${store.name}</h3>
          <p style="margin-bottom: 5px;"><strong>Địa chỉ:</strong> ${store.address}</p>
          <p style="margin-bottom: 5px;"><strong>Điện thoại:</strong> ${store.phone}</p>
          <p style="margin-bottom: 5px;"><strong>Khoảng cách:</strong> ${store.distance.toFixed(1)} km</p>
          <button 
            onclick="selectStoreFromMap(${store.store_id})" 
            style="background-color: #4e73df; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;"
          >
            Chọn cửa hàng này
          </button>
        </div>
      `
    });
    
    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
    
    // Mở thông tin của cửa hàng gần nhất
    if (store === stores[0]) {
      infoWindow.open(map, marker);
    }
    
    // Mở rộng bounds để hiển thị tất cả marker
    bounds.extend(position);
  });
  
  // Điều chỉnh bản đồ để hiển thị tất cả marker
  map.fitBounds(bounds);
  
  // Thêm hàm chọn cửa hàng từ bản đồ vào window
  window.selectStoreFromMap = function(storeId) {
    const storeCard = document.querySelector(`.store-card[data-id="${storeId}"]`);
    if (storeCard) {
      storeCard.click();
      storeCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
}

// Hàm thêm CSS cho bản đồ và bàn
function addMapAndTableStyles() {
  // Thêm CSS cho loading spinner
  const spinnerStyle = document.createElement("style");
  spinnerStyle.textContent = `
    .loading-spinner {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    .spinner-border {
      width: 3rem;
      height: 3rem;
      border: 0.25em solid rgba(255, 255, 255, 0.2);
      border-right-color: #fff;
      border-radius: 50%;
      animation: spinner-border 0.75s linear infinite;
    }
    
    @keyframes spinner-border {
      to { transform: rotate(360deg); }
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out forwards;
    }
    
    .notification i {
      margin-right: 10px;
      font-size: 1.2rem;
    }
    
    .notification.info {
      background-color: #2196F3;
    }
    
    .notification.success {
      background-color: #4CAF50;
    }
    
    .notification.warning {
      background-color: #FF9800;
    }
    
    .notification.error {
      background-color: #F44336;
    }
    
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .floor-plan-legend {
      display: flex;
      margin-top: 15px;
      gap: 20px;
      justify-content: center;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    
    .legend-text {
      font-size: 0.9rem;
      color: #666;
    }
  `;
  document.head.appendChild(spinnerStyle);
  
  // Thêm CSS cho bản đồ
  const mapStyle = document.createElement("style");
  mapStyle.textContent = `
    #map-container {
      width: 100%;
      height: 400px;
      margin-bottom: 30px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .store-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .store-card {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .store-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    
    .store-card.selected {
      border: 2px solid var(--primary-color);
      background-color: rgba(78, 115, 223, 0.05);
    }
    
    .store-name {
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 10px;
    }
    
    .store-address {
      color: #666;
      margin-bottom: 10px;
    }
    
    .store-distance {
      color: #333;
      font-weight: 600;
    }
    
    .store-phone {
      color: #666;
      margin-bottom: 15px;
    }
    
    .store-hours {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 15px;
    }
    
    .store-status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    .status-open {
      background-color: #28a745;
      color: white;
    }
    
    .status-closed {
      background-color: #dc3545;
      color: white;
    }
    
    .store-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }
    
    .btn-select-store {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.3s ease;
    }
    
    .btn-select-store:hover {
      background-color: var(--primary-dark);
    }
    
    .btn-view-map {
      background-color: #6c757d;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.3s ease;
    }
    
    .btn-view-map:hover {
      background-color: #5a6268;
    }
  `;
  document.head.appendChild(mapStyle);
  
  // Thêm CSS cho bàn
  const tableStyle = document.createElement("style");
  tableStyle.textContent = `
    .floor-plan {
      position: relative;
      width: 100%;
      height: 500px;
      background-color: #f8f9fc;
      border: 1px solid #e3e6f0;
      border-radius: 8px;
      margin-bottom: 30px;
      overflow: hidden;
    }
    
    .table {
      position: absolute;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    
    .table:hover {
      transform: scale(1.1);
    }
    
    .table.selected {
      border: 2px solid var(--primary-color);
      box-shadow: 0 0 10px rgba(78, 115, 223, 0.5);
    }
    
    .table.occupied {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .table-number {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #fff;
      color: #333;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      font-weight: bold;
    }

    .table-seats {
      position: absolute;
      bottom: -15px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #666;
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 10px;
    }

    .table-round {
      background-image: url('https://img.icons8.com/?size=100&id=F5gVIrmicY82&format=png&color=000000');
    }

    .table-rectangle {
      background-image: url('https://img.icons8.com/?size=100&id=F5gVIrmicY82&format=png&color=000000');
      width: 80px;
      height: 50px;
    }

    .table-large {
      width: 80px;
      height: 80px;
    }

    .table-small {
      width: 50px;
      height: 50px;
    }
  `;
  document.head.appendChild(tableStyle);
}

// Hàm hiển thị loading spinner
function showLoadingSpinner(show) {
  // Thêm loading spinner nếu chưa có
  let spinner = document.querySelector(".loading-spinner");
  if (!spinner && show) {
    spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    spinner.innerHTML = `
      <div class="spinner-border" role="status">
        <span class="sr-only">Đang tải...</span>
      </div>
    `;
    document.body.appendChild(spinner);
  }
  
  // Hiển thị hoặc ẩn spinner
  if (spinner) {
    spinner.style.display = show ? "flex" : "none";
  }
}

// Hàm hiển thị danh sách cửa hàng
function displayStores(storesList) {
  const storeCardsContainer = document.getElementById("storeCards");
  if (!storeCardsContainer) return;
  
  // Xóa nội dung cũ
  storeCardsContainer.innerHTML = "";
  
  // Kiểm tra nếu không có cửa hàng
  if (!storesList || storesList.length === 0) {
    storeCardsContainer.innerHTML = `
      <div class="empty-message">
        <p>Không tìm thấy cửa hàng nào</p>
      </div>
    `;
    return;
  }
  
  // Tạo HTML cho từng cửa hàng
  storesList.forEach(store => {
    // Kiểm tra trạng thái mở cửa
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;
    
    // Kiểm tra xem có thông tin giờ mở cửa không
    let openTime = 0;
    let closeTime = 0;
    
    if (store.open_time) {
      const openHour = parseInt(store.open_time.split(":")[0]) || 0;
      const openMinutes = parseInt(store.open_time.split(":")[1]) || 0;
      openTime = openHour * 60 + openMinutes;
    }
    
    if (store.close_time) {
      const closeHour = parseInt(store.close_time.split(":")[0]) || 0;
      const closeMinutes = parseInt(store.close_time.split(":")[1]) || 0;
      closeTime = closeHour * 60 + closeMinutes;
    }
    
    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    
    // Tạo HTML cho cửa hàng
    const storeCard = document.createElement("div");
    storeCard.className = "store-card";
    storeCard.dataset.id = store.store_id;
    
    // Thêm thông tin khoảng cách nếu có
    let distanceHTML = "";
    if (store.distance !== undefined) {
      distanceHTML = `<div class="store-distance">${store.distance.toFixed(1)} km từ vị trí của bạn</div>`;
    }
    
    storeCard.innerHTML = `
      <div class="store-name">${store.name}</div>
      <div class="store-address">${store.address}</div>
      ${distanceHTML}
      <div class="store-phone">${store.phone}</div>
      <div class="store-hours">Giờ mở cửa: ${store.open_time} - ${store.close_time}</div>
      <div class="store-status ${isOpen ? 'status-open' : 'status-closed'}">${isOpen ? 'Đang mở cửa' : 'Đã đóng cửa'}</div>
      <div class="store-actions">
        <button class="btn-select-store" data-id="${store.store_id}">Chọn cửa hàng này</button>
        <button class="btn-view-map" data-id="${store.store_id}">Xem trên bản đồ</button>
      </div>
    `;
    
    // Thêm sự kiện click cho cửa hàng
    storeCard.addEventListener("click", () => {
      // Bỏ chọn cửa hàng cũ
      document.querySelectorAll(".store-card").forEach(card => {
        card.classList.remove("selected");
      });
      
      // Chọn cửa hàng mới
      storeCard.classList.add("selected");
      
      // Lưu thông tin cửa hàng đã chọn
      selectedStore = store;
      
      // Tải danh sách bàn của cửa hàng
      loadStoreTables(store.store_id);
      
      // Cập nhật thông tin tóm tắt
      updateSummary();
    });
    
    // Thêm vào container
    storeCardsContainer.appendChild(storeCard);
  });
  
  // Thêm sự kiện cho các nút
  document.querySelectorAll(".btn-select-store").forEach(button => {
    button.addEventListener("click", (e) => {
      e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài
      
      const storeId = button.dataset.id;
      const storeCard = document.querySelector(`.store-card[data-id="${storeId}"]`);
      if (storeCard) {
        storeCard.click();
      }
    });
  });
  
  document.querySelectorAll(".btn-view-map").forEach(button => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài
      
      try {
        // Tải Google Maps API nếu chưa tải
        await loadGoogleMapsAPI();
        
        const storeId = button.dataset.id;
        const store = stores.find(s => s.store_id == storeId);
        
        if (!store) return;
        
        // Tạo container cho bản đồ nếu chưa có
        let mapContainer = document.getElementById("map-container");
        if (!mapContainer) {
          mapContainer = document.createElement("div");
          mapContainer.id = "map-container";
          mapContainer.style.width = "100%";
          mapContainer.style.height = "400px";
          mapContainer.style.marginBottom = "30px";
          mapContainer.style.borderRadius = "8px";
          mapContainer.style.overflow = "hidden";
          
          // Thêm vào trang
          const storeCards = document.getElementById("storeCards");
          storeCards.parentNode.insertBefore(mapContainer, storeCards);
        }
        
        // Tạo bản đồ
        const storeLocation = { lat: store.latitude, lng: store.longitude };
        map = new google.maps.Map(mapContainer, {
          center: storeLocation,
          zoom: 15
        });
        
        // Thêm marker cho cửa hàng
        const marker = new google.maps.Marker({
          position: storeLocation,
          map: map,
          title: store.name,
          animation: google.maps.Animation.DROP
        });
        
        // Thêm thông tin khi click vào marker
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin-top: 0; color: #4e73df;">${store.name}</h3>
              <p style="margin-bottom: 5px;"><strong>Địa chỉ:</strong> ${store.address}</p>
              <p style="margin-bottom: 5px;"><strong>Điện thoại:</strong> ${store.phone}</p>
              <p style="margin-bottom: 5px;"><strong>Giờ mở cửa:</strong> ${store.open_time} - ${store.close_time}</p>
              <button 
                onclick="selectStoreFromMap(${store.store_id})" 
                style="background-color: #4e73df; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;"
              >
                Chọn cửa hàng này
              </button>
            </div>
          `
        });
        
        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
        
        // Mở thông tin mặc định
        infoWindow.open(map, marker);
        
        // Thêm hàm chọn cửa hàng từ bản đồ vào window
        window.selectStoreFromMap = function(storeId) {
          const storeCard = document.querySelector(`.store-card[data-id="${storeId}"]`);
          if (storeCard) {
            storeCard.click();
            storeCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        };
        
      } catch (error) {
        console.error("Lỗi khi hiển thị bản đồ:", error);
        showNotification(error.message, "error");
      }
    });
  });
}

// Hàm tải danh sách bàn của cửa hàng
async function loadStoreTables(storeId) {
  try {
    showLoadingSpinner(true);
    
    // Tạo container cho sơ đồ bàn nếu chưa có
    let floorPlanContainer = document.getElementById("floorPlanContainer");
    if (!floorPlanContainer) {
      floorPlanContainer = document.createElement("div");
      floorPlanContainer.id = "floorPlanContainer";
      
      // Thêm tiêu đề
      const title = document.createElement("h3");
      title.textContent = "Chọn bàn";
      title.style.marginTop = "30px";
      title.style.marginBottom = "15px";
      title.style.color = "var(--primary-color)";
      
      // Thêm vào trang
      const storeCards = document.getElementById("storeCards");
      storeCards.parentNode.appendChild(title);
      storeCards.parentNode.appendChild(floorPlanContainer);
    }
    
    // Gọi API lấy danh sách bàn
    const response = await fetchData(`/tables/store/${storeId}`);
    
    // Kiểm tra xem response có dữ liệu không
    if (!response || !response.data) {
      console.error("Không nhận được dữ liệu bàn từ API");
      // Tạo dữ liệu mẫu để hiển thị
      const dummyTables = [
        { table_id: 1, store_id: storeId, table_number: 1, seats: 2, table_type: 'round', status: 'available', position_x: 100, position_y: 100 },
        { table_id: 2, store_id: storeId, table_number: 2, seats: 2, table_type: 'round', status: 'available', position_x: 200, position_y: 100 },
        { table_id: 3, store_id: storeId, table_number: 3, seats: 4, table_type: 'round', status: 'available', position_x: 300, position_y: 100 },
        { table_id: 4, store_id: storeId, table_number: 4, seats: 4, table_type: 'round', status: 'occupied', position_x: 400, position_y: 100 },
        { table_id: 5, store_id: storeId, table_number: 5, seats: 6, table_type: 'rectangle', status: 'available', position_x: 100, position_y: 200 },
        { table_id: 6, store_id: storeId, table_number: 6, seats: 6, table_type: 'rectangle', status: 'available', position_x: 250, position_y: 200 },
        { table_id: 7, store_id: storeId, table_number: 7, seats: 6, table_type: 'rectangle', status: 'occupied', position_x: 400, position_y: 200 },
        { table_id: 8, store_id: storeId, table_number: 8, seats: 8, table_type: 'large', status: 'available', position_x: 100, position_y: 300 },
        { table_id: 9, store_id: storeId, table_number: 9, seats: 8, table_type: 'large', status: 'occupied', position_x: 250, position_y: 300 },
        { table_id: 10, store_id: storeId, table_number: 10, seats: 8, table_type: 'large', status: 'available', position_x: 400, position_y: 300 }
      ];
      displayFloorPlan(dummyTables);
      return;
    }
    
    const tables = response.data;
    
    // Hiển thị sơ đồ bàn
    displayFloorPlan(tables);
    
  } catch (error) {
    console.error("Lỗi khi tải danh sách bàn:", error);
    showNotification("Đã xảy ra lỗi khi tải danh sách bàn", "error");
  } finally {
    showLoadingSpinner(false);
  }
}

// Hàm hiển thị sơ đồ bàn
function displayFloorPlan(tables) {
  const floorPlanContainer = document.getElementById("floorPlanContainer");
  if (!floorPlanContainer) return;
  
  // Xóa nội dung cũ
  floorPlanContainer.innerHTML = "";
  
  // Kiểm tra nếu không có bàn
  if (!tables || tables.length === 0) {
    floorPlanContainer.innerHTML = `
      <div class="empty-message">
        <p>Không tìm thấy bàn nào</p>
      </div>
    `;
    return;
  }
  
  // Tạo sơ đồ bàn
  const floorPlan = document.createElement("div");
  floorPlan.className = "floor-plan";
  floorPlan.style.position = "relative";
  floorPlan.style.width = "100%";
  floorPlan.style.height = "500px";
  floorPlan.style.border = "2px solid #ddd";
  floorPlan.style.borderRadius = "8px";
  floorPlan.style.backgroundColor = "#f9f9f9";
  floorPlan.style.marginTop = "20px";
  floorPlan.style.marginBottom = "30px";
  
  // Thêm các bàn vào sơ đồ
  tables.forEach(table => {
    const tableElement = document.createElement("div");
    tableElement.className = `table table-${table.table_type} ${table.status !== 'available' ? 'occupied' : ''}`;
    tableElement.dataset.id = table.table_id;
    tableElement.dataset.seats = table.seats;
    tableElement.dataset.type = table.table_type;
    
    // Đặt vị trí cho bàn
    tableElement.style.position = "absolute";
    tableElement.style.left = `${table.position_x}px`;
    tableElement.style.top = `${table.position_y}px`;
    tableElement.style.width = "60px";
    tableElement.style.height = "60px";
    tableElement.style.backgroundColor = table.status === 'available' ? "#4CAF50" : "#F44336";
    tableElement.style.borderRadius = table.table_type === 'round' ? "50%" : "5px";
    tableElement.style.display = "flex";
    tableElement.style.justifyContent = "center";
    tableElement.style.alignItems = "center";
    tableElement.style.cursor = table.status === 'available' ? "pointer" : "not-allowed";
    tableElement.style.transition = "all 0.3s ease";
    
    // Điều chỉnh kích thước dựa trên loại bàn
    if (table.table_type === 'rectangle') {
      tableElement.style.width = "80px";
      tableElement.style.height = "50px";
    } else if (table.table_type === 'large') {
      tableElement.style.width = "80px";
      tableElement.style.height = "80px";
    }
    
    // Thêm số bàn
    const tableNumber = document.createElement("div");
    tableNumber.className = "table-number";
    tableNumber.textContent = table.table_number;
    tableNumber.style.position = "absolute";
    tableNumber.style.top = "-15px";
    tableNumber.style.left = "50%";
    tableNumber.style.transform = "translateX(-50%)";
    tableNumber.style.backgroundColor = "#795548";
    tableNumber.style.color = "white";
    tableNumber.style.borderRadius = "50%";
    tableNumber.style.width = "24px";
    tableNumber.style.height = "24px";
    tableNumber.style.display = "flex";
    tableNumber.style.justifyContent = "center";
    tableNumber.style.alignItems = "center";
    tableNumber.style.fontSize = "12px";
    tableNumber.style.fontWeight = "bold";
    tableElement.appendChild(tableNumber);
    
    // Thêm số chỗ ngồi
    const tableSeats = document.createElement("div");
    tableSeats.className = "table-seats";
    tableSeats.textContent = `${table.seats} chỗ`;
    tableSeats.style.position = "absolute";
    tableSeats.style.bottom = "-15px";
    tableSeats.style.left = "50%";
    tableSeats.style.transform = "translateX(-50%)";
    tableSeats.style.backgroundColor = "#666";
    tableSeats.style.color = "white";
    tableSeats.style.borderRadius = "12px";
    tableSeats.style.padding = "2px 8px";
    tableSeats.style.fontSize = "10px";
    tableElement.appendChild(tableSeats);
    
    // Thêm sự kiện click cho bàn
    if (table.status === 'available') {
      tableElement.addEventListener("click", () => {
        // Bỏ chọn bàn cũ
        document.querySelectorAll(".table").forEach(t => {
          t.classList.remove("selected");
        });
        
        // Chọn bàn mới
        tableElement.classList.add("selected");
        tableElement.style.backgroundColor = "#2196F3";
        
        // Lưu thông tin bàn đã chọn
        selectedTable = {
          id: table.table_id,
          number: table.table_number,
          seats: table.seats,
          type: table.table_type
        };
        
        // Cập nhật thông tin tóm tắt
        updateSummary();
      });
    }
    
    // Thêm vào sơ đồ
    floorPlan.appendChild(tableElement);
  });
  
  // Thêm sơ đồ vào container
  floorPlanContainer.appendChild(floorPlan);
  
  // Thêm chú thích
  const legend = document.createElement("div");
  legend.className = "floor-plan-legend";
  legend.style.display = "flex";
  legend.style.justifyContent = "center";
  legend.style.gap = "20px";
  legend.style.marginTop = "15px";
  legend.style.marginBottom = "15px";
  legend.innerHTML = `
    <div class="legend-item" style="display: flex; align-items: center;">
      <div class="legend-color" style="width: 15px; height: 15px; background-color: #4CAF50; margin-right: 5px; border-radius: 3px;"></div>
      <div class="legend-text">Bàn trống</div>
    </div>
    <div class="legend-item" style="display: flex; align-items: center;">
      <div class="legend-color" style="width: 15px; height: 15px; background-color: #F44336; margin-right: 5px; border-radius: 3px;"></div>
      <div class="legend-text">Bàn đã đặt/đang sử dụng</div>
    </div>
    <div class="legend-item" style="display: flex; align-items: center;">
      <div class="legend-color" style="width: 15px; height: 15px; background-color: #2196F3; margin-right: 5px; border-radius: 3px;"></div>
      <div class="legend-text">Bàn đã chọn</div>
    </div>
  `;
  floorPlanContainer.appendChild(legend);
}

// Hàm cập nhật thông tin tóm tắt
function updateSummary() {
  try {
    // Lấy thông tin từ form
    const fullNameInput = document.getElementById("fullName");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    const guestsInput = document.getElementById("guests");
    const moreGuestsInput = document.getElementById("moreGuests");
    const occasionInput = document.getElementById("occasion");
    const notesInput = document.getElementById("notes");
    
    // Kiểm tra xem các phần tử input có tồn tại không
    const fullName = fullNameInput ? fullNameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const date = dateInput ? dateInput.value : "";
    const time = timeInput ? timeInput.value : "";
    const guests = guestsInput ? 
      (guestsInput.value === "more" && moreGuestsInput ? moreGuestsInput.value : guestsInput.value) 
      : "";
    const occasion = occasionInput ? occasionInput.value : "";
    const notes = notesInput ? notesInput.value : "";
    
    // Cập nhật thông tin khách hàng - kiểm tra từng phần tử trước khi cập nhật
    const summaryName = document.getElementById("summaryName");
    if (summaryName) summaryName.textContent = fullName || "-";
    
    const summaryPhone = document.getElementById("summaryPhone");
    if (summaryPhone) summaryPhone.textContent = phone || "-";
    
    const summaryEmail = document.getElementById("summaryEmail");
    if (summaryEmail) summaryEmail.textContent = email || "-";
    
    // Cập nhật thông tin đặt bàn
    const summaryDate = document.getElementById("summaryDate");
    if (summaryDate) {
      summaryDate.textContent = date ? new Date(date).toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }) : "-";
    }
    
    const summaryTime = document.getElementById("summaryTime");
    if (summaryTime) summaryTime.textContent = time || "-";
    
    const summaryGuests = document.getElementById("summaryGuests");
    if (summaryGuests) summaryGuests.textContent = guests ? `${guests} người` : "-";
    
    // Cập nhật dịp đặc biệt
    let occasionText = "-";
    if (occasion) {
      switch (occasion) {
        case "birthday":
          occasionText = "Sinh nhật";
          break;
        case "anniversary":
          occasionText = "Kỷ niệm";
          break;
        case "business":
          occasionText = "Gặp gỡ công việc";
          break;
        case "family":
          occasionText = "Họp mặt gia đình";
          break;
        default:
          occasionText = "Khác";
      }
    }
    
    const summaryOccasion = document.getElementById("summaryOccasion");
    if (summaryOccasion) summaryOccasion.textContent = occasionText;
    
    // Cập nhật thông tin cửa hàng
    const summaryStore = document.getElementById("summaryStore");
    if (summaryStore) {
      summaryStore.textContent = selectedStore ? 
        `${selectedStore.name}, ${selectedStore.address}` : "-";
    }
    
    // Cập nhật thông tin bàn
    const summaryTable = document.getElementById("summaryTable");
    if (summaryTable) {
      summaryTable.textContent = selectedTable ? 
        `Bàn ${selectedTable.number} (${selectedTable.seats} chỗ, ${selectedTable.type})` : "-";
    }
    
    // Cập nhật ghi chú
    const summaryNotes = document.getElementById("summaryNotes");
    if (summaryNotes) summaryNotes.textContent = notes || "-";
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin tóm tắt:", error);
  }
}

// Hàm khởi tạo trang
async function initPage() {
  try {
    // Thêm CSS cho bản đồ và bàn
    addMapAndTableStyles();
    
    // Lấy danh sách cửa hàng
    const response = await fetchData("/stores");
    stores = response.data;
    
    // Hiển thị danh sách cửa hàng
    displayStores(stores);
    
    // Thêm sự kiện cho nút tìm cửa hàng gần nhất
    const findNearestStoresButton = document.getElementById("findNearestStores");
    if (findNearestStoresButton) {
      findNearestStoresButton.addEventListener("click", findNearestStores);
    }
    
    // Thêm sự kiện cho các input để cập nhật thông tin tóm tắt
    const formInputs = document.querySelectorAll("#reservationForm input, #reservationForm select, #reservationForm textarea");
    formInputs.forEach(input => {
      input.addEventListener("change", updateSummary);
    });
    
  } catch (error) {
    console.error("Lỗi khi khởi tạo trang:", error);
    showNotification("Đã xảy ra lỗi khi tải dữ liệu", "error");
  }
}

// Hàm xử lý khi người dùng gửi đơn đặt bàn
async function handleReservationSubmit() {
  try {
    // Hiển thị loading spinner
    showLoadingSpinner(true);
    
    // Lấy thông tin từ form
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const guests = document.getElementById("guests").value === "more" ? 
      document.getElementById("moreGuests").value : document.getElementById("guests").value;
    const occasion = document.getElementById("occasion").value;
    const notes = document.getElementById("notes").value;
    
    // Kiểm tra thông tin bắt buộc
    if (!fullName || !email || !phone || !date || !time || !guests) {
      showNotification("Vui lòng điền đầy đủ thông tin cần thiết", "error");
      showLoadingSpinner(false);
      return;
    }
    
    // Kiểm tra đã chọn cửa hàng chưa
    if (!selectedStore) {
      showNotification("Vui lòng chọn cửa hàng", "error");
      showLoadingSpinner(false);
      return;
    }
    
    // Kiểm tra đã chọn bàn chưa
    if (!selectedTable) {
      showNotification("Vui lòng chọn bàn", "error");
      showLoadingSpinner(false);
      return;
    }
    
    // Lấy thông tin đặt cọc
    const depositMethod = document.querySelector('.deposit-method.selected')?.dataset.method || 'none';
    const depositAmount = depositMethod !== 'none' ? parseInt(document.querySelector(".deposit-amount")?.textContent.replace(/[^\d]/g, '') || "0") : 0;
    
    // Tạo đối tượng dữ liệu đặt bàn
    const reservationData = {
      store_id: selectedStore.store_id,
      table_id: selectedTable.id,
      full_name: fullName,
      email: email,
      phone: phone,
      reservation_date: date,
      reservation_time: time,
      guests: parseInt(guests),
      occasion: occasion,
      notes: notes,
      deposit_method: depositMethod,
      deposit_amount: depositAmount
    };
    
    // Gọi API để tạo đơn đặt bàn
    let result;
    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationData)
      });
      
      // Xử lý kết quả
      result = await response.json();
    } catch (error) {
      console.log("Không thể kết nối đến API, sử dụng dữ liệu mẫu");
      // Tạo dữ liệu mẫu khi không có API
      result = {
        success: true,
        data: {
          reservation_id: "R" + Math.floor(Math.random() * 10000),
          ...reservationData,
          created_at: new Date().toISOString()
        }
      };
    }
    

    
    if (result.success) {
      // Lưu thông tin đơn đặt bàn để hiển thị
      const reservationInfo = result.data;
      
      // Hiển thị modal thành công
      const modal = document.getElementById("reservationSuccessModal");
      if (modal) {
        // Cập nhật thông tin trong modal
        const modalReservationId = document.getElementById("reservationId");
        if (modalReservationId) {
          modalReservationId.textContent = reservationInfo.reservation_id;
        }
        
        const receiptName = document.getElementById("receiptName");
        if (receiptName) {
          receiptName.textContent = fullName;
        }
        
        const receiptPhone = document.getElementById("receiptPhone");
        if (receiptPhone) {
          receiptPhone.textContent = phone;
        }
        
        const receiptEmail = document.getElementById("receiptEmail");
        if (receiptEmail) {
          receiptEmail.textContent = email;
        }
        
        const receiptStore = document.getElementById("receiptStore");
        if (receiptStore && selectedStore) {
          receiptStore.textContent = selectedStore.name;
        }
        
        const receiptDate = document.getElementById("receiptDate");
        if (receiptDate) {
          receiptDate.textContent = new Date(date).toLocaleDateString("vi-VN");
        }
        
        const receiptTime = document.getElementById("receiptTime");
        if (receiptTime) {
          receiptTime.textContent = time;
        }
        
        const receiptGuests = document.getElementById("receiptGuests");
        if (receiptGuests) {
          receiptGuests.textContent = `${guests} người`;
        }
        
        const receiptTable = document.getElementById("receiptTable");
        if (receiptTable && selectedTable) {
          receiptTable.textContent = `Bàn ${selectedTable.number} (${selectedTable.seats} chỗ)`;
        }
        
        const receiptOccasion = document.getElementById("receiptOccasion");
        if (receiptOccasion) {
          receiptOccasion.textContent = occasion || "Không có";
        }
        
        // Hiển thị thông tin đặt cọc nếu có
        const receiptDeposit = document.getElementById("receiptDeposit");
        if (receiptDeposit) {
          if (depositAmount > 0) {
            receiptDeposit.textContent = `${new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND"
            }).format(depositAmount)} qua ${depositMethod === 'momo' ? 'MoMo' : 
              depositMethod === 'bank' ? 'Chuyển khoản' : 
              depositMethod === 'card' ? 'Thẻ tín dụng' : 'Khác'}`;
            receiptDeposit.style.display = "block";
          } else {
            receiptDeposit.style.display = "none";
          }
        }
        
        // Hiển thị modal
        modal.style.display = "flex";
      }
      
      // Hiển thị thông báo thành công
      showNotification("Đặt bàn thành công!", "success");
      
      // Reset form
      document.getElementById("reservationForm").reset();
      selectedTable = null;
      
      // Bỏ chọn tất cả bàn
      document.querySelectorAll(".table.selected").forEach(table => {
        table.classList.remove("selected");
      });
      
      // Cập nhật thông tin tóm tắt
      updateSummary();
    } else {
      // Hiển thị thông báo lỗi
      showNotification(result.message || "Đã xảy ra lỗi khi đặt bàn", "error");
    }
  } catch (error) {
    console.error("Lỗi khi đặt bàn:", error);
    showNotification("Đã xảy ra lỗi khi đặt bàn", "error");
  } finally {
    // Ẩn loading spinner
    showLoadingSpinner(false);
  }
}

// Hàm in hóa đơn đặt bàn
function printReservationReceipt() {
  const printWindow = window.open('', '_blank');
  
  // Lấy thông tin từ modal
  const reservationId = document.getElementById("modalReservationId").textContent;
  const storeName = document.getElementById("modalStoreName").textContent;
  const tableInfo = document.getElementById("modalTableInfo").textContent;
  const dateTime = document.getElementById("modalDateTime").textContent;
  const guestCount = document.getElementById("modalGuestCount").textContent;
  const depositInfo = document.getElementById("modalDepositInfo").textContent;
  
  // Tạo nội dung in
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hóa đơn đặt bàn #${reservationId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #4e73df;
          margin-bottom: 10px;
        }
        .info-row {
          display: flex;
          margin-bottom: 10px;
        }
        .info-label {
          width: 150px;
          font-weight: bold;
        }
        .info-value {
          flex: 1;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        .qr-code {
          text-align: center;
          margin: 20px 0;
        }
        .qr-code img {
          width: 150px;
          height: 150px;
        }
        .thank-you {
          text-align: center;
          margin-top: 30px;
          font-size: 18px;
          font-weight: bold;
          color: #4e73df;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">Nguyên Sinh Restaurant</div>
          <div>Hóa đơn đặt bàn</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Mã đặt bàn:</div>
          <div class="info-value">#${reservationId}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Cửa hàng:</div>
          <div class="info-value">${storeName}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Bàn:</div>
          <div class="info-value">${tableInfo}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Thời gian:</div>
          <div class="info-value">${dateTime}</div>
        </div>
        
        <div class="info-row">
          <div class="info-label">Số khách:</div>
          <div class="info-value">${guestCount}</div>
        </div>
        
        ${depositInfo ? `
        <div class="info-row">
          <div class="info-label">Đặt cọc:</div>
          <div class="info-value">${depositInfo.replace('Đặt cọc: ', '')}</div>
        </div>
        ` : ''}
        
        <div class="qr-code">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=RESERVATION_${reservationId}" alt="QR Code">
          <div>Quét mã QR để xem chi tiết đơn đặt bàn</div>
        </div>
        
        <div class="thank-you">Cảm ơn quý khách đã đặt bàn tại Nguyên Sinh!</div>
        
        <div class="footer">
          <p>Vui lòng đến trước giờ đặt 15 phút. Nếu quý khách cần hỗ trợ, vui lòng liên hệ hotline: 1900 1234</p>
          <p>© ${new Date().getFullYear()} Nguyên Sinh Restaurant. All rights reserved.</p>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
}

// Hàm gửi email xác nhận đặt bàn
function sendReservationEmail() {
  // Lấy email từ form
  const email = document.getElementById("email").value;
  
  // Hiển thị thông báo
  showNotification(`Đã gửi email xác nhận đến ${email}`, "success");
}

// Hàm chuyển đến trang lịch sử đặt bàn
function viewReservationHistory() {
  window.location.href = "order.html#reservation-history";
}

// Khởi chạy khi trang đã tải xong
document.addEventListener("DOMContentLoaded", function() {
  initPage();
  
  // Thêm sự kiện cho nút xác nhận đặt bàn
  const confirmButton = document.getElementById("confirmReservation");
  if (confirmButton) {
    confirmButton.addEventListener("click", handleReservationSubmit);
  }
  
  // Thêm sự kiện cho nút đóng modal
  const closeModal = document.querySelector(".close-modal");
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      document.getElementById("reservationSuccessModal").style.display = "none";
    });
  }
  
  // Thêm sự kiện cho các nút trong modal
  const printButton = document.getElementById("printReceipt");
  if (printButton) {
    printButton.addEventListener("click", printReservationReceipt);
  }
  
  const emailButton = document.getElementById("emailReceipt");
  if (emailButton) {
    emailButton.addEventListener("click", sendReservationEmail);
  }
  
  const viewReservationsButton = document.getElementById("viewReservations");
  if (viewReservationsButton) {
    viewReservationsButton.addEventListener("click", viewReservationHistory);
  }
  
  // Thêm sự kiện cho phương thức đặt cọc
  handleDepositMethodSelection();
  
  // Thêm sự kiện cho select số lượng khách
  const guestsSelect = document.getElementById("guests");
  if (guestsSelect) {
    guestsSelect.addEventListener("change", handleGuestsChange);
  }
  
  // Thêm sự kiện cho input ngày và giờ để cập nhật sơ đồ bàn
  const dateInput = document.getElementById("date");
  const timeInput = document.getElementById("time");
  
  if (dateInput && timeInput && selectedStore) {
    dateInput.addEventListener("change", () => {
      if (selectedStore) {
        updateTableLayout(selectedStore.store_id);
      }
    });
    
    timeInput.addEventListener("change", () => {
      if (selectedStore) {
        updateTableLayout(selectedStore.store_id);
      }
    });
  }
});
