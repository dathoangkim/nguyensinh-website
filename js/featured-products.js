// Featured Products Handler for Index Page
class FeaturedProductsHandler {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api/products'; // Đảm bảo URL đúng
        this.productsContainer = document.querySelector('.products-grid');
        this.init();
    }

    async init() {
        try {
            await this.loadFeaturedProducts();
        } catch (error) {
            console.error('Error initializing featured products:', error);
            this.showErrorMessage();
        }
    }

    async loadFeaturedProducts() {
        try {
            // Hiển thị loading state
            this.showLoadingState();

            // Gọi API để lấy tất cả sản phẩm
            const response = await fetch(`${this.apiUrl}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data); // Debug log
            
            // Lọc sản phẩm featured - kiểm tra cả hai điều kiện
            const featuredProducts = data.filter(product => {
                const isFeatured = product.status === 'featured' || product.featured === 1;
                console.log(`Product ${product.name}: status=${product.status}, featured=${product.featured}, isFeatured=${isFeatured}`);
                return isFeatured;
            });

            console.log('Featured products found:', featuredProducts.length); // Debug log
            console.log('Featured products:', featuredProducts); // Debug log

            // Lấy 4 sản phẩm đầu tiên (hoặc tất cả nếu ít hơn 4)
            const selectedProducts = featuredProducts.slice(0, 4);
            console.log('Selected products for display:', selectedProducts.length); // Debug log

            if (selectedProducts.length === 0) {
                this.showNoProductsMessage();
                return;
            }

            // Render sản phẩm
            this.renderProducts(selectedProducts);

        } catch (error) {
            console.error('Error loading featured products:', error);
            this.showErrorMessage();
        }
    }

    showLoadingState() {
        if (this.productsContainer) {
            this.productsContainer.innerHTML = `
                <div class="loading-container" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <div class="loading-text">Đang tải sản phẩm...</div>
                    </div>
                </div>
            `;
        }
    }

    showErrorMessage() {
        if (this.productsContainer) {
            this.productsContainer.innerHTML = `
                <div class="error-container" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-refresh"></i> Thử lại
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showNoProductsMessage() {
        if (this.productsContainer) {
            this.productsContainer.innerHTML = `
                <div class="no-products-container" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <p>Hiện tại chưa có sản phẩm nổi bật nào.</p>
                        <a href="pages/menu.html" class="btn btn-primary">
                            <i class="fas fa-utensils"></i> Xem tất cả sản phẩm
                        </a>
                    </div>
                </div>
            `;
        }
    }

    renderProducts(products) {
        if (!this.productsContainer) {
            console.error('Products container not found');
            return;
        }

        console.log('Rendering products:', products.length); // Debug log

        const productsHTML = products.map((product, index) => {
            console.log(`Creating card for product ${index + 1}:`, product.name); // Debug log
            return this.createProductCard(product);
        }).join('');
        
        this.productsContainer.innerHTML = productsHTML;

        // Khởi tạo event listeners sau khi render
        this.initializeEventListeners();
        
        console.log('Products rendered successfully'); // Debug log
    }

    createProductCard(product) {
        const formattedPrice = this.formatPrice(product.price);
        const originalPrice = product.cost_price ? this.formatPrice(product.cost_price) : null;
        const discountPercent = originalPrice ? this.calculateDiscount(product.cost_price, product.price) : 0;
        const rating = this.generateRandomRating();
        const reviewCount = this.generateRandomReviewCount();
        
        return `
            <div class="product-card animate-fade-in-up" data-product-id="${product.product_id}">
                <div class="product-image">
                    <img src="${product.image_url || 'img/default-product.jpg'}" 
                         alt="${product.name}"
                         onerror="this.src='img/default-product.jpg'">
                    ${this.getBadgeHTML(product, discountPercent)}
                </div>
                <div class="product-info">
                    <div class="product-category">
                        <span class="category-tag">${product.category_name || 'Sản phẩm'}</span>
                    </div>
                    <h3>
                        <a href="pages/product-detail.html?id=${product.product_id}" class="product-title-link">
                            ${product.name}
                        </a>
                    </h3>
                    <div class="product-rating">
                        ${this.generateStarRating(rating.score)}
                        <span class="review-count">(${reviewCount} đánh giá)</span>
                    </div>
                    <p class="product-description">
                        ${this.truncateDescription(product.description, 80)}
                    </p>
                    <div class="product-price">
                        ${originalPrice && discountPercent > 0 ? 
                            `<span class="original-price">${originalPrice}</span>` : ''
                        }
                        <span class="current-price">${formattedPrice}</span>
                        ${product.stock_quantity <= 5 ? 
                            `<span class="stock-warning">Chỉ còn ${product.stock_quantity} sản phẩm</span>` : ''
                        }
                    </div>
                    <div class="product-actions">
                        <a href="pages/product-detail.html?id=${product.product_id}" class="btn btn-primary btn-sm">
                            <i class="fas fa-info-circle"></i>
                            Chi tiết
                        </a>
                        <button class="product-action-btn add-to-cart" 
                                data-product-id="${product.product_id}"
                                data-product-name="${product.name}"
                                data-product-price="${product.price}"
                                data-product-image="${product.image_url}"
                                title="Thêm vào giỏ hàng">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        <button class="product-action-btn add-to-wishlist" 
                                data-product-id="${product.product_id}"
                                title="Thêm vào yêu thích">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getBadgeHTML(product, discountPercent) {
        if (discountPercent > 0) {
            return `<div class="product-badge discount">-${discountPercent}%</div>`;
        } else if (product.status === 'featured' || product.featured === 1) {
            return `<div class="product-badge featured">Nổi bật</div>`;
        } else if (this.isNewProduct(product.created_at)) {
            return `<div class="product-badge new">Mới</div>`;
        }
        return '';
    }

    isNewProduct(createdAt) {
        const productDate = new Date(createdAt);
        const now = new Date();
        const daysDiff = (now - productDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(parseFloat(price));
    }

    calculateDiscount(originalPrice, salePrice) {
        const original = parseFloat(originalPrice);
        const sale = parseFloat(salePrice);
        if (original <= sale) return 0;
        return Math.round(((original - sale) / original) * 100);
    }

    truncateDescription(description, maxLength) {
        if (!description) return '';
        if (description.length <= maxLength) return description;
        return description.substring(0, maxLength) + '...';
    }

    generateRandomRating() {
        const scores = [4.0, 4.2, 4.5, 4.7, 4.8, 5.0];
        const score = scores[Math.floor(Math.random() * scores.length)];
        return { score };
    }

    generateRandomReviewCount() {
        return Math.floor(Math.random() * 200) + 20;
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }
        
        return starsHTML;
    }

    initializeEventListeners() {
        // Add to cart functionality
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddToCart(button);
            });
        });

        // Add to wishlist functionality
        const wishlistButtons = document.querySelectorAll('.add-to-wishlist');
        wishlistButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddToWishlist(button);
            });
        });

        // Product card hover effects
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    handleAddToCart(button) {
        const productData = {
            id: button.dataset.productId,
            name: button.dataset.productName,
            price: button.dataset.productPrice,
            image: button.dataset.productImage,
            quantity: 1
        };

        this.addToLocalCart(productData);
        this.showNotification('success', `${productData.name} đã được thêm vào giỏ hàng`);
        this.updateCartCount();

        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    handleAddToWishlist(button) {
        const productId = button.dataset.productId;
        const icon = button.querySelector('i');
        
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#e74c3c';
            this.addToLocalWishlist(productId);
            this.showNotification('info', 'Đã thêm vào danh sách yêu thích');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
            this.removeFromLocalWishlist(productId);
            this.showNotification('info', 'Đã xóa khỏi danh sách yêu thích');
        }
    }

    addToLocalCart(product) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(product);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    addToLocalWishlist(productId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (!wishlist.includes(productId)) {
            wishlist.push(productId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
    }

    removeFromLocalWishlist(productId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        wishlist = wishlist.filter(id => id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
            cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    handleAddToWishlist(button) {
        const productId = button.dataset.productId;
        const icon = button.querySelector('i');
        
        if (icon.classList.contains('far')) {
            // Add to wishlist
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#e74c3c';
            this.addToLocalWishlist(productId);
            this.showNotification('info', 'Đã thêm vào danh sách yêu thích');
        } else {
            // Remove from wishlist
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
            this.removeFromLocalWishlist(productId);
            this.showNotification('info', 'Đã xóa khỏi danh sách yêu thích');
        }
    }

    addToLocalCart(product) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(product);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    addToLocalWishlist(productId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (!wishlist.includes(productId)) {
            wishlist.push(productId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
    }

    removeFromLocalWishlist(productId) {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        wishlist = wishlist.filter(id => id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    }

    showNotification(type, message) {
        const notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        notificationContainer.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FeaturedProductsHandler();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeaturedProductsHandler;
}

// Additional utility functions for featured products
class ProductUtils {
    static formatCurrency(amount, currency = 'VND') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    static calculateDiscountPercentage(originalPrice, salePrice) {
        if (!originalPrice || !salePrice || originalPrice <= salePrice) {
            return 0;
        }
        return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    }

    static truncateText(text, maxLength = 100) {
        if (!text || text.length <= maxLength) {
            return text || '';
        }
        return text.substring(0, maxLength).trim() + '...';
    }

    static generateProductUrl(product) {
        return `pages/product-detail.html?id=${product.product_id}&slug=${product.slug}`;
    }

    static isProductNew(createdAt, daysThreshold = 30) {
        const productDate = new Date(createdAt);
        const now = new Date();
        const daysDifference = (now - productDate) / (1000 * 60 * 60 * 24);
        return daysDifference <= daysThreshold;
    }

    static getProductBadge(product) {
        const originalPrice = parseFloat(product.cost_price || 0);
        const salePrice = parseFloat(product.price || 0);
        const discountPercent = this.calculateDiscountPercentage(originalPrice, salePrice);

        if (discountPercent > 0) {
            return {
                type: 'discount',
                text: `-${discountPercent}%`,
                class: 'product-badge discount'
            };
        }

        if (product.status === 'featured' || product.featured === 1) {
            return {
                type: 'featured',
                text: 'Nổi bật',
                class: 'product-badge featured'
            };
        }

        if (this.isProductNew(product.created_at)) {
            return {
                type: 'new',
                text: 'Mới',
                class: 'product-badge new'
            };
        }

        if (product.stock_quantity <= 5) {
            return {
                type: 'limited',
                text: 'Sắp hết',
                class: 'product-badge limited'
            };
        }

        return null;
    }

    static generateStarRating(rating, showNumber = false) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let html = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            html += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            html += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            html += '<i class="far fa-star"></i>';
        }

        if (showNumber) {
            html += ` <span class="rating-number">(${rating.toFixed(1)})</span>`;
        }
        
        return html;
    }

    static getRandomRating() {
        const ratings = [4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0];
        return ratings[Math.floor(Math.random() * ratings.length)];
    }

    static getRandomReviewCount() {
        return Math.floor(Math.random() * 150) + 10; // 10-160 reviews
    }

    static validateImageUrl(url) {
        if (!url) return 'img/default-product.jpg';
        
        // Check if URL is valid
        try {
            new URL(url);
            return url;
        } catch {
            return 'img/default-product.jpg';
        }
    }

    static createImageWithFallback(src, alt, className = '') {
        return `
            <img src="${this.validateImageUrl(src)}" 
                 alt="${alt}" 
                 class="${className}"
                 onerror="this.src='img/default-product.jpg'; this.onerror=null;"
                 loading="lazy">
        `;
    }
}

// Enhanced Featured Products Handler with better error handling and features
class EnhancedFeaturedProductsHandler extends FeaturedProductsHandler {
    constructor() {
        super();
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    async loadFeaturedProducts() {
        try {
            this.showLoadingState();

            const response = await this.fetchWithRetry(`${this.apiUrl}?status=featured&limit=6`);
            const data = await response.json();
            
            const featuredProducts = data
                .filter(product => product.status === 'featured' && product.featured === 1)
                .slice(0, 4);

            if (featuredProducts.length === 0) {
                this.showNoProductsMessage();
                return;
            }

            this.renderProducts(featuredProducts);
            this.initializeIntersectionObserver();

        } catch (error) {
            console.error('Error loading featured products:', error);
            this.showErrorMessage();
        }
    }

    async fetchWithRetry(url, options = {}) {
        for (let i = 0; i <= this.maxRetries; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return response;
            } catch (error) {
                if (i === this.maxRetries) {
                    throw error;
                }
                
                console.warn(`Attempt ${i + 1} failed, retrying in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                this.retryDelay *= 2; // Exponential backoff
            }
        }
    }

    createProductCard(product) {
        const formattedPrice = ProductUtils.formatCurrency(product.price);
        const originalPrice = product.cost_price ? ProductUtils.formatCurrency(product.cost_price) : null;
        const badge = ProductUtils.getProductBadge(product);
        const rating = ProductUtils.getRandomRating();
        const reviewCount = ProductUtils.getRandomReviewCount();
        const productUrl = ProductUtils.generateProductUrl(product);
        
        return `
            <div class="product-card animate-fade-in-up" 
                 data-product-id="${product.product_id}"
                 data-aos="fade-up"
                 data-aos-delay="100">
                <div class="product-image">
                    ${ProductUtils.createImageWithFallback(product.image_url, product.name)}
                    ${badge ? `<div class="${badge.class}">${badge.text}</div>` : ''}
                    <div class="product-overlay">
                        <button class="quick-view-btn" data-product-id="${product.product_id}">
                            <i class="fas fa-eye"></i>
                            <span>Xem nhanh</span>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">
                        <span class="category-tag">${product.category_name || 'Sản phẩm'}</span>
                    </div>
                    <h3>
                        <a href="${productUrl}" class="product-title-link">
                            ${product.name}
                        </a>
                    </h3>
                    <div class="product-rating">
                        ${ProductUtils.generateStarRating(rating)}
                        <span class="review-count">(${reviewCount} đánh giá)</span>
                    </div>
                    <p class="product-description">
                        ${ProductUtils.truncateText(product.description, 80)}
                    </p>
                    <div class="product-price">
                        ${originalPrice && badge?.type === 'discount' ? 
                            `<span class="original-price">${originalPrice}</span>` : ''
                        }
                        <span class="current-price">${formattedPrice}</span>
                        ${product.stock_quantity <= 5 ? 
                            `<span class="stock-warning">Chỉ còn ${product.stock_quantity} sản phẩm</span>` : ''
                        }
                    </div>
                    <div class="product-actions">
                        <a href="${productUrl}" class="btn btn-primary btn-sm">
                            <i class="fas fa-info-circle"></i>
                            Chi tiết
                        </a>
                        <button class="product-action-btn add-to-cart" 
                                data-product-id="${product.product_id}"
                                data-product-name="${product.name}"
                                data-product-price="${product.price}"
                                data-product-image="${product.image_url}"
                                title="Thêm vào giỏ hàng">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        <button class="product-action-btn add-to-wishlist" 
                                data-product-id="${product.product_id}"
                                title="Thêm vào yêu thích">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="product-action-btn compare-btn" 
                                data-product-id="${product.product_id}"
                                title="So sánh sản phẩm">
                            <i class="fas fa-balance-scale"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    initializeIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, options);

        document.querySelectorAll('.product-card').forEach(card => {
            observer.observe(card);
        });
    }

    initializeEventListeners() {
        super.initializeEventListeners();

        // Quick view functionality
        const quickViewButtons = document.querySelectorAll('.quick-view-btn');
        quickViewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleQuickView(button.dataset.productId);
            });
        });

        // Compare functionality
        const compareButtons = document.querySelectorAll('.compare-btn');
        compareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleCompare(button.dataset.productId);
            });
        });

        // Product title links
        const titleLinks = document.querySelectorAll('.product-title-link');
        titleLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Track product view
                this.trackProductView(link.closest('.product-card').dataset.productId);
            });
        });
    }

    handleQuickView(productId) {
        // Implement quick view modal
        console.log('Quick view for product:', productId);
        this.showNotification('info', 'Tính năng xem nhanh đang được phát triển');
    }

    handleCompare(productId) {
        let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
        
        if (compareList.includes(productId)) {
            compareList = compareList.filter(id => id !== productId);
            this.showNotification('info', 'Đã xóa khỏi danh sách so sánh');
        } else {
            if (compareList.length >= 3) {
                this.showNotification('warning', 'Chỉ có thể so sánh tối đa 3 sản phẩm');
                return;
            }
            compareList.push(productId);
            this.showNotification('success', 'Đã thêm vào danh sách so sánh');
        }
        
        localStorage.setItem('compareList', JSON.stringify(compareList));
        this.updateCompareCount();
    }

    updateCompareCount() {
        const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
        const compareCountElement = document.querySelector('.compare-count');
        if (compareCountElement) {
            compareCountElement.textContent = compareList.length;
            compareCountElement.style.display = compareList.length > 0 ? 'flex' : 'none';
        }
    }

    trackProductView(productId) {
        // Track product views for analytics
        const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
        const timestamp = new Date().toISOString();
        
        viewedProducts.push({
            productId,
            timestamp,
            page: 'homepage'
        });

        // Keep only last 50 views
        if (viewedProducts.length > 50) {
            viewedProducts.splice(0, viewedProducts.length - 50);
        }

        localStorage.setItem('viewedProducts', JSON.stringify(viewedProducts));
    }

    // Initialize wishlist state from localStorage
    initializeWishlistState() {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        wishlist.forEach(productId => {
            const wishlistBtn = document.querySelector(`[data-product-id="${productId}"].add-to-wishlist`);
            if (wishlistBtn) {
                const icon = wishlistBtn.querySelector('i');
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#e74c3c';
            }
        });
    }

    // Override the render method to include wishlist state initialization
    renderProducts(products) {
        super.renderProducts(products);
        this.initializeWishlistState();
        this.updateCartCount();
        this.updateCompareCount();
    }
}

// Initialize the enhanced handler
document.addEventListener('DOMContentLoaded', () => {
    // Use enhanced handler instead of basic one
    new EnhancedFeaturedProductsHandler();
});

// Additional CSS styles for enhanced features (add to your CSS file)
const additionalStyles = `
<style>
/* Product Card Enhancements */
.product-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.product-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.product-card:hover .product-overlay {
    opacity: 1;
}

.quick-view-btn {
    background: var(--secondary-color);
    color: var(--primary-color);
    border: none;
    padding: 12px 20px;
    border-radius: var(--border-radius);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 8px;
}

.quick-view-btn:hover {
    background: var(--secondary-color-light);
    transform: translateY(-2px);
}

.product-category {
    margin-bottom: 8px;
}

.category-tag {
    background: rgba(212, 175, 55, 0.1);
    color: var(--secondary-color);
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.product-title-link {
    color: inherit;
    text-decoration: none;
    transition: color 0.3s ease;
}

.product-title-link:hover {
    color: var(--secondary-color);
}

.review-count {
    color: #666;
    font-size: 0.85rem;
    margin-left: 5px;
}

.product-description {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 15px;
}

.current-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--secondary-color);
}

.original-price {
    text-decoration: line-through;
    color: #999;
    font-size: 0.9rem;
    margin-right: 8px;
}

.stock-warning {
    display: block;
    color: #dc3545;
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 4px;
}

.product-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 15px;
}

