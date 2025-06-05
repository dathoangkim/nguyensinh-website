// API URL
const API_BASE_URL = 'http://localhost:5000/api';

// Hàm để lấy dữ liệu từ API
async function fetchData(endpoint) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi lấy dữ liệu từ ${endpoint}:`, error);
        throw error;
    }
}

// Hàm tải sản phẩm nổi bật
async function loadFeaturedProducts() {
    try {
        // Sử dụng các sản phẩm mẫu từ HTML khi API chưa sẵn sàng
        const productsContainer = document.querySelector('.products-grid');
        if (productsContainer) {
            // Giữ nguyên nội dung HTML hiện tại
            return;
        }
        
        // Nếu không có container sẵn, thử gọi API
        try {
            const products = await fetchData('/products?featured=true&limit=4');
            // Đảm bảo products là một mảng
            if (products && Array.isArray(products)) {
                displayFeaturedProducts(products);
            } else if (products && Array.isArray(products.data)) {
                displayFeaturedProducts(products.data);
            } else {
                // Nếu không phải mảng, tạo mảng mẫu
                displayFeaturedProductsStatic();
            }
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm nổi bật từ API:', error);
            displayFeaturedProductsStatic();
        }
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm nổi bật:', error);
        displayFeaturedProductsStatic();
    }
}

// Hàm hiển thị sản phẩm nổi bật tĩnh khi API chưa sẵn sàng
function displayFeaturedProductsStatic() {
    // Không làm gì cả, giữ nguyên HTML hiện tại
    console.log('Sử dụng dữ liệu sản phẩm nổi bật tĩnh từ HTML');
}

// Hàm hiển thị sản phẩm nổi bật
function displayFeaturedProducts(products) {
    const featuredContainer = document.querySelector('.products-grid');
    if (!featuredContainer) return;
    
    // Xóa nội dung hiện tại
    featuredContainer.innerHTML = '';
    
    // Đảm bảo products là một mảng
    if (!Array.isArray(products)) {
        console.error('Dữ liệu sản phẩm không phải là mảng:', products);
        return;
    }
    
    // Tạo HTML cho từng sản phẩm
    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-card';
        
        productDiv.innerHTML = `
            <div class="product-image">
                <img src="${product.image_url || 'img/product-placeholder.jpg'}" alt="${product.name}">
                ${product.discount_percent ? `<span class="discount-badge">-${product.discount_percent}%</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.short_description || ''}</p>
                <div class="product-price">
                    ${product.discount_price ? 
                        `<span class="original-price">${formatCurrency(product.price)}</span>
                        <span class="discounted-price">${formatCurrency(product.discount_price)}</span>` : 
                        `<span class="price">${formatCurrency(product.price)}</span>`
                    }
                </div>
                <div class="product-actions">
                    <button class="btn-add-to-cart" data-product-id="${product.product_id}">
                        <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                    </button>
                    <a href="pages/menu.html#product-${product.product_id}" class="btn-view-details">
                        Chi tiết
                    </a>
                </div>
            </div>
        `;
        
        featuredContainer.appendChild(productDiv);
    });
    
    // Thêm sự kiện cho nút "Thêm vào giỏ"
    attachAddToCartEvents();
}

// Hàm tải đánh giá của khách hàng
async function loadTestimonials() {
    try {
        // Kiểm tra xem đã có testimonials trong HTML chưa
        const testimonialsContainer = document.querySelector('.testimonials-slider');
        if (testimonialsContainer && testimonialsContainer.children.length > 0) {
            // Đã có testimonials trong HTML, không cần tải từ API
            return;
        }
        
        try {
            const reviews = await fetchData('/reviews?featured=true&limit=3');
            if (reviews && Array.isArray(reviews)) {
                displayTestimonials(reviews);
            } else if (reviews && Array.isArray(reviews.data)) {
                displayTestimonials(reviews.data);
            } else {
                // Nếu không phải mảng, giữ nguyên HTML hiện tại
                console.log('Sử dụng đánh giá tĩnh từ HTML');
            }
        } catch (error) {
            console.error('Lỗi khi tải đánh giá từ API:', error);
            // Giữ nguyên HTML hiện tại
        }
    } catch (error) {
        console.error('Lỗi khi tải đánh giá của khách hàng:', error);
    }
}

