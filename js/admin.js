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
        return { success: false, data: [], message: error.message };
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
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.user_id : null;
}

// Kiểm tra xem người dùng đã đăng nhập chưa và có quyền admin không
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.role === 'admin';
}

// Hàm lấy danh sách sản phẩm
async function fetchProducts() {
    try {
        const response = await fetchData('http://localhost:5000/api/products');
        
        if (response.success) {
            return response.data;
        } else {
            console.error('Không thể lấy danh sách sản phẩm:', response);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        return [];
    }
}

// Hàm lấy danh sách danh mục
async function fetchCategories() {
    try {
        const response = await fetchData('http://localhost:5000/api/categories');
        
        if (response.success) {
            return response.data;
        } else {
            console.error('Không thể lấy danh sách danh mục:', response);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
        return [];
    }
}

// Hàm lấy danh sách đơn hàng
async function fetchOrders() {
    try {
        const token = getToken();
        
        if (!token) {
            console.error('Không có token');
            return [];
        }
        
        const response = await fetchData('http://localhost:5000/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.success) {
            return response.data;
        } else {
            console.error('Không thể lấy danh sách đơn hàng:', response);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        return [];
    }
}

// Hàm lấy danh sách người dùng
async function fetchUsers() {
    try {
        const token = getToken();
        
        if (!token) {
            console.error('Không có token');
            return [];
        }
        
        const response = await fetchData('http://localhost:5000/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.success) {
            return response.data;
        } else {
            console.error('Không thể lấy danh sách người dùng:', response);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
        return [];
    }
}

// Hàm lấy danh sách bài viết
async function fetchBlogs() {
    try {
        const response = await fetchData('http://localhost:5000/api/blogs');
        
        if (response.success) {
            return response.data;
        } else {
            console.error('Không thể lấy danh sách bài viết:', response);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài viết:', error);
        return [];
    }
}

// Hàm lấy danh sách cửa hàng
async function fetchStores() {
    try {
        const response = await fetchData('http://localhost:5000/api/stores');
        
        if (response.success) {
            return response.data;
        } else {
            console.error('Không thể lấy danh sách cửa hàng:', response);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy danh sách cửa hàng:', error);
        return [];
    }
}

// Hàm hiển thị danh sách sản phẩm
function renderProducts(products) {
    const tableBody = document.querySelector('#products-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Không có sản phẩm nào</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><a href="#" onclick="showProductDetail(${product.product_id})">${product.product_id}</a></td>
            <td>${product.name}</td>
            <td>${product.category_name || 'Không có danh mục'}</td>
            <td>${product.is_active ? 'Còn hàng' : 'Hết hàng'}</td>
            <td><img src="${product.main_image || '/img/_12A7780.jpg'}" alt="${product.name}" width="50"></td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <button class="btn-edit" onclick="editProduct(${product.product_id})">Sửa</button>
                <button class="btn-delete" onclick="deleteProduct(${product.product_id})">Xóa</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Hàm hiển thị danh sách danh mục
function renderCategories(categories) {
    const tableBody = document.querySelector('#categories-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3">Không có danh mục nào</td></tr>';
        return;
    }
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${category.category_id}</td>
            <td>${category.name}</td>
            <td>${category.slug}</td>
            <td>
                <button class="btn-edit" onclick="editCategory(${category.category_id})">Sửa</button>
                <button class="btn-delete" onclick="deleteCategory(${category.category_id})">Xóa</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Hàm hiển thị danh sách đơn hàng
function renderOrders(orders) {
    const tableBody = document.querySelector('#orders-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Không có đơn hàng nào</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        // Chuyển đổi trạng thái sang tiếng Việt
        let statusText = '';
        switch (order.status) {
            case 'pending':
                statusText = 'Chờ xác nhận';
                break;
            case 'processing':
                statusText = 'Đang xử lý';
                break;
            case 'completed':
                statusText = 'Hoàn thành';
                break;
            case 'cancelled':
                statusText = 'Đã hủy';
                break;
            default:
                statusText = order.status;
        }
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.user_id}</td>
            <td>${new Date(order.created_at).toLocaleString('vi-VN')}</td>
            <td>${statusText}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>
                <button class="btn-view" onclick="viewOrder(${order.order_id})">Xem</button>
                <button class="btn-edit" onclick="updateOrderStatus(${order.order_id})">Cập nhật</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Hàm hiển thị danh sách người dùng
function renderUsers(users) {
    const tableBody = document.querySelector('#users-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">Không có người dùng nào</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.user_id}</td>
            <td>${user.full_name}</td>
            <td>${user.username}</td>
            <td>********</td>
            <td>${user.phone || 'Không có'}</td>
            <td>${user.role}</td>
            <td>${user.email}</td>
            <td>${user.points || 0}</td>
            <td>
                <button class="btn-edit" onclick="editUser(${user.user_id})">Sửa</button>
                <button class="btn-delete" onclick="deleteUser(${user.user_id})">Xóa</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Hàm hiển thị danh sách bài viết
function renderBlogs(blogs) {
    const tableBody = document.querySelector('#blogs-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!blogs || blogs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2">Không có bài viết nào</td></tr>';
        return;
    }
    
    blogs.forEach(blog => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${blog.blog_id}</td>
            <td>${blog.title}</td>
            <td>
                <button class="btn-edit" onclick="editBlog(${blog.blog_id})">Sửa</button>
                <button class="btn-delete" onclick="deleteBlog(${blog.blog_id})">Xóa</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Hàm hiển thị danh sách cửa hàng
function renderStores(stores) {
    const tableBody = document.querySelector('#stores-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!stores || stores.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9">Không có cửa hàng nào</td></tr>';
        return;
    }
    
    stores.forEach(store => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${store.store_id}</td>
            <td>${store.name}</td>
            <td>${store.address}</td>
            <td>${store.city}</td>
            <td>${store.district}</td>
            <td>${store.phone}</td>
            <td>${store.opening_hours}</td>
            <td>${store.latitude}</td>
            <td>${store.longitude}</td>
            <td>
                <button class="btn-edit" onclick="editStore(${store.store_id})">Sửa</button>
                <button class="btn-delete" onclick="deleteStore(${store.store_id})">Xóa</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Hàm hiển thị modal thêm/sửa sản phẩm
function showProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('overlay');
    
    if (!modal || !overlay) return;
    
    // Nếu là thêm mới
    if (!productId) {
        modal.querySelector('h3').textContent = 'Thêm sản phẩm mới';
        modal.querySelector('form').reset();
        modal.querySelector('form').dataset.id = '';
    } else {
        modal.querySelector('h3').textContent = 'Cập nhật sản phẩm';
        modal.querySelector('form').dataset.id = productId;
        
        // Lấy thông tin sản phẩm và điền vào form
        fetchProductById(productId);
    }
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
}

// Hàm đóng modal
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('overlay');
    
    if (!overlay) return;
    
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    overlay.style.display = 'none';
}

// Hàm lấy thông tin sản phẩm theo ID
async function fetchProductById(productId) {
    try {
        const response = await fetchData(`http://localhost:5000/api/products/${productId}`);
        
        if (response.success) {
            const product = response.data;
            
            // Điền thông tin vào form
            const form = document.querySelector('#productModal form');
            
            form.querySelector('#product-name').value = product.name;
            form.querySelector('#product-slug').value = product.slug;
            form.querySelector('#product-description').value = product.description;
            form.querySelector('#product-price').value = product.price;
            form.querySelector('#product-cost-price').value = product.cost_price;
            form.querySelector('#product-category').value = product.category_id;
            form.querySelector('#product-stock').value = product.stock_quantity;
            form.querySelector('#product-active').checked = product.is_active;
            
            // Hiển thị ảnh hiện tại
            const imagePreview = form.querySelector('#image-preview');
            
            if (imagePreview) {
                imagePreview.innerHTML = '';
                
                if (product.images && product.images.length > 0) {
                    product.images.forEach(image => {
                        const img = document.createElement('img');
                        img.src = image.img_url;
                        img.alt = image.alt_text;
                        img.width = 100;
                        img.style.margin = '5px';
                        
                        imagePreview.appendChild(img);
                    });
                }
            }
        } else {
            console.error('Không thể lấy thông tin sản phẩm:', response);
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin sản phẩm:', error);
    }
}

// Hàm xử lý form thêm/sửa sản phẩm
async function handleProductForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const productId = form.dataset.id;
    
    const productData = {
        name: form.querySelector('#product-name').value,
        slug: form.querySelector('#product-slug').value,
        description: form.querySelector('#product-description').value,
        price: parseFloat(form.querySelector('#product-price').value),
        cost_price: parseFloat(form.querySelector('#product-cost-price').value),
        category_id: parseInt(form.querySelector('#product-category').value),
        stock_quantity: parseInt(form.querySelector('#product-stock').value),
        is_active: form.querySelector('#product-active').checked
    };
    
    // Xử lý ảnh
    const imageFiles = form.querySelector('#product-images').files;
    
    if (imageFiles.length > 0) {
        // Trong thực tế, bạn sẽ cần upload ảnh lên server và lấy URL
        // Ở đây chúng ta giả định đã có URL
        productData.images = Array.from(imageFiles).map((file, index) => ({
            img_url: URL.createObjectURL(file),
            alt_text: productData.name,
            sort_order: index
        }));
    }
    
    try {
        const token = getToken();
        
        if (!token) {
            alert('Bạn cần đăng nhập để thực hiện chức năng này');
            return;
        }
        
        let response;
        
        if (productId) {
            // Cập nhật sản phẩm
            response = await fetchData(`http://localhost:5000/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Thêm sản phẩm mới
            response = await fetchData('http://localhost:5000/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.success) {
            alert(productId ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm mới thành công');
            closeModal();
            
            // Tải lại danh sách sản phẩm
            const products = await fetchProducts();
            renderProducts(products);
        } else {
            alert(`Lỗi: ${response.message}`);
        }
    } catch (error) {
        console.error('Lỗi khi xử lý form sản phẩm:', error);
        alert('Đã xảy ra lỗi khi xử lý form sản phẩm');
    }
}

// Hàm xóa sản phẩm
async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        return;
    }
    
    try {
        const token = getToken();
        
        if (!token) {
            alert('Bạn cần đăng nhập để thực hiện chức năng này');
            return;
        }
        
        const response = await fetchData(`http://localhost:5000/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.success) {
            alert('Xóa sản phẩm thành công');
            
            // Tải lại danh sách sản phẩm
            const products = await fetchProducts();
            renderProducts(products);
        } else {
            alert(`Lỗi: ${response.message}`);
        }
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Đã xảy ra lỗi khi xóa sản phẩm');
    }
}

// Hàm khởi tạo trang
async function initPage() {
    try {
        // Kiểm tra quyền admin
        if (!isAdmin()) {
            alert('Bạn không có quyền truy cập trang này');
            window.location.href = '/index.html';
            return;
        }
        
        // Lấy dữ liệu và hiển thị
        const products = await fetchProducts();
        renderProducts(products);
        
        const categories = await fetchCategories();
        renderCategories(categories);
        
        const orders = await fetchOrders();
        renderOrders(orders);
        
        const users = await fetchUsers();
        renderUsers(users);
        
        const blogs = await fetchBlogs();
        renderBlogs(blogs);
        
        const stores = await fetchStores();
        renderStores(stores);
        
        // Gắn sự kiện cho các nút thêm mới
        document.querySelectorAll('.btn-add').forEach(button => {
            button.addEventListener('click', function() {
                const type = this.dataset.type;
                
                switch (type) {
                    case 'product':
                        showProductModal();
                        break;
                    case 'category':
                        showCategoryModal();
                        break;
                    case 'blog':
                        showBlogModal();
                        break;
                    case 'store':
                        showStoreModal();
                        break;
                    case 'user':
                        showUserModal();
                        break;
                }
            });
        });
        
        // Gắn sự kiện cho form sản phẩm
        const productForm = document.querySelector('#productModal form');
        
        if (productForm) {
            productForm.addEventListener('submit', handleProductForm);
        }
        
        // Gắn sự kiện cho nút đóng modal
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', closeModal);
        });
    } catch (error) {
        console.error('Lỗi khi khởi tạo trang:', error);
    }
}

// Khởi chạy khi trang đã tải xong
document.addEventListener('DOMContentLoaded', initPage);