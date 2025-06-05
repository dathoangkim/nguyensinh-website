// API URL
const API_BASE_URL = "http://localhost:5000/api";

// Hàm để lấy dữ liệu từ API
async function fetchData(url, options = {}) {
  try {
    // Kiểm tra xem URL có phải là đường dẫn tương đối không
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, options)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu từ ${url}:`, error)
    return { success: false, data: [], message: error.message }
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

// Hàm định dạng ngày tháng
function formatDate(dateString) {
  if (!dateString) return "Không xác định";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

// Hàm xử lý URL ảnh sản phẩm được chuyển xuống cuối file để tránh trùng lặp

// Hàm hiển thị thông báo
function showNotification(message, type = "info") {
  // Xóa thông báo cũ nếu có
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  // Tạo thông báo mới
  const notification = document.createElement("div")
  notification.className = `notification ${type}`

  // Thêm icon phù hợp với loại thông báo
  let icon = ""
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>'
      break
    case "error":
      icon = '<i class="fas fa-exclamation-circle"></i>'
      break
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle"></i>'
      break
    default:
      icon = '<i class="fas fa-info-circle"></i>'
  }

  notification.innerHTML = `${icon}${message}`
  document.body.appendChild(notification)

  // Tự động xóa thông báo sau 5 giây
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out forwards"
    setTimeout(() => {
      notification.remove()
    }, 300)
  }, 5000)
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

// Hàm lấy danh sách đặt bàn của người dùng
async function fetchUserReservations() {
  if (!isLoggedIn()) {
    return []
  }

  try {
    const token = getToken()
    const userId = getUserId()
    
    // Sử dụng endpoint đúng với cấu trúc database
    // Thử gọi API với user_id
    const response = await fetchData(`/reservations?user_id=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("Kết quả API đặt bàn:", response)

    if (response.success && response.data && response.data.length > 0) {
      // Nếu API trả về dữ liệu, sử dụng dữ liệu từ API
      // Bổ sung thông tin bàn nếu thiếu
      const reservationsWithTableInfo = response.data.map(reservation => {
        // Nếu thiếu thông tin bàn, bổ sung thông tin mặc định
        if (!reservation.table_number || !reservation.table_type || !reservation.seats) {
          const tableTypes = ["round", "rectangle"]
          const tableSeats = [2, 4, 6, 8]
          
          return {
            ...reservation,
            table_number: reservation.table_number || Math.floor(Math.random() * 20) + 1,
            table_type: reservation.table_type || tableTypes[Math.floor(Math.random() * tableTypes.length)],
            seats: reservation.seats || tableSeats[Math.floor(Math.random() * tableSeats.length)]
          }
        }
        
        return reservation
      })
      
      return reservationsWithTableInfo
    } else {
      console.error("Không thể lấy danh sách đặt bàn:", response)
      try {
        // Gọi API để lấy thông tin chi tiết đặt bàn
        const reservationId = response.data.id;
        const response = await fetchData(`/reservations/${reservationId}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response || !response.success) {
          throw new Error(response?.message || 'Không thể tải thông tin đặt bàn');
        }
        
        // Kiểm tra xem dữ liệu có hợp lệ không
        if (!response.data || (typeof response.data !== 'object')) {
          throw new Error('Dữ liệu đặt bàn không hợp lệ');
        }
        
        // Hiển thị thông tin chi tiết
        displayReservationDetails(response.data);
        
      } catch (error) {
        console.error('Lỗi khi tải thông tin đặt bàn:', error);
        showError(`Đã xảy ra lỗi: ${error.message || 'Không thể tải thông tin đặt bàn'}`);
      }
      return []
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt bàn:", error)
    return []
  }
}

// Hàm lấy danh sách đơn hàng của người dùng
function fetchUserOrders() {
  return new Promise((resolve, reject) => {
    try {
      if (isLoggedIn()) {
        // Người dùng đã đăng nhập - lấy đơn hàng từ API
        const token = getToken();
        const userId = getUserId();
        
        console.log(`Fetching orders for user ${userId} from API...`);
        
        // Sử dụng fetch API để lấy dữ liệu
        fetch(`http://localhost:5000/api/orders/myorders?user_id=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        })
        .then(async (res) => {
          const data = await res.json();
          console.log("API response status:", res.status);
          
          if (!res.ok) {
            console.error("API Error:", data.message || 'Failed to fetch orders');
            throw new Error(data.message || 'Failed to fetch orders');
          }
          
          // Transform the data to match the expected format
          const orders = Array.isArray(data) ? data : (data.data || []);
          console.log(`Found ${orders.length} orders`);
          
          // Process each order to include items and format data
          const processedOrders = await Promise.all(orders.map(async (order) => {
            console.log(`Processing order ${order.order_id || order.id}`);
            try {
              let items = [];
              
              // Check if items are already included in the order
              if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                console.log(`Order ${order.order_id} already has ${order.items.length} items`);
                items = order.items;
              } 
              // Otherwise, try to fetch order items
              else {
                console.log(`Fetching items for order ${order.order_id || order.id}`);
                try {
                  const itemsResponse = await fetch(`http://localhost:5000/api/orders/${order.order_id || order.id}/items`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                    },
                    credentials: 'include'
                  });
                  
                  if (itemsResponse.ok) {
                    const itemsData = await itemsResponse.json();
                    items = Array.isArray(itemsData) ? itemsData : (itemsData.data || []);
                    console.log(`Fetched ${items.length} items for order ${order.order_id}`);
                  } else {
                    console.error(`Failed to fetch items for order ${order.order_id}:`, itemsResponse.status);
                  }
                } catch (e) {
                  console.error(`Error fetching items for order ${order.order_id}:`, e);
                }
              }
              
              // Process items to ensure they have all required fields
              const processedItems = [];
              for (const item of items) {
                try {
                  // If item already has all required fields, use it as is
                  if (item.product_name && item.price !== undefined && item.quantity) {
                    processedItems.push({
                      ...item,
                      product_name: item.product_name,
                      price: parseFloat(item.price || item.unit_price || 0),
                      quantity: parseInt(item.quantity) || 1,
                      image: item.image || item.img_url || '/img/_12A7780.jpg'
                    });
                    continue;
                  }
                  
                  // Otherwise, try to fetch product details
                  if (item.product_id) {
                    console.log(`Fetching product details for product ID: ${item.product_id}`);
                    try {
                      const productResponse = await fetch(`http://localhost:5000/api/products/${item.product_id}`, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Accept': 'application/json'
                        }
                      });
                      
                      if (productResponse.ok) {
                        const productData = await productResponse.json();
                        const product = productData.data || productData;
                        
                        processedItems.push({
                          ...item,
                          product: product,
                          product_name: product.name || product.product_name || 'Sản phẩm không xác định',
                          price: parseFloat(item.unit_price || item.price || product.price || 0),
                          quantity: parseInt(item.quantity) || 1,
                          image: product.img_url || product.image || '/img/_12A7780.jpg'
                        });
                        continue;
                      }
                    } catch (e) {
                      console.error(`Error fetching product ${item.product_id}:`, e);
                    }
                  }
                  
                  // Fallback for items without product_id or when product fetch fails
                  console.log('Using fallback for item:', item);
                  processedItems.push({
                    ...item,
                    product_name: item.product_name || item.name || 'Sản phẩm không xác định',
                    price: parseFloat(item.unit_price || item.price || 0),
                    quantity: parseInt(item.quantity) || 1,
                    image: item.image || item.img_url || '/img/_12A7780.jpg'
                  });
                  
                } catch (e) {
                  console.error('Error processing item:', item, e);
                  // Still add the item with minimal information
                  processedItems.push({
                    ...item,
                    product_name: 'Sản phẩm không xác định',
                    price: 0,
                    quantity: 1,
                    image: '/img/_12A7780.jpg',
                    error: 'Lỗi xử lý sản phẩm'
                  });
                }
              }
              
              // Format order data
              const orderData = {
                id: order.order_id || order.id,
                order_id: order.order_id || order.id,
                order_code: order.order_code || `ORD-${String(order.order_id || order.id).padStart(6, '0')}`,
                user_id: order.user_id || userId,
                status: order.status || 'pending',
                payment_method: order.payment_method || 'cod',
                total_amount: parseFloat(order.total_amount) || 0,
                discount_amount: parseFloat(order.discount_amount) || 0,
                shipping_fee: parseFloat(order.shipping_fee) || 0,
                created_at: order.created_at || new Date().toISOString(),
                updated_at: order.updated_at || new Date().toISOString(),
                items: processedItems,
                item_count: processedItems.length,
                created_at_formatted: order.created_at ? formatDate(order.created_at) : 'Không xác định',
                status_text: getStatusText(order.status || 'pending')
              };
              
              console.log(`Processed order ${orderData.order_id} with ${orderData.items.length} items`);
              return orderData;
              
            } catch (error) {
              console.error(`Error processing order ${order.order_id || order.id}:`, error);
              // Return a minimal order object even if there's an error
              return {
                ...order,
                id: order.id || order.order_id,
                order_id: order.order_id || order.id,
                items: [],
                item_count: 0,
                created_at_formatted: order.created_at ? formatDate(order.created_at) : 'Không xác định',
                status_text: getStatusText(order.status || 'error'),
                error: 'Lỗi xử lý đơn hàng'
              };
            }
          }));
          
          console.log("All orders processed:", processedOrders);
          resolve({ success: true, data: processedOrders });
        })
        .catch(error => {
          console.error("Error in fetchUserOrders API call:", error);
          resolve({ success: false, data: [], error: error.message });
        });
      } else {
        // Người dùng chưa đăng nhập - lấy đơn hàng từ localStorage
        try {
          const guestOrders = [];
          const guestOrderIds = JSON.parse(localStorage.getItem('guestOrderIds') || '[]');
          
          // Thêm thông tin đơn hàng từ localStorage
          for (const orderId of guestOrderIds) {
            const orderData = localStorage.getItem(`order_${orderId}`);
            if (orderData) {
              try {
                const parsedOrder = JSON.parse(orderData);
                // Đảm bảo mỗi đơn hàng có mảng items
                if (!parsedOrder.items) {
                  parsedOrder.items = [];
                }
                guestOrders.push(parsedOrder);
              } catch (e) {
                console.error("Error parsing order data:", e);
              }
            }
          }
          
          console.log("Loaded guest orders from localStorage:", guestOrders);
          resolve({ success: true, data: guestOrders });
        } catch (error) {
          console.error("Error loading guest orders:", error);
          resolve({ success: false, data: [], error: error.message });
        }
      }
    } catch (error) {
      console.error("Error in fetchUserOrders:", error);
      reject(error);
    }
  }).catch(error => {
    console.error("Error in fetchUserOrders promise chain:", error);
    reject(error);
  });
}

// Hàm hủy đơn hàng
async function cancelOrder(orderId) {
  try {
    console.log("Cancelling order:", orderId);
    
    // Lấy trạng thái từ cơ sở dữ liệu nếu có
    let productStatus = "cancelled"; // Mặc định là cancelled
    
    // Kiểm tra xem đơn hàng có phải là đơn hàng của khách không đăng nhập không
    const guestOrderIds = localStorage.getItem('guestOrderIds');
    if (guestOrderIds) {
      const parsedOrderIds = JSON.parse(guestOrderIds);
      if (parsedOrderIds.includes(orderId.toString())) {
        console.log("Found guest order in localStorage");
        // Đây là đơn hàng của khách không đăng nhập, cập nhật trạng thái trong localStorage
        const orderData = localStorage.getItem(`order_${orderId}`);
        if (orderData) {
          const order = JSON.parse(orderData);
          
          // Lưu trạng thái cũ để có thể khôi phục nếu cần
          const oldStatus = order.status;
          
          // Cập nhật trạng thái mới
          order.status = productStatus;
          order.cancelled_at = new Date().toISOString();
          
          // Thêm vào lịch sử trạng thái
          order.status_history = order.status_history || [];
          order.status_history.push({
            status: productStatus,
            timestamp: new Date().toISOString(),
            note: "Đơn hàng đã bị hủy bởi khách hàng"
          });
          
          localStorage.setItem(`order_${orderId}`, JSON.stringify(order));
          
          // Cập nhật UI ngay lập tức
          updateOrderStatusUI(orderId, productStatus);
          
          // Gửi thông tin hủy đơn hàng lên server nếu có guest_info
          if (order.guest_info) {
            try {
              // Lấy thông tin guest từ order
              const guestInfo = typeof order.guest_info === 'string' 
                ? JSON.parse(order.guest_info) 
                : order.guest_info;
              
              // Lấy mã đơn hàng nếu có
              const orderCode = order.order_code || null;
              
              // Gửi request hủy đơn hàng lên server
              const guestCancelResponse = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  isGuest: true,
                  guest_info: guestInfo,
                  email: guestInfo.email,
                  phone: guestInfo.phone,
                  status: productStatus,
                  update_status: true,
                  order_id: orderId,
                  order_code: orderCode,
                  guest_cancel: true
                })
              });
              
              if (guestCancelResponse.ok) {
                const apiResult = await guestCancelResponse.json();
                console.log("Guest cancel API response:", apiResult);
                
                // Nếu API trả về trạng thái khác, cập nhật lại
                if (apiResult.success && apiResult.data && apiResult.data.status) {
                  order.status = apiResult.data.status;
                  localStorage.setItem(`order_${orderId}`, JSON.stringify(order));
                  updateOrderStatusUI(orderId, apiResult.data.status);
                }
              } else {
                console.log("API không trả về thành công, giữ nguyên trạng thái đã cập nhật ở client");
              }
            } catch (guestApiError) {
              console.error("Error updating guest order on server:", guestApiError);
              // Không cần xử lý lỗi này vì đã cập nhật UI và localStorage
            }
          }
          
          return { success: true, message: "Đơn hàng đã được hủy thành công" };
        }
      }
    }
    
    // Kiểm tra đăng nhập và lấy token
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log("Cancelling logged-in user order with token:", token);
      
      // Gọi API với token
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: productStatus,
          update_status: true
        })
      });
      
      // Xử lý response
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        // Nếu token hết hạn hoặc không hợp lệ, thử lại không cần token
        if (response.status === 401) {
          console.log("Token invalid or expired, trying without token...");
          return await cancelOrderWithoutToken(orderId);
        }
        
        try {
          return JSON.parse(errorText);
        } catch (e) {
          return { success: false, message: `Lỗi: ${response.status} ${response.statusText}` };
        }
      }
      
      const result = await response.json();
      console.log("Cancel order API response:", result);
      
      // Cập nhật UI nếu thành công
      if (result.success) {
        // Sử dụng trạng thái từ API nếu có
        const apiStatus = result.data && result.data.status ? result.data.status : productStatus;
        updateOrderStatusUI(orderId, apiStatus);
      }
      
      return result;
    } else {
      // Nếu không có token, thử hủy đơn hàng không cần xác thực
      const result = await cancelOrderWithoutToken(orderId);
      console.log("Cancel order result:", result);
      return result;
    }
  } catch (error) {
    console.error("Lỗi khi hủy đơn hàng:", error);
    return { success: false, message: "Đã xảy ra lỗi khi hủy đơn hàng: " + error.message };
  }
}

// Hàm hủy đơn hàng không cần token
async function cancelOrderWithoutToken(orderId) {
  try {
    console.log("Cancelling order without token");
    
    // Lấy thông tin guest_info từ localStorage nếu có
    let guestInfo = null;
    let email = null;
    let phone = null;
    let orderCode = null;
    
    const orderData = localStorage.getItem(`order_${orderId}`);
    if (!orderData) {
      console.error("Không tìm thấy dữ liệu đơn hàng trong localStorage");
      return { success: false, message: "Không tìm thấy thông tin đơn hàng" };
    }
    
    const order = JSON.parse(orderData);
    
    // Lấy mã đơn hàng nếu có
    if (order.order_code) {
      orderCode = order.order_code;
    }
    
    if (order.guest_info) {
      guestInfo = typeof order.guest_info === 'string' 
        ? JSON.parse(order.guest_info) 
        : order.guest_info;
      
      email = guestInfo.email;
      phone = guestInfo.phone;
    }
    
    // Thử gọi API để hủy đơn hàng
    try {
      console.log("Thử gọi API để hủy đơn hàng");
      
      // Gọi API không cần token
      const requestBody = {
        isGuest: true,
        guest_info: guestInfo,
        email: email,
        phone: phone,
        order_id: orderId,
        order_code: orderCode,
        status: "cancelled",
        update_status: true,
        guest_cancel: true // Thêm flag để API biết đây là yêu cầu hủy từ khách không đăng nhập
      };
      
      console.log("Sending cancel request with body:", requestBody);
      
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Cancel order without token API response:", result);
        
        // Cập nhật trạng thái trong localStorage nếu API thành công
        if (result.success) {
          order.status = "cancelled";
          localStorage.setItem(`order_${orderId}`, JSON.stringify(order));
          
          // Cập nhật UI
          updateOrderStatusUI(orderId, "cancelled");
          return result;
        }
      } else {
        const errorText = await response.text();
        console.error("Error response from no-token cancel:", errorText);
        
        // Nếu API trả về lỗi 401 hoặc bất kỳ lỗi nào khác, tiếp tục xử lý ở phía client
        console.log("API trả về lỗi, tiếp tục xử lý ở phía client");
      }
    } catch (apiError) {
      console.error("Lỗi khi gọi API hủy đơn hàng:", apiError);
      // Tiếp tục xử lý ở phía client nếu có lỗi khi gọi API
    }
    
    // Nếu API không thành công, cập nhật trạng thái trong localStorage
    console.log("Cập nhật trạng thái đơn hàng trong localStorage");
    order.status = "cancelled";
    order.cancelled_at = new Date().toISOString();
    order.status_history = order.status_history || [];
    order.status_history.push({
      status: "cancelled",
      timestamp: new Date().toISOString(),
      note: "Đơn hàng đã bị hủy bởi khách hàng"
    });
    
    localStorage.setItem(`order_${orderId}`, JSON.stringify(order));
    
    // Cập nhật UI
    updateOrderStatusUI(orderId, "cancelled");
    
    // Trả về kết quả thành công cho client
    return { 
      success: true, 
      message: "Đơn hàng đã được hủy thành công", 
      data: { order_id: orderId, status: "cancelled" },
      note: "Đơn hàng đã được hủy ở phía client do không thể kết nối với server"
    };
  } catch (error) {
    console.error("Lỗi khi hủy đơn hàng không cần token:", error);
    return { success: false, message: "Đã xảy ra lỗi khi hủy đơn hàng: " + error.message };
  }
}

