/**
 * Nguyên Sinh Website JavaScript - Enhanced Version
 * Advanced functionality with modern ES6+ features
 */

// Global configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    SCROLL_THRESHOLD: 100,
    INTERSECTION_THRESHOLD: 0.1,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

// Utility functions
const Utils = {
    // Debounce function
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    // Format date
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString('vi-VN', { ...defaultOptions, ...options });
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Smooth scroll to element
    smoothScrollTo(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    // Get URL parameters
    getUrlParams() {
        return new URLSearchParams(window.location.search);
    },

    // Set URL parameter without reload
    setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    },

    // Remove URL parameter
    removeUrlParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    }
};

// Cache management
class CacheManager {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, duration = CONFIG.CACHE_DURATION) {
        const expiry = Date.now() + duration;
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        this.cache.delete(key);
    }
}

// API service with retry logic
class ApiService {
    constructor() {
        this.cache = new CacheManager();
    }

    async request(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
            return cached;
        }

        let retries = 0;
        while (retries < CONFIG.MAX_RETRIES) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Cache successful GET requests
                if (!options.method || options.method === 'GET') {
                    this.cache.set(cacheKey, data);
                }
                
                return data;
            } catch (error) {
                retries++;
                if (retries >= CONFIG.MAX_RETRIES) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * retries));
            }
        }
    }

    async get(endpoint) {
        return this.request(`${CONFIG.API_BASE_URL}${endpoint}`);
    }

    async post(endpoint, data) {
        return this.request(`${CONFIG.API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(`${CONFIG.API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(`${CONFIG.API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
    }
}

// Event emitter for custom events
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

// Enhanced notification system
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', options = {}) {
        const id = Utils.generateId();
        const notification = this.createNotification(id, message, type, options);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Auto dismiss
        if (options.autoDismiss !== false) {
            setTimeout(() => {
                this.dismiss(id);
            }, options.duration || 5000);
        }

        return id;
    }

    createNotification(id, message, type, options) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getTypeColor(type)};
            color: white;
            padding: 16px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            max-width: 400px;
            word-wrap: break-word;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const content = document.createElement('div');
        content.style.cssText = 'display: flex; align-items: center;';
        
        const icon = document.createElement('i');
        icon.className = `fas ${this.getTypeIcon(type)}`;
        icon.style.marginRight = '10px';
        
        const text = document.createElement('span');
        text.textContent = message;
        
        content.appendChild(icon);
        content.appendChild(text);

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            margin-left: 15px;
            font-size: 14px;
            opacity: 0.8;
            transition: opacity 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';
        closeBtn.onclick = () => this.dismiss(id);

        notification.appendChild(content);
        notification.appendChild(closeBtn);

        return notification;
    }

    getTypeColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    getTypeIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
    }

    clear() {
        this.notifications.forEach((notification, id) => {
            this.dismiss(id);
        });
    }
}

// Loading manager
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.overlay = null;
    }

    show(target = document.body, text = 'Đang tải...') {
        const id = Utils.generateId();
        const loader = this.createLoader(text);
        
        if (target === document.body) {
            this.showOverlay();
            this.overlay.appendChild(loader);
        } else {
            target.style.position = 'relative';
            target.appendChild(loader);
        }

        this.activeLoaders.add(id);
        return id;
    }

    createLoader(text) {
        const loader = document.createElement('div');
        loader.className = 'loading-spinner';
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 1000;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #D4AF37;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        `;

        const textEl = document.createElement('div');
        textEl.textContent = text;
        textEl.style.cssText = `
            color: #666;
            font-size: 14px;
        `;

        loader.appendChild(spinner);
        loader.appendChild(textEl);

        // Add CSS animation if not exists
        if (!document.querySelector('#spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        return loader;
    }

    showOverlay() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(this.overlay);
    }

    hide(id) {
        this.activeLoaders.delete(id);
        
        if (this.activeLoaders.size === 0 && this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }

        // Remove individual loaders
        const loaders = document.querySelectorAll('.loading-spinner');
        loaders.forEach(loader => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
        });
    }

    hideAll() {
        this.activeLoaders.clear();
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
    }
}

// Enhanced mobile menu
class MobileMenu {
    constructor() {
        this.isOpen = false;
        this.toggle = null;
        this.menu = null;
        this.overlay = null;
        this.init();
    }

    init() {
        this.toggle = document.querySelector('.mobile-menu-toggle');
        this.menu = document.querySelector('.main-menu');
        
        if (!this.toggle || !this.menu) return;

        this.createOverlay();
        this.bindEvents();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'mobile-menu-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 998;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(this.overlay);
    }

    bindEvents() {
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });

        this.overlay.addEventListener('click', () => {
            this.closeMenu();
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });

        // Close on window resize
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.closeMenu();
            }
        }, 250));

        // Handle menu item clicks
        this.menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (this.isOpen) {
                    this.closeMenu();
                }
            });
        });
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.isOpen = true;
        this.menu.classList.add('active');
        this.overlay.style.opacity = '1';
        this.overlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';
        
        // Update toggle icon
        const icon = this.toggle.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-times';
        }
    }

    closeMenu() {
        this.isOpen = false;
        this.menu.classList.remove('active');
        this.overlay.style.opacity = '0';
        this.overlay.style.visibility = 'hidden';
        document.body.style.overflow = '';
        
        // Update toggle icon
        const icon = this.toggle.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-bars';
        }
    }
}

// Scroll manager with advanced features
class ScrollManager {
    constructor() {
        this.scrollPosition = 0;
        this.isScrolling = false;
        this.header = document.querySelector('header');
        this.backToTopBtn = null;
        this.init();
    }

    init() {
        this.createBackToTopButton();
        this.bindEvents();
    }

    createBackToTopButton() {
        this.backToTopBtn = document.createElement('button');
        this.backToTopBtn.className = 'back-to-top';
        this.backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        this.backToTopBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: var(--secondary-color);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        this.backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        document.body.appendChild(this.backToTopBtn);
    }

    bindEvents() {
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleScroll();
        }, 16)); // 60fps

        // Scroll direction detection
        window.addEventListener('scroll', Utils.throttle(() => {
            this.detectScrollDirection();
        }, 100));
    }

    handleScroll() {
        const scrollY = window.scrollY;
        
        // Header background change
        if (this.header) {
            if (scrollY > CONFIG.SCROLL_THRESHOLD) {
                this.header.classList.add('scrolled');
                this.header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                this.header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                this.header.classList.remove('scrolled');
                this.header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                this.header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }
        }

        // Back to top button
        if (scrollY > 300) {
            this.backToTopBtn.style.opacity = '1';
            this.backToTopBtn.style.visibility = 'visible';
        } else {
            this.backToTopBtn.style.opacity = '0';
            this.backToTopBtn.style.visibility = 'hidden';
        }

        // Update active menu item
        this.updateActiveMenuItem();
    }

    detectScrollDirection() {
        const currentScroll = window.scrollY;
        
        if (currentScroll > this.scrollPosition && currentScroll > 100) {
            // Scrolling down
            if (this.header) {
                this.header.style.transform = 'translateY(-100%)';
            }
        } else {
            // Scrolling up
            if (this.header) {
                this.header.style.transform = 'translateY(0)';
            }
        }
        
        this.scrollPosition = currentScroll;
    }

    updateActiveMenuItem() {
        const sections = document.querySelectorAll('section[id]');
        const menuItems = document.querySelectorAll('.main-menu a[href^="#"]');
        
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + current) {
                item.classList.add('active');
            }
        });
    }
}

// Intersection Observer for animations
class AnimationObserver {
    constructor() {
        this.observer = null;
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.fallbackAnimation();
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: CONFIG.INTERSECTION_THRESHOLD,
            rootMargin: '0px 0px -50px 0px'
        });

        this.observeElements();
    }

    observeElements() {
        const elements = document.querySelectorAll([
            '.fade-in-up',
            '.fade-in-left',
            '.fade-in-right',
            '.scale-in',
            '.stagger-container'
        ].join(','));

        elements.forEach(el => {
            this.observer.observe(el);
        });
    }

    animateElement(element) {
        if (element.classList.contains('stagger-container')) {
            this.animateStaggerContainer(element);
        } else {
            element.classList.add('visible');
        }
        
        this.observer.unobserve(element);
    }

    animateStaggerContainer(container) {
        container.classList.add('animate');
        const items = container.querySelectorAll('.stagger-item');
        
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    fallbackAnimation() {
        // Simple fallback for browsers without IntersectionObserver
        const elements = document.querySelectorAll([
            '.fade-in-up',
            '.fade-in-left',
            '.fade-in-right',
            '.scale-in'
        ].join(','));

        elements.forEach(el => {
            el.classList.add('visible');
        });
    }
}

// Enhanced slider/carousel
class Slider {
    constructor(container, options = {}) {
        this.container = container;
        this.slides = container.querySelectorAll('.slide, .testimonial-item, .media-item');
        this.currentSlide = 0;
        this.isPlaying = true;
        this.interval = null;
        
        this.options = {
            autoplay: true,
            autoplayDelay: 5000,
            showControls: true,
            showIndicators: true,
            loop: true,
            ...options
        };

        this.init();
    }

    init() {
        if (this.slides.length <= 1) return;

        this.setupSlides();
        if (this.options.showControls) this.createControls();
        if (this.options.showIndicators) this.createIndicators();
        if (this.options.autoplay) this.startAutoplay();
        
        this.bindEvents();
        this.showSlide(0);
    }

    setupSlides() {
        this.slides.forEach((slide, index) => {
            slide.style.position = 'absolute';
            slide.style.top = '0';
            slide.style.left = '0';
            slide.style.width = '100%';
            slide.style.opacity = index === 0 ? '1' : '0';
            slide.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            slide.style.transform = index === 0 ? 'translateX(0)' : 'translateX(50px)';
        });

        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
    }

    createControls() {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.style.cssText = `
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 10;
            transition: all 0.3s ease;
        `;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.style.cssText = prevBtn.style.cssText.replace('left: 20px', 'right: 20px');

        prevBtn.addEventListener('click', () => this.prevSlide());
        nextBtn.addEventListener('click', () => this.nextSlide());

        this.container.appendChild(prevBtn);
        this.container.appendChild(nextBtn);
    }

