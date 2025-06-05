// Hàm để lấy dữ liệu từ API
async function fetchData(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi lấy dữ liệu từ ${url}:`, error);
        return { success: false, data: [] };
    }
}

// Hàm định dạng tiền tệ Việt Nam
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Lấy token từ localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Lấy user ID từ localStorage
function getUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.user_id || null;
}

// Kiểm tra xem người dùng đã đăng nhập chưa
function isLoggedIn() {
    return !!getToken() && !!getUserId();
}

// Hàm lấy giỏ hàng từ API
async function fetchCart() {
    if (!isLoggedIn()) {
        // Nếu chưa đăng nhập, lấy giỏ hàng từ localStorage
        return getLocalCart();
    }

    try {
        const token = getToken();
        
        // Gọi API để lấy giỏ hàng
        try {
            const response = await fetchData(`http://localhost:5000/api/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.success) {
                console.log("Dữ liệu giỏ hàng từ API:", response.data);
                
                // Kiểm tra và log chi tiết từng item trong giỏ hàng
                if (response.data && response.data.items && Array.isArray(response.data.items)) {
                    response.data.items.forEach((item, index) => {
                        console.log(`Chi tiết item #${index + 1}:`, item);
                        console.log(`- Tên sản phẩm: ${item.name}`);
                        console.log(`- Giá: ${item.price}`);
                        console.log(`- Số lượng: ${item.quantity}`);
                        
                        // Kiểm tra options
                        if (item.options) {
                            console.log(`- Options:`, item.options);
                            if (typeof item.options === 'string') {
                                try {
                                    const parsedOptions = JSON.parse(item.options);
                                    console.log(`- Options (parsed):`, parsedOptions);
                                } catch (e) {
                                    console.log(`- Options không phải JSON hợp lệ`);
                                }
                            }
                        }
                        
                        if (item.options_text) {
                            console.log(`- Options text: ${item.options_text}`);
                        }
                        
                        if (item.options_data) {
                            console.log(`- Options data:`, item.options_data);
                            if (typeof item.options_data === 'string') {
                                try {
                                    const parsedOptionsData = JSON.parse(item.options_data);
                                    console.log(`- Options data (parsed):`, parsedOptionsData);
                                } catch (e) {
                                    console.log(`- Options data không phải JSON hợp lệ`);
                                }
                            }
                        }
                    });
                }
                
                return response.data;
            } else {
                console.log('API giỏ hàng không trả về dữ liệu thành công, sử dụng giỏ hàng local');
                return getLocalCart(); // Fallback to local cart if API fails
            }
        } catch (error) {
            console.log('API giỏ hàng không tồn tại hoặc có lỗi, sử dụng giỏ hàng local');
            return getLocalCart(); // Fallback to local cart if API fails
        }
    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        return getLocalCart(); // Fallback to local cart if API fails
    }
}

// Hàm lấy giỏ hàng từ localStorage (cho người dùng chưa đăng nhập)
function getLocalCart() {
    console.log("Lấy giỏ hàng từ localStorage");
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    console.log("Cart items từ localStorage:", cartItems);
    
    if (cartItems.length === 0) {
        console.log("Giỏ hàng trống");
        return {
            cart_id: 'local',
            user_id: null,
            items: [],
            total_amount: 0,
            item_count: 0 // Đảm bảo item_count là 0 khi giỏ hàng trống
        };
    }
    
    // Lấy thông tin sản phẩm từ localStorage
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    console.log("Products từ localStorage:", products);
    
    // Map các sản phẩm trong giỏ hàng với thông tin sản phẩm
    const items = cartItems.map(item => {
        console.log("Xử lý item trong giỏ hàng:", item);
        const product = products.find(p => p.product_id == item.productId) || {
            name: item.name || 'Sản phẩm không xác định',
            price: item.price || 0,
            product_image: item.image || '/img/_12A7780.jpg'
        };
        
        // Tạo cart_item_id từ uniqueId hoặc productId
        const cartItemId = item.uniqueId || item.productId;
        console.log("Cart item ID:", cartItemId);
        
        // Kiểm tra options
        console.log("Options của sản phẩm:", item.options);
        console.log("Options text của sản phẩm:", item.optionsText);
        
        return {
            cart_item_id: cartItemId, // Sử dụng uniqueId nếu có, nếu không dùng productId
            product_id: item.productId,
            quantity: item.quantity || 1, // Đảm bảo quantity có giá trị mặc định là 1
            name: item.name || 'Sản phẩm không tên',
            price: item.price || 0,
            product_image: item.image || '/img/_12A7780.jpg', // Ảnh mặc định nếu không có
            options: item.options || [], // Thêm thông tin options
            optionsText: item.optionsText || '' // Thêm text mô tả options
        };
    });
    
    console.log("Items sau khi xử lý:", items);
    
    // Tính tổng tiền, bao gồm cả giá của options
    const totalAmount = items.reduce((sum, item) => {
        let itemPrice = item.price;
        
        // Thêm giá của options nếu có
        if (item.options && Array.isArray(item.options)) {
            item.options.forEach(option => {
                if (option.additional_price) {
                  itemPrice += parseFloat(option.additional_price);
         
                }
            });
        }
        
        return sum + (itemPrice * item.quantity);
    }, 0);
    
    // Tính tổng số lượng các sản phẩm (ví dụ: 2 bánh mì A, 3 bánh mì B => item_count = 5)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    console.log("Tổng tiền:", totalAmount);
    console.log("Tổng số lượng sản phẩm:", itemCount);
    
    return {
        cart_id: 'local',
        user_id: null,
        items: items,
        total_amount: totalAmount,
        item_count: itemCount // Sử dụng tổng số lượng sản phẩm
    };
}