// Hàm cập nhật UI trạng thái đơn hàng
function updateOrderStatusUI(orderId, status) {
  console.log(`Updating UI for order ${orderId} with status ${status}`);
  
  // Kiểm tra tham số đầu vào
  if (!orderId || !status) {
    console.error(`Invalid parameters: orderId=${orderId}, status=${status}`);
    return;
  }
  
  // Chuẩn hóa status
  const normalizedStatus = String(status).trim();
  console.log(`Normalized status: "${normalizedStatus}"`);
  
  // Lấy thông tin hiển thị cho trạng thái
  const statusDisplay = getOrderStatusDisplay(normalizedStatus);
  console.log(`Status display for ${normalizedStatus}:`, statusDisplay);
  
  // Tìm phần tử đơn hàng trong DOM
  const orderElement = document.getElementById(`order-${orderId}`);
  if (!orderElement) {
    console.warn(`Order element not found for order ${orderId}`);
    
    // Cập nhật trạng thái trong localStorage ngay cả khi không tìm thấy phần tử trong DOM
    updateOrderStatusInLocalStorage(orderId, normalizedStatus);
    return;
  }
  
  // Cập nhật phần tử trạng thái trong DOM
  const statusElement = orderElement.querySelector('.order-status');
  if (statusElement) {
    // Lấy trạng thái hiện tại
    const currentClass = statusElement.className;
    const currentText = statusElement.textContent.trim();
    
    console.log(`Current status: class="${currentClass}", text="${currentText}"`);
    console.log(`New status: class="${statusDisplay.class}", text="${statusDisplay.text}"`);
    
    // Chỉ cập nhật nếu trạng thái thay đổi
    if (!currentClass.includes(statusDisplay.class) || currentText !== statusDisplay.text) {
      // Cập nhật class và text
      statusElement.className = `order-status ${statusDisplay.class}`;
      statusElement.textContent = statusDisplay.text;
      
      console.log(`Updated status element:`, statusElement);
      
      // Hiển thị thông báo
      showNotification(`Trạng thái đơn hàng #${orderId} đã được cập nhật thành ${statusDisplay.text}`, "info");
    } else {
      console.log(`Status unchanged, skipping UI update`);
    }
  } else {
    console.warn(`Status element not found for order ${orderId}`);
  }
  
  // Cập nhật nút hủy đơn hàng
  updateCancelButton(orderElement, orderId, normalizedStatus);
  
  // Cập nhật trạng thái đơn hàng trong localStorage
  updateOrderStatusInLocalStorage(orderId, normalizedStatus);
  
  // Cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
  updateOrderStatusInDatabase(orderId, normalizedStatus);
  
  // Nếu trạng thái là "preparing", làm mới trang sau 1 giây
  if (normalizedStatus.toLowerCase() === "preparing") {
    setTimeout(() => {
      if (window.location.href.includes('order.html')) {
        console.log("Reloading page to show updated status");
        window.location.reload();
      }
    }, 1000);
  }
}

// Hàm cập nhật nút hủy đơn hàng
function updateCancelButton(orderElement, orderId, status) {
  const cancelButton = orderElement.querySelector('.btn-cancel-order');
  if (cancelButton) {
    if (!canCancelOrder(status)) {
      cancelButton.style.display = 'none';
      console.log(`Hiding cancel button for order ${orderId} (status: ${status})`);
    } else {
      cancelButton.style.display = '';
      console.log(`Showing cancel button for order ${orderId} (status: ${status})`);
    }
  }
}

// Hàm cập nhật trạng thái đơn hàng trong localStorage
function updateOrderStatusInLocalStorage(orderId, status) {
  const orderData = localStorage.getItem(`order_${orderId}`);
  if (!orderData) {
    console.log(`No order data found in localStorage for order ${orderId}`);
    return;
  }
  
  try {
    const order = JSON.parse(orderData);
    if (order.status !== status) {
      console.log(`Updating order ${orderId} status in localStorage from ${order.status} to ${status}`);
      
      // Lưu trạng thái cũ
      const oldStatus = order.status;
      
      // Cập nhật trạng thái mới
      order.status = status;
      
      // Cập nhật lịch sử trạng thái
      order.status_history = order.status_history || [];
      order.status_history.push({
        old_status: oldStatus,
        new_status: status,
        timestamp: new Date().toISOString(),
        note: "Trạng thái được cập nhật từ UI"
      });
      
      // Lưu lại vào localStorage
      localStorage.setItem(`order_${orderId}`, JSON.stringify(order));
      console.log(`Updated order ${orderId} status in localStorage to ${status}`);
    } else {
      console.log(`Order ${orderId} status in localStorage already set to ${status}, skipping update`);
    }
  } catch (error) {
    console.error(`Error updating order ${orderId} in localStorage:`, error);
  }
}

// Hàm cập nhật trạng thái đơn hàng trong cơ sở dữ liệu
async function updateOrderStatusInDatabase(orderId, orderStatus) {
  try {
    console.log(`Updating order status in database for order ${orderId} with status ${orderStatus}`);
    
    // Kiểm tra tham số đầu vào
    if (!orderId || !orderStatus) {
      console.error(`Invalid parameters: orderId=${orderId}, orderStatus=${orderStatus}`);
      return;
    }
    
    // Lấy thông tin đơn hàng từ localStorage
    const orderData = localStorage.getItem(`order_${orderId}`);
    if (!orderData) {
      console.log(`No order data found in localStorage for order ${orderId}`);
      return;
    }
    
    let order;
    try {
      order = JSON.parse(orderData);
    } catch (error) {
      console.error(`Error parsing order data for order ${orderId}:`, error);
      return;
    }
    
    // Kiểm tra xem trạng thái có thay đổi không
    if (order.status === orderStatus) {
      console.log(`Order ${orderId} status already set to ${orderStatus}, skipping database update`);
      return;
    }
    
    // Gọi API để cập nhật trạng thái đơn hàng
    const token = getToken();
    const headers = {
      "Content-Type": "application/json"
    };
    
    // Chuẩn bị dữ liệu cho request
    const requestData = {
      order_id: orderId,
      status: orderStatus,
      update_status: true
    };
    
    // Thêm thông tin khách hàng nếu là khách không đăng nhập
    if (!token && order.guest_info) {
      let guestInfo;
      
      try {
        guestInfo = typeof order.guest_info === 'string' 
          ? JSON.parse(order.guest_info) 
          : order.guest_info;
      } catch (error) {
        console.error(`Error parsing guest_info for order ${orderId}:`, error);
        guestInfo = order.guest_info || {};
      }
      
      requestData.isGuest = true;
      requestData.guest_info = guestInfo;
      requestData.email = guestInfo.email || '';
      requestData.phone = guestInfo.phone || '';
      requestData.order_code = order.order_code || null;
      requestData.guest_cancel = orderStatus.toLowerCase() === "cancelled";
    } else if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Nếu không có token và không có thông tin khách hàng, không thể cập nhật
      console.log(`Cannot update order ${orderId} status: no authentication information`);
      return;
    }
    
    console.log(`Sending update request for order ${orderId}:`, requestData);
    
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/update-status`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Order ${orderId} status update result:`, result);
        
        // Cập nhật trạng thái trong localStorage nếu API trả về trạng thái khác
        if (result.success && result.data && result.data.status) {
          const serverStatus = result.data.status;
          
          if (serverStatus !== orderStatus) {
            console.log(`Server returned different status: ${serverStatus} (requested: ${orderStatus})`);
            
            // Cập nhật trạng thái
            order.status = serverStatus;
            
            // Cập nhật lịch sử trạng thái
            order.status_history = order.status_history || [];
            order.status_history.push({
              old_status: orderStatus,
              new_status: serverStatus,
              timestamp: new Date().toISOString(),
              note: "Trạng thái được cập nhật từ server"
            });
            
            // Lưu lại vào localStorage
            localStorage.setItem(`order_${orderId}`, JSON.stringify(order));
            console.log(`Updated order ${orderId} status in localStorage to ${serverStatus}`);
            
            // Cập nhật UI với trạng thái mới từ server
            updateOrderStatusUI(orderId, serverStatus);
          } else {
            console.log(`Server confirmed status update to ${serverStatus}`);
          }
        }
      } else {
        let errorText;
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `${response.status} ${response.statusText}`;
        }
        console.error(`Error updating order ${orderId} status:`, errorText);
      }
    } catch (fetchError) {
      console.error(`Network error updating order ${orderId} status:`, fetchError);
    }
  } catch (error) {
    console.error(`Error updating order ${orderId} status in database:`, error);
  }
}

// Hàm thêm sản phẩm vào giỏ hàng
async function addToCart(productId, quantity, options = [], note = "") {
  if (isLoggedIn()) {
    try {
      const userId = getUserId()
      const token = getToken()

      const response = typeof fetchData === 'function' && fetchData.length >= 2 
        ? await fetchData("/cart/add", token, {
            method: "POST",
            body: JSON.stringify({
              userId,
              productId,
              quantity,
              options,
              note,
            }),
          })
        : await fetch("http://localhost:5000/api/cart/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId,
              productId,
              quantity,
              options,
              note,
            }),
          }).then(res => res.json())

      return response
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error)
      return { success: false, message: "Đã xảy ra lỗi khi thêm vào giỏ hàng" }
    }
  } else {
    // Nếu chưa đăng nhập, lưu vào localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingProductIndex = cart.findIndex(
      (item) => item.productId === productId && JSON.stringify(item.options || []) === JSON.stringify(options),
    )

    if (existingProductIndex !== -1) {
      // Nếu đã có, cập nhật số lượng
      cart[existingProductIndex].quantity += quantity
    } else {
      // Nếu chưa có, thêm mới
      cart.push({
        productId,
        quantity,
        options,
        note,
      })
    }

    // Lưu giỏ hàng vào localStorage
    localStorage.setItem("cart", JSON.stringify(cart))

    return { success: true, message: "Đã thêm sản phẩm vào giỏ hàng" }
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
    }

    console.log("Order data being sent:", orderData) // Log dữ liệu

    const response = typeof fetchData === 'function' && fetchData.length >= 2 
      ? await fetch(`${API_BASE_URL || "http://localhost:5000/api"}/orders`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(orderData),
        })
      : await fetch("http://localhost:5000/api/orders", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(orderData),
        })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Server error:", errorData)
      return { success: false, message: errorData.error || "Request failed" }
    }

    const data = await response.json()
    console.log("Order created successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error.message)
    return { success: false, message: "Đã xảy ra lỗi khi tạo đơn hàng" }
  }
}

// Hàm hiển thị đơn hàng của khách không đăng nhập
function renderGuestOrders(guestOrders) {
  console.log("Rendering guest orders:", guestOrders);
  
  // Lấy phần tử container
  const ordersListContainer = document.getElementById("orders-list");
  
  // Kiểm tra xem phần tử có tồn tại không
  if (!ordersListContainer) {
    console.error("Orders list container not found");
    alert("Lỗi: Không tìm thấy phần tử orders-list");
    return;
  }
  
  console.log("Orders list container:", ordersListContainer);
  
  // Kiểm tra dữ liệu đơn hàng
  if (!guestOrders || guestOrders.length === 0) {
    console.log("No guest orders to display");
    ordersListContainer.innerHTML = '<p style="text-align: center;">Bạn chưa có đơn hàng nào</p>';
    return;
  }
  
  try {
    // Sắp xếp đơn hàng theo thời gian, mới nhất lên đầu
    guestOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Tạo HTML
    let html = '<h3>Đơn hàng của bạn</h3>';
    
    // Duyệt qua từng đơn hàng
    for (const order of guestOrders) {
      console.log("Processing order:", order);
      
      // Tạo HTML cho các sản phẩm trong đơn hàng
      let productsHtml = '';
      
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const itemPrice = item.unit_price || item.price || 0;
          
          // Sử dụng hàm getProductImageUrl để xử lý ảnh
          const imageUrl = getProductImageUrl(item);
          
          productsHtml += `
            <div class="order-product">
              <div class="order-product-info">
                <img src="${imageUrl}" alt="${item.name || "Sản phẩm"}" class="order-product-image" onerror="this.onerror=null; this.src='/img/_12A7780.jpg';">
                <div>
                  <div>${item.name || "Sản phẩm"}</div>
                  <div>SL: ${item.quantity} x ${formatCurrency(itemPrice)}</div>
                </div>
              </div>
              <div>${formatCurrency(item.quantity * itemPrice)}</div>
            </div>
          `;
        }
      } else {
        productsHtml = '<p>Không có thông tin sản phẩm</p>';
      }
      
      // Sử dụng hàm getOrderStatusDisplay để lấy thông tin hiển thị trạng thái
      const statusDisplay = getOrderStatusDisplay(order.status);
      const statusClass = statusDisplay.class;
      const statusText = statusDisplay.text;
      
      // Xử lý thông tin khách hàng
      let guestInfoHtml = '';
      if (order.guest_info) {
        const guestInfo = typeof order.guest_info === 'string' 
          ? JSON.parse(order.guest_info) 
          : order.guest_info;
        
        guestInfoHtml = `
          <div class="guest-info">
            <strong>Thông tin người đặt:</strong>
            <div>${guestInfo.full_name || 'Không có thông tin'}</div>
            <div>${guestInfo.phone || ''}</div>
            <div>${guestInfo.address || ''}, ${guestInfo.city || ''}</div>
          </div>
        `;
      }
      
      // Tạo HTML cho đơn hàng
      html += `
        <div class="order-item" id="order-${order.order_id}">
          <div class="order-header">
            <div>
              <strong>Mã đơn hàng:</strong> <span data-order-id="${order.order_id}">#${order.order_id}</span>
              <div><small>Ngày đặt: ${formatDate(order.created_at)}</small></div>
            </div>
            <div class="order-status ${statusClass}">${statusText}</div>
          </div>
          <div class="order-products">
            ${productsHtml}
          </div>
          <div class="order-footer">
            <div>
              <strong>Phương thức thanh toán:</strong> ${order.payment_method === "cod" ? "Thanh toán khi nhận hàng" : "Chuyển khoản"}
            </div>
            <div>
              <strong>Tổng tiền:</strong> ${formatCurrency(order.total_amount)}
            </div>
          </div>
          ${guestInfoHtml}
          <div class="order-actions">
            ${canCancelOrder(order.status) ? 
              `<button class="btn-cancel-order" data-order-id="${order.order_id}">Hủy đơn hàng</button>` : 
              ''}
          </div>
        </div>
      `;
    }
    
    // Cập nhật nội dung
    console.log("Setting HTML content:", html);
    ordersListContainer.innerHTML = html;
    ordersListContainer.style.display = "block";
    
    console.log("Guest orders rendered successfully");
    
    // Thêm sự kiện cho các nút hủy đơn hàng
    addCancelOrderEventListeners();
    return; // Kết thúc hàm sau khi hiển thị đơn hàng khách
  } catch (error) {
    console.error("Error rendering guest orders:", error);
    if (ordersListContainer) {
      ordersListContainer.innerHTML = '<div class="error-message">Đã xảy ra lỗi khi tải đơn hàng. Vui lòng thử lại sau.</div>';
    }
    return;
  }
}