    createIndicators() {
        const indicators = document.createElement('div');
        indicators.className = 'slider-indicators';
        indicators.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 10;
        `;

        this.slides.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.style.cssText = `
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: none;
                background: rgba(255,255,255,0.5);
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            indicator.addEventListener('click', () => this.goToSlide(index));
            indicators.appendChild(indicator);
        });

        this.container.appendChild(indicators);
        this.indicators = indicators.querySelectorAll('button');
    }

    bindEvents() {
        // Pause on hover
        this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
        this.container.addEventListener('mouseleave', () => this.resumeAutoplay());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!Utils.isInViewport(this.container)) return;
            
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });

        // Touch/swipe support
        this.addTouchSupport();
    }

    addTouchSupport() {
        let startX = 0;
        let endX = 0;

        this.container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        this.container.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        });
    }

    showSlide(index) {
        this.slides.forEach((slide, i) => {
            if (i === index) {
                slide.style.opacity = '1';
                slide.style.transform = 'translateX(0)';
                slide.style.zIndex = '2';
            } else {
                slide.style.opacity = '0';
                slide.style.transform = i < index ? 'translateX(-50px)' : 'translateX(50px)';
                slide.style.zIndex = '1';
            }
        });

        if (this.indicators) {
            this.indicators.forEach((indicator, i) => {
                indicator.style.background = i === index ? 'white' : 'rgba(255,255,255,0.5)';
            });
        }

        this.currentSlide = index;
    }

    nextSlide() {
        const next = this.options.loop 
            ? (this.currentSlide + 1) % this.slides.length
            : Math.min(this.currentSlide + 1, this.slides.length - 1);
        this.showSlide(next);
    }

    prevSlide() {
        const prev = this.options.loop
            ? (this.currentSlide - 1 + this.slides.length) % this.slides.length
            : Math.max(this.currentSlide - 1, 0);
        this.showSlide(prev);
    }

    goToSlide(index) {
        this.showSlide(index);
    }

    startAutoplay() {
        if (!this.options.autoplay) return;
        
        this.interval = setInterval(() => {
            this.nextSlide();
        }, this.options.autoplayDelay);
    }

    pauseAutoplay() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    resumeAutoplay() {
        if (this.options.autoplay && !this.interval) {
            this.startAutoplay();
        }
    }

    destroy() {
        this.pauseAutoplay();
        // Remove event listeners and DOM elements
        const controls = this.container.querySelectorAll('.slider-prev, .slider-next, .slider-indicators');
        controls.forEach(el => el.remove());
    }
}

// Form validation and handling
class FormHandler {
    constructor() {
        this.forms = new Map();
        this.validators = new Map();
        this.init();
    }

    init() {
        this.setupValidators();
        this.bindForms();
    }

    setupValidators() {
        this.validators.set('required', (value) => {
            return value.trim() !== '';
        });

        this.validators.set('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        });

        this.validators.set('phone', (value) => {
            const phoneRegex = /^[0-9]{10,11}$/;
            return phoneRegex.test(value.replace(/\D/g, ''));
        });

        this.validators.set('minLength', (value, min) => {
            return value.length >= min;
        });

        this.validators.set('maxLength', (value, max) => {
            return value.length <= max;
        });

        this.validators.set('number', (value) => {
            return !isNaN(value) && !isNaN(parseFloat(value));
        });

        this.validators.set('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });
    }

    bindForms() {
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => this.bindForm(form));
    }

    bindForm(form) {
        const formId = form.id || Utils.generateId();
        form.id = formId;

        this.forms.set(formId, {
            element: form,
            fields: new Map(),
            isValid: false
        });

        // Bind input events
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => this.bindInput(formId, input));

        // Bind submit event
        form.addEventListener('submit', (e) => this.handleSubmit(e, formId));
    }

    bindInput(formId, input) {
        const rules = this.parseValidationRules(input);
        
        this.forms.get(formId).fields.set(input.name || input.id, {
            element: input,
            rules: rules,
            isValid: false,
            errorElement: this.createErrorElement(input)
        });

        // Real-time validation
        input.addEventListener('blur', () => this.validateField(formId, input));
        input.addEventListener('input', Utils.debounce(() => {
            this.validateField(formId, input);
        }, CONFIG.DEBOUNCE_DELAY));
    }

    parseValidationRules(input) {
        const rules = [];
        const dataset = input.dataset;

        if (input.required || dataset.required !== undefined) {
            rules.push({ type: 'required', message: 'Trường này là bắt buộc' });
        }

        if (input.type === 'email' || dataset.email !== undefined) {
            rules.push({ type: 'email', message: 'Email không hợp lệ' });
        }

        if (dataset.phone !== undefined) {
            rules.push({ type: 'phone', message: 'Số điện thoại không hợp lệ' });
        }

        if (dataset.minLength) {
            rules.push({ 
                type: 'minLength', 
                value: parseInt(dataset.minLength),
                message: `Tối thiểu ${dataset.minLength} ký tự` 
            });
        }

        if (dataset.maxLength) {
            rules.push({ 
                type: 'maxLength', 
                value: parseInt(dataset.maxLength),
                message: `Tối đa ${dataset.maxLength} ký tự` 
            });
        }

        if (input.type === 'number' || dataset.number !== undefined) {
            rules.push({ type: 'number', message: 'Phải là số hợp lệ' });
        }

        if (input.type === 'url' || dataset.url !== undefined) {
            rules.push({ type: 'url', message: 'URL không hợp lệ' });
        }

        return rules;
    }

    createErrorElement(input) {
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: none;
        `;
        
        input.parentNode.appendChild(errorElement);
        return errorElement;
    }

    validateField(formId, input) {
        const form = this.forms.get(formId);
        const field = form.fields.get(input.name || input.id);
        
        if (!field) return true;

        const value = input.value;
        let isValid = true;
        let errorMessage = '';

        for (const rule of field.rules) {
            const validator = this.validators.get(rule.type);
            if (!validator) continue;

            const result = rule.value !== undefined 
                ? validator(value, rule.value)
                : validator(value);

            if (!result) {
                isValid = false;
                errorMessage = rule.message;
                break;
            }
        }

        this.updateFieldUI(input, field.errorElement, isValid, errorMessage);
        field.isValid = isValid;

        // Update form validity
        this.updateFormValidity(formId);

        return isValid;
    }

    updateFieldUI(input, errorElement, isValid, errorMessage) {
        if (isValid) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            errorElement.style.display = 'none';
        } else {
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        }
    }

    updateFormValidity(formId) {
        const form = this.forms.get(formId);
        const allFieldsValid = Array.from(form.fields.values()).every(field => field.isValid);
        
        form.isValid = allFieldsValid;

        // Update submit button state
        const submitBtn = form.element.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = !allFieldsValid;
            submitBtn.classList.toggle('btn-disabled', !allFieldsValid);
        }
    }

    handleSubmit(event, formId) {
        event.preventDefault();
        
        const form = this.forms.get(formId);
        
        // Validate all fields
        let allValid = true;
        form.fields.forEach((field, fieldName) => {
            const isValid = this.validateField(formId, field.element);
            if (!isValid) allValid = false;
        });

        if (!allValid) {
            // Focus first invalid field
            const firstInvalidField = Array.from(form.fields.values())
                .find(field => !field.isValid);
            if (firstInvalidField) {
                firstInvalidField.element.focus();
            }
            return;
        }

        // Form is valid, proceed with submission
        this.submitForm(form.element);
    }

    async submitForm(form) {
        const loadingId = app.loading.show(form, 'Đang gửi...');
        
        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Get form action and method
            const action = form.action || window.location.href;
            const method = form.method || 'POST';
            
            const response = await fetch(action, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                app.notifications.show('Gửi thành công!', 'success');
                form.reset();
                
                // Reset validation states
                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.classList.remove('is-valid', 'is-invalid');
                });
            } else {
                throw new Error('Có lỗi xảy ra khi gửi form');
            }
        } catch (error) {
            app.notifications.show(error.message, 'error');
        } finally {
            app.loading.hide(loadingId);
        }
    }
}

// Local storage manager
class StorageManager {
    constructor() {
        this.prefix = 'nguyensinh_';
    }

    set(key, value, expiry = null) {
        const item = {
            value: value,
            timestamp: Date.now(),
            expiry: expiry ? Date.now() + expiry : null
        };
        
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            
            // Check expiry
            if (parsed.expiry && Date.now() > parsed.expiry) {
                this.remove(key);
                return null;
            }

            return parsed.value;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    getAll() {
        const items = {};
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    const cleanKey = key.replace(this.prefix, '');
                    items[cleanKey] = this.get(cleanKey);
                }
            });
        } catch (error) {
            console.error('Error getting all items from localStorage:', error);
        }
        return items;
    }
}

// Performance monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = [];
        this.init();
    }

    init() {
        if ('PerformanceObserver' in window) {
            this.observePerformance();
        }
        this.monitorPageLoad();
    }

    observePerformance() {
        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe first input delay
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.metrics.fid = entry.processingStart - entry.startTime;
            });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Observe cumulative layout shift
        const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
    }

    monitorPageLoad() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            this.metrics.pageLoad = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                totalTime: navigation.loadEventEnd - navigation.fetchStart
            };

            // Log performance metrics
            this.logMetrics();
        });
    }

    logMetrics() {
        console.group('🚀 Performance Metrics');
        console.log('LCP (Largest Contentful Paint):', this.metrics.lcp?.toFixed(2) + 'ms');
        console.log('FID (First Input Delay):', this.metrics.fid?.toFixed(2) + 'ms');
        console.log('CLS (Cumulative Layout Shift):', this.metrics.cls?.toFixed(4));
        console.log('Page Load:', this.metrics.pageLoad);
        console.groupEnd();
    }

    getMetrics() {
        return { ...this.metrics };
    }

    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Main application class
class NguyenSinhApp {
    constructor() {
        this.api = new ApiService();
        this.notifications = new NotificationManager();
        this.loading = new LoadingManager();
        this.storage = new StorageManager();
        this.events = new EventEmitter();
        this.performance = new PerformanceMonitor();
        
        this.mobileMenu = null;
        this.scrollManager = null;
        this.animationObserver = null;
        this.formHandler = null;
        this.sliders = [];
        
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve                => document.addEventListener('DOMContentLoaded', resolve));
            }

            // Initialize core components
            this.initializeComponents();
            
            // Load page data
            await this.loadPageData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize page-specific features
            this.initializePageFeatures();
            
            console.log('✅ Nguyên Sinh App initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.notifications.show('Có lỗi xảy ra khi tải trang', 'error');
        }
    }

    initializeComponents() {
        // Initialize mobile menu
        this.mobileMenu = new MobileMenu();
        
        // Initialize scroll manager
        this.scrollManager = new ScrollManager();
        
        // Initialize animation observer
        this.animationObserver = new AnimationObserver();
        
        // Initialize form handler
        this.formHandler = new FormHandler();
        
        // Initialize sliders
        this.initializeSliders();
        
        // Setup smooth scrolling for anchor links
        this.setupSmoothScrolling();
    }

    initializeSliders() {
        // Testimonials slider
        const testimonialsContainer = document.querySelector('.testimonials-slider');
        if (testimonialsContainer) {
            this.sliders.push(new Slider(testimonialsContainer, {
                autoplayDelay: 7000,
                showControls: false,
                showIndicators: true
            }));
        }

        // Media slider
        const mediaContainer = document.querySelector('.media-slider');
        if (mediaContainer) {
            this.sliders.push(new Slider(mediaContainer, {
                autoplayDelay: 5000,
                showControls: true,
                showIndicators: false
            }));
        }

        // Hero slider (if exists)
        const heroSlider = document.querySelector('.hero-slider');
        if (heroSlider) {
            this.sliders.push(new Slider(heroSlider, {
                autoplayDelay: 8000,
                showControls: true,
                showIndicators: true
            }));
        }
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    Utils.smoothScrollTo(targetElement, 80);
                    
                    // Update URL without triggering scroll
                    Utils.setUrlParam('section', targetId.substring(1));
                }
            });
        });
    }

    async loadPageData() {
        const loadingId = this.loading.show(document.body, 'Đang tải dữ liệu...');
        
        try {
            // Load data based on current page
            const currentPage = this.getCurrentPage();
            
            switch (currentPage) {
                case 'home':
                    await this.loadHomePageData();
                    break;
                case 'menu':
                    await this.loadMenuPageData();
                    break;
                case 'about':
                    await this.loadAboutPageData();
                    break;
                case 'blog':
                    await this.loadBlogPageData();
                    break;
                default:
                    console.log('No specific data loading for this page');
            }
        } catch (error) {
            console.error('Error loading page data:', error);
        } finally {
            this.loading.hide(loadingId);
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path.includes('index.html')) return 'home';
        if (path.includes('menu.html')) return 'menu';
        if (path.includes('about.html')) return 'about';
        if (path.includes('blog.html')) return 'blog';
        return 'other';
    }

    async loadHomePageData() {
        try {
            // Load featured products
            await this.loadFeaturedProducts();
            
            // Load testimonials
            await this.loadTestimonials();
            
            // Load latest blog posts
            await this.loadLatestBlogs();
            
            // Load store locations
            await this.loadStoreLocations();
            
        } catch (error) {
            console.error('Error loading home page data:', error);
        }
    }

    async loadFeaturedProducts() {
        try {
            const products = await this.api.get('/products?featured=true&limit=4');
            if (products && products.length > 0) {
                this.renderFeaturedProducts(products);
            }
        } catch (error) {
            console.log('Using static featured products');
        }
    }

    renderFeaturedProducts(products) {
        const container = document.querySelector('.products-grid');
        if (!container) return;

        container.innerHTML = '';
        
        products.forEach(product => {
            const productCard = this.createProductCard(product);
            container.appendChild(productCard);
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card fade-in-up';
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image_url || 'img/product-placeholder.jpg'}" 
                     alt="${product.name}" 
                     loading="lazy">
                ${product.discount_percent ? `<span class="discount-badge">-${product.discount_percent}%</span>` : ''}
                <div class="product-overlay">
                    <button class="btn-quick-view" data-product-id="${product.product_id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-add-to-wishlist" data-product-id="${product.product_id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.short_description || ''}</p>
                <div class="product-rating">
                    ${this.renderStars(product.average_rating || 0)}
                    <span class="rating-count">(${product.review_count || 0})</span>
                </div>
                <div class="product-price">
                    ${product.discount_price ? 
                        `<span class="original-price">${Utils.formatCurrency(product.price)}</span>
                        <span class="discounted-price">${Utils.formatCurrency(product.discount_price)}</span>` : 
                        `<span class="price">${Utils.formatCurrency(product.price)}</span>`
                    }
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-add-to-cart" data-product-id="${product.product_id}">
                        <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                    </button>
                    <a href="pages/product-detail.html?id=${product.product_id}" class="btn btn-outline">
                        Chi tiết
                    </a>
                </div>
            </div>
        `;

        // Add event listeners
        this.bindProductCardEvents(card);
        
        return card;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHTML = '';

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }

        return starsHTML;
    }

    bindProductCardEvents(card) {
        // Add to cart
        const addToCartBtn = card.querySelector('.btn-add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = addToCartBtn.dataset.productId;
                this.addToCart(productId);
            });
        }

        // Add to wishlist
        const wishlistBtn = card.querySelector('.btn-add-to-wishlist');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = wishlistBtn.dataset.productId;
                this.addToWishlist(productId);
            });
        }

        // Quick view
        const quickViewBtn = card.querySelector('.btn-quick-view');
        if (quickViewBtn) {
            quickViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = quickViewBtn.dataset.productId;
                this.showQuickView(productId);
            });
        }
    }

    async addToCart(productId, quantity = 1) {
        try {
            const user = this.storage.get('user');
            
            if (user && user.user_id) {
                // Add to server cart
                await this.api.post('/cart/add', {
                    product_id: productId,
                    quantity: quantity,
                    user_id: user.user_id
                });
            } else {
                // Add to local cart
                this.addToLocalCart(productId, quantity);
            }

            this.notifications.show('Đã thêm sản phẩm vào giỏ hàng!', 'success');
            this.updateCartCount();
            
            // Emit event
            this.events.emit('cart:add', { productId, quantity });
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.notifications.show('Có lỗi xảy ra khi thêm vào giỏ hàng', 'error');
        }
    }

    addToLocalCart(productId, quantity) {
        let cart = this.storage.get('cart') || [];
        
        const existingItem = cart.find(item => item.product_id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                product_id: productId,
                quantity: quantity,
                added_at: Date.now()
            });
        }
        
        this.storage.set('cart', cart);
    }

    async addToWishlist(productId) {
        try {
            const user = this.storage.get('user');
            
            if (!user || !user.user_id) {
                this.notifications.show('Vui lòng đăng nhập để sử dụng tính năng này', 'warning');
                return;
            }

            await this.api.post('/wishlist/add', {
                product_id: productId,
                user_id: user.user_id
            });

            this.notifications.show('Đã thêm vào danh sách yêu thích!', 'success');
            
            // Update wishlist UI
            const wishlistBtn = document.querySelector(`[data-product-id="${productId}"] .btn-add-to-wishlist`);
            if (wishlistBtn) {
                wishlistBtn.classList.add('active');
                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
            }
            
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            this.notifications.show('Có lỗi xảy ra khi thêm vào danh sách yêu thích', 'error');
        }
    }

    async showQuickView(productId) {
        try {
            const product = await this.api.get(`/products/${productId}`);
            this.renderQuickViewModal(product);
        } catch (error) {
            console.error('Error loading product for quick view:', error);
            this.notifications.show('Không thể tải thông tin sản phẩm', 'error');
        }
    }

    renderQuickViewModal(product) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'quick-view-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            transform: scale(0.8);
            transition: transform 0.3s ease;
        `;

        modalContent.innerHTML = `
            <button class="modal-close" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; z-index: 1;">
                <i class="fas fa-times"></i>
            </button>
            <div class="quick-view-body" style="padding: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div class="product-image">
                    <img src="${product.image_url}" alt="${product.name}" style="width: 100%; border-radius: 8px;">
                </div>
                <div class="product-details">
                    <h2>${product.name}</h2>
                    <div class="product-rating">
                        ${this.renderStars(product.average_rating || 0)}
                        <span>(${product.review_count || 0} đánh giá)</span>
                    </div>
                    <div class="product-price" style="margin: 20px 0;">
                        ${product.discount_price ? 
                            `<span style="text-decoration: line-through; color: #999;">${Utils.formatCurrency(product.price)}</span>
                            <span style="font-size: 24px; color: #e74c3c; font-weight: bold;">${Utils.formatCurrency(product.discount_price)}</span>` : 
                            `<span style="font-size: 24px; color: #2c3e50; font-weight: bold;">${Utils.formatCurrency(product.price)}</span>`
                        }
                    </div>
                    <p>${product.description || product.short_description || ''}</p>
                    <div class="quantity-selector" style="margin: 20px 0;">
                        <label>Số lượng:</label>
                        <div style="display: flex
