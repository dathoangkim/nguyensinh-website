# Hệ Thống Quản Lý Cửa Hàng Bánh Mì

## Tổng Quan
Dự án này là một hệ thống quản lý toàn diện cho chuỗi cửa hàng bánh mì, bao gồm cả chức năng dành cho khách hàng và quản trị viên. Hệ thống bao gồm quản lý đơn hàng, đặt bàn, hệ thống blog, quản lý người dùng với điểm thưởng, và nhiều tính năng khác.

## Cấu Trúc Cơ Sở Dữ Liệu

Hệ thống sử dụng cơ sở dữ liệu MySQL với các thành phần chính sau:

### Bảng Chính
- **Users**: Tài khoản khách hàng và nhân viên
- **Products**: Các món trong thực đơn với danh mục, tùy chọn và hình ảnh
- **Orders**: Đơn hàng của khách hàng với các mục, theo dõi trạng thái và thông tin thanh toán
- **Reservations**: Hệ thống đặt bàn với các tùy chọn đặt cọc
- **Stores**: Các địa điểm cửa hàng với bàn
- **Blog**: Hệ thống quản lý nội dung với bài viết, danh mục và bình luận

### Tính Năng Chính

#### Quản Lý Đơn Hàng
- Theo dõi toàn bộ vòng đời đơn hàng
- Lịch sử trạng thái đơn hàng
- Nhiều phương thức thanh toán
- Các mục đơn hàng với tùy chọn sản phẩm

#### Hệ Thống Đặt Bàn
- Đặt bàn với thông tin khách
- Xử lý đặt cọc
- Theo dõi dịp đặc biệt
- Quản lý bàn với theo dõi vị trí

#### Chương Trình Khách Hàng Thân Thiết
- Hệ thống điểm gắn với đơn hàng
- Theo dõi lịch sử điểm
- Phân bổ điểm dựa trên lý do

#### Hệ Thống Blog
- Bài viết theo danh mục
- Hệ thống bình luận với trả lời lồng nhau
- Theo dõi tác giả

#### Giỏ Hàng
- Các mục giỏ hàng lưu trữ
- Tùy chọn sản phẩm trong giỏ hàng

## Kiến Trúc Backend

Hệ thống tuân theo kiến trúc MVC (Model-View-Controller):

### Models
Xử lý tương tác cơ sở dữ liệu, ví dụ:
```javascript
// Ví dụ từ loyaltyPointModel.js
const addPoints = async (pointsData) => {
  const { user_id, order_id, change, reason } = pointsData;
  
  try {
    const [result] = await pool.query(
      'INSERT INTO loyalty_points (user_id, order_id, `change`, reason) VALUES (?, ?, ?, ?)',
      [user_id, order_id, change, reason]
    );
    
    return result.insertId;
  } catch (error) {
    throw error;
  }
};
```

### Controllers
Xử lý yêu cầu và trả về phản hồi:
```javascript
// Ví dụ từ blogController.js
const getPostsByCategory = async (req, res) => {
  try {
    const posts = await blogModel.getPostsByCategory(req.params.categoryId);
    
    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    console.error('Error in getPostsByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách bài viết theo danh mục',
      error: error.message
    });
  }
};
```

## API và Xác Thực

### Hệ Thống Xác Thực

Hệ thống sử dụng xác thực dựa trên token JWT (JSON Web Token) được lưu trữ trong bảng `sessions`:

```sql
CREATE TABLE `sessions` (
  `session_id` VARCHAR(128) PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  CONSTRAINT `fk_sessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;
```

#### Quy Trình Xác Thực:

1. **Đăng Nhập**: Người dùng gửi thông tin đăng nhập (email/username và mật khẩu)
2. **Tạo Token**: Hệ thống xác minh thông tin đăng nhập và tạo token JWT
3. **Lưu Trữ Phiên**: Token được lưu trong bảng `sessions` với thời gian hết hạn
4. **Trả Về Token**: Token được trả về cho client để sử dụng trong các yêu cầu tiếp theo
5. **Xác Thực Yêu Cầu**: Mỗi yêu cầu API được xác thực bằng cách kiểm tra token trong header

### Các API Chính

#### API Xác Thực
- `POST /api/auth/login` - Đăng nhập và nhận token
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/logout` - Đăng xuất (vô hiệu hóa token)
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại
- `PUT /api/auth/profile` - Cập nhật thông tin cá nhân
- `PUT /api/auth/password` - Đổi mật khẩu
- `POST /api/auth/forgot-password` - Yêu cầu đặt lại mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu với token