// Hàm hiển thị đánh giá của khách hàng
function displayTestimonials(reviews) {
    const testimonialsContainer = document.querySelector('.testimonials-slider');
    if (!testimonialsContainer) return;
    
    // Nếu không có dữ liệu hoặc không phải mảng, giữ nguyên HTML hiện tại
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
        return;
    }
    
    // Xóa nội dung hiện tại
    testimonialsContainer.innerHTML = '';
    
    // Tạo HTML cho từng đánh giá
    reviews.forEach(review => {
        const testimonialDiv = document.createElement('div');
        testimonialDiv.className = 'testimonial-item';
        
        // Tạo HTML cho số sao
        let starsHTML = '';
        const fullStars = Math.floor(review.rating);
        const hasHalfStar = review.rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        
        testimonialDiv.innerHTML = `
            <div class="testimonial-content">
                <div class="testimonial-rating">
                    ${starsHTML}
                </div>
                <p class="testimonial-text">"${review.content}"</p>
                <div class="testimonial-author">
                    <img src="${review.user_avatar || 'img/user-placeholder.jpg'}" alt="${review.user_name}">
                    <div class="author-info">
                        <h4>${review.user_name}</h4>
                        <p>${review.user_title || 'Khách hàng'}</p>
                    </div>
                </div>
            </div>
        `;
        
        testimonialsContainer.appendChild(testimonialDiv);
    });
}

// Hàm tải bài viết blog mới nhất
async function loadLatestBlogs() {
    try {
        // Kiểm tra xem đã có blog posts trong HTML chưa
        const blogContainer = document.querySelector('.blog-posts');
        if (!blogContainer) {
            // Không có container blog, có thể không cần hiển thị blog
            return;
        }
        
        if (blogContainer.children.length > 0) {
            // Đã có blog posts trong HTML, không cần tải từ API
            return;
        }
        
        try {
            const response = await fetchData('/blogs?limit=3');
            let posts = [];
            
            if (response && Array.isArray(response)) {
                posts = response;
            } else if (response && Array.isArray(response.posts)) {
                posts = response.posts;
            } else if (response && Array.isArray(response.data)) {
                posts = response.data;
            }
            
            if (posts.length > 0) {
                displayLatestBlogs(posts);
            } else {
                // Nếu không có dữ liệu, giữ nguyên HTML hiện tại
                console.log('Không có dữ liệu blog từ API, giữ nguyên HTML');
            }
        } catch (error) {
            console.error('Lỗi khi tải blog từ API:', error);
            // Giữ nguyên HTML hiện tại
        }
    } catch (error) {
        console.error('Lỗi khi tải bài viết blog mới nhất:', error);
    }
}

// Hàm hiển thị bài viết blog mới nhất
function displayLatestBlogs(posts) {
    const blogContainer = document.querySelector('.blog-posts');
    if (!blogContainer) return;
    
    // Nếu không có dữ liệu hoặc không phải mảng, giữ nguyên HTML hiện tại
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
        return;
    }
    
    // Xóa nội dung hiện tại
    blogContainer.innerHTML = '';
    
    // Tạo HTML cho từng bài viết
    posts.forEach(post => {
        const blogDiv = document.createElement('div');
        blogDiv.className = 'blog-post';
        
        blogDiv.innerHTML = `
            <div class="post-image">
                <img src="${post.img_url || 'img/blog-placeholder.jpg'}" alt="${post.title}">
            </div>
            <div class="post-content">
                <span class="post-category">${post.category_name || 'Tin tức'}</span>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.content ? post.content.substring(0, 100) + '...' : ''}</p>
                <div class="post-meta">
                    <span class="post-date">${formatDate(post.published_at || new Date())}</span>
                    <a href="pages/blog-detail.html?id=${post.post_id}" class="read-more">Đọc tiếp <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>
        `;
        
        blogContainer.appendChild(blogDiv);
    });
}