// Hàm hiển thị danh sách đơn hàng
function renderOrders(orders) {
  console.log("Rendering orders:", orders);
  const ordersListContainer = document.getElementById("orders-list");

  if (!ordersListContainer) {
    console.error("Orders list container not found");
    return;
  }

  try {
    // Handle case where orders is in data property (API response)
    if (orders && typeof orders === 'object') {
      if (orders.data !== undefined) {
        orders = orders.data; // Handle { success: true, data: [...] } format
      } else if (orders.success !== undefined && !orders.success) {
        // Handle error case
        console.error("Error in orders response:", orders.message || 'Unknown error');
        ordersListContainer.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Không thể tải đơn hàng: ${orders.message || 'Lỗi không xác định'}</p>
          </div>`;
        return;
      }
    }

    // Ensure orders is an array
    if (!Array.isArray(orders)) {
      console.error("Invalid orders data (not an array):", orders);
      ordersListContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Dữ liệu đơn hàng không hợp lệ</p>
        </div>`;
      return;
    }

    if (orders.length === 0) {
      ordersListContainer.innerHTML = `
        <div class="no-orders">
          <i class="fas fa-shopping-bag"></i>
          <p>Bạn chưa có đơn hàng nào</p>
          <a href="/pages/menu.html" class="btn btn-primary">Đặt hàng ngay</a>
        </div>`;
      return;
    }

    // Tạo HTML cho danh sách đơn hàng
    let html = "";
    
    // Sắp xếp đơn hàng theo thời gian tạo, mới nhất lên đầu
    orders.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });

    // Log the full orders data for debugging
    console.log("Full orders data:", JSON.stringify(orders, null, 2));
    
    orders.forEach((order) => {
      console.log("Processing order:", order);
      let productsHtml = "";
      let hasItems = false;
    
      // Log the items structure for debugging
      if (order.items) {
        console.log(`Order #${order.order_id} has ${order.items.length} items`, order.items);
      } else {
        console.log(`Order #${order.order_id} has no items array`);
      }

      // Function to process a single order item
      const processOrderItem = (item) => {
        try {
          if (!item) {
            console.warn("Empty item found, skipping");
            return '';
          }
          
          // Log the item structure for debugging
          console.log("Processing order item:", JSON.stringify(item, null, 2));
          
          // Handle different possible item structures
          const productInfo = item.product || item;
        const imageUrl = getProductImageUrl(productInfo);
        
        // Handle product name - check multiple possible properties
        let itemName = 'Sản phẩm không xác định';
        if (productInfo && productInfo.product_name) itemName = productInfo.product_name;
        else if (productInfo && productInfo.name) itemName = productInfo.name;
        else if (item.product_name) itemName = item.product_name;
        else if (item.name) itemName = item.name;
        
        // Handle quantity and price with fallbacks
        const itemQuantity = parseInt(item.quantity) || 1;
        const itemPrice = parseFloat(item.price || item.unit_price || 
          (productInfo ? (productInfo.price || productInfo.unit_price) : 0) || 0);
        const totalPrice = itemQuantity * itemPrice;
        
        // Get product options if available
        let optionsHtml = '';
        if (item.options && Array.isArray(item.options) && item.options.length > 0) {
          optionsHtml = `
            <div class="order-product-options">
              ${item.options.map(opt => `
                <div class="order-product-option">
                  <span class="option-name">${opt.option_name || 'Tùy chọn'}:</span>
                  <span class="option-value">${opt.value_name || opt.value} 
                    ${opt.additional_price ? `(+${formatCurrency(opt.additional_price)})` : ''}
                  </span>
                </div>`
              ).join('')}
            </div>`;
        }
        
        // Log the values being used
        console.log(`Item details - Name: ${itemName}, Quantity: ${itemQuantity}, Price: ${itemPrice}, Total: ${totalPrice}`);
        
        return `
          <div class="order-product">
            <div class="order-product-info">
              <div class="order-product-image-container">
                <img src="${imageUrl}" alt="${itemName}" class="order-product-image" onerror="this.onerror=null; this.src='/img/_12A7780.jpg';">
              </div>
              <div class="order-product-details">
                <h4 class="order-product-name">${itemName}</h4>
                <div class="order-product-meta">
                  <span class="order-product-quantity">Số lượng: <strong>${itemQuantity}</strong></span>
                  <span class="order-product-price">${formatCurrency(itemPrice)} × ${itemQuantity} = <strong>${formatCurrency(totalPrice)}</strong></span>
                </div>
                ${optionsHtml}
                ${item.note ? `<div class="order-item-note"><i class="fas fa-sticky-note"></i> Ghi chú: ${item.note}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      } catch (e) {
        console.error("Error processing order item:", e);
        return `
          <div class="order-product">
            <div class="order-product-info">
              <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Lỗi hiển thị sản phẩm: ${e.message || 'Không xác định'}</span>
              </div>
            </div>
          </div>
        `;
      }
    };

      try {
        // Check for different possible item structures
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          console.log(`Found ${order.items.length} items in order.items`);
          hasItems = true;
          order.items.forEach((item, index) => {
            if (item) { // Only process if item exists
              console.log(`Processing item ${index + 1}:`, item);
              productsHtml += processOrderItem(item);
            }
          });
        } 
        // Check if order has a direct products array
        else if (order.products && Array.isArray(order.products) && order.products.length > 0) {
          console.log(`Found ${order.products.length} products in order.products`);
          hasItems = true;
          order.products.forEach((product, index) => {
            if (product) { // Only process if product exists
              console.log(`Processing product ${index + 1}:`, product);
              productsHtml += processOrderItem(product);
            }
          });
        }
        // Check if order itself is an array of items (direct items)
        else if (Array.isArray(order)) {
          console.log(`Order is an array with ${order.length} items`);
          hasItems = order.length > 0;
          order.forEach((item, index) => {
            if (item) { // Only process if item exists
              console.log(`Processing direct item ${index + 1}:`, item);
              productsHtml += processOrderItem(item);
            }
          });
        }
        // Check for direct item properties (single item order)
        else if (order.product_id || order.product_name || order.name) {
          console.log("Found single item order");
          hasItems = true;
          productsHtml += processOrderItem(order);
        }
      } catch (e) {
        console.error("Error processing order items:", e);
        productsHtml += `
          <div class="order-product">
            <div class="order-product-info">
              <p class="error-text">Lỗi khi xử lý sản phẩm: ${e.message || 'Lỗi không xác định'}</p>
            </div>
          </div>
        `;
        return productsHtml;
      }

      // If no items were processed, show a default message with order details
      if (!hasItems) {
        console.log("No items found in order, showing default message. Order structure:", order);
        productsHtml = `
          <div class="order-product">
            <div class="order-product-info">
              <div class="no-items-message">
                <div class="no-items-icon">
                  <i class="fas fa-info-circle"></i>
                </div>
                <div class="no-items-content">
                  <h4>Không tìm thấy thông tin sản phẩm</h4>
                  <p>Đơn hàng của bạn đã được nhận nhưng chúng tôi không thể hiển thị chi tiết sản phẩm.</p>
                  <div class="order-meta">
                    <p><strong>Mã đơn hàng:</strong> ${order.order_id || order.id || 'N/A'}</p>
                    <p><strong>Ngày đặt:</strong> ${order.created_at ? formatDate(order.created_at) : 'N/A'}</p>
                    <p><strong>Trạng thái:</strong> ${getStatusText(order.status || 'unknown')}</p>
                    ${order.total_amount ? `<p><strong>Tổng tiền:</strong> ${formatCurrency(order.total_amount)}</p>` : ''}
                    ${order.error ? `<p class="error-text"><i class="fas fa-exclamation-circle"></i> Lỗi: ${order.error}</p>` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Sử dụng hàm getOrderStatusDisplay để lấy thông tin hiển thị trạng thái
      console.log(`Rendering order #${order.order_id} with status: "${order.status}"`);
      
      // Đảm bảo trạng thái không bị null hoặc undefined
      const orderStatus = order.status || "pending";
      
      const statusDisplay = getOrderStatusDisplay(orderStatus);
      console.log(`Status display for order #${order.order_id}:`, statusDisplay);
      
      const statusClass = statusDisplay.class;
      const statusText = statusDisplay.text;

      // Kiểm tra xem đơn hàng có thể hủy không dựa trên trạng thái
      const canCancel = canCancelOrder(order.status)

      // Thêm nút hủy đơn hàng nếu đơn hàng có thể hủy
      const cancelButtonHtml = canCancel
        ? `<button class="btn-cancel-order" data-order-id="${order.order_id}">Hủy đơn hàng</button>`
        : ""

      html += `
        <div class="order-item" id="order-${order.order_id}">
          <div class="order-header">
            <div>
              <strong>Mã đơn hàng:</strong> <span data-order-id="${order.order_id}">#${order.order_id}</span>
              <div><small>Ngày đặt: ${formatDate(order.created_at)}</small></div>
            </div>
            <div class="order-status ${statusClass}">${statusText}</div>
          </div>
          <div class="order-products">
            ${productsHtml}
          </div>
          <div class="order-footer">
            <div>
              <strong>Phương thức thanh toán:</strong> ${order.payment_method === "cod" ? "Thanh toán khi nhận hàng" : "Chuyển khoản"}
            </div>
            <div>
              <strong>Tổng tiền:</strong> ${formatCurrency(order.total_amount)}
            </div>
          </div>
          <div class="order-actions">
            ${cancelButtonHtml}
            <button class="btn-refresh-status" data-order-id="${order.order_id}">
              <i class="fas fa-sync-alt"></i> Cập nhật trạng thái
            </button>
          </div>
        </div>
      `;
    });

    ordersListContainer.innerHTML = html;

    // Thêm sự kiện cho các nút hủy đơn hàng
    addCancelOrderEventListeners();
    
    // Thêm sự kiện cho các nút làm mới trạng thái
    addRefreshStatusEventListeners();
  } catch (error) {
    console.error("Error rendering orders:", error);
    ordersListContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Đã xảy ra lỗi khi tải đơn hàng: ${error.message || 'Lỗi không xác định'}</p>
      </div>`;
  }
}

// Hàm thêm sự kiện cho các nút hủy đơn hàng
function addCancelOrderEventListeners() {
  document.querySelectorAll(".btn-cancel-order").forEach((button) => {
    // Xóa event listener cũ nếu có
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    newButton.addEventListener("click", async function () {
      const orderId = this.dataset.orderId;
      console.log("Cancel button clicked for order:", orderId);

      if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
        // Hiển thị trạng thái đang xử lý
        this.textContent = "Đang hủy...";
        this.disabled = true;

        try {
          // Gọi API hủy đơn hàng
          const result = await cancelOrder(orderId);
          console.log("Cancel order result:", result);

          if (result.success) {
            showNotification("Đã hủy đơn hàng thành công", "success");
            
            // UI đã được cập nhật trong hàm cancelOrder
            // Ẩn nút hủy đơn hàng (đảm bảo)
            this.style.display = 'none';
            
            // Cập nhật trạng thái đơn hàng từ server sau 1 giây
            setTimeout(() => {
              checkOrderStatusDirectly(orderId);
            }, 1000);
            
            // Làm mới trang sau 2 giây để hiển thị trạng thái mới nhất
            setTimeout(() => {
              // Kiểm tra xem người dùng có đang ở trang order không
              if (window.location.href.includes('order.html')) {
                // Tải lại dữ liệu đơn hàng
                if (isLoggedIn()) {
                  fetchUserOrders().then(orders => {
                    renderOrders(orders.data || orders);
                  });
                } else {
                  loadGuestOrders();
                }
              }
            }, 2000);
          } else {
            showNotification(`Không thể hủy đơn hàng: ${result.message || 'Đã xảy ra lỗi'}`, "error");
            // Khôi phục nút
            this.textContent = "Hủy đơn hàng";
            this.disabled = false;
          }
        } catch (error) {
          console.error("Error in cancel order event handler:", error);
          showNotification("Đã xảy ra lỗi khi hủy đơn hàng", "error");
          // Khôi phục nút
          this.textContent = "Hủy đơn hàng";
          this.disabled = false;
        }
      }
    });
  });
}

// Hàm kiểm tra đăng nhập
function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Hàm lấy token
function getToken() {
  return localStorage.getItem('token');
}

// Hàm lấy user ID từ localStorage
function getUserId() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user?.id || null;
}

// Hàm tải đơn hàng của khách không đăng nhập
function loadGuestOrders() {
  try {
    // Lấy danh sách ID đơn hàng từ localStorage
    const guestOrderIds = localStorage.getItem('guestOrderIds');
    if (!guestOrderIds) {
      console.log("No guest order IDs found in localStorage");
      return [];
    }
    
    const orderIds = JSON.parse(guestOrderIds);
    console.log("Guest order IDs:", orderIds);
    
    // Lấy thông tin chi tiết của từng đơn hàng
    const guestOrders = [];
    for (const orderId of orderIds) {
      const orderData = localStorage.getItem(`order_${orderId}`);
      if (orderData) {
        try {
          const order = JSON.parse(orderData);
          guestOrders.push(order);
        } catch (e) {
          console.error(`Error parsing order data for order ${orderId}:`, e);
        }
      }
    }
    
    console.log("Guest orders loaded:", guestOrders);
    
    // Hiển thị đơn hàng
    renderGuestOrders(guestOrders);
    
    return guestOrders;
  } catch (error) {
    console.error("Error loading guest orders:", error);
    return [];
  }
}

// Hàm kiểm tra xem đơn hàng có thể hủy không dựa trên trạng thái
function canCancelOrder(status) {
  if (!status) return true; // Nếu không có trạng thái, cho phép hủy
  
  // Chuyển đổi status thành chữ thường để so sánh không phân biệt hoa thường
  const statusLower = status.toLowerCase();
  
  // Danh sách các trạng thái có thể hủy
  const cancellableStatuses = [
    "pending", "confirmed", "preparing", "processing", 
    "normal", "featured" // Trạng thái từ bảng product
  ];
  
  // Danh sách các trạng thái không thể hủy
  const nonCancellableStatuses = [
    "completed", "cancelled", "delivered", "delivering", "refunded", "failed"
  ];
  
  // Kiểm tra xem trạng thái có trong danh sách có thể hủy không
  if (cancellableStatuses.includes(statusLower)) {
    return true;
  }
  
  // Kiểm tra xem trạng thái có trong danh sách không thể hủy không
  if (nonCancellableStatuses.includes(statusLower)) {
    return false;
  }
  
  // Kiểm tra dựa trên từ khóa trong trạng thái
  // Mặc định không cho phép hủy nếu trạng thái chứa các từ khóa chỉ định
  return !statusLower.includes("cancel") && 
         !statusLower.includes("complet") && 
         !statusLower.includes("deliver") && // Bao gồm cả "delivering"
         !statusLower.includes("refund") &&
         !statusLower.includes("fail") &&
         statusLower !== "delivering"; // Đảm bảo không thể hủy khi đang giao hàng
}

// Hàm lấy thông tin hiển thị cho trạng thái đơn hàng
function getOrderStatusDisplay(status) {
  console.log(`Getting display for status: "${status}" (${typeof status})`);
  
  // Nếu status là null hoặc undefined, sử dụng giá trị mặc định
  if (!status) {
    console.log("Status is null or undefined, using default");
    return { class: "status-pending", text: "Chờ xác nhận" };
  }
  
  // Chuyển đổi status thành chuỗi và chữ thường để so sánh không phân biệt hoa thường
  const statusStr = String(status).trim();
  const statusLower = statusStr.toLowerCase();
  
  console.log(`Normalized status: "${statusLower}"`);
  
  // Xử lý các trạng thái từ cơ sở dữ liệu
  switch (statusLower) {
    // Các trạng thái chuẩn
    case "pending":
      return { class: "status-pending", text: "Chờ xác nhận" };
    case "confirmed":
      return { class: "status-processing", text: "Đã xác nhận" };
    case "preparing":
      return { class: "status-processing", text: "Đang chuẩn bị" };
    case "ready":
      return { class: "status-processing", text: "Sẵn sàng giao hàng" };
    case "delivering":
    case "shipping":
      return { class: "status-processing", text: "Đang giao hàng" };
    case "completed":
    case "complete":
    case "done":
    case "finished":
      return { class: "status-completed", text: "Hoàn thành" };
    case "cancelled":
    case "canceled":
      return { class: "status-cancelled", text: "Đã hủy" };
      
    // Các trạng thái từ bảng product trong cơ sở dữ liệu
    case "normal":
      return { class: "status-normal", text: "Bình thường" };
    case "featured":
      return { class: "status-featured", text: "Nổi bật" };
      
    // Các trạng thái khác có thể có
    case "processing":
      return { class: "status-processing", text: "Đang xử lý" };
    case "shipped":
      return { class: "status-processing", text: "Đã gửi hàng" };
    case "delivered":
      return { class: "status-completed", text: "Đã giao hàng" };
    case "refunded":
      return { class: "status-cancelled", text: "Đã hoàn tiền" };
    case "failed":
      return { class: "status-cancelled", text: "Thất bại" };
    case "rejected":
      return { class: "status-cancelled", text: "Đã từ chối" };
    case "returned":
      return { class: "status-cancelled", text: "Đã trả hàng" };
      
    // Trường hợp mặc định
    default:
      console.log(`Using default case for status: "${statusLower}"`);
      
      // Kiểm tra các từ khóa trong trạng thái
      let statusClass = "status-pending";
      let statusText = statusStr; // Mặc định sử dụng trạng thái gốc
      
      // Xử lý các trường hợp đặc biệt
      if (statusLower.includes("cancel") || statusLower.includes("hủy") || 
          statusLower.includes("reject") || statusLower.includes("từ chối") ||
          statusLower.includes("refund") || statusLower.includes("hoàn tiền") ||
          statusLower.includes("return") || statusLower.includes("trả hàng") ||
          statusLower.includes("fail") || statusLower.includes("thất bại")) {
        statusClass = "status-cancelled";
        
        // Tạo text hiển thị dễ hiểu hơn
        if (statusLower.includes("cancel") || statusLower.includes("hủy")) {
          statusText = "Đã hủy";
        } else if (statusLower.includes("reject") || statusLower.includes("từ chối")) {
          statusText = "Đã từ chối";
        } else if (statusLower.includes("refund") || statusLower.includes("hoàn tiền")) {
          statusText = "Đã hoàn tiền";
        } else if (statusLower.includes("return") || statusLower.includes("trả hàng")) {
          statusText = "Đã trả hàng";
        } else if (statusLower.includes("fail") || statusLower.includes("thất bại")) {
          statusText = "Thất bại";
        }
      } else if (statusLower.includes("complet") || statusLower.includes("done") || 
                 statusLower.includes("finish") || statusLower.includes("hoàn thành")) {
        statusClass = "status-completed";
        statusText = "Hoàn thành";
      } else if (statusLower.includes("process") || statusLower.includes("xử lý") ||
                 statusLower.includes("prepar") || statusLower.includes("chuẩn bị") ||
                 statusLower.includes("deliver") || statusLower.includes("giao hàng") ||
                 statusLower.includes("ship") || statusLower.includes("vận chuyển")) {
        statusClass = "status-processing";
        
        // Tạo text hiển thị dễ hiểu hơn
        if (statusLower.includes("process") || statusLower.includes("xử lý")) {
          statusText = "Đang xử lý";
        } else if (statusLower.includes("prepar") || statusLower.includes("chuẩn bị")) {
          statusText = "Đang chuẩn bị";
        } else if (statusLower.includes("deliver") || statusLower.includes("giao hàng") ||
                  statusLower.includes("ship") || statusLower.includes("vận chuyển")) {
          statusText = "Đang giao hàng";
        }
      } else if (statusLower.includes("pend") || statusLower.includes("wait") || 
                 statusLower.includes("chờ") || statusLower.includes("xác nhận")) {
        statusClass = "status-pending";
        statusText = "Chờ xác nhận";
      }
      
      // Hiển thị trạng thái gốc nếu không khớp với bất kỳ trạng thái nào ở trên
      return { 
        class: statusClass, 
        text: statusText
      };
  }
}

// Hàm lấy đơn hàng của người dùng đã đăng nhập
async function fetchUserOrders() {
  try {
    const token = getToken();
    if (!token) {
      console.log("No token found, user is not logged in");
      return [];
    }
    
    console.log("Fetching user orders with token");
    const response = await fetch("http://localhost:5000/api/orders/myorders", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("User orders data:", data);
    
    // Log the complete response structure for debugging
    console.log("Complete API response:", JSON.stringify(data, null, 2));
    
    // Ensure we have valid orders data
    if (!data || !data.success) {
      console.warn("Invalid or empty orders data:", data);
      return [];
    }
    
    let orders = data.data || [];
    
    // Process each order to ensure items have proper structure
    const processedOrders = orders.map(order => {
      console.log(`Processing order #${order.order_id} with status: ${order.status}`);
      
      // Ensure items array exists and has proper structure
      if (order.items && Array.isArray(order.items)) {
        console.log(`Order #${order.order_id} has ${order.items.length} items`);
        
        order.items = order.items.map(item => {
          // Ensure each item has required properties
          const processedItem = { ...item };
          
          // Map product properties if they exist in the item
          if (item.product_id) processedItem.product_id = item.product_id;
          if (item.name) processedItem.name = item.name;
          if (item.quantity) processedItem.quantity = item.quantity;
          if (item.price) processedItem.price = item.price;
          
          // Handle product image
          if (!processedItem.image && !processedItem.img_url) {
            // Try to get image from product_image or img_url
            if (item.product_image) {
              processedItem.image = item.product_image;
            } else if (item.img_url) {
              processedItem.image = item.img_url;
            } else {
              // Fallback to default image if no image is provided
              processedItem.image = 'https://via.placeholder.com/150';
            }
          }
          
          // Parse options if they exist as JSON string
          if (item.options && typeof item.options === 'string') {
            try {
              processedItem.options = JSON.parse(item.options);
            } catch (e) {
              console.error('Error parsing options:', e);
              processedItem.options = [];
            }
          } else if (!item.options) {
            processedItem.options = [];
          }
          
          console.log(`Processed item:`, processedItem);
          return processedItem;
        });
      } else {
        console.warn(`Order #${order.order_id} has no items array or invalid items`);
        order.items = [];
      }
      
      // Ensure status is set
      if (!order.status) {
        order.status = 'pending';
        console.warn(`Order #${order.order_id} has no status, defaulting to 'pending'`);
      }
      
      // Log status display for debugging
      const statusDisplay = getOrderStatusDisplay(order.status);
      console.log(`Order #${order.order_id} status: ${order.status} -> Display: ${statusDisplay.text}`);
      
      return order;
    });
    
    console.log("=== PROCESSED ORDERS ===");
    console.log(JSON.stringify(processedOrders, null, 2));
    console.log("=== END PROCESSED ORDERS ===");
    
    // Update the data with processed orders
    return { success: true, data: processedOrders };
  } catch (error) {
    console.error("Error fetching user orders:", error);
    showNotification("Không thể tải đơn hàng. Vui lòng thử lại sau.", "error");
    return { success: false, data: [], message: error.message };
  }
}