#### API Blog
- `GET /api/blog/posts` - Lấy danh sách bài viết
- `GET /api/blog/posts/:postId` - Lấy chi tiết bài viết
- `POST /api/blog/posts` - Tạo bài viết mới (admin)
- `PUT /api/blog/posts/:postId` - Cập nhật bài viết (admin)
- `DELETE /api/blog/posts/:postId` - Xóa bài viết (admin)
- `GET /api/blog/categories` - Lấy danh sách danh mục blog
- `GET /api/blog/categories/:categoryId/posts` - Lấy bài viết theo danh mục
- `POST /api/blog/posts/:postId/comments` - Thêm bình luận
- `GET /api/blog/posts/:postId/comments` - Lấy bình luận của bài viết
- `PUT /api/blog/comments/:commentId` - Cập nhật bình luận
- `DELETE /api/blog/comments/:commentId` - Xóa bình luận

#### API Sản Phẩm
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:productId` - Lấy chi tiết sản phẩm
- `POST /api/products` - Thêm sản phẩm mới (admin)
- `PUT /api/products/:productId` - Cập nhật sản phẩm (admin)
- `DELETE /api/products/:productId` - Xóa sản phẩm (admin)
- `GET /api/categories` - Lấy danh sách danh mục sản phẩm
- `GET /api/categories/:categoryId/products` - Lấy sản phẩm theo danh mục
- `POST /api/products/:productId/images` - Thêm hình ảnh sản phẩm (admin)
- `DELETE /api/products/images/:imageId` - Xóa hình ảnh sản phẩm (admin)
- `GET /api/products/:productId/options` - Lấy tùy chọn sản phẩm
- `POST /api/products/:productId/options` - Thêm tùy chọn sản phẩm (admin)

#### API Đơn Hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders` - Lấy danh sách đơn hàng của người dùng
- `GET /api/orders/:orderId` - Lấy chi tiết đơn hàng
- `PUT /api/orders/:orderId/status` - Cập nhật trạng thái đơn hàng (admin)
- `GET /api/orders/:orderId/history` - Lấy lịch sử trạng thái đơn hàng
- `POST /api/orders/:orderId/payment` - Cập nhật thông tin thanh toán
- `GET /api/admin/orders` - Lấy tất cả đơn hàng (admin)
- `GET /api/admin/orders/stats` - Lấy thống kê đơn hàng (admin)

#### API Đặt Bàn
- `POST /api/reservations` - Tạo đặt bàn mới
- `GET /api/reservations` - Lấy danh sách đặt bàn của người dùng
- `GET /api/reservations/:reservationId` - Lấy chi tiết đặt bàn
- `PUT /api/reservations/:reservationId` - Cập nhật thông tin đặt bàn
- `PUT /api/reservations/:reservationId/status` - Cập nhật trạng thái đặt bàn
- `DELETE /api/reservations/:reservationId` - Hủy đặt bàn
- `GET /api/stores/:storeId/tables` - Lấy danh sách bàn theo cửa hàng
- `GET /api/stores/:storeId/tables/available` - Lấy bàn còn trống theo thời gian
- `GET /api/admin/reservations` - Lấy tất cả đặt bàn (admin)
- `PUT /api/admin/reservations/:reservationId/deposit` - Cập nhật trạng thái đặt cọc (admin)

#### API Điểm Thưởng
- `GET /api/loyalty/points` - Lấy lịch sử điểm thưởng
- `GET /api/loyalty/balance` - Lấy số dư điểm thưởng
- `POST /api/admin/loyalty/points` - Thêm điểm thưởng thủ công (admin)
- `GET /api/admin/loyalty/points/stats` - Lấy thống kê điểm thưởng (admin)