// Hàm tải cửa hàng gần nhất
async function loadNearestStores() {
    try {
        // Kiểm tra xem đã có stores trong HTML chưa
        const storesContainer = document.querySelector('.store-locations');
        if (!storesContainer) {
            // Không có container stores, có thể không cần hiển thị stores
            return;
        }
        
        if (storesContainer.children.length > 0) {
            // Đã có stores trong HTML, không cần tải từ API
            return;
        }
        
        // Lấy vị trí người dùng nếu có thể
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    try {
                        const stores = await fetchData(`/stores/nearest/${lat}/${lng}?limit=3`);
                        if (stores && Array.isArray(stores)) {
                            displayStores(stores);
                        } else if (stores && Array.isArray(stores.data)) {
                            displayStores(stores.data);
                        } else {
                            // Nếu không có dữ liệu, thử tải tất cả cửa hàng
                            loadAllStores();
                        }
                    } catch (error) {
                        console.error('Lỗi khi tải cửa hàng gần nhất:', error);
                        loadAllStores();
                    }
                },
                (error) => {
                    console.error('Lỗi khi lấy vị trí người dùng:', error);
                    loadAllStores();
                }
            );
        } else {
            loadAllStores();
        }
    } catch (error) {
        console.error('Lỗi khi tải cửa hàng gần nhất:', error);
        loadAllStores();
    }
}

// Hàm tải tất cả cửa hàng
async function loadAllStores() {
    try {
        // Kiểm tra xem đã có stores trong HTML chưa
        const storesContainer = document.querySelector('.store-locations');
        if (!storesContainer || storesContainer.children.length > 0) {
            // Đã có stores trong HTML hoặc không có container, không cần tải từ API
            return;
        }
        
        try {
            const stores = await fetchData('/stores?limit=3');
            if (stores && Array.isArray(stores)) {
                displayStores(stores);
            } else if (stores && Array.isArray(stores.data)) {
                displayStores(stores.data);
            } else {
                // Nếu không có dữ liệu, giữ nguyên HTML hiện tại
                console.log('Không có dữ liệu cửa hàng từ API, giữ nguyên HTML');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách cửa hàng từ API:', error);
            // Giữ nguyên HTML hiện tại
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách cửa hàng:', error);
    }
}

// Hàm hiển thị cửa hàng
function displayStores(stores) {
    const storesContainer = document.querySelector('.store-locations');
    if (!storesContainer) return;
    
    // Nếu không có dữ liệu hoặc không phải mảng, giữ nguyên HTML hiện tại
    if (!stores || !Array.isArray(stores) || stores.length === 0) {
        return;
    }
    
    // Xóa nội dung hiện tại
    storesContainer.innerHTML = '';
    
    // Tạo HTML cho từng cửa hàng
    stores.forEach(store => {
        const storeDiv = document.createElement('div');
        storeDiv.className = 'store-card';
        
        storeDiv.innerHTML = `
            <h3 class="store-name">${store.name}</h3>
            <div class="store-info">
                <p><i class="fas fa-map-marker-alt"></i> ${store.address}, ${store.district || ''}, ${store.city || ''}</p>
                <p><i class="fas fa-phone"></i> ${store.phone || 'Chưa cập nhật'}</p>
                <p><i class="fas fa-clock"></i> ${store.opening_hours || 'Chưa cập nhật'}</p>
            </div>
            <a href="pages/locations.html#store-${store.store_id}" class="btn btn-text">Xem chi tiết <i class="fas fa-arrow-right"></i></a>
        `;
        
        storesContainer.appendChild(storeDiv);
    });
}

// Hàm thêm sự kiện cho nút "Thêm vào giỏ"
function attachAddToCartEvents() {
    const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const productId = this.dataset.productId;
            
            try {
                // Kiểm tra xem người dùng đã đăng nhập chưa
                const userInfo = getUserInfo();
                
                if (userInfo && userInfo.user_id) {
                    // Nếu đã đăng nhập, thêm vào giỏ hàng
                    await addToCart(productId, 1, userInfo.user_id);
                    showNotification('Đã thêm sản phẩm vào giỏ hàng!', 'success');
                } else {
                    // Nếu chưa đăng nhập, lưu vào localStorage
                    addToLocalCart(productId, 1);
                    showNotification('Đã thêm sản phẩm vào giỏ hàng!', 'success');
                }
            } catch (error) {
                console.error('Lỗi khi thêm vào giỏ hàng:', error);
                showNotification('Có lỗi xảy ra khi thêm vào giỏ hàng', 'error');
            }
        });
    });
}