; align-items: center; gap: 10px; margin-top: 10px;">
                            <button class="qty-btn qty-minus" style="width: 40px; height: 40px; border: 1px solid #ddd; background: white; cursor: pointer;">-</button>
                            <input type="number" class="qty-input" value="1" min="1" style="width: 60px; height: 40px; text-align: center; border: 1px solid #ddd;">
                            <button class="qty-btn qty-plus" style="width: 40px; height: 40px; border: 1px solid #ddd; background: white; cursor: pointer;">+</button>
                        </div>
                    </div>
                    <div class="modal-actions" style="display: flex; gap: 15px; margin-top: 30px;">
                        <button class="btn btn-primary btn-add-to-cart-modal" data-product-id="${product.product_id}" style="flex: 1;">
                            <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                        </button>
                        <button class="btn btn-outline btn-add-to-wishlist-modal" data-product-id="${product.product_id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        });

        // Bind events
        this.bindQuickViewEvents(modal, product);
    }

    bindQuickViewEvents(modal, product) {
        const closeBtn = modal.querySelector('.modal-close');
        const qtyInput = modal.querySelector('.qty-input');
        const qtyMinus = modal.querySelector('.qty-minus');
        const qtyPlus = modal.querySelector('.qty-plus');
        const addToCartBtn = modal.querySelector('.btn-add-to-cart-modal');
        const addToWishlistBtn = modal.querySelector('.btn-add-to-wishlist-modal');

        // Close modal
        const closeModal = () => {
            modal.style.opacity = '0';
            modal.querySelector('.quick-view-content').style.transform = 'scale(0.8)';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Quantity controls
        qtyMinus.addEventListener('click', () => {
            const current = parseInt(qtyInput.value);
            if (current > 1) {
                qtyInput.value = current - 1;
            }
        });

        qtyPlus.addEventListener('click', () => {
            const current = parseInt(qtyInput.value);
            qtyInput.value = current + 1;
        });

        // Add to cart
        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(qtyInput.value);
            this.addToCart(product.product_id, quantity);
            closeModal();
        });

        // Add to wishlist
        addToWishlistBtn.addEventListener('click', () => {
            this.addToWishlist(product.product_id);
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    updateCartCount() {
        const cart = this.storage.get('cart') || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'block' : 'none';
        });

        // Update cart icon
        const cartIcons = document.querySelectorAll('.cart-icon');
        cartIcons.forEach(icon => {
            icon.classList.toggle('has-items', totalItems > 0);
        });
    }

    async loadTestimonials() {
        try {
            const reviews = await this.api.get('/reviews?featured=true&limit=6');
            if (reviews && reviews.length > 0) {
                this.renderTestimonials(reviews);
            }
        } catch (error) {
            console.log('Using static testimonials');
        }
    }

    renderTestimonials(reviews) {
        const container = document.querySelector('.testimonials-slider');
        if (!container) return;

        container.innerHTML = '';
        
        reviews.forEach(review => {
            const testimonialItem = document.createElement('div');
            testimonialItem.className = 'testimonial-item';
            
            testimonialItem.innerHTML = `
                <div class="testimonial-content">
                    <div class="testimonial-rating">
                        ${this.renderStars(review.rating)}
                    </div>
                    <p class="testimonial-text">"${review.content}"</p>
                    <div class="testimonial-author">
                        <img src="${review.user_avatar || 'img/user-placeholder.jpg'}" alt="${review.user_name}" loading="lazy">
                        <div class="author-info">
                            <h4>${review.user_name}</h4>
                            <p>${review.user_title || 'Khách hàng'}</p>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(testimonialItem);
        });

        // Reinitialize slider
        const existingSlider = this.sliders.find(s => s.container === container);
        if (existingSlider) {
            existingSlider.destroy();
            const index = this.sliders.indexOf(existingSlider);
            this.sliders.splice(index, 1);
        }

        this.sliders.push(new Slider(container, {
            autoplayDelay: 7000,
            showControls: false,
            showIndicators: true
        }));
    }

    async loadLatestBlogs() {
        try {
            const posts = await this.api.get('/blogs?limit=3');
            if (posts && posts.length > 0) {
                this.renderLatestBlogs(posts);
            }
        } catch (error) {
            console.log('Using static blog posts');
        }
    }

    renderLatestBlogs(posts) {
        const container = document.querySelector('.blog-posts, .latest-posts');
        if (!container) return;

        container.innerHTML = '';
        
        posts.forEach(post => {
            const blogItem = document.createElement('article');
            blogItem.className = 'blog-post fade-in-up';
            
            blogItem.innerHTML = `
                <div class="post-image">
                    <img src="${post.img_url || 'img/blog-placeholder.jpg'}" alt="${post.title}" loading="lazy">
                    <div class="post-category">${post.category_name || 'Tin tức'}</div>
                </div>
                <div class="post-content">
                    <h3 class="post-title">
                        <a href="pages/blog-detail.html?id=${post.post_id}">${post.title}</a>
                    </h3>
                    <p class="post-excerpt">${this.truncateText(post.content || '', 150)}</p>
                    <div class="post-meta">
                        <span class="post-date">
                            <i class="fas fa-calendar"></i>
                            ${Utils.formatDate(post.published_at || post.created_at)}
                        </span>
                        <span class="post-author">
                            <i class="fas fa-user"></i>
                            ${post.author_name || 'Admin'}
                        </span>
                    </div>
                    <a href="pages/blog-detail.html?id=${post.post_id}" class="read-more">
                        Đọc tiếp <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;
            
            container.appendChild(blogItem);
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    async loadStoreLocations() {
        try {
            const stores = await this.api.get('/stores?limit=3');
            if (stores && stores.length > 0) {
                this.renderStoreLocations(stores);
            }
        } catch (error) {
            console.log('Using static store locations');
        }
    }

    renderStoreLocations(stores) {
        const container = document.querySelector('.store-locations, .locations-grid');
        if (!container) return;

        container.innerHTML = '';
        
        stores.forEach(store => {
            const storeItem = document.createElement('div');
            storeItem.className = 'store-card fade-in-up';
            
            storeItem.innerHTML = `
                <div class="store-header">
                    <h3 class="store-name">${store.name}</h3>
                    <span class="store-status ${store.is_active ? 'open' : 'closed'}">
                        ${store.is_active ? 'Đang mở' : 'Đã đóng'}
                    </span>
                </div>
                <div class="store-info">
                    <p class="store-address">
                        <i class="fas fa-map-marker-alt"></i>
                        ${store.address}, ${store.district || ''}, ${store.city || ''}
                    </p>
                    <p class="store-phone">
                        <i class="fas fa-phone"></i>
                        <a href="tel:${store.phone}">${store.phone || 'Chưa cập nhật'}</a>
                    </p>
                    <p class="store-hours">
                        <i class="fas fa-clock"></i>
                        ${store.opening_hours || 'Chưa cập nhật'}
                    </p>
                </div>
                <div class="store-actions">
                    <a href="https://maps.google.com/?q=${encodeURIComponent(store.address)}" 
                       target="_blank" class="btn btn-outline btn-sm">
                        <i class="fas fa-directions"></i> Chỉ đường
                    </a>
                    <a href="pages/store-detail.html?id=${store.store_id}" class="btn btn-text">
                        Chi tiết <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;
            
            container.appendChild(storeItem);
        });
    }

    setupEventListeners() {
        // Search functionality
        this.setupSearch();
        
        // Newsletter subscription
        this.setupNewsletter();
        
        // Contact forms
        this.setupContactForms();
        
        // User authentication
        this.setupAuth();
        
        // Cart functionality
        this.setupCart();
        
        // Wishlist functionality
        this.setupWishlist();
        
        // Language switcher
        this.setupLanguageSwitcher();
        
        // Theme switcher
        this.setupThemeSwitcher();
    }

    setupSearch() {
        const searchForms = document.querySelectorAll('.search-form');
        const searchInputs = document.querySelectorAll('.search-input');
        
        searchInputs.forEach(input => {
            input.addEventListener('input', Utils.debounce((e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.performSearch(query);
                } else {
                    this.clearSearchResults();
                }
            }, CONFIG.DEBOUNCE_DELAY));
        });

        searchForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = form.querySelector('.search-input').value.trim();
                if (query) {
                    window.location.href = `pages/search.html?q=${encodeURIComponent(query)}`;
                }
            });
        });
    }

    async performSearch(query) {
        try {
            const results = await this.api.get(`/search?q=${encodeURIComponent(query)}&limit=5`);
            this.showSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showSearchResults(results) {
        let dropdown = document.querySelector('.search-dropdown');
        
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 4px 4px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 1000;
                max-height: 300px;
                overflow-y: auto;
            `;
            
            const searchContainer = document.querySelector('.search-form');
            if (searchContainer) {
                searchContainer.style.position = 'relative';
                searchContainer.appendChild(dropdown);
            }
        }

        if (results && results.length > 0) {
            dropdown.innerHTML = results.map(item => `
                <a href="${this.getItemUrl(item)}" class="search-result-item" style="display: block; padding: 10px 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">
                    <div style="font-weight: 500;">${item.title || item.name}</div>
                    <div style="font-size: 0.9rem; color: #666;">${item.type || 'Sản phẩm'}</div>
                </a>
            `).join('');
            dropdown.style.display = 'block';
        } else {
            dropdown.innerHTML = '<div style="padding: 15px; text-align: center; color: #666;">Không tìm thấy kết quả</div>';
            dropdown.style.display = 'block';
        }
    }

    getItemUrl(item) {
        switch (item.type) {
            case 'product':
                return `pages/product-detail.html?id=${item.id}`;
            case 'blog':
                return `pages/blog-detail.html?id=${item.id}`;
            case 'page':
                return item.url;
            default:
                return '#';
        }
    }

    clearSearchResults() {
        const dropdown = document.querySelector('.search-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    setupNewsletter() {
        const newsletterForms = document.querySelectorAll('.newsletter-form');
        
        newsletterForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const emailInput = form.querySelector('input[type="email"]');
                const email = emailInput.value.trim();
                
                if (!email) {
                    this.notifications.show('Vui lòng nhập email', 'warning');
                    return;
                }

                const loadingId = this.loading.show(form, 'Đang đăng ký...');
                
                try {
                    await this.api.post('/newsletter/subscribe', { email });
                    this.notifications.show('Đăng ký nhận tin thành công!', 'success');
                    emailInput.value = '';
                } catch (error) {
                    console.error('Newsletter subscription error:', error);
                    this.notifications.show('Có lỗi xảy ra, vui lòng thử lại', 'error');
                } finally {
                    this.loading.hide(loadingId);
                }
            });
        });
    }

    setupContactForms() {
        const contactForms = document.querySelectorAll('.contact-form');
        
        contactForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                const loadingId = this.loading.show(form, 'Đang gửi...');
                
                try {
                    await this.api.post('/contact', data);
                    this.notifications.show('Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.', 'success');
                    form.reset();
                } catch (error) {
                    console.error('Contact form error:', error);
                    this.notifications.show('Có lỗi xảy ra, vui lòng thử lại', 'error');
                } finally {
                    this.loading.hide(loadingId);
                }
            });
        });
    }

    setupAuth() {
        // Login form
        const loginForms = document.querySelectorAll('.login-form');
        loginForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleLogin(e, form));
        });

        // Register form
        const registerForms = document.querySelectorAll('.register-form');
        registerForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleRegister(e, form));
        });

        // Logout buttons
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleLogout(e));
        });

        // Check authentication status
        this.checkAuthStatus();
    }

    async handleLogin(e, form) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const credentials = Object.fromEntries(formData.entries());
        
        const loadingId = this.loading.show(form, 'Đang đăng nhập...');
        
        try {
            const response = await this.api.post('/auth/login', credentials);
            
            if (response.token) {
                // Store user data
                this.storage.set('token', response.token);
                this.storage.set('user', response.user);
                
                this.notifications.show('Đăng nhập thành công!', 'success');
                
                // Sync local cart with server
                await this.syncCart();
                
                // Redirect or update UI
                this.updateAuthUI(true, response.user);
                
                // Emit login event
                this.events.emit('user:login', response.user);
                
                // Redirect if needed
                const redirectUrl = Utils.getUrlParams().get('redirect');
                if (redirectUrl) {
                    window.location.href = decodeURIComponent(redirectUrl);
                } else {
                    // Close modal if exists
                    const modal = form.closest('.modal');
                    if (modal) {
                        this.closeModal(modal);
                    }
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.notifications.show('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.', 'error');
        } finally {
            this.loading.hide(loadingId);
        }
    }

    async handleRegister(e, form) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());
        
        // Validate password confirmation
        if (userData.password !== userData.confirmPassword) {
            this.notifications.show('Mật khẩu xác nhận không khớp', 'error');
            return;
        }
        
        delete userData.confirmPassword;
        
        const loadingId = this.loading.show(form, 'Đang đăng ký...');
        
        try {
            const response = await this.api.post('/auth/register', userData);
            
            this.notifications.show('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.', 'success');
            
            // Switch to login form
            const loginTab = document.querySelector('.tab-login');
            if (loginTab) {
                loginTab.click();
            }
            
            form.reset();
            
        } catch (error) {
            console.error('Register error:', error);
            this.notifications.show('Đăng ký thất bại. Email có thể đã được sử dụng.', 'error');
        } finally {
            this.loading.hide(loadingId);
        }
    }

    async handleLogout(e) {
        e.preventDefault();
        
        try {
            await this.api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        // Clear local storage
        this.storage.remove('token');
        this.storage.remove('user');
        
        // Update UI
        this.updateAuthUI(false);
        
        // Emit logout event
        this.events.emit('user:logout');
        
        this.notifications.show('Đã đăng xuất thành công', 'info');
        
        // Redirect to home if on protected page
        if (window.location.pathname.includes('account') || 
            window.location.pathname.includes('profile')) {
            window.location.href = '/';
        }
    }

    checkAuthStatus() {
        const token = this.storage.get('token');
        const user = this.storage.get('user');
        
        if (token && user) {
            this.updateAuthUI(true, user);
            this.events.emit('user:authenticated', user);
        } else {
            this.updateAuthUI(false);
        }
    }

    updateAuthUI(isLoggedIn, user = null) {
        const authElements = document.querySelectorAll('[data-auth]');
        
        authElements.forEach(element => {
            const authType = element.dataset.auth;
            
            if (authType === 'logged-in') {
                element.style.display = isLoggedIn ? 'block' : 'none';
            } else if (authType === 'logged-out') {
                element.style.display = isLoggedIn ? 'none' : 'block';
            }
        });

        // Update user info
        if (isLoggedIn && user) {
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(element => {
                element.textContent = user.full_name || user.email;
            });

            const userAvatarElements = document.querySelectorAll('.user-avatar');
            userAvatarElements.forEach(element => {
                element.src = user.avatar_url || 'img/user-placeholder.jpg';
            });
        }
    }

    async syncCart() {
        const localCart = this.storage.get('cart') || [];
        
        if (localCart.length === 0) return;
        
        try {
            const user = this.storage.get('user');
            
            for (const item of localCart) {
                await this.api.post('/cart/add', {
                    product_id: item.product_id,
                    quantity: item.quantity,
                    user_id: user.user_id
                });
            }
            
            // Clear local cart
            this.storage.remove('cart');
            this.updateCartCount();
            
        } catch (error) {
            console.error('Cart sync error:', error);
        }
    }

    setupCart() {
        // Cart toggle
        const cartToggles = document.querySelectorAll('.cart-toggle');
        cartToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCartSidebar();
            });
        });

        // Update cart count on page load
        this.updateCartCount();
        
        // Listen for cart events
        this.events.on('cart:add', () => this.updateCartCount());
        this.events.on('cart:remove', () => this.updateCartCount());
        this.events.on('cart:update', () => this.updateCartCount());
    }

    toggleCartSidebar() {
        let sidebar = document.querySelector('.cart-sidebar');
        
        if (!sidebar) {
            sidebar = this.createCartSidebar();
        }
        
        sidebar.classList.toggle('active');
        
        if (sidebar.classList.contains('active')) {
            this.loadCartItems();
        }
    }

    createCartSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'cart-sidebar';
        sidebar.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: white;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            z-index: 10000;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
        `;

        sidebar.innerHTML = `
            <div class="cart-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <h3>Giỏ hàng</h3>
                <button class="cart-close" style="background: none; border: none; font-size: 24px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="cart-body" style="flex: 1; overflow-y: auto; padding: 20px;">
                <div class="cart-items"></div>
            </div>
            <div class="cart-footer" style="padding: 20px; border-top: 1px solid #eee;">
                <div class="cart-total" style="margin-bottom: 15px; font-size: 18px; font-weight: bold;"></div>
                <div class="cart-actions" style="display: flex; gap: 10px;">
                    <a href="pages/cart.html" class="btn btn-outline" style="flex: 1; text-align: center;">Xem giỏ hàng</a>
                    <a href="pages/checkout.html" class="btn btn-primary" style="flex: 1; text-align: center;">Thanh toán</a>
                </div>
            </div>
        `;

        // Add overlay
        const overlay = document.createElement('div');
        overlay.className = 'cart-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(sidebar);

        // Bind events
        const closeBtn = sidebar.querySelector('.cart-close');
        closeBtn.addEventListener('click', () => this.closeCartSidebar());
        
        overlay.addEventListener('click', () => this.closeCartSidebar());

        // Update active state styles
        const originalToggle = sidebar.classList.toggle;
        sidebar.classList.toggle = function(className) {
            const result = originalToggle.call(this, className);
            
            if (className === 'active') {
                if (this.classList.contains('active')) {
                    this.style.right = '0';
                    overlay.style.opacity = '1';
                    overlay.style.visibility = 'visible';
                    document.body.style.overflow = 'hidden';
                } else {
                    this.style.right = '-400px';
                    overlay.style.opacity = '0';
                    overlay.style.visibility = 'hidden';
                    document.body.style.overflow = '';
                }
            }
            
            return result;
        };

        return sidebar;
    }

    closeCartSidebar() {
        const sidebar = document.querySelector('.cart-sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }

    async loadCartItems() {
        const cartItemsContainer = document.querySelector('.cart-sidebar .cart-items');
        const cartTotalContainer = document.querySelector('.cart-sidebar .cart-total');
        
        if (!cartItemsContainer) return;

        const loadingId = this.loading.show(cartItemsContainer, 'Đang tải...');
        
        try {
            const user = this.storage.get('user');
            let cartItems = [];
            
            if (user && user.user_id) {
                // Load from server
                const response = await this.api.get(`/cart/${user.user_id}`);
                cartItems = response.items || [];
            } else {
                // Load from local storage
                const localCart = this.storage.get('cart') || [];
                cartItems = await this.enrichLocalCartItems(localCart);
            }

            this.renderCartItems(cartItems, cartItemsContainer, cartTotalContainer);
            
        } catch (error) {
            console.error('Error loading cart items:', error);
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: #666;">Có lỗi xảy ra khi tải giỏ hàng</p>';
        } finally {
            this.loading.hide(loadingId);
        }
    }

    async enrichLocalCartItems(localCart) {
        const enrichedItems = [];
        
        for (const item of localCart) {
            try {
                const product = await this.api.get(`/products/${item.product_id}`);
                enrichedItems.push({
                    ...item,
                    product: product
                });
            } catch (error) {
                console.error(`Error loading product ${item.product_id}:`, error);
            }
        }
        
        return enrichedItems;
    }

    renderCartItems(items, container, totalContainer) {
        if (items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <i class="fas fa-
shopping-cart" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p>Giỏ hàng trống</p>
                    <a href="pages/menu.html" class="btn btn-primary" style="margin-top: 15px;">Mua sắm ngay</a>
                </div>
            `;
            totalContainer.innerHTML = '';
            return;
        }

        let total = 0;
        
        container.innerHTML = items.map(item => {
            const product = item.product || item;
            const price = product.discount_price || product.price;
            const itemTotal = price * item.quantity;
            total += itemTotal;

            return `
                <div class="cart-item" data-product-id="${product.product_id}" style="display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #eee;">
                    <div class="item-image" style="width: 60px; height: 60px; flex-shrink: 0;">
                        <img src="${product.image_url || 'img/product-placeholder.jpg'}" 
                             alt="${product.name}" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                    </div>
                    <div class="item-details" style="flex: 1; min-width: 0;">
                        <h4 style="margin: 0 0 5px 0; font-size: 14px; line-height: 1.3;">${product.name}</h4>
                        <div class="item-price" style="color: var(--secondary-color); font-weight: 500; margin-bottom: 10px;">
                            ${Utils.formatCurrency(price)}
                        </div>
                        <div class="quantity-controls" style="display: flex; align-items: center; gap: 10px;">
                            <button class="qty-minus" data-product-id="${product.product_id}" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">-</button>
                            <span class="qty-display" style="min-width: 20px; text-align: center;">${item.quantity}</span>
                            <button class="qty-plus" data-product-id="${product.product_id}" style="width: 30px; height: 30px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">+</button>
                            <button class="remove-item" data-product-id="${product.product_id}" style="margin-left: auto; background: none; border: none; color: #dc3545; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        totalContainer.innerHTML = `Tổng cộng: ${Utils.formatCurrency(total)}`;

        // Bind cart item events
        this.bindCartItemEvents(container);
    }

    bindCartItemEvents(container) {
        // Quantity controls
        container.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                this.updateCartItemQuantity(productId, -1);
            });
        });

        container.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                this.updateCartItemQuantity(productId, 1);
            });
        });

        // Remove item
        container.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                this.removeCartItem(productId);
            });
        });
    }

    async updateCartItemQuantity(productId, change) {
        try {
            const user = this.storage.get('user');
            
            if (user && user.user_id) {
                // Update on server
                await this.api.put('/cart/update', {
                    product_id: productId,
                    quantity_change: change,
                    user_id: user.user_id
                });
            } else {
                // Update local cart
                this.updateLocalCartQuantity(productId, change);
            }

            // Reload cart items
            this.loadCartItems();
            this.updateCartCount();
            
            this.events.emit('cart:update', { productId, change });
            
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            this.notifications.show('Có lỗi xảy ra khi cập nhật giỏ hàng', 'error');
        }
    }

    updateLocalCartQuantity(productId, change) {
        let cart = this.storage.get('cart') || [];
        
        const itemIndex = cart.findIndex(item => item.product_id === productId);
        
        if (itemIndex !== -1) {
            cart[itemIndex].quantity += change;
            
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1);
            }
            
            this.storage.set('cart', cart);
        }
    }

    async removeCartItem(productId) {
        try {
            const user = this.storage.get('user');
            
            if (user && user.user_id) {
                // Remove from server
                await this.api.delete(`/cart/remove/${productId}/${user.user_id}`);
            } else {
                // Remove from local cart
                this.removeFromLocalCart(productId);
            }

            // Reload cart items
            this.loadCartItems();
            this.updateCartCount();
            
            this.notifications.show('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
            this.events.emit('cart:remove', { productId });
            
        } catch (error) {
            console.error('Error removing cart item:', error);
            this.notifications.show('Có lỗi xảy ra khi xóa sản phẩm', 'error');
        }
    }

    removeFromLocalCart(productId) {
        let cart = this.storage.get('cart') || [];
        cart = cart.filter(item => item.product_id !== productId);
        this.storage.set('cart', cart);
    }

    setupWishlist() {
        // Wishlist toggle buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-to-wishlist')) {
                e.preventDefault();
                const btn = e.target.closest('.btn-add-to-wishlist');
                const productId = btn.dataset.productId;
                this.toggleWishlist(productId, btn);
            }
        });

        // Load wishlist status for current products
        this.loadWishlistStatus();
    }

    async toggleWishlist(productId, button) {
        const user = this.storage.get('user');
        
        if (!user || !user.user_id) {
            this.notifications.show('Vui lòng đăng nhập để sử dụng tính năng này', 'warning');
            return;
        }

        try {
            const isInWishlist = button.classList.contains('active');
            
            if (isInWishlist) {
                await this.api.delete(`/wishlist/remove/${productId}/${user.user_id}`);
                button.classList.remove('active');
                button.innerHTML = '<i class="far fa-heart"></i>';
                this.notifications.show('Đã xóa khỏi danh sách yêu thích', 'info');
            } else {
                await this.api.post('/wishlist/add', {
                    product_id: productId,
                    user_id: user.user_id
                });
                button.classList.add('active');
                button.innerHTML = '<i class="fas fa-heart"></i>';
                this.notifications.show('Đã thêm vào danh sách yêu thích', 'success');
            }
            
        } catch (error) {
            console.error('Wishlist error:', error);
            this.notifications.show('Có lỗi xảy ra', 'error');
        }
    }

    async loadWishlistStatus() {
        const user = this.storage.get('user');
        if (!user || !user.user_id) return;

        try {
            const wishlist = await this.api.get(`/wishlist/${user.user_id}`);
            const wishlistProductIds = wishlist.map(item => item.product_id);

            // Update wishlist buttons
            document.querySelectorAll('.btn-add-to-wishlist').forEach(btn => {
                const productId = btn.dataset.productId;
                if (wishlistProductIds.includes(parseInt(productId))) {
                    btn.classList.add('active');
                    btn.innerHTML = '<i class="fas fa-heart"></i>';
                }
            });
            
        } catch (error) {
            console.error('Error loading wishlist status:', error);
        }
    }

    setupLanguageSwitcher() {
        const languageSwitchers = document.querySelectorAll('.language-switcher');
        
        languageSwitchers.forEach(switcher => {
            switcher.addEventListener('change', (e) => {
                const selectedLanguage = e.target.value;
                this.changeLanguage(selectedLanguage);
            });
        });

        // Load saved language
        const savedLanguage = this.storage.get('language') || 'vi';
        this.setLanguage(savedLanguage);
    }

    changeLanguage(language) {
        this.storage.set('language', language);
        this.setLanguage(language);
        
        // Reload page to apply language changes
        window.location.reload();
    }

    setLanguage(language) {
        document.documentElement.lang = language;
        
        // Update language switchers
        document.querySelectorAll('.language-switcher').forEach(switcher => {
            switcher.value = language;
        });
    }

    setupThemeSwitcher() {
        const themeSwitchers = document.querySelectorAll('.theme-switcher');
        
        themeSwitchers.forEach(switcher => {
            switcher.addEventListener('click', () => {
                this.toggleTheme();
            });
        });

        // Load saved theme
        const savedTheme = this.storage.get('theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.dataset.theme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.dataset.theme = theme;
        this.storage.set('theme', theme);
        
        // Update theme switcher icons
        document.querySelectorAll('.theme-switcher i').forEach(icon => {
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        });
    }

    initializePageFeatures() {
        // Initialize features based on current page
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'home':
                this.initializeHomePage();
                break;
            case 'menu':
                this.initializeMenuPage();
                break;
            case 'about':
                this.initializeAboutPage();
                break;
            case 'blog':
                this.initializeBlogPage();
                break;
        }

        // Initialize common features
        this.initializeCommonFeatures();
    }

    initializeHomePage() {
        // Hero section animations
        this.animateHeroSection();
        
        // Statistics counter
        this.initializeCounters();
        
        // Parallax effects
        this.initializeParallax();
    }

    animateHeroSection() {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                heroContent.style.transition = 'all 1s ease';
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 500);
        }
    }

    initializeCounters() {
        const counters = document.querySelectorAll('.counter');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.dataset.target);
            const duration = parseInt(counter.dataset.duration) || 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        };

        // Animate counters when they come into view
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    initializeParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        if (parallaxElements.length === 0) return;

        window.addEventListener('scroll', Utils.throttle(() => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const rate = scrolled * -0.5;
                element.style.transform = `translateY(${rate}px)`;
            });
        }, 16));
    }

    initializeMenuPage() {
        // Product filtering
        this.initializeProductFilters();
        
        // Product sorting
        this.initializeProductSorting();
        
        // Infinite scroll
        this.initializeInfiniteScroll();
    }

    initializeProductFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const productGrid = document.querySelector('.products-grid');
        
        if (!filterButtons.length || !productGrid) return;

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active filter
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter products
                const category = btn.dataset.category;
                this.filterProducts(category);
            });
        });
    }

    async filterProducts(category) {
        const productGrid = document.querySelector('.products-grid');
        if (!productGrid) return;

        const loadingId = this.loading.show(productGrid, 'Đang tải...');
        
        try {
            const endpoint = category === 'all' 
                ? '/products' 
                : `/products?category=${category}`;
            
            const products = await this.api.get(endpoint);
            
            // Clear current products
            productGrid.innerHTML = '';
            
            // Add filtered products
            if (products && products.length > 0) {
                products.forEach(product => {
                    const productCard = this.createProductCard(product);
                    productGrid.appendChild(productCard);
                });
            } else {
                productGrid.innerHTML = `
                    <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                        <p>Không tìm thấy sản phẩm nào</p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error filtering products:', error);
            this.notifications.show('Có lỗi xảy ra khi lọc sản phẩm', 'error');
        } finally {
            this.loading.hide(loadingId);
        }
    }

    initializeProductSorting() {
        const sortSelect = document.querySelector('.sort-select');
        
        if (!sortSelect) return;

        sortSelect.addEventListener('change', () => {
            const sortBy = sortSelect.value;
            this.sortProducts(sortBy);
        });
    }

    async sortProducts(sortBy) {
        const productGrid = document.querySelector('.products-grid');
        if (!productGrid) return;

        const loadingId = this.loading.show(productGrid, 'Đang sắp xếp...');
        
        try {
            const products = await this.api.get(`/products?sort=${sortBy}`);
            
            // Clear current products
            productGrid.innerHTML = '';
            
            // Add sorted products
            products.forEach(product => {
                const productCard = this.createProductCard(product);
                productGrid.appendChild(productCard);
            });
            
        } catch (error) {
            console.error('Error sorting products:', error);
            this.notifications.show('Có lỗi xảy ra khi sắp xếp sản phẩm', 'error');
        } finally {
            this.loading.hide(loadingId);
        }
    }

    initializeInfiniteScroll() {
        let currentPage = 1;
        let isLoading = false;
        let hasMore = true;

        const loadMoreProducts = async () => {
            if (isLoading || !hasMore) return;

            isLoading = true;
            currentPage++;

            try {
                const products = await this.api.get(`/products?page=${currentPage}&limit=12`);
                
                if (products && products.length > 0) {
                    const productGrid = document.querySelector('.products-grid');
                    
                    products.forEach(product => {
                        const productCard = this.createProductCard(product);
                        productGrid.appendChild(productCard);
                    });
                    
                    // Check if there are more products
                    if (products.length < 12) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
                
            } catch (error) {
                console.error('Error loading more products:', error);
                hasMore = false;
            } finally {
                isLoading = false;
            }
        };

        // Scroll event listener
        window.addEventListener('scroll', Utils.throttle(() => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
                loadMoreProducts();
            }
        }, 250));
    }

    initializeAboutPage() {
        // Timeline animations
        this.initializeTimeline();
        
        // Team member cards
        this.initializeTeamCards();
        
        // Achievement counters
        this.initializeAchievements();
    }

    initializeTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        if (timelineItems.length === 0) return;

        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, {
            threshold: 0.3
        });

        timelineItems.forEach(item => {
            timelineObserver.observe(item);
        });
    }

    initializeTeamCards() {
        const teamCards = document.querySelectorAll('.team-card');
        
        teamCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    initializeAchievements() {
        const achievements = document.querySelectorAll('.achievement');
        
        const achievementObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('achieved');
                    achievementObserver.unobserve(entry.target);
                }
            });
        });

        achievements.forEach(achievement => {
            achievementObserver.observe(achievement);
        });
    }

    initializeBlogPage() {
        // Blog post filtering
        this.initializeBlogFilters();
        
        // Blog search
        this.initializeBlogSearch();
        
        // Related posts
        this.loadRelatedPosts();
    }

    initializeBlogFilters() {
        const filterButtons = document.querySelectorAll('.blog-filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active filter
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter blog posts
                const category = btn.dataset.category;
                this.filterBlogPosts(category);
            });
        });
    }

    async filterBlogPosts(category) {
        const blogGrid = document.querySelector('.blog-grid');
        if (!blogGrid) return;

        const loadingId = this.loading.show(blogGrid, 'Đang tải...');
        
        try {
            const endpoint = category === 'all' 
                ? '/blogs' 
                : `/blogs?category=${category}`;
            
            const posts = await this.api.get(endpoint);
            
            // Clear current posts
            blogGrid.innerHTML = '';
            
            // Add filtered posts
            posts.forEach(post => {
                const postCard = this.createBlogCard(post);
                blogGrid.appendChild(postCard);
            });
            
        } catch (error) {
            console.error('Error filtering blog posts:', error);
            this.notifications.show('Có lỗi xảy ra khi lọc bài viết', 'error');
        } finally {
            this.loading.hide(loadingId);
        }
    }

    createBlogCard(post) {
        const card = document.createElement('article');
        card.className = 'blog-card fade-in-up';
        
        card.innerHTML = `
            <div class="post-image">
                <img src="${post.img_url || 'img/blog-placeholder.jpg'}" alt="${post.title}" loading="lazy">
                <div class="post-category">${post.category_name || 'Tin tức'}</div>
            </div>
            <div class="post-content">
                <h3 class="post-title">
                    <a href="pages/blog-detail.html?id=${post.post_id}">${post.title}</a>
                </h3>
                <p class="post-excerpt">${this.truncateText(post.content || '', 150)}</p>
                <div class="post-meta">
                    <span class="post-date">
                        <i class="fas fa-calendar"></i>
                        ${Utils.formatDate(post.published_at || post.created_at)}
                    </span>
                    <span class="post-author">
                        <i class="fas fa-user"></i>
                        ${post.author_name || 'Admin'}
                    </span>
                    <span class="post-views">
                        <i class="fas fa-eye"></i>
                        ${post.view_count || 0}
                    </span>
                </div>
                <a href="pages/blog-detail.html?id=${post.post_id}" class="read-more">
                    Đọc tiếp <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        
        return card;
    }

    initializeBlogSearch() {
        const searchInput = document.querySelector('.blog-search-input');
        
        if (!searchInput) return;

        searchInput.addEventListener('input', Utils.debounce((e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                this.searchBlogPosts(query);
            } else {
                this.clearBlogSearch();
            }
        }, CONFIG.DEBOUNCE_DELAY));
    }

    async searchBlogPosts(query) {
        const blogGrid = document.querySelector('.blog-grid');
        if (!blogGrid) return;

        try {
            const posts = await this.api.get(`/blogs/search?q=${encodeURIComponent(query)}`);
            
            // Clear current posts
            blogGrid.innerHTML = '';
            
            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const postCard = this.createBlogCard(post);
                    blogGrid.appendChild(postCard);
                });
            } else {
                blogGrid.innerHTML = `
                    <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                        <p>Không tìm thấy bài viết nào với từ khóa "${query}"</p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error searching blog posts:', error);
        }
    }

    clearBlogSearch() {
        // Reload all blog posts
        this.filterBlogPosts('all');
    }

    async loadRelatedPosts() {
        const relatedContainer = document.querySelector('.related-posts');
        if (!relatedContainer) return;

        try {
            const currentPostId = Utils.getUrlParams().get('id');
            if (!currentPostId) return;

            const relatedPosts = await this.api.get(`/blogs/${currentPostId}/related?limit=3`);
            
            if (relatedPosts && relatedPosts.length > 0) {
                relatedContainer.innerHTML = relatedPosts.map(post => `
                    <div class="related-post">
                        <div class="related-post-image">
                            <img src="${post.img_url || 'img/blog-placeholder.jpg'}" alt="${post.title}">
                        </div>
                        <div class="related-post-content">
                            <h4><a href="pages/blog-detail.html?id=${post.post_id}">${post.title}</a></h4>
                            <span class="related-post-date">${Utils.formatDate(post.published_at)}</span>
                        </div>
                    </div>
                `).join('');
            }
            
        } catch (error) {
            console.error('Error loading related posts:', error);
        }
    }

    initializeCommonFeatures() {
        // Back to top button
        this.initializeBackToTop();
        
        // Lazy loading images
        this.initializeLazyLoading();
        
        // Social sharing
        this.initializeSocialSharing();
        
        // Print functionality
        this.initializePrint();
        
        // Copy to clipboard
        this.initializeCopyToClipboard();
    }

    initializeBackToTop() {
        const backToTopBtn = document.querySelector('.back-to-top');
        
        if (!backToTopBtn) {
            // Create back to top button
            const btn = document.createElement('button');
            btn.className = 'back-to-top';
            btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            btn.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                background: var(--primary-color);
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            
            document.body.appendChild(btn);
            
            // Show/hide on scroll
            window.addEventListener('scroll', Utils.throttle(() => {
                if (window.scrollY > 300) {
                    btn.style.opacity = '1';
                    btn.style.visibility = 'visible';
                } else {
                    btn.style.opacity = '0';
                    btn.style.visibility = 'hidden';
                }
            }, 100));
            
            // Scroll to top on click
            btn.addEventListener('click', () => {
                Utils.smoothScrollTo(document.body, 0);
            });
        }
    }

    initializeLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if (images.length === 0) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => {
            imageObserver.observe(img);
        });
    }

    initializeSocialSharing() {
        const shareButtons = document.querySelectorAll('.share-btn');
        
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const platform = btn.dataset.platform;
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(document.title);
                
                let shareUrl = '';
                
                switch (platform) {
                    case 'facebook':
                        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                        break;
                    case 'twitter':
                        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                        break;
                    case 'linkedin':
                        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                        break;
                    case 'whatsapp':
                        shareUrl = `https://wa.me/?text=${title}%20${url}`;
                        break;
                    case 'telegram':
                        shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
                        break;
                    case 'email':
                        shareUrl = `mailto:?subject=${title}&body=${url}`;
                        break;
                }
                
                if (shareUrl) {
                    window.open(shareUrl, '_blank', 'width=600,height=400');
                }
            });
        });

        // Native Web Share API
        const nativeShareBtns = document.querySelectorAll('.native-share-btn');
        
        if (navigator.share) {
            nativeShareBtns.forEach(btn => {
                btn.style.display = 'block';
                btn.addEventListener('click', async () => {
                    try {
                        await navigator.share({
                            title: document.title,
                            text: document.querySelector('meta[name="description"]')?.content || '',
                            url: window.location.href
                        });
                    } catch (error) {
                        console.error('Error sharing:', error);
                    }
                });
            });
        }
    }

    initializePrint() {
        const printButtons = document.querySelectorAll('.print-btn');
        
        printButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                window.print();
            });
        });
    }

    initializeCopyToClipboard() {
        const copyButtons = document.querySelectorAll('.copy-btn');
        
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const textToCopy = btn.dataset.text || window.location.href;
                
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    this.notifications.show('Đã sao chép vào clipboard!', 'success');
                } catch (error) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = textToCopy;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    this.notifications.show('Đã sao chép vào clipboard!', 'success');
                }
            });
        });
    }

    closeModal(modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    // Cleanup method
    destroy() {
        // Destroy sliders
        this.sliders.forEach(slider => {
            if (slider.destroy) {
                slider.destroy();
            }
        });

        // Remove event listeners
        window.removeEventListener('scroll', this.scrollHandler);
        window.removeEventListener('resize', this.resizeHandler);

        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        console.log('NguyenSinhApp destroyed');
    }
}