// Hàm cập nhật trạng thái đơn hàng trong localStorage từ dữ liệu server
function updateLocalOrdersFromServer(serverOrders) {
  if (!serverOrders || !Array.isArray(serverOrders)) return;
  
  console.log("Updating local orders from server data");
  
  // Lấy danh sách đơn hàng của khách không đăng nhập từ localStorage
  const guestOrderIds = localStorage.getItem('guestOrderIds');
  if (!guestOrderIds) return;
  
  const parsedOrderIds = JSON.parse(guestOrderIds);
  if (!parsedOrderIds || !Array.isArray(parsedOrderIds) || parsedOrderIds.length === 0) return;
  
  // Tạo map từ dữ liệu server để dễ dàng tìm kiếm
  const serverOrdersMap = {};
  serverOrders.forEach(order => {
    if (order && order.order_id) {
      serverOrdersMap[order.order_id] = order;
    }
  });
  
  // Kiểm tra và cập nhật từng đơn hàng trong localStorage
  parsedOrderIds.forEach(orderId => {
    const localOrderData = localStorage.getItem(`order_${orderId}`);
    if (!localOrderData) return;
    
    try {
      const localOrder = JSON.parse(localOrderData);
      const serverOrder = serverOrdersMap[orderId];
      
      // Nếu có dữ liệu từ server và trạng thái khác nhau, cập nhật localStorage
      if (serverOrder && serverOrder.status && serverOrder.status !== localOrder.status) {
        console.log(`Updating order ${orderId} status from ${localOrder.status} to ${serverOrder.status}`);
        
        // Cập nhật trạng thái
        localOrder.status = serverOrder.status;
        
        // Cập nhật lịch sử trạng thái nếu có
        if (serverOrder.status_history) {
          localOrder.status_history = serverOrder.status_history;
        } else if (!localOrder.status_history) {
          localOrder.status_history = [{
            status: serverOrder.status,
            timestamp: new Date().toISOString(),
            note: "Trạng thái được cập nhật từ server"
          }];
        } else {
          // Thêm vào lịch sử trạng thái hiện có
          localOrder.status_history.push({
            status: serverOrder.status,
            timestamp: new Date().toISOString(),
            note: "Trạng thái được cập nhật từ server"
          });
        }
        
        // Lưu lại vào localStorage
        localStorage.setItem(`order_${orderId}`, JSON.stringify(localOrder));
        
        // Cập nhật UI
        updateOrderStatusUI(orderId, serverOrder.status);
      }
    } catch (error) {
      console.error(`Error updating local order ${orderId}:`, error);
    }
  });
}

// Khởi tạo khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
  console.log("Order.js: DOM content loaded");
  
  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (isLoggedIn()) {
    console.log("User is logged in, fetching orders");
    // Tải đơn hàng của người dùng đã đăng nhập
    fetchUserOrders().then(orders => {
      console.log("User orders fetched:", orders);
      renderOrders(orders.data || orders);
    }).catch(error => {
      console.error("Error fetching user orders:", error);
      showNotification("Không thể tải đơn hàng. Vui lòng thử lại sau.", "error");
    });
  } else {
    console.log("User is not logged in, loading guest orders");
    // Tải đơn hàng của khách không đăng nhập
    loadGuestOrders();
  }
});