#### API Giỏ Hàng
- `GET /api/cart` - Lấy giỏ hàng hiện tại
- `POST /api/cart/items` - Thêm sản phẩm vào giỏ hàng
- `PUT /api/cart/items/:itemId` - Cập nhật số lượng sản phẩm
- `DELETE /api/cart/items/:itemId` - Xóa sản phẩm khỏi giỏ hàng
- `DELETE /api/cart/clear` - Xóa toàn bộ giỏ hàng

#### API Cửa Hàng
- `GET /api/stores` - Lấy danh sách cửa hàng
- `GET /api/stores/:storeId` - Lấy thông tin chi tiết cửa hàng
- `POST /api/admin/stores` - Thêm cửa hàng mới (admin)
- `PUT /api/admin/stores/:storeId` - Cập nhật thông tin cửa hàng (admin)
- `DELETE /api/admin/stores/:storeId` - Xóa cửa hàng (admin)
- `POST /api/admin/stores/:storeId/tables` - Thêm bàn mới (admin)
- `PUT /api/admin/tables/:tableId` - Cập nhật thông tin bàn (admin)
- `DELETE /api/admin/tables/:tableId` - Xóa bàn (admin)

#### API Quản Lý Người Dùng (Admin)
- `GET /api/admin/users` - Lấy danh sách người dùng
- `GET /api/admin/users/:userId` - Lấy thông tin chi tiết người dùng
- `POST /api/admin/users` - Tạo người dùng mới
- `PUT /api/admin/users/:userId` - Cập nhật thông tin người dùng
- `DELETE /api/admin/users/:userId` - Xóa người dùng
- `PUT /api/admin/users/:userId/role` - Cập nhật vai trò người dùng
- `GET /api/admin/users/:userId/activity` - Lấy lịch sử hoạt động người dùng

#### API Báo Cáo và Thống Kê (Admin)
- `GET /api/admin/stats/revenue` - Lấy báo cáo doanh thu
- `GET /api/admin/stats/products` - Lấy thống kê sản phẩm bán chạy
- `GET /api/admin/stats/customers` - Lấy phân tích khách hàng
- `GET /api/admin/stats/orders` - Lấy thống kê đơn hàng
- `GET /api/admin/stats/reservations` - Lấy thống kê đặt bàn

## Trang Admin và Tính Năng

### Trang Quản Trị (Admin Dashboard)

#### Quản Lý Người Dùng
- Xem danh sách người dùng
- Thêm/sửa/xóa người dùng
- Phân quyền người dùng
- Xem lịch sử hoạt động
- Quản lý trạng thái tài khoản (kích hoạt/vô hiệu hóa)
- Tìm kiếm và lọc người dùng theo nhiều tiêu chí

#### Quản Lý Sản Phẩm
- Thêm/sửa/xóa sản phẩm
- Quản lý danh mục sản phẩm
- Quản lý tùy chọn sản phẩm
- Quản lý hình ảnh sản phẩm
- Cài đặt giá và khuyến mãi
- Quản lý tồn kho
- Đánh dấu sản phẩm nổi bật/mới
- Nhập/xuất danh sách sản phẩm

#### Quản Lý Đơn Hàng
- Xem tất cả đơn hàng
- Cập nhật trạng thái đơn hàng
- Xem chi tiết đơn hàng
- Xuất báo cáo đơn hàng
- Tìm kiếm đơn hàng theo nhiều tiêu chí
- Quản lý hoàn tiền và hủy đơn
- Theo dõi lịch sử thay đổi trạng thái
- In hóa đơn và phiếu giao hàng

#### Quản Lý Đặt Bàn
- Xem tất cả đặt bàn
- Xác nhận/hủy đặt bàn
- Quản lý bàn và vị trí
- Xem lịch đặt bàn theo ngày
- Quản lý đặt cọc
- Gửi thông báo nhắc nhở
- Sắp xếp bàn theo sơ đồ
- Quản lý các dịp đặc biệt

#### Quản Lý Blog
- Thêm/sửa/xóa bài viết
- Quản lý danh mục blog
- Duyệt bình luận
- Lên lịch đăng bài
- Quản lý từ khóa SEO
- Theo dõi lượt xem và tương tác
- Quản lý hình ảnh và phương tiện
- Xem thống kê bài viết phổ biến