// Utility Classes
// Kiểm tra và xóa khai báo trùng lặp
// Tìm và xóa hoặc comment out khai báo MobileMenu cũ

// Thay vì khai báo lại, hãy sử dụng cách này:
if (typeof MobileMenu === 'undefined') {
    class MobileMenu {
        constructor() {
            this.toggle = document.querySelector('.mobile-menu-toggle');
            this.menu = document.querySelector('.main-menu');
            this.overlay = null;
            
            this.init();
        }

        init() {
            if (!this.toggle || !this.menu) return;

            this.toggle.addEventListener('click', () => this.toggleMenu());
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.mobile-menu-toggle') && 
                    !e.target.closest('.main-menu') && 
                    this.menu.classList.contains('active')) {
                    this.closeMenu();
                }
            });

            // Close menu on window resize
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.menu.classList.contains('active')) {
                    this.closeMenu();
                }
            });
        }

        toggleMenu() {
            if (this.menu.classList.contains('active')) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        }

        openMenu() {
            this.menu.classList.add('active');
            this.toggle.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Create overlay
            if (!this.overlay) {
                this.overlay = document.createElement('div');
                this.overlay.className = 'mobile-menu-overlay';
                this.overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    background: rgba(0,0,0,0.5);
                    z-index: 999;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                
                this.overlay.addEventListener('click', () => this.closeMenu());
                document.body.appendChild(this.overlay);
            }
            
            requestAnimationFrame(() => {
                this.overlay.style.opacity = '1';
            });
        }

        closeMenu() {
            this.menu.classList.remove('active');
            this.toggle.classList.remove('active');
            document.body.style.overflow = '';
            
            if (this.overlay) {
                this.overlay.style.opacity = '0';
                setTimeout(() => {
                    if (this.overlay && this.overlay.parentNode) {
                        this.overlay.parentNode.removeChild(this.overlay);
                        this.overlay = null;
                    }
                }, 300);
            }
        }
    }
}