// Hàm chuyển đổi tab
function switchTab(tabId) {
  // Ẩn tất cả các tab
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  // Bỏ active tất cả các nút tab
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Hiển thị tab được chọn
  const selectedTab = document.getElementById(`${tabId}-tab`)
  if (selectedTab) {
    selectedTab.classList.add("active")
  }

  // Active nút tab tương ứng
  const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`)
  if (selectedBtn) {
    selectedBtn.classList.add("active")
  }
  
  // Tải dữ liệu tương ứng với tab
  if (tabId === "reservation-history") {
    loadReservationHistory()
  }
}

// Hàm hiển thị lịch sử đặt bàn
async function loadReservationHistory() {
  const reservationsListContainer = document.getElementById("reservations-list")
  const notLoggedInContainer = document.querySelector("#reservation-history-tab .not-logged-in")
  
  if (!reservationsListContainer) return
  
  // Hiển thị loading
  reservationsListContainer.innerHTML = '<p class="loading-text">Đang tải dữ liệu đặt bàn...</p>'
  
  // Kiểm tra đăng nhập
  if (!isLoggedIn()) {
    reservationsListContainer.innerHTML = ''
    notLoggedInContainer.style.display = "block"
    return
  }
  
  notLoggedInContainer.style.display = "none"
  
  // Lấy danh sách đặt bàn
  const reservations = await fetchUserReservations()
  
  // Hiển thị danh sách đặt bàn
  renderReservations(reservations)
}

// Hàm hiển thị danh sách đặt bàn
function renderReservations(reservations) {
  const reservationsListContainer = document.getElementById("reservations-list")
  
  if (!reservationsListContainer) return
  
  if (!reservations || reservations.length === 0) {
    reservationsListContainer.innerHTML = '<p style="text-align: center;">Bạn chưa có đơn đặt bàn nào</p>'
    return
  }
  
  // Sắp xếp đặt bàn theo thời gian, mới nhất lên đầu
  reservations.sort((a, b) => new Date(b.created_at || b.reservation_date) - new Date(a.created_at || a.reservation_date))
  
  let html = ""
  
  reservations.forEach((reservation) => {
    // Xác định class cho trạng thái đặt bàn
    let statusClass = ""
    switch (reservation.status) {
      case "pending":
        statusClass = "status-pending"
        break
      case "confirmed":
        statusClass = "status-confirmed"
        break
      case "completed":
        statusClass = "status-completed"
        break
      case "cancelled":
        statusClass = "status-cancelled"
        break
      case "no_show":
        statusClass = "status-no-show"
        break
      default:
        statusClass = ""
    }
    
    // Chuyển đổi trạng thái sang tiếng Việt
    let statusText = ""
    switch (reservation.status) {
      case "pending":
        statusText = "Chờ xác nhận"
        break
      case "confirmed":
        statusText = "Đã xác nhận"
        break
      case "completed":
        statusText = "Hoàn thành"
        break
      case "cancelled":
        statusText = "Đã hủy"
        break
      case "no_show":
        statusText = "Không đến"
        break
      default:
        statusText = reservation.status || "Chờ xác nhận"
    }
    
    // Định dạng ngày tháng
    const reservationDate = new Date(reservation.reservation_date)
    const formattedDate = reservationDate.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
    
    html += `
      <div class="reservation-card">
        <div class="reservation-header">
          <div class="reservation-id">Đặt bàn #${reservation.reservation_id}</div>
          <div class="reservation-status ${statusClass}">${statusText}</div>
        </div>
        <div class="reservation-body">
          <div class="reservation-info-row">
            <div class="reservation-label">Cửa hàng:</div>
            <div class="reservation-value">${reservation.store_name || "Chưa xác định"}</div>
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
          <div class="reservation-info-row">
            <div class="reservation-label">Bàn đã đặt:</div>
            <div class="reservation-value">
              ${reservation.table_number ? `Bàn ${reservation.table_number}` : 
                reservation.table_id ? `Bàn ${reservation.table_id}` : "Chưa xác định"}
              ${reservation.table_type ? ` (${reservation.table_type === "round" ? "Bàn tròn" : "Bàn chữ nhật"})` : ""}
            </div>
          </div>
        </div>
        <!-- Đã xóa các nút xem chi tiết -->
      </div>
    `
  })
  
  reservationsListContainer.innerHTML = html
  
  // Đã xóa tất cả các sự kiện liên quan đến nút xem chi tiết và chi tiết đặt bàn
}

function handleViewDetailsClick() {
  // Hàm đã bị xóa
}

// Hàm kiểm tra xem một đối tượng có phải là đối tượng đặt bàn hợp lệ không
function isValidReservation(reservation) {
  return reservation && 
         (reservation.reservation_id || reservation.id) && 
         (reservation.reservation_date || reservation.date);
}

// Hàm xem chi tiết đặt bàn
window.viewReservationDetails = async function(reservationId, event = null) {
  // Ngăn sự kiện click lan ra ngoài
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  // Tạo ID duy nhất cho lần gọi này để dễ debug
  const debugId = `debug-${Date.now()}`;
  
  // Kiểm tra tham số đầu vào
  if (!reservationId) {
    console.error(`[${debugId}] Lỗi: Không có reservationId`);
    showNotification('Không tìm thấy thông tin đặt bàn', 'error');
    return;
  }
  
  // Hiển thị modal loading ngay lập tức
  const modal = document.getElementById('reservationDetailsModal');
  if (!modal) {
    console.error('Không tìm thấy modal reservationDetailsModal');
    showNotification('Không thể hiển thị thông tin đặt bàn', 'error');
    return;
  }
  
  // Đảm bảo modal hiển thị đúng cách
  modal.style.display = 'flex';
  modal.style.alienItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  
  // Tạo nội dung loading
  const loadingContent = document.createElement('div');
  loadingContent.className = 'modal-content';
  loadingContent.style.maxWidth = '500px';
  loadingContent.style.width = '90%';
  loadingContent.style.margin = 'auto';
  loadingContent.style.padding = '20px';
  loadingContent.style.textAlign = 'center';
  loadingContent.innerHTML = `
    <div style="padding: 20px;">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem; margin: 20px 0;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h3>Đang tải thông tin đặt bàn...</h3>
      <p>Vui lòng chờ trong giây lát</p>
    </div>`;
  
  // Xóa nội dung cũ và thêm nội dung mới
  while (modal.firstChild) {
    modal.removeChild(modal.firstChild);
  }
  modal.appendChild(loadingContent);
  
  // Đảm bảo modal hiển thị trên cùng
  document.body.style.overflow = 'hidden'; // Ngăn cuộn trang nền
  modal.style.zIndex = '9999';
  
  // Hàm hiển thị chi tiết đặt bàn
  const displayReservationDetails = (reservation) => {
    const modal = document.getElementById('reservationDetailsModal');
    if (!modal) return;
    
    // Định dạng ngày tháng
    const formatDate = (dateString) => {
      if (!dateString) return 'Chưa xác định';
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('vi-VN', options);
    };
    
    // Định dạng trạng thái
    const getStatusInfo = (status) => {
      const statusMap = {
        'pending': { text: 'Chờ xác nhận', class: 'status-pending' },
        'confirmed': { text: 'Đã xác nhận', class: 'status-confirmed' },
        'completed': { text: 'Hoàn thành', class: 'status-completed' },
        'cancelled': { text: 'Đã hủy', class: 'status-cancelled' },
        'no_show': { text: 'Không đến', class: 'status-no-show' }
      };
      return statusMap[status] || { text: status, class: '' };
    };
    
    // Cập nhật giao diện
    modal.innerHTML = `
      <div class="modal-content invoice-modal">
        <div class="invoice-header">
          <div class="invoice-logo">
            <h2>Nguyên Sinh</h2>
            <p>Bánh Mì Gia Truyền Từ 1942</p>
          </div>
          <div class="invoice-title">
            <h1>HÓA ĐƠN ĐẶT BÀN</h1>
            <p>Mã đặt bàn: <span id="modalReservationId">${reservation.reservation_id || reservation.id || 'N/A'}</span></p>
          </div>
        </div>
        
        <div class="invoice-info">
          <div class="info-section">
            <h3>Thông tin đặt bàn</h3>
            <p><strong>Ngày:</strong> <span id="modalDate">${formatDate(reservation.reservation_date || reservation.date)}</span></p>
            <p><strong>Giờ:</strong> <span id="modalTime">${reservation.reservation_time || '--:--'}</span></p>
            <p><strong>Số người:</strong> <span id="modalGuests">${reservation.guests || reservation.number_of_guests || '1'}</span></p>
            <p><strong>Bàn:</strong> <span id="modalTable">${reservation.table_number || 'Chưa chỉ định'}</span></p>
            <p><strong>Ghi chú:</strong> <span id="modalNotes">${reservation.notes || 'Không có ghi chú'}</span></p>
          </div>
          
          <div class="info-section">
            <h3>Thông tin khách hàng</h3>
            <p><strong>Tên:</strong> ${reservation.customer_name || 'Khách hàng'}</p>
            <p><strong>SĐT:</strong> ${reservation.phone_number || 'Chưa cung cấp'}</p>
            <p><strong>Email:</strong> ${reservation.email || 'Chưa cung cấp'}</p>
          </div>
          
          <div class="info-section">
            <h3>Trạng thái</h3>
            <p><span id="modalReservationStatus" class="status-badge ${getStatusInfo(reservation.status).class}">
              ${getStatusInfo(reservation.status).text}
            </span></p>
            <p><strong>Ngày tạo:</strong> ${formatDate(reservation.created_at)}</p>
            <p><strong>Cập nhật lần cuối:</strong> ${formatDate(reservation.updated_at)}</p>
          </div>
        </div>
        
        <div class="invoice-footer">
          <p>Cảm ơn quý khách đã đặt bàn tại Nguyên Sinh!</p>
          <p>Mọi thắc mắc vui lòng liên hệ: 0909 123 456</p>
        </div>
        
        <div class="modal-buttons">
          <button id="printReservation" class="btn-print">In hóa đơn</button>
          <button id="savePdf" class="btn-save">Lưu PDF</button>
          <button id="closeModal" class="btn-close">Đóng</button>
        </div>
      </div>`;
    
    // Thêm sự kiện cho các nút
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('printReservation')?.addEventListener('click', printInvoice);
    document.getElementById('savePdf')?.addEventListener('click', saveAsPDF);
    
    // Cho phép cuộn lại trang nền
    document.body.style.overflow = 'auto';
  };
  
  // Hàm hiển thị lỗi
  const showError = (message) => {
    const modal = document.getElementById('reservationDetailsModal');
    if (!modal) return;
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; margin: 20px auto; padding: 30px; text-align: center;">
        <div style="font-size: 48px; color: #e74c3c; margin-bottom: 20px;">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h2 style="color: #e74c3c; margin-bottom: 20px;">Đã xảy ra lỗi</h2>
        <p style="margin-bottom: 30px; color: #555;">${message}</p>
        <button id="closeErrorModal" class="btn-close" style="margin: 0 auto;">Đóng</button>
      </div>`;
    
    document.getElementById('closeErrorModal')?.addEventListener('click', closeModal);
    document.body.style.overflow = 'auto';
  };

  try {
    // Lấy thông tin người dùng
    const token = getToken();
    const userId = getUserId();
    
    if (!token || !userId) {
      const errorMsg = 'Bạn cần đăng nhập để xem chi tiết đặt bàn';
      console.error(`[${debugId}] ${errorMsg}`, { token, userId });
      updateLoadingUI('Lỗi xác thực', errorMsg);
      setTimeout(() => {
        showNotification(errorMsg, 'error');
        closeModal();
      }, 1000);
      return;
    }
    
    // Cập nhật giao diện loading
    updateLoadingUI('Đang tải thông tin đặt bàn...');
    addDebugInfo(`Đã xác thực người dùng: ID ${userId}`);
    
    addDebugInfo(`Đã xác thực người dùng: ID ${userId}`);
    
    // Hàm tìm đặt bàn trong danh sách
    const findReservationInList = (reservations) => {
      if (!Array.isArray(reservations)) {
        addDebugInfo('Dữ liệu đặt bàn không phải là mảng');
        return null;
      }
      
      addDebugInfo(`Đang tìm kiếm trong ${reservations.length} đặt bàn...`);
      
      // Thử tìm với nhiều trường ID khác nhau
      const found = reservations.find(r => {
        if (r.reservation_id == reservationId || r.id == reservationId) {
          return true;
        }
        if (r.data && (r.data.reservation_id == reservationId || r.data.id == reservationId)) {
          return true;
        }
        return false;
      });
      
      if (found) {
        addDebugInfo('Tìm thấy đặt bàn trong danh sách');
      } else {
        addDebugInfo('Không tìm thấy đặt bàn trong danh sách');
      }
      
      return found;
    };
    
    // Hàm xử lý khi tìm thấy đặt bàn
    const handleFoundReservation = (reservation, source) => {
      console.log(`Xử lý đặt bàn từ ${source}:`, reservation);
      
      // Kiểm tra nếu reservation có thuộc tính data
      const actualReservation = reservation.data || reservation;
      
      // Kiểm tra xem có phải là đối tượng hợp lệ không
      if (!actualReservation || (!actualReservation.reservation_id && !actualReservation.id)) {
        console.error('Dữ liệu đặt bàn không hợp lệ:', actualReservation);
        updateLoadingUI('Lỗi', 'Dữ liệu đặt bàn không hợp lệ');
        showNotification('Không thể hiển thị thông tin đặt bàn', 'error');
        return;
      }
      
      addDebugInfo(`Tìm thấy đặt bàn từ ${source}`);
      console.log(`[${debugId}] Chi tiết đặt bàn từ ${source}:`, actualReservation);
      
      // Đảm bảo modal hiển thị trước khi cập nhật nội dung
      const modal = document.getElementById('reservationDetailsModal');
      if (modal) {
        modal.style.display = 'flex';
      }
      
      // Gọi hàm hiển thị chi tiết
      displayReservationDetails(actualReservation);
    };
    
    // Hiển thị trạng thái loading
    updateLoadingUI('Đang tải thông tin đặt bàn...');
    
    // Thử lấy từ danh sách đặt bàn đã tải trước đó
    try {
      addDebugInfo('Đang tải danh sách đặt bàn...');
      const allReservations = await fetchUserReservations().catch(e => {
        console.error('Lỗi khi tải danh sách đặt bàn:', e);
        return null;
      });
      
      addDebugInfo(`Đã tải xong ${allReservations ? allReservations.length : 0} đặt bàn`);
      
      if (allReservations && Array.isArray(allReservations)) {
        // Tìm trong danh sách đã tải
        const foundReservation = findReservationInList(allReservations);
        
        if (foundReservation) {
          addDebugInfo('Tìm thấy đặt bàn trong danh sách đã tải');
          handleFoundReservation(foundReservation, 'danh sách đã tải');
          return;
        } else {
          addDebugInfo('Không tìm thấy đặt bàn trong danh sách đã tải');
        }
      } else {
        addDebugInfo('Dữ liệu đặt bàn không hợp lệ từ server');
        console.error(`[${debugId}] Dữ liệu đặt bàn không hợp lệ:`, allReservations);
      }
    } catch (listError) {
      const errorMsg = `Lỗi khi tải danh sách đặt bàn: ${listError.message}`;
      console.warn(`[${debugId}] ${errorMsg}`, listError);
      addDebugInfo(`Cảnh báo: ${errorMsg}`);
    }
    
    // Nếu không tìm thấy trong danh sách, thử gọi API trực tiếp
    addDebugInfo('Đang thử các endpoint API...');
    
    // Danh sách các endpoint có thể thử
    const endpoints = [
      { 
        url: `/reservations/${reservationId}`, 
        method: 'GET',
        description: 'Lấy chi tiết đặt bàn bằng ID',
        processResponse: (data) => data.data || data
      },
      { 
        url: '/reservations/details', 
        method: 'POST', 
        data: { reservation_id: reservationId },
        description: 'Lấy chi tiết đặt bàn bằng POST',
        processResponse: (data) => data.data || data
      },
      { 
        url: `/reservations/user/${userId}`, 
        method: 'GET',
        description: 'Lấy tất cả đặt bàn của người dùng',
        processResponse: (data) => {
          // Xử lý khi API trả về danh sách đặt bàn
          const reservations = data.data || data;
          if (Array.isArray(reservations)) {
            return findReservationInList(reservations);
          }
          return null;
        }
      }
    ];
    
    // Thử lần lượt từng endpoint
    for (const endpoint of endpoints) {
      try {
        // Thêm base URL nếu là đường dẫn tương đối
        const baseUrl = endpoint.url.startsWith('http') ? '' : API_BASE_URL;
        const fullUrl = baseUrl + endpoint.url;
        
        addDebugInfo(`Đang thử: ${endpoint.method} ${fullUrl}`);
        
        const options = {
          method: endpoint.method,
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        };
        
        // Thêm token nếu có
        if (token) {
          options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Thêm dữ liệu body nếu là POST
        if (endpoint.method === 'POST' && endpoint.data) {
          options.body = JSON.stringify(endpoint.data);
        }
        
        addDebugInfo(`Đang gửi yêu cầu đến: ${endpoint.method} ${fullUrl}`);
        
        // Thêm timestamp để tránh cache
        const urlWithTimestamp = fullUrl + (fullUrl.includes('?') ? '&' : '?') + '_=' + Date.now();
        
        const response = await fetch(urlWithTimestamp, options);
        const contentType = response.headers.get('content-type');
        let data;
        
        // Xử lý phản hồi JSON hoặc văn bản
        if (contentType && contentType.includes('application/json')) {
          data = await response.json().catch(e => {
            addDebugInfo(`Lỗi khi phân tích JSON: ${e.message}`);
            return null;
          });
        } else {
          const text = await response.text();
          addDebugInfo(`Phản hồi không phải JSON: ${text.substring(0, 200)}...`);
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { message: text };
          }
        }
        
        // Ghi log chi tiết phản hồi
        console.log(`[${debugId}] Phản hồi từ ${endpoint.method} ${endpoint.url}:`, data);
        
        // Kiểm tra lỗi HTTP
        if (!response.ok) {
          const errorMsg = data?.message || `Lỗi ${response.status}: ${response.statusText}`;
          addDebugInfo(`Lỗi từ server: ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        // Xử lý dữ liệu trả về
        if (data) {
          addDebugInfo(`Nhận được phản hồi từ ${endpoint.url}`);
          
          // Sử dụng hàm xử lý tùy chỉnh nếu có
          let processedData = data;
          if (endpoint.processResponse) {
            try {
              processedData = endpoint.processResponse(data);
            } catch (e) {
              addDebugInfo(`Lỗi khi xử lý phản hồi: ${e.message}`);
              throw e;
            }
          }
          
          // Kiểm tra xem dữ liệu có hợp lệ không
          if (isValidReservation(processedData)) {
            addDebugInfo(`Tìm thấy thông tin đặt bàn từ ${endpoint.url}`);
            handleFoundReservation(processedData, endpoint.description);
            return;
          } else if (Array.isArray(processedData)) {
            // Nếu là mảng, thử tìm đặt bàn trong mảng
            const found = findReservationInList(processedData);
            if (found) {
              addDebugInfo(`Tìm thấy đặt bàn trong mảng từ ${endpoint.url}`);
              handleFoundReservation(found, `${endpoint.description} (tìm trong mảng)`);
              return;
            }
          }
          
          addDebugInfo(`Dữ liệu không hợp lệ từ ${endpoint.url}`);
        } else {
          addDebugInfo(`Không có dữ liệu từ ${endpoint.url}`);
        }
        
      } catch (apiError) {
        const errorMsg = apiError.message || 'Lỗi không xác định';
        addDebugInfo(`Lỗi: ${errorMsg}`);
        console.warn(`[${debugId}] Lỗi khi gọi API:`, apiError);
      }
    }
    
    // Nếu đã thử hết các endpoint mà vẫn không được
    const errorTitle = 'Không thể tải thông tin đặt bàn';
    const errorDetails = 'Vui lòng kiểm tra kết nối mạng và thử lại. Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ bộ phận hỗ trợ.';
    
    console.error(`[${debugId}] ${errorTitle}: ${errorDetails}`);
    
    // Cập nhật giao diện lỗi
    const errorModal = document.getElementById('reservationDetailsModal');
    if (errorModal) {
      // Tạo nội dung lỗi
      const errorContent = document.createElement('div');
      errorContent.className = 'modal-content';
      errorContent.style.maxWidth = '500px';
      errorContent.style.width = '90%';
      errorContent.style.margin = 'auto';
      errorContent.innerHTML = `
        <div class="modal-header">
          <h2>${errorTitle}</h2>
          <span class="close-modal" onclick="closeModal()" style="cursor: pointer; font-size: 24px;">&times;</span>
        </div>
        <div class="modal-body" style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; color: #ff4d4f; margin-bottom: 20px;">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3 style="color: #ff4d4f; margin-bottom: 15px;">Đã xảy ra lỗi</h3>
          <p style="margin-bottom: 20px;">${errorDetails}</p>
          <div style="background: #fff2f0; border: 1px solid #ffccc7; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #666;">
              <strong>Mã lỗi:</strong> ${debugId}
            </p>
          </div>
          <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="window.location.reload()" style="margin: 5px;">
              <i class="fas fa-sync-alt"></i> Tải lại trang
            </button>
            <button class="btn btn-secondary" onclick="closeModal()" style="margin: 5px;">
              <i class="fas fa-times"></i> Đóng
            </button>
          </div>
        </div>`;
      
      // Xóa nội dung cũ và thêm nội dung mới
      while (errorModal.firstChild) {
        errorModal.removeChild(errorModal.firstChild);
      }
      errorModal.appendChild(errorContent);
      
      // Hiển thị thông báo lỗi
      setTimeout(() => {
        showNotification(errorTitle, 'error');
      }, 1000);
    } else {
      // Nếu không tìm thấy modal, hiển thị thông báo thông thường
      showNotification(errorTitle, 'error');
    }
  } catch (error) {
    console.error(`[${debugId}] Lỗi không xác định:`, error);
    
    // Hiển thị thông báo lỗi
    showNotification('Đã xảy ra lỗi khi tải thông tin đặt bàn', 'error');
    
    // Đóng modal nếu có lỗi
    closeModal();
  }
}
function closeModal() {
  const modal = document.getElementById('reservationDetailsModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Cho phép cuộn lại trang nền
  }
}

// Hàm in hóa đơn
function printInvoice() {
  // Lưu trữ nội dung gốc
  const originalContents = document.body.innerHTML;
  
  // Lấy nội dung cần in
  const printContents = document.querySelector('.modal-content')?.outerHTML;
  
  if (!printContents) {
    showNotification('Không thể tìm thấy nội dung để in', 'error');
    return;
  }
  
  // Tạo cửa sổ in mới
  const printWindow = window.open('', '_blank');
  
  // Tạo nội dung in
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>In hóa đơn đặt bàn</title>
      <style>
        @page { size: auto; margin: 10mm; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .modal-content { max-width: 100%; margin: 0; padding: 20px; box-shadow: none; }
        .invoice-header { text-align: center; margin-bottom: 20px; }
        .invoice-logo h2 { color: #d4a76a; margin: 0; }
        .invoice-title h1 { font-size: 20px; margin: 10px 0; text-transform: uppercase; }
        .invoice-info { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
        .info-section { flex: 1; min-width: 200px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
        .info-section h3 { margin-top: 0; color: #d4a76a; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: 600; font-size: 14px; }
        .status-pending { background-color: #ffeeba; color: #856404; }
        .status-confirmed { background-color: #b8daff; color: #004085; }
        .status-completed { background-color: #c3e6cb; color: #155724; }
        .status-cancelled { background-color: #f5c6cb; color: #721c24; }
        .status-no-show { background-color: #d6d8db; color: #1b1e21; }
        .invoice-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-style: italic; }
        .modal-buttons { display: none; } /* Ẩn nút khi in */
      </style>
    </head>
    <body>
      ${printContents}
      <script>
        // Tự động in khi tải xong
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }, 200);
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}

// Hàm lưu hóa đơn dưới dạng PDF
function saveAsPDF() {
  const element = document.querySelector('.modal-content');
  if (!element) {
    showNotification('Không thể tìm thấy nội dung để lưu', 'error');
    return;
  }
  
  // Hiển thị thông báo đang xử lý
  const loadingText = document.createElement('div');
  loadingText.textContent = 'Đang tạo file PDF, vui lòng chờ...';
  loadingText.style.position = 'fixed';
  loadingText.style.top = '20px';
  loadingText.style.left = '50%';
  loadingText.style.transform = 'translateX(-50%)';
  loadingText.style.background = '#4CAF50';
  loadingText.style.color = 'white';
  loadingText.style.padding = '10px 20px';
  loadingText.style.borderRadius = '4px';
  loadingText.style.zIndex = '9999';
  document.body.appendChild(loadingText);
  
  const opt = {
    margin: 10,
    filename: `hoa-don-dat-ban-${document.getElementById('modalReservationId')?.textContent || 'unknown'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: true
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      after: '.invoice-footer' 
    },
    onProgress: function(progress) {
      loadingText.textContent = `Đang tạo file PDF: ${Math.round(progress * 100)}%`;
    }
  };
  
  // Tạo PDF
  html2pdf()
    .set(opt)
    .from(element)
    .save()
    .then(() => {
      // Xóa thông báo khi hoàn thành
      setTimeout(() => {
        document.body.removeChild(loadingText);
      }, 1000);
    })
    .catch(error => {
      console.error('Lỗi khi tạo PDF:', error);
      showNotification('Có lỗi xảy ra khi tạo file PDF', 'error');
      document.body.removeChild(loadingText);
    });
}

// Thêm sự kiện cho các nút trong modal
document.addEventListener('DOMContentLoaded', function() {
  // Đóng modal khi click ra ngoài
  document.getElementById('reservationDetailsModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeModal();
    }
  });
  
  // Nút đóng
  const closeBtn = document.getElementById('closeModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  // Nút in
  const printBtn = document.getElementById('printReservation');
  if (printBtn) {
    printBtn.addEventListener('click', printInvoice);
  }
  
  // Nút lưu PDF
  const savePdfBtn = document.getElementById('savePdf');
  if (savePdfBtn) {
    savePdfBtn.addEventListener('click', saveAsPDF);
  }
});

// Hàm hiển thị chi tiết đặt bàn
function displayReservationDetails(reservation) {
  if (!reservation) {
    showNotification("Không có dữ liệu đặt bàn", "error");
    return;
  }

  try {
    // Hàm tiện ích để lấy giá trị an toàn
    const safeGet = (obj, prop, defaultValue = '') => 
      obj && obj[prop] !== undefined ? obj[prop] : defaultValue;
      
    // Hàm cập nhật nội dung phần tử
    const updateField = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || '-';
      } else {
        console.warn(`Không tìm thấy phần tử với ID: ${id}`);
      }
    };
    

    
    // Cập nhật thông tin cơ bản
    updateField("modalReservationId", safeGet(reservation, 'reservation_id') || safeGet(reservation, 'id') || 'N/A');
    
    // Định dạng ngày tháng
    const dateStr = reservation.reservation_date || reservation.date || reservation.created_at;
    let formattedDate = 'Không xác định';
    
    if (dateStr) {
      try {
        const reservationDate = new Date(dateStr);
        if (!isNaN(reservationDate.getTime())) {
          formattedDate = reservationDate.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });
        }
      } catch (e) {
        console.error("Lỗi khi định dạng ngày:", e);
      }
    }
    
    updateField("modalDate", formattedDate);
    
    // Định dạng giờ
    const timeString = reservation.reservation_time || reservation.time || 'Không xác định';
    updateField("modalTime", timeString);
    
    // Cập nhật số lượng khách
    const guests = reservation.guests || reservation.number_of_guests || 1;
    updateField("modalGuests", `${guests} người`);
    
    // Cập nhật thông tin bàn
    const tableNumber = safeGet(reservation, 'table_number') || safeGet(reservation, 'table_id');
    const tableType = safeGet(reservation, 'table_type') === "round" ? "Bàn tròn" : 
                     safeGet(reservation, 'table_type') ? "Bàn chữ nhật" : "";
    const tableSeats = safeGet(reservation, 'seats') ? `${reservation.seats} chỗ` : 
                      (guests ? `${guests} chỗ` : "");
    
    let tableInfo = tableNumber ? `Bàn ${tableNumber}` : 'Chưa xác định';
    if ((tableType || tableSeats) && tableNumber) {
      tableInfo += ` (${[tableType, tableSeats].filter(Boolean).join(", ")})`;
    } else if (tableType || tableSeats) {
      tableInfo = [tableType, tableSeats].filter(Boolean).join(" - ");
    }
    
    updateField("modalTable", tableInfo);
    updateField("modalNotes", safeGet(reservation, 'notes', 'notes') || 'Không có ghi chú');
    
    // Xử lý thông tin đặt cọc
    let depositText = "";
    const depositMethod = (safeGet(reservation, 'deposit_method') || '').toLowerCase();
    
    if (depositMethod === "none" || !depositMethod) {
      depositText = "Không có đặt cọc";
    } else {
      let methodText = "";
      switch (depositMethod) {
        case "momo":
          methodText = "MoMo";
          break;
        case "bank_transfer":
        case "bank-transfer":
          methodText = "Chuyển khoản";
          break;
        case "credit_card":
        case "credit-card":
          methodText = "Thẻ tín dụng";
          break;
        default:
          methodText = depositMethod;
      }
      
      const depositStatus = (safeGet(reservation, 'deposit_status') || '').toLowerCase();
      let statusText = "";
      
      switch (depositStatus) {
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
        case "canceled":
          statusText = "Đã hủy";
          break;
        default:
          statusText = depositStatus || "Không xác định";
      }
      
      const amount = parseFloat(safeGet(reservation, 'deposit_amount', 0));
      const formattedAmount = !isNaN(amount) ? amount.toLocaleString('vi-VN') : '0';
      depositText = `${methodText} - ${formattedAmount} ₫ (${statusText})`;
    }
    
    updateField("modalDeposit", depositText);
    
    // Cập nhật trạng thái đặt bàn
    const reservationStatus = (safeGet(reservation, 'status') || '').toLowerCase();
    let statusDisplay = "";
    let statusClass = "";
    
    switch (reservationStatus) {
      case "pending":
        statusDisplay = "Chờ xác nhận";
        statusClass = "pending";
        break;
      case "confirmed":
        statusDisplay = "Đã xác nhận";
        statusClass = "confirmed";
        break;
      case "completed":
        statusDisplay = "Hoàn thành";
        statusClass = "completed";
        break;
      case "cancelled":
      case "canceled":
        statusDisplay = "Đã hủy";
        statusClass = "cancelled";
        break;
      case "no_show":
        statusDisplay = "Không đến";
        statusClass = "no-show";
        break;
      default:
        statusDisplay = reservationStatus || "Chưa xác định";
        statusClass = "";
    }
    
    const statusElement = document.getElementById("modalReservationStatus");
    if (statusElement) {
      statusElement.textContent = statusDisplay;
      statusElement.className = `status-badge ${statusClass}`;
    } else {
      console.warn("Không tìm thấy phần tử modalReservationStatus");
    }
    
    // Thêm nút hủy đặt bàn nếu chưa có
    let cancelButton = document.getElementById("cancelReservation");
    if (!cancelButton) {
      const modalButtons = document.querySelector('.modal-buttons');
      if (modalButtons) {
        cancelButton = document.createElement('button');
        cancelButton.id = 'cancelReservation';
        cancelButton.className = 'btn-cancel';
        cancelButton.textContent = 'Hủy đặt bàn';
        modalButtons.insertBefore(cancelButton, modalButtons.firstChild);
      }
    }
    
    // Hiển thị/ẩn nút hủy đặt bàn dựa vào trạng thái
    if (cancelButton) {
      if (reservationStatus === "pending" || reservationStatus === "confirmed") {
        cancelButton.style.display = "inline-block";
        cancelButton.onclick = () => cancelReservation(reservation.reservation_id || reservation.id);
      } else {
        cancelButton.style.display = "none";
      }
    }
    
    // Hiển thị modal
    const modal = document.getElementById("reservationDetailsModal");
    if (modal) {
      modal.style.display = "flex";
    } else {
      console.error("Không tìm thấy modal reservationDetailsModal");
    }
    
  } catch (error) {
    console.error("Lỗi khi hiển thị chi tiết đặt bàn:", error);
    showNotification("Có lỗi xảy ra khi hiển thị thông tin đặt bàn: " + error.message, "error");
    closeModal();
  }
}
async function cancelReservation(reservationId) {
  try {
    if (!confirm("Bạn có chắc chắn muốn hủy đặt bàn này không?")) {
      return
    }
    
    // Lấy token
    const token = getToken()
    
    // Gọi API cập nhật trạng thái
    const response = await fetchData(`/reservations/${reservationId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        status: "cancelled",
        notes: "Hủy bởi khách hàng"
      })
    })
    
    if (!response.success) {
      throw new Error(response.message || "Đã xảy ra lỗi khi hủy đặt bàn")
    }
    
    // Hiển thị thông báo thành công
    showNotification("Đã hủy đặt bàn thành công", "success")
    
    // Đóng modal
    document.getElementById("reservationDetailsModal").style.display = "none"
    
    // Tải lại danh sách đặt bàn
    loadReservationHistory()
    
  } catch (error) {
    console.error("Lỗi khi hủy đặt bàn:", error)
    showNotification(`Không thể hủy đặt bàn: ${error.message}`, "error")
  }
}

// Hàm tính tổng tiền
function calculateTotalPrice() {
  // Giá cơ bản của sản phẩm
  const basePrice = 45000

  // Số lượng
  const quantity = Number.parseInt(document.getElementById("quantity").value) || 1

  // Tính tổng giá các topping được chọn
  let toppingPrice = 0
  document.querySelectorAll('.topping-item input[type="checkbox"]:checked').forEach((checkbox) => {
    toppingPrice += Number.parseInt(checkbox.dataset.price) || 0
  })

  // Tính tổng tiền
  const totalPrice = (basePrice + toppingPrice) * quantity

  // Cập nhật hiển thị
  document.getElementById("total-price").textContent = formatCurrency(totalPrice)

  return totalPrice
}

// Hàm khởi tạo trang
function initPage() {
  console.log("Initializing page styles");
  
  // Thêm CSS cho trang order
  const style = document.createElement("style");
  style.textContent = `
  .order-item {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    padding: 20px;
    transition: transform 0.3s ease;
  }
  
  .order-item:hover {
    transform: translateY(-5px);
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }
  
  .order-status {
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
  }
  
  .status-pending {
    background-color: #ffeaa7;
    color: #d68102;
  }
  
  .status-processing {
    background-color: #81ecec;
    color: #00a8a8;
  }
  
  .status-completed {
    background-color: #55efc4;
    color: #00b894;
  }
  
  .status-cancelled {
    background-color: #fab1a0;
    color: #e17055;
  }
  
  .order-product {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed #eee;
    align-items: center;
  }
  
  .order-product-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .order-product-image {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .order-product:last-child {
    border-bottom: none;
  }
  
  .order-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    font-weight: 500;
  }
  
  .guest-info {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    font-size: 14px;
    color: #666;
  }
  
  .guest-info > div {
    margin-top: 5px;
  }
  
  .highlight {
    animation: highlight-animation 2s ease-in-out;
  }
  
  @keyframes highlight-animation {
    0% { background-color: rgba(255, 235, 59, 0.3); }
    100% { background-color: transparent; }
  }
  
  .order-actions {
    margin-top: 15px;
    display: flex;
    justify-content: flex-end;
  }
  
  .btn-cancel-order {
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.3s;
  }
  
  .btn-cancel-order:hover {
    background-color: #c0392b;
  }
  
  .btn-cancel-order:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
  
  .loading-text {
    text-align: center;
    padding: 20px;
    color: #666;
  }
  
  .empty-message {
    text-align: center;
    padding: 20px;
    color: #666;
    font-style: italic;
  }
  
  .error-message {
    text-align: center;
    padding: 20px;
    color: #e74c3c;
    font-weight: bold;
  }
  `;
  
  document.head.appendChild(style);
  console.log("Page styles initialized");
}

// Hàm khởi tạo trang
function initOrderPage() {
  console.log("Initializing order page");
  
  // Kiểm tra xem trang có phần tử orders-list không
  const ordersListContainer = document.getElementById("orders-list");
  if (!ordersListContainer) {
    console.error("orders-list element not found on page");
    alert("Lỗi: Không tìm thấy phần tử orders-list trên trang");
    return;
  }
  
  console.log("orders-list element found:", ordersListContainer);
  
  // Gắn sự kiện cho các nút tab
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      switchTab(tabId);
    });
  });
  
  // Kiểm tra xem có tham số id trong URL không (để hiển thị chi tiết đơn hàng)
  const urlParams = new URLSearchParams
(window.location.search);
  const orderId = urlParams.get("id");
  
  // Hiển thị loading
  ordersListContainer.innerHTML = '<p class="loading-text">Đang tải dữ liệu đơn hàng...</p>';
  
  // Tải dữ liệu đơn hàng
  console.log("Fetching orders...");
  
  // Kiểm tra xem có đơn hàng trong localStorage không
  console.log("Checking for guest orders...");
  

  ordersListContainer.innerHTML = '<p class="loading-text">Đang tải dữ liệu đơn hàng...</p>';
  
  // Kiểm tra đơn hàng của khách không đăng nhập
  if (!isLoggedIn()) {
    console.log("User is not logged in, checking localStorage for orders");
    
    try {
      // Lấy danh sách ID đơn hàng từ localStorage
      const localOrderIdsStr = localStorage.getItem('guestOrderIds');
      console.log("Local order IDs string:", localOrderIdsStr);
      
      if (localOrderIdsStr) {
        const guestOrders = JSON.parse(localOrderIdsStr);
        console.log("Parsed guest orders:", guestOrders);
        
        if (guestOrders && guestOrders.length > 0) {
          // Lấy thông tin đơn hàng từ localStorage
          const guestOrdersData = [];
          
          for (const orderId of guestOrders) {
            const orderDataStr = localStorage.getItem(`order_${orderId}`);
            console.log(`Order data for ${orderId}:`, orderDataStr);
            
            if (orderDataStr) {
              try {
                const parsedOrder = JSON.parse(orderDataStr);
                console.log("Parsed order:", parsedOrder);
                guestOrdersData.push(parsedOrder);
              } catch (e) {
                console.error("Error parsing order data:", e);
              }
            }
          }
          
          if (guestOrdersData.length > 0) {
            // Hiển thị đơn hàng từ localStorage
            console.log("Rendering guest orders:", guestOrdersData);
            renderGuestOrders(guestOrdersData);
            
            // Hiển thị thông báo khuyến khích đăng nhập
            const notLoggedInElement = document.querySelector(".not-logged-in");
            if (notLoggedInElement) {
              notLoggedInElement.style.display = "block";
            }
            
            // Nếu có orderId trong URL, cuộn đến đơn hàng đó
            if (orderId) {
              setTimeout(() => {
                const orderElement = document.getElementById(`order-${orderId}`);
                if (orderElement) {
                  orderElement.scrollIntoView({ behavior: "smooth", block: "center" });
                  orderElement.classList.add("highlight");
                }
              }, 500);
            }
            
            return; // Thoát khỏi hàm sau khi hiển thị đơn hàng
          }
        }
      }
      
      // Không có đơn hàng và chưa đăng nhập
      ordersListContainer.innerHTML = '<p class="empty-message">Bạn chưa có đơn hàng nào</p>';
      
      // Hiển thị thông báo chưa đăng nhập
      const notLoggedInElement = document.querySelector(".not-logged-in");
      if (notLoggedInElement) {
        notLoggedInElement.style.display = "block";
      }
      
    } catch (e) {
      console.error("Error processing guest orders:", e);
      ordersListContainer.innerHTML = '<p class="empty-message">Đã xảy ra lỗi khi tải dữ liệu đơn hàng</p>';
    }
    
    return; // Thoát khỏi hàm nếu người dùng chưa đăng nhập
  }
  // Người dùng đã đăng nhập - lấy đơn hàng từ API
  if (isLoggedIn()) {
    console.log("User is logged in, fetching orders from API");
    
    fetchUserOrders().then(orders => {
      console.log("Orders fetched:", orders);
      
      if (orders && orders.success && orders.data && orders.data.length > 0) {
        // Hiển thị danh sách đơn hàng
        renderOrders(orders.data);
        
        // Ẩn thông báo chưa đăng nhập
        const notLoggedInElement = document.querySelector(".not-logged-in");
        if (notLoggedInElement) {
          notLoggedInElement.style.display = "none";
        }
        
        // Nếu có orderId trong URL, cuộn đến đơn hàng đó
        if (orderId) {
          setTimeout(() => {
            const orderElement = document.getElementById(`order-${orderId}`);
            if (orderElement) {
              orderElement.scrollIntoView({ behavior: "smooth", block: "center" });
              orderElement.classList.add("highlight");
            }
          }, 500);
        }
      } else {
        // Đã đăng nhập nhưng không có đơn hàng
        ordersListContainer.innerHTML = '<p class="empty-message">Bạn chưa có đơn hàng nào</p>';
      }
    }).catch(error => {
      console.error("Error fetching orders:", error);
      ordersListContainer.innerHTML = '<p class="empty-message">Không thể tải dữ liệu đơn hàng</p>';
    });
  }
  
  // Tải dữ liệu đặt bàn nếu người dùng đã đăng nhập
  if (isLoggedIn()) {
    console.log("Fetching reservations...");
    
    // Hiển thị loading cho tab đặt bàn
    const reservationsContainer = document.getElementById("reservations-list");
    if (reservationsContainer) {
      reservationsContainer.innerHTML = '<p class="loading-text">Đang tải dữ liệu đặt bàn...</p>';
    }
    
    // Gọi API lấy dữ liệu đặt bàn
    fetchUserReservations().then(reservations => {
      console.log("Reservations fetched:", reservations);
      renderReservations(reservations);
    }).catch(error => {
      console.error("Error fetching reservations:", error);
      if (reservationsContainer) {
        reservationsContainer.innerHTML = '<p class="empty-message">Không thể tải dữ liệu đặt bàn</p>';
      }
    });
  } else {
    // Nếu chưa đăng nhập, hiển thị thông báo
    const reservationsContainer = document.getElementById("reservations-list");
    if (reservationsContainer) {
      reservationsContainer.innerHTML = '<p class="empty-message">Vui lòng đăng nhập để xem lịch sử đặt bàn</p>';
    }
  }
  
  // Đóng modal khi nhấp vào nút đóng
  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Đóng modal khi nhấp bên ngoài
  window.addEventListener('click', function(event) {
    document.querySelectorAll('.modal').forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// Khởi chạy khi trang đã tải xong
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM loaded - starting initialization");
  
  // Thêm CSS cho trang
  initPage();
  
  // Kiểm tra xem trang có phần tử orders-list không
  const ordersListContainer = document.getElementById("orders-list");
  if (!ordersListContainer) {
    console.error("orders-list element not found on page");
    alert("Lỗi: Không tìm thấy phần tử orders-list trên trang");
    return;
  }
  
  console.log("orders-list element found:", ordersListContainer);
  
  // Lắng nghe sự kiện đăng nhập để cập nhật giao diện
  document.addEventListener('login', function() {
    console.log('Đã nhận sự kiện đăng nhập, cập nhật giao diện');
    // Tải lại dữ liệu đơn hàng
    loadOrdersData();
    
    // Tải lại dữ liệu đặt bàn
    loadReservationsData();
  });
  
  // Lắng nghe sự kiện đăng xuất để cập nhật giao diện
  document.addEventListener('logout', function() {
    console.log('Đã nhận sự kiện đăng xuất, cập nhật giao diện');
    // Cập nhật giao diện khi đăng xuất
    const ordersContainer = document.getElementById("orders-list");
    if (ordersContainer) {
      ordersContainer.innerHTML = '<p class="empty-message">Vui lòng đăng nhập để xem lịch sử đơn hàng</p>';
    }
    
    const reservationsContainer = document.getElementById("reservations-list");
    if (reservationsContainer) {
      reservationsContainer.innerHTML = '<p class="empty-message">Vui lòng đăng nhập để xem lịch sử đặt bàn</p>';
    }
  });
  
  // Kiểm tra xem localStorage có hoạt động không
  try {
    localStorage.setItem('test', 'test');
    const testValue = localStorage.getItem('test');
    console.log("localStorage test:", testValue);
    
    if (testValue !== 'test') {
      console.error("localStorage is not working properly");
      alert("Lỗi: localStorage không hoạt động đúng");
    } else {
      localStorage.removeItem('test');
      console.log("localStorage is working properly");
      
      // Xóa tất cả đơn hàng mẫu cũ
      console.log("Cleaning up sample orders from localStorage...");
      const guestOrderIds = localStorage.getItem('guestOrderIds');
      if (guestOrderIds) {
        try {
          const parsedOrderIds = JSON.parse(guestOrderIds);
          console.log("Found guest order IDs:", parsedOrderIds);
          
          if (parsedOrderIds && parsedOrderIds.length > 0) {
            // Xóa từng đơn hàng mẫu
            let removedCount = 0;
            for (const orderId of parsedOrderIds) {
              const orderIdStr = String(orderId || '');
              if (orderIdStr.startsWith('sample-')) {
                localStorage.removeItem(`order_${orderIdStr}`);
                console.log(`Removed sample order: ${orderIdStr}`);
                removedCount++;
              }
            }
            
            // Lọc ra các đơn hàng không phải mẫu
            const filteredOrderIds = parsedOrderIds.filter(id => !String(id || '').startsWith('sample-'));
            localStorage.setItem('guestOrderIds', JSON.stringify(filteredOrderIds));
            
            console.log(`Removed ${removedCount} sample orders. Remaining orders: ${filteredOrderIds.length}`);
          }
        } catch (e) {
          console.error("Error cleaning up sample orders:", e);
        }
      }
    }
  } catch (error) {
    console.error("Error testing localStorage:", error);
    alert("Lỗi: Không thể sử dụng localStorage - " + error.message);
  }
  
  // Khởi tạo trang
  try {
    console.log("Initializing order page");
    initOrderPage();
  } catch (error) {
    console.error("Error initializing order page:", error);
  }
  
  // Kiểm tra URL để xác định tab hiển thị
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');
  
  if (tab === "reservations") {
    // Chuyển sang tab đặt bàn
    const reservationTabBtn = document.querySelector('.tab-btn[data-tab="reservation-history"]');
    if (reservationTabBtn) {
      reservationTabBtn.click();
    }
  }
  
  // Gắn sự kiện cho các checkbox topping
  document.querySelectorAll('.topping-item input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", calculateTotalPrice);
  });
  
  // Gắn sự kiện cho nút tăng giảm số lượng
  const decreaseBtn = document.querySelector(".quantity-btn.decrease");
  if (decreaseBtn) {
    decreaseBtn.addEventListener("click", () => {
      const input = document.getElementById("quantity");
      if (input.value > 1) {
        input.value = Number.parseInt(input.value) - 1;
        calculateTotalPrice();
      }
    });
  }
  
  const increaseBtn = document.querySelector(".quantity-btn.increase");
  if (increaseBtn) {
    increaseBtn.addEventListener("click", () => {
      const input = document.getElementById("quantity");
      input.value = Number.parseInt(input.value) + 1;
      calculateTotalPrice();
    });
  }
  
  const quantityInput = document.getElementById("quantity");
  if (quantityInput) {
    quantityInput.addEventListener("change", calculateTotalPrice);
  }
  
  // Gắn sự kiện cho nút thêm vào giỏ
  const addToCartBtn = document.getElementById("add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", async () => {
      // Lấy thông tin sản phẩm
      const productId = 1; // Giả sử ID sản phẩm là 1 (Bánh Mì Đặc Biệt)
      const quantity = Number.parseInt(document.getElementById("quantity").value) || 1;
      const note = document.getElementById("order-note").value;
      
      // Lấy các topping được chọn
      const options = [];
      document.querySelectorAll('.topping-item input[type="checkbox"]:checked').forEach((checkbox) => {
        options.push({
          name: checkbox.value,
          price: Number.parseInt(checkbox.dataset.price) || 0,
        });
      });
      
      // Thêm vào giỏ hàng
      const result = await addToCart(productId, quantity, options, note);
      
      if (result.success) {
        alert("Đã thêm sản phẩm vào giỏ hàng");
        
        // Cập nhật hiển thị giỏ hàng nếu có
        if (window.updateCartDisplay) {
          window.updateCartDisplay();
        }
      } else {
        alert(`Không thể thêm sản phẩm vào giỏ hàng: ${result.message}`);
      }
    });
  }
  
  // Gắn sự kiện cho nút đặt hàng ngay
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      // Chuyển hướng đến trang thanh toán
      window.location.href = "checkout.html";
    });
  }
  
  // Tính tổng tiền ban đầu nếu đang ở tab đặt hàng mới
  if (document.getElementById("total-price")) {
    calculateTotalPrice();
  }
  
  // Gắn sự kiện cho các nút tab
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      switchTab(tabId);
      
      if (tabId === "reservation-history" && typeof loadUserReservations === "function") {
        loadUserReservations();
      }
    });
  });
  
  // Kiểm tra URL hash để chuyển đến tab tương ứng
  if (window.location.hash) {
    const hash = window.location.hash.substring(1); // Bỏ dấu # ở đầu
    
    // Nếu hash là reservation-history, chuyển đến tab lịch sử đặt bàn
    if (hash === "reservation-history") {
      switchTab("reservation-history");
      
      // Tải dữ liệu đặt bàn nếu hàm loadUserReservations tồn tại
      if (typeof loadUserReservations === "function") {
        loadUserReservations();
      }
    }
  }
});

/**
 * Hàm xử lý URL ảnh sản phẩm
 * @param {Object} item - Đối tượng sản phẩm hoặc đơn hàng
 * @returns {string} URL ảnh sản phẩm
 */
function getProductImageUrl(item) {
  // Nếu item không tồn tại hoặc không phải là object, trả về ảnh mặc định
  if (!item || typeof item !== 'object') {
    console.log("Item không hợp lệ, sử dụng ảnh mặc định");
    return '/img/_12A7780.jpg';
  }
  
  console.log("Xử lý ảnh cho item:", item);
  
  // Danh sách các trường có thể chứa ảnh
  const possibleImageFields = [
    'image_url', 'imageUrl', 'image', 'img_url', 'img',
    'product_image', 'productImage', 'thumbnail', 'thumb', 'url', 'src'
  ];
  
  // Kiểm tra các trường ảnh trực tiếp
  for (const field of possibleImageFields) {
    if (item[field] && typeof item[field] === 'string' && item[field].trim() !== '') {
      const url = item[field].trim();
      if (isValidImageUrl(url)) {
        console.log(`Tìm thấy ảnh từ trường ${field}:`, url);
        return ensureAbsoluteUrl(url);
      }
    }
  }
  
  // Kiểm tra nếu có product_id, thử lấy ảnh từ danh sách ảnh sản phẩm đã biết
  const productId = item.product_id || (item.product && item.product.id) || null;
  if (productId) {
    // Danh sách ảnh sản phẩm từ cơ sở dữ liệu (hardcoded từ banh_mi_db.sql)
    const knownProductImages = {
      1: 'https://scontent.fhan20-1.fna.fbcdn.net/v/t39.30808-6/490327908_1096101562533996_6512511071276964253_n.jpg',
      2: 'https://i.pinimg.com/originals/1d/ca/e2/1dcae24d4745985753e71e2595f1d4a2.jpg',
      3: 'http://foodisafourletterword.com/wp-content/uploads/2020/11/Vietnamese_Chicken_Banh_Mi_Recipe_Banh_Mi_Ga_Roti_new2.jpg',
      4: 'https://tse4.mm.bing.net/th?id=OIP.uKIch3Ve_b_E1Zi6pVhx5QHaGP&pid=Api',
      5: 'https://tse3.mm.bing.net/th?id=OIP.W1MzvSxrB77NDqWi3z4KMQHaFn&pid=Api',
      6: 'https://tse4.mm.bing.net/th?id=OIP.Dp_OyC899S63pJH3YWqpuAHaEK&pid=Api'
    };
    
    if (knownProductImages[productId]) {
      console.log("Tìm thấy ảnh từ danh sách đã biết cho product_id:", productId);
      return knownProductImages[productId];
    }
  }
  
  // Kiểm tra trường images (có thể là mảng hoặc chuỗi JSON)
  if (item.images) {
    try {
      // Nếu images là chuỗi, thử parse thành JSON
      const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
      
      if (Array.isArray(images) && images.length > 0) {
        // Lấy ảnh đầu tiên
        const firstImage = images[0];
        
        // Nếu là chuỗi
        if (typeof firstImage === 'string' && firstImage.trim() !== '') {
          const url = firstImage.trim();
          if (isValidImageUrl(url)) {
            console.log("Tìm thấy ảnh từ mảng images:", url);
            return ensureAbsoluteUrl(url);
          }
        } 
        // Nếu là object
        else if (firstImage && typeof firstImage === 'object') {
          // Kiểm tra các trường ảnh thông thường
          const imageFields = ['url', 'src', 'path', 'image_url', 'image'];
          for (const field of imageFields) {
            if (firstImage[field] && typeof firstImage[field] === 'string' && firstImage[field].trim() !== '') {
              const url = firstImage[field].trim();
              if (isValidImageUrl(url)) {
                console.log(`Tìm thấy ảnh từ firstImage.${field}:`, url);
                return ensureAbsoluteUrl(url);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Lỗi khi xử lý trường images:", e);
    }
  }
  
  // Kiểm tra trường product (nếu có)
  if (item.product && typeof item.product === 'object') {
    const productImage = getProductImageUrl(item.product);
    if (productImage !== '/img/_12A7780.jpg') {
      return productImage;
    }
  }
  
  // Nếu không tìm thấy ảnh, sử dụng ảnh mặc định
  console.log("Không tìm thấy ảnh phù hợp, sử dụng ảnh mặc định");
  return '/img/_12A7780.jpg';
}

/**
 * Kiểm tra xem URL ảnh có hợp lệ không
 * @param {string} url - URL cần kiểm tra
 * @returns {boolean} true nếu hợp lệ, ngược lại false
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Loại bỏ khoảng trắng ở đầu và cuối
  url = url.trim();
  if (!url) return false;
  
  // Kiểm tra định dạng URL
  try {
    // Nếu là đường dẫn tương đối hoặc tuyệt đối
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    
    // Kiểm tra URL tuyệt đối
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Đảm bảo URL ảnh là tuyệt đối
 * @param {string} url - URL cần xử lý
 * @returns {string} URL đã được xử lý
 */
function ensureAbsoluteUrl(url) {
  if (!url) return '/img/_12A7780.jpg';
  
  // Loại bỏ khoảng trắng ở đầu và cuối
  url = url.trim();
  
  // Nếu URL đã bắt đầu bằng http hoặc / thì giữ nguyên
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:image')) {
    return url;
  }
  
  // Nếu URL bắt đầu bằng / thì trả về nguyên bản
  if (url.startsWith('/')) {
    return url;
  }
  
  // Thêm / vào đầu nếu cần thiết
  if (!url.startsWith('/')) {
    url = `/${url}`;
  }
  
  // Thêm tiền tố /img/ nếu cần
  if (!url.startsWith('/img/') && !url.startsWith('/uploads/')) {
    url = `/img${url}`;
  }
  
  console.log("Chuẩn hóa URL ảnh:", url);
  return url;
}

// Hàm cập nhật hiển thị giỏ hàng (nếu cần thiết)
function updateCartDisplay() {
  // Cập nhật số lượng sản phẩm trong giỏ hàng trên header
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Cập nhật badge số lượng
  const cartBadge = document.querySelector('.cart-count');
  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }
}

// Hàm kiểm tra và làm sạch dữ liệu đơn hàng cũ
function cleanupOldOrders() {
  try {
    const guestOrderIds = localStorage.getItem('guestOrderIds');
    if (!guestOrderIds) return;
    
    const orderIds = JSON.parse(guestOrderIds);
    const validOrderIds = [];
    
    // Kiểm tra từng đơn hàng
    for (const orderId of orderIds) {
      const orderData = localStorage.getItem(`order_${orderId}`);
      if (orderData) {
        try {
          const order = JSON.parse(orderData);
          // Kiểm tra xem đơn hàng có hợp lệ không
          if (order.order_id && order.created_at) {
            validOrderIds.push(orderId);
          } else {
            // Xóa đơn hàng không hợp lệ
            localStorage.removeItem(`order_${orderId}`);
            console.log(`Removed invalid order: ${orderId}`);
          }
        } catch (e) {
          // Xóa dữ liệu bị lỗi
          localStorage.removeItem(`order_${orderId}`);
          console.log(`Removed corrupted order data: ${orderId}`);
        }
      }
    }
    
    // Cập nhật danh sách ID đơn hàng hợp lệ
    localStorage.setItem('guestOrderIds', JSON.stringify(validOrderIds));
    console.log(`Cleaned up orders. Valid orders remaining: ${validOrderIds.length}`);
    
  } catch (error) {
    console.error("Error cleaning up old orders:", error);
  }
}

// Hàm kiểm tra trạng thái đăng nhập và cập nhật UI
function updateLoginStatus() {
  const isUserLoggedIn = isLoggedIn();
  const notLoggedInElements = document.querySelectorAll('.not-logged-in');
  
  notLoggedInElements.forEach(element => {
    if (isUserLoggedIn) {
      element.style.display = 'none';
    } else {
      element.style.display = 'block';
    }
  });
}

// Hàm xử lý khi người dùng đăng xuất
function handleLogout() {
  // Xóa thông tin đăng nhập
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Cập nhật UI
  updateLoginStatus();
  
  // Tải lại đơn hàng của khách không đăng nhập
  loadGuestOrders();
  
  // Hiển thị thông báo
  showNotification("Đã đăng xuất thành công", "success");
}

// Hàm xử lý khi người dùng đăng nhập
function handleLogin() {
  // Cập nhật UI
  updateLoginStatus();
  
  // Tải lại đơn hàng của người dùng đã đăng nhập
  if (isLoggedIn()) {
    fetchUserOrders().then(orders => {
      renderOrders(orders.data || orders);
    }).catch(error => {
      console.error("Error fetching user orders after login:", error);
    });
  }
  
  // Hiển thị thông báo
  showNotification("Đăng nhập thành công", "success");
}

// Hàm kiểm tra và xử lý URL parameters
function handleUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Kiểm tra có thông báo thành công không
  const successMessage = urlParams.get('success');
  if (successMessage) {
    showNotification(decodeURIComponent(successMessage), "success");
    
    // Xóa parameter khỏi URL
    urlParams.delete('success');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
    window.history.replaceState({}, document.title, newUrl);
  }
  
  // Kiểm tra có thông báo lỗi không
  const errorMessage = urlParams.get('error');
  if (errorMessage) {
    showNotification(decodeURIComponent(errorMessage), "error");
    
    // Xóa parameter khỏi URL
    urlParams.delete('error');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
    window.history.replaceState({}, document.title, newUrl);
  }
  
  // Kiểm tra có order ID để highlight không
  const orderId = urlParams.get('id');
  if (orderId) {
    setTimeout(() => {
      const orderElement = document.getElementById(`order-${orderId}`);
      if (orderElement) {
        orderElement.scrollIntoView({ behavior: "smooth", block: "center" });
        orderElement.classList.add("highlight");
        
        // Xóa highlight sau 3 giây
        setTimeout(() => {
          orderElement.classList.remove("highlight");
        }, 3000);
      }
    }, 1000);
  }
}

// Hàm khởi tạo event listeners
function initEventListeners() {
  // Event listener cho việc thay đổi trạng thái đăng nhập
  window.addEventListener('storage', function(e) {
    if (e.key === 'token' || e.key === 'user') {
      // Trạng thái đăng nhập đã thay đổi
      updateLoginStatus();
      
      // Tải lại dữ liệu phù hợp
      if (isLoggedIn()) {
        fetchUserOrders().then(orders => {
          renderOrders(orders.data || orders);
        });
      } else {
        loadGuestOrders();
      }
    }
  });
  
  // Event listener cho việc refresh trang
  window.addEventListener('beforeunload', function() {
    // Làm sạch dữ liệu cũ trước khi rời trang
    cleanupOldOrders();
  });
}

// Hàm kiểm tra và hiển thị thông báo trạng thái đơn hàng
function checkOrderStatusUpdates() {
  // Kiểm tra xem có thông báo cập nhật trạng thái đơn hàng không
  const statusUpdate = localStorage.getItem('orderStatusUpdate');
  if (statusUpdate) {
    try {
      const update = JSON.parse(statusUpdate);
      showNotification(`Đơn hàng #${update.orderId} đã được cập nhật: ${update.status}`, "info");
      
      // Xóa thông báo sau khi hiển thị
      localStorage.removeItem('orderStatusUpdate');
    } catch (e) {
      console.error("Error parsing order status update:", e);
      localStorage.removeItem('orderStatusUpdate');
    }
  }
}

