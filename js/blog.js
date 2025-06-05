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

// Hàm định dạng ngày tháng
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('vi-VN', options).format(date);
}

// Hàm tải tất cả bài viết blog
async function loadAllPosts() {
    try {
        const blogGrid = document.querySelector('.blog-grid');
        const featuredPostContainer = document.querySelector('.featured-post');
        
        if (!blogGrid || !featuredPostContainer) {
            console.error('Không tìm thấy container cho blog');
            return;
        }
        
        // Hiển thị loading
        blogGrid.innerHTML = '<div class="loading">Đang tải bài viết...</div>';
        
        // Lấy dữ liệu từ API
        const response = await fetchData('http://localhost:5000/api/blogs');
        
        if (!response.success || !response.data || !Array.isArray(response.data)) {
            throw new Error('Không thể lấy dữ liệu bài viết');
        }
        
        const posts = response.data;
        
        if (posts.length === 0) {
            blogGrid.innerHTML = '<div class="no-posts">Không có bài viết nào</div>';
            return;
        }
        
        // Tìm bài viết nổi bật (bài viết đầu tiên hoặc có trạng thái featured)
        const featuredPost = posts.find(post => post.is_featured) || posts[0];
        
        // Hiển thị bài viết nổi bật
        featuredPostContainer.innerHTML = `
            <div class="featured-post-image">
                <img src="${featuredPost.img_url || '../img/_12A7780.jpg'}" alt="${featuredPost.title}" 
                    onerror="this.onerror=null; this.src='../img/_12A7780.jpg';">
            </div>
            <div class="featured-post-content">
                <span class="post-category">${featuredPost.category_name || 'Tin tức'}</span>
                <h3 class="featured-post-title">${featuredPost.title}</h3>
                <p class="featured-post-excerpt">${featuredPost.content.substring(0, 200)}...</p>
                <div class="post-meta">
                    <span class="post-date">${formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                    <a href="${featuredPost.post_url || `blog-detail.html?id=${featuredPost.post_id}`}" 
                       class="read-more" 
                       target="${featuredPost.post_url ? '_blank' : '_self'}">
                        Đọc tiếp <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
        
        // Lọc bỏ bài viết nổi bật khỏi danh sách
        const regularPosts = posts.filter(post => post.post_id !== featuredPost.post_id);
        
        // Hiển thị các bài viết còn lại
        let postsHTML = '';
        
        regularPosts.forEach(post => {
            postsHTML += `
                <div class="blog-post" data-category="${post.category_id || 'all'}">
                    <div class="post-image">
                        <img src="${post.img_url || '../img/_12A7780.jpg'}" alt="${post.title}" 
                            onerror="this.onerror=null; this.src='../img/_12A7780.jpg';">
                    </div>
                    <div class="post-content">
                        <span class="post-category">${post.category_name || 'Tin tức'}</span>
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-excerpt">${post.content.substring(0, 100)}...</p>
                        <div class="post-meta">
                            <span class="post-date">${formatDate(post.published_at || post.created_at)}</span>
                            <a href="${post.post_url || `blog-detail.html?id=${post.post_id}`}" 
                               class="read-more" 
                               target="${post.post_url ? '_blank' : '_self'}">
                                Đọc tiếp <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
        
        blogGrid.innerHTML = postsHTML;
        
    } catch (error) {
        console.error('Lỗi khi tải bài viết blog:', error);
        const blogGrid = document.querySelector('.blog-grid');
        if (blogGrid) {
            blogGrid.innerHTML = `<div class="error">Có lỗi xảy ra khi tải bài viết: ${error.message}</div>`;
        }
    }
}