#### Quản Lý Cửa Hàng
- Thêm/sửa/xóa cửa hàng
- Quản lý bàn theo cửa hàng
- Cài đặt giờ mở cửa
- Quản lý thông tin liên hệ
- Cài đặt khu vực phục vụ
- Quản lý nhân viên theo cửa hàng
- Theo dõi hiệu suất từng cửa hàng
- Quản lý hình ảnh cửa hàng

#### Báo Cáo và Thống Kê
- Báo cáo doanh thu (theo ngày/tuần/tháng/năm)
- Thống kê sản phẩm bán chạy
- Phân tích khách hàng
- Báo cáo điểm thưởng
- Biểu đồ so sánh hiệu suất
- Báo cáo tồn kho
- Phân tích xu hướng đặt hàng
- Báo cáo hiệu quả marketing

#### Cài Đặt Hệ Thống
- Cấu hình chung
- Quản lý phương thức thanh toán
- Cài đặt email tự động
- Quản lý thông báo
- Cấu hình điểm thưởng
- Sao lưu và khôi phục dữ liệu
- Nhật ký hệ thống
- Cài đặt bảo mật

## Trang Người Dùng và Tính Năng

### Trang Chủ
- Hiển thị sản phẩm nổi bật
- Banner quảng cáo và khuyến mãi
- Danh mục sản phẩm phổ biến
- Bài viết blog mới nhất
- Thông tin về cửa hàng
- Đánh giá từ khách hàng
- Liên kết nhanh đến đặt bàn và đặt hàng

### Trang Sản Phẩm
- Danh sách sản phẩm với bộ lọc
- Tìm kiếm sản phẩm
- Xem chi tiết sản phẩm
- Chọn tùy chọn sản phẩm (kích cỡ, topping, v.v.)
- Thêm vào giỏ hàng
- Đánh giá và xếp hạng sản phẩm
- Sản phẩm liên quan
- Chia sẻ sản phẩm lên mạng xã hội

### Trang Giỏ Hàng
- Xem sản phẩm trong giỏ hàng
- Cập nhật số lượng
- Xóa sản phẩm
- Áp dụng mã giảm giá
- Tính toán tổng tiền
- Tiến hành thanh toán
- Lưu giỏ hàng cho lần sau
- Đề xuất sản phẩm bổ sung

### Trang Thanh Toán
- Nhập thông tin giao hàng
- Chọn phương thức thanh toán
- Xem tóm tắt đơn hàng
- Sử dụng điểm thưởng
- Xác nhận đơn hàng
- Theo dõi trạng thái thanh toán
- Nhận biên lai điện tử
- Hướng dẫn sau thanh toán

### Trang Đặt Bàn
- Chọn cửa hàng
- Chọn ngày và giờ
- Chọn số lượng khách
- Chọn loại bàn
- Nhập thông tin liên hệ
- Chọn dịp đặc biệt
- Thêm ghi chú đặc biệt
- Xác nhận và đặt cọc (nếu cần)

### Trang Tài Khoản Cá Nhân
- Thông tin cá nhân
- Lịch sử đơn hàng
- Lịch sử đặt bàn
- Quản lý điểm thưởng
- Thay đổi mật khẩu
- Địa chỉ giao hàng đã lưu
- Phương thức thanh toán đã lưu
- Thông báo và tin nhắn

### Trang Blog
- Danh sách bài viết
- Lọc bài viết theo danh mục
- Đọc bài viết chi tiết
- Bình luận và phản hồi
- Chia sẻ bài viết
- Bài viết liên quan
- Tìm kiếm nội dung
- Đăng ký nhận bản tin

### Trang Điểm Thưởng
- Xem số dư điểm hiện tại
- Lịch sử giao dịch điểm
- Cách kiếm thêm điểm
- Quy đổi điểm thành ưu đãi
- Phần thưởng có sẵn
- Cấp độ thành viên
- Quy tắc chương trình
- Câu hỏi thường gặp