.product-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
    color: #666;
}

.product-action-btn:hover {
    background-color: var(--secondary-color);
    color: var(--primary-color);
    border-color: var(--secondary-color);
    transform: translateY(-2px);
}

.product-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    z-index: 2;
}

.product-badge.discount {
    background: #dc3545;
    color: white;
}

.product-badge.featured {
    background: var(--secondary-color);
    color: var(--primary-color);
}

.product-badge.new {
    background: #28a745;
    color: white;
}

.product-badge.limited {
    background: #ff6b35;
    color: white;
}

/* Animation classes */
.animate-fade-in-up {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease;
}

.animate-fade-in-up.animate {
    opacity: 1;
    transform: translateY(0);
}

/* Loading states */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid var(--secondary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-text {
    color: #666;
    font-size: 1rem;
}

/* Error and empty states */
.error-container,
.no-products-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
}

.alert {
    padding: 20px;
    border-radius: var(--border-radius);
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.alert.alert-danger {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
}

.alert.alert-info {
    background-color: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
}

.alert i {
    font-size: 2rem;
    margin-bottom: 10px;
}

/* Compare functionality */
.compare-count {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: var(--secondary-color);
    color: var(--primary-color);
    font-size: 0.7rem;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: none;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

/* Responsive enhancements */
@media (max-width: 768px) {
    .product-actions {
        flex-wrap: wrap;
        gap: 6px;
    }
    
    .product-action-btn {
        width: 32px;
        height: 32px;
        font-size: 0.85rem;
    }
    
    .quick-view-btn {
        padding: 10px 16px;
        font-size: 0.9rem;
    }
    
    .current-price {
        font-size: 1.1rem;
    }
    
    .product-badge {
        top: 8px;
        left: 8px;
        padding: 4px 8px;
        font-size: 0.7rem;
    }
}

@media (max-width: 576px) {
    .product-overlay {
        position: static;
        background: none;
        opacity: 1;
        margin-top: 10px;
    }
    
    .quick-view-btn {
        width: 100%;
        justify-content: center;
    }
    
    .product-actions {
        justify-content: space-between;
    }
    
    .btn.btn-sm {
        flex: 1;
        margin-right: 8px;
    }
}
</style>
`;

// Inject additional styles
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', additionalStyles);
}

// Cart management utilities
class CartManager {
    static getCart() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }

    static addToCart(product) {
        let cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            cart.push({
                ...product,
                quantity: product.quantity || 1,
                addedAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartUI();
        return cart;
    }

    static removeFromCart(productId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartUI();
        return cart;
    }

    static updateQuantity(productId, quantity) {
        let cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                return this.removeFromCart(productId);
            }
            item.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartUI();
        }
        
        return cart;
    }

    static clearCart() {
        localStorage.removeItem('cart');
        this.updateCartUI();
    }

    static getCartTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => {
            return total + (parseFloat(item.price) * item.quantity);
        }, 0);
    }

    static getCartItemCount() {
        const cart = this.getCart();
        return cart.reduce((count, item) => count + item.quantity, 0);
    }

    static updateCartUI() {
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            const count = this.getCartItemCount();
            cartCountElement.textContent = count;
            cartCountElement.style.display = count > 0 ? 'flex' : 'none';
        }

        // Dispatch custom event for cart update
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
                cart: this.getCart(),
                total: this.getCartTotal(),
                itemCount: this.getCartItemCount()
            }
        }));
    }
}

// Wishlist management utilities
class WishlistManager {
    static getWishlist() {
        return JSON.parse(localStorage.getItem('wishlist') || '[]');
    }

    static addToWishlist(productId) {
        let wishlist = this.getWishlist();
        if (!wishlist.includes(productId)) {
            wishlist.push(productId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            this.updateWishlistUI();
        }
        return wishlist;
    }

    static removeFromWishlist(productId) {
        let wishlist = this.getWishlist();
        wishlist = wishlist.filter(id => id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        this.updateWishlistUI();
        return wishlist;
    }

    static isInWishlist(productId) {
        return this.getWishlist().includes(productId);
    }

    static updateWishlistUI() {
        const wishlist = this.getWishlist();
        
        // Update wishlist count
        const wishlistCountElement = document.querySelector('.wishlist-count');
        if (wishlistCountElement) {
            wishlistCountElement.textContent = wishlist.length;
            wishlistCountElement.style.display = wishlist.length > 0 ? 'flex' : 'none';
        }

        // Update wishlist buttons
        wishlist.forEach(productId => {
            const wishlistBtn = document.querySelector(`[data-product-id="${productId}"].add-to-wishlist`);
            if (wishlistBtn) {
                const icon = wishlistBtn.querySelector('i');
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#e74c3c';
            }
        });

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('wishlistUpdated', {
            detail: { wishlist }
        }));
    }
}

// Initialize cart and wishlist on page load
document.addEventListener('DOMContentLoaded', () => {
    CartManager.updateCartUI();
    WishlistManager.updateWishlistUI();
});

// Export utilities for global use
window.CartManager = CartManager;
window.WishlistManager = WishlistManager;
window.ProductUtils = ProductUtils;

// Performance optimization: Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    // Observe all lazy images
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    });
}