// Hàm kiểm tra trạng thái đơn hàng từ server
async function checkOrderStatusDirectly(orderId) {
  try {
    console.log(`Checking status directly for order #${orderId}`);
    
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const token = getToken();
    const headers = {
      "Content-Type": "application/json"
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Lấy trạng thái hiện tại từ UI
    const orderElement = document.getElementById(`order-${orderId}`);
    let currentStatus = null;
    let currentStatusText = null;
    
    if (orderElement) {
      const statusElement = orderElement.querySelector('.order-status');
      if (statusElement) {
        currentStatusText = statusElement.textContent.trim();
        // Lấy class để xác định trạng thái
        const statusClass = statusElement.className;
        if (statusClass.includes('status-pending')) {
          currentStatus = 'pending';
        } else if (statusClass.includes('status-processing')) {
          if (currentStatusText.includes('chuẩn bị')) {
            currentStatus = 'preparing';
          } else if (currentStatusText.includes('giao hàng')) {
            currentStatus = 'delivering';
          } else {
            currentStatus = 'confirmed';
          }
        } else if (statusClass.includes('status-completed')) {
          currentStatus = 'completed';
        } else if (statusClass.includes('status-cancelled')) {
          currentStatus = 'cancelled';
        }
        console.log(`Current status in UI: "${currentStatus}" (${currentStatusText})`);
      }
    }
    
    // Gọi API để lấy thông tin đơn hàng
    const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
      method: "GET",
      headers: headers
    });
    
    if (response.ok) {
      const orderData = await response.json();
      console.log(`Direct order data for #${orderId}:`, orderData);
      
      if (orderData.success && orderData.data) {
        // Hiển thị thông tin chi tiết về trạng thái
        const newStatus = orderData.data.status;
        console.log(`Order #${orderId} status from server: "${newStatus}"`);
        
        // Lấy thông tin hiển thị cho trạng thái mới
        const newStatusDisplay = getOrderStatusDisplay(newStatus);
        console.log(`New status display: class="${newStatusDisplay.class}", text="${newStatusDisplay.text}"`);
        
        // Chỉ cập nhật UI và hiển thị thông báo nếu trạng thái thay đổi
        if (currentStatus !== newStatus.toLowerCase()) {
          console.log(`Status changed from "${currentStatus}" to "${newStatus.toLowerCase()}"`);
          
          // Cập nhật UI với trạng thái mới
          updateOrderStatusUI(orderId, newStatus);
          
          // Hiển thị thông báo
          showNotification(`Đã cập nhật trạng thái đơn hàng #${orderId} thành ${newStatusDisplay.text}`, "info");
          
          // Nếu trạng thái thay đổi thành "preparing", làm mới trang sau 1 giây
          if (newStatus.toLowerCase() === "preparing") {
            setTimeout(() => {
              if (window.location.href.includes('order.html')) {
                console.log("Reloading page to show updated status");
                window.location.reload();
              }
            }, 1000);
          }
        } else {
          console.log(`Status unchanged: "${currentStatus}" vs "${newStatus.toLowerCase()}"`);
          
          // Vẫn cập nhật UI để đảm bảo hiển thị đúng
          updateOrderStatusUI(orderId, newStatus);
        }
        
        return newStatus;
      }
    } else {
      console.error(`Error fetching order #${orderId}:`, await response.text());
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking order #${orderId} status:`, error);
    return null;
  }
}

