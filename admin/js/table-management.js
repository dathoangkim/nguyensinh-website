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
            const response = await fetch('/api/admin/stores');
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
            
            const response = await fetch('/api/admin/tables');
            const data = await response.json();
            
            if (data.success) {
                this.tables = data.data;
                this.renderTables();
                this.updatePagination();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading tables:', error);
            this.showNotification('Không thể tải danh sách bàn', 'error');
        } finally {
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
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
                        <button class="btn-admin btn-sm" onclick="tableManagement.editTable(${table.table_id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-admin btn-sm btn-danger" onclick="tableManagement.deleteTable(${table.table_id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-admin btn-sm btn-info" onclick="tableManagement.changeTableStatus(${table.table_id})" title="Đổi trạng thái">
                            <i class="fas fa-exchange-alt"></i>
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
            <div class="table-card ${statusClass}" onclick="tableManagement.editTable(${table.table_id})">
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
                    <button class="btn-card btn-danger" onclick="event.stopPropagation(); tableManagement.deleteTable(${table.table_id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
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
            const table = this.tables.find(t => t.table_id === tableId);
            if (!table) {
                throw new Error('Không tìm thấy bàn');
            }

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
        } catch (error) {
            console.error('Error editing table:', error);
            this.showNotification('Không thể chỉnh sửa bàn', 'error');
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

            // Check for duplicate table number in same store
            const tableId = document.getElementById('table-id').value;
            const existingTable = this.tables.find(t => 
                t.table_number === tableData.table_number && 
                t.store_id === tableData.store_id && 
                t.table_id != tableId
            );

            if (existingTable) {
                throw new Error('Số bàn này đã tồn tại trong cửa hàng');
            }

            const loadingId = window.loadingManager?.show();
            
            let response;
            if (tableId) {
                // Update existing table
                response = await fetch(`/api/admin/tables/${tableId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(tableData)
                });
            } else {
                // Create new table
                response = await fetch('/api/admin/tables', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
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
            
            const response = await fetch(`/api/admin/tables/${tableId}`, {
                method: 'DELETE'
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
        const table = this.tables.find(t => t.table_id === tableId);
        if (!table) return;

        const statusOptions = [
            { value: 'available', text: 'Trống' },
            { value: 'occupied', text: 'Đang sử dụng' },
            { value: 'reserved', text: 'Đã đặt' },
            { value: 'maintenance', text: 'Bảo trì' }
        ];

        const currentStatusIndex = statusOptions.findIndex(s => s.value === table.status);
        const nextStatusIndex = (currentStatusIndex + 1) % statusOptions.length;
        const newStatus = statusOptions[nextStatusIndex].value;

        try {
            const response = await fetch(`/api/admin/tables/${tableId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Đã chuyển trạng thái thành "${statusOptions[nextStatusIndex].text}"`, 'success');
                this.loadTables();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error changing table status:', error);
            this.showNotification('Không thể thay đổi trạng thái bàn', 'error');
        }
    }

    async updateTableNumbers(storeId) {
        if (!storeId) return;

        try {
            const response = await fetch(`/api/admin/tables/store/${storeId}/next-number`);
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('table-number').value = data.nextNumber;
            }
        } catch (error) {
            console.error('Error getting next table number:', error);
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

    // Export tables data
    exportTables() {
        const filteredTables = this.getFilteredTables();
        const csvData = this.convertToCSV(filteredTables);
        this.downloadCSV(csvData, 'tables-export.csv');
    }

    convertToCSV(tables) {
        const headers = ['ID', 'Số bàn', 'Loại bàn', 'Số chỗ', 'Cửa hàng', 'Trạng thái', 'Vị trí', 'Ghi chú'];
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
                table.notes || ''
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

    // Bulk operations
    selectAllTables() {
        const checkboxes = document.querySelectorAll('.table-checkbox');
        const selectAllCheckbox = document.getElementById('select-all-tables');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        
        this.updateBulkActions();
    }

    updateBulkActions() {
        const selectedCheckboxes = document.querySelectorAll('.table-checkbox:checked');
        const bulkActions = document.getElementById('bulk-actions');
        
        if (bulkActions) {
            bulkActions.style.display = selectedCheckboxes.length > 0 ? 'block' : 'none';
        }
    }

    async bulkUpdateStatus(newStatus) {
        const selectedCheckboxes = document.querySelectorAll('.table-checkbox:checked');
        const tableIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (tableIds.length === 0) {
            this.showNotification('Vui lòng chọn ít nhất một bàn', 'warning');
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn cập nhật trạng thái ${tableIds.length} bàn?`)) {
            return;
        }

        try {
            const loadingId = window.loadingManager?.show();
            
            const response = await fetch('/api/admin/tables/bulk-update-status', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    table_ids: tableIds,
                    status: newStatus
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Đã cập nhật trạng thái ${tableIds.length} bàn`, 'success');
                this.loadTables();
                this.clearSelection();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error bulk updating tables:', error);
            this.showNotification('Không thể cập nhật trạng thái bàn', 'error');
        } finally {
            if (window.loadingManager) {
                window.loadingManager.hide();
            }
        }
    }

    clearSelection() {
        const checkboxes = document.querySelectorAll('.table-checkbox');
        const selectAllCheckbox = document.getElementById('select-all-tables');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        this.updateBulkActions();
    }

    // Table layout management (for grid view)
    async saveTableLayout() {
        const tables = this.tables.map(table => ({
            table_id: table.table_id,
            position_x: table.position_x,
            position_y: table.position_y
        }));

        try {
            const response = await fetch('/api/admin/tables/layout', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tables })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Đã lưu bố cục bàn', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error saving table layout:', error);
            this.showNotification('Không thể lưu bố cục bàn', 'error');
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
}

// Initialize table management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('tables-section')) {
        window.tableManagement = new TableManagement();
    }
});

// Add to global scope for onclick handlers
window.tableManagement = null;
 