// Hàm cập nhật số lượng sản phẩm trong giỏ hàng
async function updateCartItemQuantity(cartItemId, quantity) {
    if (!isLoggedIn()) {
        // Nếu chưa đăng nhập, cập nhật giỏ hàng trong localStorage
        updateLocalCartItemQuantity(cartItemId, quantity);
        renderCart(getLocalCart());
        return;
    }

    try {
        const token = getToken();
        
        // Nếu số lượng là 0, xóa sản phẩm khỏi giỏ hàng
        if (quantity <= 0) {
            try {
                const response = await fetchData(`http://localhost:5000/api/cart/remove/${cartItemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.success) {
                    renderCart(response.data);
                } else {
                    // Fallback to local update if API fails
                    updateLocalCartItemQuantity(cartItemId, 0);
                    renderCart(getLocalCart());
                }
            } catch (error) {
                // Fallback to local update if API doesn't exist
                updateLocalCartItemQuantity(cartItemId, 0);
                renderCart(getLocalCart());
            }
        } else {
            // Cập nhật số lượng
            try {
                const response = await fetchData(`http://localhost:5000/api/cart/update/${cartItemId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        quantity
                    })
                });
                
                if (response.success) {
                    renderCart(response.data);
                } else {
                    // Fallback to local update if API fails
                    updateLocalCartItemQuantity(cartItemId, quantity);
                    renderCart(getLocalCart());
                }
            } catch (error) {
                // Fallback to local update if API doesn't exist
                updateLocalCartItemQuantity(cartItemId, quantity);
                renderCart(getLocalCart());
            }
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật giỏ hàng:', error);
        // Fallback to local update if API fails
        updateLocalCartItemQuantity(cartItemId, quantity);
        renderCart(getLocalCart());
    }
}