// Hàm tự động làm mới dữ liệu đơn hàng
function autoRefreshOrders() {
  // Tự động làm mới dữ liệu mỗi 2 phút
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      console.log("Auto refreshing orders...");
      
      if (isLoggedIn()) {
        fetchUserOrders().then(orders => {
          renderOrders(orders.data || orders);
        }).catch(error => {
          console.error("Error auto-refreshing orders:", error);
        });
      } else {
        loadGuestOrders();
        
        // Đồng bộ trạng thái đơn hàng của khách không đăng nhập từ server
        syncGuestOrdersWithServer();
      }
    }
  }, 2 * 60 * 1000); // 2 phút
  
  // Thêm một interval ngắn hơn để kiểm tra cập nhật trạng thái từ server
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      // Đồng bộ trạng thái đơn hàng từ server
      syncOrderStatusFromServer();
      
      // Kiểm tra trạng thái của tất cả đơn hàng hiển thị trên trang
      const orderElements = document.querySelectorAll('[id^="order-"]');
      orderElements.forEach(element => {
        const orderId = element.id.replace('order-', '');
        if (orderId) {
          checkOrderStatusDirectly(orderId);
        }
      });
    }
  }, 10 * 1000); // 10 giây
  
  // Đồng bộ ngay khi trang được tải
  setTimeout(() => {
    syncOrderStatusFromServer();
    
    // Kiểm tra trạng thái của tất cả đơn hàng hiển thị trên trang
    const orderElements = document.querySelectorAll('[id^="order-"]');
    orderElements.forEach(element => {
      const orderId = element.id.replace('order-', '');
      if (orderId) {
        checkOrderStatusDirectly(orderId);
      }
    });
  }, 1000); // 1 giây sau khi trang được tải
}

