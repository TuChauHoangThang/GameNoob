# BÁO CÁO TÓM TẮT ĐỒ ÁN

## GameNoob – Nền Tảng Mua Bán Game Trực Tuyến

---

### 1. TỔNG QUAN DỰ ÁN

**GameNoob** là một ứng dụng web thương mại điện tử chuyên về mua bán game kỹ thuật số, được xây dựng theo mô hình full-stack. Nền tảng này lấy cảm hứng từ Steam – cho phép người dùng duyệt, tìm kiếm, mua game, quản lý thư viện cá nhân và tương tác với cộng đồng game thủ.

**Mục tiêu:** Xây dựng một hệ thống thương mại điện tử hoàn chỉnh, bao gồm xác thực người dùng, giỏ hàng, thanh toán trực tuyến tích hợp cổng VNPay, quản lý thư viện game và mạng xã hội cộng đồng.

---

### 2. CHỨC NĂNG CHÍNH

| STT | Chức năng | Mô tả |
|-----|-----------|-------|
| 1 | Xác thực người dùng | Đăng ký, đăng nhập, JWT Token, phân quyền User/Admin |
| 2 | Duyệt & Tìm kiếm Game | Danh sách game, lọc theo thể loại, tìm kiếm theo tên, phân trang |
| 3 | Giỏ hàng | Thêm/xóa game, kiểm tra trùng lặp và đã sở hữu |
| 4 | Thanh toán | Thẻ ngân hàng (Visa/Mastercard/Napas), VNPay Sandbox (tích hợp thật), MoMo/ZaloPay (demo) |
| 5 | Thư viện game | Quản lý game đã mua, trạng thái cài đặt, yêu thích |
| 6 | Danh sách ước | Wishlist cá nhân, thêm/xóa, sắp xếp theo giá/tên/ngày |
| 7 | Đánh giá game | Rating sao (1–5), tích cực/tiêu cực, chỉ user đã mua mới được đánh giá |
| 8 | Cộng đồng | Đăng bài kèm ảnh/video, like, bình luận, sửa/xóa bài viết |
| 9 | Hồ sơ người dùng | Xem thông tin tài khoản, đổi mật khẩu |
| 10 | Admin Dashboard | Thống kê doanh thu, quản lý user/game, top game bán chạy |

---

### 3. KỸ THUẬT SỬ DỤNG

#### 3.1 Frontend – React 19 + Vite 8

**Kiến trúc SPA (Single Page Application):**
- Toàn bộ giao diện được render phía client, không reload trang giữa các màn hình
- Vite được dùng làm build tool với HMR (Hot Module Replacement) cho tốc độ phát triển nhanh

**React Router DOM v7:**
- Client-side routing với `<Routes>` và `<Route>`
- `ProtectedRoute` – wrapper kiểm tra JWT trước khi vào trang yêu cầu đăng nhập (cart, checkout, wishlist, library, profile)
- `AdminRoute` – kiểm tra thêm flag `is_admin` trong JWT, redirect về trang chủ nếu không đủ quyền

**State Management – Context API:**
- `AuthContext` – lưu thông tin user, token, trạng thái loading; đồng bộ với `localStorage`
- `CartContext` – quản lý giỏ hàng real-time, đồng thời lưu danh sách `ownedGameIds` (game đã mua) để ngăn thêm lại vào giỏ
- `WishlistContext` – lưu Set các `game_id` trong wishlist, re-fetch tự động khi auth state thay đổi

**Giao tiếp API – Axios:**
- Tất cả request gắn JWT qua header `Authorization: Bearer <token>`
- Xử lý response code 409 (đã tồn tại), 401 (hết hạn token), 403 (không đủ quyền)

**Giao diện – CSS thuần (Steam-style):**
- CSS Variables toàn cục cho màu sắc, spacing, transition thống nhất
- Flexbox và Grid cho layout responsive
- Không dùng CSS framework (Bootstrap, Tailwind) để kiểm soát hoàn toàn giao diện

---

#### 3.2 Backend – Node.js + Express.js v5

**RESTful API Architecture:**
- Tổ chức theo mô hình MVC: `routes` → `controllers` → `models`
- Mỗi tài nguyên có route file riêng: `gameRoutes`, `authRoutes`, `cartRoutes`, `checkoutRoutes`, `wishlistRoutes`, `ratingRoutes`, `postRoutes`, `adminRoutes`