// Hàm xóa sản phẩm khỏi giỏ hàng
async function removeCartItem(cartItemId) {
    // Kiểm tra cartItemId có hợp lệ không
    if (!cartItemId) {
        console.error('cartItemId không hợp lệ:', cartItemId);
        return;
    }

    if (!isLoggedIn()) {
        // Nếu chưa đăng nhập, xóa sản phẩm khỏi giỏ hàng trong localStorage
        updateLocalCartItemQuantity(cartItemId, 0);
        renderCart(getLocalCart());
        return;
    }

    try {
        const token = getToken();
        
        try {
            const response = await fetchData(`http://localhost:5000/api/cart/remove/${cartItemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.success) {
                renderCart(response.data);
            } else {
                // Fallback to local delete if API fails
                updateLocalCartItemQuantity(cartItemId, 0);
                renderCart(getLocalCart());
            }
        } catch (error) {
            // Fallback to local delete if API doesn't exist
            updateLocalCartItemQuantity(cartItemId, 0);
            renderCart(getLocalCart());
        }
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
        // Fallback to local delete if API fails
        updateLocalCartItemQuantity(cartItemId, 0);
        renderCart(getLocalCart());
    }
}

// Hàm cập nhật số lượng sản phẩm trong giỏ hàng local
function updateLocalCartItemQuantity(itemId, quantity) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Tìm sản phẩm trong giỏ hàng bằng productId hoặc uniqueId
    const index = cart.findIndex(item => 
        item.productId == itemId || 
        item.uniqueId == itemId
    );
    
    if (index !== -1) {
        if (quantity <= 0) {
            // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
            cart.splice(index, 1);
        } else {
            // Cập nhật số lượng
            cart[index].quantity = quantity;
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Cập nhật số lượng hiển thị trên icon giỏ hàng
        updateCartIcon();
    }
}

// Hàm cập nhật số lượng hiển thị trên icon giỏ hàng
function updateCartIcon() {
    let count = 0;
    // Ưu tiên lấy từ biến cart toàn cục nếu có (trang giỏ hàng)
    // Biến 'cart' này sẽ được gán giá trị trong hàm initPage sau khi fetchCart
    if (typeof cart !== 'undefined' && cart && cart.items) {
        count = cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
    } else {
        // Fallback to localStorage nếu không có biến cart toàn cục (các trang khác)
        const localCartItems = JSON.parse(localStorage.getItem('cart') || '[]');
        count = localCartItems.reduce((total, item) => total + (item.quantity || 0), 0);
    }

    const cartCountElements = document.querySelectorAll('.cart-count, .cart-item-count-badge'); 

    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = count;
            element.style.display = count > 0 ? (element.dataset.displayStyle || 'inline-block') : 'none';
        }
    });
    
    // Lắng nghe sự kiện đăng nhập để cập nhật giỏ hàng
    document.addEventListener('login', async () => {
        console.log('Sự kiện đăng nhập được kích hoạt, đang cập nhật giỏ hàng...');
        // Cập nhật giỏ hàng sau khi đăng nhập
        if (typeof initPage === 'function') {
            await initPage();
        } else {
            // Nếu không ở trang giỏ hàng, chỉ cập nhật icon
            const cartData = await fetchCart();
            count = cartData.items.reduce((total, item) => total + (item.quantity || 0), 0);
            
            cartCountElements.forEach(element => {
                if (element) {
                    element.textContent = count;
                    element.style.display = count > 0 ? (element.dataset.displayStyle || 'inline-block') : 'none';
                }
            });
        }
    });
    
    // Lắng nghe sự kiện đăng xuất để cập nhật giỏ hàng
    document.addEventListener('logout', async () => {
        console.log('Sự kiện đăng xuất được kích hoạt, đang cập nhật giỏ hàng...');
        // Cập nhật giỏ hàng sau khi đăng xuất
        if (typeof initPage === 'function') {
            await initPage();
        } else {
            // Nếu không ở trang giỏ hàng, chỉ cập nhật icon từ localStorage
            const localCartItems = JSON.parse(localStorage.getItem('cart') || '[]');
            count = localCartItems.reduce((total, item) => total + (item.quantity || 0), 0);
            
            cartCountElements.forEach(element => {
                if (element) {
                    element.textContent = count;
                    element.style.display = count > 0 ? (element.dataset.displayStyle || 'inline-block') : 'none';
                }
            });
        }
    });

    const headerCartLink = document.querySelector('header nav ul li a[href="cart.html"]');
    if (headerCartLink) {
        let countSpan = headerCartLink.querySelector('.cart-item-count-badge');
        if (!countSpan && !headerCartLink.querySelector('.cart-count')) { 
            countSpan = document.createElement('span');
            countSpan.className = 'cart-item-count-badge';
            countSpan.style.backgroundColor = 'var(--secondary-color, red)';
            countSpan.style.color = 'white';
            countSpan.style.borderRadius = '50%';
            countSpan.style.padding = '2px 6px';
            countSpan.style.fontSize = '0.75em';
            countSpan.style.marginLeft = '5px';
            countSpan.style.verticalAlign = 'super';
            countSpan.dataset.displayStyle = 'inline-block';
            headerCartLink.appendChild(countSpan);
        }
        
        countSpan = headerCartLink.querySelector('.cart-item-count-badge');
        if (countSpan) {
             if (count > 0) {
                countSpan.textContent = count;
                countSpan.style.display = countSpan.dataset.displayStyle || 'inline-block';
            } else {
                countSpan.style.display = 'none';
            }
        }
    }
}

// Hàm render giỏ hàng
// Hàm render giỏ hàng
function renderCart(cart) {
    console.log("Render giỏ hàng:", cart);
    
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSummaryElement = document.querySelector('.cart-summary'); // Đổi tên để rõ ràng hơn
    const subtotalSpan = cartSummaryElement ? cartSummaryElement.querySelector('#subtotal') : null;
    const discountSpan = cartSummaryElement ? cartSummaryElement.querySelector('#discount') : null;
    const totalSpan = cartSummaryElement ? cartSummaryElement.querySelector('#total') : null;
    
    if (!cartItemsContainer) {
        console.error("Element #cart-items không tìm thấy.");
        return; 
    }
    
    // Header đã có trong HTML, không cần tạo lại. Chỉ cần xóa item cũ.
    cartItemsContainer.innerHTML = ''; 
    
    // Kiểm tra nếu giỏ hàng trống
    if (!cart || !cart.items || cart.items.length === 0) {
        console.log("Giỏ hàng trống, hiển thị template giỏ hàng trống");
        const emptyCartTemplate = document.getElementById('empty-cart-template');
        if (emptyCartTemplate) {
            const emptyCartElement = emptyCartTemplate.content.cloneNode(true);
            cartItemsContainer.appendChild(emptyCartElement);
        }
        // Cập nhật tổng tiền về 0
        if (subtotalSpan) subtotalSpan.textContent = formatCurrency(0);
        if (discountSpan) discountSpan.textContent = formatCurrency(0); // Giả định giảm giá là 0 khi giỏ hàng trống
        if (totalSpan) totalSpan.textContent = formatCurrency(0);
        updateCartIcon(0); // Cập nhật icon khi giỏ hàng trống
        return; // Kết thúc hàm renderCart
    }
    
    console.log("Giỏ hàng có sản phẩm, hiển thị các sản phẩm");
    console.log("Số lượng sản phẩm:", cart.items.length);
    
    // Tính lại tổng tiền bao gồm cả options
    let calculatedTotalAmount = 0;
    
    // Render các sản phẩm trong giỏ hàng
    cart.items.forEach(item => {
        // Đảm bảo cart_item_id luôn có giá trị, nếu không có thì dùng product_id
        const itemId = item.cart_item_id || item.product_id;
        
        const cartItem = document.createElement('div');
        // Sử dụng template
        const cartItemTemplate = document.getElementById('cart-item-template');
        if (!cartItemTemplate) return; // Thoát nếu template không tồn tại
        
        const cartItemElement = cartItemTemplate.content.cloneNode(true).querySelector('.cart-item');
        
        // Cập nhật dữ liệu cho element từ template
        cartItemElement.dataset.id = itemId;
        cartItemElement.dataset.productId = item.product_id;
        
        cartItemElement.querySelector('.item-checkbox').dataset.id = itemId; // Gắn ID vào checkbox
        cartItemElement.querySelector('.item-info img').src = item.product_image || '/img/_12A7780.jpg';
        cartItemElement.querySelector('.item-info img').alt = item.name;
        
        // Hiển thị tên sản phẩm
        const itemTitleElement = cartItemElement.querySelector('.item-title');
        itemTitleElement.textContent = item.name;
        
        // Thêm thông tin options nếu có
        let optionsText = '';
        
        console.log("Hiển thị options cho sản phẩm:", item.name);
        console.log("Item data:", item);
        
        // Kiểm tra nếu có optionsText trực tiếp (từ localStorage hoặc API)
        if (item.optionsText || item.options_text) {
            const directOptionsText = item.optionsText || item.options_text;
            console.log("Sử dụng optionsText trực tiếp:", directOptionsText);
            optionsText = directOptionsText;
        } 
        // Kiểm tra nếu có options từ API
        else if (item.options && Array.isArray(item.options) && item.options.length > 0) {
            console.log("Tạo optionsText từ mảng options:", item.options);
            // Tạo chuỗi mô tả options từ mảng options
            optionsText = item.options.map(option => {
                // Kiểm tra cấu trúc của option để xử lý đúng
                if (option.option_name && option.value_name) {
                    // Cấu trúc từ localStorage
                    let optionDisplay = `${option.option_name}: ${option.value_name}`;
                    if (option.additional_price > 0) {
                        optionDisplay += ` (+${formatCurrency(option.additional_price)})`;
                    }
                    return optionDisplay;
                } else if (option.name && option.value) {
                    // Cấu trúc có thể từ API
                    let optionDisplay = `${option.name}: ${option.value}`;
                    if (option.additional_price > 0) {
                        optionDisplay += ` (+${formatCurrency(option.additional_price)})`;
                    }
                    return optionDisplay;
                } else {
                    // Trường hợp khác, hiển thị những gì có
                    const optionName = option.option_name || option.name || '';
                    const valueName = option.value_name || option.value || '';
                    let optionDisplay = `${optionName}: ${valueName}`;
                    if (option.additional_price > 0) {
                        optionDisplay += ` (+${formatCurrency(option.additional_price)})`;
                    }
                    return optionDisplay;
                }
            }).join(', ');
        }
        
        // Không thêm options mặc định nữa, chỉ hiển thị options thực tế được chọn
        if (!optionsText) {
            console.log("Không có options cho sản phẩm này");
        }
        
        // Nếu vẫn không có optionsText, kiểm tra các trường khác
        if (!optionsText) {
            // Kiểm tra xem có trường options_data không (có thể là chuỗi JSON)
            if (item.options_data) {
                try {
                    const optionsData = typeof item.options_data === 'string' 
                        ? JSON.parse(item.options_data) 
                        : item.options_data;
                    
                    if (Array.isArray(optionsData) && optionsData.length > 0) {
                        console.log("Tạo optionsText từ options_data:", optionsData);
                        optionsText = optionsData.map(option => {
                            const optionName = option.option_name || option.name || '';
                            const valueName = option.value_name || option.value || '';
                            let optionDisplay = `${optionName}: ${valueName}`;
                            if (option.additional_price > 0) {
                                optionDisplay += ` (+${formatCurrency(option.additional_price)})`;
                            }
                            return optionDisplay;
                        }).join(', ');
                    }
                } catch (error) {
                    console.error("Lỗi khi parse options_data:", error);
                }
            }
        }
        
        // Hiển thị options nếu có
        const optionsElement = cartItemElement.querySelector('.item-options');
        console.log("Options element:", optionsElement);
        console.log("Options text:", optionsText);
        
        if (optionsElement) {
            if (optionsText) {
                // Chỉ hiển thị options element khi có options text
                optionsElement.textContent = optionsText;
                optionsElement.style.fontSize = '0.85em';
                optionsElement.style.color = '#666';
                optionsElement.style.marginTop = '4px';
                optionsElement.style.fontStyle = 'italic';
                optionsElement.style.display = 'block';
                console.log("Hiển thị options text:", optionsText);
            } else {
                // Ẩn options element nếu không có options
                optionsElement.style.display = 'none';
                console.log("Ẩn options element vì không có options text");
            }
        } else {
            console.log("Không tìm thấy options element trong template");
        }
        
        // Nếu có category, có thể thêm vào đây
        // cartItemElement.querySelector('.item-category').textContent = item.category_name || ''; 
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
        
        // Tính tổng giá cho item này (giá đã bao gồm options * số lượng)
        const itemTotalPrice = itemPrice * item.quantity;
        calculatedTotalAmount += itemTotalPrice;
        
        console.log(`Giá sản phẩm ${item.name} sau khi thêm options:`, itemPrice);
        cartItemElement.querySelector('.item-price').textContent = formatCurrency(itemPrice);
        cartItemElement.querySelector('.quantity-input').value = item.quantity;
        cartItemElement.querySelector('.quantity-input').dataset.id = itemId; // Gắn ID vào input
        cartItemElement.querySelector('.quantity-btn.decrease').dataset.id = itemId; // Gắn ID vào nút
        cartItemElement.querySelector('.quantity-btn.increase').dataset.id = itemId; // Gắn ID vào nút
        cartItemElement.querySelector('.btn-remove').dataset.id = itemId; // Gắn ID vào nút xóa
        
        cartItem.dataset.id = itemId;
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    // Cập nhật các giá trị trong summary
    if (cartSummaryElement) { // Chỉ cập nhật nếu cartSummaryElement tồn tại
        // Sử dụng giá trị đã tính toán lại
        if (subtotalSpan) subtotalSpan.textContent = formatCurrency(calculatedTotalAmount);
        
        // Phí vận chuyển và giảm giá cần logic riêng nếu có
        const discountAmount = cart.discount_amount || 0;
        if (discountSpan) discountSpan.textContent = formatCurrency(discountAmount);
        
        // Tổng cộng = Tạm tính - Giảm giá
        const finalAmount = calculatedTotalAmount - discountAmount;
        if (totalSpan) totalSpan.textContent = formatCurrency(finalAmount);
        
        // Cập nhật lại giá trị trong cart object để sử dụng ở nơi khác nếu cần
        cart.total_amount = calculatedTotalAmount;
        cart.final_amount = finalAmount;
    }
    
    // Gắn sự kiện cho các nút
    attachCartEvents();
    
    // Cập nhật số lượng hiển thị trên icon giỏ hàng
    updateCartIcon(cart.item_count || (cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0));
}

// Hàm gắn sự kiện cho các nút trong giỏ hàng
function attachCartEvents() {
    // Sự kiện cho nút chọn tất cả
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = selectAllCheckbox.checked; // Sử dụng selectAllCheckbox thay vì this
            document.querySelectorAll('.item-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }
    
    // Sự kiện cho input số lượng (sử dụng event delegation hoặc gắn trực tiếp sau khi render)
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function() {
            const cartItem = this.closest('.cart-item');
            const cartItemId = cartItem.dataset.id;
            const quantity = parseInt(this.value);
            
            if (quantity > 0) {
                updateCartItemQuantity(cartItemId, quantity);
            } else {
                this.value = 1; // Đặt lại giá trị tối thiểu
                updateCartItemQuantity(cartItemId, 1);
            }
        });
    });
    
    // Sự kiện cho nút tăng/giảm số lượng (sử dụng event delegation hoặc gắn trực tiếp sau khi render)
    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = button.closest('.cart-item'); // Sử dụng button thay vì this
            const cartItemId = cartItem.dataset.id;
            const input = cartItem.querySelector('.quantity-input');
            const currentValue = parseInt(input.value);
            
            if (currentValue > 1) {
                const newValue = currentValue - 1;
                input.value = newValue;
                updateCartItemQuantity(cartItemId, newValue);
            }
        });
    });
    
    document.querySelectorAll('.quantity-btn.increase').forEach(button => { // Sử dụng button thay vì this
        button.addEventListener('click', function() {
            const cartItem = button.closest('.cart-item');
            const cartItemId = cartItem.dataset.id; // Lấy ID từ data-id của cart-item
            const input = cartItem.querySelector('.quantity-input');
            const currentValue = parseInt(input.value);
            
            const newValue = currentValue + 1;
            input.value = newValue;
            updateCartItemQuantity(cartItemId, newValue);
        });
    });
    
    // Sự kiện cho nút xóa (sử dụng event delegation hoặc gắn trực tiếp sau khi render)
    document.querySelectorAll('.btn-remove').forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = button.closest('.cart-item'); // Sử dụng button thay vì this
            const cartItemId = cartItem.dataset.id;
            
            if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                removeCartItem(cartItemId);
            }
        });
    });
}

// Hàm xóa tất cả sản phẩm đã chọn
function removeSelectedItems() {
    const selectedItems = document.querySelectorAll('.item-checkbox:checked');
    
    if (selectedItems.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để xóa');
        return;
    }
    
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} sản phẩm đã chọn?`)) {
        const removePromises = [];
        
        selectedItems.forEach(checkbox => {
            const cartItem = checkbox.closest('.cart-item');
            const cartItemId = cartItem.dataset.id;
            
            if (isLoggedIn()) {
                // Nếu đã đăng nhập, xóa qua API
                const token = getToken();
                
                try {
                    const promise = fetchData(`http://localhost:5000/api/cart/remove/${cartItemId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    removePromises.push(promise);
                } catch (error) {
                    // Fallback to local delete if API doesn't exist
                    updateLocalCartItemQuantity(cartItemId, 0);
                }
            } else {
                // Nếu chưa đăng nhập, xóa trong localStorage
                updateLocalCartItemQuantity(cartItemId, 0);
            }
        });
        
        if (isLoggedIn() && removePromises.length > 0) {
            // Nếu đã đăng nhập, đợi tất cả các request hoàn thành
            Promise.all(removePromises)
                .then(() => fetchCart())
                .then(cart => renderCart(cart))
                .catch(error => {
                    console.error('Lỗi khi xóa sản phẩm:', error);
                    fetchCart().then(cart => renderCart(cart));
                });
        } else {
            // Nếu chưa đăng nhập, render lại giỏ hàng
            renderCart(getLocalCart());
        }
    }
}

// Hàm áp dụng mã giảm giá
async function applyCoupon(couponCode) {
    if (!couponCode) {
        alert('Vui lòng nhập mã giảm giá');
        return;
    }
    
    if (!isLoggedIn()) {
        alert('Vui lòng đăng nhập để sử dụng mã giảm giá');
        return;
    }
    
    try {
        const token = getToken();
        
        try {
            const response = await fetchData(`http://localhost:5000/api/cart/coupon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    coupon_code: couponCode
                })
            });
            
            if (response.success) {
                alert('Áp dụng mã giảm giá thành công!');
                renderCart(response.data);
            } else {
                alert(`Không thể áp dụng mã giảm giá: ${response.message}`);
            }
        } catch (error) {
            alert('API mã giảm giá chưa được triển khai hoặc có lỗi');
        }
    } catch (error) {
        console.error('Lỗi khi áp dụng mã giảm giá:', error);
        alert('Đã xảy ra lỗi khi áp dụng mã giảm giá');
    }
}

// Hàm đồng bộ giỏ hàng local với server khi đăng nhập
async function syncCartWithServer() {
    if (!isLoggedIn()) return;
    
    const localCart = getLocalCart();
    
    if (localCart.items.length === 0) return;
    
    try {
        const token = getToken();
        
        // Kiểm tra xem API giỏ hàng có tồn tại không
        try {
            // Thử gọi API để kiểm tra
            const testResponse = await fetch(`http://localhost:5000/api/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Nếu API trả về 404, có nghĩa là endpoint không tồn tại
            if (testResponse.status === 404) {
                console.log('API giỏ hàng chưa được triển khai, bỏ qua đồng bộ');
                return; // Không thực hiện đồng bộ nếu API không tồn tại
            }
            
            // Nếu API tồn tại, tiếp tục đồng bộ
            const serverCartResponse = await testResponse.json();
            
            if (!serverCartResponse.success) {
                console.log('API giỏ hàng không trả về dữ liệu thành công, bỏ qua đồng bộ');
                return;
            }
            
            // Đồng bộ từng sản phẩm trong giỏ hàng local lên server
            const addPromises = localCart.items.map(item => {
                return fetchData(`http://localhost:5000/api/cart/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        product_id: item.product_id,
                        quantity: item.quantity
                    })
                });
            });
            
            await Promise.all(addPromises);
            
            // Xóa giỏ hàng local sau khi đã đồng bộ
            localStorage.removeItem('cart');
            
        } catch (error) {
            console.log('API giỏ hàng chưa được triển khai hoặc có lỗi, bỏ qua đồng bộ');
            return; // Không thực hiện đồng bộ nếu có lỗi
        }
    } catch (error) {
        console.error('Lỗi khi đồng bộ giỏ hàng:', error);
    }
}