// Hoặc sử dụng cách này để mở rộng class hiện có:
if (typeof MobileMenu !== 'undefined') {
    // Mở rộng class MobileMenu hiện có
    MobileMenu.prototype.enhancedToggleMenu = function() {
        if (this.menu.classList.contains('active')) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
        
        // Thêm animation mượt mà hơn
        this.menu.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    };
    
    MobileMenu.prototype.addKeyboardSupport = function() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.classList.contains('active')) {
                this.closeMenu();
            }
        });
    };
}

// Cách khác: Sử dụng namespace để tránh xung đột
window.NguyenSinhComponents = window.NguyenSinhComponents || {};

window.NguyenSinhComponents.MobileMenu = class {
    constructor() {
        this.toggle = document.querySelector('.mobile-menu-toggle');
        this.menu = document.querySelector('.main-menu');
        this.overlay = null;
        this.isAnimating = false;
        
        this.init();
    }

    init() {
        if (!this.toggle || !this.menu) return;

        this.bindEvents();
        this.setupAccessibility();
    }

    bindEvents() {
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMenu();
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mobile-menu-toggle') && 
                !e.target.closest('.main-menu') && 
                this.menu.classList.contains('active')) {
                this.closeMenu();
            }
        });

        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.menu.classList.contains('active')) {
                this.closeMenu();
            }
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.classList.contains('active')) {
                this.closeMenu();
            }
        });
    }

    setupAccessibility() {
        this.toggle.setAttribute('aria-expanded', 'false');
        this.toggle.setAttribute('aria-controls', 'main-menu');
        this.menu.setAttribute('id', 'main-menu');
    }

    toggleMenu() {
        if (this.isAnimating) return;
        
        if (this.menu.classList.contains('active')) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.menu.classList.add('active');
        this.toggle.classList.add('active');
        this.toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        
        // Create overlay
        this.createOverlay();
        
        // Focus management
        const firstMenuItem = this.menu.querySelector('a');
        if (firstMenuItem) {
            setTimeout(() => firstMenuItem.focus(), 300);
        }
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 300);
    }

    closeMenu() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.menu.classList.remove('active');
        this.toggle.classList.remove('active');
        this.toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        
        // Remove overlay
        this.removeOverlay();
        
        // Return focus to toggle button
        this.toggle.focus();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 300);
    }

    createOverlay() {
        if (this.overlay) return;
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'mobile-menu-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        this.overlay.addEventListener('click', () => this.closeMenu());
        document.body.appendChild(this.overlay);
        
        requestAnimationFrame(() => {
            this.overlay.style.opacity = '1';
        });
    }

    removeOverlay() {
        if (!this.overlay) return;
        
        this.overlay.style.opacity = '0';
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
                this.overlay = null;
            }
        }, 300);
    }
};