**Xác thực & Phân quyền:**
- `jsonwebtoken (JWT)` – tạo token có thời hạn 1 ngày khi đăng nhập thành công
- Payload JWT chứa: `id`, `username`, `email`, `is_admin`
- `authMiddleware` – xác minh chữ ký JWT trên mỗi request cần bảo vệ, gán `req.userId`
- `adminController.requireAdmin` – middleware kiểm tra `is_admin = true` trong database

**Mã hóa mật khẩu:**
- `bcryptjs` với salt rounds = 10
- Mật khẩu không bao giờ được lưu dạng plaintext

**Upload file:**
- `Multer` với `diskStorage` – lưu file vào thư mục `uploads/`
- Kiểm tra MIME type: cho phép `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `video/mp4`, `video/webm`, `video/quicktime`
- Giới hạn kích thước: 100MB
- Tên file được hash với timestamp + random string để tránh trùng lặp

**Database Transaction:**
- Các thao tác thanh toán dùng `BEGIN / COMMIT / ROLLBACK` để đảm bảo tính toàn vẹn dữ liệu
- Nếu bất kỳ bước nào thất bại (tạo order, thêm items, cập nhật library, xóa cart) → toàn bộ transaction bị hủy

---

#### 3.3 Database – PostgreSQL

**Schema chính:**

```
users           – id, username, email, password (hashed), is_admin, created_at
games           – id, steam_appid, name, description, header_image, price_vnd,
                  is_free, genres (jsonb), screenshots (jsonb), rating, 
                  positive_ratings, negative_ratings, ...
carts           – id, user_id, game_id, quantity
orders          – id, user_id, total_amount, payment_method, card_last_four, status
order_items     – id, order_id, game_id, price_at_purchase
user_library    – id, user_id, game_id, order_id, acquired_at
                  UNIQUE(user_id, game_id) – không cho sở hữu game trùng
wishlists       – id, user_id, game_id, added_at
                  UNIQUE(user_id, game_id)
user_ratings    – id, user_id, game_id, is_positive, stars (1-5), comment
                  UNIQUE(user_id, game_id) – mỗi user chỉ đánh giá 1 lần/game
community_posts – id, user_id, content, image_url, media_type, created_at
post_likes      – id, user_id, post_id  UNIQUE(user_id, post_id)
post_comments   – id, user_id, post_id, content
vnpay_pending_orders – id, txn_ref, user_id, amount, cart_snapshot (jsonb), status
payment_cards   – id, user_id, card_type, last_four, holder_name, expiry_*
```

**Kỹ thuật truy vấn:**
- `ON CONFLICT DO NOTHING` – tránh thêm trùng vào wishlist, cart, library
- `JOIN` nhiều bảng để lấy thông tin đầy đủ trong 1 query (giảm N+1 problem)
- `GROUP BY` + `COUNT` + `AVG` – tính thống kê rating và số lượng bán
- `JSONB` columns cho `genres`, `screenshots`, `platforms` – lưu dữ liệu linh hoạt từ Steam API
- `ADD COLUMN IF NOT EXISTS` – migrate schema tự động khi server khởi động

---

#### 3.4 Tích hợp VNPay Sandbox

**Luồng thanh toán hoàn chỉnh:**

```
1. User click "Tiếp tục với VNPay"
         ↓
2. POST /api/checkout/vnpay/create
   - Lấy giỏ hàng, kiểm tra ownership
   - Lưu cart_snapshot vào bảng vnpay_pending_orders (status: 'pending')
   - Tạo chuỗi ký: sort params theo alphabet → join thành query string
   - Ký HMAC-SHA512 với VNPAY_HASH_SECRET
   - Trả về paymentUrl
         ↓
3. Frontend redirect → sandbox.vnpayment.vn
   - User nhập thẻ NCB test
   - VNPay xử lý thanh toán
         ↓
4. GET /api/checkout/vnpay/return  (browser redirect)
   - Verify chữ ký HMAC-SHA512
   - Nếu vnp_ResponseCode = '00': fulfill order
     (tạo order, thêm game vào library, xóa cart)
   - Redirect frontend → /checkout/result?status=success
         ↓