let cart; // Khai báo biến cart ở phạm vi toàn cục của module để updateCartIcon có thể truy cập

// Hàm đồng bộ giỏ hàng local với server
async function syncCartWithServer() {
    console.log("Đồng bộ giỏ hàng local với server");
    if (!isLoggedIn()) {
        console.log("Người dùng chưa đăng nhập, không cần đồng bộ");
        return;
    }
    
    try {
        const localCart = getLocalCart();
        console.log("Giỏ hàng local cần đồng bộ:", localCart);
        
        if (!localCart.items || localCart.items.length === 0) {
            console.log("Giỏ hàng local trống, không cần đồng bộ");
            return;
        }
        
        const token = getToken();
        
        // Sử dụng API đồng bộ giỏ hàng
        try {
            const response = await fetchData(`http://localhost:5000/api/cart/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: localCart.items
                })
            });
            
            if (response.success) {
                // Xóa giỏ hàng local sau khi đồng bộ thành công
                localStorage.removeItem('cart');
                console.log("Đã xóa giỏ hàng local sau khi đồng bộ");
                return;
            } else {
                throw new Error(response.message || "Lỗi khi đồng bộ giỏ hàng");
            }
        } catch (syncError) {
            console.error("Lỗi khi sử dụng API đồng bộ, thử phương pháp thay thế:", syncError);
            
            // Phương pháp thay thế: Thêm từng sản phẩm vào giỏ hàng
            for (const item of localCart.items) {
                try {
                    console.log("Đồng bộ sản phẩm:", item);
                    
                    // Chuẩn bị dữ liệu options để gửi lên server
                    const options = item.options || [];
                    console.log("Options của sản phẩm:", options);
                    
                    // Chuẩn bị dữ liệu để gửi lên server
                    const requestData = {
                        product_id: item.product_id,
                        quantity: item.quantity,
                        options: options,
                        options_text: item.optionsText || ''
                    };
                    
                    console.log("Dữ liệu gửi lên server:", requestData);
                    
                    await fetchData(`http://localhost:5000/api/cart/add`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(requestData)
                    });
                } catch (error) {
                    console.error(`Lỗi khi đồng bộ sản phẩm ${item.product_id}:`, error);
                }
            }
            
            // Xóa giỏ hàng local sau khi đồng bộ thành công
            localStorage.removeItem('cart');
            console.log("Đã xóa giỏ hàng local sau khi đồng bộ (phương pháp thay thế)");
        }
    } catch (error) {
        console.error("Lỗi khi đồng bộ giỏ hàng:", error);
        throw error;
    }
}