// Hàm thêm sản phẩm vào giỏ hàng (API)
async function addToCart(productId, quantity, userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity,
                user_id: userId
            })
        });
        
        if (!response.ok) {
            throw new Error('Lỗi khi thêm vào giỏ hàng');
        }
        
        // Cập nhật số lượng sản phẩm trong giỏ hàng
        updateCartCount();
        
        return await response.json();
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        throw error;
    }
}

// Hàm thêm sản phẩm vào giỏ hàng local (localStorage)
function addToLocalCart(productId, quantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
        // Nếu đã có, tăng số lượng
        existingItem.quantity += quantity;
    } else {
        // Nếu chưa có, thêm mới
        cart.push({
            product_id: productId,
            quantity: quantity
        });
    }
    
    // Lưu giỏ hàng vào localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCartCount();
}

// Hàm cập nhật số lượng sản phẩm trong giỏ hàng
function updateCartCount() {
    // Lấy giỏ hàng từ localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Tính tổng số lượng sản phẩm
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Cập nhật hiển thị
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        
        if (totalItems > 0) {
            cartCountElement.style.display = 'block';
        } else {
            cartCountElement.style.display = 'none';
        }
    }
}

// Hàm lấy thông tin người dùng từ localStorage
function getUserInfo() {
    const userInfo = localStorage.getItem('user');
    return userInfo ? JSON.parse(userInfo) : null;
}

// Hàm hiển thị thông báo
function showNotification(message, type = 'info') {
    // Kiểm tra xem đã có container thông báo chưa
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        // Nếu chưa có, tạo mới
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Thêm CSS cho container
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
    }
    
    // Tạo thông báo mới
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Thêm CSS cho thông báo
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3';
    notification.style.color = 'white';
    notification.style.padding = '12px 16px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.display = 'flex';
    notification.style.justifyContent = 'space-between';
    notification.style.alignItems = 'center';
    notification.style.minWidth = '300px';
    notification.style.maxWidth = '400px';
    notification.style.animation = 'slideIn 0.3s ease-out forwards';
    
    // Thêm CSS cho nút đóng
    const closeButton = notification.querySelector('.notification-close');
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    
    // Thêm sự kiện đóng thông báo
    closeButton.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    // Thêm thông báo vào container
    notificationContainer.appendChild(notification);
    
    // Tự động đóng thông báo sau 5 giây
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode === notificationContainer) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
    
    // Thêm CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Hàm định dạng tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Hàm định dạng ngày tháng
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
}

// Hàm khởi tạo trang
async function initPage() {
    try {
        // Tải sản phẩm nổi bật
        await loadFeaturedProducts();
        
        // Tải đánh giá của khách hàng
        await loadTestimonials();
        
        // Tải bài viết blog mới nhất
        await loadLatestBlogs();
        
        // Tải cửa hàng gần nhất
        await loadNearestStores();
        
        // Cập nhật số lượng sản phẩm trong giỏ hàng
        updateCartCount();
    } catch (error) {
        console.error('Lỗi khi khởi tạo trang:', error);
    }
}

// Khởi chạy khi trang đã tải xong
document.addEventListener('DOMContentLoaded', initPage);