5. GET /api/checkout/vnpay/ipn  (server-to-server, song song)
   - VNPay gọi để xác nhận chính thức
   - Trả về { RspCode: '00', Message: 'Confirm Success' }
```

**Bảo mật chữ ký:**
- Mọi tham số được sort theo alphabet trước khi ký
- Dùng `crypto.createHmac('sha512', secret)` của Node.js built-in
- Cả 2 chiều (tạo URL và verify callback) đều ký/verify bằng cùng thuật toán

---

#### 3.5 Cộng đồng – Real-time Like & Comment

- Optimistic UI cho like: cập nhật số like ngay lập tức trước khi API trả về, rollback nếu lỗi
- Lazy load comments: chỉ fetch khi user click "Bình luận", không load sẵn
- Inline editing: sửa comment trực tiếp trong UI không cần modal
- Pagination: load thêm bài viết theo offset (10 bài/lần)

---

#### 3.6 Hệ thống Rating Game

- Điều kiện đánh giá: user phải có game trong `user_library` → kiểm tra qua `libraryModel.isGameOwned()`
- Constraint `UNIQUE(user_id, game_id)` ở database level đảm bảo mỗi user chỉ đánh giá 1 lần
- Thống kê real-time: `AVG(stars)`, `COUNT(*)`, tỷ lệ tích cực/tiêu cực được tính qua SQL aggregate
- Hiển thị trên sidebar của GameDetailPage: cập nhật khi có rating mới

---

### 4. KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│         React SPA – localhost:5173                   │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP / REST API
┌─────────────────────▼───────────────────────────────┐
│                  BACKEND SERVER                      │
│         Node.js + Express – localhost:5000           │
│  Routes: /api/games, /api/auth, /api/cart,           │
│          /api/checkout, /api/wishlist,               │
│          /api/ratings, /api/posts, /api/admin        │
└─────────────────────┬───────────────────────────────┘
                      │ SQL Queries
┌─────────────────────▼───────────────────────────────┐
│               DATABASE (PostgreSQL)                  │
│              Port 5454 (Docker)                      │
└─────────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────────┐
│          VNPay Sandbox Payment Gateway               │
│     sandbox.vnpayment.vn/paymentv2/vpcpay.html       │
└─────────────────────────────────────────────────────┘
```

---

### 5. KẾT QUẢ THỰC HIỆN

#### Đã hoàn thành:
- ✅ Hệ thống xác thực đầy đủ (đăng ký, đăng nhập, JWT, phân quyền)
- ✅ Giao diện Steam-style responsive, hỗ trợ đa thiết bị
- ✅ Cơ sở dữ liệu với hơn 100 game được seed từ Steam API
- ✅ Giỏ hàng thông minh (chặn thêm game đã sở hữu, chặn trùng lặp)
- ✅ Thanh toán VNPay tích hợp thật (sandbox), xử lý Return URL
- ✅ Hệ thống đánh giá game ràng buộc theo quyền sở hữu
- ✅ Trang cộng đồng với đăng bài, ảnh/video, like, bình luận
- ✅ Admin Dashboard với thống kê và quản lý dữ liệu
- ✅ Thư viện game cá nhân với UI Steam-like

#### Hạn chế & Hướng phát triển:
- Chưa triển khai lên môi trường production (hosting)
- MoMo/ZaloPay hiện ở dạng demo (chưa có merchant account)
- Chưa có hệ thống email thông báo đơn hàng
- Có thể mở rộng thêm chức năng: chat real-time, achievement, review screenshot

---

### 6. PHÂN CÔNG CÔNG VIỆC

| Thành viên | Mã SV | Vai trò | Công việc |
|------------|-------|---------|-----------|
| [Họ Tên]   | [MSV] | [Vai trò] | [Mô tả] |
| [Họ Tên]   | [MSV] | [Vai trò] | [Mô tả] |
| [Họ Tên]   | [MSV] | [Vai trò] | [Mô tả] |
| [Họ Tên]   | [MSV] | [Vai trò] | [Mô tả] |

---

*Báo cáo được thực hiện cho môn học: ______________________*
*Giảng viên hướng dẫn: ______________________*
*Năm học: 2025 – 2026*
