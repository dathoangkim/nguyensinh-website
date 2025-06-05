class TableManagement {
    constructor() {
        this.tables = [];
        this.stores = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.currentView = 'list'; // 'list' or 'grid'
        this.filters = {
            store: 'all',
            status: 'all',
            search: ''
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStores();
        this.loadTables();
    }

    bindEvents() {
        // Add table button
        document.getElementById('add-table-btn')?.addEventListener('click', () => {
            this.showAddTableForm();
        });

        // Cancel table form
        document.getElementById('cancel-table-btn')?.addEventListener('click', () => {
            this.hideTableForm();
        });

        // Table form submit
        document.getElementById('table-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTable();
        });

        // View toggle buttons
        document.getElementById('list-view-btn')?.addEventListener('click', () => {
            this.switchView('list');
        });

        document.getElementById('grid-view-btn')?.addEventListener('click', () => {
            this.switchView('grid');
        });

        // Filters
        document.getElementById('store-filter')?.addEventListener('change', (e) => {
            this.filters.store = e.target.value;
            this.filterTables();
        });

        document.getElementById('table-status-filter')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.filterTables();
        });

        // Store selection change in form
        document.getElementById('table-store')?.addEventListener('change', (e) => {
            this.updateTableNumbers(e.target.value);
        });
    }

    async loadStores() {
        try {
            const response = await fetch('/api/stores');
            const data = await response.json();
            
            if (data.success) {
                this.stores = data.data;
                this.populateStoreFilters();
            }
        } catch (error) {
            console.error('Error loading stores:', error);
            this.showNotification('Không thể tải danh sách cửa hàng', 'error');
        }
    }

    populateStoreFilters() {
        const storeFilter = document.getElementById('store-filter');
        const tableStore = document.getElementById('table-store');
        
        if (storeFilter) {
            storeFilter.innerHTML = '<option value="all">Tất cả cửa hàng</option>';
            this.stores.forEach(store => {
                storeFilter.innerHTML += `<option value="${store.store_id}">${store.name}</option>`;
            });
        }

        if (tableStore) {
            tableStore.innerHTML = '<option value="">-- Chọn cửa hàng --</option>';
            this.stores.forEach(store => {
                tableStore.innerHTML += `<option value="${store.store_id}">${store.name}</option>`;
            });
        }
    }

    async loadTables() {
        try {
            const loadingId = window.loadingManager?.show(document.getElementById('tables-section'));
            
            // Sử dụng API có sẵn - lấy tất cả bàn theo từng cửa hàng
            let allTables = [];
            
            for (const store of this.stores) {
                const response = await fetch(`/api/tables/store/${store.store_id}`);
                const data = await response.json();
                
                if (data.success) {
                    allTables = [...allTables, ...data.data];
                }
            }
            
            this.tables = allTables;
            this.renderTables();
            this.updatePagination();
            this.updateStatisticsDisplay();
        } catch (error) {
            console.error('Error loading tables:', error);
            this.showNotification('Không thể tải danh sách bàn', 'error');
        } finally {
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
        }
    }

    async loadTablesByStore(storeId) {
        try {
            const response = await fetch(`/api/tables/store/${storeId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error loading tables by store:', error);
            return [];
        }
    }

    renderTables() {
        if (this.currentView === 'list') {
            this.renderTablesList();
        } else {
            this.renderTablesGrid();
        }
    }

    renderTablesList() {
        const tbody = document.getElementById('tables-body');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedTables = this.getFilteredTables().slice(startIndex, endIndex);

        tbody.innerHTML = '';

        if (paginatedTables.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Không có bàn nào</td>
                </tr>
            `;
            return;
        }

        paginatedTables.forEach(table => {
            const store = this.stores.find(s => s.store_id === table.store_id);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${table.table_id}</td>
                <td>Bàn ${table.table_number}</td>
                <td>${this.getTableTypeText(table.table_type)}</td>
                <td>${table.seats} chỗ</td>
                <td>${store ? store.name : 'N/A'}</td>
                <td>
                    <span class="status-badge status-${table.status}">
                        ${this.getStatusText(table.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-admin btn-sm" onclick="tableManagement.viewTableDetail(${table.table_id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-admin btn-sm" onclick="tableManagement.editTable(${table.table_id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-admin btn-sm btn-warning" onclick="tableManagement.changeTableStatus(${table.table_id})" title="Đổi trạng thái">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn-admin btn-sm btn-danger" onclick="tableManagement.deleteTable(${table.table_id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderTablesGrid() {
        const gridContainer = document.getElementById('tables-grid');
        if (!gridContainer) return;

        const filteredTables = this.getFilteredTables();
        gridContainer.innerHTML = '';

        if (filteredTables.length === 0) {
            gridContainer.innerHTML = '<div class="no-tables">Không có bàn nào</div>';
            return;
        }

        // Group tables by store
        const tablesByStore = {};
        filteredTables.forEach(table => {
            if (!tablesByStore[table.store_id]) {
                tablesByStore[table.store_id] = [];
            }
            tablesByStore[table.store_id].push(table);
        });

        Object.keys(tablesByStore).forEach(storeId => {
            const store = this.stores.find(s => s.store_id == storeId);
            const storeSection = document.createElement('div');
            storeSection.className = 'store-section';
            
            storeSection.innerHTML = `
                <h4 class="store-title">${store ? store.name : 'Cửa hàng không xác định'}</h4>
                <div class="tables-grid-container">
                    ${tablesByStore[storeId].map(table => this.createTableCard(table)).join('')}
                </div>
            `;
            
            gridContainer.appendChild(storeSection);
        });
    }

    createTableCard(table) {
        const statusClass = `table-card-${table.status}`;
        return `
            <div class="table-card ${statusClass}" onclick="tableManagement.viewTableDetail(${table.table_id})">
                <div class="table-card-header">
                    <div class="table-number">Bàn ${table.table_number}</div>
                    <div class="table-status">${this.getStatusText(table.status)}</div>
                </div>
                <div class="table-card-body">
                    <div class="table-info">
                        <i class="fas fa-users"></i> ${table.seats} chỗ
                    </div>
                    <div class="table-info">
                        <i class="fas fa-shapes"></i> ${this.getTableTypeText(table.table_type)}
                    </div>
                </div>
                <div class="table-card-actions">
                    <button class="btn-card" onclick="event.stopPropagation(); tableManagement.changeTableStatus(${table.table_id})" title="Đổi trạng thái">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button class="btn-card" onclick="event.stopPropagation(); tableManagement.editTable(${table.table_id})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-card btn-danger" onclick="event.stopPropagation(); tableManagement.deleteTable(${table.table_id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    async viewTableDetail(tableId) {
        try {
            const response = await fetch(`/api/tables/${tableId}`);
            const data = await response.json();
            
            if (data.success) {
                const table = data.data;
                const store = this.stores.find(s => s.store_id === table.store_id);
                
                // Show table detail modal
                this.showTableDetailModal(table, store);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading table detail:', error);
            this.showNotification('Không thể tải thông tin bàn', 'error');
        }
    }

    showTableDetailModal(table, store) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Chi tiết Bàn ${table.table_number}</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="table-detail-info">
                        <div class="detail-row">
                            <span class="detail-label">ID:</span>
                            <span class="detail-value">${table.table_id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Số bàn:</span>
                            <span class="detail-value">${table.table_number}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Loại bàn:</span>
                            <span class="detail-value">${this.getTableTypeText(table.table_type)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Số chỗ ngồi:</span>
                            <span class="detail-value">${table.seats} chỗ</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Cửa hàng:</span>
                            <span class="detail-value">${store ? store.name : 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Trạng thái:</span>
                            <span class="detail-value">
                                <span class="status-badge status-${table.status}">
                                    ${this.getStatusText(table.status)}
                                </span>
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Vị trí:</span>
                            <span class="detail-value">${table.location || 'Chưa xác định'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Ghi chú:</span>
                            <span class="detail-value">${table.notes || 'Không có'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Ngày tạo:</span>
                            <span class="detail-value">${new Date(table.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Cập nhật lần cuối:</span>
                            <span class="detail-value">${new Date(table.updated_at).toLocaleString('vi-VN')}</span>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-admin" onclick="tableManagement.editTable(${table.table_id}); this.closest('.modal').remove();">
                            <i class="fas fa-edit"></i> Chỉnh sửa
                        </button>
                        <button class="btn-admin btn-warning" onclick="tableManagement.changeTableStatus(${table.table_id}); this.closest('.modal').remove();">
                            <i class="fas fa-exchange-alt"></i> Đổi trạng thái
                        </button>
                        <button class="btn-admin btn-danger" onclick="tableManagement.deleteTable(${table.table_id}); this.closest('.modal').remove();">
                                                      <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getFilteredTables() {
        return this.tables.filter(table => {
            const matchStore = this.filters.store === 'all' || table.store_id == this.filters.store;
            const matchStatus = this.filters.status === 'all' || table.status === this.filters.status;
            const matchSearch = !this.filters.search || 
                table.table_number.toString().includes(this.filters.search) ||
                this.getTableTypeText(table.table_type).toLowerCase().includes(this.filters.search.toLowerCase());
            
            return matchStore && matchStatus && matchSearch;
        });
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        document.getElementById('list-view-btn')?.classList.toggle('active', view === 'list');
        document.getElementById('grid-view-btn')?.classList.toggle('active', view === 'grid');
        
        // Show/hide appropriate containers
        document.getElementById('tables-list-view')?.style.setProperty('display', view === 'list' ? 'block' : 'none');
        document.getElementById('tables-grid-view')?.style.setProperty('display', view === 'grid' ? 'block' : 'none');
        
        this.renderTables();
    }

    filterTables() {
        this.currentPage = 1;
        this.renderTables();
        this.updatePagination();
    }

    showAddTableForm() {
        document.getElementById('table-form-title').textContent = 'Thêm Bàn Mới';
        document.getElementById('table-form').reset();
        document.getElementById('table-id').value = '';
        document.getElementById('table-form-container').style.display = 'block';
        
        // Scroll to form
        document.getElementById('table-form-container').scrollIntoView({ behavior: 'smooth' });
    }

    hideTableForm() {
        document.getElementById('table-form-container').style.display = 'none';
    }

    async editTable(tableId) {
        try {
            const response = await fetch(`/api/tables/${tableId}`);
            const data = await response.json();
            
            if (data.success) {
                const table = data.data;
                
                document.getElementById('table-form-title').textContent = 'Chỉnh Sửa Bàn';
                document.getElementById('table-id').value = table.table_id;
                document.getElementById('table-number').value = table.table_number;
                document.getElementById('table-store').value = table.store_id;
                document.getElementById('table-type').value = table.table_type;
                document.getElementById('table-seats').value = table.seats;
                document.getElementById('table-status').value = table.status;
                document.getElementById('table-location').value = table.location || '';
                document.getElementById('table-notes').value = table.notes || '';
                
                document.getElementById('table-form-container').style.display = 'block';
                document.getElementById('table-form-container').scrollIntoView({ behavior: 'smooth' });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading table for edit:', error);
            this.showNotification('Không thể tải thông tin bàn', 'error');
        }
    }

    async saveTable() {
        try {
            const formData = new FormData(document.getElementById('table-form'));
            const tableData = {
                table_number: parseInt(formData.get('table-number')),
                store_id: parseInt(formData.get('table-store')),
                table_type: formData.get('table-type'),
                seats: parseInt(formData.get('table-seats')),
                status: formData.get('table-status'),
                location: formData.get('table-location') || null,
                notes: formData.get('table-notes') || null
            };

            // Validation
            if (!tableData.table_number || !tableData.store_id || !tableData.table_type || !tableData.seats) {
                throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
            }

            const loadingId = window.loadingManager?.show();
            const tableId = document.getElementById('table-id').value;
            
            let response;
            if (tableId) {
                // Update existing table - sử dụng API có sẵn
                response = await fetch(`/api/tables/${tableId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify(tableData)
                });
            } else {
                // Create new table - cần tạo API mới hoặc sử dụng API có sẵn
                response = await fetch('/api/tables', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify(tableData)
                });
            }

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(
                    tableId ? 'Cập nhật bàn thành công' : 'Thêm bàn thành công', 
                    'success'
                );
                this.hideTableForm();
                this.loadTables();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error saving table:', error);
            this.showNotification(error.message, 'error');
        } finally {
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
        }
    }

    async deleteTable(tableId) {
        if (!confirm('Bạn có chắc chắn muốn xóa bàn này?')) {
            return;
        }

        try {
            const loadingId = window.loadingManager?.show();
            
            const response = await fetch(`/api/tables/${tableId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Xóa bàn thành công', 'success');
                this.loadTables();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error deleting table:', error);
            this.showNotification('Không thể xóa bàn', 'error');
        } finally {
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
        }
    }

    async changeTableStatus(tableId) {
        try {
            // Get current table info
            const response = await fetch(`/api/tables/${tableId}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message);
            }

            const table = data.data;
            const statusOptions = [
                { value: 'available', text: 'Trống' },
                { value: 'occupied', text: 'Đang sử dụng' },
                { value: 'reserved', text: 'Đã đặt' },
                { value: 'maintenance', text: 'Bảo trì' }
            ];

            // Show status selection modal
            this.showStatusSelectionModal(tableId, table.status, statusOptions);
        } catch (error) {
            console.error('Error getting table info:', error);
            this.showNotification('Không thể lấy thông tin bàn', 'error');
        }
    }

    showStatusSelectionModal(tableId, currentStatus, statusOptions) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Thay đổi trạng thái bàn</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Trạng thái hiện tại: <strong>${this.getStatusText(currentStatus)}</strong></p>
                    <div class="status-options">
                        ${statusOptions.map(option => `
                            <button class="status-option-btn ${option.value === currentStatus ? 'current' : ''}" 
                                    onclick="tableManagement.updateTableStatus(${tableId}, '${option.value}'); this.closest('.modal').remove();">
                                <span class="status-badge status-${option.value}">${option.text}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async updateTableStatus(tableId, newStatus) {
        try {
            const loadingId = window.loadingManager?.show();
            
            // Sử dụng API có sẵn để cập nhật trạng thái
            const response = await fetch(`/api/tables/${tableId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Đã chuyển trạng thái thành "${this.getStatusText(newStatus)}"`, 'success');
                this.loadTables();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error updating table status:', error);
            this.showNotification('Không thể thay đổi trạng thái bàn', 'error');
        } finally {
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
        }
    }

    async getAvailableTables(storeId, seats, date, time) {
        try {
            const params = new URLSearchParams({
                storeId: storeId,
                seats: seats,
                date: date,
                time: time
            });

            const response = await fetch(`/api/tables/available?${params}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error getting available tables:', error);
            return [];
        }
    }

    async checkTableAvailability(tableId, date, time) {
        try {
            const params = new URLSearchParams({
                tableId: tableId,
                date: date,
                time: time
            });

            const response = await fetch(`/api/tables/check-availability?${params}`);
            const data = await response.json();
            
            return data.success ? data.available : false;
        } catch (error) {
            console.error('Error checking table availability:', error);
            return false;
        }
    }

    async getTablesByTypeAndSeats(storeId, type, seats) {
        try {
            const params = new URLSearchParams({
                storeId: storeId,
                type: type,
                seats: seats
            });

            const response = await fetch(`/api/tables/filter?${params}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error filtering tables:', error);
            return [];
        }
    }

    updatePagination() {
        const filteredTables = this.getFilteredTables();
        this.totalPages = Math.ceil(filteredTables.length / this.itemsPerPage);
        
        const paginationContainer = document.getElementById('tables-pagination');
        if (!paginationContainer) return;

        let paginationHTML = '';
        
        if (this.totalPages > 1) {
            // Previous button
            paginationHTML += `
                <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        onclick="tableManagement.goToPage(${this.currentPage - 1})" 
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
            `;

            // Page numbers
            const startPage = Math.max(1, this.currentPage - 2);
            const endPage = Math.min(this.totalPages, this.currentPage + 2);

            if (startPage > 1) {
                paginationHTML += `<button class="pagination-btn" onclick="tableManagement.goToPage(1)">1</button>`;
                if (startPage > 2) {
                    paginationHTML += `<span class="pagination-ellipsis">...</span>`;
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="tableManagement.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }

            if (endPage < this.totalPages) {
                if (endPage < this.totalPages - 1) {
                    paginationHTML += `<span class="pagination-ellipsis">...</span>`;
                }
                paginationHTML += `<button class="pagination-btn" onclick="tableManagement.goToPage(${this.totalPages})">${this.totalPages}</button>`;
            }

            // Next button
            paginationHTML += `
                <button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                        onclick="tableManagement.goToPage(${this.currentPage + 1})" 
                        ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.renderTables();
        this.updatePagination();
    }

    getTableTypeText(type) {
        const types = {
            'round': 'Bàn tròn',
            'rectangle': 'Bàn chữ nhật',
            'large': 'Bàn lớn',
            'square': 'Bàn vuông',
            'booth': 'Bàn booth'
        };
        return types[type] || type;
    }

    getStatusText(status) {
        const statuses = {
            'available': 'Trống',
            'occupied': 'Đang sử dụng',
            'reserved': 'Đã đặt',
            'maintenance': 'Bảo trì'
        };
        return statuses[status] || status;
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show(message, type);
        } else {
            alert(message);
        }
    }

    // Statistics
    getTableStatistics() {
        const stats = {
            total: this.tables.length,
            available: this.tables.filter(t => t.status === 'available').length,
            occupied: this.tables.filter(t => t.status === 'occupied').length,
            reserved: this.tables.filter(t => t.status === 'reserved').length,
            maintenance: this.tables.filter(t => t.status === 'maintenance').length
        };

        stats.occupancyRate = stats.total > 0 ? 
            ((stats.occupied + stats.reserved) / stats.total * 100).toFixed(1) : 0;

        return stats;
    }

    updateStatisticsDisplay() {
        const stats = this.getTableStatistics();
        const statsContainer = document.getElementById('table-statistics');
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Tổng số bàn</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.available}</div>
                    <div class="stat-label">Bàn trống</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.occupied}</div>
                    <div class="stat-label">Đang sử dụng</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.reserved}</div>
                    <div class="stat-label">Đã đặt</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.occupancyRate}%</div>
                    <div class="stat-label">Tỷ lệ sử dụng</div>
                </div>
            `;
        }
    }

    // Export functionality
    exportTables() {
        const filteredTables = this.getFilteredTables();
        const csvData = this.convertToCSV(filteredTables);
        this.downloadCSV(csvData, 'tables-export.csv');
    }

    convertToCSV(tables) {
        const headers = ['ID', 'Số bàn', 'Loại bàn', 'Số chỗ', 'Cửa hàng', 'Trạng thái', 'Vị trí', 'Ghi chú', 'Ngày tạo'];
        const rows = tables.map(table => {
            const store = this.stores.find(s => s.store_id === table.store_id);
            return [
                table.table_id,
                table.table_number,
                this.getTableTypeText(table.table_type),
                table.seats,
                store ? store.name : 'N/A',
                this.getStatusText(table.status),
                table.location || '',
                table.notes || '',
                new Date(table.created_at).toLocaleDateString('vi-VN')
            ];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    downloadCSV(csvData, filename) {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Real-time updates (if using WebSocket)
    initializeRealTimeUpdates() {
        if (window.WebSocket) {
            const ws = new WebSocket('ws://localhost:3000/tables');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'TABLE_STATUS_CHANGED':
                        this.handleTableStatusChange(data.tableId, data.newStatus);
                        break;
                    case 'TABLE_ADDED':
                        this.handleTableAdded(data.table);
                        break;
                    case 'TABLE_DELETED':
                        this.handleTableDeleted(data.tableId);
                        break;
                    case 'TABLE_UPDATED':
                        this.handleTableUpdated(data.table);
                        break;
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }
    }

    handleTableStatusChange(tableId, newStatus) {
        const tableIndex = this.tables.findIndex(t => t.table_id === tableId);
        if (tableIndex !== -1) {
            this.tables[tableIndex].status = newStatus;
            this.renderTables();
            this.updateStatisticsDisplay();
            
            this.showNotification(
                `Bàn ${this.tables[tableIndex].table_number} đã chuyển sang trạng thái "${this.getStatusText(newStatus)}"`,
                'info'
            );
        }
    }

    handleTableAdded(table) {
        this.tables.push(table);
        this.renderTables();
        this.updatePagination();
        this.updateStatisticsDisplay();
        
        this.showNotification(`Đã thêm bàn ${table.table_number}`, 'success');
    }

    handleTableDeleted(tableId) {
        const tableIndex = this.tables.findIndex(t => t.table_id === tableId);
        if (tableIndex !== -1) {
            const deletedTable = this.tables[tableIndex];
            this.tables.splice(tableIndex, 1);
            this.renderTables();
            this.updatePagination();
            this.updateStatisticsDisplay();
            
            this.showNotification(`Đã xóa bàn ${deletedTable.table_number}`, 'info');
        }
    }

    handleTableUpdated(updatedTable) {
        const tableIndex = this.tables.findIndex(t => t.table_id === updatedTable.table_id);
        if (tableIndex !== -1) {
            this.tables[tableIndex] = updatedTable;
            this.renderTables();
            this.updateStatisticsDisplay();
            
            this.showNotification(`Đã cập nhật bàn ${updatedTable.table_number}`, 'info');
        }
    }

    // Search functionality
    initializeSearch() {
        const searchInput = document.getElementById('table-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filters.search = e.target.value.trim();
                this.filterTables();
            }, 300));
        }
    }

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

    // Keyboard shortcuts
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: Add new table
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showAddTableForm();
            }
            
            // Escape: Close forms/modals
            if (e.key === 'Escape') {
                this.hideTableForm();
                // Close any open modals
                document.querySelectorAll('.modal').forEach(modal => modal.remove());
            }
            
            // Ctrl/Cmd + E: Export tables
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportTables();
            }
        });
    }

    // Refresh data
    async refreshData() {
        try {
            const loadingId = window.loadingManager?.show();
            await Promise.all([
                this.loadStores(),
                this.loadTables()
            ]);
            this.showNotification('Đã làm mới dữ liệu', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showNotification('Không thể làm mới dữ liệu', 'error');
        } finally {
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
        }
    }

    // Initialize all features
    initializeAllFeatures() {
        this.initializeSearch();
        this.initializeKeyboardShortcuts();
        this.initializeRealTimeUpdates();
        
        // Add refresh button functionality
        const refreshBtn = document.getElementById('refresh-tables-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // Add export button functionality
        const exportBtn = document.getElementById('export-tables-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTables());
        }
    }
}

// Initialize table management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('tables-section')) {
        window.tableManagement = new TableManagement();
        window.tableManagement.initializeAllFeatures();
    }
});

// Add to global scope for onclick handlers
window.tableManagement = null;