// Tương tự cho các class khác để tránh xung đột
window.NguyenSinhComponents.ScrollManager = class {
    constructor() {
        this.lastScrollY = 0;
        this.header = document.querySelector('header');
        this.ticking = false;
        
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            if (!this.ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });
    }

    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Header background change
        if (this.header) {
            if (currentScrollY > 50) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
        }

        // Header hide/show on scroll
        if (currentScrollY > 100) {
            if (currentScrollY > this.lastScrollY) {
                // Scrolling down
                if (this.header) {
                    this.header.style.transform = 'translateY(-100%)';
                }
            } else {
                // Scrolling up
                if (this.header) {
                    this.header.style.transform = 'translateY(0)';
                }
            }
        }

        // Update active menu item
        this.updateActiveMenuItem();
        
        this.lastScrollY = currentScrollY;
    }

    updateActiveMenuItem() {
        const sections = document.querySelectorAll('section[id]');
        const menuLinks = document.querySelectorAll('.main-menu a[href^="#"]');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && 
                window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        menuLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active');
            }
        });
    }
};

// Khởi tạo components
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xem đã khởi tạo chưa để tránh khởi tạo lại
    if (!window.nguyenSinhInitialized) {
        // Khởi tạo components
        if (typeof window.NguyenSinhComponents !== 'undefined') {
            window.mobileMenu = new window.NguyenSinhComponents.MobileMenu();
            window.scrollManager = new window.NguyenSinhComponents.ScrollManager();
        } else {
            // Fallback nếu namespace không tồn tại
            if (typeof MobileMenu !== 'undefined') {
                window.mobileMenu = new MobileMenu();
            }
            if (typeof ScrollManager !== 'undefined') {
                window.scrollManager = new ScrollManager();
            }
        }
        
        // Đánh dấu đã khởi tạo
        window.nguyenSinhInitialized = true;
        
        console.log('Nguyên Sinh components initialized successfully');
    }
});

class ScrollManager {
    constructor() {
        this.lastScrollY = 0;
        this.header = document.querySelector('header');
        
        this.init();
    }

    init() {
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleScroll();
        }, 16));
    }

    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Header background change
        if (this.header) {
            if (currentScrollY > 50) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
        }

        // Header hide/show on scroll
        if (currentScrollY > 100) {
            if (currentScrollY > this.lastScrollY) {
                // Scrolling down
                if (this.header) {
                    this.header.style.transform = 'translateY(-100%)';
                }
            } else {
                // Scrolling up
                if (this.header) {
                    this.header.style.transform = 'translateY(0)';
                }
            }
        }

        // Update active menu item
        this.updateActiveMenuItem();
        
        this.lastScrollY = currentScrollY;
    }

    updateActiveMenuItem() {
        const sections = document.querySelectorAll('section[id]');
        const menuLinks = document.querySelectorAll('.main-menu a[href^="#"]');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && 
                window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        menuLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active');
            }
        });
    }
}

class AnimationObserver {
    constructor() {
        this.observer = null;
        this.init();
    }

    init() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements with animation classes
        const animatedElements = document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right, .scale-in, .rotate-in');
        