// Hàm tải danh mục blog
async function loadCategories() {
    try {
        const categoriesContainer = document.querySelector('.blog-categories');
        
        if (!categoriesContainer) {
            console.error('Không tìm thấy container cho danh mục');
            return;
        }
        
        // Lấy dữ liệu từ API
        const response = await fetchData('http://localhost:5000/api/blogs/categories/all');
        
        // Nếu API không hoạt động, sử dụng dữ liệu mẫu
        if (!response.success || !response.data || !Array.isArray(response.data)) {
            console.warn('API danh mục không hoạt động, sử dụng dữ liệu mẫu');
            
            // Dữ liệu mẫu
            const sampleCategories = [
                { category_id: 1, name: 'Tin tức cửa hàng' },
                { category_id: 2, name: 'Công thức bánh mì' },
                { category_id: 3, name: 'Sự kiện' },
                { category_id: 4, name: 'Khuyến mãi' }
            ];
            
            // Tạo HTML cho danh mục
            let categoriesHTML = '<button class="category-btn active" data-category="all">Tất Cả</button>';
            
            sampleCategories.forEach(category => {
                categoriesHTML += `
                    <button class="category-btn" data-category="${category.category_id}">${category.name}</button>
                `;
            });
            
            categoriesContainer.innerHTML = categoriesHTML;
            
            // Gắn sự kiện cho các nút danh mục
            attachCategoryEvents();
            
            return;
        }
        
        const categories = response.data;
        
        // Tạo HTML cho danh mục
        let categoriesHTML = '<button class="category-btn active" data-category="all">Tất Cả</button>';
        
        categories.forEach(category => {
            categoriesHTML += `
                <button class="category-btn" data-category="${category.category_id}">${category.name}</button>
            `;
        });
        
        categoriesContainer.innerHTML = categoriesHTML;
        
        // Gắn sự kiện cho các nút danh mục
        attachCategoryEvents();
        
    } catch (error) {
        console.error('Lỗi khi tải danh mục blog:', error);
        const categoriesContainer = document.querySelector('.blog-categories');
        if (categoriesContainer) {
            // Sử dụng dữ liệu mẫu khi có lỗi
            const sampleCategories = [
                { category_id: 1, name: 'Tin tức cửa hàng' },
                { category_id: 2, name: 'Công thức bánh mì' },
                { category_id: 3, name: 'Sự kiện' },
                { category_id: 4, name: 'Khuyến mãi' }
            ];
            
            let categoriesHTML = '<button class="category-btn active" data-category="all">Tất Cả</button>';
            
            sampleCategories.forEach(category => {
                categoriesHTML += `
                    <button class="category-btn" data-category="${category.category_id}">${category.name}</button>
                `;
            });
            
            categoriesContainer.innerHTML = categoriesHTML;
            
            // Gắn sự kiện cho các nút danh mục
            attachCategoryEvents();
        }
    }
}