### Trang Cửa Hàng
- Danh sách cửa hàng
- Bản đồ vị trí
- Thông tin liên hệ
- Giờ mở cửa
- Hình ảnh cửa hàng
- Đánh giá cửa hàng
- Tiện ích có sẵn
- Liên kết nhanh đến đặt bàn

### Trang Liên Hệ
- Biểu mẫu liên hệ
- Thông tin liên hệ
- Câu hỏi thường gặp
- Hỗ trợ trực tuyến
- Phản hồi và góp ý
- Chính sách bảo mật
- Điều khoản sử dụng
- Thông tin về công ty

### Tính Năng Khác
- Đăng nhập/đăng ký
- Đăng nhập bằng mạng xã hội
- Tìm kiếm toàn trang
- Thông báo đẩy
- Ứng dụng di động (liên kết tải)
- Hỗ trợ đa ngôn ngữ
- Chế độ tối/sáng
- Tương thích với thiết bị di động

## Tính Năng Bảo Mật
- Quản lý phiên với xác thực dựa trên token JWT
- Mã hóa mật khẩu với bcrypt
- Bảo vệ chống tấn công CSRF
- Giới hạn tốc độ yêu cầu API
- Kiểm soát truy cập dựa trên vai trò
- Xác thực hai yếu tố (2FA)
- Khóa tài khoản sau nhiều lần đăng nhập thất bại
- Nhật ký hoạt động bảo mật

## Đa Ngôn Ngữ
Hệ thống hỗ trợ tiếng Việt và có thể mở rộng để hỗ trợ các ngôn ngữ khác, với:
- Giao diện người dùng đa ngôn ngữ
- Nội dung động đa ngôn ngữ
- Định dạng ngày tháng và tiền tệ theo địa phương
- Chuyển đổi ngôn ngữ dễ dàng

## Cài Đặt và Thiết Lập

1. Tạo cơ sở dữ liệu sử dụng các script SQL:
   - `banh_mi_db.sql`
   - `banhmi.sql`
   - `datban.sql`

2. Cấu hình kết nối cơ sở dữ liệu trong backend:
   ```javascript
   // Ví dụ cấu hình kết nối
   const pool = mysql.createPool({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0
   });
   ```

3. Cài đặt các phụ thuộc:
   ```bash
   npm install
   ```

4. Khởi động máy chủ backend:
   ```bash
   npm start
   ```

5. Truy cập ứng dụng thông qua giao diện frontend

## Yêu Cầu Kỹ Thuật

- Backend: Node.js, Express.js
- Cơ sở dữ liệu: MySQL
- Frontend: React.js, Redux
- Xác thực: JWT
- Xử lý hình ảnh: Multer
- Gửi email: Nodemailer
- Thanh toán: Tích hợp với các cổng thanh toán như MoMo, VNPay, v.v.
- Bản đồ: Google Maps API

## Mối Quan Hệ Cơ Sở Dữ Liệu

Cơ sở dữ liệu sử dụng các ràng buộc khóa ngoại để duy trì tính toàn vẹn dữ liệu:
- Sản phẩm có hình ảnh (CASCADE khi xóa)
- Đơn hàng có các mục (CASCADE khi xóa)
- Bài viết blog có bình luận (CASCADE khi xóa)
- Điểm thưởng gắn với người dùng (CASCADE khi xóa)
- Bàn thuộc về cửa hàng (CASCADE khi xóa)
sơ đồ thiết kế hệ thống dưới đây 

## URL= "../thietkeqt.xml" ( sơ đồ thiết kế hệ thống trang quản trị)
## URL= "../thietkeht.xml" ( sơ đồ thiết kế hệ thống trang người dùng)
Điều này đảm bảo rằng khi một bản ghi cha bị xóa, các bản ghi liên quan được xử lý một cách thích hợp.

## Kết Luận

Hệ thống quản lý cửa hàng bánh mì này cung cấp một giải pháp toàn diện cho việc vận hành chuỗi cửa hàng, từ quản lý sản phẩm, đơn hàng, đặt bàn đến chăm sóc khách hàng và tiếp thị. Với kiến trúc module hóa, hệ thống có thể dễ dàng mở rộng và tùy chỉnh theo nhu cầu kinh doanh cụ thể.