        animatedElements.forEach(element => {
            this.observer.observe(element);
        });
    }

    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
        }
    }

    unobserve(element) {
        if (this.observer) {
            this.observer.unobserve(element);
        }
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

class FormHandler {
    constructor() {
        this.init();
    }

    init() {
        // Form validation
        this.initializeValidation();
        
        // File upload handling
        this.initializeFileUploads();
        
        // Dynamic form fields
        this.initializeDynamicFields();
    }

    initializeValidation() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });

            // Real-time validation
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            });
        });
    }

    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const rules = field.dataset.rules ? field.dataset.rules.split('|') : [];
        let isValid = true;
        let errorMessage = '';

        // Clear previous errors
        this.clearFieldError(field);

        // Required validation
        if (rules.includes('required') && !value) {
            isValid = false;
            errorMessage = 'Trường này là bắt buộc';
        }

        // Email validation
        if (rules.includes('email') && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Email không hợp lệ';
            }
        }

        // Phone validation
        if (rules.includes('phone') && value) {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Số điện thoại không hợp lệ';
            }
        }

        // Min length validation
        const minLength = rules.find(rule => rule.startsWith('min:'));
        if (minLength && value) {
            const min = parseInt(minLength.split(':')[1]);
            if (value.length < min) {
                isValid = false;
                errorMessage = `Tối thiểu ${min} ký tự`;
            }
        }

        // Max length validation
        const maxLength = rules.find(rule => rule.startsWith('max:'));
        if (maxLength && value) {
            const max = parseInt(maxLength.split(':')[1]);
            if (value.length > max) {
                isValid = false;
                errorMessage = `Tối đa ${max} ký tự`;
            }
        }

        // Show error if invalid
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.style.cssText = `
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 5px;
            `;
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }

    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    initializeFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileUpload(e.target);
            });
        });
    }

    handleFileUpload(input) {
        const files = Array.from(input.files);
        const maxSize = parseInt(input.dataset.maxSize) || 5 * 1024 * 1024; // 5MB default
        const allowedTypes = input.dataset.allowedTypes ? input.dataset.allowedTypes.split(',') : [];

        files.forEach(file => {
            // Size validation
            if (file.size > maxSize) {
                this.showFieldError(input, `Kích thước file không được vượt quá ${maxSize / 1024 / 1024}MB`);
                return;
            }

            // Type validation
            if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
                this.showFieldError(input, 'Định dạng file không được hỗ trợ');
                return;
            }

            // Show preview for images
            if (file.type.startsWith('image/')) {
                this.showImagePreview(input, file);
            }
        });
    }

    showImagePreview(input, file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            let preview = input.parentNode.querySelector('.image-preview');
            
            if (!preview) {
                preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.style.cssText = `
                    margin-top: 10px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                `;
                input.parentNode.appendChild(preview);
            }

            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = `
                position: relative;
                width: 100px;
                height: 100px;
                border-radius: 8px;
                overflow: hidden;
                border: 2px solid #ddd;
            `;

            const image = document.createElement('img');
            image.src = e.target.result;
            image.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                width: 20px;
                height: 20px;
                border: none;
                background: rgba(255,255,255,0.8);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            `;

            removeBtn.addEventListener('click', () => {
                imageContainer.remove();
                input.value = '';
            });

            imageContainer.appendChild(image);
            imageContainer.appendChild(removeBtn);
            preview.appendChild(imageContainer);
        };

        reader.readAsDataURL(file);
    }

    initializeDynamicFields() {
        // Add/remove field groups
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-field-btn')) {
                this.addFieldGroup(e.target);
            }
            
            if (e.target.matches('.remove-field-btn')) {
                this.removeFieldGroup(e.target);
            }
        });
    }

    addFieldGroup(button) {
        const template = button.dataset.template;
        const container = document.querySelector(button.dataset.container);
        
        if (!template || !container) return;

        const templateElement = document.querySelector(template);
        if (!templateElement) return;

        const clone = templateElement.cloneNode(true);
        clone.style.display = 'block';
        
        // Update field names and IDs
        const fields = clone.querySelectorAll('input, textarea, select');
        const index = container.children.length;
        
        fields.forEach(field => {
            if (field.name) {
                field.name = field.name.replace('[0]', `[${index}]`);
            }
            if (field.id) {
                field.id = field.id.replace('_0', `_${index}`);
            }
            field.value = '';
        });

        container.appendChild(clone);
    }

    removeFieldGroup(button) {
        const fieldGroup = button.closest('.field-group');
        if (fieldGroup) {
            fieldGroup.remove();
        }
    }
}

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoadTime: 0,
            domContentLoadedTime: 0,
            firstPaintTime: 0,
            firstContentfulPaintTime: 0
        };
        
        this.init();
    }

    init() {
        // Page load metrics
        window.addEventListener('load', () => {
            this.measurePageLoad();
        });

        // DOM content loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.metrics.domContentLoadedTime = performance.now();
        });

        // Performance observer for paint metrics
        if ('PerformanceObserver' in window) {
            this.observePaintMetrics();
        }

        // Monitor resource loading
        this.monitorResources();
    }

    measurePageLoad() {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
            this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
            
            console.log('Performance Metrics:', {
                'Page Load Time': `${this.metrics.pageLoadTime.toFixed(2)}ms`,
                'DOM Content Loaded': `${this.metrics.domContentLoadedTime.toFixed(2)}ms`,
                'DNS Lookup': `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
                'TCP Connection': `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
                'Server Response': `${(navigation.responseEnd - navigation.requestStart).toFixed(2)}ms`,
                'DOM Processing': `${(navigation.domComplete - navigation.domLoading).toFixed(2)}ms`
            });
        }
    }

    observePaintMetrics() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name === 'first-paint') {
                    this.metrics.firstPaintTime = entry.startTime;
                }
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaintTime = entry.startTime;
                }
            });
        });

        observer.observe({ entryTypes: ['paint'] });
    }

    monitorResources() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.duration > 1000) { // Resources taking more than 1 second
                    console.warn(`Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                }
            });
        });

        observer.observe({ entryTypes: ['resource'] });
    }

    getMetrics() {
        return this.metrics;
    }
}

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.init();
    }

    init() {
        // Global error handler
        window.addEventListener('error', (e) => {
            this.logError({
                type: 'JavaScript Error',
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                stack: e.error ? e.error.stack : null,
                timestamp: new Date().toISOString()
            });
        });

        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (e) => {
            this.logError({
                type: 'Unhandled Promise Rejection',
                message: e.reason.message || e.reason,
                stack: e.reason.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Network errors
        window.addEventListener('offline', () => {
            this.logError({
                type: 'Network Error',
                message: 'User went offline',
                timestamp: new Date().toISOString()
            });
        });
    }

    logError(error) {
        this.errors.push(error);
        
        // Log to console in development
        if (CONFIG.DEBUG) {
            console.error('Error logged:', error);
        }

        // Send to error reporting service in production
        if (!CONFIG.DEBUG) {
            this.reportError(error);
        }

        // Show user-friendly message for critical errors
        if (error.type === 'JavaScript Error' || error.type === 'Unhandled Promise Rejection') {
            this.showErrorMessage();
        }
    }

    async reportError(error) {
        try {
            await fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...error,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).user_id : null
                })
            });
        } catch (e) {
            console.error('Failed to report error:', e);
        }
    }

    showErrorMessage() {
        const existingMessage = document.querySelector('.error-banner');
        if (existingMessage) return;

        const errorBanner = document.createElement('div');
        errorBanner.className = 'error-banner';
        errorBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #dc3545;
            color: white;
            padding: 10px 20px;
            text-align: center;
            z-index: 10001;
            font-size: 14px;
        `;

        errorBanner.innerHTML = `
            <span>Đã xảy ra lỗi. Vui lòng tải lại trang hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục.</span>
            <button onclick="this.parentNode.remove()" style="background: none; border: none; color: white; margin-left: 15px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(errorBanner);

        // Auto remove after 10 seconds
        setTimeout(() => {
            if (errorBanner.parentNode) {
                errorBanner.parentNode.removeChild(errorBanner);
            }
        }, 10000);
    }

    getErrors() {
        return this.errors;
    }

    clearErrors() {
        this.errors = [];
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main application
    window.nguyenSinhApp = new NguyenSinhApp();
    
    // Initialize utility classes
    window.mobileMenu = new MobileMenu();
    window.scrollManager = new ScrollManager();
    window.animationObserver = new AnimationObserver();
    window.formHandler = new FormHandler();
    
    // Initialize monitoring in production
    if (!CONFIG.DEBUG) {
        window.performanceMonitor = new PerformanceMonitor();
        window.errorHandler = new ErrorHandler();
    }
    
    console.log('Nguyên Sinh website initialized successfully');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.nguyenSinhApp && typeof window.nguyenSinhApp.destroy === 'function') {
        window.nguyenSinhApp.destroy();
    }
    
    if (window.animationObserver && typeof window.animationObserver.destroy === 'function') {
        window.animationObserver.destroy();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NguyenSinhApp,
        Utils,
        CONFIG,
        API,
        Storage,
        EventEmitter,
        NotificationManager,
        LoadingManager,
        Slider,
        MobileMenu,
        ScrollManager,
        AnimationObserver,
        FormHandler,
        PerformanceMonitor,
        ErrorHandler
    };
}

// Cập nhật phần testimonials trong file script.js chính
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo testimonials slider
    if (document.querySelector('.testimonials-slider')) {
        window.testimonialsSlider = new TestimonialsSlider();
    }
    
    // Các khởi tạo khác...
    initializePage();
});

// Cập nhật hàm testimonials trong NguyenSinhApp class
class NguyenSinhApp {
    // ... các method khác

    initializeTestimonials() {
        // Khởi tạo slider nếu chưa có
        if (!window.testimonialsSlider && document.querySelector('.testimonials-slider')) {
            window.testimonialsSlider = new TestimonialsSlider();
        }
        
        // Load testimonials từ API nếu cần
        this.loadTestimonialsFromAPI();
    }

    async loadTestimonialsFromAPI() {
        try {
            const response = await this.api.get('/reviews/featured?limit=5');
            
            if (response && response.data && response.data.length > 0) {
                this.renderTestimonials(response.data);
                
                // Reinitialize slider với dữ liệu mới
                if (window.testimonialsSlider) {
                    window.testimonialsSlider.destroy();
                }
                window.testimonialsSlider = new TestimonialsSlider();
            }
        } catch (error) {
            console.error('Error loading testimonials:', error);
            // Sử dụng dữ liệu tĩnh nếu API lỗi
        }
    }

    renderTestimonials(testimonials) {
        const slider = document.querySelector('.testimonials-slider');
        const indicators = document.querySelector('.testimonial-indicators');
        
        if (!slider) return;

        // Clear existing content
        slider.innerHTML = '';
        if (indicators) indicators.innerHTML = '';

        // Render testimonials
        testimonials.forEach((testimonial, index) => {
            const testimonialHTML = this.createTestimonialHTML(testimonial);
            slider.appendChild(testimonialHTML);

            // Create indicator
            if (indicators) {
                const indicator = document.createElement('button');
                indicator.className = `testimonial-indicator ${index === 0 ? 'active' : ''}`;
                indicator.setAttribute('data-slide', index);
                indicators.appendChild(indicator);
            }
        });
    }

    createTestimonialHTML(testimonial) {
        const item = document.createElement('div');
        item.className = 'testimonial-item';
        
        // Generate stars
        const stars = this.generateStars(testimonial.rating || 5);
        
        item.innerHTML = `
            <div class="testimonial-content">
                <div class="testimonial-rating">
                    ${stars}
                </div>
                <p class="testimonial-text">"${testimonial.content || testimonial.review_text}"</p>
                <div class="testimonial-author">
                    <img src="${testimonial.user_avatar || testimonial.avatar || 'img/default-avatar.jpg'}" 
                         alt="${testimonial.user_name || testimonial.name}">
                    <div class="author-info">
                        <h4>${testimonial.user_name || testimonial.name}</h4>
                        <p>${testimonial.user_title || testimonial.title || 'Khách hàng'}</p>
                    </div>
                </div>
            </div>
        `;
        
        return item;
    }

    generateStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }
}
