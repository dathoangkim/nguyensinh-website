// Enhanced Locations JavaScript - Production Ready
class LocationsManager {
    constructor() {
        this.API_BASE_URL = "http://localhost:5000/api";
        this.stores = [];
        this.filteredStores = [];
        this.currentFilter = 'all';
        this.currentView = 'grid';
        this.searchQuery = '';
        this.userLocation = null;
        this.selectedStore = null;
        this.isLoading = false;
        this.map = null;
        this.markers = [];
        this.infoWindows = [];
        
        this.init();
    }

    async init() {
        console.log('🏪 Initializing Locations Manager...');
        
        try {
            // Initialize AOS
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 800,
                    easing: 'ease-out-cubic',
                    once: true,
                    offset: 100
                });
            }

            // Load store data from API
            await this.loadStores();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize counter animations
            this.initCounterAnimations();
            
            // Initialize map
            this.initializeMap();
            
            // Get user location
            this.getUserLocation();
            
            console.log('✅ Locations Manager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Locations Manager:', error);
            this.showError('Có lỗi xảy ra khi tải trang. Vui lòng thử lại sau.');
        }
    }

    // API Methods
    async fetchData(endpoint) {
        try {
            const url = `${this.API_BASE_URL}${endpoint}`;
            console.log(`📡 Fetching data from: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Data received:`, data);
            
            return data;
        } catch (error) {
            console.error(`❌ Error fetching data from ${endpoint}:`, error);
            throw error;
        }
    }

    async loadStores() {
        this.showLoading(true);
        
        try {
            const response = await this.fetchData('/stores');
            
            if (response.success && response.data) {
                this.stores = response.data;
                this.filteredStores = [...this.stores];
                
                console.log(`📍 Loaded ${this.stores.length} stores`);
                
                // Update hero stats
                this.updateHeroStats();
                
                // Render stores
                this.renderStores();
                
                // Update map
                this.updateMapMarkers();
                
                // Update map sidebar
                this.updateMapSidebar();
                
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('❌ Error loading stores:', error);
            this.showError('Không thể tải danh sách cửa hàng. Vui lòng thử lại sau.');
        } finally {
            this.showLoading(false);
        }
    }

    // UI Rendering Methods
    renderStores() {
        const storesGrid = document.getElementById('storesGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!storesGrid) return;

        // Clear existing content
        storesGrid.innerHTML = '';
        
        if (this.filteredStores.length === 0) {
            storesGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        storesGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        // Update grid class based on view
        storesGrid.className = `stores-grid ${this.currentView}-view`;

        this.filteredStores.forEach((store, index) => {
            const storeCard = this.createStoreCard(store, index);
            storesGrid.appendChild(storeCard);
        });

        // Add AOS animation to new elements
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    createStoreCard(store, index) {
        const card = document.createElement('div');
        card.className = 'store-card';
        card.dataset.storeId = store.store_id;
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', `${index * 100}`);

        // Determine store badge
        let badge = '';
        if (store.is_flagship) {
            badge = '<div class="store-badge flagship">Cửa hàng chính</div>';
        } else if (store.is_new) {
            badge = '<div class="store-badge new">Mới khai trương</div>';
        } else {
            badge = '<div class="store-badge">Chi nhánh</div>';
        }

        // Calculate distance if user location is available
        let distanceHtml = '';
        if (this.userLocation && store.lat && store.lng) {
            const distance = this.calculateDistance(
                this.userLocation.lat, 
                this.userLocation.lng, 
                parseFloat(store.lat), 
                parseFloat(store.lng)
            );
            distanceHtml = `<div class="store-distance">${distance.toFixed(1)} km</div>`;
        }

        // Generate rating stars
        const rating = store.rating || 4.5;
        const ratingHtml = this.generateRatingStars(rating);

        // Store status
        const isOpen = this.isStoreOpen(store.opening_hours);
        const statusClass = isOpen ? 'open' : 'closed';
        const statusText = isOpen ? 'Đang mở cửa' : 'Đã đóng cửa';

        card.innerHTML = `
            <div class="store-image">
                <img src="${store.image_url || '../img/không gian 9.jpg'}" 
                     alt="${store.name}"
                     onerror="this.src='../img/không gian 9.jpg'">
                ${badge}
                ${distanceHtml}
            </div>
            <div class="store-content">
                <div class="store-header">
                    <h3 class="store-name">${store.name}</h3>
                    <div class="store-rating">
                        ${ratingHtml}
                        <span>(${store.review_count || 0})</span>
                    </div>
                </div>
                <div class="store-info">
                    <div class="store-info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${store.address}${store.district ? ', ' + store.district : ''}${store.city ? ', ' + store.city : ''}</span>
                    </div>
                    <div class="store-info-item">
                        <i class="fas fa-phone"></i>
                        <span>${store.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="store-info-item">
                        <i class="fas fa-clock"></i>
                        <span>${store.opening_hours || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="store-info-item">
                        <i class="fas fa-circle ${statusClass}"></i>
                        <span class="${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="store-actions">
                    <button class="store-btn primary view-details" data-store-id="${store.store_id}">
                        <i class="fas fa-info-circle"></i>
                        Chi tiết
                    </button>
                    <button class="store-btn secondary get-directions" 
                            data-lat="${store.lat}" data-lng="${store.lng}">
                        <i class="fas fa-directions"></i>
                        Chỉ đường
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachStoreCardEvents(card, store);

        return card;
    }

    attachStoreCardEvents(card, store) {
        // View details button
        const viewDetailsBtn = card.querySelector('.view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showStoreModal(store);
            });
        }

        // Get directions button
        const directionsBtn = card.querySelector('.get-directions');
        if (directionsBtn) {
            directionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.getDirections(store.lat, store.lng);
            });
        }

        // Card click to show details
        card.addEventListener('click', () => {
            this.showStoreModal(store);
        });

        // Hover effects
        card.addEventListener('mouseenter', () => {
            this.highlightStoreOnMap(store.store_id);
        });
    }

    generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHtml = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }

        return starsHtml;
    }

    isStoreOpen(openingHours) {
        if (!openingHours) return false;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Simple check for "HH:MM - HH:MM" format
        const timeMatch = openingHours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (timeMatch) {
            const openTime = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
            const closeTime = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4]);
            
            return currentTime >= openTime && currentTime <= closeTime;
        }
        
        return true; // Default to open if can't parse
    }

    // Map Methods
    initializeMap() {
        if (typeof google === 'undefined' || !google.maps) {
            console.warn('Google Maps API not loaded');
            document.getElementById('map').innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="text-align: center;">
                        <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>Google Maps không khả dụng</p>
                    </div>
                </div>
            `;
            return;
        }

        // Default location (Vietnam center)
        const defaultLocation = { lat: 16.0544, lng: 108.2022 };

        this.map = new google.maps.Map(document.getElementById('map'), {
            center: defaultLocation,
            zoom: 6,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels.text',
                    stylers: [{ visibility: 'off' }]
                },
                {
                    featureType: 'poi.business',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        console.log('🗺️ Map initialized');
    }

    updateMapMarkers() {
        if (!this.map) return;

        // Clear existing markers
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
        this.infoWindows.forEach(infoWindow => infoWindow.close());
        this.infoWindows = [];

        if (this.filteredStores.length === 0) return;

        const bounds = new google.maps.LatLngBounds();

        this.filteredStores.forEach((store, index) => {
            if (!store.lat || !store.lng) return;

            const position = {
                lat: parseFloat(store.lat),
                lng: parseFloat(store.lng)
            };

            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: store.name,
                animation: google.maps.Animation.DROP,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="#8B4513" stroke="#fff" stroke-width="2"/>
                            <text x="20" y="26" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40)
                }
            });

            const infoWindow = new google.maps.InfoWindow({
                content: this.createMapInfoWindow(store)
            });

            marker.addListener('click', () => {
                this.infoWindows.forEach(iw => iw.close());
                infoWindow.open(this.map, marker);
                this.map.panTo(position);
            });

            this.markers.push(marker);
            this.infoWindows.push(infoWindow);
            bounds.extend(position);
        });

        // Add user location marker if available
        if (this.userLocation) {
            const userMarker = new google.maps.Marker({
                position: this.userLocation,
                map: this.map,
                title: 'Vị trí của bạn',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2
                }
            });
            bounds.extend(this.userLocation);
        }

        // Fit map to show all markers
        if (this.markers.length > 0) {
            this.map.fitBounds(bounds);
            
            // Ensure minimum zoom level
            google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
                               if (this.map.getZoom() > 15) {
                    this.map.setZoom(15);
                }
            });
        }
    }

    createMapInfoWindow(store) {
        const isOpen = this.isStoreOpen(store.opening_hours);
        const statusClass = isOpen ? 'open' : 'closed';
        const statusText = isOpen ? 'Đang mở cửa' : 'Đã đóng cửa';

        return `
            <div style="max-width: 250px; padding: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #8B4513; font-size: 1.1rem;">${store.name}</h4>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">
                    <i class="fas fa-map-marker-alt" style="color: #8B4513; width: 15px;"></i>
                    ${store.address}
                </p>
                <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">
                    <i class="fas fa-phone" style="color: #8B4513; width: 15px;"></i>
                    ${store.phone || 'Chưa cập nhật'}
                </p>
                <p style="margin: 5px 0; font-size: 0.9rem;">
                    <i class="fas fa-circle ${statusClass}" style="width: 15px;"></i>
                    <span class="${statusClass}">${statusText}</span>
                </p>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="locationsManager.showStoreModal(${JSON.stringify(store).replace(/"/g, '&quot;')})" 
                            style="flex: 1; padding: 8px 12px; background: #8B4513; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Chi tiết
                    </button>
                    <button onclick="locationsManager.getDirections(${store.lat}, ${store.lng})" 
                            style="flex: 1; padding: 8px 12px; background: #f8f9fa; color: #8B4513; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Chỉ đường
                    </button>
                </div>
            </div>
        `;
    }

    updateMapSidebar() {
        const mapSidebar = document.getElementById('mapSidebar');
        if (!mapSidebar) return;

        mapSidebar.innerHTML = '';

        if (this.filteredStores.length === 0) {
            mapSidebar.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Không có cửa hàng nào</p>';
            return;
        }

        this.filteredStores.forEach((store, index) => {
            const storeItem = document.createElement('div');
            storeItem.className = 'map-store-item';
            storeItem.dataset.storeId = store.store_id;

            const isOpen = this.isStoreOpen(store.opening_hours);
            const statusClass = isOpen ? 'open' : 'closed';
            const statusText = isOpen ? 'Đang mở cửa' : 'Đã đóng cửa';

            storeItem.innerHTML = `
                <div class="map-store-name">${index + 1}. ${store.name}</div>
                <div class="map-store-address">${store.address}</div>
                <div class="map-store-status">
                    <span class="status-dot ${statusClass}"></span>
                    ${statusText}
                </div>
            `;

            storeItem.addEventListener('click', () => {
                this.focusStoreOnMap(store, index);
                this.highlightMapStoreItem(storeItem);
            });

            mapSidebar.appendChild(storeItem);
        });
    }

    focusStoreOnMap(store, index) {
        if (!this.map || !store.lat || !store.lng) return;

        const position = {
            lat: parseFloat(store.lat),
            lng: parseFloat(store.lng)
        };

        this.map.panTo(position);
        this.map.setZoom(16);

        // Open info window
        if (this.infoWindows[index]) {
            this.infoWindows.forEach(iw => iw.close());
            this.infoWindows[index].open(this.map, this.markers[index]);
        }
    }

    highlightMapStoreItem(selectedItem) {
        document.querySelectorAll('.map-store-item').forEach(item => {
            item.classList.remove('active');
        });
        selectedItem.classList.add('active');
    }

    highlightStoreOnMap(storeId) {
        const storeIndex = this.filteredStores.findIndex(store => store.store_id == storeId);
        if (storeIndex !== -1 && this.markers[storeIndex]) {
            this.markers[storeIndex].setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                this.markers[storeIndex].setAnimation(null);
            }, 2000);
        }
    }

    // Modal Methods
    showStoreModal(store) {
        const modal = document.getElementById('storeModal');
        if (!modal) return;

        this.selectedStore = store;

        // Populate modal content
        document.getElementById('modalStoreName').textContent = store.name;
        document.getElementById('modalStoreAddress').textContent = 
            `${store.address}${store.district ? ', ' + store.district : ''}${store.city ? ', ' + store.city : ''}`;
        document.getElementById('modalStorePhone').textContent = store.phone || 'Chưa cập nhật';
        document.getElementById('modalStoreEmail').textContent = store.email || 'Chưa cập nhật';

        // Set store image
        const modalImage = document.getElementById('modalStoreImage');
        modalImage.src = store.image_url || '../img/không gian 9.jpg';
        modalImage.onerror = () => modalImage.src = '../img/không gian 9.jpg';

        // Set rating
        const rating = store.rating || 4.5;
        document.getElementById('modalStoreRating').innerHTML = `
            ${this.generateRatingStars(rating)}
            <span style="margin-left: 10px;">${rating}/5 (${store.review_count || 0} đánh giá)</span>
        `;

        // Set opening hours
        this.populateOpeningHours(store.opening_hours);

        // Set services
        this.populateServices(store.services);

        // Update action buttons
        this.updateModalActions(store);

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    populateOpeningHours(openingHours) {
        const hoursContainer = document.getElementById('modalStoreHours');
        hoursContainer.innerHTML = '';

        if (!openingHours) {
            hoursContainer.innerHTML = '<li>Chưa cập nhật giờ mở cửa</li>';
            return;
        }

        // If it's a simple format like "7:00 - 22:00"
        if (typeof openingHours === 'string') {
            const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
            days.forEach(day => {
                const li = document.createElement('li');
                li.textContent = `${day}: ${openingHours}`;
                hoursContainer.appendChild(li);
            });
        } else if (typeof openingHours === 'object') {
            // If it's an object with specific days
            Object.entries(openingHours).forEach(([day, hours]) => {
                const li = document.createElement('li');
                li.textContent = `${day}: ${hours}`;
                hoursContainer.appendChild(li);
            });
        }
    }

    populateServices(services) {
        const servicesContainer = document.getElementById('modalStoreServices');
        servicesContainer.innerHTML = '';

        const defaultServices = [
            'Dùng tại chỗ',
            'Mang về',
            'Giao hàng',
            'Thanh toán thẻ',
            'Wifi miễn phí'
        ];

        const storeServices = services || defaultServices;

        if (Array.isArray(storeServices)) {
            storeServices.forEach(service => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fas fa-check" style="color: #28a745; margin-right: 8px;"></i>${service}`;
                servicesContainer.appendChild(li);
            });
        } else {
            defaultServices.forEach(service => {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fas fa-check" style="color: #28a745; margin-right: 8px;"></i>${service}`;
                servicesContainer.appendChild(li);
            });
        }
    }

    updateModalActions(store) {
        const directionsBtn = document.getElementById('modalDirectionsBtn');
        const callBtn = document.getElementById('modalCallBtn');

        if (directionsBtn) {
            directionsBtn.onclick = () => this.getDirections(store.lat, store.lng);
        }

        if (callBtn && store.phone) {
            callBtn.href = `tel:${store.phone}`;
        } else if (callBtn) {
            callBtn.style.display = 'none';
        }
    }

    closeStoreModal() {
        const modal = document.getElementById('storeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.selectedStore = null;
        }
    }

    // Search and Filter Methods
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.applyFilters();
            }, 300));
        }

        // Search button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                if (filter) {
                    this.setActiveFilter(filter);
                    this.currentFilter = filter;
                    this.applyFilters();
                }
            });
        });

        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                if (view) {
                    this.setActiveView(view);
                    this.currentView = view;
                    this.renderStores();
                }
            });
        });

        // Near me button
        const nearMeBtn = document.getElementById('nearMeBtn');
        if (nearMeBtn) {
            nearMeBtn.addEventListener('click', () => {
                this.findNearestStores();
            });
        }

        // Refresh map button
        const refreshMapBtn = document.getElementById('refreshMapBtn');
        if (refreshMapBtn) {
            refreshMapBtn.addEventListener('click', () => {
                this.refreshMap();
            });
        }

        // Modal close events
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeStoreModal();
            });
        }

        const storeModal = document.getElementById('storeModal');
        if (storeModal) {
            storeModal.addEventListener('click', (e) => {
                if (e.target === storeModal) {
                    this.closeStoreModal();
                }
            });
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeStoreModal();
            }
        });

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            if (this.map) {
                google.maps.event.trigger(this.map, 'resize');
            }
        }, 250));
    }

    setActiveFilter(filter) {
        document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    }

    setActiveView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
    }

    applyFilters() {
        let filtered = [...this.stores];

        // Apply city filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(store => {
                const city = store.city ? store.city.toLowerCase() : '';
                switch (this.currentFilter) {
                    case 'hanoi':
                        return city.includes('hà nội') || city.includes('hanoi');
                    case 'hcm':
                        return city.includes('hồ chí minh') || city.includes('hcm') || city.includes('sài gòn');
                    case 'danang':
                        return city.includes('đà nẵng') || city.includes('da nang');
                    default:
                        return true;
                }
            });
        }

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(store => {
                const searchFields = [
                    store.name,
                    store.address,
                    store.district,
                    store.city,
                    store.phone
                ].join(' ').toLowerCase();
                
                return searchFields.includes(this.searchQuery);
            });
        }

        this.filteredStores = filtered;
        this.renderStores();
        this.updateMapMarkers();
        this.updateMapSidebar();

        console.log(`🔍 Filtered ${this.filteredStores.length} stores from ${this.stores.length} total`);
    }

    // Location Methods
    getUserLocation() {
        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by this browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                              console.log('📍 User location obtained:', this.userLocation);
                
                // Update map to show user location
                if (this.map) {
                    this.updateMapMarkers();
                }
                
                // Re-render stores to show distances
                this.renderStores();
            },
            (error) => {
                console.warn('Error getting user location:', error.message);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        console.warn('User denied the request for Geolocation');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.warn('Location information is unavailable');
                        break;
                    case error.TIMEOUT:
                        console.warn('The request to get user location timed out');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    }

    findNearestStores() {
        if (!this.userLocation) {
            this.getUserLocation();
            this.showNotification('Đang xác định vị trí của bạn...', 'info');
            return;
        }

        // Calculate distances and sort by nearest
        const storesWithDistance = this.stores.map(store => {
            if (!store.lat || !store.lng) return { ...store, distance: Infinity };
            
            const distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                parseFloat(store.lat),
                parseFloat(store.lng)
            );
            
            return { ...store, distance };
        });

        // Sort by distance and take nearest ones
        storesWithDistance.sort((a, b) => a.distance - b.distance);
        this.filteredStores = storesWithDistance.slice(0, 10); // Show 10 nearest stores

        // Update UI
        this.renderStores();
        this.updateMapMarkers();
        this.updateMapSidebar();

        // Focus map on user location
        if (this.map) {
            this.map.panTo(this.userLocation);
            this.map.setZoom(12);
        }

        this.showNotification(`Tìm thấy ${this.filteredStores.length} cửa hàng gần bạn`, 'success');
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    getDirections(lat, lng) {
        if (!lat || !lng) {
            this.showNotification('Không có thông tin vị trí cửa hàng', 'error');
            return;
        }

        const destination = `${lat},${lng}`;
        
        // Try to open in Google Maps app first, fallback to web
        const googleMapsApp = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
        const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        
        // Check if on mobile device
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Try to open in app first
            const link = document.createElement('a');
            link.href = googleMapsApp;
            link.click();
            
            // Fallback to web after a short delay
            setTimeout(() => {
                window.open(googleMapsWeb, '_blank');
            }, 1000);
        } else {
            // Open in web browser
            window.open(googleMapsWeb, '_blank');
        }
    }

    refreshMap() {
        if (!this.map) {
            this.initializeMap();
            return;
        }

        // Reset filters
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.filteredStores = [...this.stores];

        // Reset UI
        document.getElementById('searchInput').value = '';
        this.setActiveFilter('all');

        // Update map
        this.updateMapMarkers();
        this.updateMapSidebar();
        this.renderStores();

        // Reset map view
        if (this.stores.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            this.stores.forEach(store => {
                if (store.lat && store.lng) {
                    bounds.extend({
                        lat: parseFloat(store.lat),
                        lng: parseFloat(store.lng)
                    });
                }
            });
            this.map.fitBounds(bounds);
        }

        this.showNotification('Đã làm mới bản đồ', 'success');
    }

    // UI Helper Methods
    updateHeroStats() {
        const totalStores = this.stores.length;
        const cities = [...new Set(this.stores.map(store => store.city).filter(Boolean))].length;
        const totalCustomers = 50000; // This could come from API

        // Update counter elements
        this.animateCounter('[data-count]', totalStores, 0);
        
        // Update specific counters if they exist
        const storeCounter = document.querySelector('[data-count="15"]');
        const cityCounter = document.querySelector('[data-count="3"]');
        const customerCounter = document.querySelector('[data-count="50000"]');

        if (storeCounter) this.animateCounter(storeCounter, totalStores, 0);
        if (cityCounter) this.animateCounter(cityCounter, cities, 0);
        if (customerCounter) this.animateCounter(customerCounter, totalCustomers, 0);
    }

    initCounterAnimations() {
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const targetValue = parseInt(element.dataset.count);
                    this.animateCounter(element, targetValue, 0);
                    observer.unobserve(element);
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-count]').forEach(counter => {
            observer.observe(counter);
        });
    }

    animateCounter(element, target, current) {
        const increment = target / 50; // Animation duration control
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (typeof element === 'string') {
                const el = document.querySelector(element);
                if (el) el.textContent = Math.floor(current).toLocaleString();
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 20);
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const storesGrid = document.getElementById('storesGrid');
        
        if (loadingState) {
            loadingState.style.display = show ? 'flex' : 'none';
        }
        
        if (storesGrid) {
            storesGrid.style.display = show ? 'none' : 'grid';
        }
        
        this.isLoading = show;
    }

    showError(message) {
        this.showNotification(message, 'error');
        
        // Show error state in stores grid
        const storesGrid = document.getElementById('storesGrid');
        if (storesGrid) {
            storesGrid.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>Có lỗi xảy ra</h3>
                    <p>${message}</p>
                    <button onclick="locationsManager.loadStores()" class="btn btn-primary" style="margin-top: 20px;">
                        Thử lại
                    </button>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    formatPhoneNumber(phone) {
        if (!phone) return '';
        
        // Remove all non-digits
        const cleaned = phone.replace(/\D/g, '');
        
        // Format Vietnamese phone numbers
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
        } else if (cleaned.length === 11) {
            return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        
        return phone;
    }

    formatAddress(store) {
        const parts = [store.address, store.district, store.city].filter(Boolean);
        return parts.join(', ');
    }

    // Analytics and Tracking
    trackStoreView(storeId) {
        // Track store view for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'store_view', {
                'store_id': storeId,
                'event_category': 'engagement'
            });
        }
        
        console.log(`📊 Tracked store view: ${storeId}`);
    }

    trackDirectionsRequest(storeId) {
        // Track directions request for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'directions_request', {
                'store_id': storeId,
                'event_category': 'engagement'
            });
        }
        
        console.log(`📊 Tracked directions request: ${storeId}`);
    }

    // Cleanup Methods
    destroy() {
        // Clean up event listeners and resources
        if (this.map) {
            this.markers.forEach(marker => marker.setMap(null));
            this.infoWindows.forEach(infoWindow => infoWindow.close());
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        console.log('🧹 Locations Manager destroyed');
    }
}

// CSS Animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Initialize when DOM is ready
let locationsManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing Locations Manager...');
    locationsManager = new LocationsManager();
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (locationsManager) {
        locationsManager.destroy();
    }
});

// Export for global access
window.locationsManager = locationsManager;