// Hàm để thêm options text cho các sản phẩm trong giỏ hàng nếu chưa có
function addOptionsTextToCartItems(cartData) {
    if (!cartData || !cartData.items || !Array.isArray(cartData.items)) {
        return cartData;
    }
    
    console.log("Kiểm tra và thêm options text cho các sản phẩm trong giỏ hàng");
    
    // Tạo một bản sao của cartData để không thay đổi dữ liệu gốc
    const updatedCart = { ...cartData };
    updatedCart.items = cartData.items.map(item => {
        const updatedItem = { ...item };
        
        // Nếu đã có options_text hoặc optionsText, không cần thêm
        if (updatedItem.options_text || updatedItem.optionsText) {
            return updatedItem;
        }
        
        // Nếu có options, tạo options_text từ options
        if (updatedItem.options) {
            let options = updatedItem.options;
            
            // Nếu options là chuỗi, thử parse thành object
            if (typeof options === 'string') {
                try {
                    options = JSON.parse(options);
                } catch (e) {
                    console.log(`Không thể parse options cho sản phẩm ${updatedItem.name}:`, e);
                }
            }
            
            // Nếu options là array, tạo options_text
            if (Array.isArray(options) && options.length > 0) {
                updatedItem.options_text = options.map(option => {
                    const optionName = option.option_name || option.name || '';
                    const valueName = option.value_name || option.value || '';
                    let optionDisplay = `${optionName}: ${valueName}`;
                    if (option.additional_price > 0) {
                        optionDisplay += ` (+${formatCurrency(option.additional_price)})`;
                    }
                    return optionDisplay;
                }).join(', ');
                
                console.log(`Đã thêm options_text cho sản phẩm ${updatedItem.name}:`, updatedItem.options_text);
            }
        }
        
        return updatedItem;
    });
    
    return updatedCart;
}