// Hàm lấy trạng thái tất cả đơn hàng cho người dùng đã đăng nhập
async function fetchAllOrderStatuses() {
  try {
    console.log("Fetching all order statuses for logged in user");
    
    if (!isLoggedIn()) {
      console.log("User not logged in, skipping fetchAllOrderStatuses");
      return null;
    }
    
    const token = getToken();
    
    // Sử dụng API endpoint mới để lấy trạng thái tất cả đơn hàng
    const response = await fetch("http://localhost:5000/api/orders/status/all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error("Error fetching all order statuses:", response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log("All order statuses:", data);
    
    if (data.success && data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error("Error in fetchAllOrderStatuses:", error);
    return null;
  }
}

// Hàm đồng bộ trạng thái đơn hàng từ server
async function syncOrderStatusFromServer() {
  try {
    console.log("Syncing order status from server...");
    
    // Nếu người dùng đã đăng nhập, đồng bộ tất cả đơn hàng
    if (isLoggedIn()) {
      try {
        // Lấy trạng thái tất cả đơn hàng
        const allOrderStatuses = await fetchAllOrderStatuses();
        
        if (allOrderStatuses) {
          console.log(`Received statuses for ${allOrderStatuses.length} orders`);
          
          // Kiểm tra xem có đơn hàng nào có trạng thái "preparing" không
          const hasPreparingOrder = allOrderStatuses.some(order => 
            order.status && order.status.toLowerCase() === "preparing"
          );
          
          if (hasPreparingOrder) {
            console.log("Found order with 'preparing' status, reloading page");
            // Làm mới trang để hiển thị trạng thái mới nhất
            if (window.location.href.includes('order.html')) {
              window.location.reload();
              return;
            }
          }
          
          // Cập nhật UI cho từng đơn hàng
          let hasStatusChanged = false;
          
          for (const orderStatus of allOrderStatuses) {
            const orderId = orderStatus.order_id;
            const status = orderStatus.status;
            
            // Cập nhật UI
            const orderElement = document.getElementById(`order-${orderId}`);
            if (orderElement) {
              const statusElement = orderElement.querySelector('.order-status');
              if (statusElement) {
                const currentStatusText = statusElement.textContent.trim();
                const newStatusDisplay = getOrderStatusDisplay(status);
                
                // Chỉ cập nhật nếu trạng thái thay đổi
                if (currentStatusText !== newStatusDisplay.text) {
                  console.log(`Updating order ${orderId} status UI to ${status}`);
                  hasStatusChanged = true;
                  
                  // Cập nhật class và text
                  statusElement.className = `order-status ${newStatusDisplay.class}`;
                  statusElement.textContent = newStatusDisplay.text;
                  
                  // Ẩn nút hủy đơn hàng nếu không thể hủy
                  const cancelButton = orderElement.querySelector('.btn-cancel-order');
                  if (cancelButton && !canCancelOrder(status)) {
                    cancelButton.style.display = 'none';
                  }
                }
              }
            }
          }
          
          // Hiển thị thông báo nếu có trạng thái thay đổi
          if (hasStatusChanged) {
            showNotification("Trạng thái đơn hàng đã được cập nhật", "info");
          }
        } else {
          // Nếu không lấy được trạng thái, thử lấy tất cả đơn hàng
          const token = getToken();
          const response = await fetch("http://localhost:5000/api/orders/myorders", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const ordersData = await response.json();
            console.log("Orders data from server:", ordersData);
            
            if (ordersData.success && ordersData.data && Array.isArray(ordersData.data)) {
              // Kiểm tra xem có đơn hàng nào có trạng thái "preparing" không
              const hasPreparingOrder = ordersData.data.some(order => 
                order.status && order.status.toLowerCase() === "preparing"
              );
              
              if (hasPreparingOrder) {
                console.log("Found order with 'preparing' status, reloading page");
                // Làm mới trang để hiển thị trạng thái mới nhất
                if (window.location.href.includes('order.html')) {
                  window.location.reload();
                  return;
                }
              }
              
              // Cập nhật UI với dữ liệu mới nhất
              renderOrders(ordersData.data);
            }
          }
        }
      } catch (error) {
        console.error("Error syncing all orders:", error);
      }
      return; // Đã xử lý người dùng đăng nhập, không cần xử lý khách không đăng nhập
    }
    
    // Xử lý cho khách không đăng nhập
    const guestOrderIds = localStorage.getItem('guestOrderIds');
    if (!guestOrderIds) return;
    
    const parsedOrderIds = JSON.parse(guestOrderIds);
    if (!parsedOrderIds || !Array.isArray(parsedOrderIds) || parsedOrderIds.length === 0) return;
    
    // Lấy trạng thái mới nhất cho từng đơn hàng
    let hasStatusChanged = false;
    let hasPreparingOrder = false;
    
    for (const orderId of parsedOrderIds) {
      try {
        // Sử dụng API endpoint mới để lấy trạng thái đơn hàng
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        if (response.ok) {
          const statusData = await response.json();
          console.log(`Status data for order ${orderId}:`, statusData);
          
          if (statusData.success && statusData.data && statusData.data.status) {
            const newStatus = statusData.data.status;
            
            // Kiểm tra xem có đơn hàng nào có trạng thái "preparing" không
            if (newStatus.toLowerCase() === "preparing") {
              hasPreparingOrder = true;
            }
            
            // Cập nhật trạng thái trong localStorage
            const orderData = localStorage.getItem(`order_${orderId}`);
            if (orderData) {
              const order = JSON.parse(orderData);
              
              // Chỉ cập nhật nếu trạng thái thay đổi
              if (order.status !== newStatus) {
                console.log(`Updating order ${orderId} status from ${order.status} to ${newStatus}`);
                hasStatusChanged = true;
                
                // Cập nhật trạng thái
                order.status = newStatus;
                
                // Cập nhật lịch sử trạng thái
                order.status_history = order.status_history || [];
                order.status_history.push({
                  status: newStatus,
                  timestamp: new Date().toISOString(),
                  note: "Trạng thái được cập nhật từ server"
                });
                
                // Lưu lại vào localStorage
                localStorage.setItem(`order_${orderId}`, JSON.stringify(order));
                
                // Cập nhật UI
                updateOrderStatusUI(orderId, newStatus);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing status for order ${orderId}:`, error);
      }
    }
    
    // Nếu có đơn hàng có trạng thái "preparing", làm mới trang
    if (hasPreparingOrder) {
      console.log("Found order with 'preparing' status, reloading page");
      if (window.location.href.includes('order.html')) {
        window.location.reload();
        return;
      }
    }
    
    // Nếu có trạng thái thay đổi, tải lại danh sách đơn hàng
    if (hasStatusChanged) {
      loadGuestOrders();
      showNotification("Trạng thái đơn hàng đã được cập nhật", "info");
    }
  } catch (error) {
    console.error("Error syncing order status from server:", error);
  }
}

// Hàm đồng bộ đơn hàng của khách không đăng nhập với server
async function syncGuestOrdersWithServer() {
  try {
    console.log("Syncing guest orders with server...");
    
    // Lấy danh sách đơn hàng từ localStorage
    const guestOrderIds = localStorage.getItem('guestOrderIds');
    if (!guestOrderIds) return;
    
    const parsedOrderIds = JSON.parse(guestOrderIds);
    if (!parsedOrderIds || !Array.isArray(parsedOrderIds) || parsedOrderIds.length === 0) return;
    
    // Lấy thông tin chi tiết cho từng đơn hàng
    for (const orderId of parsedOrderIds) {
      const orderData = localStorage.getItem(`order_${orderId}`);
      if (!orderData) continue;
      
      try {
        const order = JSON.parse(orderData);
        
        // Chỉ đồng bộ đơn hàng có thông tin khách hàng
        if (order.guest_info) {
          const guestInfo = typeof order.guest_info === 'string' 
            ? JSON.parse(order.guest_info) 
            : order.guest_info;
          
          // Gọi API để đồng bộ đơn hàng
          const response = await fetch(`http://localhost:5000/api/orders/${orderId}/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              isGuest: true,
              guest_info: guestInfo,
              email: guestInfo.email,
              phone: guestInfo.phone,
              order_id: orderId,
              order_code: order.order_code || null,
              status: order.status,
              local_data: order
            })
          });
          
          if (response.ok) {
            const syncResult = await response.json();
            console.log(`Sync result for order ${orderId}:`, syncResult);
            
            // Cập nhật dữ liệu từ server nếu có
            if (syncResult.success && syncResult.data) {
              // Cập nhật trạng thái nếu khác
              if (syncResult.data.status && syncResult.data.status !== order.status) {
                order.status = syncResult.data.status;
                
                // Cập nhật lịch sử trạng thái
                order.status_history = order.status_history || [];
                order.status_history.push({
                  status: syncResult.data.status,
                  timestamp: new Date().toISOString(),
                  note: "Trạng thái được đồng bộ từ server"
                });
                
                // Lưu lại vào localStorage
                localStorage.setItem(`order_${orderId}`, JSON.stringify(order));
                
                // Cập nhật UI
                updateOrderStatusUI(orderId, syncResult.data.status);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing guest order ${orderId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error syncing guest orders with server:", error);
  }
}

// Thêm sự kiện cho các nút làm mới trạng thái
function addRefreshStatusEventListeners() {
  document.querySelectorAll(".btn-refresh-status").forEach((button) => {
    // Xóa event listener cũ nếu có
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    newButton.addEventListener("click", async function () {
      const orderId = this.dataset.orderId;
      console.log("Refresh status button clicked for order:", orderId);

      // Hiển thị trạng thái đang xử lý
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật...';
      this.disabled = true;

      try {
        // Gọi API kiểm tra trạng thái đơn hàng
        const status = await checkOrderStatusDirectly(orderId);
        console.log(`Order #${orderId} status from server:`, status);

        if (status) {
          showNotification(`Đã cập nhật trạng thái đơn hàng thành ${getOrderStatusDisplay(status).text}`, "success");
        } else {
          showNotification("Không thể cập nhật trạng thái đơn hàng", "warning");
        }
        
        // Khôi phục nút
        this.innerHTML = '<i class="fas fa-sync-alt"></i> Cập nhật trạng thái';
        this.disabled = false;
      } catch (error) {
        console.error("Error refreshing order status:", error);
        showNotification("Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng", "error");
        
        // Khôi phục nút
        this.innerHTML = '<i class="fas fa-sync-alt"></i> Cập nhật trạng thái';
        this.disabled = false;
      }
    });
  });
}

// Thêm sự kiện cho các nút làm mới trạng thái
function addRefreshStatusEventListeners() {
  document.querySelectorAll(".btn-refresh-status").forEach((button) => {
    // Xóa event listener cũ nếu có
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    newButton.addEventListener("click", async function () {
      const orderId = this.dataset.orderId;
      console.log("Refresh status button clicked for order:", orderId);

      // Hiển thị trạng thái đang xử lý
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật...';
      this.disabled = true;

      try {
        // Gọi API kiểm tra trạng thái đơn hàng
        const status = await checkOrderStatusDirectly(orderId);
        console.log(`Order #${orderId} status from server:`, status);

        if (status) {
          showNotification(`Đã cập nhật trạng thái đơn hàng thành ${getOrderStatusDisplay(status).text}`, "success");
        } else {
          showNotification("Không thể cập nhật trạng thái đơn hàng", "warning");
        }
        
        // Khôi phục nút
        this.innerHTML = '<i class="fas fa-sync-alt"></i> Cập nhật trạng thái';
        this.disabled = false;
      } catch (error) {
        console.error("Error refreshing order status:", error);
        showNotification("Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng", "error");
        
        // Khôi phục nút
        this.innerHTML = '<i class="fas fa-sync-alt"></i> Cập nhật trạng thái';
        this.disabled = false;
      }
    });
  });
}

// Khởi tạo tất cả các chức năng khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
  console.log("Order page fully loaded, initializing all features...");
  
  // Khởi tạo các event listeners
  initEventListeners();
  
  // Xử lý URL parameters
  handleUrlParameters();
  
  // Kiểm tra cập nhật trạng thái đơn hàng
  checkOrderStatusUpdates();
  
  // Cập nhật trạng thái đăng nhập
  updateLoginStatus();
  
  // Làm sạch dữ liệu cũ
  cleanupOldOrders();
  
  // Bắt đầu tự động làm mới (nếu cần)
  // autoRefreshOrders();
  
  console.log("Order page initialization completed");
});

// Export các hàm cần thiết để sử dụng ở nơi khác
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchUserOrders,
    renderOrders,
    renderGuestOrders,
    loadGuestOrders,
    cancelOrder,
    getOrderStatusDisplay,
    formatDate,
    formatCurrency,
    isLoggedIn,
    getToken,
    getUserId
  };
}



