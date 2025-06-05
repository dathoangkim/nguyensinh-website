# Bánh Mì - Hệ Thống Quản Lý và Bán Hàng

Hệ thống quản lý và bán hàng trực tuyến cho cửa hàng bánh mì, bao gồm backend API và frontend.

## Tổng Quan

Dự án này là một ứng dụng web đầy đủ cho phép:
- Quản lý sản phẩm, danh mục, đơn hàng
- Đăng ký và đăng nhập người dùng
- Giỏ hàng và thanh toán
- Quản lý đơn hàng và theo dõi trạng thái

## Cấu Trúc Dự Án

```
├── backend/             # API Backend (Node.js, Express, MySQL)
│   ├── config/          # Cấu hình kết nối cơ sở dữ liệu
│   ├── controllers/     # Xử lý logic nghiệp vụ
│   ├── middleware/      # Middleware xác thực và phân quyền
│   ├── models/          # Tương tác với cơ sở dữ liệu
│   ├── routes/          # Định nghĩa API routes
│   ├── banhmi.sql       # Script tạo cơ sở dữ liệu
│   ├── package.json     # Cấu hình và dependencies
│   └── server.js        # Entry point
│
└── frontend/            # Frontend (React/Vue/Angular)
    ├── public/          # Static files
    ├── src/             # Source code
    └── package.json     # Cấu hình và dependencies
```

## Công Nghệ Sử Dụng

### Backend
- Node.js và Express
- MySQL (Cơ sở dữ liệu)
- JWT (Xác thực)
- bcryptjs (Mã hóa mật khẩu)

### Frontend
- HTML, CSS, JavaScript
- Framework: React/Vue/Angular

## Cài Đặt và Chạy

### Yêu Cầu
- Node.js (v14+)
- MySQL (v8+)
- npm hoặc yarn

### Cài Đặt Backend

1. Clone repository
```
git clone <repository-url>
```

2. Cài đặt dependencies
```
cd backend
npm install
```

3. Tạo cơ sở dữ liệu
```
mysql -u root -p < banhmi.sql
```

4. Tạo file .env với nội dung
```
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=banh_mi_db

# JWT Secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
```

5. Chạy server
```
npm run dev
```

### Cài Đặt Frontend

1. Cài đặt dependencies
```
cd frontend
npm install
```

2. Chạy ứng dụng
```
npm start
```

## API Endpoints

### Xác Thực
- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập

### Sản Phẩm
- `GET /api/products` - Lấy tất cả sản phẩm
- `GET /api/products/:id` - Lấy sản phẩm theo ID
- `GET /api/products/category/:id` - Lấy sản phẩm theo danh mục
- `GET /api/products/search` - Tìm kiếm sản phẩm
- `POST /api/products` - Tạo sản phẩm mới (Admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin)

### Danh Mục
- `GET /api/categories` - Lấy tất cả danh mục
- `GET /api/categories/:id` - Lấy danh mục theo ID
- `POST /api/categories` - Tạo danh mục mới (Admin)
- `PUT /api/categories/:id` - Cập nhật danh mục (Admin)
- `DELETE /api/categories/:id` - Xóa danh mục (Admin)

### Giỏ Hàng
- `GET /api/cart` - Lấy giỏ hàng của người dùng
- `POST /api/cart/add` - Thêm sản phẩm vào giỏ hàng
- `PUT /api/cart/update/:id` - Cập nhật số lượng sản phẩm
- `DELETE /api/cart/remove/:id` - Xóa sản phẩm khỏi giỏ hàng
- `DELETE /api/cart/clear` - Xóa toàn bộ giỏ hàng

### Đơn Hàng
- `GET /api/orders` - Lấy tất cả đơn hàng của người dùng
- `GET /api/orders/:id` - Lấy đơn hàng theo ID
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id/status` - Cập nhật trạng thái đơn hàng (Admin)

### Người Dùng
- `GET /api/users/profile` - Lấy thông tin người dùng
- `PUT /api/users/profile` - Cập nhật thông tin người dùng
- `GET /api/users` - Lấy tất cả người dùng (Admin)
- `DELETE /api/users/:id` - Xóa người dùng (Admin)

## Tính Năng

### Người Dùng
- Đăng ký, đăng nhập
- Xem danh sách sản phẩm
- Tìm kiếm sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Đặt hàng và thanh toán
- Xem lịch sử đơn hàng

### Admin
- Quản lý sản phẩm (thêm, sửa, xóa)
- Quản lý danh mục
- Quản lý đơn hàng
- Quản lý người dùng

## Tác Giả

[Tên Tác Giả] - [Email]

## Giấy Phép

Dự án này được cấp phép theo giấy phép [MIT](LICENSE).