// Hàm khởi tạo trang
async function initPage() {
    console.log("Khởi tạo trang giỏ hàng");
    try {
        // Thử đồng bộ giỏ hàng local với server nếu đã đăng nhập
        // Nhưng không báo lỗi nếu không thành công
        try {
            await syncCartWithServer();
        } catch (error) {
            console.log('Không thể đồng bộ giỏ hàng với server, sử dụng giỏ hàng local');
        }
        
        // Lấy giỏ hàng
        try { // Gán giá trị cho biến cart toàn cục
            cart = await fetchCart();
            console.log("Đã lấy giỏ hàng từ API:", cart);
            
            // Thêm options text cho các sản phẩm nếu chưa có
            cart = addOptionsTextToCartItems(cart);
        } catch (error) {
            console.log('Không thể lấy giỏ hàng từ API, sử dụng giỏ hàng local');
            cart = getLocalCart();
            console.log("Đã lấy giỏ hàng từ localStorage:", cart);
        }
        
        // Render giỏ hàng
        console.log("Render giỏ hàng với dữ liệu:", cart);
        renderCart(cart);
        
        // Gắn sự kiện cho nút áp dụng mã giảm giá
        const couponForm = document.getElementById('coupon-form');
        if (couponForm) {
            couponForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const couponInput = document.getElementById('coupon-code');
                if (couponInput) {
                    applyCoupon(couponInput.value.trim());
                }
            });
        }
        
        // Gắn sự kiện cho nút xóa tất cả sản phẩm đã chọn
        const removeSelectedBtn = document.getElementById('remove-selected');
        if (removeSelectedBtn) {
            removeSelectedBtn.addEventListener('click', removeSelectedItems);
        }
        
    } catch (error) {
        console.error('Lỗi khi khởi tạo trang:', error);
        
        // Hiển thị giỏ hàng local trong trường hợp có lỗi
        try {
            const localCart = getLocalCart();
            renderCart(localCart);
        } catch (localError) {
            // Hiển thị thông báo lỗi nếu không thể lấy giỏ hàng local
            const cartContainer = document.querySelector('.cart-container');
            if (cartContainer) {
                cartContainer.innerHTML = `
                    <div style="text-align: center; padding: 50px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                        <h3>Đã xảy ra lỗi</h3>
                        <p>Không thể tải giỏ hàng. Vui lòng thử lại sau.</p>
                        <a href="menu.html" class="btn btn-primary">Quay lại thực đơn</a>
                    </div>
                `;
            }
        }
    }
}