// Hàm tải bài viết theo danh mục
async function loadPostsByCategory(categoryId) {
    try {
        const blogGrid = document.querySelector('.blog-grid');
        
        if (!blogGrid) {
            console.error('Không tìm thấy container cho blog');
            return;
        }
        
        // Hiển thị loading
        blogGrid.innerHTML = '<div class="loading">Đang tải bài viết...</div>';
        
        // Nếu là "Tất cả", tải tất cả bài viết
        if (categoryId === 'all') {
            await loadAllPosts();
            return;
        }
        
        // Lấy dữ liệu từ API
        const response = await fetchData(`http://localhost:5000/api/blogs/category/${categoryId}`);
        
        // Nếu API không hoạt động, hiển thị thông báo
        if (!response.success || !response.data || !Array.isArray(response.data)) {
            blogGrid.innerHTML = '<div class="error">Không thể lấy dữ liệu bài viết theo danh mục. API có thể chưa được triển khai.</div>';
            return;
        }
        
        const posts = response.data;
        
        if (posts.length === 0) {
            blogGrid.innerHTML = '<div class="no-posts">Không có bài viết nào trong danh mục này</div>';
            return;
        }
        
        // Hiển thị các bài viết
        let postsHTML = '';
        
        posts.forEach(post => {
            postsHTML += `
                <div class="blog-post" data-category="${post.category_id}">
                    <div class="post-image">
                        <img src="${post.img_url || '../img/_12A7780.jpg'}" alt="${post.title}" 
                            onerror="this.onerror=null; this.src='../img/_12A7780.jpg';">
                    </div>
                    <div class="post-content">
                        <span class="post-category">${post.category_name || 'Tin tức'}</span>
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-excerpt">${post.content.substring(0, 100)}...</p>
                        <div class="post-meta">
                            <span class="post-date">${formatDate(post.published_at || post.created_at)}</span>
                            <a href="${post.post_url || `blog-detail.html?id=${post.post_id}`}" 
                               class="read-more" 
                               target="${post.post_url ? '_blank' : '_self'}">
                                Đọc tiếp <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
        
        blogGrid.innerHTML = postsHTML;
        
    } catch (error) {
        console.error('Lỗi khi tải bài viết theo danh mục:', error);
        const blogGrid = document.querySelector('.blog-grid');
        if (blogGrid) {
            blogGrid.innerHTML = `<div class="error">Có lỗi xảy ra khi tải bài viết: ${error.message}</div>`;
        }
    }
}

// Hàm tìm kiếm bài viết
async function searchPosts(keyword) {
    try {
        const blogGrid = document.querySelector('.blog-grid');
        
        if (!blogGrid) {
            console.error('Không tìm thấy container cho blog');
            return;
        }
        
        // Hiển thị loading
        blogGrid.innerHTML = '<div class="loading">Đang tìm kiếm bài viết...</div>';
        
        // Nếu không có từ khóa, tải tất cả bài viết
        if (!keyword || keyword.trim() === '') {
            await loadAllPosts();
            return;
        }
        
        // Lấy dữ liệu từ API
        const response = await fetchData(`http://localhost:5000/api/blog/search/${encodeURIComponent(keyword)}`);
        
        // Nếu API không hoạt động, hiển thị thông báo
        if (!response.success || !response.data || !Array.isArray(response.data)) {
            blogGrid.innerHTML = '<div class="error">Không thể tìm kiếm bài viết. API có thể chưa được triển khai.</div>';
            return;
        }
        
        const posts = response.data;
        
        if (posts.length === 0) {
            blogGrid.innerHTML = `<div class="no-posts">Không tìm thấy bài viết nào với từ khóa "${keyword}"</div>`;
            return;
        }
        
        // Hiển thị các bài viết
        let postsHTML = '';
        
        posts.forEach(post => {
            postsHTML += `
                <div class="blog-post" data-category="${post.category_id}">
                    <div class="post-image">
                        <img src="${post.img_url || '../img/_12A7780.jpg'}" alt="${post.title}" 
                            onerror="this.onerror=null; this.src='../img/_12A7780.jpg';">
                    </div>
                    <div class="post-content">
                                             <span class="post-category">${post.category_name || 'Tin tức'}</span>
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-excerpt">${post.content.substring(0, 100)}...</p>
                        <div class="post-meta">
                            <span class="post-date">${formatDate(post.published_at || post.created_at)}</span>
                            <a href="${post.post_url || `blog-detail.html?id=${post.post_id}`}" 
                               class="read-more" 
                               target="${post.post_url ? '_blank' : '_self'}">
                                Đọc tiếp <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
        
        blogGrid.innerHTML = postsHTML;
        
    } catch (error) {
        console.error('Lỗi khi tìm kiếm bài viết:', error);
        const blogGrid = document.querySelector('.blog-grid');
        if (blogGrid) {
            blogGrid.innerHTML = `<div class="error">Có lỗi xảy ra khi tìm kiếm bài viết: ${error.message}</div>`;
        }
    }
}

// Hàm gắn sự kiện cho các nút danh mục
function attachCategoryEvents() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Xóa active class từ tất cả các nút
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Thêm active class cho nút được click
            this.classList.add('active');
            
            // Lấy ID danh mục
            const categoryId = this.dataset.category;
            
            // Tải bài viết theo danh mục
            loadPostsByCategory(categoryId);
            
            // Cuộn lên đầu phần blog
            window.scrollTo({
                top: document.querySelector('.blog-section').offsetTop - 100,
                behavior: 'smooth'
            });
        });
    });
}

// Hàm gắn sự kiện cho form tìm kiếm
function attachSearchEvent() {
    const searchForm = document.querySelector('.blog-search-form');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const searchInput = this.querySelector('input[type="search"]');
            const keyword = searchInput.value.trim();
            
            if (keyword) {
                // Tìm kiếm bài viết
                searchPosts(keyword);
                
                // Bỏ active class từ tất cả các nút danh mục
                document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            }
        });
    }
}

// Hàm gắn sự kiện cho các nút phân trang
function attachPaginationEvents() {
    const paginationButtons = document.querySelectorAll('.pagination-btn');
    
    paginationButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Xóa active class từ tất cả các nút
            paginationButtons.forEach(btn => btn.classList.remove('active'));
            
            // Thêm active class cho nút được click
            this.classList.add('active');
            
            // Cuộn lên đầu phần blog
            window.scrollTo({
                top: document.querySelector('.blog-section').offsetTop - 100,
                behavior: 'smooth'
            });
            
            // Trong thực tế, bạn sẽ tải trang mới ở đây
            // Ví dụ: loadPage(this.textContent);
        });
    });
}

// Hàm tải dữ liệu mẫu khi API không hoạt động
function loadSampleData() {
    const blogGrid = document.querySelector('.blog-grid');
    const featuredPostContainer = document.querySelector('.featured-post');
    
    if (!blogGrid || !featuredPostContainer) {
        console.error('Không tìm thấy container cho blog');
        return;
    }
    
    // Dữ liệu mẫu cho bài viết nổi bật
    const featuredPost = {
        title: "Hiệu bánh mì trường tồn suốt 80 năm ở Thủ đô",
        category_name: "Tin tức cửa hàng",
        content: "Nguyên Sinh là hiệu bánh mì truyền thống đã tồn tại hơn 80 năm tại Hà Nội. Với công thức gia truyền từ năm 1942, bánh mì Nguyên Sinh đã trở thành một phần không thể thiếu trong ẩm thực Hà Nội. Mỗi ổ bánh mì được làm thủ công, giòn rụm bên ngoài và mềm xốp bên trong, kết hợp với các loại nhân truyền thống tạo nên hương vị đặc trưng không thể lẫn vào đâu được.",
        img_url: "../img/blog1.jpg",
        published_at: "2023-05-15",
        post_url: "https://vietnamnet.vn/hieu-banh-mi-truong-ton-suot-80-nam-o-thu-do-gia-len-toi-120-nghin-dong-1-cai-2014970.html"
    };
    
    // Hiển thị bài viết nổi bật
    featuredPostContainer.innerHTML = `
        <div class="featured-post-image">
            <img src="${featuredPost.img_url || '../img/_12A7780.jpg'}" alt="${featuredPost.title}" 
                onerror="this.onerror=null; this.src='../img/_12A7780.jpg';">
        </div>
        <div class="featured-post-content">
            <span class="post-category">${featuredPost.category_name || 'Tin tức'}</span>
            <h3 class="featured-post-title">${featuredPost.title}</h3>
            <p class="featured-post-excerpt">${featuredPost.content.substring(0, 200)}...</p>
            <div class="post-meta">
                <span class="post-date">${formatDate(featuredPost.published_at)}</span>
                <a href="${featuredPost.post_url || '#'}" 
                   class="read-more" 
                   target="${featuredPost.post_url ? '_blank' : '_self'}">
                    Đọc tiếp <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
    
    // Dữ liệu mẫu cho danh sách bài viết
    const samplePosts = [
        {
            title: "Công thức làm bánh mì Việt Nam truyền thống",
            category_name: "Công thức bánh mì",
            content: "Bánh mì Việt Nam nổi tiếng thế giới với vỏ bánh giòn tan và ruột bánh mềm xốp. Trong bài viết này, chúng tôi sẽ chia sẻ công thức làm bánh mì truyền thống của Nguyên Sinh, giúp bạn có thể tự làm bánh mì ngon như ngoài tiệm tại nhà.",
            img_url: "../img/blog2.jpg",
            published_at: "2023-04-20"
        },
        {
            title: "Khai trương chi nhánh mới tại Quận 7",
            category_name: "Sự kiện",
            content: "Nguyên Sinh vui mừng thông báo khai trương chi nhánh mới tại Quận 7, TP.HCM. Đây là chi nhánh thứ 5 của chúng tôi tại TP.HCM, đánh dấu bước phát triển mới trong hành trình mang hương vị bánh mì truyền thống đến với nhiều khách hàng hơn.",
            img_url: "../img/blog3.jpg",
            published_at: "2023-03-10",
            post_url: "https://example.com/khai-truong-chi-nhanh-quan-7"
        },
        {
            title: "Khuyến mãi đặc biệt nhân dịp 30/4 - 1/5",
            category_name: "Khuyến mãi",
            content: "Nhân dịp lễ 30/4 - 1/5, Nguyên Sinh triển khai chương trình khuyến mãi đặc biệt: Mua 2 tặng 1 cho tất cả các loại bánh mì, giảm 20% cho các combo bánh mì và nước uống. Chương trình áp dụng từ ngày 29/4 đến hết ngày 2/5.",
            img_url: "../img/blog4.jpg",
            published_at: "2023-04-25"
        },
        {
            title: "Bánh mì Nguyên Sinh - Từ quán nhỏ đến thương hiệu lớn",
            category_name: "Tin tức cửa hàng",
            content: "Từ một quán bánh mì nhỏ được thành lập vào năm 1942, Nguyên Sinh đã phát triển thành một thương hiệu bánh mì uy tín với nhiều chi nhánh trên toàn quốc. Câu chuyện về hành trình phát triển của Nguyên Sinh là minh chứng cho sự kiên trì và đam mê với ẩm thực truyền thống.",
            img_url: "../img/blog5.jpg",
            published_at: "2023-02-15"
        },
        {
            title: "5 loại bánh mì đặc trưng của Nguyên Sinh bạn nên thử",
            category_name: "Tin tức cửa hàng",
            content: "Nguyên Sinh nổi tiếng với nhiều loại bánh mì đặc trưng. Trong bài viết này, chúng tôi giới thiệu 5 loại bánh mì best-seller mà bạn nhất định phải thử khi đến với Nguyên Sinh: Bánh mì thịt, bánh mì pate, bánh mì gà, bánh mì chả cá, và bánh mì đặc biệt.",
            img_url: "../img/blog6.jpg",
            published_at: "2023-01-30"
        }
    ];
    
    // Hiển thị danh sách bài viết
    let postsHTML = '';
    
    samplePosts.forEach(post => {
        postsHTML += `
            <div class="blog-post" data-category="sample">
                <div class="post-image">
                    <img src="${post.img_url || '../img/_12A7780.jpg'}" alt="${post.title}" 
                        onerror="this.onerror=null; this.src='../img/_12A7780.jpg';">
                </div>
                <div class="post-content">
                    <span class="post-category">${post.category_name || 'Tin tức'}</span>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-excerpt">${post.content.substring(0, 100)}...</p>
                    <div class="post-meta">
                        <span class="post-date">${formatDate(post.published_at)}</span>
                        <a href="${post.post_url || '#'}" 
                           class="read-more" 
                           target="${post.post_url ? '_blank' : '_self'}">
                            Đọc tiếp <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
    
    blogGrid.innerHTML = postsHTML;
}

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Tải danh mục
        await loadCategories();
        
        // Thử tải tất cả bài viết từ API
        const response = await fetchData('http://localhost:5000/api/blogs');
        
        if (response.success && response.data && Array.isArray(response.data)) {
            // Nếu API hoạt động, tải bài viết từ API
            await loadAllPosts();
        } else {
            // Nếu API không hoạt động, tải dữ liệu mẫu
            console.warn('API bài viết không hoạt động, sử dụng dữ liệu mẫu');
            loadSampleData();
        }
        
        // Gắn sự kiện cho form tìm kiếm
        attachSearchEvent();
        
        // Gắn sự kiện cho các nút phân trang
        attachPaginationEvents();
    } catch (error) {
        console.error('Lỗi khi khởi tạo trang blog:', error);
        // Tải dữ liệu mẫu nếu có lỗi
        loadSampleData();
    }
    
    // Thêm CSS cho loading và thông báo lỗi
    const style = document.createElement('style');
    style.textContent = `
        .loading {
            text-align: center;
            padding: 40px;
            font-style: italic;
            color: #666;
        }
        
        .error {
            text-align: center;
            padding: 40px;
            color: #e74c3c;
            font-weight: bold;
        }
        
        .no-posts {
            text-align: center;
            padding: 40px;
            color: #666;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
});
