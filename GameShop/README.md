# GameNoob 🎮

> Hệ thống phân phối và quản lý game bản quyền trực tuyến  
> Đồ án môn Chuyên Đề Web — ĐH Nông Lâm TP.HCM

**Nhóm thực hiện:**
- Từ Châu Hoàng Thắng — 22130252
- Nguyễn Mạnh Hùng — 21130092

**GVHD:** ThS. Lê Phi Hùng

---

##  Công nghệ sử dụng

| Tầng | Công nghệ |
|---|---|
| Frontend | React 19 + Vite + React Router v7 |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Containerization | Docker Compose |

---

##  Cấu trúc dự án

```
GameShop/
├── backend/          # Node.js REST API
│   ├── controllers/  # Xử lý logic
│   ├── models/       # Truy vấn database
│   ├── routes/       # Định nghĩa API routes
│   ├── middleware/   # Auth middleware
│   └── configs/      # Cấu hình DB
├── frontend/         # React SPA
│   └── src/
│       ├── pages/    # Các trang chính
│       ├── components/ # UI components
│       ├── context/  # Global state
│       └── api/      # Axios API calls
├── database_export.sql  # Dữ liệu mẫu
└── docker-compose.yml
```

---

## Hướng dẫn cài đặt

### Yêu cầu
- Node.js >= 18
- PostgreSQL >= 14 (hoặc Docker)
- npm / yarn

---

### 1. Clone repository

```bash
git clone <repo-url>
cd GameShop
```

---

### 2. Khởi động Database

**Dùng Docker (khuyến nghị):**
```bash
docker-compose up -d
```

**Hoặc dùng PostgreSQL local:** Tạo database và import file `database_export.sql`.

---

### 3. Cấu hình Backend

```bash
cd backend
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=postgres_web
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_secret_key
```

Cài dependencies và chạy:
```bash
npm install
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

---

### 4. Cấu hình Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## API Endpoints

### Auth
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký |  |
| POST | `/api/auth/login` | Đăng nhập |  |
| GET | `/api/auth/me` | Lấy thông tin user | ✅ |
| PUT | `/api/auth/profile` | Cập nhật profile | ✅ |

### Games
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/games` | Danh sách game (có filter, sort, pagination) |
| GET | `/api/games/:id` | Chi tiết game |

### Cart
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/cart` | Lấy giỏ hàng |
| POST | `/api/cart/add` | Thêm vào giỏ |
| PUT | `/api/cart/:id` | Cập nhật số lượng |
| DELETE | `/api/cart/:id` | Xóa 1 item |
| DELETE | `/api/cart` | Xóa toàn bộ |

### Checkout
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/checkout/process` | Thanh toán bằng thẻ mới | ✅ |
| POST | `/api/checkout/saved-card` | Thanh toán bằng thẻ đã lưu | ✅ |
| POST | `/api/checkout/vnpay/create` | Tạo URL thanh toán VNPay | ✅ |
| GET | `/api/checkout/vnpay/return` | Xử lý kết quả trả về từ VNPay |  |
| GET | `/api/checkout/orders` | Lịch sử đơn hàng | ✅ |
| GET | `/api/checkout/library` | Thư viện game | ✅ |

### Wishlist
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/wishlist` | Danh sách wishlist | ✅ |
| POST | `/api/wishlist` | Thêm vào wishlist | ✅ |
| DELETE | `/api/wishlist/:gameId` | Xóa khỏi wishlist | ✅ |

### Community
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/posts` | Danh sách bài viết cộng đồng |  |
| POST | `/api/posts` | Tạo bài viết mới (kèm ảnh/video) | ✅ |
| PUT | `/api/posts/:postId` | Cập nhật bài viết | ✅ |
| DELETE | `/api/posts/:postId` | Xóa bài viết | ✅ |
| POST | `/api/posts/:postId/like` | Thích/Bỏ thích bài viết | ✅ |
| GET | `/api/posts/:postId/comments` | Lấy danh sách bình luận |  |
| POST | `/api/posts/:postId/comments` | Thêm bình luận | ✅ |
| PUT | `/api/posts/comments/:commentId` | Sửa bình luận | ✅ |
| DELETE | `/api/posts/comments/:commentId` | Xóa bình luận | ✅ |

---

## Tính năng

-  **Cửa hàng** — Duyệt game theo thể loại, tìm kiếm, sort, phân trang
-  **Chi tiết game** — Xem trailer, ảnh, cấu hình, thông tin
-  **Giỏ hàng** — Thêm/xóa, thanh toán với thẻ ngân hàng
-  **Wishlist** — Lưu game muốn mua
- — Game đã mua, install/uninstall giả lập
- — Đổi username, đổi mật khẩu
-  **Auth** — JWT, Protected Routes, auto-redirect

---

## Kiểm tra nhanh

```bash
# Health check
curl http://localhost:5000/api/health
# → {"status":"ok","message":"GameNoob API is running!"}
```