// Hàm cập nhật trạng thái cart steps
function updateCartSteps(currentStep) {
    const steps = document.querySelectorAll('.cart-steps .step');
    steps.forEach((step, index) => {
        if (index + 1 < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Hàm áp dụng mã giảm giá
async function applyCoupon(couponCode) {
    console.log("Áp dụng mã giảm giá:", couponCode);
    if (!couponCode) {
        alert("Vui lòng nhập mã giảm giá");
        return;
    }
    
    try {
        if (isLoggedIn()) {
            // Nếu đã đăng nhập, gọi API để áp dụng mã giảm giá
            const token = getToken();
            const response = await fetchData(`http://localhost:5000/api/cart/apply-coupon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    coupon_code: couponCode
                })
            });
            
            if (response.success) {
                alert("Áp dụng mã giảm giá thành công!");
                renderCart(response.data);
            } else {
                alert(response.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn");
            }
        } else {
            // Nếu chưa đăng nhập, hiển thị thông báo
            alert("Vui lòng đăng nhập để sử dụng mã giảm giá");
        }
    } catch (error) {
        console.error("Lỗi khi áp dụng mã giảm giá:", error);
        alert("Đã xảy ra lỗi khi áp dụng mã giảm giá");
    }
}

// Hàm xóa các sản phẩm đã chọn
function removeSelectedItems() {
    console.log("Xóa các sản phẩm đã chọn");
    const selectedCheckboxes = document.querySelectorAll('.item-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert("Vui lòng chọn ít nhất một sản phẩm để xóa");
        return;
    }
    
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedCheckboxes.length} sản phẩm đã chọn?`)) {
        selectedCheckboxes.forEach(checkbox => {
            const cartItemId = checkbox.dataset.id;
            if (cartItemId) {
                removeCartItem(cartItemId);
            }
        });
    }
}

// Hàm xử lý khi chuyển trang
function handleCheckoutNavigation() {
    const checkoutButton = document.querySelector('.btn-checkout');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            // Lưu trạng thái hiện tại vào localStorage
            localStorage.setItem('cartStep', '2');
        });
    }
}

// Hàm tải sản phẩm liên quan
async function loadRelatedProducts() {
    console.log("Tải sản phẩm liên quan");
    try {
        const relatedProductsContainer = document.getElementById('related-products');
        if (!relatedProductsContainer) {
            console.error("Không tìm thấy phần tử #related-products");
            return;
        }
        
        // Hiển thị loading
        relatedProductsContainer.innerHTML = '<div class="loading">Đang tải sản phẩm liên quan...</div>';
        
        // Gọi API để lấy sản phẩm nổi bật
        const response = await fetchData('http://localhost:5000/api/products?limit=4');
        
        if (!response.success || !response.data) {
            throw new Error("Không thể lấy sản phẩm liên quan");
        }
        
        const products = response.data;
        console.log("Sản phẩm liên quan:", products);
        
        // Xóa loading
        relatedProductsContainer.innerHTML = '';
        
        // Hiển thị sản phẩm
        products.forEach(product => {
            // Xử lý URL ảnh
            let imageUrl = '/img/_12A7780.jpg'; // Ảnh mặc định
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                const firstImage = product.images[0];
                if (typeof firstImage === 'string') {
                    imageUrl = firstImage;
                } else if (firstImage.img_url) {
                    imageUrl = firstImage.img_url;
                } else if (firstImage.url) {
                    imageUrl = firstImage.url;
                }
            }
            
            // Tạo HTML cho sản phẩm
            const productElement = document.createElement('div');
            productElement.classList.add('product-card');
            productElement.innerHTML = `
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='/img/_12A7780.jpg';">
                    <div class="product-actions">
                        <button class="btn-add-to-cart" data-product-id="${product.product_id}">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        <button class="btn-quick-view" data-product-id="${product.product_id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                </div>
            `;
            
            // Thêm sản phẩm vào container
            relatedProductsContainer.appendChild(productElement);
        });
        
        console.log("Related products loaded and displayed.");
    } catch (error) {
        console.error("Lỗi khi tải sản phẩm liên quan:", error);
        const relatedProductsContainer = document.getElementById('related-products');
        if (relatedProductsContainer) {
            relatedProductsContainer.innerHTML = '<div class="error">Không thể tải sản phẩm liên quan</div>';
        }
    }
}

// Khởi chạy khi trang đã tải xong
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM đã tải xong, khởi tạo trang giỏ hàng");
    
    // Kiểm tra xem có template cho cart item không
    const cartItemTemplate = document.getElementById('cart-item-template');
    if (cartItemTemplate) {
        console.log("Đã tìm thấy template cart-item-template");
        const templateContent = cartItemTemplate.content.cloneNode(true);
        const itemOptionsElement = templateContent.querySelector('.item-options');
        if (itemOptionsElement) {
            console.log("Template có phần tử item-options");
        } else {
            console.warn("Template không có phần tử item-options");
        }
    } else {
        console.error("Không tìm thấy template cart-item-template");
    }
    
    initPage();
    // Đặt cart step mặc định là 1 (Giỏ hàng)
    updateCartSteps(1);
    handleCheckoutNavigation();
    
    // Tải sản phẩm liên quan
    loadRelatedProducts();
    
    // Kiểm tra xem có thông báo thành công từ trang khác không
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    
    if (successMessage) {
        alert(decodeURIComponent(successMessage));
        // Xóa tham số khỏi URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
